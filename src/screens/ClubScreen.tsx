import { useState } from 'react';
import { T } from '../lib/tokens';
import { ELabel, EGoldFrame, EMedal, EPlace } from '../lib/elegant';
import { Avatar } from './PlayersScreen';
import { useClubLeaderboard, useClubPairs, useClubRecords } from '../api/club';
import type { ClubBy, ClubRow } from '../api/club';
import type { Player } from '../lib/types';

type View = 'rating' | 'pairs' | 'records';

interface Props {
  onOpenPlayer?: (p: Player) => void;
  onOpenTournament?: (tid: number) => void;
}

export function ClubScreen({ onOpenPlayer, onOpenTournament }: Props) {
  const [view, setView] = useState<View>('rating');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 16px 10px', borderBottom: `1px solid ${T.paperEdge}`, background: T.cream }}>
        <ELabel style={{ textAlign: 'center', display: 'block', marginBottom: 8 }}>· Клуб ·</ELabel>
        <Segmented value={view} onChange={setView} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 40px' }}>
        {view === 'rating' && <RatingView onOpenPlayer={onOpenPlayer} />}
        {view === 'pairs' && <PairsView />}
        {view === 'records' && <RecordsView onOpenTournament={onOpenTournament} />}
      </div>
    </div>
  );
}

function Segmented({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const items: { id: View; label: string }[] = [
    { id: 'rating', label: 'Рейтинг' },
    { id: 'pairs', label: 'Дуэты' },
    { id: 'records', label: 'Рекорды' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button key={it.id} onClick={() => onChange(it.id)} style={{
            flex: 1, padding: '8px 0', borderRadius: 999, cursor: 'pointer',
            border: `1px solid ${active ? T.emerald : T.paperEdge}`,
            background: active ? T.emerald : 'transparent',
            color: active ? T.cream : T.muted,
            fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
          }}>{it.label}</button>
        );
      })}
    </div>
  );
}

function Toggle({ options, value, onChange }: {
  options: { id: string; label: string }[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
            border: `1px solid ${active ? T.gold : T.paperEdge}`,
            background: active ? '#f9f1de' : 'transparent',
            color: active ? T.goldDeep : T.muted,
            fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600,
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function RatingView({ onOpenPlayer }: { onOpenPlayer?: (p: Player) => void }) {
  const [period, setPeriod] = useState<'all' | 'month'>('all');
  const [by, setBy] = useState<ClubBy>('rating');
  const [showInfo, setShowInfo] = useState(false);
  // composite rating is all-time; period applies only to points/winrate
  const effPeriod = by === 'rating' ? 'all' : period;
  const { data, isLoading } = useClubLeaderboard(effPeriod, by);
  const items = data?.items ?? [];

  const mainValue = (r: ClubRow) =>
    by === 'rating' ? (r.rating ?? 0)
    : by === 'points' ? r.points
    : `${Math.round(r.win_rate * 100)}%`;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        {by === 'rating' ? (
          <button onClick={() => setShowInfo(true)} aria-label="Как считается рейтинг" style={{
            width: 26, height: 26, borderRadius: 999, flexShrink: 0,
            border: `1px solid ${T.gold}`, background: 'transparent', color: T.goldDeep,
            fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>?</button>
        ) : (
          <Toggle options={[{ id: 'all', label: 'Всё время' }, { id: 'month', label: 'Месяц' }]}
            value={period} onChange={(v) => setPeriod(v as 'all' | 'month')} />
        )}
        <Toggle options={[{ id: 'rating', label: 'Рейтинг' }, { id: 'points', label: 'Очки' }, { id: 'winrate', label: 'Винрейт' }]}
          value={by} onChange={(v) => setBy(v as ClubBy)} />
      </div>
      {showInfo && <RatingInfoModal onClose={() => setShowInfo(false)} />}
      {isLoading ? (
        <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />
      ) : items.length === 0 ? (
        <Empty text="Пока нет данных" />
      ) : (
        <EGoldFrame>
          <div style={{ padding: '2px 0' }}>
            {items.slice(0, 30).map((r, i) => (
              <div key={r.player_id} onClick={() => onOpenPlayer?.({ id: r.player_id, name: r.name, level: r.level, side: 'both' })}
                style={{
                  display: 'grid', gridTemplateColumns: '36px 32px 1fr auto', alignItems: 'center', gap: 10,
                  padding: '10px 14px', cursor: onOpenPlayer ? 'pointer' : 'default',
                  borderBottom: i === Math.min(items.length, 30) - 1 ? 'none' : `1px solid ${T.paperEdge}`,
                }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {i < 3 ? <EMedal place={(i + 1) as 1 | 2 | 3} size={24} /> : <EPlace n={i + 1} />}
                </div>
                <Avatar name={r.name} size={28} photoUrl={r.photo_url} />
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 500, color: T.ink,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{r.name}</div>
                  {by === 'rating' && (
                    <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted, whiteSpace: 'nowrap' }}>
                      {Math.round(r.win_rate * 100)}% · {r.games}и{r.champion ? ` · ${r.champion}🏆` : ''}
                    </div>
                  )}
                </div>
                <span style={{ fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 700, color: T.goldDeep, fontVariantNumeric: 'tabular-nums' }}>
                  {mainValue(r)}
                </span>
              </div>
            ))}
          </div>
        </EGoldFrame>
      )}
      {by === 'rating' && (
        <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted, marginTop: 8, textAlign: 'center' }}>
          композит: качество · титулы · опыт · форма · всё время
        </div>
      )}
      {by === 'winrate' && (
        <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted, marginTop: 8, textAlign: 'center' }}>
          в рейтинге по винрейту — от 10 игр
        </div>
      )}
    </>
  );
}

