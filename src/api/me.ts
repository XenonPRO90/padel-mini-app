import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Player } from '../lib/types';

export interface Me {
  user: { id: number; first_name?: string; username?: string };
  is_admin: boolean;           // any admin — full or host (can run tournaments)
  // 'full' owns the club (roster, join requests, levels, Telegram links);
  // 'host' only runs games. null when not an admin.
  admin_role?: 'full' | 'host' | null;
  is_full_admin?: boolean;
  player: Player | null;       // linked participant (identity), or null
  join_status: string | null;  // 'pending' | 'approved' | 'rejected' | null
  pending_requests?: number;   // count of pending join requests (full admins)
}

// Who am I: admin flag + linked player. Identity rarely changes in a session.
export function useMe() {
  return useQuery<Me>({
    queryKey: ['me'],
    queryFn: () => api('/api/me'),
    staleTime: Infinity,
  });
}
