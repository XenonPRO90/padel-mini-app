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

async def get_pair_leaderboard(tid: int):
    """Pair leaderboard for fixed-mode tournaments.
    Pairs are formed by adjacent positions (1+2, 3+4, ...). Since partners
    always play together in fixed mode, points/wins/losses are identical
    for both — we take them from the first player of each pair.
    Sorted by points DESC, wins DESC."""
    async with conn() as db:
        cur = await db.execute(
            """SELECT
               p1.name AS name_a,
               p2.name AS name_b,
               COALESCE(s.points, 0) AS points,
               COALESCE(s.wins, 0)   AS wins,
               COALESCE(s.losses, 0) AS losses
               FROM tournament_players tp1
               JOIN tournament_players tp2
                 ON tp2.tournament_id = tp1.tournament_id
                 AND tp2.position = tp1.position + 1
               JOIN players p1 ON p1.id = tp1.player_id
               JOIN players p2 ON p2.id = tp2.player_id
               LEFT JOIN scores s
                 ON s.tournament_id = tp1.tournament_id
                 AND s.player_id = tp1.player_id
               WHERE tp1.tournament_id = ?
                 AND tp1.position % 2 = 1
               ORDER BY points DESC, wins DESC""",
            (tid,),
        )
        return rows_to_list(await cur.fetchall())


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


# ─── Mutations ────────────────────────────────────────────

async def get_match(match_id: int):
    async with conn() as db:
        cur = await db.execute(
            """SELECT m.*, r.tournament_id, r.round_num
               FROM matches m JOIN rounds r ON r.id=m.round_id
               WHERE m.id=?""",
            (match_id,),
        )
        return row_to_dict(await cur.fetchone())


async def record_match_winner(match_id: int, winner: int):
    """Set the winner of a match. If a winner was already set, undo it first
    (subtract points/wins/losses) so re-records are idempotent.
    Updates scores, pair_history, and the matches.winner column in one tx."""
    if winner not in (1, 2):
        raise ValueError("winner must be 1 or 2")

    async with conn() as db:
        await db.execute("BEGIN")
        try:
            cur = await db.execute(
                """SELECT m.*, r.tournament_id, r.round_num,
                          t.start_round, t.initial_points
                   FROM matches m
                   JOIN rounds r ON r.id=m.round_id
                   JOIN tournaments t ON t.id=r.tournament_id
                   WHERE m.id=?""",
                (match_id,),
            )
            m = await cur.fetchone()
            if not m:
                raise ValueError("Match not found")

            # Determine points awarded for this match
            if m["round_num"] >= m["start_round"]:
                cur = await db.execute(
                    "SELECT points FROM court_points WHERE tournament_id=? AND court_num=?",
                    (m["tournament_id"], m["court_num"]),
                )
                row = await cur.fetchone()
                pts = row["points"] if row else m["initial_points"]
            else:
                pts = m["initial_points"]

            # Undo previous result if any
            if m["winner"] is not None:
                old_winners = (m["p1"], m["p2"]) if m["winner"] == 1 else (m["p3"], m["p4"])
                old_losers  = (m["p3"], m["p4"]) if m["winner"] == 1 else (m["p1"], m["p2"])
                for pid in old_winners:
                    await db.execute(
                        "UPDATE scores SET points=points-?, wins=wins-1 WHERE tournament_id=? AND player_id=?",
                        (pts, m["tournament_id"], pid),
                    )
                for pid in old_losers:
                    await db.execute(
                        "UPDATE scores SET losses=losses-1 WHERE tournament_id=? AND player_id=?",
                        (m["tournament_id"], pid),
                    )

            # Apply new result
            new_winners = (m["p1"], m["p2"]) if winner == 1 else (m["p3"], m["p4"])
            new_losers  = (m["p3"], m["p4"]) if winner == 1 else (m["p1"], m["p2"])
            for pid in new_winners:
                await db.execute(
                    """INSERT INTO scores(tournament_id, player_id, points, wins, losses)
                       VALUES(?,?,?,1,0)
                       ON CONFLICT(tournament_id, player_id)
                       DO UPDATE SET points=points+excluded.points, wins=wins+1""",
                    (m["tournament_id"], pid, pts),
                )
            for pid in new_losers:
                await db.execute(
                    """INSERT INTO scores(tournament_id, player_id, points, wins, losses)
                       VALUES(?,?,0,0,1)
                       ON CONFLICT(tournament_id, player_id)
                       DO UPDATE SET losses=losses+1""",
                    (m["tournament_id"], pid),
                )

            # pair_history is recorded once per round when matches are first
            # generated; we don't touch it on result records — winners losing
            # status doesn't change who they paired with.

            # Finally — set winner
            await db.execute("UPDATE matches SET winner=? WHERE id=?", (winner, match_id))
            await db.commit()
        except Exception:
            await db.rollback()
            raise

    return {"ok": True, "match_id": match_id, "winner": winner, "points_awarded": pts}


