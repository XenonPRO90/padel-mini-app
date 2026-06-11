import { useState } from 'react';
import { T } from '../lib/tokens';
import { EGoldFrame, ELabel, EMedal, EPlace, EEditIcon } from '../lib/elegant';
import { Ring } from '../components/Ring';
import { LevelBadge, SideBadge } from '../components/Badges';
import { Avatar } from './PlayersScreen';
import { usePlayerProfile } from '../api/players';
import type { ProfilePlacement, ProfilePartner } from '../lib/types';

interface Props {
  pid: number;
  onBack: () => void;
  onEdit: () => void;
  onOpenTournament: (tid: number) => void;
}

const ddmm = (s: string) => {
  const m = s?.slice(0, 10).split('-'); // YYYY-MM-DD
  return m && m.length === 3 ? `${m[2]}.${m[1]}` : '';
};

// Legend shown when tapping the "?" next to «Статистика».
const STAT_HELP = [
  { k: 'Турниров', v: 'сколько турниров сыграно' },
  { k: 'Игр сыграно', v: 'сколько матчей (игр на корте) сыграно' },
  { k: 'Винрейт', v: '% выигранных матчей: победы ÷ все матчи' },
  { k: 'Чемпион', v: 'сколько раз занял 1-е место в турнире' },
  { k: 'Подиум', v: 'сколько раз попал в топ-3 (1–3 место)' },
  { k: 'Лучшая серия', v: 'самая длинная серия побед подряд' },
  { k: 'Очков за карьеру', v: 'сумма очков по всем турнирам' },
];

