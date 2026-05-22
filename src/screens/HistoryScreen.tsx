import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { T } from '../lib/tokens';
import { LevelBadge } from '../components/Badges';
import { ELabel, EMedal, EPlace, EBtn, EGoldFrame, EOrnRule } from '../lib/elegant';
import { MonthLeaderboardPoster } from './MonthLeaderboardPoster';
import { ShareTextModal } from '../components/ShareTextModal';
import type { HistoryItem, MonthlyLeaderboardResponse } from '../lib/types';

interface HistoryScreenProps {
  onOpenTournament?: (tid: number) => void;
}

type Tab = 'tournaments' | 'month';

export function HistoryScreen({ onOpenTournament }: HistoryScreenProps = {}) {
  const [tab, setTab] = useState<Tab>('tournaments');
  // Month state — defaults to current month. Arrow keys step through.
  const now = new Date();
  const [ym, setYm] = useState<{ year: number; month: number }>({
    year: now.getFullYear(), month: now.getMonth() + 1,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '10px 18px 12px', background: T.cream,
        borderBottom: `1px solid ${T.paperEdge}`,
      }}>
        <ELabel>· History</ELabel>
        <SegmentedToggle value={tab} onChange={setTab} />
      </div>

      {tab === 'tournaments'
        ? <TournamentsList onOpenTournament={onOpenTournament} />
        : <MonthLeaderboard ym={ym} onChange={setYm} />}
    </div>
  );
}

