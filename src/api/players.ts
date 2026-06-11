import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { PlayerProfile } from '../lib/types';

export type SideValue = 'right' | 'left' | 'both';

export function usePlayerProfile(pid: number) {
  return useQuery<PlayerProfile>({
    queryKey: ['profile', pid],
    queryFn: () => api(`/api/players/${pid}/profile`),
  });
}

export interface PlayerInput {
  name: string;
  level: string;
  side: SideValue;
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PlayerInput) =>
      api<{ id: number }>('/api/players', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function useUpdatePlayer(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PlayerInput) =>
      api(`/api/players/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function useDeletePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api(`/api/players/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      num_courts: number;
      mode: 'rotating' | 'fixed' | 'americano' | 'groups8';
      initial_order: 'keep' | 'random';
      initial_points: number;
      start_round: number;
      court_points: Record<number, number>;
      court_labels?: Record<number, string>;
      player_ids: number[];
    }) =>
      api<{ tournament_id: number }>('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-tournament'] });
      qc.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
