import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useCreateTournament, useCreatePlayer, type SideValue } from '../api/players';
import { T } from '../lib/tokens';
import { LevelBadge, SideBadge } from '../components/Badges';
import { MainCTA } from '../components/MainCTA';
import { Label } from '../components/CourtCard';
import { Avatar } from './PlayersScreen';
import type { Player } from '../lib/types';

interface Props {
  onClose: () => void;
}

interface State {
  name: string;
  num_courts: number;
  mode: 'rotating' | 'fixed';
  initial_order: 'keep' | 'random';
  initial_points: number;
  start_round: number;
  court_points: Record<number, number>;
  player_ids: number[];
}

const TOTAL_STEPS = 9;

export function WizardScreen({ onClose }: Props) {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');

  const [step, setStep] = useState(1);
  const [s, setS] = useState<State>({
    name: `PADEL MASTERS · ${dd}.${mm}`,
    num_courts: 4,
    mode: 'rotating',
    initial_order: 'keep',
    initial_points: 1,
    start_round: 4,
    court_points: { 1: 3, 2: 2, 3: 1, 4: 1 },
    player_ids: [],
  });

  const create = useCreateTournament();

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const back = () => (step === 1 ? onClose() : setStep((s) => s - 1));

  const update = <K extends keyof State>(k: K, v: State[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  // Step 7: court points object adjusts to num_courts
  const ensureCourtPoints = (numCourts: number) => {
    const cp: Record<number, number> = {};
    for (let i = 1; i <= numCourts; i++) {
      cp[i] = s.court_points[i] ?? Math.max(1, numCourts - i + 1);
    }
    return cp;
  };

  const onSubmit = async () => {
    try {
      const cp = ensureCourtPoints(s.num_courts);
      await create.mutateAsync({
        ...s,
        court_points: cp,
      });
      onClose();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const playersDivisible = s.player_ids.length > 0 && s.player_ids.length % 4 === 0;
  const enoughForCourts = s.player_ids.length >= s.num_courts * 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header step={step} onBack={back} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {step === 1 && <StepName value={s.name} onChange={(v) => update('name', v)} />}
        {step === 2 && <StepCourts value={s.num_courts} onChange={(v) => update('num_courts', v)} />}
        {step === 3 && <StepMode value={s.mode} onChange={(v) => update('mode', v)} />}
        {step === 4 && <StepOrder value={s.initial_order} onChange={(v) => update('initial_order', v)} />}
        {step === 5 && <StepNum title="Initial points per win" caption="Points per win until court-specific points kick in" value={s.initial_points} onChange={(v) => update('initial_points', v)} min={1} max={10} />}
        {step === 6 && <StepNum title="Start round for court points" caption="Round when different points per court start to apply" value={s.start_round} onChange={(v) => update('start_round', v)} min={1} max={10} />}
        {step === 7 && <StepCourtPoints courts={s.num_courts} value={ensureCourtPoints(s.num_courts)} onChange={(v) => update('court_points', v)} />}
        {step === 8 && <StepPlayers selected={s.player_ids} onChange={(v) => update('player_ids', v)} />}
        {step === 9 && <StepConfirm s={s} cp={ensureCourtPoints(s.num_courts)} />}
      </div>
      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${T.border}` }}>
        {step === 8 && !playersDivisible && (
          <ValidationBanner text="Need a multiple of 4 players" />
        )}
        {step === 8 && playersDivisible && !enoughForCourts && (
          <ValidationBanner text={`Need at least ${s.num_courts * 4} players for ${s.num_courts} courts`} />
        )}
        {step < TOTAL_STEPS ? (
          <MainCTA
            label="NEXT"
            disabled={
              (step === 1 && !s.name.trim()) ||
              (step === 8 && (!playersDivisible || !enoughForCourts))
            }
            onClick={next}
          />
        ) : (
          <MainCTA
            label={create.isPending ? 'STARTING…' : 'START TOURNAMENT'}
            disabled={create.isPending}
            onClick={onSubmit}
          />
        )}
      </div>
    </div>
  );
}

function Header({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <div style={{ padding: '8px 16px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: T.textMuted, padding: 4, cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ ...Label(), flex: 1, textAlign: 'center', fontSize: 11 }}>NEW TOURNAMENT</div>
        <div style={{ width: 50, textAlign: 'right', fontSize: 12, color: T.textMuted, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {step} / {TOTAL_STEPS}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i + 1 <= step ? T.accent : T.border,
            transition: 'background 200ms',
          }} />
        ))}
      </div>
    </div>
  );
}

function StepName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ ...Label(), marginBottom: 6 }}>STEP 1</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 22 }}>Tournament name</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', background: T.surface, border: `1px solid ${T.accent}`,
          borderRadius: 12, padding: '16px 16px', fontSize: 18, fontWeight: 600,
          color: T.textPrimary, outline: 'none',
        }}
      />
    </div>
  );
}

function StepCourts({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ ...Label(), marginBottom: 6 }}>STEP 2</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 26 }}>How many courts?</div>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ fontSize: 96, fontWeight: 700, color: T.accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
        <div style={Label()}>COURTS</div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[2, 3, 4, 5, 6].map((n) => {
          const active = n === value;
          return (
            <div
              key={n}
              onClick={() => onChange(n)}
              style={{
                width: 50, height: 50, borderRadius: 12,
                background: active ? T.accent : T.surface,
                color: active ? '#0B0E12' : T.textMuted,
                border: `1px solid ${active ? T.accent : T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, cursor: 'pointer',
              }}
            >{n}</div>
          );
        })}
      </div>
    </div>
  );
}

