// Elegant — 8.8 History list, 8.9 Tournament detail, 8.10 Round detail (read-only)
// Plus skeleton + error states

const E_HISTORY = [
  { date: '04.05.2026', name: 'Padel Masters with Jose',  winner: 'Roman Erm',     players: 16, rounds: 7 },
  { date: '27.04.2026', name: 'Spring Cup',               winner: 'Jose',          players: 12, rounds: 6 },
  { date: '20.04.2026', name: 'Friday Evening',           winner: 'Alex Shibanov', players: 16, rounds: 7 },
  { date: '13.04.2026', name: 'Easter Tournament',        winner: 'Andy',          players: 12, rounds: 6 },
  { date: '06.04.2026', name: 'Padel & Champagne',        winner: 'Georgii Raganyan', players: 16, rounds: 7 },
  { date: '30.03.2026', name: 'March Masters',            winner: 'Roman Erm',     players: 16, rounds: 7 },
];

function ETournamentHistory() {
  return (
    <EPhone>
      <EAppHeader title="HISTORY" left={<EBack label="Home"/>}/>
      <div style={{ padding: '14px 18px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <ELabel>{E_HISTORY.length} tournaments played</ELabel>
        </div>

        {E_HISTORY.map((t, i) => (
          <div key={i} style={{
            background: E.paper, border: `1px solid ${E.paperEdge}`,
            borderRadius: E.radius, padding: '14px 16px',
            marginBottom: 10, cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontFamily: E.fontDisplay, fontSize: 11, letterSpacing: 2.5, color: E.gold, textTransform: 'uppercase' }}>
                {t.date}
              </span>
              <span style={{ fontFamily: E.fontSerif, fontStyle: 'italic', fontSize: 12, color: E.muted }}>
                {t.players} guests · {t.rounds} rounds
              </span>
            </div>
            <div style={{ fontFamily: E.fontDisplay, fontSize: 18, fontWeight: 600, color: E.ink, marginBottom: 4 }}>
              {t.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <EMedal place={1} size={18}/>
              <span style={{ fontFamily: E.fontSerif, fontStyle: 'italic', fontSize: 13, color: E.muted }}>
                won by <span style={{ color: E.ink, fontStyle: 'normal', fontWeight: 500 }}>{t.winner}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </EPhone>
  );
}

function ETournamentDetail() {
  return (
    <EPhone>
      <EAppHeader title="TOURNAMENT" left={<EBack label="History"/>}
        right={<span style={{ fontFamily: E.fontDisplay, fontSize: 16, color: E.gold }}>↗</span>}
      />
      <div style={{ padding: '12px 18px 22px' }}>
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <ELabel>04.05.2026 · Finished</ELabel>
          <div style={{
            marginTop: 4, fontFamily: E.fontDisplay,
            fontSize: 22, fontWeight: 600, letterSpacing: 2, color: E.ink,
          }}>Padel Masters</div>
          <div style={{ marginTop: 4 }}><EOrnRule width={200}/></div>
        </div>

        {/* Final standings teaser */}
        <ELabel style={{ marginBottom: 8, textAlign: 'center' }}>Final Standings</ELabel>
        <EGoldFrame>
          <div style={{ padding: '4px 0' }}>
            {E_LEADERBOARD.slice(0, 4).map((p, i, arr) => (
              <EBoardRow key={i} place={p.place} name={p.name} pts={p.pts} w={p.w} l={p.l} last={i === arr.length - 1}/>
            ))}
          </div>
        </EGoldFrame>
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <EBtn kind="quiet">View All Standings</EBtn>
        </div>

        {/* Rounds list */}
        <ELabel style={{ margin: '16px 0 8px', textAlign: 'center' }}>Rounds Played</ELabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[1,2,3,4,5,6,7].map(r => (
            <div key={r} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px',
              background: E.paper, border: `1px solid ${E.paperEdge}`,
              borderRadius: E.radius, cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: E.fontDisplay, fontSize: 11, letterSpacing: 2, color: E.gold }}>ROUND</span>
                <span style={{ fontFamily: E.fontDisplay, fontSize: 22, fontWeight: 600 }}>{r}</span>
              </div>
              <span style={{ fontFamily: E.fontSerif, fontStyle: 'italic', fontSize: 13, color: E.muted }}>
                4 courts · {r === 7 ? 'Final' : 'view results'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </EPhone>
  );
}

function ERoundDetailHistory() {
  return (
    <EPhone>
      <EAppHeader title="ROUND 3" left={<EBack label="Tournament"/>}/>
      <div style={{ padding: '12px 18px 22px' }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <ELabel>04.05.2026 · Read only</ELabel>
        </div>

        {E_COURTS.map((c, i) => (
          <ERoundCourtCard key={i} {...c} recorded winner={i % 2 === 0 ? 1 : 2}/>
        ))}

        <div style={{
          marginTop: 8, fontFamily: E.fontSerif,
          fontStyle: 'italic', fontSize: 13, color: E.muted, textAlign: 'center',
        }}>
          Past rounds cannot be edited
        </div>
      </div>
    </EPhone>
  );
}

// ───────── EXTRA STATES ─────────
function EHomeSkeleton() {
  const sk = (w = '100%', h = 16) => (
    <div style={{
      width: w, height: h, background: E.cream2, opacity: 0.7,
      borderRadius: 4, marginBottom: 8,
    }}/>
  );
  return (
    <EPhone>
      <EHero title="PADEL MASTERS" compact/>
      <div style={{ padding: '14px 22px' }}>
        <EDivider/>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          {sk(80, 28)}
          <div style={{ display: 'inline-block', textAlign: 'left', width: '100%', maxWidth: 240, margin: '0 auto' }}>
          </div>
        </div>
        <EGoldFrame style={{ marginTop: 20 }}>
          <div style={{ padding: 16 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 5 ? `1px solid ${E.paperEdge}` : 'none' }}>
                <div style={{ width: 26, height: 26, borderRadius: 999, background: E.cream2 }}/>
                <div style={{ flex: 1 }}>{sk('70%', 14)}</div>
                {sk(36, 14)}
              </div>
            ))}
          </div>
        </EGoldFrame>
      </div>
    </EPhone>
  );
}

function EHomeError() {
  return (
    <EPhone>
      <EHero title="PADEL CLAUB" compact/>
      <div style={{ padding: '30px 24px', textAlign: 'center' }}>
        <ELogo size={60} color={E.burgundy}/>
        <div style={{
          fontFamily: E.fontDisplay, fontSize: 22, fontWeight: 600,
          color: E.ink, marginTop: 14, letterSpacing: 2,
        }}>Something went amiss</div>
        <EDivider/>
        <div style={{
          fontFamily: E.fontSerif, fontSize: 15, fontStyle: 'italic',
          color: E.muted, lineHeight: 1.45, margin: '14px 6px 22px',
        }}>
          We could not load the tournament. Please try again.
        </div>
        <EBtn kind="primary">Retry</EBtn>
        <div style={{ marginTop: 10 }}>
          <EBtn kind="quiet">Open History</EBtn>
        </div>
      </div>
    </EPhone>
  );
}

// ───────── FOUNDATIONS PAGE ─────────
function EFoundations() {
  const swatches = [
    ['cream', E.cream], ['paper', E.paper], ['ink', E.ink],
    ['gold', E.gold], ['gold-deep', E.goldDeep], ['gold-soft', E.goldSoft],
    ['emerald', E.emerald], ['burgundy', E.burgundy],
  ];
  return (
    <div className="padel-app e-app" style={{
      width: '100%', height: '100%', background: E.cream,
      color: E.ink, fontFamily: E.fontUI,
      padding: 28, overflowY: 'auto',
    }}>
      <ELabel>FOUNDATIONS</ELabel>
      <div style={{
        fontFamily: E.fontDisplay, fontSize: 32, fontWeight: 600,
        letterSpacing: 3, marginTop: 6, marginBottom: 18,
      }}>Padel · Elegant</div>

      <EDivider/>

      <ELabel style={{ marginTop: 22, marginBottom: 10 }}>Palette</ELabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {swatches.map(([n, v]) => (
          <div key={n} style={{ background: E.paper, border: `1px solid ${E.paperEdge}`, borderRadius: 10, padding: 10 }}>
            <div style={{ height: 44, background: v, borderRadius: 6, marginBottom: 8, border: `1px solid ${E.paperEdge}` }}/>
            <div style={{ fontFamily: E.fontDisplay, fontSize: 10, letterSpacing: 2, color: E.gold, textTransform: 'uppercase' }}>{n}</div>
            <div style={{ fontFamily: E.fontSerif, fontSize: 11, color: E.muted, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>

      <ELabel style={{ marginBottom: 10 }}>Type Scale</ELabel>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: E.fontDisplay, fontSize: 48, fontWeight: 600, letterSpacing: 4 }}>PADEL MASTERS</div>
        <div style={{ fontFamily: E.fontDisplay, fontSize: 28, fontWeight: 600 }}>Display · Playfair 28</div>
        <div style={{ fontFamily: E.fontSerif, fontSize: 18, fontStyle: 'italic', color: E.muted }}>Cormorant italic · 18 · supportive copy</div>
        <div style={{ fontFamily: E.fontDisplay, fontSize: 15, fontWeight: 500 }}>Body display · 15 · Playfair 500</div>
        <ELabel style={{ marginTop: 8 }}>Uppercase label · 0.25em tracking</ELabel>
      </div>

      <ELabel style={{ marginBottom: 10 }}>Level Badges</ELabel>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {Object.keys(E.levels).map(l => <ELevelBadge key={l} level={l} size="lg"/>)}
      </div>

      <ELabel style={{ marginBottom: 10 }}>Medals</ELabel>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <EMedal place={1} size={48}/>
        <EMedal place={2} size={48}/>
        <EMedal place={3} size={48}/>
      </div>

      <ELabel style={{ marginBottom: 10 }}>Ornaments</ELabel>
      <div style={{ background: E.paper, border: `1px solid ${E.paperEdge}`, borderRadius: 10, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><ELogo size={60}/></div>
        <div style={{ display: 'flex', justifyContent: 'center' }}><EOrnRule width={260}/></div>
        <div style={{ marginTop: 14 }}><EDivider/></div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14, gap: 12 }}>
          <ESprig flip/><EBallIcon/><ESprig/>
        </div>
      </div>

      <ELabel style={{ marginBottom: 10 }}>Buttons</ELabel>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <EBtn kind="primary">Primary</EBtn>
        <EBtn kind="gold">Gold</EBtn>
        <EBtn kind="ghost">Ghost</EBtn>
        <EBtn kind="outline">Outline</EBtn>
        <EBtn kind="quiet">Quiet</EBtn>
      </div>
    </div>
  );
}

Object.assign(window, {
  E_HISTORY,
  ETournamentHistory, ETournamentDetail, ERoundDetailHistory,
  EHomeSkeleton, EHomeError, EFoundations,
});
