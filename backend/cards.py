# -*- coding: utf-8 -*-
"""Phase 4 — post-tournament congratulation cards.

Server-side render: build HTML in the club's visual language (tokens / ELogo /
EMedal / corners), screenshot to PNG via the node Playwright CLI, send to each
linked player's Telegram via aiohttp sendPhoto. No client rendering.
"""
import os
import base64
import asyncio
import tempfile
import urllib.request

import aiofiles
import aiohttp

from .config import BOT_TOKEN

FRONTEND_DIR = "/home/ubuntu/padel-mini-app/frontend"
_RENDER_SEM = asyncio.Semaphore(3)  # cap concurrent chrome instances

# ── tokens (mirror of src/lib/tokens.ts) ────────────────────────────────
CREAM = "#f5efe4"; CREAM2 = "#ede4d2"; PAPER = "#fbf7ee"; PAPEREDGE = "#e7dcc4"
GOLD = "#a6864d"; GOLDDEEP = "#8a6a35"; RULE = "#c9b48a"
EMER = "#2f4a3a"; EMERDEEP = "#1d3327"; INK = "#1f2a24"; MUTED = "#7a7062"
DISP = "'Playfair Display','Cormorant Garamond',Georgia,serif"
SERIF = "'Cormorant Garamond','Playfair Display',Georgia,serif"


def _elogo(size, color=GOLD):
    return f'''<svg width="{size}" height="{size}" viewBox="0 0 100 100" fill="none" style="display:block">
<g stroke="{color}" stroke-width="1.5" fill="none" stroke-linejoin="round">
<path d="M40 20 L42 12 L46 18 L50 10 L54 18 L58 12 L60 20 Z"/>
<circle cx="42" cy="11" r="0.8" fill="{color}"/><circle cx="50" cy="9" r="0.8" fill="{color}"/><circle cx="58" cy="11" r="0.8" fill="{color}"/></g>
<g stroke="{color}" stroke-width="1.6" fill="none">
<ellipse cx="36" cy="44" rx="14" ry="17" transform="rotate(-22 36 44)"/>
<line x1="44" y1="58" x2="58" y2="84" stroke-linecap="round"/>
<ellipse cx="64" cy="44" rx="14" ry="17" transform="rotate(22 64 44)"/>
<line x1="56" y1="58" x2="42" y2="84" stroke-linecap="round"/>
<g opacity="0.55"><line x1="26" y1="38" x2="46" y2="44"/><line x1="25" y1="44" x2="45" y2="50"/><line x1="27" y1="50" x2="47" y2="56"/><line x1="32" y1="32" x2="38" y2="58"/><line x1="38" y1="30" x2="44" y2="56"/></g>
<g opacity="0.55"><line x1="74" y1="38" x2="54" y2="44"/><line x1="75" y1="44" x2="55" y2="50"/><line x1="73" y1="50" x2="53" y2="56"/><line x1="68" y1="32" x2="62" y2="58"/><line x1="62" y1="30" x2="56" y2="56"/></g></g>
<g stroke="{color}" stroke-width="1" fill="none" opacity="0.7">
<path d="M40 84 Q35 86 32 92" stroke-linecap="round"/><path d="M60 84 Q65 86 68 92" stroke-linecap="round"/>
<path d="M50 88 Q47 91 44 92" stroke-linecap="round"/><path d="M50 88 Q53 91 56 92" stroke-linecap="round"/></g></svg>'''


def _emedal(place, size):
    cols = {1: ("#d4af37", "#e8c558", "#5b3e00"), 2: ("#b8b8b8", "#dcdcdc", "#3a3a3a"),
            3: ("#b07238", "#cf8c4f", "#3a1f00")}
    ring, face, text = cols[place]
    return f'''<svg width="{size}" height="{int(size*1.25)}" viewBox="0 0 40 50" fill="none" style="display:block">
<path d="M10 0 L14 14 L20 10 L26 14 L30 0 Z" fill="{EMER}" opacity="0.85"/>
<path d="M14 14 L20 10 L26 14 L24 20 L16 20 Z" fill="{EMERDEEP}"/>
<circle cx="20" cy="32" r="13" fill="{face}" stroke="{ring}" stroke-width="1.5"/>
<circle cx="20" cy="32" r="10" fill="none" stroke="{ring}" stroke-width="0.6" opacity="0.7"/>
<text x="20" y="36" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-weight="700" font-size="11" fill="{text}">{place}</text></svg>'''


