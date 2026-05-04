import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useSetWinner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, winner }: { matchId: number; winner: 1 | 2 }) =>
      api(`/api/matches/${matchId}/winner`, {
        method: 'POST',
        body: JSON.stringify({ winner }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-tournament'] });
    },
  });
}

export function useNextRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tid: number) =>
      api(`/api/tournaments/${tid}/next-round`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-tournament'] });
    },
  });
}

export function useFinishTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tid: number) =>
      api(`/api/tournaments/${tid}/finish`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-tournament'] });
      qc.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
