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
            """SELECT m.id, m.court_num, m.winner, m.score1, m.score2, cp.label AS court_label,
                      m.p1, p1.name AS p1_name, p1.level AS p1_level, p1.side AS p1_side,
                      m.p2, p2.name AS p2_name, p2.level AS p2_level, p2.side AS p2_side,
                      m.p3, p3.name AS p3_name, p3.level AS p3_level, p3.side AS p3_side,
                      m.p4, p4.name AS p4_name, p4.level AS p4_level, p4.side AS p4_side
               FROM matches m
               JOIN rounds r ON r.id=m.round_id
               LEFT JOIN court_points cp ON cp.tournament_id=r.tournament_id AND cp.court_num=m.court_num
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
            "court_label": r["court_label"],
            "winner": r["winner"],
            "score1": r["score1"],
            "score2": r["score2"],
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
        cur = await db.execute("SELECT status FROM tournaments WHERE id=?", (tid,))
        trow = await cur.fetchone()
        finished = bool(trow) and trow["status"] == "finished"
        # In a finished tournament every ranked pair has a scores row; teams left
        # unranked (e.g. skipped 7–8 place) have none → hide them from the board.
        unranked_filter = "AND s.player_id IS NOT NULL" if finished else ""
        cur = await db.execute(
            f"""SELECT
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
                 {unranked_filter}
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
            "SELECT id, name, level, side, photo_url, racket FROM players ORDER BY name"
        )
        return rows_to_list(await cur.fetchall())


async def get_linked_players():
    """Only players linked to Telegram — selectable for casual games."""
    async with conn() as db:
        cur = await db.execute(
            "SELECT id, name, level, side, photo_url FROM players "
            "WHERE telegram_id IS NOT NULL ORDER BY name"
        )
        return rows_to_list(await cur.fetchall())


async def get_player(pid: int):
    async with conn() as db:
        cur = await db.execute(
            "SELECT id, name, level, side, telegram_id, username, photo_url, racket, "
            "elo, verified FROM players WHERE id=?",
            (pid,),
        )
        return row_to_dict(await cur.fetchone())


async def get_player_by_tg(tg_id: int):
    """The player row linked to a Telegram account, or None (identity)."""
    async with conn() as db:
        cur = await db.execute(
            "SELECT id, name, level, side, telegram_id, username, photo_url, racket "
            "FROM players WHERE telegram_id=?",
            (tg_id,),
        )
        return row_to_dict(await cur.fetchone())


async def get_join_status(tg_id: int):
    """Status of this tg's most recent join request (pending/approved/rejected) or None."""
    async with conn() as db:
        cur = await db.execute(
            "SELECT status FROM join_requests WHERE tg_id=? ORDER BY id DESC LIMIT 1",
            (tg_id,),
        )
        row = await cur.fetchone()
        return row["status"] if row else None


