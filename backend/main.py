"""FastAPI entrypoint for Padel Mini App.

Run locally:
    uvicorn backend.main:app --reload --port 8001
Run from inside backend/:
    uvicorn main:app --reload --port 8001
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .config import CORS_ORIGINS, CORS_ORIGIN_REGEX
from .auth import get_tg_user
from . import queries as q


async def get_admin(user=Depends(get_tg_user)):
    """Admin-only dependency. Under dev-mode auth (off) it's a no-op; with real
    auth it requires the Telegram id to be in `admins` (else 403)."""
    if user.get("_dev_mode"):
        return user
    if not await q.is_admin(user["id"]):
        raise HTTPException(403, "admin only")
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


@app.get("/api/players/{pid}")
async def player_detail(pid: int, _user=Depends(get_tg_user)):
    p = await q.get_player(pid)
    if not p:
        raise HTTPException(404, "Player not found")
    stats = await q.get_player_stats(pid)
    return {"player": p, "stats": stats}


@app.get("/api/players/{pid}/profile")
async def player_profile(pid: int, _user=Depends(get_tg_user)):
    """Public profile: stats, placements/medals, streaks, partners, achievements."""
    prof = await q.get_player_profile(pid)
    if not prof:
        raise HTTPException(404, "Player not found")
    return prof


@app.post("/api/players/{pid}/invite")
async def player_invite(pid: int, admin=Depends(get_admin)):
    """Admin: mint a one-time deep-link to bind this player to a Telegram account."""
    try:
        return await q.mint_player_invite(pid, admin["id"])
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.delete("/api/players/{pid}/link")
async def player_unlink(pid: int, admin=Depends(get_admin)):
    """Admin: clear a player's Telegram link (to re-invite / fix a mistake)."""
    return await q.unlink_player(pid)


# ─── Misc ──────────────────────────────────────────────────

# ─── Mutations ─────────────────────────────────────────────

class WinnerBody(BaseModel):
    winner: int  # 1 or 2


@app.post("/api/matches/{match_id}/winner")
async def set_match_winner(match_id: int, body: WinnerBody, _user=Depends(get_tg_user)):
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
async def set_match_score(match_id: int, body: ScoreBody, _user=Depends(get_tg_user)):
    """Record a game score (groups8 / score-based). Winner derived from scores."""
    try:
        return await q.record_match_score(match_id, body.score1, body.score2)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/rounds/swap")
async def swap_players(body: SwapBody, _user=Depends(get_tg_user)):
    """Swap two player slots within a round (cross-court move or intra-court
    re-pairing). Scores + pair_history recompute on the server."""
    try:
        return await q.swap_round_players(
            body.a_match_id, body.a_slot, body.b_match_id, body.b_slot
        )
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/tournaments/{tid}/next-round")
async def next_round(tid: int, _user=Depends(get_tg_user)):
    try:
        return await q.advance_to_next_round(tid)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/tournaments/{tid}/undo-last-round")
async def undo_last_round(tid: int, _user=Depends(get_tg_user)):
    """Roll back to the previous round (deletes the latest round) so a wrong
    result can be fixed before the next round is replayed."""
    try:
        return await q.undo_last_round(tid)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/tournaments/{tid}/finish")
async def finish(tid: int, _user=Depends(get_tg_user)):
    return await q.finish_tournament(tid)


# ─── Player CRUD ───────────────────────────────────────────

class PlayerBody(BaseModel):
    name: str
    level: str
    side: str  # 'right' | 'left' | 'both' (or 'R'/'L'/'U')


@app.post("/api/players")
async def players_create(body: PlayerBody, _user=Depends(get_tg_user)):
    try:
        return await q.create_player(body.name, body.level, body.side)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.put("/api/players/{pid}")
async def players_update(pid: int, body: PlayerBody, _user=Depends(get_tg_user)):
    try:
        return await q.update_player(pid, body.name, body.level, body.side)
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.delete("/api/players/{pid}")
async def players_delete(pid: int, _user=Depends(get_tg_user)):
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


@app.post("/api/tournaments")
async def tournaments_create(body: TournamentCreateBody, _user=Depends(get_tg_user)):
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
        )
    except ValueError as e:
        raise HTTPException(400, str(e))


# ─── Share text ───────────────────────────────────────────

class ReplacePlayerBody(BaseModel):
    old_player_id: int
    new_player_id: int


@app.post("/api/tournaments/{tid}/replace-player")
async def replace_player(
    tid: int, body: ReplacePlayerBody, _user=Depends(get_tg_user),
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
        return {"user": user, "is_admin": True, "player": None, "join_status": None}
    is_adm = await q.is_admin(user["id"])
    player = await q.get_player_by_tg(user["id"])
    join_status = None if player else await q.get_join_status(user["id"])
    return {"user": user, "is_admin": is_adm, "player": player, "join_status": join_status}
