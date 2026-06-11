import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface JoinRequest {
  id: number;
  tg_id: number;
  username: string | null;
  name: string;
  level: string;
  status: string;
  created_at: string;
}

export function useJoinRequests(status = 'pending') {
  return useQuery<{ items: JoinRequest[] }>({
    queryKey: ['join-requests', status],
    queryFn: () => api(`/api/join-requests?status=${status}`),
  });
}

export function useSubmitJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; level: string }) =>
      api('/api/join-requests', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useReviewJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve' | 'reject' }) =>
      api(`/api/join-requests/${id}/${action}`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['join-requests'] });
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['players'] });
    },
  });
}

export function useUpdateMyRacket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (racket: string) =>
      api('/api/me/profile', { method: 'PUT', body: JSON.stringify({ racket }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
