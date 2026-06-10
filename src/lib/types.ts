// Shared types — mirror what the API returns.

export type Side = 'right' | 'left' | 'both' | 'R' | 'L' | 'U';

export interface Player {
  id: number;
  player_id?: number;       // alias used in some endpoints
  name: string;
  level: string;
  side: Side;
}

export interface ScoredPlayer extends Player {
  player_id: number;
  points: number;
  wins: number;
  losses: number;
}

export interface MatchPlayer {
  player_id: number;
  name: string;
  level: string;
  side: Side;
}

export interface Match {
  match_id: number;
  court_num: number;
  court_label?: string | null;  // display label; falls back to court_num
  winner: 1 | 2 | null;
  score1?: number | null;  // games won by team 1 (score-based modes)
  score2?: number | null;
  team1: MatchPlayer[];
  team2: MatchPlayer[];
  points: number;
}

// Per-court tag for the 8-team groups+playoff bracket (round 1-5, court 1-4).
export function groups8CourtTag(roundNum: number, court: number): string | undefined {
  if (roundNum <= 3) return court <= 2 ? 'Группа A' : 'Группа B';
  if (roundNum === 4) return court <= 2 ? '½ финала' : 'Плей-офф 5–8';
  if (roundNum === 5) return ['Финал', 'За 3-е', 'За 5-е', 'За 7-е'][court - 1];
  return undefined;
}

// Court display: custom label if set, otherwise the internal number.
export function courtDisplay(m: { court_label?: string | null; court_num: number }): string {
  return (m.court_label ?? '').toString().trim() || String(m.court_num);
}

export interface Round {
  id: number;
  tournament_id: number;
  round_num: number;
  status: 'active' | 'done';
  matches?: Match[];
  matches_total?: number;
  matches_recorded?: number;
}

export interface Tournament {
  id: number;
  name: string;
  num_courts: number;
  mode: 'fixed' | 'rotating' | 'americano' | 'groups8';
  initial_order: 'keep' | 'random';
  initial_points: number;
  start_round: number;
  status: 'setup' | 'active' | 'finished';
  current_round: number;
  created_at: string;
  total_rounds?: number | null;  // known up-front for americano (round-robin)
}

export interface ScoredPair {
  name_a: string;
  name_b: string;
  points: number;
  wins: number;
  losses: number;
}

export interface ActiveTournamentResponse {
  tournament: Tournament | null;
  round?: Round & { matches: Match[]; matches_total: number; matches_recorded: number };
  leaderboard?: ScoredPlayer[];
}

export interface HistoryItem extends Tournament {
  players_count: number;
  winner: string | null;
}

export interface PlayerStats {
  tournaments: number;
  total_wins: number;
  total_points: number;
  total_losses: number;
}

export interface MonthlyLeaderboardRow extends Player {
  player_id: number;
  points: number;
  wins: number;
  losses: number;
  tournaments: number;
}

export interface MonthlyLeaderboardResponse {
  year: number;
  month: number;
  tournaments_count: number;
  items: MonthlyLeaderboardRow[];
}
