import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useNextRound, useFinishTournament } from '../api/mutations';
import { T } from '../lib/tokens';
import { Ring } from '../components/Ring';
import { LeaderboardRow } from '../components/Leaderboard';
import { MainCTA } from '../components/MainCTA';
import { Label } from '../components/CourtCard';
import type { ActiveTournamentResponse } from '../lib/types';

interface Props {
  onOpenLiveRound?: () => void;
  onCreateTournament?: () => void;
}

export function HomeScreen({ onOpenLiveRound, onCreateTournament }: Props) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, padding: '12px 16px 16px', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
          <div style={Label()}>TOURNAMENT</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{t.name}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <Ring size={220} stroke={10} value={t.current_round} max={Math.max(t.current_round, 7)}>
            <div style={Label()}>TOURNAMENT PROGRESS</div>
            <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, color: T.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
              {t.current_round}<span style={{ color: T.textDim, fontWeight: 500 }}>/{Math.max(t.current_round, 7)}</span>
            </div>
            <div style={{ ...Label(), marginTop: 6 }}>ROUND</div>
          </Ring>
        </div>

        {round && (
          <div onClick={onOpenLiveRound} style={{
            background: T.surface, border: `1px solid ${T.accent}40`, borderRadius: 14,
            padding: '14px 16px', marginTop: 20, marginBottom: 12, cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ ...Label(), color: T.accent }}>● LIVE ROUND · TAP TO OPEN</span>
              <span style={{ color: T.accent }}>›</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${t.num_courts}, 1fr)`, gap: 8 }}>
              {Array.from({ length: t.num_courts }).map((_, i) => {
                const m = round.matches[i];
                const done = m && m.winner !== null;
                return (
                  <div key={i} style={{
                    background: T.surface2, borderRadius: 10, padding: '10px 0',
                    textAlign: 'center', border: done ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
                  }}>
                    <div style={{ ...Label(), fontSize: 10, color: done ? T.accent : T.textDim }}>C{i + 1}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: done ? T.accent : T.textMuted, marginTop: 4 }}>
                      {done ? '✓' : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', marginTop: 12, letterSpacing: '0.1em' }}>
              {recorded} / {total} RESULTS
            </div>
          </div>
        )}

        {leaderboard && leaderboard.length > 0 && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '14px 16px' }}>
            <div style={{ ...Label(), marginBottom: 4 }}>LEADERBOARD</div>
            {leaderboard.slice(0, 3).map((p, i) => (
              <LeaderboardRow key={p.player_id} rank={i + 1} player={p} max={max} />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${T.border}` }}>
        <MainCTA
          label={
            nextRound.isPending ? 'GENERATING…'
            : allDone ? 'NEXT ROUND'
            : `WAITING · ${recorded}/${total}`
          }
          disabled={!allDone || nextRound.isPending}
          onClick={() => allDone && nextRound.mutate(t.id)}
        />
        <button
          onClick={async () => {
            const ok = window.Telegram?.WebApp ? true : confirm('End tournament now?');
            if (!ok) return;
            try { await finishTour.mutateAsync(t.id); } catch (e) { alert((e as Error).message); }
          }}
          disabled={finishTour.isPending}
          style={{
            background: 'transparent', border: 'none', color: T.loss,
            fontSize: 11, fontWeight: 600, letterSpacing: '0.16em',
            width: '100%', padding: 12, textTransform: 'uppercase',
            cursor: finishTour.isPending ? 'wait' : 'pointer',
          }}
        >{finishTour.isPending ? 'Finishing…' : 'END TOURNAMENT'}</button>
      </div>
    </div>
  );
}

function HomeEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: T.surface,
          }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <path d="M7 4h10v4a5 5 0 11-10 0V4zM4 5h3v3a2 2 0 01-2 2H4V5zm16 0h-3v3a2 2 0 002 2h1V5zM10 14h4v3l1 3H9l1-3v-3z" stroke={T.textDim} strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...Label(), fontSize: 12 }}>NO ACTIVE TOURNAMENT</div>
            <div style={{ fontSize: 14, color: T.textDim, marginTop: 8 }}>Start a new one to begin the round</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${T.border}` }}>
        <MainCTA label="START NEW TOURNAMENT" onClick={onCreate} />
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: `${T.loss}14`, border: `1px solid ${T.loss}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.loss, fontSize: 28, fontWeight: 700,
      }}>!</div>
      <div style={{ ...Label(), color: T.loss }}>COULDN'T LOAD</div>
      <div style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', maxWidth: 240, lineHeight: 1.5 }}>
        Network's flickering. Try again.
      </div>
      <button onClick={onRetry} style={{
        marginTop: 8, padding: '12px 24px', borderRadius: 10,
        background: T.surface2, border: `1px solid ${T.border}`,
        color: T.accent, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
      }}>RETRY</button>
    </div>
  );
}
