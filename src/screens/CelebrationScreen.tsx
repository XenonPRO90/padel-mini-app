import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { FinishedCelebration } from './FinishedCelebration';
import { T } from '../lib/tokens';
import type { Round, ScoredPlayer, Tournament } from '../lib/types';

interface Props {
  tid: number;
  onClose: () => void;
}

interface Resp {
  tournament: Tournament;
  rounds: Round[];
  leaderboard: ScoredPlayer[];
}

export function CelebrationScreen({ tid, onClose }: Props) {
  const { data, isLoading } = useQuery<Resp>({
    queryKey: ['tournament', tid],
    queryFn: () => api(`/api/tournaments/${tid}`),
  });

  if (isLoading || !data) {
    return (
      <div style={{ padding: 24, color: T.textMuted, textAlign: 'center', marginTop: 80 }}>
        Loading…
      </div>
    );
  }

  const onShare = async () => {
    try {
      const r = await api<{ text: string }>(`/api/tournaments/${tid}/share`);
      const tg = window.Telegram?.WebApp as unknown as { openTelegramLink?: (u: string) => void } | undefined;
      const url = `https://t.me/share/url?url=&text=${encodeURIComponent(r.text)}`;
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(url);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(r.text);
        alert('Final table copied to clipboard');
      } else {
        alert(r.text);
      }
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <FinishedCelebration
      tournament={data.tournament}
      leaderboard={data.leaderboard}
      onClose={onClose}
      onShare={onShare}
    />
  );
}
