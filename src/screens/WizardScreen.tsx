import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useCreateTournament, useCreatePlayer, type SideValue } from '../api/players';
import { LEVEL_COLORS, T } from '../lib/tokens';
import { LevelBadge, SideBadge } from '../components/Badges';
import { MainCTA } from '../components/MainCTA';
import { Avatar } from './PlayersScreen';
import { ELabel, EGoldFrame, EDivider } from '../lib/elegant';
import type { Player } from '../lib/types';

interface Props {
  onClose: () => void;
}

type Mode = 'rotating' | 'fixed' | 'americano' | 'groups8';

interface State {
  name: string;
  num_courts: number;
  mode: Mode;
  initial_order: 'keep' | 'random';
  initial_points: number;
  start_round: number;
  court_points: Record<number, number>;
  court_labels: Record<number, string>;  // court_num -> display label (e.g. real court number)
  player_ids: number[];
  skip_7_8: boolean;  // groups8: don't play the 7th-8th place match
}


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
    court_labels: {},
    skip_7_8: false,
    player_ids: [],
  });

  const create = useCreateTournament();

  // Americano & groups8 need only name / mode / order / players / confirm —
  // points and court count are derived, so those steps are skipped.
  const derivedMode = s.mode === 'americano' || s.mode === 'groups8';
  // Derived modes still play on courts (groups8: 4; americano: players/4) — let
  // the organizer set the real court numbers via a labels-only step (10).
  const STEPS = derivedMode ? [1, 3, 4, 8, 10, 9] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const derivedCourts = s.mode === 'groups8' ? 4 : Math.max(1, Math.floor(s.player_ids.length / 4));
  const stepIdx = Math.max(0, STEPS.indexOf(step));
  const isLastStep = step === STEPS[STEPS.length - 1];

  const next = () => setStep(STEPS[Math.min(STEPS.length - 1, stepIdx + 1)]);
  const back = () => (stepIdx <= 0 ? onClose() : setStep(STEPS[stepIdx - 1]));

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
      // Only send labels for the courts that exist, trimmed; backend drops
      // labels equal to the court number.
      const labels: Record<number, string> = {};
      for (const [k, val] of Object.entries(s.court_labels)) {
        const v = (val ?? '').trim();
        if (v) labels[Number(k)] = v;
      }
      await create.mutateAsync({ ...s, court_points: cp, court_labels: labels });
      onClose();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const playersDivisible = s.player_ids.length > 0 && s.player_ids.length % 4 === 0;
  // groups8 needs exactly 16 (8 pairs); americano ≥ 4 pairs; else courts×4.
  const enoughForCourts = s.mode === 'groups8'
    ? s.player_ids.length === 16
    : s.player_ids.length >= (s.mode === 'americano' ? 8 : s.num_courts * 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header pos={stepIdx + 1} total={STEPS.length} onBack={back} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 16px' }}>
        {step === 1 && <StepName value={s.name} onChange={(v) => update('name', v)} />}
        {step === 2 && <StepCourts value={s.num_courts} onChange={(v) => update('num_courts', v)} />}
        {step === 3 && <StepMode value={s.mode} onChange={(v) => update('mode', v)} />}
        {step === 4 && <StepOrder value={s.initial_order} onChange={(v) => update('initial_order', v)} />}
        {step === 5 && <StepNum
          title="Initial points per win"
          caption="Points per win until court-specific points kick in"
          value={s.initial_points}
          onChange={(v) => update('initial_points', v)}
          min={1} max={10}
        />}
        {step === 6 && <StepNum
          title="Start round for court points"
          caption="Round when different points per court start to apply"
          value={s.start_round}
          onChange={(v) => update('start_round', v)}
          min={1} max={10}
        />}
        {step === 7 && <StepCourtPoints
          courts={s.num_courts}
          value={ensureCourtPoints(s.num_courts)}
          onChange={(v) => update('court_points', v)}
          labels={s.court_labels}
          onChangeLabels={(v) => update('court_labels', v)}
        />}
        {step === 8 && <StepPlayers
          mode={s.mode}
          selected={s.player_ids}
          onChange={(v) => update('player_ids', v)}
        />}
        {step === 10 && <StepCourtLabels
          courts={derivedCourts}
          labels={s.court_labels}
          onChange={(v) => update('court_labels', v)}
          showSkip={s.mode === 'groups8'}
          skip={s.skip_7_8}
          onToggleSkip={(v) => update('skip_7_8', v)}
        />}
        {step === 9 && <StepConfirm s={s} cp={ensureCourtPoints(s.num_courts)} />}
        {step === 9 && (s.mode === 'fixed' || s.mode === 'americano' || s.mode === 'groups8') && s.player_ids.length > 0 && (
          <PairsPreview playerIds={s.player_ids} />
        )}
      </div>
      <div style={{
        padding: '8px 16px calc(env(safe-area-inset-bottom, 0px) + 6px)',
        borderTop: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        {step === 8 && !playersDivisible && (
          <ValidationBanner text="Need a multiple of 4 players" />
        )}
        {step === 8 && playersDivisible && !enoughForCourts && (
          <ValidationBanner text={
            s.mode === 'groups8'
              ? `Нужно ровно 16 игроков (8 пар) — выбрано ${s.player_ids.length}`
              : s.mode === 'americano'
              ? 'Need at least 8 players (4 pairs)'
              : `Need at least ${s.num_courts * 4} players for ${s.num_courts} courts`
          } />
        )}
        {!isLastStep ? (
          <MainCTA
            label="Continue"
            disabled={
              (step === 1 && !s.name.trim()) ||
              (step === 8 && (!playersDivisible || !enoughForCourts))
            }
            onClick={next}
          />
        ) : (
          <MainCTA
            label={create.isPending ? 'Starting…' : 'Start tournament'}
            disabled={create.isPending}
            onClick={onSubmit}
          />
        )}
      </div>
    </div>
  );
}

function Header({ pos, total, onBack }: { pos: number; total: number; onBack: () => void }) {
  return (
    <div style={{
      padding: '10px 16px 14px',
      borderBottom: `1px solid ${T.paperEdge}`, background: T.cream,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
          color: T.gold, fontFamily: T.fontSerif, fontSize: 14,
        }}>← Back</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600,
            color: T.ink, letterSpacing: 3, textTransform: 'uppercase',
          }}>Step {pos} of {total}</div>
        </div>
        <div style={{ width: 60 }} />
      </div>
      {/* Gold-dot progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => {
          const n = i + 1;
          const filled = n <= pos;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: 999,
                background: filled ? T.gold : 'transparent',
                border: `1px solid ${filled ? T.gold : T.rule}`,
                flexShrink: 0,
              }} />
              {i < total - 1 && (
                <div style={{
                  flex: 1, height: 1,
                  background: n < pos ? T.gold : T.rule,
                  opacity: n < pos ? 1 : 0.4,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Reusable step title block
function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ textAlign: 'center', marginTop: 22, marginBottom: 16 }}>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
        letterSpacing: 2, color: T.ink,
      }}>{title}</div>
      {subtitle && (
        <div style={{
          marginTop: 4, fontFamily: T.fontSerif, fontStyle: 'italic',
          fontSize: 14, color: T.muted,
        }}>{subtitle}</div>
      )}
      <div style={{ marginTop: 10 }}><EDivider /></div>
    </div>
  );
}

function StepName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <>
      <StepTitle title="Name the Tournament" subtitle="A name to be remembered by" />
      <ELabel style={{ marginBottom: 6 }}>Tournament name</ELabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', background: T.paper,
          border: `1px solid ${T.paperEdge}`, borderRadius: 14,
          padding: '14px 16px',
          fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 500,
          color: T.ink, outline: 'none',
        }}
      />
    </>
  );
}

function StepCourts({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <>
      <StepTitle title="How many courts?" subtitle="Tonight's stage" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[2, 3, 4, 5, 6].map((n) => {
          const active = n === value;
          return (
            <div key={n} onClick={() => onChange(n)} style={{
              aspectRatio: '1', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column',
              background: active ? T.emerald : T.paper,
              color: active ? T.cream : T.ink,
              border: `1px solid ${active ? T.emerald : T.paperEdge}`,
              borderRadius: 14, cursor: 'pointer',
            }}>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 600 }}>{n}</div>
              <div style={{
                fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11,
                opacity: 0.85,
              }}>{n === 1 ? 'court' : 'courts'}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function CardChoice({
  active, title, desc, onClick,
}: { active: boolean; title: string; desc: string; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: '14px 16px',
      background: active ? '#f9f1de' : T.paper,
      border: `1px solid ${active ? T.gold : T.paperEdge}`,
      borderRadius: 14, cursor: 'pointer', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 600, color: T.ink }}>{title}</div>
        {active && <span style={{ color: T.gold, fontSize: 16 }}>✓</span>}
      </div>
      <div style={{
        marginTop: 4, fontFamily: T.fontSerif, fontStyle: 'italic',
        fontSize: 13, color: T.muted, lineHeight: 1.45,
      }}>{desc}</div>
    </div>
  );
}

function StepMode({ value, onChange }: { value: Mode; onChange: (v: Mode) => void }) {
  return (
    <>
      <StepTitle title="Pairing Mode" subtitle="How the matches unfold" />
      <CardChoice
        active={value === 'rotating'}
        title="Rotating Partners"
        desc="Pairs change every round based on level balance."
        onClick={() => onChange('rotating')}
      />
      <CardChoice
        active={value === 'fixed'}
        title="Fixed Pairs"
        desc="Same partner all tournament."
        onClick={() => onChange('fixed')}
      />
      <CardChoice
        active={value === 'americano'}
        title="Team Americano"
        desc="Fixed pairs, round-robin — every pair plays every other once. 1 win = 1 point."
        onClick={() => onChange('americano')}
      />
      <CardChoice
        active={value === 'groups8'}
        title="Mini Tournament · 8 teams"
        desc="Group stage + play-off. 16 players (8 pairs), 2 groups of 4, round-robin → bracket for places 1–8. Score by games."
        onClick={() => onChange('groups8')}
      />
    </>
  );
}

function StepOrder({ value, onChange }: { value: 'keep' | 'random'; onChange: (v: 'keep' | 'random') => void }) {
  return (
    <>
      <StepTitle title="Initial Court Order" subtitle="Where everyone starts" />
      <CardChoice
        active={value === 'keep'}
        title="By Entry"
        desc="Place strongest players on Court 1."
        onClick={() => onChange('keep')}
      />
      <CardChoice
        active={value === 'random'}
        title="Random"
        desc="Shuffle players across courts."
        onClick={() => onChange('random')}
      />
    </>
  );
}

function StepNum({ title, caption, value, onChange, min, max }: {
  title: string; caption: string; value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  return (
    <>
      <StepTitle title={title} subtitle={caption} />
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 88, fontWeight: 600,
          color: T.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>{value}</div>
        <div style={{
          fontFamily: T.fontSerif, fontSize: 14, fontStyle: 'italic',
          color: T.muted, marginTop: 4,
        }}>points per win</div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 30 }}>
          <button
            onClick={() => onChange(Math.max(min, value - 1))}
            style={{
              width: 60, height: 60, borderRadius: 999,
              border: `1px solid ${T.rule}`, background: T.paper, color: T.ink,
              fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 600,
              cursor: 'pointer',
            }}
          >−</button>
          <button
            onClick={() => onChange(Math.min(max, value + 1))}
            style={{
              width: 60, height: 60, borderRadius: 999,
              border: `1px solid ${T.rule}`, background: T.paper, color: T.ink,
              fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 600,
              cursor: 'pointer',
            }}
          >+</button>
        </div>
      </div>
    </>
  );
}

// Labels-only step for derived modes (Mini Tournament / Americano): set the real
// court numbers shown on the board. Points are not used in these modes.
function StepCourtLabels({ courts, labels, onChange, showSkip, skip, onToggleSkip }: {
  courts: number; labels: Record<number, string>; onChange: (v: Record<number, string>) => void;
  showSkip?: boolean; skip?: boolean; onToggleSkip?: (v: boolean) => void;
}) {
  return (
    <>
      <StepTitle title="Court numbers" subtitle="Real court numbers on the board (e.g. 5–8)" />
      {showSkip && (
        <button onClick={() => onToggleSkip?.(!skip)} style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
          padding: '14px 16px', marginBottom: 12, cursor: 'pointer',
          background: T.paper, border: `1px solid ${skip ? T.emerald : T.paperEdge}`, borderRadius: 14,
        }}>
          <span style={{
            width: 24, height: 24, borderRadius: 7, flexShrink: 0,
            border: `1px solid ${skip ? T.emerald : T.rule}`,
            background: skip ? T.emerald : 'transparent', color: T.cream,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
          }}>{skip ? '✓' : ''}</span>
          <div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink }}>Не играть за 7–8 место</div>
            <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 12, color: T.muted }}>
              если корт освобождается раньше — матч за 7–8 место не проводится
            </div>
          </div>
        </button>
      )}
      {Array.from({ length: courts }).map((_, i) => {
        const cn = i + 1;
        return (
          <div key={cn} style={{
            display: 'grid', gridTemplateColumns: '54px 1fr', alignItems: 'center', gap: 12,
            padding: '14px 16px', marginBottom: 8,
            background: T.paper, border: `1px solid ${T.paperEdge}`, borderRadius: 14,
          }}>
            <div style={{
              background: T.emerald, color: T.cream, borderRadius: 10,
              padding: '8px 0', textAlign: 'center',
            }}>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 9, letterSpacing: 2 }}>КОРТ</div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 600, lineHeight: 1 }}>
                {(labels[cn] ?? '').trim() || cn}
              </div>
            </div>
            <input
              value={labels[cn] ?? ''}
              onChange={(e) => onChange({ ...labels, [cn]: e.target.value })}
              placeholder={`№ на табло (${cn})`}
              maxLength={6}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10,
                border: `1px solid ${T.paperEdge}`, background: T.cream,
                fontFamily: T.fontDisplay, fontSize: 15, color: T.ink,
              }}
            />
          </div>
        );
      })}
    </>
  );
}

function StepCourtPoints({ courts, value, onChange, labels, onChangeLabels }: {
  courts: number; value: Record<number, number>; onChange: (v: Record<number, number>) => void;
  labels: Record<number, string>; onChangeLabels: (v: Record<number, string>) => void;
}) {
  const courtLabel = (n: number): string => {
    if (n === 1) return 'Centre Court';
    if (n === courts) return 'Final court';
    const ords = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];
    return ords[n] ?? `Court ${n}`;
  };
  return (
    <>
      <StepTitle title="Points per Court" subtitle="What each victory is worth" />
      {Array.from({ length: courts }).map((_, i) => {
        const cn = i + 1;
        return (
          <div key={cn} style={{
            display: 'grid', gridTemplateColumns: '54px 1fr auto',
            alignItems: 'center', gap: 12,
            padding: '14px 16px', marginBottom: 8,
            background: T.paper, border: `1px solid ${T.paperEdge}`,
            borderRadius: 14,
          }}>
            <div style={{
              background: T.emerald, color: T.cream,
              borderRadius: 10, padding: '8px 0', textAlign: 'center',
            }}>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 9, letterSpacing: 2 }}>КОРТ</div>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 600, lineHeight: 1,
              }}>{(labels[cn] ?? '').trim() || cn}</div>
            </div>
            <div>
              <div style={{
                fontFamily: T.fontSerif, fontStyle: 'italic',
                fontSize: 14, color: T.muted, marginBottom: 6,
              }}>{courtLabel(cn)}</div>
              <input
                value={labels[cn] ?? ''}
                onChange={(e) => onChangeLabels({ ...labels, [cn]: e.target.value })}
                placeholder={`№ на табло (${cn})`}
                maxLength={6}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '6px 8px', borderRadius: 8,
                  border: `1px solid ${T.paperEdge}`, background: T.cream,
                  fontFamily: T.fontDisplay, fontSize: 13, color: T.ink,
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => onChange({ ...value, [cn]: Math.max(0, (value[cn] ?? 1) - 1) })}
                style={{
                  width: 30, height: 30, borderRadius: 999, border: `1px solid ${T.rule}`,
                  background: T.cream, color: T.ink,
                  fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >−</button>
              <div style={{
                minWidth: 30, textAlign: 'center',
                fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
                color: T.goldDeep, fontVariantNumeric: 'tabular-nums',
              }}>{value[cn] ?? 1}</div>
              <button
                onClick={() => onChange({ ...value, [cn]: Math.min(99, (value[cn] ?? 1) + 1) })}
                style={{
                  width: 30, height: 30, borderRadius: 999, border: `1px solid ${T.rule}`,
                  background: T.cream, color: T.ink,
                  fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >+</button>
            </div>
          </div>
        );
      })}
    </>
  );
}

// Elegant pair colors — desaturated, paper-friendly
const PAIR_COLORS = ['#2f4a3a', '#a6864d', '#8a6a35', '#1d3327', '#7a4a20', '#5a7a4a', '#8a2a2a', '#4b5260'];

function StepPlayers({
  mode, selected, onChange,
}: {
  mode: Mode;
  selected: number[];
  onChange: (v: number[]) => void;
}) {
  // Fixed pairs, americano and groups8 all pair adjacent picks; show pair UI.
  const pairMode = mode === 'fixed' || mode === 'americano' || mode === 'groups8';
  const { data, isLoading } = useQuery<{ items: Player[] }>({
    queryKey: ['players'],
    queryFn: () => api('/api/players'),
  });
  const [adding, setAdding] = useState(false);

  const items = data?.items ?? [];
  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };
  const pairCount = Math.floor(selected.length / 2);

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
    <>
      <StepTitle title="Select Players" subtitle={`${selected.length} of ${items.length} chosen`} />

      <div style={{
        background: T.paper, border: `1px solid ${T.paperEdge}`,
        borderRadius: 14, padding: '12px 14px', marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <ELabel>Selected</ELabel>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 600,
            color: T.ink, marginTop: 2, fontVariantNumeric: 'tabular-nums',
          }}>{selected.length}</div>
        </div>
        <div style={{
          background: T.cream2, color: T.goldDeep,
          borderRadius: 999, padding: '6px 14px',
          fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600, letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}>
          {pairMode
            ? `${pairCount} pair${pairCount === 1 ? '' : 's'}`
            : `÷ 4 · ${Math.floor(selected.length / 4)} courts`}
        </div>
      </div>

      {pairMode && (
        <div style={{
          fontFamily: T.fontSerif, fontStyle: 'italic',
          fontSize: 13, color: T.muted, padding: '0 4px 12px',
          lineHeight: 1.5,
        }}>
          Same color marks a fixed pair. Players are paired in the order you tap them
          (1+2, 3+4, …).
        </div>
      )}

      <button
        onClick={() => setAdding(true)}
        style={{
          width: '100%', marginBottom: 12, padding: 14,
          background: 'transparent',
          border: `1px solid ${T.rule}`, borderRadius: 999,
          color: T.gold, fontFamily: T.fontDisplay,
          fontSize: 13, fontWeight: 600, letterSpacing: 1.5,
          textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer',
        }}
      >+ Add new player</button>

      {isLoading ? (
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      ) : (
        <EGoldFrame>
          <div style={{ padding: '4px 0' }}>
            {items.map((p, i) => {
              const isSelected = selected.includes(p.id);
              const order = isSelected ? selected.indexOf(p.id) + 1 : null;
              const pairIdx = isSelected ? Math.floor((order! - 1) / 2) : -1;
              const pairColor = pairIdx >= 0 ? PAIR_COLORS[pairIdx % PAIR_COLORS.length] : '';
              const isFixedSelected = pairMode && isSelected;
              return (
                <div
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    borderBottom: i < items.length - 1 ? `1px solid ${T.paperEdge}` : 'none',
                    cursor: 'pointer',
                    background: isSelected ? '#f9f1de' : 'transparent',
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: isSelected ? (isFixedSelected ? pairColor : T.gold) : 'transparent',
                    border: `1px solid ${isSelected ? (isFixedSelected ? pairColor : T.gold) : T.rule}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: T.cream, fontFamily: T.fontDisplay,
                    fontSize: 11, fontWeight: 600, flexShrink: 0,
                  }}>{isSelected ? order : ''}</div>
                  <Avatar name={p.name} size={32} />
                  <span style={{
                    flex: 1, fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 500,
                    color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{p.name}</span>
                  {isFixedSelected && (
                    <span style={{
                      border: `1px solid ${pairColor}`, color: pairColor,
                      background: 'transparent',
                      borderRadius: 999, padding: '2px 8px',
                      fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 600, letterSpacing: 0.6,
                      flexShrink: 0,
                    }}>P{pairIdx + 1}</span>
                  )}
                  <SideBadge side={p.side} />
                  <LevelBadge level={p.level} size="sm" />
                </div>
              );
            })}
          </div>
        </EGoldFrame>
      )}
    </>
  );
}

function StepConfirm({ s, cp }: { s: State; cp: Record<number, number> }) {
  const modeLabel = s.mode === 'rotating' ? 'Rotating partners'
    : s.mode === 'americano' ? 'Team Americano'
    : s.mode === 'groups8' ? 'Mini Tournament · 8 teams' : 'Fixed pairs';
  const summary: { label: string; value: string }[] = s.mode === 'groups8'
    ? [
        { label: 'Name',    value: s.name },
        { label: 'Mode',    value: modeLabel },
        { label: 'Groups',  value: '2 × 4 teams' },
        { label: 'Courts',  value: '4' },
        { label: 'Stage',   value: 'Round-robin → play-off for places 1–8' },
        { label: 'Scoring', value: 'By games' },
        { label: 'Players', value: `${s.player_ids.length} / 16` },
      ]
    : s.mode === 'americano'
    ? [
        { label: 'Name',    value: s.name },
        { label: 'Mode',    value: modeLabel },
        { label: 'Order',   value: s.initial_order === 'keep' ? 'By entry' : 'Random' },
        { label: 'Pairs',   value: String(Math.floor(s.player_ids.length / 2)) },
        { label: 'Courts',  value: String(Math.floor(s.player_ids.length / 4)) },
        { label: 'Rounds',  value: String(Math.max(0, Math.floor(s.player_ids.length / 2) - 1)) },
        { label: 'Scoring', value: '1 point per win' },
        { label: 'Players', value: String(s.player_ids.length) },
      ]
    : [
        { label: 'Name',            value: s.name },
        { label: 'Courts',          value: String(s.num_courts) },
        { label: 'Mode',            value: modeLabel },
        { label: 'Order',           value: s.initial_order === 'keep' ? 'By entry' : 'Random' },
        { label: 'Initial points',  value: `${s.initial_points} pt` },
        { label: 'Start round',     value: `Round ${s.start_round}` },
        { label: 'Court points',    value: Array.from({ length: s.num_courts }, (_, i) => cp[i + 1]).join(' / ') },
        { label: 'Players',         value: String(s.player_ids.length) },
      ];
  return (
    <>
      <StepTitle title="Ready to Begin" subtitle="Review and start the tournament" />
      <EGoldFrame>
        <div style={{ padding: '14px 18px' }}>
          {summary.map((row, i) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'baseline', padding: '10px 0',
              borderBottom: i === summary.length - 1 ? 'none' : `1px dotted ${T.rule}`,
            }}>
              <span style={{
                fontFamily: T.fontDisplay, fontSize: 10, letterSpacing: 2.5,
                color: T.gold, textTransform: 'uppercase',
              }}>{row.label}</span>
              <span style={{
                fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 500, color: T.ink,
                textAlign: 'right',
              }}>{row.value}</span>
            </div>
          ))}
        </div>
      </EGoldFrame>
      <div style={{
        marginTop: 18, textAlign: 'center',
        fontFamily: T.fontSerif, fontStyle: 'italic',
        fontSize: 13, color: T.muted,
      }}>The court awaits. Best of luck.</div>
    </>
  );
}

function PairsPreview({ playerIds }: { playerIds: number[] }) {
  const { data } = useQuery<{ items: Player[] }>({
    queryKey: ['players'],
    queryFn: () => api('/api/players'),
  });
  const map = new Map((data?.items ?? []).map((p) => [p.id, p]));
  const pairs: { idx: number; a?: Player; b?: Player }[] = [];
  for (let i = 0; i < playerIds.length; i += 2) {
    pairs.push({
      idx: i / 2,
      a: map.get(playerIds[i]),
      b: map.get(playerIds[i + 1]),
    });
  }
  return (
    <div style={{ marginTop: 18 }}>
      <ELabel style={{ marginBottom: 8, textAlign: 'center' }}>Fixed Pairs</ELabel>
      <EGoldFrame>
        <div style={{ padding: '4px 14px' }}>
          {pairs.map((pair) => {
            const color = PAIR_COLORS[pair.idx % PAIR_COLORS.length];
            return (
              <div key={pair.idx} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderBottom: pair.idx < pairs.length - 1 ? `1px solid ${T.paperEdge}` : 'none',
              }}>
                <span style={{
                  border: `1px solid ${color}`, color,
                  borderRadius: 999, padding: '3px 9px',
                  fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 600, letterSpacing: 0.6,
                  flexShrink: 0, minWidth: 30, textAlign: 'center',
                }}>P{pair.idx + 1}</span>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{pair.a?.name ?? '?'}</span>
                  <span style={{
                    color: T.gold, fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 13,
                  }}>и</span>
                  <span style={{
                    fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{pair.b?.name ?? '?'}</span>
                </div>
                <span style={{
                  fontFamily: T.fontSerif, fontSize: 12, fontStyle: 'italic',
                  color: T.muted, flexShrink: 0,
                }}>{pair.a?.level}/{pair.b?.level}</span>
              </div>
            );
          })}
        </div>
      </EGoldFrame>
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
    { id: 'right', label: 'Right' },
    { id: 'left',  label: 'Left' },
    { id: 'both',  label: 'Universal' },
  ];

  return (
    <>
      <StepTitle title="Add a Player" subtitle="To library and selection" />

      <div style={{ marginBottom: 14 }}>
        <ELabel style={{ marginBottom: 6 }}>Name</ELabel>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          autoFocus
          style={{
            width: '100%', background: T.paper,
            border: `1px solid ${T.paperEdge}`, borderRadius: 14,
            padding: '14px 16px',
            fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 500,
            color: T.ink, outline: 'none',
          }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <ELabel style={{ marginBottom: 8 }}>Level</ELabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {LEVELS.map((l) => {
            const active = l === level;
            const display = LEVEL_COLORS[l]?.label ?? l;
            return (
              <div key={l} onClick={() => setLevel(l)} style={{
                textAlign: 'center', padding: '10px 4px',
                background: active ? T.emerald : T.paper,
                color: active ? T.cream : T.ink,
                border: `1px solid ${active ? T.emerald : T.paperEdge}`,
                borderRadius: 14, cursor: 'pointer',
                fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600, letterSpacing: 1,
              }}>{display}</div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <ELabel style={{ marginBottom: 8 }}>Preferred side</ELabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {SIDES.map((s) => {
            const active = s.id === side;
            const letter = s.id === 'right' ? 'R' : s.id === 'left' ? 'L' : 'U';
            return (
              <div key={s.id} onClick={() => setSide(s.id)} style={{
                textAlign: 'center', padding: '12px 6px',
                background: active ? T.emerald : T.paper,
                color: active ? T.cream : T.ink,
                border: `1px solid ${active ? T.emerald : T.paperEdge}`,
                borderRadius: 14, cursor: 'pointer',
                fontFamily: T.fontDisplay,
              }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{letter}</div>
                <div style={{
                  fontFamily: T.fontSerif, fontStyle: 'italic',
                  fontSize: 11, opacity: 0.85, marginTop: 2,
                }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button onClick={onCancel} disabled={create.isPending} style={{
          flex: 1, height: 48, borderRadius: 999,
          border: `1px solid ${T.rule}`, background: 'transparent',
          color: T.muted, fontFamily: T.fontDisplay,
          fontWeight: 600, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase',
          cursor: 'pointer',
        }}>Cancel</button>
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
            flex: 1, height: 48, borderRadius: 999, border: 'none',
            background: !name.trim() || create.isPending ? T.cream2 : T.emerald,
            color: !name.trim() || create.isPending ? T.muted : T.cream,
            fontFamily: T.fontDisplay,
            fontWeight: 600, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >{create.isPending ? 'Saving…' : 'Add & select'}</button>
      </div>
    </>
  );
}

function ValidationBanner({ text }: { text: string }) {
  return (
    <div style={{
      background: '#fbecec', border: `1px solid ${T.burgundy}`,
      borderRadius: 12, padding: '10px 14px', marginBottom: 10,
      fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600,
      color: T.burgundy, letterSpacing: 1,
      textAlign: 'center', textTransform: 'uppercase',
    }}>{text}</div>
  );
}
