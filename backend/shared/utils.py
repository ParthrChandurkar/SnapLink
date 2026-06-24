"""Utility functions shared by the SnapLink Lambda handlers."""

from __future__ import annotations

import ipaddress
import json
import logging
import os
import re
import secrets
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

LOGGER = logging.getLogger(__name__)
BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
SHORTCODE_LENGTH = 6
URL_PATTERN = re.compile(r"^https?://", re.IGNORECASE)

CORS_HEADERS = {
    "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
}


def api_response(status_code: int, body: dict[str, Any]) -> dict[str, Any]:
    """Create a JSON API Gateway response with consistent CORS headers."""
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json", **CORS_HEADERS},
        "body": json.dumps(body),
    }


def base62_encode(number: int) -> str:
    """Encode a non-negative integer using the base62 alphabet."""
    if number == 0:
        return BASE62_ALPHABET[0]

    encoded = []
    while number:
        number, remainder = divmod(number, len(BASE62_ALPHABET))
        encoded.append(BASE62_ALPHABET[remainder])
    return "".join(reversed(encoded))


def generate_shortcode(length: int = SHORTCODE_LENGTH) -> str:
    """Generate a cryptographically random, fixed-width base62 shortcode."""
    space = len(BASE62_ALPHABET) ** length
    return base62_encode(secrets.randbelow(space)).rjust(length, BASE62_ALPHABET[0])


def is_valid_url(value: Any) -> bool:
    """Return whether a value is a safe, absolute HTTP or HTTPS URL."""
    if not isinstance(value, str) or len(value) > 2048 or not URL_PATTERN.match(value):
        return False
    try:
        parsed = urlparse(value)
        return bool(parsed.hostname) and parsed.scheme.lower() in {"http", "https"}
    except ValueError:
        return False


def utc_now() -> str:
    """Return a timezone-aware UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat(timespec="microseconds").replace("+00:00", "Z")


def parse_user_agent(user_agent: str) -> tuple[str, str]:
    """Infer a coarse device category and browser from a User-Agent string."""
    value = user_agent.lower()
    if any(token in value for token in ("bot", "crawler", "spider", "slurp")):
        device = "Bot"
    elif any(token in value for token in ("ipad", "tablet", "kindle")):
        device = "Tablet"
    elif any(token in value for token in ("mobile", "iphone", "android")):
        device = "Mobile"
    else:
        device = "Desktop"

    if "edg/" in value:
        browser = "Edge"
    elif "opr/" in value or "opera" in value:
        browser = "Opera"
    elif "chrome/" in value and "chromium" not in value:
        browser = "Chrome"
    elif "safari/" in value and "chrome/" not in value:
        browser = "Safari"
    elif "firefox/" in value:
        browser = "Firefox"
    else:
        browser = "Other"
    return device, browser


def client_ip_from_event(event: dict[str, Any], headers: dict[str, str]) -> str:
    """Extract the best client IP candidate from proxy and API Gateway metadata."""
    forwarded_for = headers.get("x-forwarded-for", "")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()

    viewer_address = headers.get("cloudfront-viewer-address", "")
    if viewer_address:
        return viewer_address.split(":", 1)[0].strip()

    return str(((event.get("requestContext") or {}).get("http") or {}).get("sourceIp", "")).strip()


def normalise_referrer(value: str) -> str:
    """Reduce a referrer to a stable hostname-sized value for analytics storage."""
    if not isinstance(value, str) or not value.strip():
        return "Direct"

    candidate = value.strip()
    try:
        parsed = urlparse(candidate)
    except ValueError:
        return candidate[:255] or "Direct"

    if parsed.scheme.lower() in {"http", "https"} and parsed.netloc:
        return parsed.netloc.lower()[:255]
    return candidate[:255] or "Direct"


def country_from_ip(ip_address: str) -> str:
    """Resolve an IP address to a country code through the configured geo API."""
    candidate = ip_address.strip()
    try:
        ip = ipaddress.ip_address(candidate)
        if ip.is_private or ip.is_loopback or ip.is_reserved:
            return "Unknown"
    except ValueError:
        return "Unknown"

    base_url = os.environ.get("GEOLOCATION_API_URL", "http://ip-api.com/json")
    fields = "status,countryCode"
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}/{candidate}?fields={fields}",
        headers={"User-Agent": "SnapLink/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=2) as response:
            payload = json.loads(response.read().decode("utf-8"))
            if payload.get("status") == "success":
                return payload.get("countryCode") or "Unknown"
    except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError):
        LOGGER.warning("Geolocation lookup failed", exc_info=True)
    return "Unknown"
