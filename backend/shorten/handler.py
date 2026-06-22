"""Lambda handler for creating SnapLink short URLs."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import boto3
from botocore.exceptions import ClientError

from shared.utils import api_response, generate_shortcode, is_valid_url, utc_now

LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)
DYNAMODB = boto3.resource("dynamodb")
URLS_TABLE = DYNAMODB.Table(os.environ["URLS_TABLE_NAME"])
MAX_COLLISION_RETRIES = 8


def _request_body(event: dict[str, Any]) -> dict[str, Any] | None:
    """Decode and validate the API Gateway JSON request body."""
    try:
        body = event.get("body") or "{}"
        return json.loads(body) if isinstance(body, str) else body
    except (TypeError, json.JSONDecodeError):
        return None


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Validate a URL, persist a unique shortcode, and return its short URL."""
    del context
    body = _request_body(event)
    original_url = body.get("url") if isinstance(body, dict) else None
    if not is_valid_url(original_url):
        return api_response(400, {"error": "A valid http or https URL is required."})

    for _ in range(MAX_COLLISION_RETRIES):
        shortcode = generate_shortcode()
        item = {
            "shortcode": shortcode,
            "original_url": original_url.strip(),
            "created_at": utc_now(),
            "click_count": 0,
        }
        try:
            URLS_TABLE.put_item(
                Item=item,
                ConditionExpression="attribute_not_exists(shortcode)",
            )
            base_url = os.environ.get("SHORT_BASE_URL", "").rstrip("/")
            if not base_url:
                request_context = event.get("requestContext") or {}
                domain = request_context.get("domainName")
                stage = request_context.get("stage")
                stage_path = f"/{stage}" if stage and stage != "$default" else ""
                base_url = f"https://{domain}{stage_path}" if domain else "https://snaplink.com"
            LOGGER.info("Created shortcode %s", shortcode)
            return api_response(
                201,
                {
                    "shortcode": shortcode,
                    "short_url": f"{base_url}/{shortcode}",
                    "original_url": item["original_url"],
                    "created_at": item["created_at"],
                },
            )
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
                LOGGER.warning("Shortcode collision detected; retrying")
                continue
            LOGGER.exception("Failed to write URL to DynamoDB")
            return api_response(500, {"error": "Unable to create short URL."})

    LOGGER.error("Exhausted shortcode collision retries")
    return api_response(503, {"error": "Unable to allocate a shortcode. Please retry."})
