"""Telegram WebApp initData validation (HMAC-SHA256 over sorted query string).

Reference:
https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
"""
import hmac
import hashlib
import json
import sys
from urllib.parse import parse_qsl
from fastapi import Header, HTTPException, status
from .config import BOT_TOKEN, REQUIRE_TELEGRAM_AUTH


def _hmac_hash(items) -> str:
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(items))
    secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    return hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()


def _check_init_data(init_data: str) -> dict:
    """Validate raw initData string. Returns parsed user info on success."""
    if not BOT_TOKEN:
        raise HTTPException(status_code=500, detail="BOT_TOKEN not configured")

    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=401, detail="initData: hash missing")

    # Newer Telegram clients add a `signature` field (Ed25519 3rd-party check).
    # The HMAC `hash` is canonically over all fields except `hash`, but accept a
    # `signature`-excluded variant too for client/version differences.
    items = list(parsed.items())
    full = _hmac_hash(items)
    nosig = _hmac_hash([(k, v) for k, v in items if k != "signature"])
    ok = hmac.compare_digest(received_hash, full) or hmac.compare_digest(received_hash, nosig)
    print(
        f"[auth] keys={sorted(parsed)} match_full={hmac.compare_digest(received_hash, full)} "
        f"match_nosig={hmac.compare_digest(received_hash, nosig)} ok={ok}",
        file=sys.stderr, flush=True,
    )
    if not ok:
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
