"""Tiny Telegram bot for @PadelMasters_bot / @PadelMastersDev_bot.

Only purpose: greet new users on /start with a description of what the
bot does and what the Mini App is for. The Mini App itself is opened
via the menu button next to the message field (configured in BotFather),
not via buttons in this file. We keep the bot lean — all real logic
lives in the Mini App backend.
"""
import asyncio
import html
import logging
import os
from datetime import datetime
from pathlib import Path

import aiosqlite
from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandObject, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    BotCommand,
    FSInputFile,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
)

logging.basicConfig(level=logging.INFO)

BOT_TOKEN = os.environ["BOT_TOKEN"]
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://padel-mini-app-mu.vercel.app/")
DB_PATH = os.getenv("DB_PATH", "/home/ubuntu/padel-mini-app/padel-dev.db")
# Where «Предложить идею» / «Сообщить о баге» land — Roman's DM by default.
# The recipient must have pressed Start in this bot, or Telegram refuses.
FEEDBACK_CHAT_ID = int(os.getenv("FEEDBACK_CHAT_ID", "24062910"))

# Landscape welcome banner ("WELCOME TO PADEL CLUB" with crown+rackets,
# corner ornaments, gold rule, italic tagline). Lives in frontend/assets/
# and is tracked in the repo. Resolved relative to this file so the
# image follows the bot regardless of WorkingDirectory.
BRAND = os.getenv("BRAND", "padel")

# The padel welcome banner is gold serif reading "WELCOME TO PADEL CLUB", so it
# belongs to that brand only. Other brands fall back to a text-only welcome
# until they have artwork of their own.
WELCOME_IMAGE_PATH = (
    Path(__file__).resolve().parent.parent / "assets" / "padel-club-welcome.png"
    if BRAND == "padel" else Path("/nonexistent")
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

FCE_WELCOME = (
    "<b>FCE PADEL</b>\n"
    "<i>Corporate padel &amp; league</i>\n"
    "\n"
    "Приложение лиги: турниры, результаты и личная статистика "
    "каждого участника.\n"
    "\n"
    "<b>Для игроков:</b>\n"
    "• личный кабинет — турниры, победы, % побед, серии\n"
    "• места и медали за призовые\n"
    "• рейтинг и уровень, который растёт по результатам\n"
    "\n"
    "<b>Форматы:</b>\n"
    "• <b>King of the Court</b> — пары меняются каждый раунд\n"
    "• <b>Team Americano</b> — каждая пара играет с каждой\n"
    "• <b>Mini Tournament</b> — 8 команд, группы + плей-офф\n"
    "\n"
    "Открой <b>«Управление»</b> слева от поля ввода, чтобы начать."
)

if BRAND == "fce":
    WELCOME = FCE_WELCOME

# ─── Info buttons under the welcome (padel brand only) ─────────────────────
# The ELO copy mirrors recompute_club_elo() in backend/queries.py — keep the
# two in sync if Liza retunes the engine.
ELO_INFO = (
    "📊 <b>Как работает рейтинг ELO</b>\n"
    "\n"
    "Рейтинг — твой уровень в цифрах. Он пересчитывается после каждого "
    "турнира по всем сыгранным матчам.\n"
    "\n"
    "<b>С чего начинаешь</b>\n"
    "Стартовый рейтинг — твой уровень при вступлении в клуб:\n"
    "D 1.0 · D+ 1.5 · D+ strong 2.0 · C- 2.5 · C- strong 3.0 · C 3.5 · "
    "C+ 4.0 · B 5.0 · B+ 6.0 · A 7.0 · A+ 8.0\n"
    "\n"
    "<b>Как меняется</b>\n"
    "• Важен счёт, а не только победа: 6:4 — это 60% геймов в твою пользу.\n"
    "• Учитывается сила соперников: сравнивается средний рейтинг твоей пары "
    "и пары напротив. Обыграл более сильных — рейтинг растёт заметно, "
    "уступил сильным — теряешь немного.\n"
    "• Сыграл ровно так, как ожидалось по силам, — рейтинг почти не меняется.\n"
    "• Шаг небольшой: матч сдвигает рейтинг на сотые, уровень растёт "
    "за серию хороших турниров.\n"
    "• Ниже своего уровня больше чем на одну ступень не опустишься.\n"
    "\n"
    "<b>Что не идёт в рейтинг</b>\n"
    "Товарищеские игры и матчи с участием тренера.\n"
    "\n"
    "<b>Калибровка и новый уровень</b>\n"
    "Первые 3 турнира — калибровка: в рейтинге клуба ты стоишь внизу списка, "
    "пока рейтинг уточняется.\n"
    "Уровень определяется порогом: C — от 3.5, C+ — от 4.0, B — от 5.0 и т.д. "
    "Когда рейтинг дошёл до порога, организатор может подтвердить новый уровень."
)

FEEDBACK_KINDS = {
    "idea": ("💡", "Идея", "Напиши свою идею одним сообщением — что добавить или улучшить."),
    "bug": ("🐞", "Баг", "Опиши, что пошло не так, одним сообщением. Можно приложить скриншот."),
}


class Feedback(StatesGroup):
    waiting = State()


# Persistent reply keyboard under the message field (not attached to a message).
# Pressing a button sends its text, which the handlers below match on.
BTN_ELO = "📊 Рейтинг ELO"
BTN_IDEA = "💡 Предложить идею"
BTN_BUG = "🐞 Сообщить о баге"


def info_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=BTN_ELO)],
            [KeyboardButton(text=BTN_IDEA), KeyboardButton(text=BTN_BUG)],
        ],
        resize_keyboard=True,
        is_persistent=True,
    )