async def get_pair_history(tid: int) -> dict:
    async with conn() as db:
        cur = await db.execute(
            "SELECT player_a, player_b, count FROM pair_history WHERE tournament_id=?",
            (tid,),
        )
        rows = await cur.fetchall()
        return {(r["player_a"], r["player_b"]): r["count"] for r in rows}


async def get_previous_round_partners(tid: int) -> dict:
    async with conn() as db:
        cur = await db.execute(
            """SELECT m.p1, m.p2, m.p3, m.p4
               FROM matches m JOIN rounds r ON r.id=m.round_id
               WHERE r.tournament_id=?
               AND r.round_num=(SELECT MAX(round_num) FROM rounds WHERE tournament_id=?)""",
            (tid, tid),
        )
        rows = await cur.fetchall()
        partners = {}
        for r in rows:
            partners[r["p1"]] = r["p2"]; partners[r["p2"]] = r["p1"]
            partners[r["p3"]] = r["p4"]; partners[r["p4"]] = r["p3"]
        return partners


async def get_tournament_players(tid: int):
    async with conn() as db:
        cur = await db.execute(
            """SELECT tp.*, p.name, p.level, p.side
               FROM tournament_players tp JOIN players p ON p.id=tp.player_id
               WHERE tp.tournament_id=? ORDER BY tp.position""",
            (tid,),
        )
        return rows_to_list(await cur.fetchall())


async def advance_to_next_round(tid: int):
    """Validate all matches recorded → move players → create next round with
    pairing algorithm → return next round info. Mirrors padel-bot/handlers/game.py."""
    from .pairing import assign_courts, move_players_after_round

    async with conn() as db:
        # Find current active round
        cur = await db.execute(
            "SELECT * FROM rounds WHERE tournament_id=? AND status='active' ORDER BY round_num DESC LIMIT 1",
            (tid,),
        )
        round_obj = row_to_dict(await cur.fetchone())
        if not round_obj:
            raise ValueError("No active round to advance from")

        cur = await db.execute(
            "SELECT * FROM matches WHERE round_id=? ORDER BY court_num", (round_obj["id"],)
        )
        matches = rows_to_list(await cur.fetchall())
        if any(m["winner"] is None for m in matches):
            raise ValueError("Not all match results recorded yet")

        cur = await db.execute("SELECT * FROM tournaments WHERE id=?", (tid,))
        t = row_to_dict(await cur.fetchone())

        # Move players up/down by their match outcome
        match_dicts = []
        for m in matches:
            t1 = [{"player_id": m["p1"]}, {"player_id": m["p2"]}]
            t2 = [{"player_id": m["p3"]}, {"player_id": m["p4"]}]
            match_dicts.append({"court_num": m["court_num"], "winner": m["winner"], "team1": t1, "team2": t2})
        new_courts = move_players_after_round(match_dicts, t["num_courts"])
        for pid, court in new_courts.items():
            await db.execute(
                "UPDATE tournament_players SET current_court=? WHERE tournament_id=? AND player_id=?",
                (court, tid, pid),
            )

        # Finish current round
        await db.execute("UPDATE rounds SET status='done' WHERE id=?", (round_obj["id"],))

        # Increment tournament round counter
        new_round_num = round_obj["round_num"] + 1
        await db.execute("UPDATE tournaments SET current_round=? WHERE id=?", (new_round_num, tid))
        await db.commit()

    # Re-fetch tournament state with new round_num committed
    tp = await get_tournament_players(tid)
    pair_hist = await get_pair_history(tid)
    last_partners = await get_previous_round_partners(tid)

    if t["mode"] == "fixed":
        # Fixed-pair mode: pair up by adjacent positions, keep them together
        sorted_players = sorted(
            tp, key=lambda x: (x["current_court"] or 999, x["position"])
        )
        courts_out = []
        for ci in range(t["num_courts"]):
            chunk = sorted_players[ci*4:ci*4+4]
            if len(chunk) < 4:
                break
            courts_out.append({
                "court_num": ci+1,
                "team1": [chunk[0], chunk[1]],
                "team2": [chunk[2], chunk[3]],
            })
    else:
        courts_out = assign_courts(tp, t["num_courts"], pair_hist, last_partners)

    # Create the new round + matches
    async with conn() as db:
        cur = await db.execute(
            "INSERT INTO rounds(tournament_id, round_num) VALUES(?,?)",
            (tid, new_round_num),
        )
        new_round_id = cur.lastrowid

        for c in courts_out:
            t1, t2 = c["team1"], c["team2"]
            await db.execute(
                "INSERT INTO matches(round_id, court_num, p1, p2, p3, p4) VALUES(?,?,?,?,?,?)",
                (new_round_id, c["court_num"],
                 t1[0]["player_id"], t1[1]["player_id"], t2[0]["player_id"], t2[1]["player_id"]),
            )
            if t["mode"] == "rotating":
                pa, pb = sorted([t1[0]["player_id"], t1[1]["player_id"]])
                pc, pd = sorted([t2[0]["player_id"], t2[1]["player_id"]])
                await db.execute(
                    """INSERT INTO pair_history(tournament_id, player_a, player_b, last_round, count)
                       VALUES(?,?,?,?,1)
                       ON CONFLICT(tournament_id, player_a, player_b)
                       DO UPDATE SET last_round=excluded.last_round, count=count+1""",
                    (tid, pa, pb, new_round_num),
                )
                await db.execute(
                    """INSERT INTO pair_history(tournament_id, player_a, player_b, last_round, count)
                       VALUES(?,?,?,?,1)
                       ON CONFLICT(tournament_id, player_a, player_b)
                       DO UPDATE SET last_round=excluded.last_round, count=count+1""",
                    (tid, pc, pd, new_round_num),
                )

        await db.commit()

    return {"ok": True, "new_round_num": new_round_num}


