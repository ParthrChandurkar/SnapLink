"""Lambda handler for returning aggregated click analytics."""

from __future__ import annotations

import logging
import os
from collections import Counter
from decimal import Decimal
from typing import Any

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from shared.utils import api_response

LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)
DYNAMODB = boto3.resource("dynamodb")
URLS_TABLE = DYNAMODB.Table(os.environ["URLS_TABLE_NAME"])
CLICKS_TABLE = DYNAMODB.Table(os.environ["CLICKS_TABLE_NAME"])


def _query_all_clicks(shortcode: str) -> list[dict[str, Any]]:
    """Query every click event for a shortcode, following pagination tokens."""
    items: list[dict[str, Any]] = []
    kwargs: dict[str, Any] = {"KeyConditionExpression": Key("shortcode").eq(shortcode)}
    while True:
        response = CLICKS_TABLE.query(**kwargs)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            return items
        kwargs["ExclusiveStartKey"] = last_key


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Return summary statistics and chart-ready series for one short link."""
    del context
    shortcode = (event.get("pathParameters") or {}).get("shortcode")
    if not shortcode:
        return api_response(400, {"error": "Shortcode is required."})

    try:
        url_response = URLS_TABLE.get_item(Key={"shortcode": shortcode}, ConsistentRead=True)
    except ClientError:
        LOGGER.exception("Failed to read URL analytics metadata for %s", shortcode)
        return api_response(500, {"error": "Unable to load analytics."})

    record = url_response.get("Item")
    if not record:
        return api_response(404, {"error": "Short URL not found."})

    try:
        clicks = _query_all_clicks(shortcode)
    except ClientError:
        LOGGER.exception("Failed to query clicks for %s", shortcode)
        return api_response(500, {"error": "Unable to load analytics."})

    countries = Counter(click.get("country", "Unknown") for click in clicks)
    devices = Counter(click.get("device", "Unknown") for click in clicks)
    browsers = Counter(click.get("browser", "Other") for click in clicks)
    daily = Counter(str(click.get("timestamp", ""))[:10] for click in clicks if click.get("timestamp"))
    total_clicks = int(record.get("click_count", Decimal(0)))

    return api_response(
        200,
        {
            "shortcode": shortcode,
            "original_url": record["original_url"],
            "created_at": record["created_at"],
            "total_links": 1,
            "total_clicks": total_clicks,
            "top_country": countries.most_common(1)[0][0] if countries else "—",
            "top_device": devices.most_common(1)[0][0] if devices else "—",
            "clicks_over_time": [
                {"date": date, "clicks": count} for date, count in sorted(daily.items())
            ],
            "clicks_by_country": [
                {"country": country, "clicks": count} for country, count in countries.most_common()
            ],
            "devices": [
                {"device": device, "clicks": count} for device, count in devices.most_common()
            ],
            "browsers": [
                {"browser": browser, "clicks": count} for browser, count in browsers.most_common()
            ],
        },
    )

