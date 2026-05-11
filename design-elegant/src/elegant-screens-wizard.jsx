// Elegant — 8.7 Wizard (9 steps)

function EWizardShell({ step, title, subtitle, children, primaryLabel = 'Continue', secondaryLabel = 'Back', canContinue = true }) {
  return (
    <EPhone>
      <EAppHeader title={`STEP ${step} OF 9`} left={<EBack/>}/>
      {/* Progress ornament */}
      <div style={{ padding: '8px 24px 0' }}>
        <EWizardProgress step={step}/>
      </div>
      <div style={{ padding: '16px 22px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{
            fontFamily: E.fontDisplay, fontSize: 22, fontWeight: 600,
            letterSpacing: 2, color: E.ink,
          }}>{title}</div>
          {subtitle && (
            <div style={{
              marginTop: 4, fontFamily: E.fontSerif, fontStyle: 'italic',
              fontSize: 14, color: E.muted,
            }}>{subtitle}</div>
          )}
          <div style={{ marginTop: 8 }}><EDivider/></div>
        </div>

        <div style={{ flex: 1 }}>{children}</div>

        <div style={{ marginTop: 18 }}>
          <EBtn kind="primary" style={{ width: '100%' }} disabled={!canContinue}>{primaryLabel}</EBtn>
        </div>
      </div>
    </EPhone>
  );
}

function EWizardProgress({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {Array.from({ length: 9 }, (_, i) => {
        const n = i + 1;
        const filled = n <= step;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 8, height: 8, borderRadius: 999,
              background: filled ? E.gold : 'transparent',
              border: `1px solid ${filled ? E.gold : E.rule}`,
              flexShrink: 0,
            }}/>
            {i < 8 && (
              <div style={{
                flex: 1, height: 1,
                background: n < step ? E.gold : E.rule,
                opacity: n < step ? 1 : 0.4,
              }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Step 1 — Tournament Name
function EWizardStep1() {
  return (
    <EWizardShell step={1} title="Name the Tournament" subtitle="A name to be remembered by">
      <EField label="Tournament Name" value="Padel Masters with Jose"/>
      <div style={{ marginTop: 16 }}>
        <EField label="Date" value="04.05.2026"/>
      </div>
      <div style={{ marginTop: 18, textAlign: 'center' }}>
        <ELabel style={{ marginBottom: 6 }}>Suggested</ELabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {['Saturday Match', 'Spring Cup', 'Evening Round'].map(s => (
            <span key={s} style={{
              fontFamily: E.fontSerif, fontStyle: 'italic',
              fontSize: 13, color: E.gold, padding: '6px 12px',
              border: `1px solid ${E.rule}`, borderRadius: 999,
            }}>{s}</span>
          ))}
        </div>
      </div>
    </EWizardShell>
  );
}

// Step 2 — Number of Courts
function EWizardStep2() {
  return (
    <EWizardShell step={2} title="How many courts?" subtitle="Tonight's stage">
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        marginTop: 8,
      }}>
        {[1,2,3,4,5,6].map(n => {
          const active = n === 4;
          return (
            <div key={n} style={{
              aspectRatio: '1', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column',
              background: active ? E.emerald : E.paper,
              color: active ? E.cream : E.ink,
              border: `1px solid ${active ? E.emerald : E.paperEdge}`,
              borderRadius: E.radius, cursor: 'pointer',
            }}>
              <div style={{ fontFamily: E.fontDisplay, fontSize: 28, fontWeight: 600 }}>{n}</div>
              <div style={{ fontFamily: E.fontSerif, fontSize: 11, fontStyle: 'italic', opacity: 0.8 }}>
                {n === 1 ? 'court' : 'courts'}
              </div>
            </div>
          );
        })}
      </div>
    </EWizardShell>
  );
}

// Step 3 — Mode
function EWizardStep3() {
  const modes = [
    { k: 'classic', t: 'Classic', d: 'Random pairs every round' },
    { k: 'king', t: 'King of the Court', d: 'Winners stay, losers rotate' },
    { k: 'americano', t: 'Americano', d: 'Each pair plays every other' },
  ];
  return (
    <EWizardShell step={3} title="Choose the Format" subtitle="How will the matches unfold?">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {modes.map((m, i) => {
          const active = m.k === 'classic';
          return (
            <div key={m.k} style={{
              padding: '14px 16px',
              background: active ? '#f9f1de' : E.paper,
              border: `1px solid ${active ? E.gold : E.paperEdge}`,
              borderRadius: E.radius, cursor: 'pointer',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: E.fontDisplay, fontSize: 17, fontWeight: 600, color: E.ink }}>{m.t}</div>
                {active && <span style={{ color: E.gold, fontSize: 16 }}>✓</span>}
              </div>
              <div style={{
                marginTop: 2, fontFamily: E.fontSerif, fontStyle: 'italic',
                fontSize: 13, color: E.muted,
              }}>{m.d}</div>
            </div>
          );
        })}
      </div>
    </EWizardShell>
  );
}

// Step 4 — Pairing order
function EWizardStep4() {
  return (
    <EWizardShell step={4} title="Pairing Order" subtitle="How partners are chosen">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { t: 'By Level', d: 'Balance strength on each court' },
          { t: 'Random', d: 'Pure chance, pure delight' },
          { t: 'Manual', d: 'You decide the pairs' },
        ].map((opt, i) => {
          const active = i === 0;
          return (
            <div key={i} style={{
              padding: '14px 16px',
              background: active ? '#f9f1de' : E.paper,
              border: `1px solid ${active ? E.gold : E.paperEdge}`,
              borderRadius: E.radius,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: E.fontDisplay, fontSize: 17, fontWeight: 600 }}>{opt.t}</div>
                {active && <span style={{ color: E.gold }}>✓</span>}
              </div>
              <div style={{
                marginTop: 2, fontFamily: E.fontSerif, fontStyle: 'italic',
                fontSize: 13, color: E.muted,
              }}>{opt.d}</div>
            </div>
          );
        })}
      </div>
    </EWizardShell>
  );
}

// Step 5 — Initial points
function EWizardStep5() {
  return (
    <EWizardShell step={5} title="Initial Points" subtitle="Where everyone begins">
      <div style={{ textAlign: 'center', marginTop: 30 }}>
        <div style={{
          fontFamily: E.fontDisplay, fontSize: 88, fontWeight: 600,
          color: E.ink, lineHeight: 1,
        }}>0</div>
        <div style={{ fontFamily: E.fontSerif, fontSize: 14, fontStyle: 'italic', color: E.muted, marginTop: 4 }}>points each</div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 30 }}>
          <EBtn kind="outline" style={{ width: 60, height: 60, padding: 0, fontSize: 24 }}>−</EBtn>
          <EBtn kind="outline" style={{ width: 60, height: 60, padding: 0, fontSize: 24 }}>+</EBtn>
        </div>
      </div>
    </EWizardShell>
  );
}

