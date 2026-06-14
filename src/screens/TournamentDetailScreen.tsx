import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useMe } from '../api/me';
import { useT } from '../lib/i18n';
import { T } from '../lib/tokens';
import { ELabel, EMedal, EPlace, EGoldFrame, EOrnRule } from '../lib/elegant';
import type { Round, ScoredPair, ScoredPlayer, Tournament } from '../lib/types';

interface Props {
  tid: number;
  onBack: () => void;
  onOpenRound: (roundNum: number, mode: string) => void;
}

interface Resp {
  tournament: Tournament;
  rounds: Round[];
  leaderboard: ScoredPlayer[];
  pair_leaderboard?: ScoredPair[];
}

export function TournamentDetailScreen({ tid, onBack, onOpenRound }: Props) {
  const tx = useT();
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
  const rows: Row[] = pair_leaderboard
    ? pair_leaderboard.map((p) => ({
        name: `${p.name_a} & ${p.name_b}`,
        points: p.points, wins: p.wins, losses: p.losses,
      }))
    : leaderboard.map((p) => ({
        name: p.name, points: p.points, wins: p.wins, losses: p.losses,
      }));

  // Mini Tournament (groups8): points = place, confusing next to W–L → hide.
  const hidePoints = t.mode === 'groups8';
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
        }}>← {tx('tab.history')}</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
            color: T.ink, letterSpacing: 3, textTransform: 'uppercase',
          }}>{tx('tab.tournament')}</div>
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

        {t.status === 'finished' && <SendResultsButton tid={tid} />}

        <ELabel style={{ marginBottom: 8, textAlign: 'center' }}>{tx('td.finalStandings')}</ELabel>
        <EGoldFrame>
          <div style={{ padding: '4px 0' }}>
            {ranked.map(({ place, row }, i) => {
              const isPodium = place <= 3;
              return (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '36px minmax(0, 1fr) auto',
                  alignItems: 'center', columnGap: 10, rowGap: 4,
                  padding: '10px 12px',
                  borderBottom: i < ranked.length - 1 ? `1px solid ${T.paperEdge}` : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignSelf: 'start', paddingTop: 2 }}>
                    {isPodium ? <EMedal place={place as 1 | 2 | 3} size={26} /> : <EPlace n={place} />}
                  </div>
                  {/* Name — wraps to 2 lines for long fixed-pair labels. No ellipsis. */}
                  <span style={{
                    fontFamily: T.fontDisplay,
                    fontSize: isPodium ? 16 : 14,
                    fontWeight: isPodium ? 600 : 500,
                    color: T.ink,
                    lineHeight: 1.25,
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}>{row.name}</span>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    justifySelf: 'end',
                  }}>
                    {!hidePoints && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                          <span style={{
                            fontFamily: T.fontDisplay, fontWeight: 600,
                            fontSize: isPodium ? 18 : 15, color: T.goldDeep,
                          }}>{row.points}</span>
                          <span style={{
                            fontFamily: T.fontSerif, fontSize: 11,
                            fontStyle: 'italic', color: T.muted,
                          }}>{tx('td.pts')}</span>
                        </div>
                        <div style={{ width: 1, height: 14, background: T.paperEdge }} />
                      </>
                    )}
                    <div style={{ fontFamily: T.fontDisplay, fontSize: 12, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                      <span style={{ color: T.win }}>W {row.wins}</span>
                      <span style={{ margin: '0 4px', color: T.paperEdge }}>·</span>
                      <span style={{ color: T.burgundy }}>L {row.losses}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </EGoldFrame>

        <ELabel style={{ margin: '20px 0 8px', textAlign: 'center' }}>{tx('td.roundsPlayed')}</ELabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rounds.map((r) => (
            <div
              key={r.id}
              onClick={() => onOpenRound(r.round_num, t.mode)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px',
                background: T.paper, border: `1px solid ${T.paperEdge}`,
                borderRadius: 14, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontFamily: T.fontDisplay, fontSize: 11, letterSpacing: 2, color: T.gold, textTransform: 'uppercase',
                }}>{tx('td.round')}</span>
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

// Phase 4 — admin sends personal result cards to linked players' DMs.
function SendResultsButton({ tid }: { tid: number }) {
  const t = useT();
  const { data: me } = useMe();
  const [step, setStep] = useState<'idle' | 'confirm' | 'sending' | 'done'>('idle');
  const [info, setInfo] = useState<{ linked: number; total: number } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  if (!me?.is_admin) return null;

  const openConfirm = async () => {
    try {
      const d = await api<{ linked_count: number; total_count: number }>(`/api/tournaments/${tid}/cards`);
      setInfo({ linked: d.linked_count, total: d.total_count });
      setStep('confirm');
    } catch (e) {
      setResult(t('common.error') + ': ' + (e as Error).message);
      setStep('done');
    }
  };
  const send = async () => {
    setStep('sending');
    try {
      const r = await api<{ sent: number; failed: { name: string; reason: string }[] }>(
        `/api/tournaments/${tid}/cards/send`, { method: 'POST' });
      setResult(t('td.sent', { n: r.sent }) + (r.failed.length ? t('td.failed', { k: r.failed.length }) : ''));
    } catch (e) {
      setResult(t('common.error') + ': ' + (e as Error).message);
    }
    setStep('done');
  };

  const wrap: React.CSSProperties = {
    margin: '0 0 18px', padding: '12px 14px', borderRadius: 14,
    background: T.paper, border: `1px solid ${T.paperEdge}`, textAlign: 'center',
  };
  const btn = (label: string, onClick: () => void, primary = true): React.ReactNode => (
    <button onClick={onClick} style={{
      padding: '10px 18px', borderRadius: 999, cursor: 'pointer', border: 'none',
      background: primary ? T.emerald : 'transparent',
      color: primary ? T.cream : T.muted,
      fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600, letterSpacing: 0.5,
    }}>{label}</button>
  );

  if (step === 'done') {
    return <div style={wrap}>
      <div style={{ fontFamily: T.fontSerif, fontSize: 14, color: T.ink, marginBottom: 8 }}>{result}</div>
      {btn(t('common.ok'), () => { setStep('idle'); setResult(null); }, false)}
    </div>;
  }
  if (step === 'sending') {
    return <div style={wrap}><div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', color: T.muted }}>{t('td.sending')}</div></div>;
  }
  if (step === 'confirm') {
    return <div style={wrap}>
      <div style={{ fontFamily: T.fontSerif, fontSize: 14, color: T.ink, marginBottom: 10 }}>
        {t('td.sendConfirm', { n: info?.linked ?? 0, total: info?.total ?? 0 })}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {btn(t('common.send'), send)}
        {btn(t('common.cancel'), () => setStep('idle'), false)}
      </div>
    </div>;
  }
  return <div style={{ textAlign: 'center', marginBottom: 18 }}>
    {btn(t('td.sendResults'), openConfirm)}
  </div>;
}
