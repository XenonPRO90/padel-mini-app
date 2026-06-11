"""Tiny Telegram bot for @PadelMasters_bot / @PadelMastersDev_bot.

Only purpose: greet new users on /start with a description of what the
bot does and what the Mini App is for. The Mini App itself is opened
via the menu button next to the message field (configured in BotFather),
not via buttons in this file. We keep the bot lean — all real logic
lives in the Mini App backend.
"""
import asyncio
import logging
import os
from datetime import datetime
from pathlib import Path

import aiosqlite
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandObject
from aiogram.types import FSInputFile, Message

logging.basicConfig(level=logging.INFO)

BOT_TOKEN = os.environ["BOT_TOKEN"]
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://padel-mini-app-mu.vercel.app/")
DB_PATH = os.getenv("DB_PATH", "/home/ubuntu/padel-mini-app/padel-dev.db")

# Landscape welcome banner ("WELCOME TO PADEL CLUB" with crown+rackets,
# corner ornaments, gold rule, italic tagline). Lives in frontend/assets/
# and is tracked in the repo. Resolved relative to this file so the
# image follows the bot regardless of WorkingDirectory.
WELCOME_IMAGE_PATH = (
    Path(__file__).resolve().parent.parent / "assets" / "padel-club-welcome.png"
)

# HTML parse mode (passed per-message in send_welcome) — only < > & need escaping,
# none of which appear here, so the copy stays readable.
WELCOME = (
    "🎾 <b>PADEL CLUB</b>\n"
    "<i>Турниры и личная статистика</i>\n"
    "\n"
    "Клубное приложение по падел: интересные турниры, история игр "
    "и личный кабинет у каждого участника.\n"
    "\n"
    "<b>Для игроков:</b>\n"
    "• личный кабинет со статистикой — турниры, победы, % побед, серии\n"
    "• места и медали за призовые места и победы\n"
    "• накопительная статистика и достижения за всё время\n"
    "• профиль с твоим уровнем и ракеткой\n"
    "\n"
    "<b>Форматы турниров:</b>\n"
    "• <b>King of the Court</b> — пары меняются каждый раунд\n"
    "• <b>Team Americano</b> — каждая пара играет с каждой\n"
    "• <b>Mini Tournament</b> — 8 команд, группы + плей-офф\n"
    "\n"
    "<b>Как попасть в клуб:</b>\n"
    "Открой «Управление» слева от поля ввода и <b>подай заявку</b> — "
    "организатор подтвердит, и откроется твой личный кабинет. "
    "Если тебе прислали ссылку-приглашение — просто перейди по ней."
)

bot = Bot(
    token=BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN_V2),
)
dp = Dispatcher()


async def send_welcome(message: Message) -> None:
    """Send the welcome card — photo with caption if the logo is on disk,
    plain message otherwise. Telegram caps caption at 1024 chars, the
    WELCOME text fits comfortably."""
    if WELCOME_IMAGE_PATH.exists():
        try:
            await message.answer_photo(
                photo=FSInputFile(WELCOME_IMAGE_PATH),
                caption=WELCOME,
                parse_mode=ParseMode.HTML,
            )
            return
        except Exception as e:
            logging.warning("send_photo failed, falling back to text: %s", e)
    await message.answer(WELCOME, parse_mode=ParseMode.HTML)


async def handle_bind(message: Message, token: str) -> None:
    """Redeem a `?start=bind_<token>` invite: link this Telegram account to the
    invited player row. Plain-text replies (HTML mode) so no MarkdownV2 escaping."""
    html = ParseMode.HTML
    tg = message.from_user.id
    uname = message.from_user.username
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT * FROM player_invites WHERE token=?", (token,))
        inv = await cur.fetchone()
        if not inv or inv["used_at"] is not None:
            await message.answer("Ссылка недействительна или уже использована. Попроси администратора прислать новую.", parse_mode=html)
            return
        try:
            if datetime.utcnow() > datetime.strptime(inv["expires_at"], "%Y-%m-%d %H:%M:%S"):
                await message.answer("Срок действия ссылки истёк. Попроси администратора новую.", parse_mode=html)
                return
        except Exception:
            pass

        cur = await db.execute("SELECT id FROM players WHERE telegram_id=?", (tg,))
        existing = await cur.fetchone()
        if existing and existing["id"] != inv["player_id"]:
            await message.answer("Твой Telegram уже привязан к другому профилю.", parse_mode=html)
            return
        cur = await db.execute("SELECT name, telegram_id FROM players WHERE id=?", (inv["player_id"],))
        target = await cur.fetchone()
        if not target:
            await message.answer("Профиль не найден. Обратись к администратору.", parse_mode=html)
            return
        if target["telegram_id"] and target["telegram_id"] != tg:
            await message.answer("Этот профиль уже занят другим аккаунтом.", parse_mode=html)
            return

        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        await db.execute("UPDATE players SET telegram_id=?, username=? WHERE id=?", (tg, uname, inv["player_id"]))
        await db.execute("UPDATE player_invites SET used_at=?, used_by_tg=? WHERE token=?", (now, tg, token))
        await db.commit()

    await message.answer(
        f"Готово, {target['name']}! Твой профиль привязан ✅\n"
        "Открой приложение кнопкой «Управление» слева от поля ввода — там твой личный кабинет.",
        parse_mode=html,
    )


@dp.message(Command("start"))
async def cmd_start(message: Message, command: CommandObject):
    args = command.args or ""
    if args.startswith("bind_"):
        await handle_bind(message, args[len("bind_"):])
        return
    await send_welcome(message)


@dp.message(Command("help"))
async def cmd_help(message: Message):
    await send_welcome(message)


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
