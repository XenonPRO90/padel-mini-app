import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { T } from '../lib/tokens';
import { ELabel, EMedal, EPlace, EGoldFrame, EOrnRule } from '../lib/elegant';
import type { Round, ScoredPair, ScoredPlayer, Tournament } from '../lib/types';

interface Props {
  tid: number;
  onBack: () => void;
  onOpenRound: (roundNum: number) => void;
}

interface Resp {
  tournament: Tournament;
  rounds: Round[];
  leaderboard: ScoredPlayer[];
  pair_leaderboard?: ScoredPair[];
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

  const { tournament: t, rounds, leaderboard, pair_leaderboard } = data;

  type Row = { name: string; points: number; wins: number; losses: number };
  const rows: Row[] = t.mode === 'fixed' && pair_leaderboard
    ? pair_leaderboard.map((p) => ({
        name: `${p.name_a} & ${p.name_b}`,
        points: p.points, wins: p.wins, losses: p.losses,
      }))
    : leaderboard.map((p) => ({
        name: p.name, points: p.points, wins: p.wins, losses: p.losses,
      }));

  // Dense ranking with (points, wins) tiebreaker.
  const ranked: { place: number; row: Row }[] = [];
  let lastPts = -1;
  let lastWins = -1;
  let placeNum = 0;
  for (const r of rows) {
    if (r.points !== lastPts || r.wins !== lastWins) {
      placeNum += 1;
      lastPts = r.points;
      lastWins = r.wins;
    }
    ranked.push({ place: placeNum, row: r });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
          color: T.gold, fontFamily: T.fontSerif, fontSize: 14,
        }}>← History</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
            color: T.ink, letterSpacing: 3, textTransform: 'uppercase',
          }}>Tournament</div>
        </div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 18px' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <ELabel>{t.created_at?.slice(0, 10)} · {t.mode} · {rounds.length} rounds</ELabel>
          <div style={{
            marginTop: 4, fontFamily: T.fontDisplay,
            fontSize: 22, fontWeight: 600, letterSpacing: 2, color: T.ink,
          }}>{t.name}</div>
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center' }}>
            <EOrnRule width={220} />
          </div>
        </div>

        <ELabel style={{ marginBottom: 8, textAlign: 'center' }}>Final Standings</ELabel>
        <EGoldFrame>
          <div style={{ padding: '4px 0' }}>
            {ranked.map(({ place, row }, i) => {
              const isPodium = place <= 3;
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr auto 1px auto',
                  alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  borderBottom: i < ranked.length - 1 ? `1px solid ${T.paperEdge}` : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {isPodium ? <EMedal place={place as 1 | 2 | 3} size={26} /> : <EPlace n={place} />}
                  </div>
                  <span style={{
                    fontFamily: T.fontDisplay,
                    fontSize: isPodium ? 16 : 14,
                    fontWeight: isPodium ? 600 : 500,
                    color: T.ink,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{row.name}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{
                      fontFamily: T.fontDisplay, fontWeight: 600,
                      fontSize: isPodium ? 18 : 15, color: T.goldDeep,
                    }}>{row.points}</span>
                    <span style={{
                      fontFamily: T.fontSerif, fontSize: 11,
                      fontStyle: 'italic', color: T.muted,
                    }}>pts</span>
                  </div>
                  <div style={{ width: 1, height: 14, background: T.paperEdge }} />
                  <div style={{ fontFamily: T.fontDisplay, fontSize: 12, letterSpacing: 0.5 }}>
                    <span style={{ color: T.win }}>W {row.wins}</span>
                    <span style={{ margin: '0 4px', color: T.paperEdge }}>·</span>
                    <span style={{ color: T.burgundy }}>L {row.losses}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </EGoldFrame>

        <ELabel style={{ margin: '20px 0 8px', textAlign: 'center' }}>Rounds Played</ELabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rounds.map((r) => (
            <div
              key={r.id}
              onClick={() => onOpenRound(r.round_num)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px',
                background: T.paper, border: `1px solid ${T.paperEdge}`,
                borderRadius: 14, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontFamily: T.fontDisplay, fontSize: 11, letterSpacing: 2, color: T.gold,
                }}>ROUND</span>
                <span style={{
                  fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
                  color: T.ink, fontVariantNumeric: 'tabular-nums',
                }}>{r.round_num}</span>
              </div>
              <span style={{
                fontFamily: T.fontSerif, fontStyle: 'italic',
                fontSize: 13, color: T.muted,
              }}>{r.status === 'done' ? 'finished' : 'in progress'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
