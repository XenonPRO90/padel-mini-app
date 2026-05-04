// Screens 8.3 Court Detail (sheet), 8.4 Tournament Finished, 8.5 Players Library, 8.6 Player Edit

// ─── 8.3 Court Detail (Result Entry sheet) ─────────────────
// Renders inside Phone — fills bottom 80% as a sheet with dimmed bg behind
function CourtDetailSheet({ court, points, team1, team2, recorded, winner }) {
  return (
    <div style={{ position: 'relative', height: '100%', background: T.bg }}>
      {/* dimmed Live Round behind, simplified */}
      <div style={{
        position: 'absolute', inset: 0, padding: '8px 16px',
        opacity: 0.25, pointerEvents: 'none',
      }}>
        <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>ROUND 3 / 7</div>
        <div style={{ height: 12 }}/>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 110, background: T.surface, borderRadius: 14, marginBottom: 10 }}/>
        ))}
      </div>
      {/* dimmer */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }}/>

      {/* sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: T.surface2, borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: '10px 16px 20px', height: '82%',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.6)',
      }}>
        {/* drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 12px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }}/>
        </div>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="num" style={{ fontSize: 24, fontWeight: 700 }}>COURT {court}</span>
            {Icon.medal1(20)}
          </div>
          <span style={{ color: T.textMuted, fontSize: 12, letterSpacing: '0.08em', fontWeight: 600 }}>{points} PTS</span>
        </div>
        <div className="label" style={{ marginBottom: 18 }}>TAP THE WINNING TEAM</div>

        {/* team 1 */}
        <TeamTapZone teamLabel="TEAM 1" team={team1} winner={winner === 1} loser={recorded && winner !== 1}/>

        {/* VS divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
          <div style={{ flex: 1, height: 1, background: T.border }}/>
          <span className="num" style={{ fontSize: 14, fontWeight: 700, color: T.textMuted, letterSpacing: '0.2em' }}>VS</span>
          <div style={{ flex: 1, height: 1, background: T.border }}/>
        </div>

        {/* team 2 */}
        <TeamTapZone teamLabel="TEAM 2" team={team2} winner={winner === 2} loser={recorded && winner !== 2}/>

        {/* footer */}
        <div style={{ flex: 1 }}/>
        {recorded ? (
          <SecondaryButton label="EDIT RESULT"/>
        ) : (
          <div style={{ textAlign: 'center', color: T.textDim, fontSize: 11, letterSpacing: '0.1em', padding: '10px 0' }}>
            HAPTIC FEEDBACK ON TAP
          </div>
        )}
      </div>
    </div>
  );
}