function PairsView() {
  const { data, isLoading } = useClubPairs();
  const items = data?.items ?? [];
  if (isLoading) return <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />;
  if (items.length === 0) return <Empty text="Пока мало совместных игр" />;
  return (
    <EGoldFrame>
      <div style={{ padding: '2px 0' }}>
        {items.map((p, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderBottom: i === items.length - 1 ? 'none' : `1px solid ${T.paperEdge}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {i < 3 ? <EMedal place={(i + 1) as 1 | 2 | 3} size={24} /> : <EPlace n={i + 1} />}
            </div>
            <span style={{
              fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 500, color: T.ink,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{p.name_a} & {p.name_b}</span>
            <span style={{ fontFamily: T.fontDisplay, fontSize: 13, color: T.goldDeep, whiteSpace: 'nowrap' }}>
              <b>{Math.round(p.win_rate * 100)}%</b>
              <span style={{ color: T.muted, fontWeight: 400 }}> · {p.games}и</span>
            </span>
          </div>
        ))}
      </div>
    </EGoldFrame>
  );
}

function RecordsView({ onOpenTournament }: { onOpenTournament?: (tid: number) => void }) {
  const { data, isLoading } = useClubRecords();
  if (isLoading || !data) return <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />;
  const recs = [
    { icon: '🏆', label: 'Больше титулов', r: data.most_titles },
    { icon: '🔥', label: 'Самая длинная серия', r: data.longest_streak },
    { icon: '💎', label: 'Больше всего очков', r: data.most_points },
    { icon: '✅', label: 'Больше всего побед', r: data.most_wins },
  ];
  return (
    <>
      <ELabel style={{ marginBottom: 8, paddingLeft: 2 }}>Рекорды клуба</ELabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 18 }}>
        {recs.map((x) => (
          <div key={x.label} style={{
            background: T.paper, border: `1px solid ${T.paperEdge}`, borderRadius: 14, padding: '12px 12px',
          }}>
            <div style={{ fontSize: 18 }}>{x.icon}</div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 700, color: T.goldDeep, marginTop: 4 }}>
              {x.r ? x.r.value : '—'}
            </div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {x.r?.name ?? '—'}
            </div>
            <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted, marginTop: 2 }}>{x.label}</div>
          </div>
        ))}
      </div>

      <ELabel style={{ marginBottom: 8, paddingLeft: 2 }}>Зал славы · чемпионы</ELabel>
      <EGoldFrame>
        <div style={{ padding: '2px 0' }}>
          {data.champions.map((c, i) => (
            <div key={c.tid} onClick={() => onOpenTournament?.(c.tid)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer',
              borderBottom: i === data.champions.length - 1 ? 'none' : `1px solid ${T.paperEdge}`,
            }}>
              <EMedal place={1} size={22} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.champion}</div>
                <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
              </div>
            </div>
          ))}
        </div>
      </EGoldFrame>
    </>
  );
}

function RatingInfoModal({ onClose }: { onClose: () => void }) {
  const rows = [
    { w: '45%', t: 'Качество', d: 'процент побед с поправкой на силу соперника — побеждать сильных ценнее.' },
    { w: '20%', t: 'Титулы', d: 'чемпионства и подиумы в завершённых турнирах.' },
    { w: '20%', t: 'Опыт', d: 'сколько игр сыграно — стабильность важнее одной удачной серии.' },
    { w: '15%', t: 'Форма', d: 'результаты за последние 30 дней.' },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(31,42,36,0.55)' }} />
      <div style={{
        position: 'relative', margin: 'auto', width: '100%', maxWidth: 360,
        background: T.cream, border: `1px solid ${T.paperEdge}`, borderRadius: 18,
        padding: '22px 20px', boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 700, color: T.ink }}>
          Как считается рейтинг
        </div>
        <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginTop: 4, marginBottom: 14 }}>
          Единый балл 0–1000 за всё время и по всем форматам. Складывается из четырёх частей:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((r) => (
            <div key={r.t} style={{ display: 'flex', gap: 10 }}>
              <span style={{
                flexShrink: 0, minWidth: 42, textAlign: 'center', height: 24, lineHeight: '24px',
                borderRadius: 999, background: '#f9f1de', color: T.goldDeep,
                fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 700,
              }}>{r.w}</span>
              <div>
                <span style={{ fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink }}>{r.t}</span>
                <span style={{ fontFamily: T.fontSerif, fontSize: 13, color: T.muted }}> — {r.d}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.paperEdge}`,
          fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 12, color: T.muted,
        }}>
          У кого мало игр, рейтинг осторожнее — пара побед не выводит новичка в топ, нужна история.
        </div>
        <button onClick={onClose} style={{
          marginTop: 18, width: '100%', padding: '11px 0', borderRadius: 999, cursor: 'pointer',
          border: 'none', background: T.emerald, color: T.cream,
          fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600, letterSpacing: 0.5,
        }}>Понятно</button>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', color: T.muted, fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 14, padding: 28 }}>{text}</div>
  );
}
