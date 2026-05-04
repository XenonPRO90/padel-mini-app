// Screen 8.7 New Tournament Wizard — split into 9 phone frames

function WizardHeader({ step, total = 9, title }) {
  return (
    <div style={{ padding: '8px 16px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button style={{ background: 'transparent', border: 'none', color: T.textMuted, padding: 4 }}>
          {Icon.back(22)}
        </button>
        <div className="label" style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>NEW TOURNAMENT</div>
        <div className="num" style={{ width: 50, textAlign: 'right', fontSize: 12, color: T.textMuted, fontWeight: 600, letterSpacing: '0.05em' }}>
          {step} / {total}
        </div>
      </div>
      {/* progress bar with dots */}
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i + 1 <= step ? T.accent : T.border,
            transition: 'background 200ms',
          }}/>
        ))}
      </div>
      <div style={{ marginTop: 22 }}>
        <div className="label" style={{ marginBottom: 6 }}>STEP {step}</div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</div>
      </div>
    </div>
  );
}

function WizardShell({ step, title, ctaLabel = 'NEXT', children, ctaDisabled, validation }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WizardHeader step={step} title={title}/>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {children}
      </div>
      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${T.border}` }}>
        {validation && (
          <div style={{
            background: `${T.warn}14`, border: `1px solid ${T.warn}40`, borderRadius: 10,
            padding: '8px 12px', marginBottom: 10,
            fontSize: 11, color: T.warn, fontWeight: 600, letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>⚠  {validation}</div>
        )}
        <MainButton label={ctaLabel} disabled={ctaDisabled}/>
      </div>
    </div>
  );
}

// Step 1 — Name
function WizardStep1() {
  return (
    <WizardShell step={1} title="Tournament name">
      <div style={{ marginTop: 20 }}>
        <div style={{
          background: T.surface, border: `1px solid ${T.accent}`, borderRadius: 12,
          padding: '16px 16px', fontSize: 18, fontWeight: 600,
        }}>
          Padel Masters · 04.05<span style={{ color: T.accent, animation: 'blink 1s step-end infinite' }}>|</span>
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 10, padding: '0 4px' }}>
          Default: PADEL MASTERS — DD.MM
        </div>
      </div>
    </WizardShell>
  );
}

// Step 2 — Courts
function WizardStep2() {
  return (
    <WizardShell step={2} title="How many courts?">
      <div style={{ marginTop: 30, textAlign: 'center' }}>
        <div className="num" style={{ fontSize: 96, fontWeight: 700, color: T.accent, lineHeight: 1 }}>4</div>
        <div className="label" style={{ marginTop: 6 }}>COURTS</div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 30 }}>
        {[2,3,4,5,6].map(n => {
          const active = n === 4;
          return (
            <div key={n} style={{
              width: 50, height: 50, borderRadius: 12,
              background: active ? T.accent : T.surface,
              color: active ? '#0B0E12' : T.textMuted,
              border: `1px solid ${active ? T.accent : T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700,
            }}>{n}</div>
          );
        })}
      </div>
    </WizardShell>
  );
}

