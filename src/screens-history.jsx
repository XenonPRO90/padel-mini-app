// Screens 8.8 History list, 8.9 Tournament Detail, 8.10 Round Detail, States (skeleton/empty/error)

// ─── 8.8 Tournament History ────────────────────────────────
function TournamentHistory() {
  const items = [
    { name: 'Padel Masters · 29.04', date: '29 APR', mode: 'ROTATING', players: 16, w1: 'Хосе & Кристиан' },
    { name: 'Padel Masters · 22.04', date: '22 APR', mode: 'FIXED', players: 12, w1: 'Никита & Иван' },
    { name: 'Wednesday Cup · 17.04', date: '17 APR', mode: 'ROTATING', players: 16, w1: 'Саша & Илья' },
    { name: 'Padel Masters · 15.04', date: '15 APR', mode: 'ROTATING', players: 16, w1: 'Павел & Ирина' },
    { name: 'Spring Open · 08.04', date: '08 APR', mode: 'FIXED', players: 20, w1: 'Никита & Артём' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 16px 4px' }}>
        <div className="label">HISTORY</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }} className="num">{items.length}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{it.name}</div>
                <div className="label-sm" style={{ marginTop: 6 }}>
                  {it.date} · {it.mode} · {it.players} PLAYERS
                </div>
              </div>
              {Icon.chevR(14, T.textMuted)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 12px', background: T.surface2, borderRadius: 10 }}>
              {Icon.medal1(16)}
              <span style={{ color: T.accent, fontWeight: 600, fontSize: 13 }}>{it.w1}</span>
            </div>
          </div>
        ))}
      </div>
      <TabBar active="history"/>
    </div>
  );
}

