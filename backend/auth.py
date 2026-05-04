"""Telegram WebApp initData validation (HMAC-SHA256 over sorted query string).

Reference:
https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
"""
import hmac
import hashlib
import json
from urllib.parse import parse_qsl
from fastapi import Header, HTTPException, status
from .config import BOT_TOKEN, REQUIRE_TELEGRAM_AUTH


def _check_init_data(init_data: str) -> dict:
    """Validate raw initData string. Returns parsed user info on success."""
    if not BOT_TOKEN:
        raise HTTPException(status_code=500, detail="BOT_TOKEN not configured")

    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=401, detail="initData: hash missing")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(received_hash, computed_hash):
        raise HTTPException(status_code=401, detail="initData: hash mismatch")

    user_raw = parsed.get("user")
    if not user_raw:
        raise HTTPException(status_code=401, detail="initData: user missing")
    try:
        return json.loads(user_raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=401, detail="initData: user not JSON")


async def get_tg_user(
    x_init_data: str | None = Header(default=None, alias="X-Init-Data"),
) -> dict:
    """FastAPI dependency. Returns Telegram user dict or raises 401.
    In dev (REQUIRE_TELEGRAM_AUTH=0) returns a fake user so we can curl freely."""
    if not REQUIRE_TELEGRAM_AUTH:
        return {"id": 0, "first_name": "dev", "username": "dev", "_dev_mode": True}

    if not x_init_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Init-Data header missing",
        )
    return _check_init_data(x_init_data)
