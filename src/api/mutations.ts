import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from './client';

// A result/roster edit can land in the live round, a past round, or a finished
// tournament — and it shifts standings everywhere. Invalidate every view that
// renders matches or scores so they all refetch.
function invalidateResultViews(qc: QueryClient) {
  for (const key of ['active-tournament', 'round', 'tournament', 'history', 'monthly']) {
    qc.invalidateQueries({ queryKey: [key] });
  }
}

export function useSetWinner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, winner }: { matchId: number; winner: 1 | 2 }) =>
      api(`/api/matches/${matchId}/winner`, {
        method: 'POST',
        body: JSON.stringify({ winner }),
      }),
    onSuccess: () => invalidateResultViews(qc),
  });
}

export interface SwapSlot {
  matchId: number;
  slot: 1 | 2 | 3 | 4;
}

export function useSwapPlayers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ a, b }: { a: SwapSlot; b: SwapSlot }) =>
      api(`/api/rounds/swap`, {
        method: 'POST',
        body: JSON.stringify({
          a_match_id: a.matchId, a_slot: a.slot,
          b_match_id: b.matchId, b_slot: b.slot,
        }),
      }),
    onSuccess: () => invalidateResultViews(qc),
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

export function useReplacePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tid, oldPlayerId, newPlayerId }: {
      tid: number; oldPlayerId: number; newPlayerId: number;
    }) =>
      api(`/api/tournaments/${tid}/replace-player`, {
        method: 'POST',
        body: JSON.stringify({
          old_player_id: oldPlayerId,
          new_player_id: newPlayerId,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-tournament'] });
    },
  });
}
