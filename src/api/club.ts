import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export interface ClubRow {
  player_id: number;
  name: string;
  level: string;
  photo_url?: string | null;
  points: number;
  wins: number;
  losses: number;
  games: number;
  tournaments: number;
  win_rate: number;
}

export interface ClubPair {
  name_a: string;
  name_b: string;
  games: number;
  wins: number;
  win_rate: number;
}

export interface ClubRecord { name: string | null; value: number }
export interface ClubChampion { tid: number; name: string; created_at: string; champion: string }
export interface ClubRecords {
  most_points: ClubRecord | null;
  most_wins: ClubRecord | null;
  most_titles: ClubRecord | null;
  longest_streak: ClubRecord | null;
  champions: ClubChampion[];
}

export function useClubLeaderboard(period: 'all' | 'month', by: 'points' | 'winrate') {
  return useQuery<{ items: ClubRow[] }>({
    queryKey: ['club-lb', period, by],
    queryFn: () => api(`/api/club/leaderboard?period=${period}&by=${by}`),
  });
}

export function useClubPairs() {
  return useQuery<{ items: ClubPair[] }>({
    queryKey: ['club-pairs'],
    queryFn: () => api('/api/club/pairs'),
  });
}

export function useClubRecords() {
  return useQuery<ClubRecords>({
    queryKey: ['club-records'],
    queryFn: () => api('/api/club/records'),
  });
}
