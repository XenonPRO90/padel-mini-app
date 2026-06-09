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


async def get_tournament_player_ids(tid: int) -> list[int]:
    """Players currently sitting in the tournament roster."""
    async with conn() as db:
        cur = await db.execute(
            "SELECT player_id FROM tournament_players WHERE tournament_id=? ORDER BY position",
            (tid,),
        )
        rows = await cur.fetchall()
        return [int(r["player_id"]) for r in rows]


async def replace_tournament_player(
    tid: int, old_player_id: int, new_player_id: int,
) -> None:
    """Swap a player slot. The new player inherits the old player's slot,
    scores, pair-history and match participation for this tournament —
    so the rotation algorithm and statistics stay coherent.

    Raises ValueError on any precondition failure (same id, old not in
    roster, new already in roster, new not in library).
    """
    if old_player_id == new_player_id:
        raise ValueError("Same player_id for old and new")

    async with conn() as db:
        cur = await db.execute(
            "SELECT 1 FROM players WHERE id=?", (new_player_id,)
        )
        if not await cur.fetchone():
            raise ValueError("New player not found in library")

        cur = await db.execute(
            "SELECT 1 FROM tournament_players WHERE tournament_id=? AND player_id=?",
            (tid, old_player_id),
        )
        if not await cur.fetchone():
            raise ValueError("Old player not in this tournament")

        cur = await db.execute(
            "SELECT 1 FROM tournament_players WHERE tournament_id=? AND player_id=?",
            (tid, new_player_id),
        )
        if await cur.fetchone():
            raise ValueError("New player already in this tournament")

        # Single transaction so a partial swap can never leave the roster
        # in an inconsistent state (e.g. tournament_players updated but
        # pair_history still naming the old player).
        await db.execute("BEGIN")
        try:
            # Roster slot
            await db.execute(
                "UPDATE tournament_players SET player_id=? "
                "WHERE tournament_id=? AND player_id=?",
                (new_player_id, tid, old_player_id),
            )
            # Score row (rare: there may be no row yet if no result was
            # recorded — UPDATE just touches 0 rows in that case)
            await db.execute(
                "UPDATE scores SET player_id=? "
                "WHERE tournament_id=? AND player_id=?",
                (new_player_id, tid, old_player_id),
            )
            # Pair history — old player as A or B
            await db.execute(
                "UPDATE pair_history SET player_a=? "
                "WHERE tournament_id=? AND player_a=?",
                (new_player_id, tid, old_player_id),
            )
            await db.execute(
                "UPDATE pair_history SET player_b=? "
                "WHERE tournament_id=? AND player_b=?",
                (new_player_id, tid, old_player_id),
            )
            # Past + current match participation
            for col in ("p1", "p2", "p3", "p4"):
                await db.execute(
                    f"UPDATE matches SET {col}=? "
                    f"WHERE {col}=? AND round_id IN "
                    f"  (SELECT id FROM rounds WHERE tournament_id=?)",
                    (new_player_id, old_player_id, tid),
                )
            await db.execute("COMMIT")
        except Exception:
            await db.execute("ROLLBACK")
            raise


async def get_monthly_leaderboard(year: int, month: int) -> tuple[list, int]:
    """Per-player totals aggregated across all FINISHED tournaments whose
    created_at falls in the given calendar month. Returns (rows, tournaments_count).

    Sorted by points DESC, wins DESC. Same dense-ranking is applied UI-side
    so ties share a place — matches Tournament Detail behaviour.
    """
    period = f"{year:04d}-{month:02d}"
    async with conn() as db:
        # Aggregate scores by player. Each tournament contributes its scores
        # for participants; player meta (name/level/side) taken from players.
        cur = await db.execute(
            """SELECT p.id AS player_id,
                      p.name, p.level, p.side,
                      COALESCE(SUM(s.points), 0) AS points,
                      COALESCE(SUM(s.wins),   0) AS wins,
                      COALESCE(SUM(s.losses), 0) AS losses,
                      COUNT(DISTINCT t.id)       AS tournaments
               FROM tournaments t
               JOIN scores s   ON s.tournament_id = t.id
               JOIN players p  ON p.id = s.player_id
               WHERE t.status = 'finished'
                 AND strftime('%Y-%m', t.created_at) = ?
               GROUP BY p.id
               ORDER BY points DESC, wins DESC""",
            (period,),
        )
        rows = rows_to_list(await cur.fetchall())

        # Total finished tournaments in the period (for the header summary)
        cur2 = await db.execute(
            """SELECT COUNT(*) AS c
               FROM tournaments
               WHERE status = 'finished'
                 AND strftime('%Y-%m', created_at) = ?""",
            (period,),
        )
        row = await cur2.fetchone()
        tournaments_count = int(row["c"]) if row else 0

    return rows, tournaments_count


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


