// Elegant screens — 8.1 Home + 8.2 Live Round + 8.3 Court detail

// Players in English (matches the reference posters)
const E_PLAYERS = [
  { name: 'Roman Erm',       level: 'C+', side: 'R' },
  { name: 'Jose',            level: 'B+', side: 'R' },
  { name: 'Georgii Raganyan',level: 'C',  side: 'L' },
  { name: 'Arty Dzis',       level: 'C',  side: 'R' },
  { name: 'Andrey Romanov',  level: 'C-strong', side: 'L' },
  { name: 'Alex Scheglov',   level: 'C',  side: 'R' },
  { name: 'Ilya Bro',        level: 'C-strong', side: 'L' },
  { name: 'Andy',            level: 'C+', side: 'R' },
  { name: 'Emi',             level: 'C-strong', side: 'L' },
  { name: 'Nikolai Denisov', level: 'C+', side: 'R' },
  { name: 'Farid',           level: 'C',  side: 'L' },
  { name: 'Vrezh',           level: 'C',  side: 'R' },
  { name: 'Rasul',           level: 'C',  side: 'L' },
  { name: 'Vitaly DOS',      level: 'C',  side: 'R' },
  { name: 'Shamil',          level: 'C',  side: 'L' },
  { name: 'Anatoly Pasternak',level:'C-strong', side: 'R' },
];

const E_COURTS = [
  { court: 1, points: 3, team1: [E_PLAYERS[1], E_PLAYERS[11]], team2: [E_PLAYERS[9], E_PLAYERS[7]] },
  { court: 2, points: 2, team1: [E_PLAYERS[0], E_PLAYERS[10]], team2: [E_PLAYERS[2], E_PLAYERS[12]] },
  { court: 3, points: 1, team1: [E_PLAYERS[3], E_PLAYERS[5]],  team2: [E_PLAYERS[13], E_PLAYERS[8]] },
  { court: 4, points: 1, team1: [E_PLAYERS[14], E_PLAYERS[6]], team2: [E_PLAYERS[4], E_PLAYERS[15]] },
];

const E_LEADERBOARD = [
  { name: 'Roman Erm',       pts: 11, w: 6, l: 1, place: 1 },
  { name: 'Jose',            pts: 10, w: 5, l: 2, place: 2 },
  { name: 'Georgii Raganyan',pts: 10, w: 5, l: 2, place: 2 },
  { name: 'Arty Dzis',       pts:  8, w: 5, l: 2, place: 3 },
  { name: 'Andrey Romanov',  pts:  8, w: 5, l: 2, place: 4 },
  { name: 'Alex Scheglov',   pts:  8, w: 5, l: 2, place: 5 },
  { name: 'Ilya Bro',        pts:  8, w: 5, l: 2, place: 5 },
  { name: 'Andy',            pts:  8, w: 5, l: 2, place: 5 },
  { name: 'Emi',             pts:  7, w: 4, l: 3, place: 6 },
  { name: 'Nikolai Denisov', pts:  6, w: 4, l: 3, place: 7 },
  { name: 'Farid',           pts:  6, w: 4, l: 3, place: 7 },
];

