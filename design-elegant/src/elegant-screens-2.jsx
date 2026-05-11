// Elegant — 8.4 Finished Poster (the "wedding invitation" final standings)

function EFinishedPoster() {
  return (
    <EPhone>
      <div style={{
        flex: 1, background: E.cream,
        padding: '8px 16px 22px',
        position: 'relative',
      }}>
        {/* Decorative corner ornaments — pure gold lines */}
        <EPosterCorner pos="tl"/>
        <EPosterCorner pos="tr"/>
        <EPosterCorner pos="bl"/>
        <EPosterCorner pos="br"/>

        {/* Trophy + title */}
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <ELogo size={60}/>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginTop: 4,
        }}>
          <ETrophy/>
          <div style={{
            fontFamily: E.fontDisplay, fontSize: 18, fontWeight: 600,
            letterSpacing: 5, color: E.ink, textTransform: 'uppercase',
          }}>Турнир завершён</div>
          <ETrophy/>
        </div>

        <div style={{ marginTop: 6, textAlign: 'center' }}>
          <EOrnRule width={240}/>
        </div>

        <div style={{
          marginTop: 8, textAlign: 'center',
          fontFamily: E.fontDisplay, fontSize: 28,
          fontWeight: 700, letterSpacing: 6, color: E.ink,
        }}>PADEL MASTERS</div>

        <div style={{
          marginTop: 4, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8,
        }}>
          <EDotRule width={28}/>
          <span style={{
            fontFamily: E.fontDisplay, fontSize: 11, letterSpacing: 3,
            color: E.gold, textTransform: 'uppercase',
          }}>with Jose in Paus</span>
          <EDotRule width={28}/>
        </div>

        <div style={{
          marginTop: 8, textAlign: 'center', fontFamily: E.fontDisplay,
          fontSize: 13, letterSpacing: 4, color: E.ink,
        }}>· 04.05.2026 ·</div>

        {/* Standings frame */}
        <div style={{ marginTop: 14 }}>
          <EGoldFrame>
            <div style={{ padding: '8px 4px' }}>
              {/* Top of frame ornament */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                <ESprig/>
              </div>
              {E_LEADERBOARD.slice(0, 8).map((p, i, arr) => (
                <EPosterRow key={i}
                  place={p.place}
                  name={p.name}
                  pts={p.pts}
                  w={p.w} l={p.l}
                  last={i === arr.length - 1}
                />
              ))}
            </div>
          </EGoldFrame>
        </div>

        <div style={{
          marginTop: 12, display: 'flex',
          justifyContent: 'center', alignItems: 'center', gap: 6, opacity: 0.7,
        }}>
          <EDotRule width={50}/>
          <EBallIcon size={14}/>
          <EDotRule width={50}/>
        </div>

        {/* Share button */}
        <div style={{ marginTop: 14, padding: '0 4px' }}>
          <EBtn kind="primary" style={{ width: '100%' }}>Share Poster</EBtn>
        </div>
      </div>
    </EPhone>
  );
}

function EPosterRow({ place, name, pts, w, l, last }) {
  const isPodium = place <= 3;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '38px 1fr auto 1px auto 1px auto',
      alignItems: 'center', gap: 8,
      padding: '8px 10px',
      borderBottom: last ? 'none' : `1px solid ${E.paperEdge}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {isPodium ? <EMedal place={place} size={28}/> : <EPlace n={place}/>}
      </div>
      <div style={{
        fontFamily: E.fontDisplay,
        fontSize: isPodium ? 17 : 15,
        fontWeight: isPodium ? 600 : 500,
        color: E.ink,
      }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{
          fontFamily: E.fontDisplay, fontWeight: 600,
          fontSize: isPodium ? 18 : 16, color: E.goldDeep,
        }}>{pts}</span>
        <span style={{
          fontFamily: E.fontSerif, fontStyle: 'italic',
          fontSize: 11, color: E.muted,
        }}>pts</span>
      </div>
      <div style={{ width: 1, height: 14, background: E.paperEdge }}/>
      <div style={{ fontFamily: E.fontDisplay, fontSize: 12, color: E.win }}>W {w}</div>
      <div style={{ width: 1, height: 14, background: E.paperEdge }}/>
      <div style={{ fontFamily: E.fontDisplay, fontSize: 12, color: E.burgundy }}>L {l}</div>
    </div>
  );
}

function EPosterCorner({ pos }) {
  // Decorative gold flourish in the corners
  const styles = {
    tl: { top: 0, left: 0 },
    tr: { top: 0, right: 0, transform: 'scaleX(-1)' },
    bl: { bottom: 0, left: 0, transform: 'scaleY(-1)' },
    br: { bottom: 0, right: 0, transform: 'scale(-1,-1)' },
  };
  return (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none" style={{
      position: 'absolute', ...styles[pos], opacity: 0.7, pointerEvents: 'none',
    }}>
      <g stroke={E.gold} fill="none" strokeWidth="0.7" strokeLinecap="round">
        <path d="M6 18 Q6 6 18 6"/>
        <path d="M10 22 Q10 10 22 10"/>
        <circle cx="14" cy="14" r="1.2" fill={E.gold}/>
        <path d="M18 6 Q26 4 32 8"/>
        <path d="M6 18 Q4 26 8 32"/>
        <path d="M22 10 Q26 14 26 20" />
        <path d="M10 22 Q14 26 20 26"/>
      </g>
    </svg>
  );
}

function ETrophy({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <g stroke={E.gold} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 4 H17 V10 Q17 14 12 14 Q7 14 7 10 Z" fill="#e8c558"/>
        <path d="M7 6 H4 Q3 9 5 11 Q6 11 7 10"/>
        <path d="M17 6 H20 Q21 9 19 11 Q18 11 17 10"/>
        <path d="M12 14 V18"/>
        <path d="M8 20 H16"/>
        <path d="M9 18 H15 V20 H9 Z" fill="#e8c558"/>
      </g>
    </svg>
  );
}

Object.assign(window, { EFinishedPoster, EPosterRow, EPosterCorner, ETrophy });
