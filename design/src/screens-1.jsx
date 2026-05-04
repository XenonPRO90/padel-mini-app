// Screens 8.1 Home (active + empty), 8.2 Live Round
const { Fragment } = React;

// ─── 8.1 Home — Active tournament ──────────────────────────
function HomeActive() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, padding: '4px 16px 16px', overflowY: 'auto' }}>
        {/* tournament header */}
        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
          <div className="label">TOURNAMENT</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>Padel Masters · 04.05</div>
        </div>

        {/* hero ring */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <Ring size={220} stroke={10} value={3} max={7}>
            <div className="label" style={{ marginBottom: 4 }}>TOURNAMENT PROGRESS</div>
            <div className="num" style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, color: T.textPrimary }}>
              3<span style={{ color: T.textDim, fontWeight: 500 }}>/7</span>
            </div>
            <div className="label" style={{ marginTop: 6 }}>ROUND</div>
          </Ring>
        </div>

        {/* mini-metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: T.border, borderRadius: 14, overflow: 'hidden', margin: '20px 0', border: `1px solid ${T.border}` }}>
          <div style={{ background: T.surface, padding: '14px 16px' }}>
            <div className="label">MATCHES</div>
            <div className="num" style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>
              5<span style={{ color: T.textDim, fontWeight: 500, fontSize: 18 }}> / 8</span>
            </div>
          </div>
          <div style={{ background: T.surface, padding: '14px 16px' }}>
            <div className="label">PLAYERS</div>
            <div className="num" style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>16</div>
          </div>
        </div>

        {/* live round preview */}
        <div className="card" style={{ padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="label" style={{ color: T.accent }}>● LIVE ROUND</span>
            <span style={{ fontSize: 11, color: T.textMuted }}>{Icon.chevR(14, T.textMuted)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[1,2,3,4].map(c => {
              const done = c <= 2;
              return (
                <div key={c} style={{
                  background: T.surface2, borderRadius: 10, padding: '10px 0',
                  textAlign: 'center', border: done ? `1px solid ${T.accent}40` : `1px solid ${T.border}`,
                }}>
                  <div className="label-sm" style={{ color: done ? T.accent : T.textDim }}>C{c}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: done ? T.accent : T.textMuted, marginTop: 4 }}>
                    {done ? '✓' : '—'}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', marginTop: 12, letterSpacing: '0.1em' }}>
            5 / 8 RESULTS
          </div>
        </div>

        {/* leaderboard preview */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="label">LEADERBOARD</span>
            <span style={{ fontSize: 11, color: T.textMuted }}>{Icon.chevR(14, T.textMuted)}</span>
          </div>
          {LEADERBOARD.slice(0,3).map((p, i) => (
            <LeaderboardRow key={p.name} rank={i+1} {...p} max={LEADERBOARD[0].points}/>
          ))}
        </div>

        <div style={{ height: 16 }}/>
        <button style={{
          background: 'transparent', border: 'none', color: T.loss,
          fontSize: 11, fontWeight: 600, letterSpacing: '0.16em',
          width: '100%', padding: 12, textTransform: 'uppercase',
        }}>END TOURNAMENT</button>
      </div>

      {/* sticky CTA + tab bar */}
      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${T.border}`, background: T.bg }}>
        <MainButton label="WAITING FOR RESULTS · 5/8" disabled/>
      </div>
      <TabBar active="tournament"/>
    </div>
  );
}

// ─── 8.1 Home — Empty (no active tournament) ───────────────
function HomeEmpty() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, padding: '24px 16px 16px', display: 'flex', flexDirection: 'column' }}>
        {/* empty state */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '40px 0' }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: T.surface,
          }}>
            {Icon.trophy(56, T.textDim)}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="label" style={{ fontSize: 12 }}>NO ACTIVE TOURNAMENT</div>
            <div style={{ fontSize: 14, color: T.textDim, marginTop: 8, lineHeight: 1.4 }}>
              Start a new one to begin the round
            </div>
          </div>
        </div>

        {/* last finished preview */}
        <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="label">LAST TOURNAMENT</span>
            <span>{Icon.chevR(14, T.textMuted)}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Padel Masters · 29.04</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, letterSpacing: '0.04em' }}>
            29 APR · ROTATING · 16 PLAYERS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13 }}>
            {Icon.medal1(16)}
            <span style={{ color: T.accent, fontWeight: 600 }}>Хосе & Кристиан</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${T.border}`, background: T.bg }}>
        <MainButton label="START NEW TOURNAMENT"/>
      </div>
      <TabBar active="tournament"/>
    </div>
  );
}

// ─── 8.2 Live Round ────────────────────────────────────────
function LiveRound({ courtsState, onCourtClick }) {
  const courts = courtsState || [
    { ...COURTS[0], status: 'team1' },
    { ...COURTS[1], status: 'team2' },
    { ...COURTS[2], status: 'pending' },
    { ...COURTS[3], status: 'pending' },
  ];
  const recorded = courts.filter(c => c.status !== 'pending').length;
  const total = courts.length;
  const allDone = recorded === total;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* header */}
      <div style={{ padding: '4px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{ background: 'transparent', border: 'none', padding: 4, color: T.textMuted }}>
          {Icon.back(22)}
        </button>
        <div style={{ flex: 1 }}>
          <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>
            ROUND <span style={{ color: T.accent }}>3</span>
            <span style={{ color: T.textDim, fontWeight: 500 }}> / 7</span>
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Padel Masters · 04.05</div>
        </div>
        <button style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 999, padding: '6px 10px', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          {Icon.share(13, T.textMuted)} SHARE
        </button>
      </div>

      {/* segmented control */}
      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{ display: 'flex', background: T.surface, borderRadius: 999, padding: 3, border: `1px solid ${T.border}` }}>
          <div style={{
            flex: 1, textAlign: 'center', padding: '8px 0',
            background: T.surface2, borderRadius: 999, color: T.accent,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          }}>MATCHES</div>
          <div style={{
            flex: 1, textAlign: 'center', padding: '8px 0',
            color: T.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
          }}>SCHEDULE</div>
        </div>
      </div>

      {/* court list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {courts.map((c, i) => (
          <div key={c.court} onClick={() => onCourtClick && onCourtClick(i)} style={{ cursor: 'pointer' }}>
            <CourtCard {...c}/>
          </div>
        ))}
      </div>

      {/* sticky bottom */}
      <div style={{ padding: '10px 16px 12px', borderTop: `1px solid ${T.border}`, background: T.bg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className="label" style={{ fontSize: 10 }}>{recorded} / {total} RESULTS</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {courts.map((c, i) => (
              <div key={i} style={{
                width: 22, height: 4, borderRadius: 2,
                background: c.status !== 'pending' ? T.accent : T.border,
              }}/>
            ))}
          </div>
        </div>
        <MainButton label={allDone ? 'NEXT ROUND' : `WAITING · ${recorded}/${total}`} disabled={!allDone}/>
      </div>
    </div>
  );
}

Object.assign(window, { HomeActive, HomeEmpty, LiveRound });