async def mint_player_invite(player_id: int, created_by: int):
    """Create a one-time 7-day invite for a player and return its deep link.
    Supersedes any prior unused invite for that player. Errors if the player is
    already linked to a Telegram account (caller can unlink first)."""
    import secrets
    from datetime import datetime, timedelta
    from .config import BOT_USERNAME

    async with conn() as db:
        cur = await db.execute(
            "SELECT id, telegram_id FROM players WHERE id=?", (player_id,)
        )
        p = await cur.fetchone()
        if not p:
            raise ValueError("Player not found")
        if p["telegram_id"]:
            raise ValueError("Игрок уже привязан к Telegram")

        await db.execute(
            "DELETE FROM player_invites WHERE player_id=? AND used_at IS NULL", (player_id,)
        )
        token = secrets.token_urlsafe(16)
        now = datetime.utcnow()
        expires = (now + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")
        await db.execute(
            "INSERT INTO player_invites(token, player_id, created_by, created_at, expires_at) "
            "VALUES(?,?,?,?,?)",
            (token, player_id, created_by, now.strftime("%Y-%m-%d %H:%M:%S"), expires),
        )
        await db.commit()

    return {
        "token": token,
        "deep_link": f"https://t.me/{BOT_USERNAME}?start=bind_{token}",
        "expires_at": expires,
    }


async def unlink_player(player_id: int):
    """Clear a player's Telegram link (admin correction / re-invite)."""
    async with conn() as db:
        await db.execute(
            "UPDATE players SET telegram_id=NULL, username=NULL, photo_url=NULL WHERE id=?",
            (player_id,),
        )
        await db.commit()
    return {"ok": True}


# ─── Join requests (self-serve onboarding) ────────────────

async def create_join_request(tg_id: int, username, name: str, level: str):
    async with conn() as db:
        cur = await db.execute("SELECT id FROM players WHERE telegram_id=?", (tg_id,))
        if await cur.fetchone():
            raise ValueError("Ты уже в приложении")
        cur = await db.execute(
            "SELECT id FROM join_requests WHERE tg_id=? AND status='pending'", (tg_id,)
        )
        if await cur.fetchone():
            raise ValueError("Заявка уже на рассмотрении")
        await db.execute(
            "INSERT INTO join_requests(tg_id, username, name, level) VALUES(?,?,?,?)",
            (tg_id, username, (name or "").strip() or (username or "Игрок"), level or "C"),
        )
        await db.commit()
    return {"ok": True, "status": "pending"}


async def list_join_requests(status: str = "pending"):
    async with conn() as db:
        cur = await db.execute(
            "SELECT id, tg_id, username, name, level, status, created_at "
            "FROM join_requests WHERE status=? ORDER BY id DESC",
            (status,),
        )
        return rows_to_list(await cur.fetchall())


async def count_pending_join_requests() -> int:
    async with conn() as db:
        cur = await db.execute("SELECT COUNT(*) AS c FROM join_requests WHERE status='pending'")
        return (await cur.fetchone())["c"]


async def approve_join_request(req_id: int, reviewed_by: int):
    """Approve: create a player linked to the requester's Telegram, mark approved."""
    async with conn() as db:
        cur = await db.execute("SELECT * FROM join_requests WHERE id=?", (req_id,))
        r = await cur.fetchone()
        if not r:
            raise ValueError("Заявка не найдена")
        if r["status"] != "pending":
            raise ValueError("Заявка уже обработана")
        cur = await db.execute("SELECT id FROM players WHERE telegram_id=?", (r["tg_id"],))
        if await cur.fetchone():
            await db.execute(
                "UPDATE join_requests SET status='approved', reviewed_by=?, reviewed_at=CURRENT_TIMESTAMP WHERE id=?",
                (reviewed_by, req_id),
            )
            await db.commit()
            raise ValueError("Этот Telegram уже привязан к игроку")
        cur = await db.execute(
            "INSERT INTO players(name, level, side, telegram_id, username) VALUES(?,?,?,?,?)",
            (r["name"], r["level"] or "C", "both", r["tg_id"], r["username"]),
        )
        pid = cur.lastrowid
        await db.execute(
            "UPDATE join_requests SET status='approved', reviewed_by=?, reviewed_at=CURRENT_TIMESTAMP WHERE id=?",
            (reviewed_by, req_id),
        )
        await db.commit()
    return {"ok": True, "player_id": pid}


async def reject_join_request(req_id: int, reviewed_by: int):
    async with conn() as db:
        await db.execute(
            "UPDATE join_requests SET status='rejected', reviewed_by=?, reviewed_at=CURRENT_TIMESTAMP WHERE id=?",
            (reviewed_by, req_id),
        )
        await db.commit()
    return {"ok": True}


async def update_own_profile(tg_id: int, racket):
    """Self-edit: a linked participant updates their own racket."""
    async with conn() as db:
        cur = await db.execute("SELECT id FROM players WHERE telegram_id=?", (tg_id,))
        p = await cur.fetchone()
        if not p:
            raise ValueError("Профиль не привязан")
        await db.execute(
            "UPDATE players SET racket=? WHERE id=?",
            ((racket or "").strip() or None, p["id"]),
        )
        await db.commit()
    return {"ok": True}


async def set_player_photo(player_id: int, photo_url: str):
    async with conn() as db:
        await db.execute("UPDATE players SET photo_url=? WHERE id=?", (photo_url, player_id))
        await db.commit()


async def get_racket_stats():
    """Club racket popularity: players per racket (non-empty), most popular first."""
    async with conn() as db:
        cur = await db.execute(
            "SELECT racket, COUNT(*) AS players FROM players "
            "WHERE racket IS NOT NULL AND TRIM(racket) <> '' "
            "GROUP BY racket ORDER BY players DESC, racket"
        )
        return rows_to_list(await cur.fetchall())


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


# ─── Player profile (stats + placements + partners + achievements) ────────

async def _player_matches_derived(db, pid: int):
    """One pass over the player's completed matches → games played, current &
    longest win streak, and per-partner (teammate) games/wins."""
    cur = await db.execute(
        """SELECT m.winner, m.p1, m.p2, m.p3, m.p4
           FROM matches m
           JOIN rounds r ON r.id=m.round_id
           JOIN tournaments t ON t.id=r.tournament_id
           WHERE ? IN (m.p1, m.p2, m.p3, m.p4) AND m.winner IS NOT NULL
           ORDER BY t.created_at, t.id, r.round_num, m.court_num""",
        (pid,),
    )
    seq = []          # chronological win(True)/loss(False)
    partners = {}     # mate_id -> [games, wins]
    opponents = {}    # opp_id -> [meetings, player_wins_vs]
    won_opp_pairs = []  # opponent id-pairs for matches the player won (giant-killer)
    opp_pairs = []      # (opponent id-pair, won) for EVERY match (vs-stronger stats)
    for m in await cur.fetchall():
        if pid in (m["p1"], m["p2"]):
            mate = m["p2"] if m["p1"] == pid else m["p1"]
            won = m["winner"] == 1
            opps = (m["p3"], m["p4"])
        else:
            mate = m["p4"] if m["p3"] == pid else m["p3"]
            won = m["winner"] == 2
            opps = (m["p1"], m["p2"])
        seq.append(won)
        pm = partners.setdefault(mate, [0, 0]); pm[0] += 1; pm[1] += 1 if won else 0
        for o in opps:
            op = opponents.setdefault(o, [0, 0]); op[0] += 1; op[1] += 1 if won else 0
        if won:
            won_opp_pairs.append(opps)
        opp_pairs.append((opps, won))

    longest = cur_run = 0
    for w in seq:
        cur_run = cur_run + 1 if w else 0
        longest = max(longest, cur_run)
    current = 0
    for w in reversed(seq):
        if w: current += 1
        else: break

    # recent form — last up-to-5 results, newest first
    form = list(reversed([("W" if w else "L") for w in seq[-5:]]))

    return {
        "games": len(seq), "streak_best": longest, "streak_cur": current,
        "partners": partners, "opponents": opponents,
        "won_opp_pairs": won_opp_pairs, "opp_pairs": opp_pairs, "form": form,
    }


async def _player_placements(db, pid: int):
    """Per finished tournament the player was in: dense place (points DESC,
    wins DESC), with the player's points/wins/losses and tournament meta.
    Newest first. Place is computed from per-player `scores` (pair modes share
    identical scores, so per-player rank == per-pair place)."""
    cur = await db.execute(
        """SELECT s.tournament_id AS tid, s.points, s.wins, s.losses,
                  t.name, t.created_at, t.mode
           FROM scores s JOIN tournaments t ON t.id=s.tournament_id
           WHERE s.player_id=? AND t.status='finished'
           ORDER BY t.created_at DESC, t.id DESC""",
        (pid,),
    )
    mine = rows_to_list(await cur.fetchall())
    if not mine:
        return []
    tids = [m["tid"] for m in mine]
    qmarks = ",".join("?" * len(tids))
    cur = await db.execute(
        f"SELECT tournament_id AS tid, points, wins FROM scores WHERE tournament_id IN ({qmarks})",
        tids,
    )
    by_tid = {}
    for r in await cur.fetchall():
        by_tid.setdefault(r["tid"], set()).add((r["points"], r["wins"]))
    out = []
    for m in mine:
        # dense place = 1 + number of distinct (points,wins) strictly better
        better = sum(1 for (p, w) in by_tid.get(m["tid"], set())
                     if p > m["points"] or (p == m["points"] and w > m["wins"]))
        out.append({
            "tid": m["tid"], "name": m["name"], "created_at": m["created_at"],
            "mode": m["mode"], "place": better + 1,
            "points": m["points"], "wins": m["wins"], "losses": m["losses"],
        })
    return out


async def _player_club_rank(db, pid: int):
    """Rank by total career points among all players who have a score row.
    Dense-ish: rank = 1 + players with strictly more points. Returns {rank,total}."""
    cur = await db.execute(
        "SELECT player_id, COALESCE(SUM(points),0) AS pts FROM scores GROUP BY player_id"
    )
    rows = await cur.fetchall()
    if not rows:
        return None
    mine = next((r["pts"] for r in rows if r["player_id"] == pid), None)
    if mine is None:
        return None
    rank = 1 + sum(1 for r in rows if r["pts"] > mine)
    return {"rank": rank, "total": len(rows), "points": mine}


async def _player_recent_record(db, pid: int, days: int = 30):
    """Wins/losses over tournaments started in the last `days` days."""
    from datetime import datetime, timedelta
    since = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
    cur = await db.execute(
        """SELECT COALESCE(SUM(s.wins),0) AS w, COALESCE(SUM(s.losses),0) AS l
           FROM scores s JOIN tournaments t ON t.id=s.tournament_id
           WHERE s.player_id=? AND t.created_at >= ?""",
        (pid, since),
    )
    r = await cur.fetchone()
    return {"wins": r["w"], "losses": r["l"]}


async def _player_court_distribution(db, pid: int):
    """Share of matches played on each court — King of the Court (rotating) only,
    where court number reflects skill tier. Returns [{court, games, pct}], most
    played first, or [] if no rotating games."""
    cur = await db.execute(
        """SELECT m.court_num AS court, COUNT(*) AS games
           FROM matches m
           JOIN rounds r ON r.id=m.round_id
           JOIN tournaments t ON t.id=r.tournament_id
           WHERE ? IN (m.p1, m.p2, m.p3, m.p4) AND m.winner IS NOT NULL AND t.mode='rotating'
           GROUP BY m.court_num""",
        (pid,),
    )
    rows = rows_to_list(await cur.fetchall())
    total = sum(r["games"] for r in rows)
    if not total:
        return []
    out = [{"court": r["court"], "games": r["games"], "pct": round(r["games"] / total * 100)}
           for r in rows]
    out.sort(key=lambda x: -x["games"])
    return out


async def get_player_profile(pid: int):
    from .pairing import level_value
    player = await get_player(pid)
    if not player:
        return None
    async with conn() as db:
        derived = await _player_matches_derived(db, pid)
        placements = await _player_placements(db, pid)
        recent_rec = await _player_recent_record(db, pid, 30)
        court_dist = await _player_court_distribution(db, pid)
        # resolve names + levels for partners AND opponents in one query
        ids = set(derived["partners"]) | set(derived["opponents"])
        names, levels = {}, {}
        if ids:
            qmarks = ",".join("?" * len(ids))
            cur = await db.execute(
                f"SELECT id, name, level FROM players WHERE id IN ({qmarks})", list(ids)
            )
            for r in await cur.fetchall():
                names[r["id"]] = r["name"]; levels[r["id"]] = r["level"]

    # Club rank from the composite rating (same metric as Club → Рейтинг).
    rating_list = await get_club_rating()
    my_rating = next((x for x in rating_list if x["player_id"] == pid), None)
    club_rank = {"rank": my_rating["rank"], "total": len(rating_list)} if my_rating else None
    club_rating = my_rating["rating"] if my_rating else None

    # Totals from scores (authoritative, all tournaments) so games == W+L.
    base = await get_player_stats(pid)
    total_wins = base["total_wins"]
    total_losses = base["total_losses"]
    total_points = base["total_points"]
    tournaments_all = base["tournaments"]
    games = total_wins + total_losses
    win_rate = round(total_wins / games, 3) if games else 0.0
    champion = sum(1 for p in placements if p["place"] == 1)
    podium = sum(1 for p in placements if p["place"] <= 3)
    best_place = min((p["place"] for p in placements), default=None)
    n_placed = len(placements)
    podium_rate = round(podium / n_placed * 100) if n_placed else 0
    avg_finish = round(sum(p["place"] for p in placements) / n_placed, 1) if n_placed else None

    partners_sorted = sorted(
        ({"player_id": mid, "name": names.get(mid, "?"), "games": gw[0], "wins": gw[1]}
         for mid, gw in derived["partners"].items()),
        key=lambda x: (-x["games"], -x["wins"]),
    )
    eligible = [p for p in partners_sorted if p["games"] >= 3]
    best_partner = max(
        eligible, key=lambda x: (x["wins"] / x["games"], x["games"]), default=None
    )
    # "Not our duo (yet)" — gentle counterpart to best partner: the teammate with
    # the lowest win-rate. Only surface a sub-.500 pair, and never the same person
    # as the best partner (happens when there's a single eligible teammate).
    worst_partner = min(
        eligible, key=lambda x: (x["wins"] / x["games"], -x["games"]), default=None
    )
    if worst_partner and (
        worst_partner["wins"] / worst_partner["games"] >= 0.5
        or (best_partner and worst_partner["player_id"] == best_partner["player_id"])
    ):
        worst_partner = None

    # Head-to-head: nemesis (most losses to) & favourite victim (most wins vs),
    # min 3 meetings to be meaningful.
    opp = [
        {"player_id": oid, "name": names.get(oid, "?"),
         "meetings": mw[0], "wins": mw[1], "losses": mw[0] - mw[1]}
        for oid, mw in derived["opponents"].items() if mw[0] >= 3
    ]
    # nemesis = worst net record (they beat you), favourite = best net record.
    nemesis = max(opp, key=lambda x: (x["losses"] - x["wins"], x["meetings"]), default=None)
    if nemesis and nemesis["losses"] <= nemesis["wins"]:
        nemesis = None
    favorite_opp = max(opp, key=lambda x: (x["wins"] - x["losses"], x["meetings"]), default=None)
    if favorite_opp and favorite_opp["wins"] <= favorite_opp["losses"]:
        favorite_opp = None

    # Giant-killer: wins where an opponent is >=2 ladder steps above you.
    # Uniform ladder (C-strong sits between C- and C), so e.g. C- beating C
    # (2 steps via C-strong) or C-strong beating C+ counts; half-steps don't.
    GK_LADDER = {"D": 1, "C-": 2, "C- strong": 3, "C-strong": 3, "C": 4,
                 "C+": 5, "B": 6, "B+": 7, "A": 8, "A+": 9}
    def gk_step(lvl):
        return GK_LADDER.get(lvl, 4)  # default ~C
    my_step = gk_step(player["level"])
    def vs_stronger(opps):
        return max((gk_step(levels.get(o, "C")) for o in opps), default=0) - my_step >= 2
    giant_matches = sum(1 for opps, _won in derived["opp_pairs"] if vs_stronger(opps))
    giant_kills = sum(1 for opps, won in derived["opp_pairs"] if won and vs_stronger(opps))

    # Form / dynamics: last-30d win-rate vs lifetime.
    rg = recent_rec["wins"] + recent_rec["losses"]
    recent_win_rate = round(recent_rec["wins"] / rg, 3) if rg else None

    achievements = [
        {"id": "champion", "label": "Чемпион", "value": champion, "unit": "×"},
        {"id": "podium", "label": "Подиум", "value": podium, "unit": "×"},
        {"id": "tournaments", "label": "Турниров", "value": tournaments_all, "unit": ""},
        {"id": "games", "label": "Игр сыграно", "value": games, "unit": ""},
        {"id": "win_rate", "label": "Винрейт", "value": round(win_rate * 100), "unit": "%"},
        {"id": "podium_rate", "label": "% призовых", "value": podium_rate, "unit": "%"},
        {"id": "streak_best", "label": "Лучшая серия", "value": derived["streak_best"], "unit": ""},
        {"id": "giant_kills", "label": "Гроза старших", "value": giant_kills, "unit": "",
         "sub": (f"из {giant_matches} со старшими" if giant_matches else "не играл со старшими")},
        {"id": "total_points", "label": "Очков за карьеру", "value": total_points, "unit": ""},
    ]

    return {
        "player": player,
        "elo_level": (elo_to_level(player["elo"]) if player.get("elo") is not None else None),
        "stats": {
            "tournaments": tournaments_all,
            "games": games,
            "total_wins": total_wins,
            "total_losses": total_losses,
            "total_points": total_points,
            "win_rate": win_rate,
            "champion": champion,
            "podium": podium,
            "best_place": best_place,
            "streak_best": derived["streak_best"],
            "streak_cur": derived["streak_cur"],
            "podium_rate": podium_rate,
            "avg_finish": avg_finish,
            "giant_kills": giant_kills,
            "giant_matches": giant_matches,
            "club_rank": club_rank["rank"] if club_rank else None,
            "club_total": club_rank["total"] if club_rank else None,
            "club_rating": club_rating,
            "recent_win_rate": recent_win_rate,
            "recent_games": rg,
            "form": derived["form"],
        },
        "recent": placements[:8],
        "partners": partners_sorted[:5],
        "best_partner": best_partner,
        "worst_partner": worst_partner,
        "nemesis": nemesis,
        "favorite_opponent": favorite_opp,
        "court_distribution": court_dist,
        "achievements": achievements,
    }


# ─── Club-wide aggregates (rating / pairs / records) ──────

async def get_club_leaderboard(period: str = "all", by: str = "points"):
    """All-time or current-month club ranking. by=points|winrate|rating.
    winrate needs >=10 games; rating is the composite (all-time, ignores period).
    Returns ranked players with name/level/photo."""
    if by == "rating":
        return await get_club_rating()
    if by == "elo":
        return await get_elo_leaderboard()
    from datetime import datetime
    async with conn() as db:
        if period == "month":
            cur = await db.execute(
                """SELECT s.player_id AS pid, p.name, p.level, p.photo_url,
                          SUM(s.points) AS pts, SUM(s.wins) AS w, SUM(s.losses) AS l,
                          COUNT(DISTINCT s.tournament_id) AS tours
                   FROM scores s JOIN tournaments t ON t.id=s.tournament_id
                   JOIN players p ON p.id=s.player_id
                   WHERE strftime('%Y-%m', t.created_at) = ?
                   GROUP BY s.player_id""",
                (datetime.utcnow().strftime("%Y-%m"),),
            )
        else:
            cur = await db.execute(
                """SELECT s.player_id AS pid, p.name, p.level, p.photo_url,
                          SUM(s.points) AS pts, SUM(s.wins) AS w, SUM(s.losses) AS l,
                          COUNT(DISTINCT s.tournament_id) AS tours
                   FROM scores s JOIN players p ON p.id=s.player_id
                   GROUP BY s.player_id"""
            )
        rows = await cur.fetchall()
    out = []
    for r in rows:
        g = r["w"] + r["l"]
        out.append({
            "player_id": r["pid"], "name": r["name"], "level": r["level"],
            "photo_url": r["photo_url"], "points": r["pts"], "wins": r["w"],
            "losses": r["l"], "games": g, "tournaments": r["tours"],
            "win_rate": round(r["w"] / g, 3) if g else 0.0,
        })
    if by == "winrate":
        out = [x for x in out if x["games"] >= 10]
        out.sort(key=lambda x: (-x["win_rate"], -x["games"]))
    else:
        out.sort(key=lambda x: (-x["points"], -x["wins"]))
    return out


async def get_elo_leaderboard():
    """Club ranking by live ELO. Excludes the coach (rating_excluded). Returns
    name, level, elo, implied level (nearest), verified, games, win_rate."""
    async with conn() as db:
        cur = await db.execute(
            """SELECT p.id AS pid, p.name, p.level, p.photo_url, p.elo, p.verified,
                      COALESCE(SUM(s.wins), 0) AS w, COALESCE(SUM(s.losses), 0) AS l
               FROM players p LEFT JOIN scores s ON s.player_id = p.id
               WHERE p.elo IS NOT NULL AND p.rating_excluded = 0
               GROUP BY p.id""")
        rows = await cur.fetchall()
    out = []
    for r in rows:
        g = r["w"] + r["l"]
        out.append({
            "player_id": r["pid"], "name": r["name"], "level": r["level"],
            "photo_url": r["photo_url"], "elo": round(r["elo"], 2),
            "elo_level": elo_to_level(r["elo"]), "verified": bool(r["verified"]),
            "games": g, "win_rate": round(r["w"] / g, 3) if g else 0.0,
        })
    out.sort(key=lambda x: -x["elo"])
    return out


async def get_club_rating(min_games: int = 1):
    """Composite all-time club rating (0..1000), 'Balanced' profile.

        R = 1000 * (0.45*Q + 0.20*A + 0.20*V + 0.15*F)

    Q quality  — opponent-adjusted, shrunk win-rate (core skill signal).
    A titles   — achievements: champions/podiums in finished tournaments.
    V volume    — experience: log(games), so one great tournament can't top it.
    F form      — last-30d shrunk win-rate; neutral (0.5) if no recent games.

    Each component is normalised to 0..1, then weighted. Shrinkage pulls small
    samples toward 50% so e.g. a 7-0 newcomer doesn't outrank veterans."""
    import math
    from datetime import datetime, timedelta
    from .pairing import level_value

    wQ, wA, wV, wF = 0.45, 0.20, 0.20, 0.15
    K_Q, K_F, RECENT_DAYS = 8, 4, 30
    since = (datetime.utcnow() - timedelta(days=RECENT_DAYS)).strftime("%Y-%m-%d %H:%M:%S")

    async with conn() as db:
        cur = await db.execute("SELECT id, name, level, photo_url FROM players")
        players = {r["id"]: row_to_dict(r) for r in await cur.fetchall()}
        lvl = {pid: level_value(p["level"]) for pid, p in players.items()}
        cur = await db.execute(
            """SELECT m.p1, m.p2, m.p3, m.p4, m.winner, t.created_at, t.mode
               FROM matches m JOIN rounds r ON r.id=m.round_id
               JOIN tournaments t ON t.id=r.tournament_id
               WHERE m.winner IS NOT NULL""")
        matches = await cur.fetchall()
        cur = await db.execute(
            """SELECT s.tournament_id AS tid, s.player_id AS pid, s.points, s.wins
               FROM scores s JOIN tournaments t ON t.id=s.tournament_id
               WHERE t.status='finished'""")
        score_rows = await cur.fetchall()

    DEF = level_value("C")
    # raw games/wins → display; wg/ww/opp_sum/rg/rw weighted (casual counts less).
    agg = {pid: {"games": 0, "wins": 0, "wg": 0.0, "ww": 0.0, "opp_sum": 0.0,
                 "rg": 0.0, "rw": 0.0} for pid in players}
    for m in matches:
        cr = m["created_at"]
        recent = bool(cr) and str(cr) >= since
        w = CASUAL_RATING_WEIGHT if m["mode"] == "casual" else 1.0
        t1, t2 = (m["p1"], m["p2"]), (m["p3"], m["p4"])
        for team, opp, won in ((t1, t2, m["winner"] == 1), (t2, t1, m["winner"] == 2)):
            opp_lvl = (lvl.get(opp[0], DEF) + lvl.get(opp[1], DEF)) / 2.0
            for pid in team:
                a = agg.get(pid)
                if a is None:
                    continue
                a["games"] += 1
                a["wg"] += w
                a["opp_sum"] += opp_lvl * w
                if won:
                    a["wins"] += 1
                    a["ww"] += w
                if recent:
                    a["rg"] += w
                    if won:
                        a["rw"] += w

    # placements → champions / podiums (dense rank by points,wins per tournament)
    champ = {pid: 0 for pid in players}
    pod = {pid: 0 for pid in players}
    tours = {pid: 0 for pid in players}
    by_tid = {}
    for r in score_rows:
        by_tid.setdefault(r["tid"], []).append((r["pid"], r["points"], r["wins"]))
    for rows in by_tid.values():
        distinct = sorted({(p, w) for (_, p, w) in rows}, reverse=True)
        rankmap = {key: i + 1 for i, key in enumerate(distinct)}
        for pid, p, w in rows:
            if pid not in players:
                continue
            tours[pid] += 1
            place = rankmap[(p, w)]
            if place == 1:
                champ[pid] += 1
            elif place <= 3:
                pod[pid] += 1

    # normalisers (weighted)
    all_wg = sum(a["wg"] for a in agg.values())
    club_opp_mean = (sum(a["opp_sum"] for a in agg.values()) / all_wg) if all_wg else DEF
    max_wg = max((a["wg"] for a in agg.values()), default=1) or 1
    A_raw = {pid: 3 * champ[pid] + pod[pid] for pid in players}
    pos = sorted(v for v in A_raw.values() if v > 0)
    A_norm = max(pos[int(0.95 * (len(pos) - 1))] if pos else 1, 1)  # p95, robust to outliers

    out = []
    for pid, p in players.items():
        a = agg[pid]
        g = a["games"]          # raw count (display + eligibility)
        gw = a["wg"]            # weighted (rating math)
        if g < min_games:
            continue
        shrunk = (a["ww"] + K_Q * 0.5) / (gw + K_Q) if gw else 0.5
        mean_opp = a["opp_sum"] / gw if gw else DEF
        opp_factor = min(1.20, max(0.85, mean_opp / club_opp_mean)) if club_opp_mean else 1.0
        Q = min(1.0, max(0.0, shrunk * opp_factor))
        A = min(1.0, A_raw[pid] / A_norm)
        V = math.log(1 + gw) / math.log(1 + max_wg)
        F = (a["rw"] + K_F * 0.5) / (a["rg"] + K_F) if a["rg"] > 0 else 0.5
        rating = round(1000 * (wQ * Q + wA * A + wV * V + wF * F))
        out.append({
            "player_id": pid, "name": p["name"], "level": p["level"],
            "photo_url": p["photo_url"], "rating": rating,
            "games": g, "wins": a["wins"], "losses": g - a["wins"],
            "win_rate": round(a["wins"] / g, 3) if g else 0.0,
            "champion": champ[pid], "podium": pod[pid], "tournaments": tours[pid],
            "recent_games": round(a["rg"]),
            "components": {"quality": round(Q, 3), "titles": round(A, 3),
                           "volume": round(V, 3), "form": round(F, 3)},
        })
    out.sort(key=lambda x: (-x["rating"], -x["wins"]))
    for i, x in enumerate(out, 1):
        x["rank"] = i
    return out


async def get_club_pairs(min_games: int = 6, limit: int = 20):
    """Best duos club-wide by win-rate (teammates in any match), min games."""
    async with conn() as db:
        cur = await db.execute(
            "SELECT m.p1, m.p2, m.p3, m.p4, m.winner FROM matches m WHERE m.winner IS NOT NULL"
        )
        rows = await cur.fetchall()
        pairs = {}  # frozenset -> [games, wins, (a,b)]
        for m in rows:
            for team, won in (((m["p1"], m["p2"]), m["winner"] == 1),
                              ((m["p3"], m["p4"]), m["winner"] == 2)):
                k = frozenset(team)
                pr = pairs.setdefault(k, [0, 0, team]); pr[0] += 1; pr[1] += 1 if won else 0
        ids = {x for k in pairs for x in k}
        names = {}
        if ids:
            qmarks = ",".join("?" * len(ids))
            cur = await db.execute(f"SELECT id, name FROM players WHERE id IN ({qmarks})", list(ids))
            names = {r["id"]: r["name"] for r in await cur.fetchall()}
    out = [
        {"name_a": names.get(v[2][0], "?"), "name_b": names.get(v[2][1], "?"),
         "games": v[0], "wins": v[1], "win_rate": round(v[1] / v[0], 3)}
        for v in pairs.values() if v[0] >= min_games
    ]
    out.sort(key=lambda x: (-x["win_rate"], -x["games"]))
    return out[:limit]


async def get_club_records():
    """Headline club records + recent champions gallery."""
    from collections import defaultdict
    async with conn() as db:
        cur = await db.execute(
            "SELECT s.player_id AS pid, p.name, SUM(s.points) AS pts, SUM(s.wins) AS w "
            "FROM scores s JOIN players p ON p.id=s.player_id GROUP BY s.player_id"
        )
        agg = rows_to_list(await cur.fetchall())
        cur = await db.execute(
            "SELECT s.tournament_id AS tid, s.player_id AS pid, s.points, s.wins "
            "FROM scores s JOIN tournaments t ON t.id=s.tournament_id WHERE t.status='finished'"
        )
        srows = await cur.fetchall()
        cur = await db.execute("SELECT id, name FROM players")
        names = {r["id"]: r["name"] for r in await cur.fetchall()}
        cur = await db.execute(
            "SELECT m.p1, m.p2, m.p3, m.p4, m.winner FROM matches m "
            "JOIN rounds r ON r.id=m.round_id JOIN tournaments t ON t.id=r.tournament_id "
            "WHERE m.winner IS NOT NULL ORDER BY t.created_at, t.id, r.round_num, m.court_num"
        )
        mrows = await cur.fetchall()
        cur = await db.execute(
            "SELECT id, name, created_at FROM tournaments WHERE status='finished' "
            "ORDER BY created_at DESC, id DESC LIMIT 12"
        )
        recent_t = rows_to_list(await cur.fetchall())

    by_tid = defaultdict(list)
    for r in srows:
        by_tid[r["tid"]].append(r)
    titles = defaultdict(int)
    champ_ids = {}
    for tid, rs in by_tid.items():
        best = max(rs, key=lambda r: (r["points"], r["wins"]))
        winners = [r["pid"] for r in rs if r["points"] == best["points"] and r["wins"] == best["wins"]]
        champ_ids[tid] = winners
        for w in winners:
            titles[w] += 1

    run, best_streak = defaultdict(int), defaultdict(int)
    for m in mrows:
        win = (m["p1"], m["p2"]) if m["winner"] == 1 else (m["p3"], m["p4"])
        los = (m["p3"], m["p4"]) if m["winner"] == 1 else (m["p1"], m["p2"])
        for x in win:
            run[x] += 1; best_streak[x] = max(best_streak[x], run[x])
        for x in los:
            run[x] = 0

    most_points = max(agg, key=lambda r: (r["pts"], r["w"]), default=None)
    most_wins = max(agg, key=lambda r: (r["w"], r["pts"]), default=None)
    mt = max(titles, key=lambda k: titles[k], default=None)
    ls = max(best_streak, key=lambda k: best_streak[k], default=None)
    champions = [
        {"tid": t["id"], "name": t["name"], "created_at": t["created_at"],
         "champion": " & ".join(names.get(w, "?") for w in champ_ids.get(t["id"], [])) or "—"}
        for t in recent_t
    ]
    return {
        "most_points": {"name": most_points["name"], "value": most_points["pts"]} if most_points else None,
        "most_wins": {"name": most_wins["name"], "value": most_wins["w"]} if most_wins else None,
        "most_titles": {"name": names.get(mt), "value": titles[mt]} if mt else None,
        "longest_streak": {"name": names.get(ls), "value": best_streak[ls]} if ls else None,
        "champions": champions,
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


async def record_match_score(match_id: int, score1: int, score2: int):
    """Record a game score (score-based modes like groups8). Stores both scores,
    derives the winner from them, then recomputes the tournament's scores."""
    if score1 < 0 or score2 < 0:
        raise ValueError("Счёт не может быть отрицательным")
    if score1 == score2:
        raise ValueError("Счёт не может быть равным — нужен победитель")
    winner = 1 if score1 > score2 else 2

    async with conn() as db:
        await db.execute("BEGIN")
        try:
            cur = await db.execute(
                """SELECT r.tournament_id FROM matches m JOIN rounds r ON r.id=m.round_id
                   WHERE m.id=?""",
                (match_id,),
            )
            row = await cur.fetchone()
            if not row:
                raise ValueError("Match not found")
            tid = row["tournament_id"]
            await db.execute(
                "UPDATE matches SET score1=?, score2=?, winner=? WHERE id=?",
                (score1, score2, winner, match_id),
            )
            await _recompute_scores(db, tid)
            await db.commit()
        except Exception:
            await db.rollback()
            raise

    return {"ok": True, "match_id": match_id, "winner": winner, "score1": score1, "score2": score2}


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

        # Americano: schedule is a fixed round-robin, not result-driven. Reveal
        # the next pre-determined round (or finish once every pair has met).
        if t["mode"] == "americano":
            cur = await db.execute(
                "SELECT player_id FROM tournament_players WHERE tournament_id=? ORDER BY position",
                (tid,),
            )
            ordered_ids = [r["player_id"] for r in await cur.fetchall()]
            total = americano_total_rounds(len(ordered_ids))
            new_round_num = round_obj["round_num"] + 1

            await db.execute("UPDATE rounds SET status='done' WHERE id=?", (round_obj["id"],))

            if new_round_num > total:
                # All pairs have played each other — end the tournament.
                await db.execute("UPDATE tournaments SET status='finished' WHERE id=?", (tid,))
                await db.commit()
                return {"ok": True, "finished": True}

            cur = await db.execute(
                "INSERT INTO rounds(tournament_id, round_num) VALUES(?,?)", (tid, new_round_num)
            )
            new_round_id = cur.lastrowid
            for c in _americano_round_courts(ordered_ids, new_round_num):
                t1, t2 = c["team1"], c["team2"]
                await db.execute(
                    "INSERT INTO matches(round_id, court_num, p1, p2, p3, p4) VALUES(?,?,?,?,?,?)",
                    (new_round_id, c["court_num"],
                     t1[0]["player_id"], t1[1]["player_id"], t2[0]["player_id"], t2[1]["player_id"]),
                )
            await db.execute("UPDATE tournaments SET current_round=? WHERE id=?", (new_round_num, tid))
            await db.commit()
            return {"ok": True, "new_round_num": new_round_num}

        # 8-team groups → playoff: group-stage rounds are pre-set; round 4 is
        # seeded from group standings; round 5 from round-4 results; then finish.
        if t["mode"] == "groups8":
            cur = await db.execute(
                "SELECT player_id FROM tournament_players WHERE tournament_id=? ORDER BY position",
                (tid,),
            )
            ordered_ids = [r["player_id"] for r in await cur.fetchall()]
            rn = round_obj["round_num"]
            await db.execute("UPDATE rounds SET status='done' WHERE id=?", (round_obj["id"],))

            if rn >= GROUPS8_ROUNDS:
                await _groups8_finish(db, tid)
                await db.commit()
                return {"ok": True, "finished": True}

            new_round_num = rn + 1
            if rn < 3:
                courts_out = _groups8_group_round_courts(ordered_ids, new_round_num)
            elif rn == 3:
                rankedA, rankedB = await _groups8_standings(db, tid, ordered_ids)
                courts_out = _groups8_semis(rankedA, rankedB)
            else:  # rn == 4 → finals
                courts_out = await _groups8_finals(db, tid)

            cur = await db.execute(
                "INSERT INTO rounds(tournament_id, round_num) VALUES(?,?)", (tid, new_round_num)
            )
            new_round_id = cur.lastrowid
            for c in courts_out:
                t1, t2 = c["team1"], c["team2"]
                await db.execute(
                    "INSERT INTO matches(round_id, court_num, p1, p2, p3, p4) VALUES(?,?,?,?,?,?)",
                    (new_round_id, c["court_num"],
                     t1[0]["player_id"], t1[1]["player_id"], t2[0]["player_id"], t2[1]["player_id"]),
                )
            await db.execute("UPDATE tournaments SET current_round=? WHERE id=?", (new_round_num, tid))
            await db.commit()
            return {"ok": True, "new_round_num": new_round_num}

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
    tp = [p for p in tp if not p.get("eliminated")]  # eliminated players sit out future rounds
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


async def eliminate_and_advance(tid: int, eliminate_ids: list[int]):
    """KotC "вылет": mark the given players as eliminated, re-seed the remaining
    players by current standing onto a reduced court count, and create the next
    round. Used when a court frees up (e.g. one court only for 90 min) and the
    lowest-court losers drop out for the remaining rounds."""
    from .pairing import assign_courts

    elim = set(int(x) for x in (eliminate_ids or []))
    async with conn() as db:
        cur = await db.execute("SELECT * FROM tournaments WHERE id=?", (tid,))
        t = row_to_dict(await cur.fetchone())
        if not t:
            raise ValueError("Турнир не найден")
        if t["mode"] != "rotating":
            raise ValueError("Выбывание доступно только в King of the Court")

        cur = await db.execute(
            "SELECT * FROM rounds WHERE tournament_id=? AND status='active' ORDER BY round_num DESC LIMIT 1",
            (tid,),
        )
        round_obj = row_to_dict(await cur.fetchone())
        if not round_obj:
            raise ValueError("Нет активного раунда")
        cur = await db.execute(
            "SELECT * FROM matches WHERE round_id=?", (round_obj["id"],))
        matches = rows_to_list(await cur.fetchall())
        if any(m["winner"] is None for m in matches):
            raise ValueError("Сначала внесите все результаты раунда")
        if not elim:
            raise ValueError("Не выбран никто на выбывание")

        # remaining players (not already eliminated, not being eliminated now)
        cur = await db.execute(
            "SELECT player_id, position, current_court FROM tournament_players WHERE tournament_id=? AND eliminated=0",
            (tid,),
        )
        prow = {r["player_id"]: r for r in await cur.fetchall()}
        pos = {pid: r["position"] for pid, r in prow.items()}
        cc = {pid: (r["current_court"] or 999) for pid, r in prow.items()}
        remaining = [pid for pid in pos if pid not in elim]
        if len(remaining) < 4 or len(remaining) % 4 != 0:
            raise ValueError(
                f"После выбывания должно остаться кратно 4 игрока (сейчас {len(remaining)})")
        new_num = len(remaining) // 4
        rn = round_obj["round_num"]

        # Re-seed by the normal KotC ladder: winners move UP a court, losers move
        # DOWN — then drop the eliminated. So court-1 losers go down, bottom-court
        # survivors merge up, and the freed bottom court collapses. (Earlier this
        # kept everyone on their court, which is what Liza saw as "broken".)
        from .pairing import move_players_after_round
        match_dicts = [{
            "court_num": m["court_num"], "winner": m["winner"],
            "team1": [{"player_id": m["p1"]}, {"player_id": m["p2"]}],
            "team2": [{"player_id": m["p3"]}, {"player_id": m["p4"]}],
        } for m in matches]
        moved = move_players_after_round(match_dicts, t["num_courts"])
        remaining.sort(key=lambda pid: (moved.get(pid, cc[pid]), pos[pid]))

        # mark eliminated (with the round, so undo can reverse it)
        for pid in elim:
            await db.execute(
                "UPDATE tournament_players SET eliminated=1, eliminated_round=? WHERE tournament_id=? AND player_id=?",
                (rn, tid, pid))
        # re-seed remaining onto new courts (top of hierarchy → court 1, etc.)
        for i, pid in enumerate(remaining):
            await db.execute(
                "UPDATE tournament_players SET current_court=? WHERE tournament_id=? AND player_id=?",
                (i // 4 + 1, tid, pid))
        await db.execute("UPDATE tournaments SET num_courts=? WHERE id=?", (new_num, tid))
        await db.execute("UPDATE rounds SET status='done' WHERE id=?", (round_obj["id"],))
        new_round_num = round_obj["round_num"] + 1
        await db.execute("UPDATE tournaments SET current_round=? WHERE id=?", (new_round_num, tid))
        await db.commit()

    tp = [p for p in await get_tournament_players(tid) if not p.get("eliminated")]
    pair_hist = await get_pair_history(tid)
    last_partners = await get_previous_round_partners(tid)
    courts_out = assign_courts(tp, new_num, pair_hist, last_partners)

    async with conn() as db:
        cur = await db.execute(
            "INSERT INTO rounds(tournament_id, round_num) VALUES(?,?)", (tid, new_round_num))
        new_round_id = cur.lastrowid
        for c in courts_out:
            t1, t2 = c["team1"], c["team2"]
            await db.execute(
                "INSERT INTO matches(round_id, court_num, p1, p2, p3, p4) VALUES(?,?,?,?,?,?)",
                (new_round_id, c["court_num"],
                 t1[0]["player_id"], t1[1]["player_id"], t2[0]["player_id"], t2[1]["player_id"]))
            pa, pb = sorted([t1[0]["player_id"], t1[1]["player_id"]])
            pc, pd = sorted([t2[0]["player_id"], t2[1]["player_id"]])
            for (a, b) in ((pa, pb), (pc, pd)):
                await db.execute(
                    """INSERT INTO pair_history(tournament_id, player_a, player_b, last_round, count)
                       VALUES(?,?,?,?,1)
                       ON CONFLICT(tournament_id, player_a, player_b)
                       DO UPDATE SET last_round=excluded.last_round, count=count+1""",
                    (tid, a, b, new_round_num))
        await db.commit()

    return {"ok": True, "new_round_num": new_round_num,
            "eliminated": len(elim), "num_courts": new_num}


async def undo_last_round(tid: int):
    """Roll the tournament back to the previous round. Deletes the latest round
    (its matches + pair_history contributions) and re-activates the one before
    it, restoring each player's court to that round's placement. Use when a
    wrong result was entered and the next round was already generated: undo →
    fix the winner in the now-active previous round → advance again to
    regenerate the next round with the corrected standings.

    The latest round's recorded results (if any) are discarded — they'd be
    meaningless once pairings change, so the caller confirms before calling."""
    async with conn() as db:
        await db.execute("BEGIN")
        try:
            cur = await db.execute(
                "SELECT * FROM rounds WHERE tournament_id=? ORDER BY round_num DESC LIMIT 1",
                (tid,),
            )
            latest = await cur.fetchone()
            if not latest:
                raise ValueError("No rounds to undo")
            if latest["round_num"] <= 1:
                raise ValueError("Нельзя откатить первый раунд")

            prev_num = latest["round_num"] - 1
            cur = await db.execute(
                "SELECT * FROM rounds WHERE tournament_id=? AND round_num=?",
                (tid, prev_num),
            )
            prev = await cur.fetchone()
            if not prev:
                raise ValueError("Previous round not found")

            # Drop the latest round entirely.
            await db.execute("DELETE FROM matches WHERE round_id=?", (latest["id"],))
            await db.execute("DELETE FROM rounds WHERE id=?", (latest["id"],))

            # Re-activate the previous round and rewind the tournament pointer.
            # status -> 'active' also un-finishes a tournament if it was ended.
            await db.execute("UPDATE rounds SET status='active' WHERE id=?", (prev["id"],))
            await db.execute(
                "UPDATE tournaments SET current_round=?, status='active' WHERE id=?",
                (prev_num, tid),
            )

            # Restore each player's current_court to their court in the now-active
            # round (where they physically were before the rolled-back round).
            cur = await db.execute(
                "SELECT court_num, p1, p2, p3, p4 FROM matches WHERE round_id=?",
                (prev["id"],),
            )
            for m in await cur.fetchall():
                for pid in (m["p1"], m["p2"], m["p3"], m["p4"]):
                    await db.execute(
                        "UPDATE tournament_players SET current_court=? WHERE tournament_id=? AND player_id=?",
                        (m["court_num"], tid, pid),
                    )

            # If the undone round followed an elimination (players left after the
            # now-active round), reverse it: bring them back and restore courts.
            cur = await db.execute(
                "SELECT COUNT(*) AS c FROM tournament_players WHERE tournament_id=? AND eliminated_round=?",
                (tid, prev_num),
            )
            if (await cur.fetchone())["c"]:
                await db.execute(
                    "UPDATE tournament_players SET eliminated=0, eliminated_round=NULL "
                    "WHERE tournament_id=? AND eliminated_round=?",
                    (tid, prev_num),
                )
                cur = await db.execute(
                    "SELECT COUNT(*) AS c FROM tournament_players WHERE tournament_id=? AND eliminated=0",
                    (tid,),
                )
                active = (await cur.fetchone())["c"]
                await db.execute(
                    "UPDATE tournaments SET num_courts=? WHERE id=?", (max(1, active // 4), tid))

            await _recompute_pair_history(db, tid)
            await _recompute_scores(db, tid)
            await db.commit()
        except Exception:
            await db.rollback()
            raise

    return {"ok": True, "active_round": prev_num}


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


# ─── Team Americano (fixed-pair round-robin) ──────────────

def _round_robin_pairs(n: int) -> list[list[tuple[int, int]]]:
    """Circle-method round-robin over n teams (n even, >= 2). Returns n-1
    rounds, each a list of (teamA_idx, teamB_idx) with 0-based team indices —
    every team meets every other exactly once."""
    if n < 2 or n % 2 != 0:
        raise ValueError("round-robin needs an even number of teams >= 2")
    rot = list(range(1, n))
    rounds = []
    for _ in range(n - 1):
        order = [0] + rot
        rounds.append([(order[i], order[n - 1 - i]) for i in range(n // 2)])
        rot = [rot[-1]] + rot[:-1]  # rotate all but the fixed team 0
    return rounds


def americano_total_rounds(player_count: int) -> int:
    """Number of rounds in a fixed-pair americano with `player_count` players."""
    return max(0, (player_count // 2) - 1)


def _americano_round_courts(ordered_player_ids: list[int], round_num: int) -> list[dict]:
    """Courts for a 1-based round of a fixed-pair americano. Pairs are adjacent
    positions (p[0]&p[1], p[2]&p[3], ...); one match per court. Deterministic
    from the player order, so it can be regenerated on each advance."""
    n_pairs = len(ordered_player_ids) // 2
    schedule = _round_robin_pairs(n_pairs)
    if round_num < 1 or round_num > len(schedule):
        return []
    pairs = [(ordered_player_ids[2 * k], ordered_player_ids[2 * k + 1]) for k in range(n_pairs)]
    out = []
    for ci, (a, b) in enumerate(schedule[round_num - 1]):
        pa, pb = pairs[a], pairs[b]
        out.append({
            "court_num": ci + 1,
            "team1": [{"player_id": pa[0]}, {"player_id": pa[1]}],
            "team2": [{"player_id": pb[0]}, {"player_id": pb[1]}],
        })
    return out


# ─── 8-team groups + playoff (score-based) ────────────────
#
# 16 players = 8 fixed pairs. Pairs 0-3 = group A, 4-7 = group B (by entry
# order). Rounds 1-3: group round-robin (A on courts 1-2, B on courts 3-4).
# Round 4: semis A1-B2 / B1-A2 (courts 1-2) + placement A3-B4 / A4-B3 (3-4).
# Round 5: finals — 1st (c1), 3rd (c2), 5th (c3), 7th (c4) place matches.
# Results are entered as game scores; group order is wins, then game diff.

GROUPS8_ROUNDS = 5
_RR4 = [[(0, 3), (1, 2)], [(0, 2), (3, 1)], [(0, 1), (2, 3)]]  # round-robin of 4


def _groups8_pairs(ordered_player_ids: list[int]) -> list[tuple[int, int]]:
    return [(ordered_player_ids[2 * k], ordered_player_ids[2 * k + 1]) for k in range(8)]


def _court(out, court_num, ta, tb):
    out.append({
        "court_num": court_num,
        "team1": [{"player_id": ta[0]}, {"player_id": ta[1]}],
        "team2": [{"player_id": tb[0]}, {"player_id": tb[1]}],
    })


def _groups8_group_round_courts(ordered_player_ids: list[int], round_num: int) -> list[dict]:
    """Group-stage round (1..3): group A on courts 1-2, group B on courts 3-4."""
    pairs = _groups8_pairs(ordered_player_ids)
    A, B = pairs[0:4], pairs[4:8]
    out = []
    for ci, (a, b) in enumerate(_RR4[round_num - 1]):
        _court(out, ci + 1, A[a], A[b])
    for ci, (a, b) in enumerate(_RR4[round_num - 1]):
        _court(out, ci + 3, B[a], B[b])
    return out


def _winner_loser(m) -> tuple[tuple, tuple]:
    """(winning team, losing team) tuples from a match row with winner set."""
    t1, t2 = (m["p1"], m["p2"]), (m["p3"], m["p4"])
    return (t1, t2) if m["winner"] == 1 else (t2, t1)


async def _groups8_standings(db, tid: int, ordered_player_ids: list[int]):
    """Returns (rankedA, rankedB): each 4 team tuples best-first. Order (Liza
    2026-06-27): wins → head-to-head among teams tied on wins (личные встречи)
    → OVERALL game difference across all group games, losses included → overall
    games-for → entry order. A 3-way cycle is head-to-head-circular and falls
    through to game difference; a 2-way tie is decided by the direct result."""
    pairs = _groups8_pairs(ordered_player_ids)
    A, B = pairs[0:4], pairs[4:8]
    stats = {frozenset(p): {"team": p, "wins": 0, "gf": 0, "ga": 0, "order": i,
                            "beat": set()}
             for i, p in enumerate(pairs)}
    cur = await db.execute(
        """SELECT m.p1, m.p2, m.p3, m.p4, m.winner, m.score1, m.score2
           FROM matches m JOIN rounds r ON r.id=m.round_id
           WHERE r.tournament_id=? AND r.round_num<=3""",
        (tid,),
    )
    for m in await cur.fetchall():
        k1, k2 = frozenset((m["p1"], m["p2"])), frozenset((m["p3"], m["p4"]))
        s1, s2 = (m["score1"] or 0), (m["score2"] or 0)
        if k1 in stats:
            stats[k1]["gf"] += s1; stats[k1]["ga"] += s2
        if k2 in stats:
            stats[k2]["gf"] += s2; stats[k2]["ga"] += s1
        if m["winner"] == 1 and k1 in stats:
            stats[k1]["wins"] += 1
            stats[k1]["beat"].add(k2)
        elif m["winner"] == 2 and k2 in stats:
            stats[k2]["wins"] += 1
            stats[k2]["beat"].add(k1)

    def rank(group):
        items = [stats[frozenset(p)] for p in group]
        for s in items:
            # head-to-head wins among teams tied on total wins (личные встречи):
            # resolves a 2-way tie; a 3-way cycle stays tied → falls to game diff
            tied = [o for o in items if o is not s and o["wins"] == s["wins"]]
            s["h2h"] = sum(1 for o in tied if frozenset(o["team"]) in s["beat"])
        # wins → head-to-head → overall game difference → overall games-for → entry
        items.sort(key=lambda s: (
            -s["wins"], -s["h2h"], -(s["gf"] - s["ga"]), -s["gf"], s["order"]))
        return [s["team"] for s in items]

    return rank(A), rank(B)


def _groups8_semis(rankedA, rankedB) -> list[dict]:
    A1, A2, A3, A4 = rankedA
    B1, B2, B3, B4 = rankedB
    out = []
    _court(out, 1, A1, B2)   # SF1
    _court(out, 2, B1, A2)   # SF2
    _court(out, 3, A3, B4)   # placement semi 1
    _court(out, 4, A4, B3)   # placement semi 2
    return out


async def _groups8_finals(db, tid: int) -> list[dict]:
    """Round 5 from round-4 results: finals & placement deciders."""
    cur = await db.execute(
        """SELECT m.court_num, m.p1, m.p2, m.p3, m.p4, m.winner
           FROM matches m JOIN rounds r ON r.id=m.round_id
           WHERE r.tournament_id=? AND r.round_num=4 ORDER BY m.court_num""",
        (tid,),
    )
    by_court = {m["court_num"]: _winner_loser(m) for m in await cur.fetchall()}
    w1, l1 = by_court[1]; w2, l2 = by_court[2]   # championship semis
    w3, l3 = by_court[3]; w4, l4 = by_court[4]   # placement semis
    out = []
    _court(out, 1, w1, w2)   # 1st place
    _court(out, 2, l1, l2)   # 3rd place
    _court(out, 3, w3, w4)   # 5th place
    cur = await db.execute("SELECT skip_7_8 FROM tournaments WHERE id=?", (tid,))
    skip = bool((await cur.fetchone())["skip_7_8"])
    if not skip:
        _court(out, 4, l3, l4)   # 7th place (skipped when one court is short on time)
    return out


async def _groups8_finish(db, tid: int):
    """Compute final 1st-8th placement from rounds 4-5 and write it into scores
    (points = 9 - place so order is correct, with wins/losses across all rounds)."""
    cur = await db.execute(
        """SELECT m.court_num, m.p1, m.p2, m.p3, m.p4, m.winner
           FROM matches m JOIN rounds r ON r.id=m.round_id
           WHERE r.tournament_id=? AND r.round_num=5 ORDER BY m.court_num""",
        (tid,),
    )
    finals = {m["court_num"]: _winner_loser(m) for m in await cur.fetchall()}
    place_of_team = {}  # frozenset(team) -> place 1..8
    court_to_places = {1: (1, 2), 2: (3, 4), 3: (5, 6), 4: (7, 8)}
    for court, (winp, losep) in court_to_places.items():
        if court in finals:
            w, l = finals[court]
            place_of_team[frozenset(w)] = winp
            place_of_team[frozenset(l)] = losep
        # court 4 (7-8) skipped → those two teams stay unranked (no scores row,
        # so they won't appear in the final leaderboard).

    # Per-player wins/losses across every round.
    cur = await db.execute(
        """SELECT m.p1, m.p2, m.p3, m.p4, m.winner
           FROM matches m JOIN rounds r ON r.id=m.round_id
           WHERE r.tournament_id=? AND m.winner IS NOT NULL""",
        (tid,),
    )
    wl = {}  # player_id -> [wins, losses]
    for m in await cur.fetchall():
        win = (m["p1"], m["p2"]) if m["winner"] == 1 else (m["p3"], m["p4"])
        los = (m["p3"], m["p4"]) if m["winner"] == 1 else (m["p1"], m["p2"])
        for p in win:
            wl.setdefault(p, [0, 0])[0] += 1
        for p in los:
            wl.setdefault(p, [0, 0])[1] += 1

    await db.execute("DELETE FROM scores WHERE tournament_id=?", (tid,))
    for team_key, place in place_of_team.items():
        for pid in team_key:
            w, l = wl.get(pid, [0, 0])
            await db.execute(
                "INSERT INTO scores(tournament_id, player_id, points, wins, losses) VALUES(?,?,?,?,?)",
                (tid, pid, 9 - place, w, l),
            )
    await db.execute("UPDATE tournaments SET status='finished' WHERE id=?", (tid,))


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
    court_labels: dict[int, str] | None = None,
    skip_7_8: bool = False,
) -> dict:
    """Create a new tournament with players, generate round 1, and activate it.

    `court_labels` optionally maps court_num -> display label (e.g. the real
    club court number). Internal court_num still drives ranking/movement."""
    from .pairing import assign_courts
    import random

    if mode not in ("rotating", "fixed", "americano", "groups8"):
        raise ValueError("mode must be 'rotating', 'fixed', 'americano' or 'groups8'")
    if initial_order not in ("keep", "random"):
        raise ValueError("initial_order must be 'keep' or 'random'")
    if len(player_ids) % 4 != 0:
        raise ValueError("player count must be divisible by 4")

    if mode == "groups8":
        # 8 fixed pairs (16 players), 4 courts, score-based. Points are derived
        # from final placement on finish, so court points don't apply.
        if len(player_ids) != 16:
            raise ValueError("Турнир на 8 команд: нужно ровно 16 игроков (8 пар)")
        num_courts = 4
        court_points = {}
        initial_points = 1
        start_round = 10 ** 9
    elif mode == "americano":
        # Fixed-pair round-robin: pairs = players/2 (even), one match per court
        # each round, every pair meets every other once. Always 1 point per win,
        # so court points / start_round don't apply.
        num_courts = len(player_ids) // 4
        court_points = {}
        initial_points = 1
        start_round = 10 ** 9
        if num_courts < 1:
            raise ValueError("Need at least 4 players (2 pairs) for americano")
    else:
        if num_courts < 1 or num_courts > 8:
            raise ValueError("num_courts out of range")
        if len(player_ids) // 4 < num_courts:
            raise ValueError("Not enough players for the requested number of courts")

    # Apply ordering
    ordered = list(player_ids)
    if initial_order == "random":
        if mode == "rotating":
            # KotC — individual seeding, shuffle players.
            random.shuffle(ordered)
        else:
            # Fixed-pair modes (fixed/americano/groups8): pairs are adjacent
            # positions and are FIXED. Shuffle whole pairs (keep partners
            # together) so they're randomly spread across groups/courts.
            pairs = [ordered[i:i + 2] for i in range(0, len(ordered) - len(ordered) % 2, 2)]
            random.shuffle(pairs)
            rest = ordered[len(pairs) * 2:]  # odd leftover (not expected here)
            ordered = [p for pr in pairs for p in pr] + rest

    async with conn() as db:
        await db.execute("BEGIN")
        try:
            cur = await db.execute(
                """INSERT INTO tournaments(name, num_courts, mode, initial_order, initial_points, start_round, status, current_round, skip_7_8)
                   VALUES(?,?,?,?,?,?,'active',1,?)""",
                (name.strip(), num_courts, mode, initial_order, initial_points, start_round,
                 1 if skip_7_8 else 0),
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

            # court points (+ optional display labels). Iterate over the actual
            # courts (1..num_courts) so labels are stored even for derived modes
            # (groups8/americano) where court_points is empty.
            labels = court_labels or {}
            for cn in range(1, num_courts + 1):
                pts = court_points.get(cn, 0)
                raw = labels.get(cn) if isinstance(labels, dict) else None
                label = (str(raw).strip() or None) if raw is not None else None
                # Don't store a label that's just the court's own number — the UI
                # falls back to court_num anyway, keeps data clean.
                if label == str(cn):
                    label = None
                if pts == 0 and label is None:
                    continue  # nothing to store for this court
                await db.execute(
                    "INSERT INTO court_points(tournament_id, court_num, points, label) VALUES(?,?,?,?)",
                    (tid, cn, pts, label),
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
    if mode == "groups8":
        ordered_ids = [p["player_id"] for p in sorted(tp, key=lambda x: x["position"])]
        courts_out = _groups8_group_round_courts(ordered_ids, 1)
    elif mode == "americano":
        ordered_ids = [p["player_id"] for p in sorted(tp, key=lambda x: x["position"])]
        courts_out = _americano_round_courts(ordered_ids, 1)
    elif mode == "fixed":
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
    elif initial_order == "keep":
        # "By Entry": court members AND pairs strictly by entry order
        # (court1 = entries 1-4 as 1+2 vs 3+4, etc.). Balancing kicks in only
        # from round 2 onward via the KotC movement.
        sorted_players = sorted(tp, key=lambda x: (x["current_court"] or 999, x["position"]))
        courts_out = []
        for ci in range(num_courts):
            chunk = sorted_players[ci * 4:ci * 4 + 4]
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
        lines.append(f"🏟 КОРТ {m.get('court_label') or m['court_num']}")
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


# ─── Phase 4 — post-tournament cards (data) ──────────────────────────────

async def get_tournament_cards(tid: int):
    """Per-player card payload for a finished tournament: dense place, medal,
    partner (fixed mode), W/L line, recipient identity. Used by the send flow."""
    async with conn() as db:
        cur = await db.execute(
            "SELECT id, name, mode, created_at, status FROM tournaments WHERE id=?", (tid,))
        t = row_to_dict(await cur.fetchone())
        if not t:
            return None
        cur = await db.execute(
            """SELECT s.player_id AS pid, s.points, s.wins, s.losses,
                      p.name, p.telegram_id, p.photo_url, p.lang
               FROM scores s JOIN players p ON p.id=s.player_id
               WHERE s.tournament_id=?""", (tid,))
        rows = rows_to_list(await cur.fetchall())
        cur = await db.execute(
            "SELECT player_id, position FROM tournament_players WHERE tournament_id=?", (tid,))
        pos = {r["player_id"]: r["position"] for r in await cur.fetchall()}

    names = {r["pid"]: r["name"] for r in rows}
    by_pos = {p: pid for pid, p in pos.items()}
    distinct = sorted({(r["points"], r["wins"]) for r in rows}, reverse=True)
    rank = {k: i + 1 for i, k in enumerate(distinct)}

    cr = str(t["created_at"])
    date = f"{cr[8:10]}.{cr[5:7]}" if len(cr) >= 10 else cr  # dd.mm

    cards = []
    for r in rows:
        place = rank[(r["points"], r["wins"])]
        partner = None
        if t["mode"] == "fixed":
            mp = pos.get(r["pid"])
            if mp:
                pp = mp + 1 if mp % 2 == 1 else mp - 1
                partner = names.get(by_pos.get(pp))
        initials = "".join(w[0] for w in r["name"].split()[:2]).upper() or "?"
        cards.append({
            "player_id": r["pid"], "name": r["name"], "telegram_id": r["telegram_id"],
            "photo_url": r["photo_url"], "initials": initials,
            "place": place, "medal": place if place in (1, 2, 3) else None,
            "partner": partner, "wins": r["wins"], "losses": r["losses"],
            "lang": "en" if (r["lang"] or "ru") == "en" else "ru",
            "tournament": t["name"], "date": date,
        })
    cards.sort(key=lambda c: c["place"])
    linked = [c for c in cards if c["telegram_id"]]
    return {"tournament": t, "cards": cards,
            "linked_count": len(linked), "total_count": len(cards)}


# A card is sent at most once per (tournament, player). The send endpoint is a
# plain admin POST with no idempotency of its own, so pressing "Send" twice used
# to DM every linked player twice. This table is the dedup ledger.
async def _ensure_cards_sent(db):
    await db.execute(
        """CREATE TABLE IF NOT EXISTS cards_sent (
               tournament_id INTEGER NOT NULL,
               player_id     INTEGER NOT NULL,
               sent_at       TEXT NOT NULL DEFAULT (datetime('now')),
               PRIMARY KEY (tournament_id, player_id)
           )""")


async def get_sent_card_player_ids(tid: int) -> set:
    """Player ids that already received a card for this tournament."""
    async with conn() as db:
        await _ensure_cards_sent(db)
        cur = await db.execute(
            "SELECT player_id FROM cards_sent WHERE tournament_id=?", (tid,))
        return {r["player_id"] for r in await cur.fetchall()}


async def mark_card_sent(tid: int, player_id: int):
    """Record a successful send so re-pressing 'Send' skips this player."""
    async with conn() as db:
        await _ensure_cards_sent(db)
        await db.execute(
            "INSERT OR IGNORE INTO cards_sent (tournament_id, player_id) VALUES (?,?)",
            (tid, player_id))
        await db.commit()


# ─── ELO rating (live, per Liza spec) ────────────────────────────────────
# Start = numeric value of the player's level; floor = "level − 1 step"; the
# expected result comes from the ELO gap between the two teams; games with a
# rating_excluded player (the coach) and casual games are ignored. Constants are
# tunable — being calibrated with Liza on dev.
ELO_SCALE = {"D": 1.0, "D+": 1.5, "D+strong": 2.0, "D+ strong": 2.0, "C-": 2.5,
             "C-strong": 3.0, "C- strong": 3.0, "C": 3.5, "C+": 4.0,
             "B": 5.0, "B+": 6.0, "A": 7.0, "A+": 8.0}
_ELO_STEPS = sorted(set(ELO_SCALE.values()))
ELO_S = 1.5           # logistic scale: one level step (0.5) ≈ 68% expected
ELO_K = 0.05          # per-match step (tunable)
ELO_CAL_GAMES = 6     # games to become "verified" (~first tournament)


def elo_level_value(level: str) -> float:
    return ELO_SCALE.get((level or "C").strip(), 3.5)


def elo_floor(value: float) -> float:
    below = [v for v in _ELO_STEPS if v < value]
    return max(below) if below else value


def elo_to_level(value: float) -> str:
    """Nearest named level to an ELO value (for promote/demote suggestions)."""
    return min(ELO_SCALE.items(), key=lambda kv: abs(kv[1] - value))[0]


async def recompute_club_elo(db):
    """Deterministic full recompute of every player's ELO from match history.
    Writes players.elo/verified and per-tournament elo_history. Runs inside the
    caller's transaction (no commit here)."""
    cur = await db.execute("SELECT id, level, rating_excluded FROM players")
    prow = {r["id"]: r for r in await cur.fetchall()}
    elo = {pid: elo_level_value(p["level"]) for pid, p in prow.items()}
    flr = {pid: elo_floor(elo[pid]) for pid in prow}
    games = {pid: 0 for pid in prow}
    excluded = {pid for pid, p in prow.items() if p["rating_excluded"]}

    cur = await db.execute(
        """SELECT m.p1, m.p2, m.p3, m.p4, m.winner, m.score1, m.score2, t.id AS tid
           FROM matches m JOIN rounds r ON r.id=m.round_id
           JOIN tournaments t ON t.id=r.tournament_id
           WHERE t.status='finished' AND m.winner IS NOT NULL AND t.mode!='casual'
           ORDER BY t.created_at, t.id, r.round_num, m.court_num""")
    rows = await cur.fetchall()

    hist = []           # (pid, tid, elo_before_tournament, elo_after, games_after)
    cur_tid = {}        # pid -> tournament currently accumulating
    start_elo = {}      # pid -> elo at the start of that tournament

    def touch(pid, tid):
        if cur_tid.get(pid) != tid:
            if pid in cur_tid:
                hist.append((pid, cur_tid[pid], start_elo[pid], elo[pid], games[pid]))
            cur_tid[pid] = tid
            start_elo[pid] = elo[pid]

    for m in rows:
        ids = [m["p1"], m["p2"], m["p3"], m["p4"]]
        if excluded & set(ids):
            continue
        tid = m["tid"]
        for pid in ids:
            touch(pid, tid)
        A = [m["p1"], m["p2"]]; B = [m["p3"], m["p4"]]
        ea = (elo[A[0]] + elo[A[1]]) / 2
        eb = (elo[B[0]] + elo[B[1]]) / 2
        exp_a = 1 / (1 + 10 ** ((eb - ea) / ELO_S))
        s1, s2 = m["score1"], m["score2"]
        act_a = (s1 / (s1 + s2)) if (s1 is not None and s2 is not None and (s1 + s2) > 0) \
            else (1.0 if m["winner"] == 1 else 0.0)
        d = ELO_K * (act_a - exp_a)
        for pid in A:
            elo[pid] = max(elo[pid] + d, flr[pid]); games[pid] += 1
        for pid in B:
            elo[pid] = max(elo[pid] - d, flr[pid]); games[pid] += 1

    for pid in cur_tid:
        hist.append((pid, cur_tid[pid], start_elo[pid], elo[pid], games[pid]))

    await db.execute("DELETE FROM elo_history")
    for pid, tid, bef, aft, g in hist:
        await db.execute(
            "INSERT INTO elo_history(player_id, tournament_id, elo_before, elo_after, games_after) "
            "VALUES(?,?,?,?,?)", (pid, tid, round(bef, 4), round(aft, 4), g))
    for pid in prow:
        await db.execute(
            "UPDATE players SET elo=?, verified=? WHERE id=?",
            (round(elo[pid], 4), 1 if games[pid] >= ELO_CAL_GAMES else 0, pid))
    return {"players": len(prow), "rated_matches": len(rows), "history_rows": len(hist)}


async def rebuild_elo():
    """Public entrypoint: recompute ELO for the whole club and commit."""
    async with conn() as db:
        res = await recompute_club_elo(db)
        await db.commit()
    return res


async def set_player_lang(pid: int, lang: str):
    """Store the player's UI language (from Telegram language_code) for card localization."""
    lang = "en" if str(lang).lower().startswith("en") else "ru"
    async with conn() as db:
        await db.execute("UPDATE players SET lang=? WHERE id=?", (lang, pid))
        await db.commit()


# ─── Casual (friendly) games ──────────────────────────────
# Participants organise a session of games (≤4 players, rotating pairs, any
# number of games). All players must be linked. Opponents validate (no admin).
# On full confirmation, each game becomes a `matches` row in a hidden 'casual'
# container so it counts in match-derived stats; rating weights them lower.

CASUAL_RATING_WEIGHT = 0.5  # casual games count half toward the composite rating


async def _get_casual_container(db) -> int:
    cur = await db.execute("SELECT id FROM tournaments WHERE mode='casual' LIMIT 1")
    row = await cur.fetchone()
    if row:
        return row["id"]
    cur = await db.execute(
        "INSERT INTO tournaments(name, num_courts, mode, initial_order, initial_points, "
        "start_round, status, current_round) "
        "VALUES('Casual games', 1, 'casual', 'keep', 0, 1, 'casual', 0)")
    return cur.lastrowid


async def _materialize_casual(db, sid: int):
    container = await _get_casual_container(db)
    cur = await db.execute(
        "INSERT INTO rounds(tournament_id, round_num) "
        "VALUES(?, (SELECT COALESCE(MAX(round_num),0)+1 FROM rounds WHERE tournament_id=?))",
        (container, container))
    rid = cur.lastrowid
    cur = await db.execute("SELECT * FROM casual_games WHERE session_id=?", (sid,))
    for g in await cur.fetchall():
        winner = 1 if g["score1"] > g["score2"] else 2
        c = await db.execute(
            "INSERT INTO matches(round_id, court_num, p1, p2, p3, p4, winner, score1, score2) "
            "VALUES(?,1,?,?,?,?,?,?,?)",
            (rid, g["p1"], g["p2"], g["p3"], g["p4"], winner, g["score1"], g["score2"]))
        await db.execute("UPDATE casual_games SET match_id=? WHERE id=?", (c.lastrowid, g["id"]))
    await _recompute_scores(db, container)


async def _maybe_approve_casual(db, sid: int) -> bool:
    cur = await db.execute("SELECT confirmed FROM casual_confirm WHERE session_id=?", (sid,))
    confs = [r["confirmed"] for r in await cur.fetchall()]
    if any(c == -1 for c in confs):
        await db.execute("UPDATE casual_sessions SET status='disputed' WHERE id=?", (sid,))
        await db.commit()
        return False
    if confs and all(c == 1 for c in confs):
        await _materialize_casual(db, sid)
        await db.execute("UPDATE casual_sessions SET status='approved' WHERE id=?", (sid,))
        await db.commit()
        return True
    return False


async def create_casual_session(created_by: int, games: list, court_label=None, note=None):
    from datetime import datetime
    if not games:
        raise ValueError("Добавьте хотя бы один гейм")
    parts = set()
    for g in games:
        ids = [g["p1"], g["p2"], g["p3"], g["p4"]]
        if len(set(ids)) != 4:
            raise ValueError("В гейме все 4 игрока должны быть разными")
        if int(g["score1"]) == int(g["score2"]):
            raise ValueError("Счёт не может быть ничейным")
        parts.update(ids)
    if len(parts) > 4:
        raise ValueError("Максимум 4 игрока на сессию")
    if created_by not in parts:
        raise ValueError("Автор должен сам играть в сессии")
    async with conn() as db:
        qm = ",".join("?" * len(parts))
        cur = await db.execute(f"SELECT id, telegram_id FROM players WHERE id IN ({qm})", list(parts))
        prows = {r["id"]: r for r in await cur.fetchall()}
        for pid in parts:
            if pid not in prows or not prows[pid]["telegram_id"]:
                raise ValueError("Все игроки должны быть зарегистрированы и привязаны к Telegram")
        cur = await db.execute(
            "INSERT INTO casual_sessions(created_by, played_at, court_label, note) VALUES(?,?,?,?)",
            (created_by, datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"), court_label, note))
        sid = cur.lastrowid
        for g in games:
            await db.execute(
                "INSERT INTO casual_games(session_id,p1,p2,p3,p4,score1,score2) VALUES(?,?,?,?,?,?,?)",
                (sid, g["p1"], g["p2"], g["p3"], g["p4"], int(g["score1"]), int(g["score2"])))
        for pid in parts:
            await db.execute(
                "INSERT INTO casual_confirm(session_id, player_id, confirmed) VALUES(?,?,?)",
                (sid, pid, 1 if pid == created_by else 0))
        await db.commit()
        await _maybe_approve_casual(db, sid)  # in case author is the only participant (n/a) 
    return {"ok": True, "session_id": sid}


async def confirm_casual(session_id: int, player_id: int, ok: bool):
    async with conn() as db:
        cur = await db.execute("SELECT status FROM casual_sessions WHERE id=?", (session_id,))
        s = await cur.fetchone()
        if not s:
            raise ValueError("Сессия не найдена")
        if s["status"] != "pending":
            raise ValueError("Сессия уже обработана")
        cur = await db.execute(
            "SELECT 1 FROM casual_confirm WHERE session_id=? AND player_id=?", (session_id, player_id))
        if not await cur.fetchone():
            raise ValueError("Вы не участник этой игры")
        await db.execute(
            "UPDATE casual_confirm SET confirmed=? WHERE session_id=? AND player_id=?",
            (1 if ok else -1, session_id, player_id))
        await db.commit()
        await _maybe_approve_casual(db, session_id)
    return {"ok": True}


async def _casual_games_with_names(db, sid: int):
    cur = await db.execute(
        """SELECT g.p1,g.p2,g.p3,g.p4,g.score1,g.score2,
                  a.name n1, b.name n2, c.name n3, d.name n4
           FROM casual_games g
           JOIN players a ON a.id=g.p1 JOIN players b ON b.id=g.p2
           JOIN players c ON c.id=g.p3 JOIN players d ON d.id=g.p4
           WHERE g.session_id=? ORDER BY g.id""", (sid,))
    out = []
    for g in await cur.fetchall():
        out.append({"team1": [g["n1"], g["n2"]], "team2": [g["n3"], g["n4"]],
                    "score1": g["score1"], "score2": g["score2"]})
    return out


async def get_casual_pending_for(player_id: int):
    """Sessions awaiting this player's confirmation."""
    async with conn() as db:
        cur = await db.execute(
            """SELECT s.id, s.created_by, s.played_at, s.court_label, p.name AS author
               FROM casual_sessions s
               JOIN casual_confirm c ON c.session_id=s.id AND c.player_id=? AND c.confirmed=0
               JOIN players p ON p.id=s.created_by
               WHERE s.status='pending' ORDER BY s.created_at DESC""", (player_id,))
        sessions = rows_to_list(await cur.fetchall())
        for s in sessions:
            s["games"] = await _casual_games_with_names(db, s["id"])
        return sessions


async def get_casual_my(player_id: int, limit: int = 10):
    """Recent sessions created by this player + their status/confirm progress."""
    async with conn() as db:
        cur = await db.execute(
            "SELECT id, played_at, court_label, status FROM casual_sessions "
            "WHERE created_by=? ORDER BY created_at DESC LIMIT ?", (player_id, limit))
        sessions = rows_to_list(await cur.fetchall())
        for s in sessions:
            cur = await db.execute(
                "SELECT COUNT(*) AS total, SUM(CASE WHEN confirmed=1 THEN 1 ELSE 0 END) AS ok "
                "FROM casual_confirm WHERE session_id=?", (s["id"],))
            r = await cur.fetchone()
            s["confirmed"] = r["ok"] or 0
            s["participants"] = r["total"] or 0
            s["games"] = await _casual_games_with_names(db, s["id"])
        return sessions
