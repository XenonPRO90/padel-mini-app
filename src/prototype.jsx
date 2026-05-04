// Interactive prototype: Home → Live Round → Court Detail → Result
const { useState: usePState } = React;

function InteractivePrototype() {
  const [screen, setScreen] = usePState('home'); // home | live | court | done
  const [activeCourt, setActiveCourt] = usePState(null);
  const [results, setResults] = usePState([null, null, null, null]); // 4 courts: null | 1 | 2
  const [celebrate, setCelebrate] = usePState(false);

  const recordResult = (courtIdx, team) => {
    setCelebrate(true);
    setResults(prev => {
      const next = [...prev];
      next[courtIdx] = team;
      return next;
    });
    setTimeout(() => {
      setCelebrate(false);
      setScreen('live');
    }, 800);
  };

  const courtsState = COURTS.map((c, i) => ({
    ...c,
    status: results[i] === 1 ? 'team1' : results[i] === 2 ? 'team2' : 'pending',
  }));

  const allDone = results.every(r => r !== null);

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      {screen === 'home' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, padding: '4px 16px 16px', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div className="label">TOURNAMENT</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>Padel Masters · 04.05</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Ring size={200} stroke={9} value={3} max={7}>
                <div className="label" style={{ marginBottom: 4, fontSize: 9 }}>TOURNAMENT PROGRESS</div>
                <div className="num" style={{ fontSize: 56, fontWeight: 700, lineHeight: 1 }}>
                  3<span style={{ color: T.textDim, fontWeight: 500 }}>/7</span>
                </div>
                <div className="label" style={{ marginTop: 6 }}>ROUND</div>
              </Ring>
            </div>
            <div onClick={() => setScreen('live')} className="card" style={{
              padding: '14px 16px', marginBottom: 12, cursor: 'pointer',
              border: `1px solid ${T.accent}40`, background: `${T.accent}06`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="label" style={{ color: T.accent }}>● LIVE ROUND · TAP TO OPEN</span>
                {Icon.chevR(14, T.accent)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[0,1,2,3].map(c => {
                  const done = results[c] !== null;
                  return (
                    <div key={c} style={{
                      background: T.surface2, borderRadius: 10, padding: '10px 0',
                      textAlign: 'center', border: done ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
                    }}>
                      <div className="label-sm" style={{ color: done ? T.accent : T.textDim }}>C{c+1}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: done ? T.accent : T.textMuted, marginTop: 4 }}>
                        {done ? '✓' : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card" style={{ padding: '14px 16px' }}>
              <div className="label" style={{ marginBottom: 4 }}>LEADERBOARD</div>
              {LEADERBOARD.slice(0,3).map((p, i) => (
                <LeaderboardRow key={p.name} rank={i+1} {...p} max={LEADERBOARD[0].points}/>
              ))}
            </div>
          </div>
          <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${T.border}` }}>
            <MainButton
              label={allDone ? 'NEXT ROUND' : `WAITING FOR RESULTS · ${results.filter(r=>r).length}/4`}
              disabled={!allDone}
              onClick={() => setScreen('done')}
            />
          </div>
          <TabBar active="tournament"/>
        </div>
      )}

      {screen === 'live' && (
        <LiveRound
          courtsState={courtsState}
          onCourtClick={(i) => { setActiveCourt(i); setScreen('court'); }}
        />
      )}

      {screen === 'court' && activeCourt !== null && (
        <CourtDetailInteractive
          court={COURTS[activeCourt]}
          onPick={(team) => recordResult(activeCourt, team)}
          onClose={() => setScreen('live')}
          celebrate={celebrate}
          existingWinner={results[activeCourt]}
        />
      )}

      {screen === 'done' && (
        <div style={{ height: '100%', overflowY: 'auto' }}>
          <FinishedPosterMini onBack={() => { setResults([null,null,null,null]); setScreen('home'); }}/>
        </div>
      )}
    </div>
  );
}

function CourtDetailInteractive({ court, onPick, onClose, celebrate, existingWinner }) {
  const winner = existingWinner;
  return (
    <div style={{ position: 'relative', height: '100%', background: T.bg }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose}/>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: T.surface2, borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: '10px 16px 20px', height: '85%',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.6)',
        animation: 'slideUp 280ms cubic-bezier(.2,.7,.3,1)',
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 12px' }} onClick={onClose}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }}/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="num" style={{ fontSize: 24, fontWeight: 700 }}>COURT {court.court}</span>
            {court.medal === 1 && Icon.medal1(20)}
            {court.medal === 2 && Icon.medal2(20)}
            {court.medal === 3 && Icon.medal3(20)}
          </div>
          <span style={{ color: T.textMuted, fontSize: 12, letterSpacing: '0.08em', fontWeight: 600 }}>{court.points} PTS</span>
        </div>
        <div className="label" style={{ marginBottom: 18 }}>TAP THE WINNING TEAM</div>

        <div onClick={() => !winner && onPick(1)} style={{ cursor: !winner ? 'pointer' : 'default' }}>
          <TeamTapZoneAnim teamLabel="TEAM 1" team={court.team1} winner={winner === 1} loser={winner && winner !== 1} celebrate={celebrate && winner === 1}/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
          <div style={{ flex: 1, height: 1, background: T.border }}/>
          <span className="num" style={{ fontSize: 14, fontWeight: 700, color: T.textMuted, letterSpacing: '0.2em' }}>VS</span>
          <div style={{ flex: 1, height: 1, background: T.border }}/>
        </div>
        <div onClick={() => !winner && onPick(2)} style={{ cursor: !winner ? 'pointer' : 'default' }}>
          <TeamTapZoneAnim teamLabel="TEAM 2" team={court.team2} winner={winner === 2} loser={winner && winner !== 2} celebrate={celebrate && winner === 2}/>
        </div>
        <div style={{ flex: 1 }}/>
      </div>
    </div>
  );
}

function TeamTapZoneAnim({ teamLabel, team, winner, loser, celebrate }) {
  return (
    <div style={{
      border: `1.5px solid ${winner ? T.accent : T.border}`,
      background: winner ? `${T.accent}10` : 'transparent',
      borderRadius: 16, padding: '18px 16px', position: 'relative',
      opacity: loser ? 0.4 : 1,
      minHeight: 100,
      transition: 'all 200ms',
      transform: celebrate ? 'scale(1.02)' : 'scale(1)',
      boxShadow: celebrate ? `0 0 0 4px ${T.accent}33, 0 0 40px ${T.accent}66` : 'none',
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
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: i ? 10 : 0 }}>
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

function FinishedPosterMini({ onBack }) {
  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      background: `radial-gradient(ellipse at top, ${T.accent}18 0%, ${T.bg} 60%)`,
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      <div style={{ padding: '20px 20px 8px', textAlign: 'center' }}>
        <div className="label" style={{ color: T.accent }}>ROUND COMPLETE</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>Padel Masters · 04.05</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 16px' }}>
        <Ring size={180} stroke={9} value={1} max={1}>
          <div className="num" style={{ fontSize: 44, fontWeight: 700, color: T.accent }}>4/4</div>
          <div className="label" style={{ marginTop: 4 }}>RECORDED</div>
        </Ring>
      </div>
      <div style={{ padding: '12px 20px', textAlign: 'center', flex: 1 }}>
        <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.5 }}>
          All results in. Next round will be generated automatically.
        </div>
      </div>
      <div style={{ padding: '8px 16px 12px' }}>
        <MainButton label="BACK TO HOME" onClick={onBack}/>
      </div>
    </div>
  );
}

window.InteractivePrototype = InteractivePrototype;
