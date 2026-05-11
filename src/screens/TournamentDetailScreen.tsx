import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { T } from '../lib/tokens';
import { Label } from '../components/CourtCard';
import type { Round, ScoredPlayer, Tournament } from '../lib/types';

interface Props {
  tid: number;
  onBack: () => void;
  onOpenRound: (roundNum: number) => void;
}

interface Resp {
  tournament: Tournament;
  rounds: Round[];
  leaderboard: ScoredPlayer[];
}

export function TournamentDetailScreen({ tid, onBack, onOpenRound }: Props) {
  const { data, isLoading } = useQuery<Resp>({
    queryKey: ['tournament', tid],
    queryFn: () => api(`/api/tournaments/${tid}`),
  });

  if (isLoading || !data) {
    return (
      <div style={{ padding: 16 }}>
        <div className="skeleton" style={{ height: 60, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 200, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 250 }} />
      </div>
    );
  }

  const { tournament: t, rounds, leaderboard } = data;

  // Dense ranking with (points, wins) tiebreaker — ties share a place,
  // next distinct (points, wins) bumps the place by 1.
  const ranked: { place: number; p: typeof leaderboard[number] }[] = [];
  let lastPts = -1;
  let lastWins = -1;
  let placeNum = 0;
  for (const p of leaderboard) {
    if (p.points !== lastPts || p.wins !== lastWins) {
      placeNum += 1;
      lastPts = p.points;
      lastWins = p.wins;
    }
    ranked.push({ place: placeNum, p });
  }
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: T.textMuted, padding: 4, cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ ...Label(), flex: 1, textAlign: 'center' }}>TOURNAMENT</div>
        <div style={{ width: 30 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{t.name}</div>
          <div style={{ ...Label(), fontSize: 10, marginTop: 6 }}>
            {t.created_at?.slice(0, 10)} · {t.mode.toUpperCase()} · {rounds.length} ROUNDS
          </div>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ ...Label(), marginBottom: 12 }}>FINAL STANDINGS</div>
          {ranked.map(({ place, p }, i) => {
            const isPodium = place <= 3;
            const isGold = place === 1;
            return (
              <div key={p.player_id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: isPodium ? '10px 0' : '8px 0',
                borderBottom: i < ranked.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                {isPodium ? (
                  <span style={{ fontSize: 20, width: 24, textAlign: 'center' }}>{medals[place]}</span>
                ) : (
                  <span style={{ width: 24, fontSize: 11, color: T.textDim, fontWeight: 700, fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>
                    #{place}
                  </span>
                )}
                <span style={{
                  flex: 1, fontSize: isPodium ? 15 : 13,
                  fontWeight: isPodium ? 600 : 500,
                  color: isGold ? T.accent : T.textPrimary,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{p.name}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: isPodium ? 18 : 14, fontWeight: 700,
                    color: isGold ? T.accent : T.textPrimary,
                    lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                  }}>{p.points}</div>
                  <div style={{
                    fontSize: 10, color: T.textDim, marginTop: 3,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    <span style={{ color: T.accent }}>✓{p.wins}</span>
                    <span style={{ marginLeft: 5, color: T.loss }}>✗{p.losses}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ ...Label(), marginBottom: 8, padding: '0 4px' }}>ROUNDS</div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '0 16px' }}>
          {rounds.map((r, i) => (
            <div
              key={r.id}
              onClick={() => onOpenRound(r.round_num)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
                borderBottom: i < rounds.length - 1 ? `1px solid ${T.border}` : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: T.surface2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: T.accent, fontVariantNumeric: 'tabular-nums',
              }}>{r.round_num}</div>
              <div style={{ flex: 1 }}>
                <div style={{ ...Label(), fontSize: 11, color: T.textPrimary, letterSpacing: '0.1em' }}>ROUND {r.round_num}</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{r.status === 'done' ? 'finished' : 'in progress'}</div>
              </div>
              <span style={{ color: T.textMuted, fontSize: 16 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
