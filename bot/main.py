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
from pathlib import Path

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.types import FSInputFile, Message

logging.basicConfig(level=logging.INFO)

BOT_TOKEN = os.environ["BOT_TOKEN"]
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://padel-mini-app-mu.vercel.app/")

# Cream/gold logo lives in frontend/assets/ and is tracked in the repo.
# Resolve relative to this file so it survives WorkingDirectory changes.
LOGO_PATH = Path(__file__).resolve().parent.parent / "assets" / "padel-club-logo.png"

# MarkdownV2 — these chars must be escaped where they appear as literals:
# _ * [ ] ( ) ~ ` > # + - = | { } . !
# Headings / labels use *bold*, soft accents use _italic_, paragraphs are
# separated by blank lines so the welcome reads more like a card than a wall.
WELCOME = (
    "🎾 *PADEL CLUB*\n"
    "_Tournaments, made elegant\\._\n"
    "\n"
    "Помощник для проведения турниров по падел в формате "
    "*King of the Court*\\. Создаёшь турнир — бот сам тасует пары "
    "по уровням и сторонам, ты только записываешь результаты\\.\n"
    "\n"
    "*Что внутри:*\n"
    "• умный алгоритм пар \\(B\\+ играет с самым слабым, партнёр "
    "меняется каждый раунд, не сводит двух правшей или двух левшей\\)\n"
    "• режим *fixed pairs* — для турниров с постоянными парами\n"
    "• запись результата в один тап\n"
    "• лидерборд, история, расписание и финальный постер для шеринга\n"
    "\n"
    "*Как начать:*\n"
    "Тапни *Управление* слева от поля ввода — откроется Mini App, где "
    "ведёшь турнир от создания до финального постера\\."
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
    if LOGO_PATH.exists():
        try:
            await message.answer_photo(
                photo=FSInputFile(LOGO_PATH),
                caption=WELCOME,
            )
            return
        except Exception as e:
            logging.warning("send_photo failed, falling back to text: %s", e)
    await message.answer(WELCOME)


@dp.message(Command("start"))
async def cmd_start(message: Message):
    await send_welcome(message)


@dp.message(Command("help"))
async def cmd_help(message: Message):
    await send_welcome(message)


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
