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

export interface FceStandingRow {
  player_id: number;
  name: string;
  level: string;
  photo_url?: string | null;
  fce_verified: boolean;
  elo_start: number;
  elo_now: number;
  growth: number;
  rate: number;
  played: number;
  before: number;
  eligible: boolean;
  place: number | null;
  prize: 'iphone' | 'kit' | null;
}

export interface FceStandings {
  quarter: { code: string; start_date: string; end_date: string; taken_at: string } | null;
  min_tournaments?: number;
  min_before?: number;
  /** Registration link carrying FCE's $1 000 promo; served from config. */
  signup_url?: string;
  rows: FceStandingRow[];
}

export function useFceStandings() {
  return useQuery<FceStandings>({
    queryKey: ['fce-standings'],
    queryFn: () => api('/api/fce/standings'),
  });
}

export function useFceSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { code: string; start_date: string; end_date: string }) =>
      api<{ code: string; players: number }>('/api/admin/fce/snapshot', {
        method: 'POST',
        body: JSON.stringify(v),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fce-admin'] });
      qc.invalidateQueries({ queryKey: ['fce-standings'] });
    },
  });
}

export interface FceVoucher {
  id: number;
  player_id?: number;
  name?: string;
  tournament_id: number | null;
  tournament: string | null;
  issued_at: string;
  expires_at: string;
  redeemed_at: string | null;
  state: 'active' | 'locked' | 'redeemed' | 'expired';
}

export function useMyVouchers() {
  return useQuery<{ vouchers: FceVoucher[]; active: number }>({
    queryKey: ['my-vouchers'],
    queryFn: () => api('/api/me/vouchers'),
  });
}

export function useFceVouchers() {
  return useQuery<{ vouchers: FceVoucher[]; counts: Record<string, number> }>({
    queryKey: ['fce-vouchers'],
    queryFn: () => api('/api/admin/fce/vouchers'),
  });
}

export function useRedeemVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (voucher_id: number) =>
      api<{ ok: boolean }>('/api/admin/fce/vouchers/redeem', {
        method: 'POST',
        body: JSON.stringify({ voucher_id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fce-vouchers'] });
      qc.invalidateQueries({ queryKey: ['my-vouchers'] });
    },
  });
}

export function useBackfillVouchers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (since: string | null) =>
      api<{ tournaments: number; issued: number }>('/api/admin/fce/vouchers/backfill', {
        method: 'POST',
        body: JSON.stringify({ since }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fce-vouchers'] }),
  });
}