// ─── 8.9 Tournament Detail ─────────────────────────────────
function TournamentDetail() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{ background: 'transparent', border: 'none', color: T.textMuted, padding: 4 }}>
          {Icon.back(22)}
        </button>
        <div className="label" style={{ flex: 1, textAlign: 'center' }}>TOURNAMENT</div>
        <button style={{ background: 'transparent', border: 'none', color: T.textMuted, padding: 4 }}>
          {Icon.share(20, T.textMuted)}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Padel Masters · 29.04</div>
          <div className="label-sm" style={{ marginTop: 6 }}>29 APR · ROTATING · 16 PLAYERS · 7 ROUNDS</div>
        </div>

        {/* Top 3 winners — card */}
        <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
          <div className="label" style={{ marginBottom: 12 }}>FINAL STANDINGS</div>
          {LEADERBOARD.slice(0,3).map((p, i) => {
            const medals = [Icon.medal1(20), Icon.medal2(20), Icon.medal3(20)];
            return (
              <div key={p.name} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                borderBottom: i < 2 ? `1px solid ${T.border}` : 'none',
              }}>
                {medals[i]}
                <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: i === 0 ? T.accent : T.textPrimary }}>{p.name}</span>
                <LevelBadge level={p.level} size="sm"/>
                <span className="num" style={{ fontSize: 18, fontWeight: 700, minWidth: 32, textAlign: 'right', color: i === 0 ? T.accent : T.textPrimary }}>{p.points}</span>
              </div>
            );
          })}
          {/* Rest — compact */}
          <div style={{ marginTop: 8, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
            {LEADERBOARD.slice(3).map((p, i) => (
              <div key={p.name} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
              }}>
                <span className="num" style={{ width: 22, fontSize: 11, color: T.textDim, fontWeight: 700 }}>#{i+4}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{p.name}</span>
                <LevelBadge level={p.level} size="sm"/>
                <span className="num" style={{ fontSize: 13, fontWeight: 600, color: T.textMuted, minWidth: 28, textAlign: 'right' }}>{p.points}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rounds list */}
        <div className="label" style={{ marginBottom: 8, padding: '0 4px' }}>ROUNDS</div>
        <div className="card" style={{ padding: '0 16px' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
              borderBottom: i < 6 ? `1px solid ${T.border}` : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: T.accent,
              }} className="num">{i+1}</div>
              <div style={{ flex: 1 }}>
                <div className="label-sm" style={{ fontSize: 11, color: T.textPrimary, letterSpacing: '0.1em' }}>ROUND {i+1}</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>4 matches · all recorded</div>
              </div>
              {Icon.chevR(14, T.textMuted)}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${T.border}` }}>
        <SecondaryButton label="SHARE FINAL TABLE"/>
      </div>
    </div>
  );
}

// ─── 8.10 Round Detail (history, read-only) ────────────────
function RoundDetailHistory() {
  const courts = [
    { ...COURTS[0], status: 'history-t1' },
    { ...COURTS[1], status: 'history-t2' },
    { ...COURTS[2], status: 'history-t1' },
    { ...COURTS[3], status: 'history-t2' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{ background: 'transparent', border: 'none', color: T.textMuted, padding: 4 }}>
          {Icon.back(22)}
        </button>
        <div className="label" style={{ flex: 1, textAlign: 'center' }}>ROUND DETAIL</div>
        <div style={{ width: 30 }}/>
      </div>
      <div style={{ padding: '8px 16px 4px' }}>
        <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>
          ROUND <span style={{ color: T.accent }}>3</span>
          <span style={{ color: T.textDim, fontWeight: 500 }}> / 7</span>
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Padel Masters · 29.04</div>
      </div>
      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: T.surface2, border: `1px solid ${T.border}`,
          fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: '0.1em',
        }}>READ ONLY · ARCHIVED</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {courts.map(c => (
          <div key={c.court} style={{ opacity: 0.92 }}>
            <CourtCard {...c}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── States: Skeleton ──────────────────────────────────────
function HomeSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, padding: '24px 16px', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
          <div className="padel-skeleton" style={{ width: 100, height: 11, margin: '0 auto' }}/>
          <div className="padel-skeleton" style={{ width: 180, height: 18, margin: '8px auto 0' }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div className="padel-skeleton" style={{ width: 220, height: 220, borderRadius: '50%' }}/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div className="padel-skeleton" style={{ height: 70, borderRadius: 14 }}/>
          <div className="padel-skeleton" style={{ height: 70, borderRadius: 14 }}/>
        </div>
        <div className="padel-skeleton" style={{ height: 130, borderRadius: 14, marginBottom: 12 }}/>
        <div className="padel-skeleton" style={{ height: 160, borderRadius: 14 }}/>
      </div>
      <TabBar active="tournament"/>
    </div>
  );
}

// ─── States: Error ─────────────────────────────────────────
function HomeError() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: `${T.loss}14`, border: `1px solid ${T.loss}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.loss, fontSize: 28, fontWeight: 700,
        }}>!</div>
        <div className="label" style={{ color: T.loss }}>COULDN'T LOAD</div>
        <div style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', maxWidth: 240, lineHeight: 1.5 }}>
          Network's flickering. Check your connection and try again.
        </div>
        <button style={{
          marginTop: 8, padding: '12px 24px', borderRadius: 10,
          background: T.surface2, border: `1px solid ${T.border}`,
          color: T.accent, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
        }}>RETRY</button>
      </div>
      <TabBar active="tournament"/>
    </div>
  );
}

// ─── States: Players Empty ─────────────────────────────────
function PlayersEmpty() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 16px 4px' }}>
        <div className="label">PLAYERS</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 18 }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: T.surface, border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Icon.users(48, T.textDim)}</div>
        <div style={{ textAlign: 'center' }}>
          <div className="label" style={{ fontSize: 12 }}>NO PLAYERS YET</div>
          <div style={{ fontSize: 13, color: T.textDim, marginTop: 8 }}>Add your first player to start a tournament</div>
        </div>
      </div>
      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${T.border}` }}>
        <MainButton label="ADD FIRST PLAYER"/>
      </div>
      <TabBar active="players"/>
    </div>
  );
}

Object.assign(window, { TournamentHistory, TournamentDetail, RoundDetailHistory, HomeSkeleton, HomeError, PlayersEmpty });