async def _recompute_scores(db, tid: int):
    """Rebuild the whole `scores` table for a tournament from its matches.

    Single source of truth used after any result/roster edit so points/wins/
    losses can never drift. Winners of a court get that court's points (or
    `initial_points` for rounds before `start_round`); losers get a loss.
    Operates inside the caller's open transaction (`db`)."""
    cur = await db.execute(
        "SELECT start_round, initial_points FROM tournaments WHERE id=?", (tid,)
    )
    t = await cur.fetchone()
    start_round, initial_points = t["start_round"], t["initial_points"]

    cur = await db.execute(
        "SELECT court_num, points FROM court_points WHERE tournament_id=?", (tid,)
    )
    court_pts = {r["court_num"]: r["points"] for r in await cur.fetchall()}

    cur = await db.execute(
        """SELECT m.p1, m.p2, m.p3, m.p4, m.winner, m.court_num, r.round_num
           FROM matches m JOIN rounds r ON r.id=m.round_id
           WHERE r.tournament_id=?""",
        (tid,),
    )
    agg = {}  # player_id -> [points, wins, losses]
    for m in await cur.fetchall():
        if m["winner"] is None:
            continue
        if m["round_num"] >= start_round:
            pts = court_pts.get(m["court_num"], initial_points)
        else:
            pts = initial_points
        winners = (m["p1"], m["p2"]) if m["winner"] == 1 else (m["p3"], m["p4"])
        losers  = (m["p3"], m["p4"]) if m["winner"] == 1 else (m["p1"], m["p2"])
        for pid in winners:
            a = agg.setdefault(pid, [0, 0, 0]); a[0] += pts; a[1] += 1
        for pid in losers:
            a = agg.setdefault(pid, [0, 0, 0]); a[2] += 1

    await db.execute("DELETE FROM scores WHERE tournament_id=?", (tid,))
    for pid, (pts, wins, losses) in agg.items():
        await db.execute(
            "INSERT INTO scores(tournament_id, player_id, points, wins, losses) VALUES(?,?,?,?,?)",
            (tid, pid, pts, wins, losses),
        )


async def _recompute_pair_history(db, tid: int):
    """Rebuild `pair_history` for a tournament from its matches (rotating mode
    only) so future-round pairing stays accurate after a roster swap. For each
    round a pair plays together, count++ and last_round = that round_num."""
    cur = await db.execute("SELECT mode FROM tournaments WHERE id=?", (tid,))
    mode = (await cur.fetchone())["mode"]
    await db.execute("DELETE FROM pair_history WHERE tournament_id=?", (tid,))
    if mode != "rotating":
        return
    cur = await db.execute(
        """SELECT m.p1, m.p2, m.p3, m.p4, r.round_num
           FROM matches m JOIN rounds r ON r.id=m.round_id
           WHERE r.tournament_id=? ORDER BY r.round_num""",
        (tid,),
    )
    hist = {}  # (a, b) -> [last_round, count]
    for m in await cur.fetchall():
        for x, y in ((m["p1"], m["p2"]), (m["p3"], m["p4"])):
            a, b = sorted((x, y))
            h = hist.setdefault((a, b), [0, 0]); h[0] = m["round_num"]; h[1] += 1
    for (a, b), (last_round, count) in hist.items():
        await db.execute(
            "INSERT INTO pair_history(tournament_id, player_a, player_b, last_round, count) VALUES(?,?,?,?,?)",
            (tid, a, b, last_round, count),
        )


async def record_match_winner(match_id: int, winner: int):
    """Set the winner of a match, then recompute the tournament's scores from
    scratch. Recompute makes re-records fully idempotent — flipping a winner in
    any round (live, past, or finished) lands the standings correctly."""
    if winner not in (1, 2):
        raise ValueError("winner must be 1 or 2")

    async with conn() as db:
        await db.execute("BEGIN")
        try:
            cur = await db.execute(
                """SELECT r.tournament_id
                   FROM matches m JOIN rounds r ON r.id=m.round_id
                   WHERE m.id=?""",
                (match_id,),
            )
            row = await cur.fetchone()
            if not row:
                raise ValueError("Match not found")
            tid = row["tournament_id"]

            await db.execute("UPDATE matches SET winner=? WHERE id=?", (winner, match_id))
            await _recompute_scores(db, tid)
            await db.commit()
        except Exception:
            await db.rollback()
            raise

    return {"ok": True, "match_id": match_id, "winner": winner}


