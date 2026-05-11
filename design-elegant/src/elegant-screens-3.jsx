// Elegant — 8.5 Players Library, 8.6 Edit/New Player

function EPlayersLibrary() {
  const sorted = [...E_PLAYERS].sort((a,b) => a.name.localeCompare(b.name));
  return (
    <EPhone>
      <EAppHeader title="PLAYERS"
        left={<EBack label="Home"/>}
        right={<span style={{ fontFamily: E.fontDisplay, fontSize: 22, color: E.gold, lineHeight: 1 }}>+</span>}
      />
      <div style={{ padding: '14px 18px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <ELabel>The Library · {E_PLAYERS.length} guests</ELabel>
        </div>

        {/* Search field */}
        <div style={{
          background: E.paper, border: `1px solid ${E.paperEdge}`,
          borderRadius: 999, padding: '10px 18px',
          fontFamily: E.fontSerif, fontSize: 15, fontStyle: 'italic',
          color: E.muted, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ color: E.gold }}>⌕</span>
          <span>Search by name…</span>
        </div>

        <EGoldFrame>
          <div style={{ padding: '4px 0' }}>
            {sorted.map((p, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto',
                gap: 12, alignItems: 'center',
                padding: '12px 16px',
                borderBottom: i === sorted.length - 1 ? 'none' : `1px solid ${E.paperEdge}`,
              }}>
                <div style={{ fontFamily: E.fontDisplay, fontSize: 16, fontWeight: 500, color: E.ink }}>
                  {p.name}
                </div>
                <ESideDot side={p.side}/>
                <ELevelBadge level={p.level}/>
              </div>
            ))}
          </div>
        </EGoldFrame>
      </div>
    </EPhone>
  );
}

function EPlayerEdit() {
  const p = E_PLAYERS[1]; // Jose
  return (
    <EPhone>
      <EAppHeader title="EDIT PLAYER" left={<EBack/>}/>
      <div style={{ padding: '18px 22px 30px' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <ELogo size={48}/>
          <div style={{ marginTop: 4 }}><EOrnRule width={200}/></div>
        </div>

        <EField label="Name" value={p.name}/>

        <div style={{ marginTop: 16 }}>
          <ELabel style={{ marginBottom: 8 }}>Level</ELabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {['A+','A','B+','B','C+','C','C-','C-strong','D'].map(l => {
              const active = l === p.level;
              return (
                <div key={l} style={{
                  textAlign: 'center', padding: '10px 0',
                  background: active ? E.emerald : E.paper,
                  color: active ? E.cream : E.ink,
                  border: `1px solid ${active ? E.emerald : E.paperEdge}`,
                  borderRadius: E.radius, cursor: 'pointer',
                  fontFamily: E.fontDisplay, fontSize: 15, fontWeight: 600,
                  letterSpacing: 1,
                }}>{E.levels[l]?.label || l}</div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <ELabel style={{ marginBottom: 8 }}>Preferred Side</ELabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { k: 'R', label: 'Right' },
              { k: 'L', label: 'Left' },
              { k: 'U', label: 'Universal' },
            ].map(s => {
              const active = s.k === p.side;
              return (
                <div key={s.k} style={{
                  textAlign: 'center', padding: '12px 0',
                  background: active ? E.emerald : E.paper,
                  color: active ? E.cream : E.ink,
                  border: `1px solid ${active ? E.emerald : E.paperEdge}`,
                  borderRadius: E.radius, cursor: 'pointer',
                  fontFamily: E.fontDisplay, fontSize: 15,
                }}>
                  <div style={{ fontWeight: 600 }}>{s.k}</div>
                  <div style={{ fontFamily: E.fontSerif, fontStyle: 'italic', fontSize: 12, opacity: 0.85 }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <EBtn kind="primary" style={{ width: '100%' }}>Save Changes</EBtn>
          <div style={{ marginTop: 8 }}>
            <EBtn kind="quiet" style={{ width: '100%', color: E.burgundy }}>Delete Player</EBtn>
          </div>
        </div>
      </div>
    </EPhone>
  );
}

function EField({ label, value }) {
  return (
    <div>
      <ELabel style={{ marginBottom: 6 }}>{label}</ELabel>
      <div style={{
        background: E.paper, border: `1px solid ${E.paperEdge}`,
        borderRadius: E.radius, padding: '14px 16px',
        fontFamily: E.fontDisplay, fontSize: 18, fontWeight: 500, color: E.ink,
      }}>{value}</div>
    </div>
  );
}

function EPlayersEmpty() {
  return (
    <EPhone>
      <EAppHeader title="PLAYERS" left={<EBack/>}/>
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <ELogo size={72} color={E.goldSoft}/>
        <div style={{
          fontFamily: E.fontDisplay, fontSize: 22, fontWeight: 600,
          color: E.ink, marginTop: 14, letterSpacing: 2,
        }}>The library is empty</div>
        <EDivider/>
        <div style={{
          fontFamily: E.fontSerif, fontSize: 15, fontStyle: 'italic',
          color: E.muted, lineHeight: 1.45, margin: '14px 6px 22px',
        }}>
          Add your first guest to begin composing tournaments.
        </div>
        <EBtn kind="primary">Add a Player</EBtn>
      </div>
    </EPhone>
  );
}

Object.assign(window, { EPlayersLibrary, EPlayerEdit, EField, EPlayersEmpty });
