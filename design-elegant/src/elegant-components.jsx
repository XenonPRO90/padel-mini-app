// Elegant components — logo, medal, ornaments, buttons, badges, phone frame
const { useState: useStateE } = React;

// ───────── PHONE FRAME ─────────
function EPhone({ children, height = 800 }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: E.cream,
      color: E.ink,
      fontFamily: E.fontUI,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }} className="padel-app e-app">
      {/* Status bar */}
      <div style={{
        height: 44, display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', padding: '0 22px 4px',
        fontSize: 14, fontWeight: 600, fontFamily: E.fontDisplay,
        letterSpacing: 0.4, color: E.ink, flexShrink: 0,
      }}>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>9:41</span>
        <span style={{ fontSize: 11, letterSpacing: 2, color: E.muted }}>•••</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

// ───────── LOGO (racket + crown) ─────────
function ELogo({ size = 64, color = E.gold }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Crown */}
      <g stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round">
        <path d="M40 20 L42 12 L46 18 L50 10 L54 18 L58 12 L60 20 Z"/>
        <circle cx="42" cy="11" r="0.8" fill={color}/>
        <circle cx="50" cy="9"  r="0.8" fill={color}/>
        <circle cx="58" cy="11" r="0.8" fill={color}/>
      </g>
      {/* Two crossed rackets */}
      <g stroke={color} strokeWidth="1.6" fill="none">
        {/* Left racket */}
        <ellipse cx="36" cy="44" rx="14" ry="17" transform="rotate(-22 36 44)"/>
        <line x1="44" y1="58" x2="58" y2="84" strokeLinecap="round"/>
        {/* Right racket */}
        <ellipse cx="64" cy="44" rx="14" ry="17" transform="rotate(22 64 44)"/>
        <line x1="56" y1="58" x2="42" y2="84" strokeLinecap="round"/>
        {/* Net hatching, left */}
        <g opacity="0.55">
          <line x1="26" y1="38" x2="46" y2="44"/>
          <line x1="25" y1="44" x2="45" y2="50"/>
          <line x1="27" y1="50" x2="47" y2="56"/>
          <line x1="32" y1="32" x2="38" y2="58"/>
          <line x1="38" y1="30" x2="44" y2="56"/>
        </g>
        <g opacity="0.55">
          <line x1="74" y1="38" x2="54" y2="44"/>
          <line x1="75" y1="44" x2="55" y2="50"/>
          <line x1="73" y1="50" x2="53" y2="56"/>
          <line x1="68" y1="32" x2="62" y2="58"/>
          <line x1="62" y1="30" x2="56" y2="56"/>
        </g>
      </g>
      {/* Tiny leaves under handles */}
      <g stroke={color} strokeWidth="1" fill="none" opacity="0.7">
        <path d="M40 84 Q35 86 32 92" strokeLinecap="round"/>
        <path d="M60 84 Q65 86 68 92" strokeLinecap="round"/>
        <path d="M50 88 Q47 91 44 92" strokeLinecap="round"/>
        <path d="M50 88 Q53 91 56 92" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

// ───────── ORNAMENTS ─────────
// Horizontal dotted-rule with a tiny diamond in the center
function EOrnRule({ width = 220, color = E.rule }) {
  return (
    <svg width={width} height="10" viewBox={`0 0 ${width} 10`}>
      <line x1="0" y1="5" x2={width/2 - 14} y2="5" stroke={color} strokeWidth="0.8"/>
      <line x1={width/2 + 14} y1="5" x2={width} y2="5" stroke={color} strokeWidth="0.8"/>
      <circle cx={width/2 - 10} cy="5" r="1.1" fill={color}/>
      <circle cx={width/2 + 10} cy="5" r="1.1" fill={color}/>
      <g transform={`translate(${width/2} 5) rotate(45)`}>
        <rect x="-3" y="-3" width="6" height="6" stroke={color} fill="none" strokeWidth="0.8"/>
      </g>
    </svg>
  );
}

// Dot-line-dot
function EDotRule({ width = 80, color = E.rule }) {
  return (
    <svg width={width} height="6" viewBox={`0 0 ${width} 6`}>
      <circle cx="2" cy="3" r="1.4" fill={color}/>
      <line x1="6" y1="3" x2={width-6} y2="3" stroke={color} strokeWidth="0.8"/>
      <circle cx={width-2} cy="3" r="1.4" fill={color}/>
    </svg>
  );
}