function StepMode({ value, onChange }: { value: 'rotating' | 'fixed'; onChange: (v: 'rotating' | 'fixed') => void }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ ...Label(), marginBottom: 6 }}>STEP 3</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 22 }}>Pairing mode</div>
      {[
        { id: 'rotating', title: 'ROTATING PARTNERS', desc: 'Pairs change every round based on level balance' },
        { id: 'fixed', title: 'FIXED PAIRS', desc: 'Same partner all tournament' },
      ].map((m) => {
        const active = m.id === value;
        return (
          <div
            key={m.id}
            onClick={() => onChange(m.id as 'rotating' | 'fixed')}
            style={{
              background: active ? `${T.accent}10` : T.surface,
              border: `1.5px solid ${active ? T.accent : T.border}`,
              borderRadius: 14, padding: '18px 16px', marginBottom: 12,
              cursor: 'pointer',
            }}
          >
            <div style={{ ...Label(), color: active ? T.accent : T.textMuted, marginBottom: 8 }}>{m.title}</div>
            <div style={{ fontSize: 13, color: T.textPrimary, lineHeight: 1.4 }}>{m.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

function StepOrder({ value, onChange }: { value: 'keep' | 'random'; onChange: (v: 'keep' | 'random') => void }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ ...Label(), marginBottom: 6 }}>STEP 4</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 22 }}>Initial court order</div>
      {[
        { id: 'keep', title: 'BY ENTRY', desc: 'Place strongest players on Court 1' },
        { id: 'random', title: 'RANDOM', desc: 'Shuffle players across courts' },
      ].map((m) => {
        const active = m.id === value;
        return (
          <div
            key={m.id}
            onClick={() => onChange(m.id as 'keep' | 'random')}
            style={{
              background: active ? `${T.accent}10` : T.surface,
              border: `1.5px solid ${active ? T.accent : T.border}`,
              borderRadius: 14, padding: '18px 16px', marginBottom: 12,
              cursor: 'pointer',
            }}
          >
            <div style={{ ...Label(), color: active ? T.accent : T.textMuted, marginBottom: 8 }}>{m.title}</div>
            <div style={{ fontSize: 13, color: T.textPrimary, lineHeight: 1.4 }}>{m.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

function StepNum({ title, caption, value, onChange, min, max }: {
  title: string; caption: string; value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ ...Label(), marginBottom: 6 }}>STEP</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 22 }}>{title}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 8,
      }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{
            width: 44, height: 44, borderRadius: 10,
            border: `1px solid ${T.border}`, background: T.surface2, color: T.textPrimary,
            fontSize: 22, fontWeight: 600, cursor: 'pointer',
          }}
        >−</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 36, fontWeight: 700, color: T.accent, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          style={{
            width: 44, height: 44, borderRadius: 10,
            border: `1px solid ${T.border}`, background: T.surface2, color: T.textPrimary,
            fontSize: 22, fontWeight: 600, cursor: 'pointer',
          }}
        >+</button>
      </div>
      <div style={{ fontSize: 13, color: T.textMuted, marginTop: 14, lineHeight: 1.5, padding: '0 4px' }}>{caption}</div>
    </div>
  );
}

function StepCourtPoints({ courts, value, onChange }: {
  courts: number; value: Record<number, number>; onChange: (v: Record<number, number>) => void;
}) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ ...Label(), marginBottom: 6 }}>STEP 7</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 22 }}>Points per court</div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '4px 16px' }}>
        {Array.from({ length: courts }).map((_, i) => {
          const cn = i + 1;
          const isFirst = cn === 1;
          const isLast = cn === courts;
          return (
            <div key={cn} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
              borderBottom: i < courts - 1 ? `1px solid ${T.border}` : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ ...Label(), fontSize: 12, color: T.textPrimary }}>COURT {cn}</div>
                {(isFirst || isLast) && (
                  <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
                    {isFirst ? '(strongest)' : '(weakest)'}
                  </div>
                )}
              </div>
              <input
                type="number"
                value={value[cn] ?? 1}
                onChange={(e) => onChange({ ...value, [cn]: Number(e.target.value) || 0 })}
                style={{
                  width: 76, height: 44, borderRadius: 10,
                  background: T.surface2, border: `1px solid ${T.border}`,
                  color: T.accent, fontSize: 22, fontWeight: 700, textAlign: 'center',
                  outline: 'none', fontVariantNumeric: 'tabular-nums',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepPlayers({ selected, onChange }: { selected: number[]; onChange: (v: number[]) => void }) {
  const { data, isLoading } = useQuery<{ items: Player[] }>({
    queryKey: ['players'],
    queryFn: () => api('/api/players'),
  });
  const [adding, setAdding] = useState(false);

  const items = data?.items ?? [];
  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  if (adding) {
    return (
      <InlinePlayerCreate
        onCancel={() => setAdding(false)}
        onCreated={(newId) => {
          setAdding(false);
          onChange([...selected, newId]);
        }}
      />
    );
  }

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ ...Label(), marginBottom: 6 }}>STEP 8</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 16 }}>Select players</div>

      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
        padding: '12px 14px', marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ ...Label(), fontSize: 11 }}>SELECTED</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {selected.length}
          </div>
        </div>
        <div style={{
          background: `${T.accent}14`, color: T.accent,
          borderRadius: 999, padding: '6px 12px',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        }}>÷ 4 = {Math.floor(selected.length / 4)} COURTS</div>
      </div>

      <button
        onClick={() => setAdding(true)}
        style={{
          width: '100%', marginBottom: 12, padding: 14,
          background: 'transparent', border: `1px dashed ${T.border}`, borderRadius: 12,
          color: T.accent, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer',
        }}
      >+ ADD NEW PLAYER</button>

      {isLoading ? (
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      ) : (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '0 12px' }}>
          {items.map((p, i) => {
            const isSelected = selected.includes(p.id);
            const order = isSelected ? selected.indexOf(p.id) + 1 : null;
            return (
              <div
                key={p.id}
                onClick={() => toggle(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px',
                  borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: isSelected ? T.accent : 'transparent',
                  border: `1.5px solid ${isSelected ? T.accent : T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0B0E12', fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{isSelected ? order : ''}</div>
                <Avatar name={p.name} size={32} />
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                <SideBadge side={p.side} />
                <LevelBadge level={p.level} size="sm" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepConfirm({ s, cp }: { s: State; cp: Record<number, number> }) {
  const summary: { label: string; value: string }[] = [
    { label: 'NAME', value: s.name },
    { label: 'COURTS', value: String(s.num_courts) },
    { label: 'MODE', value: s.mode === 'rotating' ? 'Rotating partners' : 'Fixed pairs' },
    { label: 'ORDER', value: s.initial_order === 'keep' ? 'By entry' : 'Random' },
    { label: 'INITIAL POINTS', value: `${s.initial_points} pt` },
    { label: 'START ROUND', value: `Round ${s.start_round}` },
    { label: 'COURT POINTS', value: Array.from({ length: s.num_courts }, (_, i) => cp[i + 1]).join(' / ') },
    { label: 'PLAYERS', value: String(s.player_ids.length) },
  ];
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ ...Label(), marginBottom: 6 }}>STEP 9</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 22 }}>Confirm tournament</div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '4px 16px' }}>
        {summary.map((row, i) => (
          <div key={row.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 0',
            borderBottom: i < summary.length - 1 ? `1px solid ${T.border}` : 'none',
          }}>
            <span style={{ ...Label(), fontSize: 11 }}>{row.label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{row.value}</span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 16, padding: 14,
        background: `${T.accent}10`, border: `1px solid ${T.accent}40`, borderRadius: 12,
        fontSize: 13, color: T.accent, lineHeight: 1.5, textAlign: 'center', fontWeight: 500,
      }}>
        Round 1 will be generated automatically once you start.
      </div>
    </div>
  );
}

function InlinePlayerCreate({ onCancel, onCreated }: { onCancel: () => void; onCreated: (id: number) => void }) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('C');
  const [side, setSide] = useState<SideValue>('both');
  const create = useCreatePlayer();
  const LEVELS = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'C- strong', 'C-', 'D'];
  const SIDES: { id: SideValue; label: string }[] = [
    { id: 'right', label: 'RIGHT' },
    { id: 'left', label: 'LEFT' },
    { id: 'both', label: 'UNIVERSAL' },
  ];

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ ...Label(), marginBottom: 6 }}>NEW PLAYER</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>Add to library + select</div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ ...Label(), marginBottom: 8 }}>NAME</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          autoFocus
          style={{
            width: '100%', background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: '14px 16px', fontSize: 17, fontWeight: 500,
            color: T.textPrimary, outline: 'none',
          }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ ...Label(), marginBottom: 8 }}>LEVEL</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {LEVELS.map((l) => {
            const active = l === level;
            return (
              <div key={l} onClick={() => setLevel(l)} style={{
                flexShrink: 0, padding: '10px 14px', borderRadius: 10,
                background: active ? T.surface2 : T.surface,
                border: `1px solid ${active ? T.accent : T.border}`,
                color: active ? T.accent : T.textMuted,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>{l}</div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ ...Label(), marginBottom: 8 }}>SIDE</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {SIDES.map((s) => {
            const active = s.id === side;
            return (
              <div key={s.id} onClick={() => setSide(s.id)} style={{
                background: active ? `${T.accent}10` : T.surface,
                border: `1px solid ${active ? T.accent : T.border}`,
                borderRadius: 12, padding: '14px 8px', textAlign: 'center',
                color: active ? T.accent : T.textMuted, fontWeight: 700,
                fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer',
              }}>{s.label}</div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button onClick={onCancel} disabled={create.isPending} style={{
          flex: 1, height: 48, borderRadius: 12, border: `1px solid ${T.border}`,
          background: 'transparent', color: T.textMuted, fontWeight: 600, fontSize: 12,
          letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
        }}>CANCEL</button>
        <button
          disabled={!name.trim() || create.isPending}
          onClick={async () => {
            try {
              const res = await create.mutateAsync({ name, level, side });
              onCreated(res.id);
            } catch (e) {
              alert((e as Error).message);
            }
          }}
          style={{
            flex: 1, height: 48, borderRadius: 12, border: 'none',
            background: !name.trim() || create.isPending ? T.surface2 : T.accent,
            color: !name.trim() || create.isPending ? T.textMuted : '#0B0E12',
            fontWeight: 700, fontSize: 12, letterSpacing: '0.1em',
            textTransform: 'uppercase', cursor: 'pointer',
          }}
        >{create.isPending ? 'SAVING…' : 'ADD & SELECT'}</button>
      </div>
    </div>
  );
}

function ValidationBanner({ text }: { text: string }) {
  return (
    <div style={{
      background: `${T.warn}14`, border: `1px solid ${T.warn}40`, borderRadius: 10,
      padding: '8px 12px', marginBottom: 10,
      fontSize: 11, color: T.warn, fontWeight: 600, letterSpacing: '0.06em',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>⚠ {text}</div>
  );
}
