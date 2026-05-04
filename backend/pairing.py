"""
King of the Court pairing algorithm.

Priority order for pairings (highest first):
0. B+ pairs with the weakest player on court — hard rule for high-level players
   (when a B+ player is on the court, their partner must be the lowest-level
   player among the four). Beats every other rule.
1. Mandatory partner change — partner this round must differ from partner last round
   (pairs containing a B+ are exempt — see MUST_CHANGE_EXEMPT_LEVELS)
2. Court side — avoid pairing two right-handers or two left-handers
   (pairs containing a B+ are exempt; 'both' = universal, never violates)
3. Level balance — both teams should have similar average level, prefer mixed pairs
4. Avoid repeated pairs across the whole tournament
   (pairs containing a B+ are exempt)

When a constraint is physically infeasible on a given court, the algorithm picks
the option with the fewest violations rather than failing.
"""

LEVEL_ORDER = {"A+": 7, "A": 6, "B+": 5, "B": 4, "C+": 3, "C": 2, "C- strong": 1.5, "C-": 1, "D": 0.5}

# Levels exempt from the "mandatory partner change" rule. High-level players are
# typically rare (often only one B+ in a tournament), so forcing them to switch
# partners every round pushes them into worse-balanced pairs.
MUST_CHANGE_EXEMPT_LEVELS = {"B+"}


def level_value(level: str) -> int:
    return LEVEL_ORDER.get(level, 2)


def balance_score(t1_levels, t2_levels) -> float:
    """Lower = more balanced. Compares team level spreads and difference between teams."""
    t1_vals = [level_value(l) for l in t1_levels]
    t2_vals = [level_value(l) for l in t2_levels]
    t1_avg = sum(t1_vals) / len(t1_vals)
    t2_avg = sum(t2_vals) / len(t2_vals)
    t1_spread = max(t1_vals) - min(t1_vals)
    t2_spread = max(t2_vals) - min(t2_vals)
    inter_diff = abs(t1_avg - t2_avg)
    # Reward mixed-level pairs: both teams must be mixed (use min spread)
    return inter_diff - 0.5 * (t1_spread + t2_spread)


def pair_count(pair_history: dict, a: int, b: int) -> int:
    pa, pb = min(a, b), max(a, b)
    return pair_history.get((pa, pb), 0)


def _same_partner_violations(t1, t2, last_partners: dict) -> int:
    """Count pairs where both players were partnered last round.
    Pairs containing an exempt-level player (see MUST_CHANGE_EXEMPT_LEVELS)
    don't count as a violation — for them the rule doesn't apply."""
    v = 0
    for team in (t1, t2):
        if any(p.get("level") in MUST_CHANGE_EXEMPT_LEVELS for p in team):
            continue
        a, b = team[0]["player_id"], team[1]["player_id"]
        if last_partners.get(a) == b:
            v += 1
    return v


def _b_plus_weakest_violations(t1, t2) -> int:
    """Hard rule (Liza): when a B+ (or higher) player is on the court, their
    partner must be the weakest player among the four. Returns violation count.
    Returns 0 if no B+ on court — rule doesn't apply."""
    all_players = t1 + t2
    if not any(p.get("level") in MUST_CHANGE_EXEMPT_LEVELS for p in all_players):
        return 0
    min_lv = min(level_value(p["level"]) for p in all_players)
    violations = 0
    for team in (t1, t2):
        for p in team:
            if p.get("level") not in MUST_CHANGE_EXEMPT_LEVELS:
                continue
            partner = next((q for q in team if q["player_id"] != p["player_id"]), None)
            if partner is not None and level_value(partner["level"]) > min_lv:
                violations += 1
    return violations


