"""FastAPI entrypoint for Padel Mini App.

Run locally:
    uvicorn backend.main:app --reload --port 8001
Run from inside backend/:
    uvicorn main:app --reload --port 8001
"""
import asyncio
import sys
import urllib.request
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .config import CORS_ORIGINS, CORS_ORIGIN_REGEX, FEATURES
from .auth import get_tg_user
from . import queries as q
from . import cards as cards_mod


async def get_admin(user=Depends(get_tg_user)):
    """Any admin — full or host. Guards everything involved in RUNNING a
    tournament. Under dev-mode auth (off) it's a no-op."""
    if user.get("_dev_mode"):
        return user
    if not await q.is_admin(user["id"]):
        raise HTTPException(403, "admin only")
    return user


async def get_full_admin(user=Depends(get_tg_user)):
    """Full admins only. Guards the club itself — the roster, join requests,
    levels and Telegram links — which the people who merely run games on a
    Wednesday should not touch (Roman, 2026-09-06)."""
    if user.get("_dev_mode"):
        return user
    if not await q.is_full_admin(user["id"]):
        raise HTTPException(403, "full admin only")
    return user

app = FastAPI(
    title="Padel KOTH Mini App API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"ok": True}


# ─── Tournaments ───────────────────────────────────────────

@app.get("/api/tournaments/active")
async def tournaments_active(_user=Depends(get_tg_user)):
    """Currently running (or in setup) tournament. Null if none."""
    t = await q.get_active_tournament()
    if not t:
        return {"tournament": None}

    if t.get("mode") == "americano":
        tp = await q.get_tournament_players(t["id"])
        t["total_rounds"] = q.americano_total_rounds(len(tp))
    elif t.get("mode") == "groups8":
        t["total_rounds"] = q.GROUPS8_ROUNDS

    round_obj = await q.get_current_round(t["id"])
    round_payload = None
    if round_obj:
        matches = await q.get_round_matches(round_obj["id"])
        court_pts = await q.get_court_points_map(t["id"])
        for m in matches:
            m["points"] = court_pts.get(m["court_num"], t["initial_points"]) \
                          if round_obj["round_num"] >= t["start_round"] else t["initial_points"]
        round_payload = {
            **round_obj,
            "matches": matches,
            "matches_total": len(matches),
            "matches_recorded": sum(1 for m in matches if m["winner"] is not None),
        }

    leaderboard = await q.get_leaderboard(t["id"])
    payload = {
        "tournament": t,
        "round": round_payload,
        "leaderboard": leaderboard,
    }
    if t["mode"] in ("fixed", "americano", "groups8"):
        payload["pair_leaderboard"] = await q.get_pair_leaderboard(t["id"])
    return payload


@app.get("/api/tournaments/history")
async def tournaments_history(_user=Depends(get_tg_user)):
    """All finished tournaments with summary."""
    items = await q.get_finished_tournaments()
    out = []
    for t in items:
        winner = await q.get_tournament_winner_pair(t["id"])
        out.append({**t, "winner": winner})
    return {"items": out}


@app.get("/api/tournaments/{tid}")
async def tournament_detail(tid: int, _user=Depends(get_tg_user)):
    t = await q.get_tournament(tid)
    if not t:
        raise HTTPException(404, "Tournament not found")
    rounds = await q.get_tournament_rounds(tid)
    leaderboard = await q.get_leaderboard(tid)
    if t.get("mode") == "americano":
        tp = await q.get_tournament_players(tid)
        t["total_rounds"] = q.americano_total_rounds(len(tp))
    elif t.get("mode") == "groups8":
        t["total_rounds"] = q.GROUPS8_ROUNDS
    payload = {"tournament": t, "rounds": rounds, "leaderboard": leaderboard}
    # For fixed-pair tournaments (incl. americano, groups8) also return a
    # pair-level leaderboard (one row per pair instead of one per player) so the
    # UI can show places by pair rather than duplicating medals across partners.
    if t["mode"] in ("fixed", "americano", "groups8"):
        payload["pair_leaderboard"] = await q.get_pair_leaderboard(tid)
    return payload


@app.get("/api/tournaments/{tid}/rounds/{round_num}")
async def round_detail(tid: int, round_num: int, _user=Depends(get_tg_user)):
    rounds = await q.get_tournament_rounds(tid)
    target = next((r for r in rounds if r["round_num"] == round_num), None)
    if not target:
        raise HTTPException(404, "Round not found")
    matches = await q.get_round_matches(target["id"])
    court_pts = await q.get_court_points_map(tid)
    t = await q.get_tournament(tid)
    for m in matches:
        m["points"] = court_pts.get(m["court_num"], t["initial_points"]) \
                      if round_num >= t["start_round"] else t["initial_points"]
    return {"round": target, "matches": matches}


# ─── Players ───────────────────────────────────────────────

@app.get("/api/players")
async def players_list(_user=Depends(get_tg_user)):
    return {"items": await q.get_all_players()}


@app.get("/api/players/linked")
async def players_linked(_user=Depends(get_tg_user)):
    """Linked players only — used to pick participants for a casual game."""
    return {"items": await q.get_linked_players()}


# ─── Casual (friendly) games ──────────────────────────────

class CasualGameIn(BaseModel):
    p1: int
    p2: int
    p3: int
    p4: int
    score1: int
    score2: int


class CasualCreateBody(BaseModel):
    games: list[CasualGameIn]
    court_label: str | None = None
    note: str | None = None


class CasualConfirmBody(BaseModel):
    ok: bool


async def _require_player(user):
    if user.get("_dev_mode"):
        raise HTTPException(400, "Доступно только привязанным игрокам")
    player = await q.get_player_by_tg(user["id"])
    if not player:
        raise HTTPException(400, "Доступно только привязанным игрокам")
    return player


@app.post("/api/casual")
async def casual_create(body: CasualCreateBody, user=Depends(get_tg_user)):
    player = await _require_player(user)
    try:
        return await q.create_casual_session(
            player["id"], [g.dict() for g in body.games], body.court_label, body.note)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/casual/{sid}/confirm")
async def casual_confirm(sid: int, body: CasualConfirmBody, user=Depends(get_tg_user)):
    player = await _require_player(user)
    try:
        return await q.confirm_casual(sid, player["id"], body.ok)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.get("/api/casual/pending")
async def casual_pending(user=Depends(get_tg_user)):
    if user.get("_dev_mode"):
        return {"items": []}
    player = await q.get_player_by_tg(user["id"])
    return {"items": await q.get_casual_pending_for(player["id"]) if player else []}


@app.get("/api/casual/my")
async def casual_my(user=Depends(get_tg_user)):
    if user.get("_dev_mode"):
        return {"items": []}
    player = await q.get_player_by_tg(user["id"])
    return {"items": await q.get_casual_my(player["id"]) if player else []}


@app.get("/api/players/{pid}")
async def player_detail(pid: int, _user=Depends(get_tg_user)):
    p = await q.get_player(pid)
    if not p:
        raise HTTPException(404, "Player not found")
    stats = await q.get_player_stats(pid)
    return {"player": p, "stats": stats}


@app.get("/api/players/{pid}/avatar")
async def player_avatar(pid: int, _user=Depends(get_tg_user)):
    """Proxy the player's Telegram avatar so it can be drawn into a shareable
    card (html2canvas can't read the cross-origin t.me image directly)."""
    p = await q.get_player(pid)
    if not p or not p.get("photo_url"):
        raise HTTPException(404, "no avatar")

    def fetch():
        req = urllib.request.Request(p["photo_url"], headers={"User-Agent": "padel-club"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.read(), r.headers.get("Content-Type", "image/jpeg")
    try:
        data, ctype = await asyncio.to_thread(fetch)
    except Exception:
        raise HTTPException(404, "avatar fetch failed")
    return Response(content=data, media_type=ctype, headers={"Cache-Control": "public, max-age=86400"})


@app.get("/api/players/{pid}/profile")
async def player_profile(pid: int, _user=Depends(get_tg_user)):
    """Public profile: stats, placements/medals, streaks, partners, achievements."""
    prof = await q.get_player_profile(pid)
    if not prof:
        raise HTTPException(404, "Player not found")
    return prof


class JoinReqBody(BaseModel):
    name: str
    level: str = "C"


@app.post("/api/join-requests")
async def join_request_create(body: JoinReqBody, user=Depends(get_tg_user)):
    """Self-serve: a Telegram user requests to join the club (admin approves)."""
    if user.get("_dev_mode"):
        raise HTTPException(400, "dev mode")
    try:
        return await q.create_join_request(user["id"], user.get("username"), body.name, body.level)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.get("/api/join-requests")
async def join_requests_list(status: str = "pending", _admin=Depends(get_full_admin)):
    return {"items": await q.list_join_requests(status)}


@app.post("/api/join-requests/{rid}/approve")
async def join_request_approve(rid: int, admin=Depends(get_full_admin)):
    try:
        return await q.approve_join_request(rid, admin["id"])
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/join-requests/{rid}/reject")
async def join_request_reject(rid: int, admin=Depends(get_full_admin)):
    return await q.reject_join_request(rid, admin["id"])


@app.get("/api/level-suggestions")
async def level_suggestions(_admin=Depends(get_full_admin)):
    """ELO-driven level changes to propose to the admin (assign/promote/demote)."""
    return {"items": await q.get_level_suggestions()}


class SetLevelBody(BaseModel):
    level: str


@app.post("/api/players/{pid}/level")
async def set_level(pid: int, body: SetLevelBody, _admin=Depends(get_full_admin)):
    """Admin confirms a level (from a suggestion): sets level + verified, recomputes ELO."""
    try:
        return await q.set_player_level(pid, body.level)
    except ValueError as e:
        raise HTTPException(400, str(e))


class OwnProfileBody(BaseModel):
    racket: str | None = None
    linkedin: str | None = None
    company: str | None = None
    position: str | None = None
    about: str | None = None


@app.put("/api/me/profile")
async def update_me_profile(body: OwnProfileBody, user=Depends(get_tg_user)):
    """Self-edit: a linked participant updates their own racket, and their
    social profile where this instance enables it."""
    if user.get("_dev_mode"):
        raise HTTPException(400, "dev mode")
    try:
        return await q.update_own_profile(
            user["id"], body.racket, body.linkedin, body.company, body.position,
            body.about, social=FEATURES["social"])
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.get("/api/rackets/stats")
async def rackets_stats(_user=Depends(get_tg_user)):
    return {"items": await q.get_racket_stats()}


@app.get("/api/club/leaderboard")
async def club_leaderboard(period: str = "all", by: str = "points", _user=Depends(get_tg_user)):
    return {"items": await q.get_club_leaderboard(period, by)}


@app.get("/api/club/pairs")
async def club_pairs(_user=Depends(get_tg_user)):
    return {"items": await q.get_club_pairs()}


@app.get("/api/club/records")
async def club_records(_user=Depends(get_tg_user)):
    return await q.get_club_records()


@app.get("/api/tournaments/{tid}/cards")
async def tournament_cards(tid: int, _admin=Depends(get_admin)):
    """Phase 4: preview — how many cards would be sent (linked vs total)."""
    data = await q.get_tournament_cards(tid)
    if not data:
        raise HTTPException(404, "Турнир не найден")
    if data["tournament"]["status"] != "finished":
        raise HTTPException(400, "Турнир не завершён")
    sent_ids = await q.get_sent_card_player_ids(tid)
    return {
        "linked_count": data["linked_count"], "total_count": data["total_count"],
        # Actual delivery state, so the UI can report what really went out
        # rather than what was queued — sending happens in the background.
        "sent_count": len(sent_ids),
        "report": _card_send_reports.get(tid),
        "items": [{"player_id": c["player_id"], "name": c["name"],
                   "place": c["place"], "linked": bool(c["telegram_id"]),
                   "sent": c["player_id"] in sent_ids}
                  for c in data["cards"]],
    }


_card_send_tasks: set = set()  # keep refs to background send tasks so they aren't GC'd

# Outcome of the last background send per tournament, surfaced through
# GET /cards. Sending is fire-and-forget, so without this the admin only ever
# saw the queued count: card rendering was broken from 2026-07-31 to
# 2026-09-06 (npx resolved Playwright to a release whose chromium build was
# not installed) and every attempt still reported success.
_card_send_reports: dict[int, dict] = {}


@app.post("/api/tournaments/{tid}/cards/send")
async def tournament_cards_send(tid: int, force: bool = False, _admin=Depends(get_admin)):
    """Phase 4: render + DM a personal card to every LINKED player.

    Rendering + sending runs in the BACKGROUND and the request returns at once
    (the render of ~16 cards took 30-60s, and the Telegram in-app WebView drops
    such long requests). Idempotent: a player already sent a card is skipped, so
    pressing "Send" again retries only who didn't get one. ?force=true re-sends
    to all linked players."""
    data = await q.get_tournament_cards(tid)
    if not data:
        raise HTTPException(404, "Турнир не найден")
    if data["tournament"]["status"] != "finished":
        raise HTTPException(400, "Турнир не завершён")
    linked = [c for c in data["cards"] if c["telegram_id"]]
    already = set() if force else await q.get_sent_card_player_ids(tid)
    pending = [c for c in linked if c["player_id"] not in already]

    # The podium image goes out to everyone as a second message (Roman,
    # 2026-09-06): the personal card says how you did, the podium says who won.
    podium = await q.get_tournament_podium(tid)
    podium_already = set() if force else await q.get_podium_sent_player_ids(tid)
    podium_pending = [c for c in linked if c["player_id"] not in podium_already]

    failures: list[dict] = []

    async def one(c):
        c["avatar"] = await asyncio.to_thread(cards_mod.fetch_avatar_datauri, c.get("photo_url"))
        ok, reason = await cards_mod.render_and_send(c)
        if ok:
            await q.mark_card_sent(tid, c["player_id"])
        else:
            failures.append({"name": c["name"], "reason": reason or "unknown"})
            print(f"[cards] tid={tid} player={c['player_id']} {c['name']}: {reason}",
                  file=sys.stderr, flush=True)

    async def _send_podium():
        """Render once per language actually needed, then reuse the PNG."""
        if not podium or not podium["rows"] or not podium_pending:
            return
        pngs: dict[str, bytes] = {}
        for c in podium_pending:
            lang = "en" if c.get("lang") == "en" else "ru"
            try:
                if lang not in pngs:
                    pngs[lang] = await cards_mod.render_podium(podium, lang)
                ok, j = await cards_mod.send_photo(
                    c["telegram_id"], pngs[lang], cards_mod.podium_caption(podium, lang))
                if ok:
                    await q.mark_podium_sent(tid, c["player_id"])
                else:
                    raise RuntimeError(str(j.get("description", j))[:120])
            except Exception as e:
                failures.append({"name": f"{c['name']} (подиум)", "reason": str(e)[:120]})
                print(f"[podium] tid={tid} player={c['player_id']} {c['name']}: {e}",
                      file=sys.stderr, flush=True)

    async def _run():
        res = await asyncio.gather(*[one(c) for c in pending], return_exceptions=True)
        await _send_podium()
        for r in res:
            if isinstance(r, Exception):
                failures.append({"name": "?", "reason": str(r)[:120]})
                print(f"[cards] tid={tid} task crashed: {r}", file=sys.stderr, flush=True)
        total = len(pending) + len(podium_pending)
        _card_send_reports[tid] = {
            "queued": total,
            "ok": total - len(failures),
            "failed": failures,
        }
        if failures:
            print(f"[cards] tid={tid} DONE with {len(failures)}/{total} failures",
                  file=sys.stderr, flush=True)

    _card_send_reports.pop(tid, None)  # a fresh attempt invalidates the old outcome
    task = asyncio.create_task(_run())
    _card_send_tasks.add(task)
    task.add_done_callback(_card_send_tasks.discard)

    # Returns immediately; "sent" = queued count. Delivery finishes in the
    # background within seconds. Failures stay unmarked → a re-press retries them.
    return {"sent": len(pending), "podium": len(podium_pending), "failed": [],
            "skipped": len(linked) - len(pending),
            "linked_count": len(linked), "total_count": len(data["cards"])}


# Round schedule notification — one rendered image of the round, DM'd to every
# linked participant with a personal caption ("you are on court 2, with X").
# Mainly for round 1, but works for any round.
_notify_reports: dict[str, dict] = {}
_notify_tasks: set = set()


@app.get("/api/tournaments/{tid}/rounds/{rnum}/notify")
async def round_notify_state(tid: int, rnum: int, _admin=Depends(get_admin)):
    sched = await q.get_round_schedule(tid, rnum)
    if not sched:
        raise HTTPException(404, "Раунд не найден")
    recipients = await q.get_round_recipients(tid, rnum)
    sent = await q.get_round_notified_player_ids(tid, rnum)
    total = sum(len(c["team1"]) + len(c["team2"]) for c in sched["courts"])
    return {
        "linked_count": len(recipients),
        "total_count": total,
        "sent_count": len(sent),
        "report": _notify_reports.get(f"{tid}:{rnum}"),
    }


@app.post("/api/tournaments/{tid}/rounds/{rnum}/notify")
async def round_notify_send(tid: int, rnum: int, force: bool = False,
                            _admin=Depends(get_admin)):
    """Render the round once per needed language, then DM it to each linked
    player with their own court/partner/opponents. Runs in the background for
    the same reason card sending does — the Telegram WebView drops long
    requests. Idempotent: a re-press retries only who didn't get it."""
    sched = await q.get_round_schedule(tid, rnum)
    if not sched:
        raise HTTPException(404, "Раунд не найден")
    recipients = await q.get_round_recipients(tid, rnum)
    already = set() if force else await q.get_round_notified_player_ids(tid, rnum)
    pending = [r for r in recipients if r["player_id"] not in already]

    key = f"{tid}:{rnum}"
    failures: list[dict] = []

    async def _run():
        pngs: dict[str, bytes] = {}
        for r in pending:
            lang = "en" if r.get("lang") == "en" else "ru"
            try:
                if lang not in pngs:
                    pngs[lang] = await cards_mod.render_schedule(sched, lang)
                ok, j = await cards_mod.send_photo(
                    r["telegram_id"], pngs[lang],
                    cards_mod.schedule_caption(sched, r["player_id"], lang))
                if ok:
                    await q.mark_round_notified(tid, rnum, r["player_id"])
                else:
                    raise RuntimeError(str(j.get("description", j))[:120])
            except Exception as e:
                failures.append({"name": r["name"], "reason": str(e)[:120]})
                print(f"[notify] tid={tid} r={rnum} player={r['player_id']} "
                      f"{r['name']}: {e}", file=sys.stderr, flush=True)
        _notify_reports[key] = {
            "queued": len(pending),
            "ok": len(pending) - len(failures),
            "failed": failures,
        }
        if failures:
            print(f"[notify] tid={tid} r={rnum} DONE with "
                  f"{len(failures)}/{len(pending)} failures", file=sys.stderr, flush=True)

    _notify_reports.pop(key, None)
    task = asyncio.create_task(_run())
    _notify_tasks.add(task)
    task.add_done_callback(_notify_tasks.discard)
    return {"sent": len(pending),
            "skipped": len(recipients) - len(pending),
            "linked_count": len(recipients)}


# ── Admin management (full admins only) ────────────────────────────────
# Liza asked to hand out and take back rights herself instead of asking for a
# server-side SQL edit every time the club needs another host.

class AdminRoleBody(BaseModel):
    role: str


class AddAdminBody(BaseModel):
    player_id: int
    role: str = "host"


@app.get("/api/admins")
async def admins_list(_admin=Depends(get_full_admin)):
    return {"items": await q.list_admins(), "roles": [q.ADMIN_FULL, q.ADMIN_HOST]}


@app.post("/api/admins")
async def admins_add(body: AddAdminBody, user=Depends(get_full_admin)):
    try:
        return await q.add_admin(body.player_id, body.role, user["id"])
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.put("/api/admins/{tg_id}")
async def admins_set_role(tg_id: int, body: AdminRoleBody, user=Depends(get_full_admin)):
    try:
        return await q.set_admin_role(tg_id, body.role, user["id"])
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.delete("/api/admins/{tg_id}")
async def admins_remove(tg_id: int, user=Depends(get_full_admin)):
    try:
        return await q.remove_admin(tg_id, user["id"])
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/players/{pid}/invite")
async def player_invite(pid: int, admin=Depends(get_full_admin)):
    """Admin: mint a one-time deep-link to bind this player to a Telegram account."""
    try:
        return await q.mint_player_invite(pid, admin["id"])
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.delete("/api/players/{pid}/link")
async def player_unlink(pid: int, admin=Depends(get_full_admin)):
    """Admin: clear a player's Telegram link (to re-invite / fix a mistake)."""
    return await q.unlink_player(pid)


# ─── Misc ──────────────────────────────────────────────────

# ─── Mutations ─────────────────────────────────────────────

class WinnerBody(BaseModel):
    winner: int  # 1 or 2


@app.post("/api/matches/{match_id}/winner")
async def set_match_winner(match_id: int, body: WinnerBody, _user=Depends(get_admin)):
    if body.winner not in (1, 2):
        raise HTTPException(400, "winner must be 1 or 2")
    try:
        return await q.record_match_winner(match_id, body.winner)
    except ValueError as e:
        raise HTTPException(400, str(e))


class SwapBody(BaseModel):
    a_match_id: int
    a_slot: int  # 1..4
    b_match_id: int
    b_slot: int  # 1..4


class ScoreBody(BaseModel):
    score1: int
    score2: int


@app.post("/api/matches/{match_id}/score")
async def set_match_score(match_id: int, body: ScoreBody, _user=Depends(get_admin)):
    """Record a game score (groups8 / score-based). Winner derived from scores."""
    try:
        return await q.record_match_score(match_id, body.score1, body.score2)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/rounds/swap")
async def swap_players(body: SwapBody, _user=Depends(get_admin)):
    """Swap two player slots within a round (cross-court move or intra-court
    re-pairing). Scores + pair_history recompute on the server."""
    try:
        return await q.swap_round_players(
            body.a_match_id, body.a_slot, body.b_match_id, body.b_slot
        )
    except ValueError as e:
        raise HTTPException(400, str(e))


async def _recompute_elo_if_finished(tid: int):
    """After a tournament finishes, refresh the club ELO (full recompute, ~1s).
    Wrapped so an ELO hiccup can never break the tournament-finish flow."""
    try:
        t = await q.get_tournament(tid)
        if t and t.get("status") == "finished":
            await q.rebuild_elo()
    except Exception:
        pass


@app.post("/api/tournaments/{tid}/next-round")
async def next_round(tid: int, _user=Depends(get_admin)):
    try:
        r = await q.advance_to_next_round(tid)
    except ValueError as e:
        raise HTTPException(400, str(e))
    await _recompute_elo_if_finished(tid)
    return r


class EliminateBody(BaseModel):
    player_ids: list[int]


@app.post("/api/tournaments/{tid}/eliminate")
async def eliminate(tid: int, body: EliminateBody, _user=Depends(get_admin)):
    """KotC: eliminate the given players and advance to the next round with a
    reduced court count (re-seeded by current standings)."""
    try:
        return await q.eliminate_and_advance(tid, body.player_ids)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/tournaments/{tid}/undo-last-round")
async def undo_last_round(tid: int, _user=Depends(get_admin)):
    """Roll back to the previous round (deletes the latest round) so a wrong
    result can be fixed before the next round is replayed."""
    try:
        return await q.undo_last_round(tid)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/tournaments/{tid}/finish")
async def finish(tid: int, _user=Depends(get_admin)):
    r = await q.finish_tournament(tid)
    await _recompute_elo_if_finished(tid)
    return r


# ─── Player CRUD ───────────────────────────────────────────

class PlayerBody(BaseModel):
    name: str
    level: str
    side: str  # 'right' | 'left' | 'both' (or 'R'/'L'/'U')


@app.post("/api/players")
async def players_create(body: PlayerBody, _user=Depends(get_admin)):
    try:
        return await q.create_player(body.name, body.level, body.side)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.put("/api/players/{pid}")
async def players_update(pid: int, body: PlayerBody, _user=Depends(get_admin)):
    try:
        return await q.update_player(pid, body.name, body.level, body.side)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.delete("/api/players/{pid}")
async def players_delete(pid: int, _user=Depends(get_full_admin)):
    try:
        return await q.delete_player(pid)
    except ValueError as e:
        raise HTTPException(400, str(e))


# ─── Tournament create ────────────────────────────────────

class TournamentCreateBody(BaseModel):
    name: str
    num_courts: int
    mode: str  # 'rotating' | 'fixed'
    initial_order: str  # 'keep' | 'random'
    initial_points: int
    start_round: int
    court_points: dict[int, int]  # {court_num: points}
    player_ids: list[int]
    court_labels: dict[int, str] | None = None  # {court_num: display label}
    skip_7_8: bool = False  # groups8: don't play the 7th-8th place match


@app.post("/api/tournaments")
async def tournaments_create(body: TournamentCreateBody, _user=Depends(get_admin)):
    try:
        return await q.create_tournament(
            name=body.name,
            num_courts=body.num_courts,
            mode=body.mode,
            initial_order=body.initial_order,
            initial_points=body.initial_points,
            start_round=body.start_round,
            court_points=body.court_points,
            player_ids=body.player_ids,
            court_labels=body.court_labels,
            skip_7_8=body.skip_7_8,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))


# ─── Share text ───────────────────────────────────────────

class ReplacePlayerBody(BaseModel):
    old_player_id: int
    new_player_id: int


@app.post("/api/tournaments/{tid}/replace-player")
async def replace_player(
    tid: int, body: ReplacePlayerBody, _user=Depends(get_admin),
):
    """Swap one tournament participant for another from the library.
    The new player inherits the old slot, scores, pair-history and past
    match participation."""
    t = await q.get_tournament(tid)
    if not t:
        raise HTTPException(404, "Tournament not found")
    try:
        await q.replace_tournament_player(tid, body.old_player_id, body.new_player_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"ok": True}


@app.get("/api/leaderboard/monthly")
async def leaderboard_monthly(
    year: int, month: int, _user=Depends(get_tg_user),
):
    """Aggregated per-player standings across every finished tournament
    in the given calendar month (e.g. year=2026, month=5)."""
    if not (1 <= month <= 12):
        raise HTTPException(400, "month must be in 1..12")
    if not (2024 <= year <= 2100):
        raise HTTPException(400, "year out of range")
    rows, tournaments_count = await q.get_monthly_leaderboard(year, month)
    return {
        "year": year,
        "month": month,
        "tournaments_count": tournaments_count,
        "items": rows,
    }


@app.get("/api/tournaments/{tid}/share")
async def share_text(tid: int, _user=Depends(get_tg_user)):
    return {"text": await q.get_share_text(tid)}


# ─── Misc ──────────────────────────────────────────────────

@app.get("/api/me")
async def me(user=Depends(get_tg_user)):
    """Current Telegram user + admin flag + linked player (identity) + join status."""
    if user.get("_dev_mode"):
        return {"user": user, "features": FEATURES, "is_admin": True,
                "admin_role": q.ADMIN_FULL, "is_full_admin": True, "player": None,
                "join_status": None, "pending_requests": 0}
    role = await q.get_admin_role(user["id"])
    is_adm = role is not None
    is_full = role == q.ADMIN_FULL
    player = await q.get_player_by_tg(user["id"])
    # Auto-populate avatar from Telegram initData (photo_url) once linked.
    if player and user.get("photo_url") and player.get("photo_url") != user["photo_url"]:
        await q.set_player_photo(player["id"], user["photo_url"])
        player["photo_url"] = user["photo_url"]
    # Store UI language (for localized post-tournament cards) when it changes.
    if player and user.get("language_code"):
        want = "en" if str(user["language_code"]).lower().startswith("en") else "ru"
        if player.get("lang") != want:
            await q.set_player_lang(player["id"], want)
            player["lang"] = want
    join_status = None if player else await q.get_join_status(user["id"])
    pending = await q.count_pending_join_requests() if is_full else 0
    return {
        "user": user, "features": FEATURES, "is_admin": is_adm,
        "admin_role": role, "is_full_admin": is_full, "player": player,
        "join_status": join_status, "pending_requests": pending,
    }
