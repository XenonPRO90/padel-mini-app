import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { T } from '../lib/tokens';
import { LevelBadge } from '../components/Badges';
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
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const medals = ['🥇', '🥈', '🥉'];

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
          {top3.map((p, i) => (
            <div key={p.player_id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
              borderBottom: i < 2 ? `1px solid ${T.border}` : 'none',
            }}>
              <span style={{ fontSize: 20 }}>{medals[i]}</span>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: i === 0 ? T.accent : T.textPrimary }}>{p.name}</span>
              <LevelBadge level={p.level} size="sm" />
              <span style={{ fontSize: 18, fontWeight: 700, minWidth: 32, textAlign: 'right', color: i === 0 ? T.accent : T.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
                {p.points}
              </span>
            </div>
          ))}
          {rest.length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
              {rest.map((p, i) => (
                <div key={p.player_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                  <span style={{ width: 22, fontSize: 11, color: T.textDim, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>#{i + 4}</span>
                  <span style={{ flex: 1, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  <LevelBadge level={p.level} size="sm" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.textMuted, minWidth: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {p.points}
                  </span>
                </div>
              ))}
            </div>
          )}
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