// Step 3 — Mode
function WizardStep3() {
  return (
    <WizardShell step={3} title="Pairing mode">
      {[
        { id: 'rotating', title: 'ROTATING PARTNERS', desc: 'Pairs change every round based on level balance', active: true },
        { id: 'fixed', title: 'FIXED PAIRS', desc: 'Same partner all tournament' },
      ].map(m => (
        <div key={m.id} style={{
          background: m.active ? `${T.accent}10` : T.surface,
          border: `1.5px solid ${m.active ? T.accent : T.border}`,
          borderRadius: 14, padding: '18px 16px', marginBottom: 12,
          position: 'relative',
        }}>
          <div className="label" style={{ color: m.active ? T.accent : T.textMuted, marginBottom: 8 }}>{m.title}</div>
          <div style={{ fontSize: 13, color: T.textPrimary, lineHeight: 1.4 }}>{m.desc}</div>
          {m.active && (
            <div style={{
              position: 'absolute', top: 14, right: 14,
              width: 22, height: 22, borderRadius: '50%', background: T.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{Icon.check(12, '#0B0E12')}</div>
          )}
        </div>
      ))}
    </WizardShell>
  );
}

// Step 4 — Order
function WizardStep4() {
  return (
    <WizardShell step={4} title="Initial court order">
      {[
        { id: 'entry', title: 'BY ENTRY', desc: 'Place strongest players on Court 1', active: true },
        { id: 'random', title: 'RANDOM', desc: 'Shuffle players across courts' },
      ].map(m => (
        <div key={m.id} style={{
          background: m.active ? `${T.accent}10` : T.surface,
          border: `1.5px solid ${m.active ? T.accent : T.border}`,
          borderRadius: 14, padding: '18px 16px', marginBottom: 12,
          position: 'relative',
        }}>
          <div className="label" style={{ color: m.active ? T.accent : T.textMuted, marginBottom: 8 }}>{m.title}</div>
          <div style={{ fontSize: 13, color: T.textPrimary, lineHeight: 1.4 }}>{m.desc}</div>
          {m.active && (
            <div style={{
              position: 'absolute', top: 14, right: 14,
              width: 22, height: 22, borderRadius: '50%', background: T.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{Icon.check(12, '#0B0E12')}</div>
          )}
        </div>
      ))}
    </WizardShell>
  );
}

// Stepper number control
function NumStepper({ value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
      padding: '8px 8px',
    }}>
      <button style={{
        width: 44, height: 44, borderRadius: 10, border: `1px solid ${T.border}`,
        background: T.surface2, color: T.textPrimary, fontSize: 22, fontWeight: 600,
      }}>−</button>
      <div className="num" style={{ flex: 1, textAlign: 'center', fontSize: 36, fontWeight: 700, color: T.accent }}>{value}</div>
      <button style={{
        width: 44, height: 44, borderRadius: 10, border: `1px solid ${T.border}`,
        background: T.surface2, color: T.textPrimary, fontSize: 22, fontWeight: 600,
      }}>+</button>
    </div>
  );
}

// Step 5 — Initial points
function WizardStep5() {
  return (
    <WizardShell step={5} title="Initial points per win">
      <div style={{ marginTop: 16 }}>
        <NumStepper value={1}/>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 14, lineHeight: 1.5, padding: '0 4px' }}>
          Points per win until court-specific points kick in.
        </div>
      </div>
    </WizardShell>
  );
}

// Step 6 — Start round
function WizardStep6() {
  return (
    <WizardShell step={6} title="Start round for court points">
      <div style={{ marginTop: 16 }}>
        <NumStepper value={4}/>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 14, lineHeight: 1.5, padding: '0 4px' }}>
          Round when different winning points per court start to apply.
        </div>
      </div>
    </WizardShell>
  );
}

// Step 7 — Court points
function WizardStep7() {
  const courts = [
    { n: 1, label: '(strongest)', pts: 3 },
    { n: 2, label: '', pts: 2 },
    { n: 3, label: '', pts: 1 },
    { n: 4, label: '(weakest)', pts: 1 },
  ];
  return (
    <WizardShell step={7} title="Points per court">
      <div className="card" style={{ padding: '4px 16px', marginTop: 8 }}>
        {courts.map((c, i) => (
          <div key={c.n} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
            borderBottom: i < courts.length - 1 ? `1px solid ${T.border}` : 'none',
          }}>
            <div style={{ flex: 1 }}>
              <div className="label" style={{ fontSize: 12, color: T.textPrimary, letterSpacing: '0.08em' }}>COURT {c.n}</div>
              {c.label && <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{c.label}</div>}
            </div>
            <div style={{
              width: 76, height: 44, borderRadius: 10,
              background: T.surface2, border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span className="num" style={{ fontSize: 22, fontWeight: 700, color: T.accent }}>{c.pts}</span>
              <span style={{ fontSize: 10, color: T.textMuted, letterSpacing: '0.1em' }}>PTS</span>
            </div>
          </div>
        ))}
      </div>
    </WizardShell>
  );
}