// Tiny sprig of olive — used as ornament punctuation
function ESprig({ size = 28, color = E.gold, flip = false }) {
  return (
    <svg width={size} height={size/2.5} viewBox="0 0 40 16" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
      <g stroke={color} fill="none" strokeWidth="0.8" strokeLinecap="round">
        <path d="M2 8 Q20 8 38 8"/>
        <ellipse cx="10" cy="5" rx="3" ry="1.4" transform="rotate(-25 10 5)"/>
        <ellipse cx="18" cy="11" rx="3" ry="1.4" transform="rotate(25 18 11)"/>
        <ellipse cx="26" cy="5" rx="3" ry="1.4" transform="rotate(-25 26 5)"/>
        <ellipse cx="34" cy="11" rx="3" ry="1.4" transform="rotate(25 34 11)"/>
      </g>
    </svg>
  );
}

// Section divider with sprigs both sides, optional center icon
function EDivider({ width = '100%', icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width, color: E.rule }}>
      <ESprig flip/>
      {icon ? icon : <span style={{ fontSize: 11, color: E.gold, letterSpacing: 2 }}>◆</span>}
      <ESprig/>
    </div>
  );
}

// Tennis ball — tiny gold icon
function EBallIcon({ size = 16, color = E.gold }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="1"/>
      <path d="M3 7 Q10 10 17 7" stroke={color} strokeWidth="0.8" fill="none"/>
      <path d="M3 13 Q10 10 17 13" stroke={color} strokeWidth="0.8" fill="none"/>
    </svg>
  );
}

// ───────── MEDAL ─────────
function EMedal({ place = 1, size = 36 }) {
  const colors = {
    1: { ring: '#d4af37', face: '#e8c558', text: '#5b3e00' },
    2: { ring: '#b8b8b8', face: '#dcdcdc', text: '#3a3a3a' },
    3: { ring: '#b07238', face: '#cf8c4f', text: '#3a1f00' },
  };
  const c = colors[place] || colors[3];
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 40 50" fill="none">
      {/* Ribbon */}
      <path d="M10 0 L14 14 L20 10 L26 14 L30 0 Z" fill={E.emerald} opacity="0.85"/>
      <path d="M14 14 L20 10 L26 14 L24 20 L16 20 Z" fill={E.emeraldDeep}/>
      {/* Medal coin */}
      <circle cx="20" cy="32" r="13" fill={c.face} stroke={c.ring} strokeWidth="1.5"/>
      <circle cx="20" cy="32" r="10" fill="none" stroke={c.ring} strokeWidth="0.6" opacity="0.7"/>
      <text x="20" y="36" textAnchor="middle"
        fontFamily={E.fontDisplay} fontWeight="700" fontSize="11" fill={c.text}>{place}</text>
    </svg>
  );
}

// Place number (no medal) — small serif number with period
function EPlace({ n }) {
  return (
    <div style={{
      fontFamily: E.fontSerif, fontSize: 17, fontWeight: 500,
      color: E.muted, width: 32, textAlign: 'center',
    }}>{n}.</div>
  );
}

// ───────── BADGES & PILLS ─────────
function ELevelBadge({ level, size = 'sm' }) {
  const spec = E.levels[level] || E.levels['C'];
  const dim = size === 'lg' ? { w: 42, h: 22, f: 12 } : { w: 30, h: 18, f: 10.5 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: dim.w, height: dim.h, borderRadius: 999,
      background: spec.bg, color: spec.fg,
      fontFamily: E.fontDisplay, fontSize: dim.f, fontWeight: 600,
      letterSpacing: 0.4,
    }}>{spec.label}</span>
  );
}

function ESideDot({ side }) {
  const c = side === 'R' ? E.emerald : side === 'L' ? E.gold : E.muted;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 18, height: 18, borderRadius: 999,
      border: `1px solid ${c}`, color: c,
      fontFamily: E.fontDisplay, fontSize: 10, fontWeight: 600,
    }}>{side}</span>
  );
}

