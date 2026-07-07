import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface LevelSuggestion {
  player_id: number;
  name: string;
  level: string;
  photo_url?: string | null;
  elo: number;
  elo_level: string;
  games: number;
  kind: 'assign' | 'promote' | 'demote';
  suggested: string;
}

export function useLevelSuggestions(enabled = true) {
  return useQuery<{ items: LevelSuggestion[] }>({
    queryKey: ['level-suggestions'],
    queryFn: () => api('/api/level-suggestions'),
    enabled,
  });
}

export function useSetLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pid, level }: { pid: number; level: string }) =>
      api(`/api/players/${pid}/level`, { method: 'POST', body: JSON.stringify({ level }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['level-suggestions'] });
      qc.invalidateQueries({ queryKey: ['club-lb'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['players'] });
    },
  });
}
