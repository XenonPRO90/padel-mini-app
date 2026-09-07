import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Player } from '../lib/types';

export interface Me {
  user: { id: number; first_name?: string; username?: string };
  // Optional capabilities this instance enables — set per brand on the server.
  features?: { social?: boolean };
  is_admin: boolean;
  player: Player | null;       // linked participant (identity), or null
  join_status: string | null;  // 'pending' | 'approved' | 'rejected' | null
  pending_requests?: number;   // count of pending join requests (admins)
}

// Who am I: admin flag + linked player. Identity rarely changes in a session.
export function useMe() {
  return useQuery<Me>({
    queryKey: ['me'],
    queryFn: () => api('/api/me'),
    staleTime: Infinity,
  });
}
