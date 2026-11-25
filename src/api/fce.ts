import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface FceCandidate {
  id: number;
  name: string;
  level: string;
  score: number;
}

export interface FcePendingRow {
  row_id: number;
  raw: string;
  email: string | null;
  name: string | null;
  imported_at: string;
  candidates: FceCandidate[];
}

export interface FceStats {
  linked: number;
  declared: number;
  verified: number;
  pending: number;
  rows_total: number;
}

/** The player declares the address they registered with on fce.global. */
export function useSetMyFceEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string | null) =>
      api<{ ok: boolean; email: string | null }>('/api/me/fce', {
        method: 'PUT',
        body: JSON.stringify({ email }),
      }),
    onSuccess: () => {
      for (const k of ['profile', 'club-lb', 'elo-lb', 'me']) {
        qc.invalidateQueries({ queryKey: [k] });
      }
    },
  });
}

export function useFceAdmin() {
  return useQuery<{ stats: FceStats; pending: FcePendingRow[] }>({
    queryKey: ['fce-admin'],
    queryFn: () => api('/api/admin/fce'),
  });
}

export function useFceImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      api<Record<string, number>>('/api/admin/fce/import', {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fce-admin'] }),
  });
}

export function useFceResolve() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { row_id: number; player_id: number | null }) =>
      api<{ ok: boolean }>('/api/admin/fce/resolve', {
        method: 'POST',
        body: JSON.stringify(v),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fce-admin'] });
      qc.invalidateQueries({ queryKey: ['club-lb'] });
    },
  });
}