// Step 6 — Start round
function EWizardStep6() {
  return (
    <EWizardShell step={6} title="Starting Round" subtitle="Where the tournament begins">
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <div style={{ fontFamily: E.fontDisplay, fontSize: 64, fontWeight: 600, color: E.ink, lineHeight: 1 }}>
          1<span style={{ color: E.muted, fontWeight: 400, fontSize: 28 }}> / 7</span>
        </div>
        <div style={{ fontFamily: E.fontSerif, fontSize: 14, fontStyle: 'italic', color: E.muted, marginTop: 4 }}>
          starting round / total rounds
        </div>

        <div style={{ marginTop: 30, textAlign: 'left' }}>
          <ELabel style={{ marginBottom: 8, textAlign: 'center' }}>Total Rounds</ELabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[5, 6, 7, 8].map(n => {
              const active = n === 7;
              return (
                <div key={n} style={{
                  textAlign: 'center', padding: '14px 0',
                  background: active ? E.emerald : E.paper,
                  color: active ? E.cream : E.ink,
                  border: `1px solid ${active ? E.emerald : E.paperEdge}`,
                  borderRadius: E.radius,
                  fontFamily: E.fontDisplay, fontSize: 20, fontWeight: 600,
                }}>{n}</div>
              );
            })}
          </div>
        </div>
      </div>
    </EWizardShell>
  );
}

