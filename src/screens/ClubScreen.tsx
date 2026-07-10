import { useState } from 'react';
import { T } from '../lib/tokens';
import { ELabel, EGoldFrame, EMedal, EPlace } from '../lib/elegant';
import { LevelBadge } from '../components/Badges';
import { Avatar } from './PlayersScreen';
import { useT } from '../lib/i18n';
import { useClubLeaderboard, useClubPairs, useClubRecords } from '../api/club';
import type { Player } from '../lib/types';

type View = 'rating' | 'pairs' | 'records';

interface Props {
  onOpenPlayer?: (p: Player) => void;
  onOpenTournament?: (tid: number) => void;
}

export function ClubScreen({ onOpenPlayer, onOpenTournament }: Props) {
  const [view, setView] = useState<View>('rating');
  const t = useT();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 16px 10px', borderBottom: `1px solid ${T.paperEdge}`, background: T.cream }}>
        <ELabel style={{ textAlign: 'center', display: 'block', marginBottom: 8 }}>· {t('club.title')} ·</ELabel>
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
  const t = useT();
  const items: { id: View; label: string }[] = [
    { id: 'rating', label: t('club.rating') },
    { id: 'pairs', label: t('club.pairs') },
    { id: 'records', label: t('club.records') },
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

function RatingView({ onOpenPlayer }: { onOpenPlayer?: (p: Player) => void }) {
  const t = useT();
  const { data, isLoading } = useClubLeaderboard('all', 'elo');
  const items = data?.items ?? [];

  return (
    <>
      {isLoading ? (
        <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />
      ) : items.length === 0 ? (
        <Empty text={t('common.nodata')} />
      ) : (
        <EGoldFrame>
          <div style={{ padding: '2px 0' }}>
            {items.slice(0, 300).map((r, i) => (
              <div key={r.player_id} onClick={() => onOpenPlayer?.({ id: r.player_id, name: r.name, level: r.level, side: 'both' })}
                style={{
                  display: 'grid', gridTemplateColumns: '36px 32px 1fr auto', alignItems: 'center', gap: 10,
                  padding: '10px 14px', cursor: onOpenPlayer ? 'pointer' : 'default',
                  borderBottom: i === Math.min(items.length, 300) - 1 ? 'none' : `1px solid ${T.paperEdge}`,
                }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {r.validating ? <EPlace n={i + 1} /> : (i < 3 ? <EMedal place={(i + 1) as 1 | 2 | 3} size={24} /> : <EPlace n={i + 1} />)}
                </div>
                <Avatar name={r.name} size={28} photoUrl={r.photo_url} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                  <span style={{
                    fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 500, color: T.ink,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{r.name}</span>
                  <LevelBadge level={r.level} size="sm" />
                </div>
                {r.validating ? (
                  <span style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11.5, color: T.muted, whiteSpace: 'nowrap' }}>
                    {t('club.validating')}
                  </span>
                ) : (
                  <span style={{ fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 700, color: T.goldDeep, fontVariantNumeric: 'tabular-nums' }}>
                    {r.elo?.toFixed(2) ?? '—'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </EGoldFrame>
      )}
      <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted, marginTop: 8, textAlign: 'center' }}>
        {t('club.eloFooter')}
      </div>
    </>
  );
}

function PairsView() {
  const t = useT();
  const { data, isLoading } = useClubPairs();
  const items = data?.items ?? [];
  if (isLoading) return <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />;
  if (items.length === 0) return <Empty text={t('club.pairsEmpty')} />;
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
              <span style={{ color: T.muted, fontWeight: 400 }}> · {t('club.games', { n: p.games })}</span>
            </span>
          </div>
        ))}
      </div>
    </EGoldFrame>
  );
}

function RecordsView({ onOpenTournament }: { onOpenTournament?: (tid: number) => void }) {
  const t = useT();
  const { data, isLoading } = useClubRecords();
  if (isLoading || !data) return <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />;
  const recs = [
    { icon: '🏆', label: t('club.recMostTitles'), r: data.most_titles },
    { icon: '🔥', label: t('club.recLongestStreak'), r: data.longest_streak },
    { icon: '💎', label: t('club.recMostPoints'), r: data.most_points },
    { icon: '✅', label: t('club.recMostWins'), r: data.most_wins },
  ];
  return (
    <>
      <ELabel style={{ marginBottom: 8, paddingLeft: 2 }}>{t('club.recordsTitle')}</ELabel>
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

      <ELabel style={{ marginBottom: 8, paddingLeft: 2 }}>{t('club.hallOfFame')}</ELabel>
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

function Empty({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', color: T.muted, fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 14, padding: 28 }}>{text}</div>
  );
}