export function PlayerProfileScreen({ pid, onBack, onEdit, onOpenTournament }: Props) {
  const { data, isLoading } = usePlayerProfile(pid);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
          color: T.gold, fontFamily: T.fontSerif, fontSize: 14,
        }}>← Back</button>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
            color: T.ink, letterSpacing: 3, textTransform: 'uppercase',
          }}>Профиль</div>
        </div>
        <button onClick={onEdit} aria-label="Edit" style={{
          background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
          color: T.gold, display: 'flex', alignItems: 'center', gap: 4,
        }}><EEditIcon size={16} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px' }}>
        {isLoading || !data ? (
          <div className="skeleton" style={{ height: 220, borderRadius: 16 }} />
        ) : (
          <>
            {/* Hero — avatar in win-rate ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
              <Ring size={140} stroke={4} value={data.stats.win_rate} max={1} color={T.emerald}>
                <Avatar name={data.player.name} size={84} />
              </Ring>
              <div style={{
                marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 6,
              }}>
                <span style={{
                  fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 700,
                  color: T.goldDeep, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                }}>{Math.round(data.stats.win_rate * 100)}%</span>
                <span style={{
                  fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 13, color: T.muted,
                }}>побед в матчах</span>
              </div>
              <div style={{
                marginTop: 10, fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
                color: T.ink, textAlign: 'center',
              }}>{data.player.name}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <LevelBadge level={data.player.level} />
                <SideBadge side={data.player.side} />
              </div>
            </div>

            {/* Achievements / stat grid */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingLeft: 2,
            }}>
              <ELabel>Статистика</ELabel>
              <button onClick={() => setInfoOpen((v) => !v)} aria-label="Что это" style={{
                width: 18, height: 18, borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${infoOpen ? T.gold : T.rule}`,
                background: infoOpen ? T.gold : 'transparent',
                color: infoOpen ? T.cream : T.gold,
                fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 700,
                lineHeight: 1, padding: 0,
              }}>?</button>
            </div>
            {infoOpen && (
              <div style={{ marginBottom: 12 }}>
                <EGoldFrame>
                  <div style={{ padding: '10px 14px' }}>
                    {STAT_HELP.map((h, i) => (
                      <div key={h.k} style={{
                        padding: '7px 0',
                        borderBottom: i === STAT_HELP.length - 1 ? 'none' : `1px dotted ${T.rule}`,
                      }}>
                        <span style={{ fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600, color: T.ink }}>{h.k}</span>
                        <span style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 12, color: T.muted }}> — {h.v}</span>
                      </div>
                    ))}
                  </div>
                </EGoldFrame>
              </div>
            )}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18,
            }}>
              {data.achievements.map((a) => (
                <div key={a.id} style={{
                  background: T.paper, border: `1px solid ${T.paperEdge}`,
                  borderRadius: 14, padding: '12px 8px', textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 700,
                    color: a.value > 0 ? T.goldDeep : T.muted, lineHeight: 1.1,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{a.unit === '×' ? `${a.value}×` : `${a.value}${a.unit}`}</div>
                  <div style={{
                    marginTop: 4, fontFamily: T.fontSerif, fontSize: 11,
                    fontStyle: 'italic', color: T.muted, lineHeight: 1.2,
                  }}>{a.label}</div>
                </div>
              ))}
            </div>

            {/* Best partner */}
            {data.best_partner && (
              <div style={{ marginBottom: 18 }}>
                <ELabel style={{ marginBottom: 8, paddingLeft: 2 }}>Лучший партнёр</ELabel>
                <EGoldFrame>
                  <PartnerRow p={data.best_partner} highlight />
                </EGoldFrame>
              </div>
            )}

            {/* Recent tournaments */}
            {data.recent.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <ELabel style={{ marginBottom: 8, paddingLeft: 2 }}>Последние турниры</ELabel>
                <EGoldFrame>
                  <div style={{ padding: '2px 0' }}>
                    {data.recent.map((r, i) => (
                      <RecentRow key={r.tid} r={r} last={i === data.recent.length - 1}
                        onClick={() => onOpenTournament(r.tid)} />
                    ))}
                  </div>
                </EGoldFrame>
              </div>
            )}

            {/* Top partners */}
            {data.partners.length > 0 && (
              <div>
                <ELabel style={{ marginBottom: 8, paddingLeft: 2 }}>Частые партнёры</ELabel>
                <EGoldFrame>
                  <div style={{ padding: '2px 0' }}>
                    {data.partners.map((p, i) => (
                      <PartnerRow key={p.player_id} p={p} last={i === data.partners.length - 1} />
                    ))}
                  </div>
                </EGoldFrame>
              </div>
            )}

            {data.recent.length === 0 && (
              <div style={{
                textAlign: 'center', color: T.muted, fontFamily: T.fontSerif,
                fontStyle: 'italic', fontSize: 14, padding: 24,
              }}>Пока нет сыгранных турниров</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RecentRow({ r, last, onClick }: { r: ProfilePlacement; last: boolean; onClick: () => void }) {
  const podium = r.place <= 3;
  return (
    <div onClick={onClick} style={{
      display: 'grid', gridTemplateColumns: '40px 1fr auto', alignItems: 'center', gap: 10,
      padding: '10px 14px', cursor: 'pointer',
      borderBottom: last ? 'none' : `1px solid ${T.paperEdge}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {podium ? <EMedal place={r.place as 1 | 2 | 3} size={26} /> : <EPlace n={r.place} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 500, color: T.ink,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{r.name}</div>
        <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted }}>
          {ddmm(r.created_at)}
        </div>
      </div>
      <div style={{ fontFamily: T.fontDisplay, fontSize: 12, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
        <span style={{ color: T.win }}>W {r.wins}</span>
        <span style={{ margin: '0 4px', color: T.paperEdge }}>·</span>
        <span style={{ color: T.burgundy }}>L {r.losses}</span>
      </div>
    </div>
  );
}

function PartnerRow({ p, last, highlight }: { p: ProfilePartner; last?: boolean; highlight?: boolean }) {
  const wr = p.games ? Math.round((p.wins / p.games) * 100) : 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      borderBottom: last || highlight ? 'none' : `1px solid ${T.paperEdge}`,
    }}>
      <Avatar name={p.name} size={32} />
      <div style={{
        flex: 1, minWidth: 0, fontFamily: T.fontDisplay, fontSize: 14,
        fontWeight: highlight ? 600 : 500, color: T.ink,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{p.name}</div>
      <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 12, color: T.muted }}>
        {p.games} игр · {wr}%
      </div>
    </div>
  );
}
