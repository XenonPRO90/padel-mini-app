"""Backend config — env-driven, with safe defaults for local dev."""
import os
from pathlib import Path

ROOT = Path(__file__).parent.parent  # padel-mini-app/frontend/

# DB path — points at the sandbox copy by default. Override via env when
# we want to flip to prod DB later.
DB_PATH = os.getenv("DB_PATH", "/home/ubuntu/padel-mini-app/padel-dev.db")

# Telegram bot token — used to validate WebApp initData (HMAC-SHA256).
# In dev we keep it in .env at /home/ubuntu/padel-mini-app/.env (not committed).
BOT_TOKEN = os.getenv("BOT_TOKEN", "")

# Vercel/preview URLs that are allowed to hit the API. Comma-separated env.
# In dev we open localhost too.
CORS_ORIGINS = [
    o.strip() for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,"
        "http://127.0.0.1:5173,"
        "https://web.telegram.org,"
        "https://padel-mini-app.vercel.app",
    ).split(",") if o.strip()
]
# Vercel previews change URL on every PR (e.g. padel-mini-app-git-feat-xyz.vercel.app)
# so we also allow any subdomain via regex. FastAPI's CORSMiddleware supports it via
# allow_origin_regex. Used in main.py.
CORS_ORIGIN_REGEX = os.getenv(
    "CORS_ORIGIN_REGEX",
    r"https://padel-mini-app(-[a-z0-9-]+)?\.vercel\.app",
)

# Validate Telegram initData. Disabled in dev so we can hit endpoints from
# curl/browser without a real Telegram session. In production set to "1".
REQUIRE_TELEGRAM_AUTH = os.getenv("REQUIRE_TELEGRAM_AUTH", "0") == "1"
