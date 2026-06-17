import { useState } from 'react';
import { T } from '../lib/tokens';
import { useT } from '../lib/i18n';
import { Avatar } from './PlayersScreen';
import { useLinkedPlayers, useCreateCasual, type CasualGameInput } from '../api/casual';
import type { Player } from '../lib/types';

interface Props { onBack: () => void }

// 3 possible 2v2 splits of 4 players (by index).
const SPLITS: [number, number][] = [[0, 1], [0, 2], [0, 3]];

export function CasualCreateScreen({ onBack }: Props) {
  const t = useT();
  const { data } = useLinkedPlayers();
  const create = useCreateCasual();
  const all = data?.items ?? [];
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Player[]>([]);
  const [games, setGames] = useState<CasualGameInput[]>([]);
  // draft game
  const [splitIdx, setSplitIdx] = useState(0);
  const [s1, setS1] = useState(0);
  const [s2, setS2] = useState(0);
  const [done, setDone] = useState(false);

  const toggle = (p: Player) => {
    setSel((cur) => cur.find((x) => x.id === p.id)
      ? cur.filter((x) => x.id !== p.id)
      : cur.length >= 4 ? cur : [...cur, p]);
  };

  const teamsFor = (idx: number) => {
    const [i, j] = SPLITS[idx];
    const t1 = [sel[i], sel[j]];
    const t2 = sel.filter((_, k) => k !== i && k !== j);
    return { t1, t2 };
  };

  const addGame = () => {
    if (sel.length !== 4 || s1 === s2) return;
    const { t1, t2 } = teamsFor(splitIdx);
    setGames((g) => [...g, { p1: t1[0].id, p2: t1[1].id, p3: t2[0].id, p4: t2[1].id, score1: s1, score2: s2 }]);
    setS1(0); setS2(0);
  };

  const submit = () => {
    if (!games.length || create.isPending) return;
    create.mutate({ games }, {
      onSuccess: () => setDone(true),
      onError: (e) => alert((e as Error).message),
    });
  };

  const nameById = (id: number) => sel.find((p) => p.id === id)?.name ?? all.find((p) => p.id === id)?.name ?? '?';
  const filtered = q ? all.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) : all;

  if (done) {
    return (
      <Frame onBack={onBack} title={t('casual.title')}>
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎾</div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600, color: T.ink }}>{t('casual.sent')}</div>
          <button onClick={onBack} style={primaryBtn}>{t('common.ok')}</button>
        </div>
      </Frame>
    );
  }

  return (
    <Frame onBack={onBack} title={t('casual.title')}>
      {/* players */}
      <div style={{ fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6 }}>
        {t('casual.pickPlayers')}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {sel.map((p) => (
          <button key={p.id} onClick={() => toggle(p)} style={chip(true)}>{p.name} ✕</button>
        ))}
      </div>
      {sel.length < 4 && (
        <>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('players.searchPh')}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10,
              border: `1px solid ${T.paperEdge}`, background: T.paper, marginBottom: 8,
              fontFamily: T.fontSerif, fontSize: 14, color: T.ink }} />
          <div style={{ maxHeight: 180, overflowY: 'auto', border: `1px solid ${T.paperEdge}`, borderRadius: 12, marginBottom: 8 }}>
            {filtered.filter((p) => !sel.find((x) => x.id === p.id)).slice(0, 40).map((p) => (
              <div key={p.id} onClick={() => toggle(p)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer',
                borderBottom: `1px solid ${T.paperEdge}`,
              }}>
                <Avatar name={p.name} size={26} photoUrl={p.photo_url} />
                <span style={{ fontFamily: T.fontDisplay, fontSize: 14, color: T.ink }}>{p.name}</span>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted, marginBottom: 12 }}>
            {t('casual.onlyLinked')}
          </div>
        </>
      )}

      {/* game builder */}
      {sel.length === 4 && (
        <>
          <div style={{ height: 1, background: T.paperEdge, margin: '8px 0 14px' }} />
          {games.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
              padding: '8px 12px', background: T.paper, border: `1px solid ${T.paperEdge}`, borderRadius: 10 }}>
              <span style={{ flex: 1, fontFamily: T.fontDisplay, fontSize: 13, color: T.ink }}>
                {nameById(g.p1)}/{nameById(g.p2)} <b style={{ color: T.goldDeep }}>{g.score1}:{g.score2}</b> {nameById(g.p3)}/{nameById(g.p4)}
              </span>
              <button onClick={() => setGames((gs) => gs.filter((_, k) => k !== i))} style={{
                background: 'transparent', border: 'none', color: T.burgundy, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
          ))}

          <div style={{ background: T.paper, border: `1px solid ${T.paperEdge}`, borderRadius: 12, padding: 12, marginTop: 6 }}>
            <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginBottom: 8 }}>{t('casual.tapToSplit')}</div>
            {SPLITS.map((_, idx) => {
              const { t1, t2 } = teamsFor(idx);
              const on = idx === splitIdx;
              return (
                <button key={idx} onClick={() => setSplitIdx(idx)} style={{
                  display: 'block', width: '100%', textAlign: 'center', marginBottom: 6, cursor: 'pointer',
                  padding: '9px', borderRadius: 999,
                  border: `1px solid ${on ? T.emerald : T.paperEdge}`,
                  background: on ? T.emerald : 'transparent', color: on ? T.cream : T.ink,
                  fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600,
                }}>{t1[0].name} & {t1[1].name}　vs　{t2[0].name} & {t2[1].name}</button>
              );
            })}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, margin: '12px 0' }}>
              <Stepper value={s1} onChange={setS1} />
              <span style={{ fontFamily: T.fontDisplay, fontSize: 18, color: T.muted }}>:</span>
              <Stepper value={s2} onChange={setS2} />
            </div>
            <button onClick={addGame} disabled={s1 === s2} style={{
              width: '100%', padding: '10px', borderRadius: 999, cursor: s1 === s2 ? 'default' : 'pointer',
              border: `1px solid ${T.gold}`, background: 'transparent', color: T.goldDeep,
              fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600,
            }}>{t('casual.addGame')}</button>
          </div>

          <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted, margin: '12px 0', textAlign: 'center' }}>
            {t('casual.note')}
          </div>
          <button onClick={submit} disabled={!games.length || create.isPending} style={{
            ...primaryBtn, width: '100%', opacity: games.length ? 1 : 0.5,
          }}>{create.isPending ? t('casual.submitting') : t('casual.submit')}</button>
        </>
      )}
    </Frame>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const btn = (label: string, d: number) => (
    <button onClick={() => onChange(Math.max(0, Math.min(9, value + d)))} style={{
      width: 34, height: 34, borderRadius: 999, border: `1px solid ${T.paperEdge}`,
      background: T.cream, color: T.ink, fontSize: 18, cursor: 'pointer',
    }}>{label}</button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {btn('−', -1)}
      <span style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700, color: T.ink, width: 24, textAlign: 'center' }}>{value}</span>
      {btn('+', 1)}
    </div>
  );
}

function Frame({ onBack, title, children }: { onBack: () => void; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid ${T.paperEdge}`, background: T.cream }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: T.gold, fontFamily: T.fontSerif, fontSize: 14 }}>←</button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: 2, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ width: 24 }} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 32px' }}>{children}</div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  marginTop: 16, padding: '12px 20px', borderRadius: 999, border: 'none',
  background: T.emerald, color: T.cream, cursor: 'pointer',
  fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600,
};
const chip = (on: boolean): React.CSSProperties => ({
  padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
  border: `1px solid ${on ? T.emerald : T.paperEdge}`,
  background: on ? T.emerald : 'transparent', color: on ? T.cream : T.ink,
  fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600,
});