def _corner(pos):
    tf = {"tl": "", "tr": "scaleX(-1)", "bl": "scaleY(-1)", "br": "scale(-1,-1)"}[pos]
    p = {"tl": "top:34px;left:34px", "tr": "top:34px;right:34px",
         "bl": "bottom:34px;left:34px", "br": "bottom:34px;right:34px"}[pos]
    return f'''<svg width="120" height="120" viewBox="0 0 70 70" fill="none" style="position:absolute;{p};opacity:0.7;transform:{tf}">
<g stroke="{GOLD}" fill="none" stroke-width="0.7" stroke-linecap="round">
<path d="M6 18 Q6 6 18 6"/><path d="M10 22 Q10 10 22 10"/><circle cx="14" cy="14" r="1.2" fill="{GOLD}"/>
<path d="M18 6 Q26 4 32 8"/><path d="M6 18 Q4 26 8 32"/><path d="M22 10 Q26 14 26 20"/><path d="M10 22 Q14 26 20 26"/></g></svg>'''


def _hero(initials, avatar_datauri, medal, size=230):
    """Avatar (photo or initials) in a gold ring; medal badge bottom-right for top-3."""
    if avatar_datauri:
        face = (f'<img src="{avatar_datauri}" style="width:100%;height:100%;border-radius:50%;'
                f'object-fit:cover;object-position:center;display:block">')
    else:
        face = (f'<div style="width:100%;height:100%;border-radius:50%;background:{CREAM2};'
                f'display:flex;align-items:center;justify-content:center;color:{GOLDDEEP};'
                f'font-family:{DISP};font-weight:600;font-size:{int(size*0.34)}px;letter-spacing:1px">{initials}</div>')
    badge = ""
    if medal in (1, 2, 3):
        badge = (f'<div style="position:absolute;right:-6px;bottom:-10px">{_emedal(medal, 70)}</div>')
    return (f'<div style="position:relative;width:{size}px;height:{size}px">'
            f'<div style="width:{size}px;height:{size}px;border-radius:50%;padding:7px;border:3px solid {GOLD};'
            f'box-sizing:border-box;background:{CREAM2}">{face}</div>{badge}</div>')


def _page(inner):
    return f'''<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap" rel="stylesheet">
<style>*{{margin:0;padding:0;box-sizing:border-box}} html,body{{width:1080px;height:1080px;overflow:hidden}}</style></head>
<body><div style="position:relative;width:1080px;height:1080px;background:linear-gradient(180deg,{PAPER} 0%,{CREAM} 100%);font-family:{SERIF}">
<div style="position:absolute;inset:26px;border:1px solid {PAPEREDGE};border-radius:8px"></div>
{_corner('tl')}{_corner('tr')}{_corner('bl')}{_corner('br')}
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:90px;text-align:center">
{inner}</div></div></body></html>'''


CARD_L = {
    "ru": {"champion": "Чемпион", "place": "{n} место", "with": "в паре с",
           "line": "Побед {w} · Поражений {l}"},
    "en": {"champion": "Champion", "place": "{n} place", "with": "with",
           "line": "Wins {w} · Losses {l}"},
}


def _subtitle(c: dict) -> str:
    """Tournament name + date, but avoid duplicating the date when the name
    already contains it (e.g. 'PADEL MASTERS · RISE PADEL 17.06')."""
    t, d = c["tournament"], str(c.get("date") or "")
    return t if (not d or d in t) else f"{t} · {d}"