// ───────── ROUND ROW (court strip with score) ─────────
function ERoundCourtCard({ court, points, team1, team2, recorded, winner, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', borderRadius: E.radiusLg, overflow: 'hidden',
      border: `1px solid ${E.paperEdge}`, marginBottom: 12,
      background: E.paper, cursor: onClick ? 'pointer' : 'default',
    }}>
      {/* Court column */}
      <div style={{
        background: E.emerald, color: E.cream,
        padding: '14px 8px', textAlign: 'center',
        width: 78, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', gap: 6,
      }}>
        <div style={{ fontFamily: E.fontDisplay, fontSize: 9, letterSpacing: 3 }}>КОРТ</div>
        <div style={{ fontFamily: E.fontDisplay, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{court}</div>
        <div style={{ width: 22, height: 1, background: E.goldSoft, opacity: 0.6 }}/>
        <EBallIcon size={14} color={E.goldSoft}/>
      </div>
      {/* Teams */}
      <div style={{ flex: 1, padding: '12px 14px' }}>
        <ETeamLine players={team1} highlight={recorded && winner === 1}/>
        <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: E.paperEdge }}/>
          <span style={{ fontFamily: E.fontSerif, fontSize: 11, fontStyle: 'italic', color: E.muted }}>vs</span>
          <div style={{ flex: 1, height: 1, background: E.paperEdge }}/>
        </div>
        <ETeamLine players={team2} highlight={recorded && winner === 2}/>
        {!recorded && (
          <div style={{
            marginTop: 10, fontFamily: E.fontDisplay,
            fontSize: 10, letterSpacing: 2, color: E.gold, textAlign: 'right',
          }}>{points} {points === 1 ? 'PT' : 'PTS'} · TAP TO RECORD</div>
        )}
        {recorded && (
          <div style={{
            marginTop: 10, fontFamily: E.fontDisplay,
            fontSize: 10, letterSpacing: 2, color: E.win, textAlign: 'right',
          }}>RECORDED · TEAM {winner} +{points}</div>
        )}
      </div>
    </div>
  );
}

function ETeamLine({ players, highlight }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      opacity: highlight === false ? 0.5 : 1,
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: E.fontDisplay, fontWeight: highlight ? 600 : 500,
          fontSize: 15, color: highlight ? E.win : E.ink,
        }}>
          {players[0].name} <span style={{ color: E.muted, fontStyle: 'italic' }}>({players[0].level})</span>
        </span>
        <span style={{ color: E.gold, fontFamily: E.fontSerif, fontStyle: 'italic', fontSize: 13 }}>и</span>
        <span style={{
          fontFamily: E.fontDisplay, fontWeight: highlight ? 600 : 500,
          fontSize: 15, color: highlight ? E.win : E.ink,
        }}>
          {players[1].name} <span style={{ color: E.muted, fontStyle: 'italic' }}>({players[1].level})</span>
        </span>
      </div>
      {highlight && <span style={{ color: E.win, fontSize: 16 }}>✓</span>}
    </div>
  );
}

// ───────── 8.1 HOME (active tournament) ─────────
function EHomeActive() {
  return (
    <EPhone>
      <EHero title="PADEL MASTERS" kicker="with Jose in Paus" date="04.05.2026" compact/>
      <div style={{ padding: '0 18px 30px' }}>
        <EDivider/>
        {/* Round status */}
        <div style={{
          marginTop: 16, marginBottom: 18, textAlign: 'center',
        }}>
          <div style={{
            fontFamily: E.fontDisplay, fontSize: 11, letterSpacing: 3,
            color: E.gold, textTransform: 'uppercase',
          }}>Round in Progress</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontFamily: E.fontDisplay, fontSize: 56, fontWeight: 600, color: E.ink, lineHeight: 1 }}>3</span>
            <span style={{ fontFamily: E.fontSerif, fontSize: 22, color: E.muted }}>/ 7</span>
          </div>
          <div style={{ marginTop: 4, fontFamily: E.fontSerif, fontSize: 13, fontStyle: 'italic', color: E.muted }}>
            2 of 4 results recorded
          </div>
        </div>

        {/* CTA */}
        <EBtn kind="primary" style={{ width: '100%', marginBottom: 18 }}>
          Open Live Round
        </EBtn>

        {/* Mini leaderboard */}
        <ELabel style={{ marginBottom: 8, textAlign: 'center' }}>Leaderboard · Top 5</ELabel>
        <EGoldFrame>
          <div style={{ padding: '4px 0' }}>
            {E_LEADERBOARD.slice(0, 5).map((p, i) => (
              <EBoardRow key={i} place={p.place} name={p.name} pts={p.pts} w={p.w} l={p.l}
                last={i === 4}/>
            ))}
          </div>
        </EGoldFrame>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
          <EBtn kind="ghost" style={{ width: '100%' }}>Full Leaderboard</EBtn>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22, opacity: 0.6 }}>
          <EBallIcon size={20}/>
        </div>
      </div>
    </EPhone>
  );
}