// Step 7 — Court points
function EWizardStep7() {
  return (
    <EWizardShell step={7} title="Points per Court" subtitle="What each victory is worth">
      <div style={{ marginTop: 12 }}>
        {[
          { c: 1, p: 3, label: 'Centre Court' },
          { c: 2, p: 2, label: 'Second' },
          { c: 3, p: 1, label: 'Third' },
          { c: 4, p: 1, label: 'Fourth' },
        ].map(row => (
          <div key={row.c} style={{
            display: 'grid', gridTemplateColumns: '54px 1fr auto',
            alignItems: 'center', gap: 12,
            padding: '14px 16px', marginBottom: 8,
            background: E.paper, border: `1px solid ${E.paperEdge}`,
            borderRadius: E.radius,
          }}>
            <div style={{
              background: E.emerald, color: E.cream,
              borderRadius: 10, padding: '8px 0', textAlign: 'center',
            }}>
              <div style={{ fontFamily: E.fontDisplay, fontSize: 9, letterSpacing: 2 }}>КОРТ</div>
              <div style={{ fontFamily: E.fontDisplay, fontSize: 20, fontWeight: 600, lineHeight: 1 }}>{row.c}</div>
            </div>
            <div style={{ fontFamily: E.fontSerif, fontStyle: 'italic', fontSize: 14, color: E.muted }}>
              {row.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: E.fontDisplay, fontSize: 24, fontWeight: 600, color: E.goldDeep }}>{row.p}</span>
              <span style={{ fontFamily: E.fontSerif, fontStyle: 'italic', fontSize: 12, color: E.muted }}>
                {row.p === 1 ? 'pt' : 'pts'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </EWizardShell>
  );
}

// Step 8 — Players (with edge case for not divisible)
function EWizardStep8({ notDivisible }) {
  const selected = notDivisible ? 15 : 16;
  return (
    <EWizardShell step={8}
      title="Select Players"
      subtitle={`${selected} of ${E_PLAYERS.length} chosen`}
      canContinue={selected % 4 === 0}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
        {E_PLAYERS.slice(0, 12).map((p, i) => {
          const checked = i < (notDivisible ? 11 : 12);
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '24px 1fr auto',
              alignItems: 'center', gap: 10,
              padding: '10px 14px',
              background: checked ? '#f9f1de' : E.paper,
              border: `1px solid ${checked ? E.gold : E.paperEdge}`,
              borderRadius: E.radius,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 4,
                border: `1px solid ${checked ? E.gold : E.rule}`,
                background: checked ? E.gold : 'transparent',
                color: E.cream, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 12,
              }}>{checked ? '✓' : ''}</div>
              <div style={{ fontFamily: E.fontDisplay, fontSize: 15, fontWeight: 500 }}>{p.name}</div>
              <ELevelBadge level={p.level}/>
            </div>
          );
        })}
      </div>
      {notDivisible && (
        <div style={{
          marginTop: 12, padding: '12px 14px',
          background: '#fbecec', border: `1px solid ${E.burgundy}`,
          borderRadius: E.radius, textAlign: 'center',
        }}>
          <div style={{ fontFamily: E.fontDisplay, fontSize: 13, color: E.burgundy, letterSpacing: 1 }}>
            {selected} players · need a multiple of 4
          </div>
          <div style={{ fontFamily: E.fontSerif, fontStyle: 'italic', fontSize: 12, color: E.muted, marginTop: 2 }}>
            Add 1 more or remove {selected % 4} to continue
          </div>
        </div>
      )}
    </EWizardShell>
  );
}

// Step 9 — Confirm
function EWizardStep9() {
  return (
    <EWizardShell step={9} title="Ready to Begin" subtitle="Review and start the tournament" primaryLabel="Start Tournament">
      <EGoldFrame>
        <div style={{ padding: '14px 18px' }}>
          {[
            ['Name', 'Padel Masters with Jose'],
            ['Date', '04.05.2026'],
            ['Format', 'Classic'],
            ['Pairing', 'By Level'],
            ['Courts', '4'],
            ['Rounds', '7'],
            ['Players', '16'],
            ['Initial Points', '0'],
          ].map(([k, v], i, arr) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'baseline', padding: '10px 0',
              borderBottom: i === arr.length - 1 ? 'none' : `1px dotted ${E.rule}`,
            }}>
              <span style={{
                fontFamily: E.fontDisplay, fontSize: 10, letterSpacing: 2.5,
                color: E.gold, textTransform: 'uppercase',
              }}>{k}</span>
              <span style={{ fontFamily: E.fontDisplay, fontSize: 15, fontWeight: 500, color: E.ink }}>{v}</span>
            </div>
          ))}
        </div>
      </EGoldFrame>

      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <EDivider icon={<EBallIcon size={14}/>}/>
        <div style={{
          marginTop: 8, fontFamily: E.fontSerif, fontStyle: 'italic',
          fontSize: 13, color: E.muted,
        }}>The court awaits. Best of luck.</div>
      </div>
    </EWizardShell>
  );
}

Object.assign(window, {
  EWizardShell, EWizardProgress,
  EWizardStep1, EWizardStep2, EWizardStep3, EWizardStep4, EWizardStep5,
  EWizardStep6, EWizardStep7, EWizardStep8, EWizardStep9,
});
