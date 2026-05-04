"""Read queries used by the API.

We don't import from /home/ubuntu/padel-bot/db/queries.py directly because the
bot module loads BOT_TOKEN at import time, which would fail here. Instead we
mirror the queries we need."""
from .db import conn, rows_to_list, row_to_dict


# ─── Tournaments ───────────────────────────────────────────

async def get_active_tournament():
    async with conn() as db:
        cur = await db.execute(
            "SELECT * FROM tournaments WHERE status IN ('setup','active') ORDER BY id DESC LIMIT 1"
        )
        return row_to_dict(await cur.fetchone())


async def get_tournament(tid: int):
    async with conn() as db:
        cur = await db.execute("SELECT * FROM tournaments WHERE id=?", (tid,))
        return row_to_dict(await cur.fetchone())


async def get_finished_tournaments():
    async with conn() as db:
        cur = await db.execute(
            """SELECT t.*,
                      (SELECT COUNT(*) FROM tournament_players WHERE tournament_id=t.id) AS players_count
               FROM tournaments t
               WHERE t.status='finished'
               ORDER BY t.created_at DESC"""
        )
        return rows_to_list(await cur.fetchall())


async def get_tournament_winner_pair(tid: int):
    """Top-1 pair (fixed-mode) or top-1 player (rotating-mode)."""
    t = await get_tournament(tid)
    if not t:
        return None
    if t["mode"] == "fixed":
        async with conn() as db:
            cur = await db.execute(
                """SELECT p1.name AS name_a, p2.name AS name_b
                   FROM tournament_players tp1
                   JOIN tournament_players tp2 ON tp2.tournament_id=tp1.tournament_id AND tp2.position=tp1.position+1
                   JOIN players p1 ON p1.id=tp1.player_id
                   JOIN players p2 ON p2.id=tp2.player_id
                   LEFT JOIN scores s ON s.tournament_id=tp1.tournament_id AND s.player_id=tp1.player_id
                   WHERE tp1.tournament_id=? AND tp1.position % 2 = 1
                   ORDER BY COALESCE(s.points,0) DESC, COALESCE(s.wins,0) DESC
                   LIMIT 1""",
                (tid,),
            )
            r = await cur.fetchone()
            return f"{r['name_a']} & {r['name_b']}" if r else None
    else:
        async with conn() as db:
            cur = await db.execute(
                """SELECT p.name FROM scores s
                   JOIN players p ON p.id=s.player_id
                   WHERE s.tournament_id=?
                   ORDER BY s.points DESC, s.wins DESC
                   LIMIT 1""",
                (tid,),
            )
            r = await cur.fetchone()
            return r["name"] if r else None


# ─── Rounds & matches ─────────────────────────────────────

async def get_current_round(tid: int):
    async with conn() as db:
        cur = await db.execute(
            "SELECT * FROM rounds WHERE tournament_id=? AND status='active' ORDER BY round_num DESC LIMIT 1",
            (tid,),
        )
        return row_to_dict(await cur.fetchone())


async def get_round_matches(round_id: int):
    """Returns matches with player names and levels resolved, structured for UI."""
    async with conn() as db:
        cur = await db.execute(
            """SELECT m.id, m.court_num, m.winner,
                      m.p1, p1.name AS p1_name, p1.level AS p1_level, p1.side AS p1_side,
                      m.p2, p2.name AS p2_name, p2.level AS p2_level, p2.side AS p2_side,
                      m.p3, p3.name AS p3_name, p3.level AS p3_level, p3.side AS p3_side,
                      m.p4, p4.name AS p4_name, p4.level AS p4_level, p4.side AS p4_side
               FROM matches m
               JOIN players p1 ON p1.id=m.p1
               JOIN players p2 ON p2.id=m.p2
               JOIN players p3 ON p3.id=m.p3
               JOIN players p4 ON p4.id=m.p4
               WHERE m.round_id=?
               ORDER BY m.court_num""",
            (round_id,),
        )
        rows = await cur.fetchall()
    out = []
    for r in rows:
        out.append({
            "match_id": r["id"],
            "court_num": r["court_num"],
            "winner": r["winner"],
            "team1": [
                {"player_id": r["p1"], "name": r["p1_name"], "level": r["p1_level"], "side": r["p1_side"]},
                {"player_id": r["p2"], "name": r["p2_name"], "level": r["p2_level"], "side": r["p2_side"]},
            ],
            "team2": [
                {"player_id": r["p3"], "name": r["p3_name"], "level": r["p3_level"], "side": r["p3_side"]},
                {"player_id": r["p4"], "name": r["p4_name"], "level": r["p4_level"], "side": r["p4_side"]},
            ],
        })
    return out


async def get_court_points_map(tid: int) -> dict:
    async with conn() as db:
        cur = await db.execute(
            "SELECT court_num, points FROM court_points WHERE tournament_id=?",
            (tid,),
        )
        rows = await cur.fetchall()
        return {r["court_num"]: r["points"] for r in rows}


async def get_tournament_rounds(tid: int):
    async with conn() as db:
        cur = await db.execute(
            "SELECT * FROM rounds WHERE tournament_id=? ORDER BY round_num",
            (tid,),
        )
        return rows_to_list(await cur.fetchall())


# ─── Leaderboard ──────────────────────────────────────────

async def get_leaderboard(tid: int):
    async with conn() as db:
        cur = await db.execute(
            """SELECT p.id AS player_id, p.name, p.level, p.side,
                      s.points, s.wins, COALESCE(s.losses, 0) AS losses
               FROM scores s
               JOIN players p ON p.id = s.player_id
               WHERE s.tournament_id=?
               ORDER BY s.points DESC, s.wins DESC""",
            (tid,),
        )
        return rows_to_list(await cur.fetchall())


# ─── Players ──────────────────────────────────────────────

async def get_all_players():
    async with conn() as db:
        cur = await db.execute(
            "SELECT id, name, level, side FROM players ORDER BY name"
        )
        return rows_to_list(await cur.fetchall())


async def get_player(pid: int):
    async with conn() as db:
        cur = await db.execute(
            "SELECT id, name, level, side FROM players WHERE id=?",
            (pid,),
        )
        return row_to_dict(await cur.fetchone())


async def get_player_stats(pid: int):
    async with conn() as db:
        cur = await db.execute(
            """SELECT
                  COUNT(DISTINCT tournament_id) AS tournaments,
                  COALESCE(SUM(wins), 0)        AS total_wins,
                  COALESCE(SUM(points), 0)      AS total_points,
                  COALESCE(SUM(losses), 0)      AS total_losses
               FROM scores WHERE player_id=?""",
            (pid,),
        )
        return row_to_dict(await cur.fetchone()) or {
            "tournaments": 0, "total_wins": 0, "total_points": 0, "total_losses": 0
        }


# ─── Admins ───────────────────────────────────────────────

async def is_admin(tg_id: int) -> bool:
    async with conn() as db:
        cur = await db.execute("SELECT 1 FROM admins WHERE tg_id=?", (tg_id,))
        return bool(await cur.fetchone())