async def finish_tournament(tid: int):
    """Mark tournament as finished. Doesn't delete data — history endpoints will see it."""
    async with conn() as db:
        await db.execute("UPDATE tournaments SET status='finished' WHERE id=?", (tid,))
        # Also close the active round if any
        await db.execute(
            "UPDATE rounds SET status='done' WHERE tournament_id=? AND status='active'",
            (tid,),
        )
        await db.commit()
    return {"ok": True}


# ─── Player CRUD ───────────────────────────────────────────

VALID_LEVELS = {"A+", "A", "B+", "B", "C+", "C", "C- strong", "C-strong", "C-", "D"}
VALID_SIDES = {"right", "left", "both", "R", "L", "U"}


def _normalize_side(side: str) -> str:
    return {"R": "right", "L": "left", "U": "both"}.get(side, side)


def _normalize_level(level: str) -> str:
    return "C- strong" if level == "C-strong" else level


async def create_player(name: str, level: str, side: str) -> dict:
    name = (name or "").strip()
    if not name:
        raise ValueError("name required")
    level = _normalize_level(level)
    side = _normalize_side(side)
    if level not in VALID_LEVELS:
        raise ValueError(f"invalid level: {level}")
    if side not in {"right", "left", "both"}:
        raise ValueError(f"invalid side: {side}")
    async with conn() as db:
        cur = await db.execute(
            "INSERT INTO players(name, level, side) VALUES(?,?,?)",
            (name, level, side),
        )
        await db.commit()
        pid = cur.lastrowid
    return {"id": pid, "name": name, "level": level, "side": side}


async def update_player(pid: int, name: str, level: str, side: str) -> dict:
    level = _normalize_level(level)
    side = _normalize_side(side)
    async with conn() as db:
        await db.execute(
            "UPDATE players SET name=?, level=?, side=? WHERE id=?",
            (name.strip(), level, side, pid),
        )
        await db.commit()
    return {"id": pid, "name": name, "level": level, "side": side}


async def delete_player(pid: int):
    async with conn() as db:
        # Block delete if player is in an active tournament
        cur = await db.execute(
            """SELECT 1 FROM tournament_players tp
               JOIN tournaments t ON t.id=tp.tournament_id
               WHERE tp.player_id=? AND t.status IN ('setup','active') LIMIT 1""",
            (pid,),
        )
        if await cur.fetchone():
            raise ValueError("Player is part of an active tournament")
        await db.execute("DELETE FROM players WHERE id=?", (pid,))
        await db.commit()
    return {"ok": True}


# ─── Tournament create ────────────────────────────────────

