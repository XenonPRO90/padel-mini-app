import { useState } from 'react';
import { T } from '../lib/tokens';
import { EGoldFrame, ELabel, EMedal, EPlace, EEditIcon, EShareIcon } from '../lib/elegant';
import { ProfileCardModal } from './ProfileCardModal';
import { Ring } from '../components/Ring';
import { LevelBadge, SideBadge } from '../components/Badges';
import { Avatar } from './PlayersScreen';
import { usePlayerProfile, useMintInvite } from '../api/players';
import { useMe } from '../api/me';
import { useUpdateMyRacket } from '../api/joinRequests';
import { ShareTextModal } from '../components/ShareTextModal';
import type { ProfilePlacement, ProfilePartner, ProfileOpponent } from '../lib/types';

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
  { k: '% призовых', v: 'доля турниров, где попал в топ-3' },
  { k: 'Чемпион', v: 'сколько раз занял 1-е место в турнире' },
  { k: 'Подиум', v: 'сколько раз попал в топ-3 (1–3 место)' },
  { k: 'Лучшая серия', v: 'самая длинная серия побед подряд' },
  { k: 'Гроза старших', v: 'победы над игроками выше уровнем' },
  { k: 'Очков за карьеру', v: 'сумма очков по всем турнирам' },
];

export function PlayerProfileScreen({ pid, onBack, onEdit, onOpenTournament }: Props) {
  const { data, isLoading } = usePlayerProfile(pid);
  const { data: me } = useMe();
  const mint = useMintInvite();
  const [infoOpen, setInfoOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [cardOpen, setCardOpen] = useState(false);

  const isAdmin = !!me?.is_admin;
  const linked = !!data?.player?.telegram_id;
  const isOwn = !!me?.player && me.player.id === pid;
  const racketM = useUpdateMyRacket();
  const [racket, setRacket] = useState<string | null>(null);
  const racketVal = racket ?? data?.player?.racket ?? '';

  const onInvite = async () => {
    try {
      const { deep_link } = await mint.mutateAsync(pid);
      const tg = window.Telegram?.WebApp;
      const shareUrl = 'https://t.me/share/url?url=' + encodeURIComponent(deep_link)
        + '&text=' + encodeURIComponent('Открой свой профиль в Padel Club');
      if (tg?.openTelegramLink) tg.openTelegramLink(shareUrl);
      else setShareLink(deep_link);
    } catch (e) {
      alert((e as Error).message || 'Не удалось создать приглашение');
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {data && (
            <button onClick={() => setCardOpen(true)} aria-label="Поделиться" style={{
              background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: T.gold,
            }}><EShareIcon size={17} /></button>
          )}
          {isAdmin && !linked && (
            <button onClick={onInvite} disabled={mint.isPending} style={{
              background: 'transparent', border: `1px solid ${T.gold}`, borderRadius: 999,
              padding: '4px 10px', cursor: 'pointer', color: T.gold,
              fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
            }}>{mint.isPending ? '…' : 'Пригласить'}</button>
          )}
          {isAdmin && (
            <button onClick={onEdit} aria-label="Edit" style={{
              background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
              color: T.gold, display: 'flex', alignItems: 'center', gap: 4,
            }}><EEditIcon size={16} /></button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px' }}>
        {isLoading || !data ? (
          <div className="skeleton" style={{ height: 220, borderRadius: 16 }} />
        ) : (
          <>
            {/* Hero — avatar in win-rate ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
              <Ring size={140} stroke={4} value={data.stats.win_rate} max={1} color={T.emerald}>
                <Avatar name={data.player.name} size={84} photoUrl={data.player.photo_url} />
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

              {/* Form (last 5) + 30-day dynamics */}
              {(data.stats.form.length > 0 || data.stats.recent_win_rate !== null) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  {data.stats.form.length > 0 && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      {data.stats.form.map((r, i) => (
                        <span key={i} style={{
                          width: 18, height: 18, borderRadius: 999, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 700, color: T.cream,
                          background: r === 'W' ? T.win : T.burgundy,
                        }}>{r}</span>
                      ))}
                    </div>
                  )}
                  {data.stats.recent_win_rate !== null && (() => {
                    const rec = Math.round(data.stats.recent_win_rate * 100);
                    const diff = rec - Math.round(data.stats.win_rate * 100);
                    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
                    const col = diff > 0 ? T.win : diff < 0 ? T.burgundy : T.muted;
                    return (
                      <span style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 12, color: T.muted }}>
                        30 дней: <b style={{ color: col, fontStyle: 'normal' }}>{rec}% {arrow}</b>
                      </span>
                    );
                  })()}
                </div>
              )}

              <div style={{
                marginTop: 10, fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
                color: T.ink, textAlign: 'center',
              }}>{data.player.name}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <LevelBadge level={data.player.level} />
                <SideBadge side={data.player.side} />
                {data.stats.club_rank && (
                  <span style={{
                    fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                    color: T.goldDeep, border: `1px solid ${T.gold}`, borderRadius: 999,
                    padding: '2px 8px',
                  }}>#{data.stats.club_rank} в клубе{data.stats.club_rating != null ? ` · ${data.stats.club_rating}` : ''}</span>
                )}
                {linked && (
                  <span style={{
                    fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
                    color: T.emerald, border: `1px solid ${T.emerald}`, borderRadius: 999,
                    padding: '2px 8px',
                  }}>✓ в приложении{data.player.username ? ` · @${data.player.username}` : ''}</span>
                )}
              </div>

              {/* Racket — visible to all; editable on your own profile */}
              {isOwn ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 12, width: '100%', maxWidth: 320 }}>
                  <input
                    value={racketVal}
                    onChange={(e) => setRacket(e.target.value)}
                    placeholder="Твоя ракетка (напр. Babolat Air)"
                    maxLength={40}
                    style={{
                      flex: 1, boxSizing: 'border-box', padding: '8px 12px', borderRadius: 999,
                      border: `1px solid ${T.paperEdge}`, background: T.cream,
                      fontFamily: T.fontDisplay, fontSize: 13, color: T.ink, textAlign: 'center',
                    }}
                  />
                  {racket !== null && racket !== (data.player.racket ?? '') && (
                    <button disabled={racketM.isPending}
                      onClick={() => racketM.mutate(racketVal, { onSuccess: () => setRacket(null) })}
                      style={{
                        background: T.emerald, color: T.cream, border: 'none', borderRadius: 999,
                        padding: '8px 14px', cursor: 'pointer',
                        fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600,
                      }}>{racketM.isPending ? '…' : 'OK'}</button>
                  )}
                </div>
              ) : data.player.racket ? (
                <div style={{
                  marginTop: 10, fontFamily: T.fontSerif, fontStyle: 'italic',
                  fontSize: 13, color: T.muted,
                }}>🎾 {data.player.racket}</div>
              ) : null}
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
                  {a.sub && (
                    <div style={{
                      marginTop: 2, fontFamily: T.fontSerif, fontSize: 9.5,
                      fontStyle: 'italic', color: T.muted, opacity: 0.8, lineHeight: 1.15,
                    }}>{a.sub}</div>
                  )}
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

            {/* Head-to-head: nemesis & favourite opponent */}
            {(data.nemesis || data.favorite_opponent) && (
              <div style={{ marginBottom: 18 }}>
                <ELabel style={{ marginBottom: 8, paddingLeft: 2 }}>Личные счёты</ELabel>
                <EGoldFrame>
                  <div style={{ padding: '2px 0' }}>
                    {data.nemesis && (
                      <H2HRow icon="🔥" label="Немезида" o={data.nemesis}
                        last={!data.favorite_opponent} />
                    )}
                    {data.favorite_opponent && (
                      <H2HRow icon="😎" label="Любимый соперник" o={data.favorite_opponent} last />
                    )}
                  </div>
                </EGoldFrame>
              </div>
            )}

            {/* Court distribution — King of the Court only */}
            {data.court_distribution.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <ELabel style={{ marginBottom: 8, paddingLeft: 2 }}>Корты · King of the Court</ELabel>
                <EGoldFrame>
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.court_distribution.map((c) => (
                      <div key={c.court} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600,
                          color: T.ink, width: 58, flexShrink: 0,
                        }}>Корт {c.court}</span>
                        <div style={{ flex: 1, height: 8, background: T.paperEdge, borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: `${c.pct}%`, height: '100%', background: T.emerald }} />
                        </div>
                        <span style={{
                          fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 700, color: T.goldDeep,
                          width: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                        }}>{c.pct}%</span>
                      </div>
                    ))}
                  </div>
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

      {shareLink && (
        <ShareTextModal text={shareLink} onClose={() => setShareLink(null)} />
      )}
      {cardOpen && data && (
        <ProfileCardModal profile={data} onClose={() => setCardOpen(false)} />
      )}
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

function H2HRow({ icon, label, o, last }: {
  icon: string; label: string; o: ProfileOpponent; last?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      borderBottom: last ? 'none' : `1px solid ${T.paperEdge}`,
    }}>
      <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted }}>{label}</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{o.name}</div>
      </div>
      <div style={{ fontFamily: T.fontDisplay, fontSize: 13, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
        <span style={{ color: T.win }}>{o.wins}</span>
        <span style={{ color: T.muted }}> : </span>
        <span style={{ color: T.burgundy }}>{o.losses}</span>
      </div>
    </div>
  );
}
