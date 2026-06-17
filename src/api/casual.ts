import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Player } from '../lib/types';

export interface CasualGameInput {
  p1: number; p2: number; p3: number; p4: number; score1: number; score2: number;
}
export interface CasualGameView {
  team1: [string, string]; team2: [string, string]; score1: number; score2: number;
}
export interface CasualPending {
  id: number; created_by: number; played_at: string; court_label?: string | null;
  author: string; games: CasualGameView[];
}
export interface CasualMine {
  id: number; played_at: string; court_label?: string | null; status: string;
  confirmed: number; participants: number; games: CasualGameView[];
}

export function useLinkedPlayers() {
  return useQuery<{ items: Player[] }>({
    queryKey: ['players-linked'],
    queryFn: () => api('/api/players/linked'),
  });
}

export function useCasualPending() {
  return useQuery<{ items: CasualPending[] }>({
    queryKey: ['casual-pending'],
    queryFn: () => api('/api/casual/pending'),
  });
}

export function useCasualMy() {
  return useQuery<{ items: CasualMine[] }>({
    queryKey: ['casual-my'],
    queryFn: () => api('/api/casual/my'),
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  for (const k of ['casual-pending', 'casual-my', 'profile', 'club-lb', 'active-tournament']) {
    qc.invalidateQueries({ queryKey: [k] });
  }
}

export function useCreateCasual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { games: CasualGameInput[]; court_label?: string; note?: string }) =>
      api('/api/casual', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => invalidate(qc),
  });
}

export function useConfirmCasual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sid, ok }: { sid: number; ok: boolean }) =>
      api(`/api/casual/${sid}/confirm`, { method: 'POST', body: JSON.stringify({ ok }) }),
    onSuccess: () => invalidate(qc),
  });
}
