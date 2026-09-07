import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export type AdminRole = 'full' | 'host';

export interface AdminRow {
  tg_id: number;
  role: AdminRole;
  added_at: string | null;
  player_id: number | null;
  name: string | null;
  username: string | null;
  photo_url: string | null;
}

export function useAdmins() {
  return useQuery<{ items: AdminRow[]; roles: AdminRole[] }>({
    queryKey: ['admins'],
    queryFn: () => api('/api/admins'),
  });
}

function useAdminMutation<T>(fn: (v: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admins'] });
      // Your own rights can change here, and the whole UI keys off them.
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export const useSetAdminRole = () =>
  useAdminMutation(({ tg_id, role }: { tg_id: number; role: AdminRole }) =>
    api(`/api/admins/${tg_id}`, { method: 'PUT', body: JSON.stringify({ role }) }));

export const useAddAdmin = () =>
  useAdminMutation(({ player_id, role }: { player_id: number; role: AdminRole }) =>
    api('/api/admins', { method: 'POST', body: JSON.stringify({ player_id, role }) }));

export const useRemoveAdmin = () =>
  useAdminMutation((tg_id: number) => api(`/api/admins/${tg_id}`, { method: 'DELETE' }));
