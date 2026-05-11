import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { FinishedCelebration } from './FinishedCelebration';
import { ShareTextModal } from '../components/ShareTextModal';
import { T } from '../lib/tokens';
import type { Round, ScoredPair, ScoredPlayer, Tournament } from '../lib/types';

interface Props {
  tid: number;
  onClose: () => void;
}

interface Resp {
  tournament: Tournament;
  rounds: Round[];
  leaderboard: ScoredPlayer[];
  pair_leaderboard?: ScoredPair[];
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
      // Just open the in-app textarea modal so Roma can copy the
      // standings table and paste it wherever. Earlier we tried
      // tg.openTelegramLink('t.me/share/url?text=...') for one-tap
      // sharing but iOS Telegram WebView redirected to web.telegram.org
      // in a new tab instead of opening the native chat picker, which
      // was a worse experience than the simple copy flow.
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
        pairLeaderboard={data.pair_leaderboard}
        onClose={onClose}
        onShareText={onShareText}
      />
      {shareText !== null && (
        <ShareTextModal text={shareText} onClose={() => setShareText(null)} />
      )}
    </>
  );
}
