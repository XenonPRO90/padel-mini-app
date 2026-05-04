"""Tiny Telegram bot for @PadelMastersDev_bot.

Only purpose: greet new users on /start with a description of what the bot
does and what the Mini App is for. The Mini App itself is opened via the
menu button next to the message field (configured in BotFather), not via
buttons in this file. We keep the bot lean — all real logic lives in the
Mini App backend.
"""
import asyncio
import logging
import os

from aiogram import Bot, Dispatcher
from aiogram.filters import Command
from aiogram.types import Message
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties

logging.basicConfig(level=logging.INFO)

BOT_TOKEN = os.environ["BOT_TOKEN"]
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://padel-mini-app-mu.vercel.app/")

WELCOME = """🎾 *PADEL CLAUB*

Это бот\\-помощник для проведения турниров по падел в формате *King of the Court*\\.

*Что умеет:*
• Создавать турниры с любым числом игроков и кортов
• Автоматически формировать пары по умному алгоритму:
  ▸ B\\+ всегда играет с самым слабым на корте
  ▸ Партнёр меняется каждый раунд
  ▸ Не ставит двух правшей или двух левшей в одну пару
  ▸ Балансирует уровни команд
• Записывать результаты матчей в одно касание
• Считать лидерборд и хранить историю турниров

*Как начать:*
Нажми кнопку *Управление* слева от поля ввода — откроется приложение, где можно вести турнир\\.
"""

bot = Bot(
    token=BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN_V2),
)
dp = Dispatcher()


@dp.message(Command("start"))
async def cmd_start(message: Message):
    await message.answer(WELCOME)


@dp.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(WELCOME)


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