function TeamTapZone({ teamLabel, team, winner, loser }) {
  return (
    <div style={{
      border: `1.5px solid ${winner ? T.accent : T.border}`,
      background: winner ? `${T.accent}10` : 'transparent',
      borderRadius: 16, padding: '18px 16px', position: 'relative',
      opacity: loser ? 0.4 : 1,
      minHeight: 100,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="label" style={{ color: winner ? T.accent : T.textMuted }}>{teamLabel}</span>
        {winner && (
          <span style={{
            background: T.accent, color: '#0B0E12',
            borderRadius: 999, padding: '3px 10px',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {Icon.check(11, '#0B0E12')} WINNER
          </span>
        )}
      </div>
      {team.map((p, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: i ? 10 : 0,
        }}>
          <Avatar name={p.name} size={36}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <LevelBadge level={p.level} size="sm"/>
              <SideBadge side={p.side}/>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 8.4 Tournament Finished — celebration poster ──────────
function FinishedPoster() {
  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      background: `radial-gradient(ellipse at top, ${T.accent}18 0%, ${T.bg} 60%)`,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* confetti dots */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 18 }).map((_, i) => {
          const left = (i * 53) % 100;
          const colors = [T.accent, T.warn, '#FFD24A', T.accentDim, '#fff'];
          return (
            <div key={i} style={{
              position: 'absolute', left: `${left}%`, top: -20,
              width: 6, height: 10, background: colors[i % colors.length],
              animation: `confettiFall ${3 + (i % 4) * 0.8}s linear ${i * 0.15}s infinite`,
              borderRadius: 1,
            }}/>
          );
        })}
      </div>

      <div style={{ padding: '20px 20px 8px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="label" style={{ color: T.accent }}>TOURNAMENT COMPLETE</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>Padel Masters · 04.05</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 16px', position: 'relative', zIndex: 1 }}>
        <Ring size={200} stroke={10} value={1} max={1}>
          <div className="num" style={{ fontSize: 56, fontWeight: 700, color: T.accent }}>100<span style={{ fontSize: 28, color: T.textDim }}>%</span></div>
          <div className="label" style={{ marginTop: 4 }}>COMPLETE</div>
        </Ring>
      </div>

      <div style={{ padding: '0 20px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="label" style={{ color: T.textMuted }}>TOURNAMENT WINNERS</div>
      </div>

      {/* podium top-3 */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
        {LEADERBOARD.slice(0,3).map((p, i) => {
          const medals = [Icon.medal1(28), Icon.medal2(28), Icon.medal3(28)];
          return (
            <div key={p.name} style={{
              background: i === 0 ? `${T.accent}10` : T.surface,
              border: `1px solid ${i === 0 ? T.accent : T.border}`,
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              {medals[i]}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? T.accent : T.textPrimary }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <LevelBadge level={p.level} size="sm"/>
                  <span style={{ fontSize: 11, color: T.textDim }}>✓{p.w}  ✗{p.l}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="num" style={{ fontSize: 28, fontWeight: 700, color: i === 0 ? T.accent : T.textPrimary, lineHeight: 1 }}>{p.points}</div>
                <div className="label" style={{ fontSize: 9, marginTop: 4 }}>PTS</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* rest of standings — compact */}
      <div style={{ padding: '0 20px 16px', position: 'relative', zIndex: 1 }}>
        <div className="card" style={{ padding: '4px 14px' }}>
          {LEADERBOARD.slice(3).map((p, i) => (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
              borderBottom: i < LEADERBOARD.length - 4 ? `1px solid ${T.border}` : 'none',
            }}>
              <span className="num" style={{ width: 20, fontSize: 12, color: T.textDim, fontWeight: 700 }}>#{i+4}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{p.name}</span>
              <LevelBadge level={p.level} size="sm"/>
              <span className="num" style={{ fontSize: 14, fontWeight: 700, color: T.textMuted, minWidth: 28, textAlign: 'right' }}>{p.points}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '8px 16px 16px', position: 'relative', zIndex: 1 }}>
        <MainButton label="SHARE FINAL TABLE"/>
        <div style={{ height: 8 }}/>
        <SecondaryButton label="BACK TO HOME"/>
      </div>
    </div>
  );
}

// ─── 8.5 Players Library ───────────────────────────────────
function PlayersLibrary() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* header */}
      <div style={{ padding: '8px 16px 4px' }}>
        <div className="label">PLAYERS</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }} className="num">{PLAYERS.length}</div>
      </div>
      {/* search */}
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {Icon.search(16, T.textMuted)}
          <span style={{ color: T.textDim, fontSize: 14 }}>Search players</span>
        </div>
      </div>
      {/* list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 80px' }}>
        <div className="card" style={{ padding: '0 16px' }}>
          {PLAYERS.slice(0, 12).map((p, i) => (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
              borderBottom: i < 11 ? `1px solid ${T.border}` : 'none',
            }}>
              <Avatar name={p.name} size={36}/>
              <span style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>{p.name}</span>
              <SideBadge side={p.side}/>
              <LevelBadge level={p.level} size="sm"/>
            </div>
          ))}
        </div>
      </div>
      {/* FAB */}
      <div style={{
        position: 'absolute', right: 16, bottom: 84,
        width: 56, height: 56, borderRadius: '50%', background: T.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 24px ${T.accent}66`,
      }}>
        {Icon.plus(24, '#0B0E12')}
      </div>
      <TabBar active="players"/>
    </div>
  );
}

// ─── 8.6 Player Edit / New ─────────────────────────────────
function PlayerEdit() {
  const levels = ['A+','A','B+','B','C+','C','C-strong','C-','D'];
  const sides = [
    { id: 'R', label: 'RIGHT' },
    { id: 'L', label: 'LEFT' },
    { id: 'U', label: 'UNIVERSAL' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* header */}
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{ background: 'transparent', border: 'none', color: T.textMuted, padding: 4 }}>
          {Icon.back(22)}
        </button>
        <div className="label" style={{ flex: 1, textAlign: 'center' }}>EDIT PLAYER</div>
        <div style={{ width: 30 }}/>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
        {/* avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 20px' }}>
          <Avatar name="Хосе" size={88}/>
        </div>

        {/* name input */}
        <div style={{ marginBottom: 16 }}>
          <div className="label" style={{ marginBottom: 8 }}>NAME</div>
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
            padding: '14px 16px', fontSize: 17, fontWeight: 500,
          }}>Хосе</div>
        </div>

        {/* level */}
        <div style={{ marginBottom: 16 }}>
          <div className="label" style={{ marginBottom: 8 }}>LEVEL</div>
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto',
            paddingBottom: 4, scrollbarWidth: 'none',
          }}>
            {levels.map(l => {
              const active = l === 'B+';
              return (
                <div key={l} style={{
                  flexShrink: 0, padding: '10px 14px', borderRadius: 10,
                  background: active ? T.surface2 : T.surface,
                  border: `1px solid ${active ? T.accent : T.border}`,
                  color: active ? T.accent : T.textMuted,
                  fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
                }}>{l}</div>
              );
            })}
          </div>
        </div>

        {/* side */}
        <div style={{ marginBottom: 16 }}>
          <div className="label" style={{ marginBottom: 8 }}>SIDE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {sides.map(s => {
              const active = s.id === 'R';
              return (
                <div key={s.id} style={{
                  background: active ? `${T.accent}10` : T.surface,
                  border: `1px solid ${active ? T.accent : T.border}`,
                  borderRadius: 12, padding: '14px 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}>
                  <div style={{ color: active ? T.accent : T.textMuted }}>
                    <SideBadge side={s.id}/>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: active ? T.accent : T.textMuted }}>
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* stats */}
        <div className="card" style={{ padding: '14px 4px', marginBottom: 16 }}>
          <div style={{ padding: '0 12px', marginBottom: 12 }}>
            <span className="label">PLAYER STATS</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'TOURNAMENTS', value: 12 },
              { label: 'WINS', value: 48 },
              { label: 'WIN RATE', value: '62%' },
              { label: 'TOTAL PTS', value: 178 },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '4px 12px', textAlign: 'center',
                borderRight: i < 3 ? `1px solid ${T.border}` : 'none',
              }}>
                <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
                <div className="label-sm" style={{ marginTop: 4, fontSize: 9 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <button style={{
          background: 'transparent', border: 'none',
          width: '100%', padding: 14, color: T.loss,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {Icon.trash(14, T.loss)} DELETE PLAYER
        </button>
      </div>

      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${T.border}` }}>
        <MainButton label="SAVE"/>
      </div>
    </div>
  );
}

Object.assign(window, { CourtDetailSheet, FinishedPoster, PlayersLibrary, PlayerEdit });
