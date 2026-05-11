import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { FinishedCelebration } from './FinishedCelebration';
import { ShareTextModal } from '../components/ShareTextModal';
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
  const [shareText, setShareText] = useState<string | null>(null);

  if (isLoading || !data) {
    return (
      <div style={{
        padding: 24, color: T.muted, textAlign: 'center', marginTop: 80,
        fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 15,
      }}>
        Loading…
      </div>
    );
  }

  const onShareText = async () => {
    try {
      const r = await api<{ text: string }>(`/api/tournaments/${tid}/share`);
      // Prefer Telegram's native share dialog if available; otherwise open
      // our own modal with a textarea — works even when clipboard write is
      // blocked by the WebView (iOS Telegram).
      const tg = window.Telegram?.WebApp as unknown as { openTelegramLink?: (u: string) => void } | undefined;
      if (tg?.openTelegramLink) {
        try {
          tg.openTelegramLink(`https://t.me/share/url?url=&text=${encodeURIComponent(r.text)}`);
          return;
        } catch { /* fall through to modal */ }
      }
      setShareText(r.text);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <>
      <FinishedCelebration
        tournament={data.tournament}
        leaderboard={data.leaderboard}
        onClose={onClose}
        onShareText={onShareText}
      />
      {shareText !== null && (
        <ShareTextModal text={shareText} onClose={() => setShareText(null)} />
      )}
    </>
  );
}
