"""DB helpers — thin async wrappers over aiosqlite.
Mirrors the conventions used in /home/ubuntu/padel-bot/db/queries.py
so the bot's logic stays the source of truth."""
import aiosqlite
from contextlib import asynccontextmanager
from .config import DB_PATH


@asynccontextmanager
async def conn():
    """Async context manager yielding an aiosqlite connection with row_factory."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON")
        yield db


def row_to_dict(row):
    return dict(row) if row else None


def rows_to_list(rows):
    return [dict(r) for r in rows]