// Step 8 — Players multiselect
function WizardStep8({ notDivisible }) {
  const selected = notDivisible
    ? [0,1,2,3,4,5,6,7,8,9,10,11,12,13]
    : [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WizardHeader step={8} title="Select players"/>

      {/* sticky select counter */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{
          background: T.surface, border: `1px solid ${notDivisible ? T.warn : T.border}`,
          borderRadius: 12, padding: '12px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div className="label" style={{ color: notDivisible ? T.warn : T.textMuted }}>
              {notDivisible ? 'NOT DIVISIBLE BY 4' : 'SELECTED'}
            </div>
            <div className="num" style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>
              {selected.length} <span style={{ color: T.textDim, fontSize: 16 }}>/ 16</span>
            </div>
          </div>
          <div style={{
            background: notDivisible ? `${T.warn}1c` : `${T.accent}14`,
            color: notDivisible ? T.warn : T.accent,
            borderRadius: 999, padding: '6px 12px',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          }}>
            {notDivisible ? 'NEED ÷ 4' : '4 COURTS · 4 EACH'}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        <div className="card" style={{ padding: '0 12px' }}>
          {PLAYERS.map((p, i) => {
            const isSelected = selected.includes(i);
            const order = isSelected ? selected.indexOf(i) + 1 : null;
            return (
              <div key={p.name} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px',
                borderBottom: i < PLAYERS.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: isSelected ? T.accent : 'transparent',
                  border: `1.5px solid ${isSelected ? T.accent : T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0B0E12', fontSize: 11, fontWeight: 700,
                }}>
                  {isSelected ? order : ''}
                </div>
                <Avatar name={p.name} size={32}/>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{p.name}</span>
                <SideBadge side={p.side}/>
                <LevelBadge level={p.level} size="sm"/>
              </div>
            );
          })}
        </div>

        <button style={{
          width: '100%', marginTop: 12, padding: '14px',
          background: 'transparent', border: `1px dashed ${T.border}`, borderRadius: 12,
          color: T.accent, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {Icon.plus(16, T.accent)} ADD NEW PLAYER
        </button>
      </div>

      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${T.border}` }}>
        {notDivisible && (
          <div style={{
            background: `${T.warn}14`, border: `1px solid ${T.warn}40`, borderRadius: 10,
            padding: '8px 12px', marginBottom: 10,
            fontSize: 11, color: T.warn, fontWeight: 600, letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>⚠ Need 16 players (multiple of 4)</div>
        )}
        <MainButton label="NEXT" disabled={notDivisible}/>
      </div>
    </div>
  );
}

// Step 9 — Confirm
function WizardStep9() {
  const summary = [
    { label: 'NAME', value: 'Padel Masters · 04.05' },
    { label: 'COURTS', value: '4' },
    { label: 'MODE', value: 'Rotating partners' },
    { label: 'ORDER', value: 'By entry' },
    { label: 'INITIAL POINTS', value: '1 pt' },
    { label: 'START ROUND', value: 'Round 4' },
    { label: 'COURT POINTS', value: '3 / 2 / 1 / 1' },
    { label: 'PLAYERS', value: '16' },
  ];
  return (
    <WizardShell step={9} title="Confirm tournament" ctaLabel="START TOURNAMENT">
      <div className="card" style={{ padding: '4px 16px', marginTop: 8 }}>
        {summary.map((s, i) => (
          <div key={s.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0',
            borderBottom: i < summary.length - 1 ? `1px solid ${T.border}` : 'none',
          }}>
            <span className="label" style={{ fontSize: 11 }}>{s.label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{s.value}</span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 16, padding: '14px',
        background: `${T.accent}10`, border: `1px solid ${T.accent}40`, borderRadius: 12,
        fontSize: 13, color: T.accent, lineHeight: 1.5, textAlign: 'center', fontWeight: 500,
      }}>
        Round 1 will be generated automatically once you start.
      </div>
    </WizardShell>
  );
}

Object.assign(window, { WizardStep1, WizardStep2, WizardStep3, WizardStep4, WizardStep5, WizardStep6, WizardStep7, WizardStep8, WizardStep9 });