function EBoardRow({ place, name, pts, w, l, last, medal }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '40px 1fr auto auto auto',
      alignItems: 'center', gap: 10,
      padding: '10px 14px',
      borderBottom: last ? 'none' : `1px solid ${E.paperEdge}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {place <= 3 ? <EMedal place={place} size={26}/> : <EPlace n={place}/>}
      </div>
      <div style={{
        fontFamily: E.fontDisplay, fontSize: 15, fontWeight: place <= 3 ? 600 : 500, color: E.ink,
      }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontFamily: E.fontDisplay, fontSize: 17, fontWeight: 600, color: E.goldDeep }}>{pts}</span>
        <span style={{ fontFamily: E.fontSerif, fontSize: 11, fontStyle: 'italic', color: E.muted }}>pts</span>
      </div>
      <div style={{ width: 1, height: 14, background: E.paperEdge }}/>
      <div style={{ fontFamily: E.fontDisplay, fontSize: 12, letterSpacing: 0.5, color: E.muted }}>
        <span style={{ color: E.win }}>W {w}</span>
        <span style={{ margin: '0 4px', color: E.paperEdge }}>·</span>
        <span style={{ color: E.burgundy }}>L {l}</span>
      </div>
    </div>
  );
}

// ───────── 8.1 HOME (empty state) ─────────
function EHomeEmpty() {
  return (
    <EPhone>
      <EHero title="PADEL CLAUB" kicker="elegance in motion" compact/>
      <div style={{ padding: '24px 22px 30px' }}>
        <EPaper pad={28} style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <ELogo size={80}/>
          </div>
          <div style={{
            fontFamily: E.fontDisplay, fontSize: 22, fontWeight: 600,
            color: E.ink, letterSpacing: 2, marginBottom: 6,
          }}>No Active Tournament</div>
          <EDivider/>
          <div style={{
            fontFamily: E.fontSerif, fontSize: 15, fontStyle: 'italic',
            color: E.muted, lineHeight: 1.45, margin: '14px 6px 22px',
          }}>
            A fine evening awaits. Begin a tournament and let the play unfold.
          </div>
          <EBtn kind="primary" style={{ width: '100%' }}>Start a Tournament</EBtn>
          <div style={{ marginTop: 12 }}>
            <EBtn kind="quiet">View History</EBtn>
          </div>
        </EPaper>
        <div style={{ marginTop: 22, textAlign: 'center' }}>
          <EOrnRule width={260}/>
        </div>
      </div>
    </EPhone>
  );
}

// ───────── 8.2 LIVE ROUND ─────────
function ELiveRound() {
  return (
    <EPhone>
      <EAppHeader title="LIVE ROUND" left={<EBack/>} right={<span style={{ fontFamily: E.fontDisplay, fontSize: 13, color: E.gold }}>3/7</span>}/>
      <div style={{ padding: '14px 18px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <ELabel>04.05.2026 · Round Three</ELabel>
          <div style={{ marginTop: 6 }}><EDivider/></div>
        </div>

        {E_COURTS.map((c, i) => (
          <ERoundCourtCard key={i} {...c}
            recorded={i < 2}
            winner={i === 0 ? 1 : i === 1 ? 2 : undefined}
          />
        ))}

        <div style={{
          marginTop: 6, fontFamily: E.fontSerif, fontSize: 13,
          fontStyle: 'italic', color: E.muted, textAlign: 'center',
        }}>
          2 of 4 courts recorded · waiting for the rest
        </div>

        <div style={{ marginTop: 18 }}>
          <EBtn kind="primary" style={{ width: '100%' }} disabled>
            Finish Round
          </EBtn>
          <div style={{ marginTop: 6, fontFamily: E.fontSerif, fontSize: 12, fontStyle: 'italic', color: E.muted, textAlign: 'center' }}>
            Record all courts to continue
          </div>
        </div>
      </div>
    </EPhone>
  );
}

// ───────── 8.3 COURT DETAIL — pick winner sheet ─────────
function ECourtDetail({ recorded, winner }) {
  const court = E_COURTS[0];
  return (
    <EPhone>
      {/* Background — dimmed live round preview */}
      <div style={{ position: 'absolute', inset: 0, background: E.cream2, opacity: 0.5 }}/>
      {/* Sheet */}
      <div style={{
        position: 'absolute', left: 12, right: 12, top: 60, bottom: 12,
        background: E.paper, borderRadius: E.radiusLg,
        border: `1px solid ${E.paperEdge}`,
        boxShadow: '0 20px 40px -20px rgba(31,42,36,0.3)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: E.emerald, color: E.cream,
          padding: '20px 22px 18px', textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{ fontFamily: E.fontDisplay, fontSize: 10, letterSpacing: 4, opacity: 0.8 }}>КОРТ</div>
          <div style={{ fontFamily: E.fontDisplay, fontSize: 44, fontWeight: 600, lineHeight: 1, margin: '4px 0' }}>{court.court}</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: E.fontSerif, fontSize: 13, fontStyle: 'italic',
            color: E.goldSoft,
          }}>
            <span>worth {court.points} {court.points === 1 ? 'point' : 'points'}</span>
          </div>
          <button style={{
            position: 'absolute', top: 12, right: 14,
            background: 'transparent', border: 'none',
            color: E.cream, fontSize: 24, cursor: 'pointer', lineHeight: 1,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '18px 18px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <ELabel>{recorded ? 'Result recorded' : 'Who won this court?'}</ELabel>
          </div>

          <ETeamPickCard team={court.team1} teamNumber={1} selected={recorded && winner === 1} recorded={recorded}/>
          <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0' }}>
            <div style={{ flex: 1, height: 1, background: E.paperEdge }}/>
            <span style={{
              fontFamily: E.fontSerif, fontStyle: 'italic',
              color: E.gold, padding: '0 12px', fontSize: 16,
            }}>or</span>
            <div style={{ flex: 1, height: 1, background: E.paperEdge }}/>
          </div>
          <ETeamPickCard team={court.team2} teamNumber={2} selected={recorded && winner === 2} recorded={recorded}/>

          <div style={{ marginTop: 'auto', paddingTop: 18 }}>
            {recorded ? (
              <>
                <EBtn kind="ghost" style={{ width: '100%', marginBottom: 8 }}>Edit Result</EBtn>
                <EBtn kind="primary" style={{ width: '100%' }}>Done</EBtn>
              </>
            ) : (
              <div style={{ textAlign: 'center', fontFamily: E.fontSerif, fontSize: 13, fontStyle: 'italic', color: E.muted }}>
                Tap a team above to record the winner
              </div>
            )}
          </div>
        </div>
      </div>
    </EPhone>
  );
}

function ETeamPickCard({ team, teamNumber, selected, recorded }) {
  return (
    <div style={{
      border: selected ? `1.5px solid ${E.gold}` : `1px solid ${E.paperEdge}`,
      background: selected ? '#f9f1de' : E.paper,
      borderRadius: E.radius,
      padding: '14px 16px',
      opacity: recorded && !selected ? 0.45 : 1,
      cursor: 'pointer',
      position: 'relative',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8,
      }}>
        <ELabel color={selected ? E.gold : E.muted}>Team {teamNumber}</ELabel>
        {selected && <span style={{ color: E.gold, fontSize: 18 }}>✓</span>}
      </div>
      {team.map((p, i) => (
        <div key={i} style={{
          fontFamily: E.fontDisplay, fontSize: 17, fontWeight: 500,
          color: E.ink, marginBottom: i === 0 ? 4 : 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{p.name}</span>
          <ELevelBadge level={p.level}/>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  E_PLAYERS, E_COURTS, E_LEADERBOARD,
  EHomeActive, EHomeEmpty, ELiveRound, ECourtDetail,
  ERoundCourtCard, ETeamPickCard, EBoardRow,
});