// ───────── CARD / PAPER ─────────
function EPaper({ children, style = {}, pad = 18 }) {
  return (
    <div style={{
      background: E.paper,
      border: `1px solid ${E.paperEdge}`,
      borderRadius: E.radiusLg,
      padding: pad,
      boxShadow: '0 1px 0 rgba(166,134,77,0.08), 0 8px 24px -16px rgba(31,42,36,0.18)',
      ...style,
    }}>{children}</div>
  );
}

// Hairline gold-rule frame (used inside scoreboards)
function EGoldFrame({ children, style = {} }) {
  return (
    <div style={{
      border: `1px solid ${E.rule}`,
      borderRadius: E.radiusLg,
      padding: 2,
      ...style,
    }}>
      <div style={{
        border: `0.5px solid ${E.goldSoft}`,
        borderRadius: E.radiusLg - 4,
        background: E.paper,
      }}>{children}</div>
    </div>
  );
}

// ───────── BUTTONS ─────────
function EBtn({ children, kind = 'primary', onClick, style = {}, disabled }) {
  const base = {
    fontFamily: E.fontDisplay,
    fontSize: 15,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: 600,
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    borderRadius: 999,
    padding: '14px 24px',
    transition: 'transform 0.1s',
    opacity: disabled ? 0.45 : 1,
  };
  const kinds = {
    primary:   { background: E.emerald, color: E.cream },
    gold:      { background: E.gold, color: E.cream },
    ghost:     { background: 'transparent', color: E.emerald, border: `1px solid ${E.rule}` },
    outline:   { background: E.paper, color: E.ink, border: `1px solid ${E.rule}` },
    quiet:     { background: 'transparent', color: E.muted, padding: '10px 14px', letterSpacing: 1 },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...kinds[kind], ...style }}>{children}</button>
  );
}

// ───────── LABEL (gold uppercase tiny serif) ─────────
function ELabel({ children, style = {}, color = E.gold }) {
  return (
    <div style={{
      fontFamily: E.fontDisplay,
      fontSize: 10, letterSpacing: 3,
      textTransform: 'uppercase',
      color, fontWeight: 600,
      ...style,
    }}>{children}</div>
  );
}

// ───────── PAGE HEADER (logo + ornamental title) ─────────
// Used in posters and top-of-page hero
function EHero({ title = 'PADEL MASTERS', kicker, date, compact = false }) {
  return (
    <div style={{ textAlign: 'center', padding: compact ? '8px 16px 12px' : '16px 16px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <ELogo size={compact ? 44 : 56}/>
      </div>
      <div style={{
        fontFamily: E.fontDisplay,
        fontSize: compact ? 22 : 28,
        fontWeight: 600,
        letterSpacing: compact ? 4 : 5,
        color: E.ink,
      }}>{title}</div>
      {kicker && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
          <EDotRule width={24}/>
          <span style={{
            fontFamily: E.fontDisplay, fontSize: 11, letterSpacing: 3,
            color: E.gold, textTransform: 'uppercase',
          }}>{kicker}</span>
          <EDotRule width={24}/>
        </div>
      )}
      {date && (
        <div style={{
          marginTop: 6, fontFamily: E.fontDisplay,
          fontSize: 13, letterSpacing: 3, color: E.ink,
        }}>· {date} ·</div>
      )}
    </div>
  );
}

// ───────── APP HEADER (in-app, compact) ─────────
function EAppHeader({ title, left, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 18px 14px',
      borderBottom: `1px solid ${E.paperEdge}`,
      background: E.cream,
    }}>
      <div style={{ width: 60 }}>{left}</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: E.fontDisplay, fontSize: 18, fontWeight: 600, letterSpacing: 3, color: E.ink }}>{title}</div>
      </div>
      <div style={{ width: 60, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

function EBack({ onClick, label = 'Назад' }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: 'none', cursor: 'pointer',
      padding: 0, fontFamily: E.fontSerif,
      fontSize: 14, color: E.gold, letterSpacing: 1,
    }}>← {label}</button>
  );
}

Object.assign(window, {
  EPhone, ELogo, EOrnRule, EDotRule, ESprig, EDivider, EBallIcon,
  EMedal, EPlace, ELevelBadge, ESideDot,
  EPaper, EGoldFrame, EBtn, ELabel, EHero, EAppHeader, EBack,
});