# Maps a 1-based slot index to its column. team1 = slots 1,2 / team2 = slots 3,4.
_SLOT_COL = {1: "p1", 2: "p2", 3: "p3", 4: "p4"}


async def swap_round_players(a_match_id: int, a_slot: int, b_match_id: int, b_slot: int):
    """Swap the players occupying two slots within the SAME round. Slots are
    (match_id, slot 1..4). Handles both cross-court moves and intra-court
    re-pairing. Because the round's set of players is preserved, every player
    still plays exactly once. Scores + pair_history are recomputed after."""
    if a_slot not in _SLOT_COL or b_slot not in _SLOT_COL:
        raise ValueError("slot must be 1..4")
    if a_match_id == b_match_id and a_slot == b_slot:
        raise ValueError("cannot swap a slot with itself")

    col_a, col_b = _SLOT_COL[a_slot], _SLOT_COL[b_slot]

    async with conn() as db:
        await db.execute("BEGIN")
        try:
            cur = await db.execute(
                """SELECT m.id, m.round_id, r.tournament_id, m.p1, m.p2, m.p3, m.p4
                   FROM matches m JOIN rounds r ON r.id=m.round_id
                   WHERE m.id IN (?, ?)""",
                (a_match_id, b_match_id),
            )
            rows = {r["id"]: r for r in await cur.fetchall()}
            ma, mb = rows.get(a_match_id), rows.get(b_match_id)
            if not ma or not mb:
                raise ValueError("Match not found")
            if ma["round_id"] != mb["round_id"]:
                raise ValueError("Both slots must be in the same round")

            tid = ma["tournament_id"]
            player_a = ma[col_a]
            player_b = mb[col_b]
            if player_a == player_b:
                raise ValueError("Both slots hold the same player")

            # a ← b's player, b ← a's player. Safe even when a_match_id ==
            # b_match_id (distinct columns; values captured before the writes).
            await db.execute(
                f"UPDATE matches SET {col_a}=? WHERE id=?", (player_b, a_match_id)
            )
            await db.execute(
                f"UPDATE matches SET {col_b}=? WHERE id=?", (player_a, b_match_id)
            )

            await _recompute_scores(db, tid)
            await _recompute_pair_history(db, tid)
            await db.commit()
        except Exception:
            await db.rollback()
            raise

    return {"ok": True}


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
    """Build a forwardable text for sharing into a Telegram chat.

    For active tournaments — schedule of the current round (who plays whom).
    For finished tournaments — final standings table with medals. This is
    what the Mini App's "Share as text" button on the Finished screen wants;
    previously this endpoint always returned schedule which was wrong.
    """
    t = await get_tournament(tid)
    if not t:
        return "No tournament"
    if t.get("status") == "finished":
        return await _share_text_standings(t)
    return await _share_text_schedule(t)


async def _share_text_schedule(t: dict) -> str:
    """Schedule of the current (or last) round."""
    tid = t["id"]
    round_obj = await get_current_round(tid)
    target_round = round_obj
    if not target_round:
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


async def _share_text_standings(t: dict) -> str:
    """Final standings with medals — used when sharing a finished tournament.

    Uses pair leaderboard for fixed-mode, otherwise per-player. Dense
    ranking by (points, wins) so ties share a place — mirrors the
    Tournament Detail screen.
    """
    tid = t["id"]
    mode = t.get("mode")
    if mode == "fixed":
        rows = await get_pair_leaderboard(tid)
        formatted = [
            {
                "name": f"{r['name_a']} & {r['name_b']}",
                "points": r["points"],
                "wins": r["wins"],
                "losses": r["losses"],
            }
            for r in rows
        ]
    else:
        rows = await get_leaderboard(tid)
        formatted = [
            {
                "name": r["name"],
                "points": r["points"],
                "wins": r["wins"],
                "losses": r["losses"],
            }
            for r in rows
        ]

    # Dense ranking with (points, wins) tiebreaker.
    last_pts: int | None = None
    last_wins: int | None = None
    place = 0
    medals = {1: "🥇", 2: "🥈", 3: "🥉"}
    lines = [
        f"🏆 *{t['name']}* — итоги",
        "",
    ]
    for r in formatted:
        if r["points"] != last_pts or r["wins"] != last_wins:
            place += 1
            last_pts = r["points"]
            last_wins = r["wins"]
        prefix = medals.get(place, f"{place}.")
        lines.append(
            f"{prefix} {r['name']} — {r['points']} pts  (W{r['wins']} L{r['losses']})"
        )
    return "\n".join(lines)
