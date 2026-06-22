"""Lambda handler for resolving short links and recording click analytics."""

from __future__ import annotations

import logging
import os
from typing import Any

import boto3
from botocore.exceptions import ClientError

from shared.utils import CORS_HEADERS, api_response, country_from_ip, parse_user_agent, utc_now

LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)
DYNAMODB = boto3.resource("dynamodb")
URLS_TABLE = DYNAMODB.Table(os.environ["URLS_TABLE_NAME"])
CLICKS_TABLE = DYNAMODB.Table(os.environ["CLICKS_TABLE_NAME"])


def _normalise_headers(event: dict[str, Any]) -> dict[str, str]:
    """Return request headers with lower-case keys and string values."""
    return {str(key).lower(): str(value) for key, value in (event.get("headers") or {}).items()}


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Resolve a shortcode, record the visit, and issue a permanent redirect."""
    del context
    shortcode = (event.get("pathParameters") or {}).get("shortcode") or (event.get("pathParameters") or {}).get("code")
    if not shortcode:
        return api_response(400, {"error": "Shortcode is required."})

    try:
        result = URLS_TABLE.get_item(Key={"shortcode": shortcode}, ConsistentRead=True)
    except ClientError:
        LOGGER.exception("Failed to read shortcode %s from DynamoDB", shortcode)
        return api_response(500, {"error": "Unable to resolve short URL."})

    url_record = result.get("Item")
    if not url_record:
        return api_response(404, {"error": "Short URL not found."})

    headers = _normalise_headers(event)
    user_agent = headers.get("user-agent", "")
    device, browser = parse_user_agent(user_agent)
    forwarded_for = headers.get("x-forwarded-for", "")
    source_ip = forwarded_for.split(",", 1)[0].strip()
    if not source_ip:
        source_ip = ((event.get("requestContext") or {}).get("http") or {}).get("sourceIp", "")
    timestamp = utc_now()
    click = {
        "shortcode": shortcode,
        "timestamp": timestamp,
        "country": country_from_ip(source_ip),
        "device": device,
        "browser": browser,
        "referrer": headers.get("referer", "Direct") or "Direct",
    }

    try:
        CLICKS_TABLE.put_item(Item=click)
    except ClientError:
        LOGGER.exception("Failed to write click event for %s", shortcode)

    try:
        URLS_TABLE.update_item(
            Key={"shortcode": shortcode},
            UpdateExpression="ADD click_count :one",
            ExpressionAttributeValues={":one": 1},
        )
    except ClientError:
        LOGGER.exception("Failed to increment click count for %s", shortcode)

    LOGGER.info("Redirecting shortcode %s", shortcode)
    return {
        "statusCode": 301,
        "headers": {
            "Location": url_record["original_url"],
            "Cache-Control": "no-store",
            **CORS_HEADERS,
        },
        "body": "",
    }

