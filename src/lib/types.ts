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
  winner: 1 | 2 | null;
  team1: MatchPlayer[];
  team2: MatchPlayer[];
  points: number;
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
  mode: 'fixed' | 'rotating';
  initial_order: 'keep' | 'random';
  initial_points: number;
  start_round: number;
  status: 'setup' | 'active' | 'finished';
  current_round: number;
  created_at: string;
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
