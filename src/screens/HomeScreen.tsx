import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useNextRound, useFinishTournament } from '../api/mutations';
import { T } from '../lib/tokens';
import { Ring } from '../components/Ring';
import { LeaderboardRow } from '../components/Leaderboard';
import { MainCTA } from '../components/MainCTA';
import { ELabel, EHero, EDivider, EBtn, EGoldFrame, ELogo, EBallIcon } from '../lib/elegant';
import type { ActiveTournamentResponse } from '../lib/types';

interface Props {
  onOpenLiveRound?: () => void;
  onCreateTournament?: () => void;
  onTournamentFinished?: (tid: number) => void;
}

export function HomeScreen({ onOpenLiveRound, onCreateTournament, onTournamentFinished }: Props) {
  const { data, isLoading, error, refetch } = useQuery<ActiveTournamentResponse>({
    queryKey: ['active-tournament'],
    queryFn: () => api('/api/tournaments/active'),
    refetchOnWindowFocus: true,
  });
  const nextRound = useNextRound();
  const finishTour = useFinishTournament();

  if (isLoading) return <HomeSkeleton />;
  if (error) return <HomeError onRetry={() => refetch()} />;

  if (!data?.tournament) return <HomeEmpty onCreate={onCreateTournament} />;

  const { tournament: t, round, leaderboard } = data;
  const total = round?.matches_total ?? 0;
  const recorded = round?.matches_recorded ?? 0;
  const allDone = total > 0 && recorded === total;
  const max = leaderboard?.[0]?.points || 1;
  const totalRounds = t.total_rounds ?? Math.max(t.current_round, 7);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, padding: '4px 16px 16px', overflowY: 'auto' }}>
        <EHero title={t.name.toUpperCase()} compact />
        <EDivider />

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22, marginBottom: 8 }}>
          <Ring size={220} stroke={2} value={t.current_round} max={totalRounds}>
            <ELabel style={{ marginBottom: 4 }}>TOURNAMENT PROGRESS</ELabel>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 64, fontWeight: 600,
              lineHeight: 1, color: T.ink, fontVariantNumeric: 'tabular-nums',
            }}>
              {t.current_round}<span style={{ color: T.muted, fontWeight: 500, fontSize: 38 }}>/{totalRounds}</span>
            </div>
            <ELabel style={{ marginTop: 6 }}>Round</ELabel>
          </Ring>
        </div>

        {round && (
          <EGoldFrame style={{ marginTop: 18, marginBottom: 12 }}>
            <div onClick={onOpenLiveRound} style={{ padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <ELabel>· Live Round · tap to open</ELabel>
                <span style={{ color: T.gold }}>›</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${t.num_courts}, 1fr)`, gap: 8 }}>
                {Array.from({ length: t.num_courts }).map((_, i) => {
                  const m = round.matches[i];
                  const done = m && m.winner !== null;
                  return (
                    <div key={i} style={{
                      background: done ? T.emerald : T.cream,
                      borderRadius: 10, padding: '10px 0', textAlign: 'center',
                      border: `1px solid ${done ? T.emerald : T.paperEdge}`,
                    }}>
                      <div style={{
                        fontFamily: T.fontDisplay, fontSize: 9, letterSpacing: 2,
                        color: done ? T.cream : T.muted,
                      }}>C{i + 1}</div>
                      <div style={{
                        fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 700,
                        color: done ? T.cream : T.muted, marginTop: 4,
                      }}>{done ? '✓' : '—'}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{
                fontFamily: T.fontSerif, fontSize: 13, fontStyle: 'italic',
                color: T.muted, textAlign: 'center', marginTop: 12,
              }}>{recorded} of {total} results recorded</div>
            </div>
          </EGoldFrame>
        )}

        {leaderboard && leaderboard.length > 0 && (
          <div>
            <ELabel style={{ textAlign: 'center', marginBottom: 8 }}>Leaderboard · Top 3</ELabel>
            <EGoldFrame>
              <div style={{ padding: '4px 0' }}>
                {leaderboard.slice(0, 3).map((p, i) => (
                  <LeaderboardRow key={p.player_id} rank={i + 1} player={p} max={max} />
                ))}
              </div>
            </EGoldFrame>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22, opacity: 0.6 }}>
          <EBallIcon size={20} />
        </div>
      </div>

      <div style={{
        padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 6px)',
        borderTop: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        <MainCTA
          label={
            nextRound.isPending ? 'Generating…'
            : allDone ? 'Next round'
            : `Waiting · ${recorded}/${total}`
          }
          disabled={!allDone || nextRound.isPending}
          onClick={() => allDone && nextRound.mutate(t.id)}
        />
        <button
          onClick={async () => {
            const ok = window.Telegram?.WebApp ? true : confirm('End tournament now?');
            if (!ok) return;
            try {
              await finishTour.mutateAsync(t.id);
              onTournamentFinished?.(t.id);
            } catch (e) { alert((e as Error).message); }
          }}
          disabled={finishTour.isPending}
          style={{
            background: 'transparent', border: 'none', color: T.burgundy,
            fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600, letterSpacing: 2,
            width: '100%', padding: 12, textTransform: 'uppercase',
            cursor: finishTour.isPending ? 'wait' : 'pointer',
          }}
        >{finishTour.isPending ? 'Finishing…' : 'End tournament'}</button>
      </div>
    </div>
  );
}

function HomeEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <EHero title="PADEL CLUB" kicker="elegance in motion" compact />
      <div style={{ flex: 1, padding: '12px 22px 18px', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 14,
          background: T.paper, border: `1px solid ${T.paperEdge}`,
          borderRadius: 18, padding: '28px 24px',
          boxShadow: '0 1px 0 rgba(166,134,77,0.08), 0 8px 24px -16px rgba(31,42,36,0.18)',
        }}>
          <ELogo size={80} />
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
              color: T.ink, letterSpacing: 2,
            }}>No Active Tournament</div>
            <div style={{ marginTop: 8 }}><EDivider /></div>
            <div style={{
              fontFamily: T.fontSerif, fontSize: 15, fontStyle: 'italic',
              color: T.muted, lineHeight: 1.45, marginTop: 12, maxWidth: 280,
            }}>
              A fine evening awaits. Begin a tournament and let the play unfold.
            </div>
          </div>
        </div>
      </div>
      <div style={{
        padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 6px)',
        borderTop: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        <MainCTA label="Start new tournament" onClick={onCreate} />
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div style={{ padding: '24px 16px' }}>
      <div className="skeleton" style={{ width: 100, height: 11, margin: '0 auto' }} />
      <div className="skeleton" style={{ width: 180, height: 18, margin: '8px auto 20px' }} />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div className="skeleton" style={{ width: 220, height: 220, borderRadius: '50%' }} />
      </div>
      <div className="skeleton" style={{ height: 130, borderRadius: 14, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 160, borderRadius: 14 }} />
    </div>
  );
}

function HomeError({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14,
    }}>
      <ELogo size={60} color={T.burgundy} />
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
        color: T.ink, letterSpacing: 2, textAlign: 'center',
      }}>Something went amiss</div>
      <EDivider />
      <div style={{
        fontFamily: T.fontSerif, fontSize: 15, fontStyle: 'italic',
        color: T.muted, textAlign: 'center', maxWidth: 260, lineHeight: 1.45,
      }}>We could not load the tournament. Please try again.</div>
      <div style={{ marginTop: 6 }}>
        <EBtn kind="primary" onClick={onRetry}>Retry</EBtn>
      </div>
    </div>
  );
}