def _side_violations(t1, t2) -> int:
    """Count pairs where both players have the same fixed side ('right'+'right' or 'left'+'left').
    'both' (universal) never causes a violation.
    Pairs containing a B+ (or higher) player are exempt — Liza's rule."""
    v = 0
    for team in (t1, t2):
        if any(p.get("level") in MUST_CHANGE_EXEMPT_LEVELS for p in team):
            continue
        s1 = team[0].get("side", "both")
        s2 = team[1].get("side", "both")
        if s1 in ("right", "left") and s1 == s2:
            v += 1
    return v


def best_pairing(players: list, pair_history: dict, last_partners: dict | None = None) -> tuple:
    """
    players: list of 4 dicts with keys: player_id, level, side (optional, defaults 'both')
    last_partners: {player_id: partner_id} from previous round
    Returns: (team1, team2) where team1 = [p1, p2], team2 = [p3, p4]
    """
    last_partners = last_partners or {}
    p = players
    # 3 possible pairings for 4 players: AB|CD, AC|BD, AD|BC
    options = [
        ([p[0], p[1]], [p[2], p[3]]),
        ([p[0], p[2]], [p[1], p[3]]),
        ([p[0], p[3]], [p[1], p[2]]),
    ]

    def option_score(opt):
        t1, t2 = opt
        b_plus_viol = _b_plus_weakest_violations(t1, t2)
        same_partner = _same_partner_violations(t1, t2, last_partners)
        side_viol = _side_violations(t1, t2)
        bal = balance_score(
            [x["level"] for x in t1],
            [x["level"] for x in t2],
        )
        # Repeat penalty — pairs containing a B+ are exempt (Liza's rule)
        repeat_penalty = 0
        for team in (t1, t2):
            if any(p.get("level") in MUST_CHANGE_EXEMPT_LEVELS for p in team):
                continue
            repeat_penalty += pair_count(pair_history, team[0]["player_id"], team[1]["player_id"])
        # Priority: B+-weakest > must-change > side > balance > repeat
        return (b_plus_viol, same_partner, side_viol, bal, repeat_penalty)

    best = min(options, key=option_score)
    return best[0], best[1]


def assign_courts(tournament_players: list, num_courts: int, pair_history: dict, last_partners: dict | None = None) -> list:
    """
    Assign players to courts for a new round.
    tournament_players: list of dicts {player_id, level, side, current_court}
                        sorted by court strength (court 1 = strongest)
    last_partners: {player_id: partner_id} from previous round (None for round 1)
    Returns: list of {court_num, team1: [p,p], team2: [p,p]}
    """
    sorted_players = sorted(
        tournament_players,
        key=lambda x: (x["current_court"] if x["current_court"] is not None else 999, x["position"])
    )

    courts = []
    for court_idx in range(num_courts):
        court_players = sorted_players[court_idx * 4: court_idx * 4 + 4]
        if len(court_players) < 4:
            break
        t1, t2 = best_pairing(court_players, pair_history, last_partners)
        courts.append({
            "court_num": court_idx + 1,
            "team1": t1,
            "team2": t2,
        })
    return courts


def move_players_after_round(matches: list, num_courts: int) -> dict:
    """
    Compute new court assignments after a round.
    matches: list of {court_num, winner, team1: [p], team2: [p]}
    Returns: {player_id: new_court_num}
    """
    court_results = {}
    for m in matches:
        if m["winner"] is None:
            continue
        winners = m["team1"] if m["winner"] == 1 else m["team2"]
        losers = m["team2"] if m["winner"] == 1 else m["team1"]
        court_results[m["court_num"]] = {
            "winners": [p["player_id"] for p in winners],
            "losers": [p["player_id"] for p in losers],
        }

    new_courts = {}
    for court_num in range(1, num_courts + 1):
        if court_num not in court_results:
            continue
        winners = court_results[court_num]["winners"]
        losers = court_results[court_num]["losers"]

        new_winner_court = max(1, court_num - 1)
        new_loser_court = min(num_courts, court_num + 1)

        for pid in winners:
            new_courts[pid] = new_winner_court
        for pid in losers:
            new_courts[pid] = new_loser_court

    return new_courts