def build_card_html(c: dict) -> str:
    """c: {name, initials, avatar (datauri|None), place, medal(1/2/3|None),
           partner(str|None), wins, losses, lang, tournament, date}"""
    L = CARD_L.get(c.get("lang", "ru"), CARD_L["ru"])
    place = c["place"]
    title = L["champion"] if place == 1 else L["place"].format(n=place)
    title_color = GOLDDEEP if place == 1 else (MUTED if place in (2, 3) else GOLD)
    sub = _subtitle(c)
    line = c.get("line") or L["line"].format(w=c.get("wins", 0), l=c.get("losses", 0))
    partner_line = ""
    if c.get("partner"):
        partner_line = (f'<div style="font-family:{SERIF};font-style:italic;font-size:24px;'
                        f'color:{MUTED};margin-top:8px">{L["with"]} <span style="color:{INK}">{c["partner"]}</span></div>')
    inner = (
        f'<div style="display:flex;justify-content:center;margin-bottom:8px">{_elogo(84)}</div>'
        f'<div style="font-family:{DISP};font-size:18px;letter-spacing:9px;color:{GOLD};text-transform:uppercase;margin-bottom:6px">Padel Club</div>'
        f'<div style="margin:20px 0 8px;display:flex;justify-content:center">{_hero(c["initials"], c.get("avatar"), c.get("medal"))}</div>'
        f'<div style="font-family:{DISP};font-weight:800;font-size:46px;letter-spacing:6px;color:{title_color};text-transform:uppercase;margin-top:18px">{title}</div>'
        f'<div style="font-family:{DISP};font-weight:700;font-size:60px;color:{INK};line-height:1.05;margin-top:8px">{c["name"]}</div>'
        f'<div style="font-family:{SERIF};font-style:italic;font-size:26px;color:{MUTED};margin-top:12px">{sub}</div>'
        f'{partner_line}'
        f'<div style="font-family:{DISP};font-weight:600;font-size:30px;color:{GOLDDEEP};margin-top:26px">{line}</div>'
        f'<div style="position:absolute;bottom:70px;left:0;right:0;text-align:center;font-family:{DISP};font-size:14px;letter-spacing:5px;color:{MUTED};text-transform:uppercase">Padel Club · King of the Court</div>'
    )
    return _page(inner)


def fetch_avatar_datauri(photo_url):
    """Download a player's photo and inline as data-URI so chrome renders it offline."""
    if not photo_url:
        return None
    try:
        req = urllib.request.Request(photo_url, headers={"User-Agent": "padel-club"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
        ct = r.headers.get("Content-Type", "image/jpeg")
        return f"data:{ct};base64,{base64.b64encode(data).decode()}"
    except Exception:
        return None


async def render_png(html: str) -> bytes:
    async with _RENDER_SEM:
        with tempfile.TemporaryDirectory() as d:
            hp = os.path.join(d, "c.html")
            op = os.path.join(d, "c.png")
            async with aiofiles.open(hp, "w") as f:
                await f.write(html)
            proc = await asyncio.create_subprocess_exec(
                "npx", "playwright", "screenshot",
                "--viewport-size=1080,1080", "--wait-for-timeout=2200",
                f"file://{hp}", op,
                cwd=FRONTEND_DIR,
                stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.PIPE,
            )
            _, err = await proc.communicate()
            if proc.returncode != 0 or not os.path.exists(op):
                raise RuntimeError(f"render failed: {err.decode()[:200]}")
            async with aiofiles.open(op, "rb") as f:
                return await f.read()


def caption_for(c: dict) -> str:
    sub, place = _subtitle(c), c["place"]
    en = c.get("lang", "ru") == "en"
    if place == 1:
        return (f"🏆 Congrats on 1st place at {sub}! 🎾" if en
                else f"🏆 Поздравляем с 1-м местом на {sub}! 🎾")
    if place == 2:
        return (f"🥈 Silver at {sub} — great play!" if en
                else f"🥈 Серебро на {sub} — отлично сыграно!")
    if place == 3:
        return (f"🥉 Bronze at {sub} — great play!" if en
                else f"🥉 Бронза на {sub} — отлично сыграно!")
    return (f"Your result at {sub} — place {place}. Thanks for playing! 🎾" if en
            else f"Твой итог на {sub} — {place} место. Спасибо за игру! 🎾")


async def send_photo(chat_id: int, png: bytes, caption: str):
    form = aiohttp.FormData()
    form.add_field("chat_id", str(chat_id))
    form.add_field("caption", caption)
    form.add_field("photo", png, filename="card.png", content_type="image/png")
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto"
    async with aiohttp.ClientSession() as s:
        async with s.post(url, data=form, timeout=aiohttp.ClientTimeout(total=30)) as r:
            j = await r.json()
            return bool(j.get("ok")), j


async def render_and_send(card: dict):
    """Render one card and DM it. Returns (ok, reason)."""
    try:
        html = build_card_html(card)
        png = await render_png(html)
        ok, j = await send_photo(card["telegram_id"], png, caption_for(card))
        if ok:
            return True, None
        return False, str(j.get("description", j))[:120]
    except Exception as e:
        return False, str(e)[:120]