def welcome_markup() -> ReplyKeyboardMarkup | None:
    return info_keyboard() if BRAND == "padel" else None

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
                reply_markup=welcome_markup(),
            )
            return
        except Exception as e:
            logging.warning("send_photo failed, falling back to text: %s", e)
    await message.answer(WELCOME, parse_mode=ParseMode.HTML, reply_markup=welcome_markup())


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


async def ask_feedback(message: Message, state: FSMContext, kind: str) -> None:
    await state.set_state(Feedback.waiting)
    await state.update_data(kind=kind)
    await message.answer(
        FEEDBACK_KINDS[kind][2] + "\n\nПередумал — /cancel",
        parse_mode=ParseMode.HTML,
    )


@dp.message(Command("start"))
async def cmd_start(message: Message, command: CommandObject, state: FSMContext):
    await state.clear()
    args = command.args or ""
    if args.startswith("bind_"):
        await handle_bind(message, args[len("bind_"):])
        return
    await send_welcome(message)


@dp.message(Command("help"))
async def cmd_help(message: Message, state: FSMContext):
    await state.clear()
    await send_welcome(message)


@dp.message(Command("elo"))
async def cmd_elo(message: Message, state: FSMContext):
    await state.clear()
    await message.answer(ELO_INFO, parse_mode=ParseMode.HTML)


@dp.message(Command("idea", "bug"))
async def cmd_feedback(message: Message, command: CommandObject, state: FSMContext):
    await ask_feedback(message, state, command.command)


@dp.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext):
    await state.clear()
    await message.answer("Ок, отменил.", parse_mode=ParseMode.HTML)


# Registered before receive_feedback so a button press while the bot waits
# for feedback switches action instead of being forwarded as the feedback.
@dp.message(F.text == BTN_ELO)
async def btn_elo(message: Message, state: FSMContext):
    await state.clear()
    await message.answer(ELO_INFO, parse_mode=ParseMode.HTML)


@dp.message(F.text.in_({BTN_IDEA, BTN_BUG}))
async def btn_feedback(message: Message, state: FSMContext):
    await ask_feedback(message, state, "idea" if message.text == BTN_IDEA else "bug")


@dp.message(StateFilter(Feedback.waiting))
async def receive_feedback(message: Message, state: FSMContext):
    """Forward whatever the player sent (text, screenshot, video) to the
    feedback chat with a header saying who it is from."""
    kind = (await state.get_data()).get("kind", "idea")
    await state.clear()
    icon, label, _ = FEEDBACK_KINDS[kind]
    u = message.from_user
    who = html.escape(u.full_name) + (f" (@{u.username})" if u.username else "")
    try:
        await bot.send_message(
            FEEDBACK_CHAT_ID,
            f"{icon} <b>{label}</b> от {who}, id <code>{u.id}</code>",
            parse_mode=ParseMode.HTML,
        )
        await message.copy_to(FEEDBACK_CHAT_ID)
    except Exception as e:
        logging.warning("feedback forward failed: %s", e)
        await message.answer("Не получилось отправить, попробуй чуть позже.", parse_mode=ParseMode.HTML)
        return
    await message.answer("Спасибо! Передал разработчику 🙌", parse_mode=ParseMode.HTML)


async def main():
    if BRAND == "padel":
        await bot.set_my_commands([
            BotCommand(command="start", description="Приветствие и меню"),
            BotCommand(command="elo", description="Как работает рейтинг ELO"),
            BotCommand(command="idea", description="Предложить идею"),
            BotCommand(command="bug", description="Сообщить о баге"),
        ])
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