// ───────── Segmented toggle ─────────
function SegmentedToggle({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  const opts: { id: Tab; label: string }[] = [
    { id: 'tournaments', label: 'Tournaments' },
    { id: 'month',       label: 'Month leaders' },
  ];
  return (
    <div style={{
      marginTop: 10,
      display: 'flex',
      background: T.paper, border: `1px solid ${T.paperEdge}`,
      borderRadius: 999, padding: 3, gap: 2,
    }}>
      {opts.map(o => {
        const active = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            flex: 1, background: active ? T.emerald : 'transparent',
            color: active ? T.cream : T.muted,
            border: 'none', borderRadius: 999,
            padding: '10px 12px',
            fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600,
            letterSpacing: 1.5, textTransform: 'uppercase',
            cursor: 'pointer',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

// ───────── Tournaments list (existing flow) ─────────
function TournamentsList({ onOpenTournament }: { onOpenTournament?: (tid: number) => void }) {
  const { data, isLoading, error, refetch } = useQuery<{ items: HistoryItem[] }>({
    queryKey: ['history'],
    queryFn: () => api('/api/tournaments/history'),
  });

  if (error) return <CenterError onRetry={() => refetch()} />;
  const items = data?.items ?? [];

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '14px 18px 36px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <ELabel>{items.length} played</ELabel>
      </div>
      {isLoading ? (
        <Skeletons />
      ) : items.length === 0 ? (
        <Empty text="No finished tournaments yet" />
      ) : (
        items.map((it) => (
          <div
            key={it.id}
            onClick={() => onOpenTournament?.(it.id)}
            style={{
              background: T.paper, border: `1px solid ${T.paperEdge}`,
              borderRadius: 14, padding: '14px 16px',
              cursor: onOpenTournament ? 'pointer' : 'default',
            }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'baseline', marginBottom: 4,
            }}>
              <span style={{
                fontFamily: T.fontDisplay, fontSize: 11,
                letterSpacing: 2.5, color: T.gold,
                textTransform: 'uppercase',
              }}>{fmtDate(it.created_at)}</span>
              <span style={{
                fontFamily: T.fontSerif, fontStyle: 'italic',
                fontSize: 12, color: T.muted,
              }}>{it.players_count} guests · {it.mode}</span>
            </div>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600,
              color: T.ink, marginBottom: 6,
            }}>{it.name}</div>
            {it.winner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <EMedal place={1} size={18} />
                <span style={{
                  fontFamily: T.fontSerif, fontStyle: 'italic',
                  fontSize: 13, color: T.muted,
                }}>won by <span style={{
                  color: T.ink, fontStyle: 'normal', fontWeight: 500,
                }}>{it.winner}</span></span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ───────── Month leaders ─────────
function MonthLeaderboard({
  ym, onChange,
}: { ym: { year: number; month: number }; onChange: (v: { year: number; month: number }) => void }) {
  const { data, isLoading, error, refetch } = useQuery<MonthlyLeaderboardResponse>({
    queryKey: ['monthly', ym.year, ym.month],
    queryFn: () => api(`/api/leaderboard/monthly?year=${ym.year}&month=${ym.month}`),
  });
  const [posterOpen, setPosterOpen] = useState(false);
  const [shareText, setShareText] = useState<string | null>(null);

  const step = (delta: number) => {
    let m = ym.month + delta;
    let y = ym.year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    onChange({ year: y, month: m });
  };

  // Dense ranking — ties share a place.
  const ranked: { place: number; row: MonthlyLeaderboardResponse['items'][number] }[] = [];
  if (data?.items?.length) {
    let lastPts = -1, lastWins = -1, place = 0;
    for (const r of data.items) {
      if (r.points !== lastPts || r.wins !== lastWins) {
        place += 1; lastPts = r.points; lastWins = r.wins;
      }
      ranked.push({ place, row: r });
    }
  }

  const monthLabel = `${monthName(ym.month).toUpperCase()} ${ym.year}`;

  // Top-20 standings as forwardable text (medals for podium, places below).
  const buildShareText = (): string => {
    const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const lines = [
      `🏆 *PADEL CLUB · Лидеры месяца*`,
      `${monthLabel} · ${data?.tournaments_count ?? 0} турниров`,
      '',
    ];
    for (const { place, row } of ranked.slice(0, 20)) {
      const prefix = medals[place] ?? `${place}.`;
      lines.push(`${prefix} ${row.name} — ${row.points} pts (W${row.wins} L${row.losses})`);
    }
    return lines.join('\n');
  };

  if (error) return <CenterError onRetry={() => refetch()} />;

  if (posterOpen && data && ranked.length > 0) {
    return (
      <MonthLeaderboardPoster
        monthLabel={monthLabel}
        tournamentsCount={data.tournaments_count}
        ranked={ranked}
        onClose={() => setPosterOpen(false)}
        onShareText={() => setShareText(buildShareText())}
      />
    );
  }

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '14px 18px 36px',
    }}>
      {shareText !== null && (
        <ShareTextModal text={shareText} onClose={() => setShareText(null)} />
      )}
      {/* Month picker */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <button onClick={() => step(-1)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: T.gold, fontFamily: T.fontDisplay, fontSize: 18, padding: '4px 8px',
        }}>‹</button>
        <div style={{ textAlign: 'center' }}>
          <ELabel>Leaders</ELabel>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
            letterSpacing: 2, color: T.ink, marginTop: 2,
          }}>{monthName(ym.month)} {ym.year}</div>
        </div>
        <button onClick={() => step(1)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: T.gold, fontFamily: T.fontDisplay, fontSize: 18, padding: '4px 8px',
        }}>›</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <EOrnRule width={220} />
      </div>

      {isLoading ? (
        <Skeletons />
      ) : !data || data.items.length === 0 ? (
        <Empty text={`No tournaments in ${monthName(ym.month)}`} />
      ) : (
        <>
          <div style={{
            textAlign: 'center', marginBottom: 12,
            fontFamily: T.fontSerif, fontStyle: 'italic',
            fontSize: 13, color: T.muted,
          }}>
            {data.tournaments_count} {data.tournaments_count === 1 ? 'tournament' : 'tournaments'} played · {data.items.length} players
          </div>

          <div style={{ marginBottom: 14 }}>
            <EBtn kind="primary" style={{ width: '100%' }} onClick={() => setPosterOpen(true)}>
              Share poster · Top 20
            </EBtn>
          </div>

          <EGoldFrame>
            <div style={{ padding: '4px 0' }}>
              {ranked.map(({ place, row }, i) => {
                const isPodium = place <= 3;
                return (
                  <div key={row.player_id} style={{
                    display: 'grid',
                    gridTemplateColumns: '36px minmax(0, 1fr) auto',
                    alignItems: 'center', columnGap: 10, rowGap: 4,
                    padding: '10px 12px',
                    borderBottom: i < ranked.length - 1 ? `1px solid ${T.paperEdge}` : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignSelf: 'start', paddingTop: 2 }}>
                      {isPodium ? <EMedal place={place as 1 | 2 | 3} size={26} /> : <EPlace n={place} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, minWidth: 0,
                      }}>
                        <span style={{
                          fontFamily: T.fontDisplay,
                          fontSize: isPodium ? 16 : 14,
                          fontWeight: isPodium ? 600 : 500,
                          color: T.ink,
                          overflowWrap: 'anywhere',
                        }}>{row.name}</span>
                        <LevelBadge level={row.level} size="sm" />
                      </div>
                      <div style={{
                        fontFamily: T.fontSerif, fontSize: 11, fontStyle: 'italic',
                        color: T.muted,
                      }}>{row.tournaments} {row.tournaments === 1 ? 'tournament' : 'tournaments'}</div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, justifySelf: 'end',
                      whiteSpace: 'nowrap',
                    }}>
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
                  </div>
                );
              })}
            </div>
          </EGoldFrame>
        </>
      )}
    </div>
  );
}

// ───────── Helpers / shared ─────────
function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
  } catch { return iso.slice(0, 10); }
}

function monthName(m: number): string {
  return ['', 'January','February','March','April','May','June','July','August','September','October','November','December'][m] ?? '';
}

function Skeletons() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14, marginBottom: 10 }} />
      ))}
    </>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{
      padding: '60px 0', textAlign: 'center',
      fontFamily: T.fontSerif, fontStyle: 'italic',
      color: T.muted, fontSize: 14,
    }}>{text}</div>
  );
}

function CenterError({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24,
    }}>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600,
        color: T.burgundy, letterSpacing: 2,
      }}>Could not load</div>
      <EBtn kind="primary" onClick={onRetry}>Retry</EBtn>
    </div>
  );
}