async def create_tournament(
    name: str,
    num_courts: int,
    mode: str,
    initial_order: str,
    initial_points: int,
    start_round: int,
    court_points: dict[int, int],
    player_ids: list[int],
) -> dict:
    """Create a new tournament with players, generate round 1, and activate it."""
    from .pairing import assign_courts
    import random

    if mode not in ("rotating", "fixed"):
        raise ValueError("mode must be 'rotating' or 'fixed'")
    if initial_order not in ("keep", "random"):
        raise ValueError("initial_order must be 'keep' or 'random'")
    if num_courts < 1 or num_courts > 8:
        raise ValueError("num_courts out of range")
    if len(player_ids) % 4 != 0:
        raise ValueError("player count must be divisible by 4")
    if len(player_ids) // 4 < num_courts:
        raise ValueError("Not enough players for the requested number of courts")

    # Apply ordering
    ordered = list(player_ids)
    if initial_order == "random":
        random.shuffle(ordered)

    async with conn() as db:
        await db.execute("BEGIN")
        try:
            cur = await db.execute(
                """INSERT INTO tournaments(name, num_courts, mode, initial_order, initial_points, start_round, status, current_round)
                   VALUES(?,?,?,?,?,?,'active',1)""",
                (name.strip(), num_courts, mode, initial_order, initial_points, start_round),
            )
            tid = cur.lastrowid

            # tournament_players
            for pos, pid in enumerate(ordered, start=1):
                court = ((pos - 1) // 4) + 1  # initial court by position
                if court > num_courts:
                    court = num_courts
                await db.execute(
                    "INSERT INTO tournament_players(tournament_id, player_id, position, current_court) VALUES(?,?,?,?)",
                    (tid, pid, pos, court),
                )

            # court points
            for cn, pts in court_points.items():
                await db.execute(
                    "INSERT INTO court_points(tournament_id, court_num, points) VALUES(?,?,?)",
                    (tid, cn, pts),
                )

            # round 1
            cur = await db.execute(
                "INSERT INTO rounds(tournament_id, round_num) VALUES(?,1)", (tid,)
            )
            r1_id = cur.lastrowid

            await db.commit()
        except Exception:
            await db.rollback()
            raise

    # Build round-1 matches outside the transaction (assign_courts reads players)
    tp = await get_tournament_players(tid)
    if mode == "fixed":
        sorted_players = sorted(tp, key=lambda x: (x["current_court"] or 999, x["position"]))
        courts_out = []
        for ci in range(num_courts):
            chunk = sorted_players[ci*4:ci*4+4]
            if len(chunk) < 4:
                break
            courts_out.append({
                "court_num": ci + 1,
                "team1": [chunk[0], chunk[1]],
                "team2": [chunk[2], chunk[3]],
            })
    else:
        courts_out = assign_courts(tp, num_courts, {}, None)

    async with conn() as db:
        for c in courts_out:
            t1, t2 = c["team1"], c["team2"]
            await db.execute(
                "INSERT INTO matches(round_id, court_num, p1, p2, p3, p4) VALUES(?,?,?,?,?,?)",
                (r1_id, c["court_num"],
                 t1[0]["player_id"], t1[1]["player_id"], t2[0]["player_id"], t2[1]["player_id"]),
            )
            if mode == "rotating":
                pa, pb = sorted([t1[0]["player_id"], t1[1]["player_id"]])
                pc, pd = sorted([t2[0]["player_id"], t2[1]["player_id"]])
                for (a, b) in ((pa, pb), (pc, pd)):
                    await db.execute(
                        """INSERT INTO pair_history(tournament_id, player_a, player_b, last_round, count)
                           VALUES(?,?,?,1,1)
                           ON CONFLICT(tournament_id, player_a, player_b)
                           DO UPDATE SET last_round=excluded.last_round, count=count+1""",
                        (tid, a, b),
                    )
        await db.commit()

    return {"ok": True, "tournament_id": tid}


# ─── Share text ────────────────────────────────────────────

async def get_share_text(tid: int) -> str:
    """Build a forwardable text describing the current round."""
    t = await get_tournament(tid)
    if not t:
        return "No tournament"
    round_obj = await get_current_round(tid)
    target_round = round_obj
    if not target_round:
        # use last finished round
        rounds = await get_tournament_rounds(tid)
        target_round = rounds[-1] if rounds else None
    if not target_round:
        return f"📋 {t['name']}\nNo rounds yet."
    matches = await get_round_matches(target_round["id"])
    lines = [
        f"📋 Расписание · Раунд {target_round['round_num']}",
        f"*{t['name']}*",
        "",
    ]
    for m in matches:
        n1 = " & ".join(p["name"] for p in m["team1"])
        n2 = " & ".join(p["name"] for p in m["team2"])
        l1 = "/".join(p["level"] for p in m["team1"])
        l2 = "/".join(p["level"] for p in m["team2"])
        lines.append(f"🏟 КОРТ {m['court_num']}")
        lines.append(f"  {n1}  ({l1})")
        lines.append(f"  vs")
        lines.append(f"  {n2}  ({l2})")
        if m["winner"]:
            w = "TEAM 1" if m["winner"] == 1 else "TEAM 2"
            lines.append(f"  ✓ {w} won")
        lines.append("")
    return "\n".join(lines)
