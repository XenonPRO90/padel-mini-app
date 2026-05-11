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
      // Open Telegram's chat picker directly — the user picks a chat and
      // the standings text is pre-filled. Falls back to in-app textarea
      // modal only if openTelegramLink isn't available or rejects the URL.
      const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(r.text)}`;
      const tg = window.Telegram?.WebApp as unknown as {
        openTelegramLink?: (u: string) => void;
        openLink?: (u: string) => void;
      } | undefined;
      if (tg?.openTelegramLink) {
        try { tg.openTelegramLink(shareUrl); return; } catch { /* try openLink */ }
      }
      if (tg?.openLink) {
        try { tg.openLink(shareUrl); return; } catch { /* try location */ }
      }
      try { window.location.href = shareUrl; return; } catch { /* fall through */ }
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
