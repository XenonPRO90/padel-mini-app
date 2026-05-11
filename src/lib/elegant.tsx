// Elegant primitives — TypeScript port of design-elegant/src components.
// Shared SVGs (logo, medal, ornaments, trophy, sprig) + layout helpers
// (Hero, AppHeader, GoldFrame, Paper, Btn, Label, Divider).
// All consume tokens from lib/tokens.

import { T } from './tokens';
import type { CSSProperties, ReactNode, MouseEvent } from 'react';

// ───────── LOGO (crown + crossed rackets) ─────────
export function ELogo({ size = 64, color = T.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ display: 'block' }}>
      <g stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round">
        <path d="M40 20 L42 12 L46 18 L50 10 L54 18 L58 12 L60 20 Z" />
        <circle cx="42" cy="11" r="0.8" fill={color} />
        <circle cx="50" cy="9" r="0.8" fill={color} />
        <circle cx="58" cy="11" r="0.8" fill={color} />
      </g>
      <g stroke={color} strokeWidth="1.6" fill="none">
        <ellipse cx="36" cy="44" rx="14" ry="17" transform="rotate(-22 36 44)" />
        <line x1="44" y1="58" x2="58" y2="84" strokeLinecap="round" />
        <ellipse cx="64" cy="44" rx="14" ry="17" transform="rotate(22 64 44)" />
        <line x1="56" y1="58" x2="42" y2="84" strokeLinecap="round" />
        <g opacity="0.55">
          <line x1="26" y1="38" x2="46" y2="44" />
          <line x1="25" y1="44" x2="45" y2="50" />
          <line x1="27" y1="50" x2="47" y2="56" />
          <line x1="32" y1="32" x2="38" y2="58" />
          <line x1="38" y1="30" x2="44" y2="56" />
        </g>
        <g opacity="0.55">
          <line x1="74" y1="38" x2="54" y2="44" />
          <line x1="75" y1="44" x2="55" y2="50" />
          <line x1="73" y1="50" x2="53" y2="56" />
          <line x1="68" y1="32" x2="62" y2="58" />
          <line x1="62" y1="30" x2="56" y2="56" />
        </g>
      </g>
      <g stroke={color} strokeWidth="1" fill="none" opacity="0.7">
        <path d="M40 84 Q35 86 32 92" strokeLinecap="round" />
        <path d="M60 84 Q65 86 68 92" strokeLinecap="round" />
        <path d="M50 88 Q47 91 44 92" strokeLinecap="round" />
        <path d="M50 88 Q53 91 56 92" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ───────── ORNAMENTS ─────────
export function EOrnRule({ width = 220, color = T.rule }: { width?: number; color?: string }) {
  return (
    <svg width={width} height="10" viewBox={`0 0 ${width} 10`}>
      <line x1="0" y1="5" x2={width / 2 - 14} y2="5" stroke={color} strokeWidth="0.8" />
      <line x1={width / 2 + 14} y1="5" x2={width} y2="5" stroke={color} strokeWidth="0.8" />
      <circle cx={width / 2 - 10} cy="5" r="1.1" fill={color} />
      <circle cx={width / 2 + 10} cy="5" r="1.1" fill={color} />
      <g transform={`translate(${width / 2} 5) rotate(45)`}>
        <rect x="-3" y="-3" width="6" height="6" stroke={color} fill="none" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

export function EDotRule({ width = 80, color = T.rule }: { width?: number; color?: string }) {
  return (
    <svg width={width} height="6" viewBox={`0 0 ${width} 6`}>
      <circle cx="2" cy="3" r="1.4" fill={color} />
      <line x1="6" y1="3" x2={width - 6} y2="3" stroke={color} strokeWidth="0.8" />
      <circle cx={width - 2} cy="3" r="1.4" fill={color} />
    </svg>
  );
}

export function ESprig({ size = 28, color = T.gold, flip = false }: { size?: number; color?: string; flip?: boolean }) {
  return (
    <svg width={size} height={size / 2.5} viewBox="0 0 40 16" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
      <g stroke={color} fill="none" strokeWidth="0.8" strokeLinecap="round">
        <path d="M2 8 Q20 8 38 8" />
        <ellipse cx="10" cy="5" rx="3" ry="1.4" transform="rotate(-25 10 5)" />
        <ellipse cx="18" cy="11" rx="3" ry="1.4" transform="rotate(25 18 11)" />
        <ellipse cx="26" cy="5" rx="3" ry="1.4" transform="rotate(-25 26 5)" />
        <ellipse cx="34" cy="11" rx="3" ry="1.4" transform="rotate(25 34 11)" />
      </g>
    </svg>
  );
}

export function EDivider({ width = '100%', icon }: { width?: number | string; icon?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width, color: T.rule }}>
      <ESprig flip />
      {icon ? icon : <span style={{ fontSize: 11, color: T.gold, letterSpacing: 2 }}>◆</span>}
      <ESprig />
    </div>
  );
}

export function EBallIcon({ size = 16, color = T.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="1" />
      <path d="M3 7 Q10 10 17 7" stroke={color} strokeWidth="0.8" fill="none" />
      <path d="M3 13 Q10 10 17 13" stroke={color} strokeWidth="0.8" fill="none" />
    </svg>
  );
}

// ───────── MEDAL ─────────
export function EMedal({ place = 1, size = 36 }: { place?: 1 | 2 | 3; size?: number }) {
  const colors: Record<1 | 2 | 3, { ring: string; face: string; text: string }> = {
    1: { ring: '#d4af37', face: '#e8c558', text: '#5b3e00' },
    2: { ring: '#b8b8b8', face: '#dcdcdc', text: '#3a3a3a' },
    3: { ring: '#b07238', face: '#cf8c4f', text: '#3a1f00' },
  };
  const c = colors[place];
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 40 50" fill="none">
      <path d="M10 0 L14 14 L20 10 L26 14 L30 0 Z" fill={T.emerald} opacity="0.85" />
      <path d="M14 14 L20 10 L26 14 L24 20 L16 20 Z" fill={T.emeraldDeep} />
      <circle cx="20" cy="32" r="13" fill={c.face} stroke={c.ring} strokeWidth="1.5" />
      <circle cx="20" cy="32" r="10" fill="none" stroke={c.ring} strokeWidth="0.6" opacity="0.7" />
      <text x="20" y="36" textAnchor="middle" fontFamily={T.fontDisplay} fontWeight="700" fontSize="11" fill={c.text}>{place}</text>
    </svg>
  );
}

export function ETrophy({ size = 22, color = T.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <g stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 4 H17 V10 Q17 14 12 14 Q7 14 7 10 Z" fill="#e8c558" />
        <path d="M7 6 H4 Q3 9 5 11 Q6 11 7 10" />
        <path d="M17 6 H20 Q21 9 19 11 Q18 11 17 10" />
        <path d="M12 14 V18" />
        <path d="M8 20 H16" />
        <path d="M9 18 H15 V20 H9 Z" fill="#e8c558" />
      </g>
    </svg>
  );
}

// ───────── POSTER CORNER ─────────
export function EPosterCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const styles: Record<typeof pos, CSSProperties> = {
    tl: { top: 0, left: 0 },
    tr: { top: 0, right: 0, transform: 'scaleX(-1)' },
    bl: { bottom: 0, left: 0, transform: 'scaleY(-1)' },
    br: { bottom: 0, right: 0, transform: 'scale(-1,-1)' },
  };
  return (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none" style={{
      position: 'absolute', ...styles[pos], opacity: 0.7, pointerEvents: 'none',
    }}>
      <g stroke={T.gold} fill="none" strokeWidth="0.7" strokeLinecap="round">
        <path d="M6 18 Q6 6 18 6" />
        <path d="M10 22 Q10 10 22 10" />
        <circle cx="14" cy="14" r="1.2" fill={T.gold} />
        <path d="M18 6 Q26 4 32 8" />
        <path d="M6 18 Q4 26 8 32" />
        <path d="M22 10 Q26 14 26 20" />
        <path d="M10 22 Q14 26 20 26" />
      </g>
    </svg>
  );
}

// ───────── PLACE NUMBER (no medal) ─────────
export function EPlace({ n }: { n: number }) {
  return (
    <div style={{
      fontFamily: T.fontSerif, fontSize: 17, fontWeight: 500,
      color: T.muted, width: 32, textAlign: 'center',
    }}>{n}.</div>
  );
}

// ───────── CARD / PAPER ─────────
export function EPaper({ children, style = {}, pad = 18 }: { children: ReactNode; style?: CSSProperties; pad?: number | string }) {
  return (
    <div style={{
      background: T.paper,
      border: `1px solid ${T.paperEdge}`,
      borderRadius: 18,
      padding: pad,
      boxShadow: '0 1px 0 rgba(166,134,77,0.08), 0 8px 24px -16px rgba(31,42,36,0.18)',
      ...style,
    }}>{children}</div>
  );
}

export function EGoldFrame({ children, style = {} }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      border: `1px solid ${T.rule}`,
      borderRadius: 18,
      padding: 2,
      ...style,
    }}>
      <div style={{
        border: `0.5px solid ${T.goldSoft}`,
        borderRadius: 14,
        background: T.paper,
      }}>{children}</div>
    </div>
  );
}

// ───────── BUTTONS ─────────
type BtnKind = 'primary' | 'gold' | 'ghost' | 'outline' | 'quiet' | 'destructive';
export function EBtn({
  children, kind = 'primary', onClick, style = {}, disabled, type = 'button',
}: {
  children: ReactNode;
  kind?: BtnKind;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const base: CSSProperties = {
    fontFamily: T.fontDisplay,
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: 600,
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    borderRadius: 999,
    padding: '14px 24px',
    transition: 'transform 100ms, opacity 100ms',
    opacity: disabled ? 0.45 : 1,
  };
  const kinds: Record<BtnKind, CSSProperties> = {
    primary:     { background: T.emerald, color: T.cream },
    gold:        { background: T.gold, color: T.cream },
    ghost:       { background: 'transparent', color: T.emerald, border: `1px solid ${T.rule}` },
    outline:     { background: T.paper, color: T.ink, border: `1px solid ${T.rule}` },
    quiet:       { background: 'transparent', color: T.muted, padding: '10px 14px', letterSpacing: 1 },
    destructive: { background: 'transparent', color: T.burgundy, border: `1px solid ${T.burgundy}` },
  };
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...base, ...kinds[kind], ...style }}
    >{children}</button>
  );
}

// ───────── LABEL (gold uppercase tiny serif) ─────────
export function ELabel({
  children, style = {}, color = T.gold,
}: { children: ReactNode; style?: CSSProperties; color?: string }) {
  return (
    <div style={{
      fontFamily: T.fontDisplay,
      fontSize: 10, letterSpacing: 3,
      textTransform: 'uppercase',
      color, fontWeight: 600,
      ...style,
    }}>{children}</div>
  );
}

// ───────── PAGE HEADER (logo + ornamental title) ─────────
export function EHero({
  title = 'PADEL MASTERS', kicker, date, compact = false,
}: { title?: string; kicker?: string; date?: string; compact?: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: compact ? '8px 16px 12px' : '16px 16px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <ELogo size={compact ? 44 : 56} />
      </div>
      <div style={{
        fontFamily: T.fontDisplay,
        fontSize: compact ? 22 : 28,
        fontWeight: 600,
        letterSpacing: compact ? 4 : 5,
        color: T.ink,
      }}>{title}</div>
      {kicker && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
          <EDotRule width={24} />
          <span style={{
            fontFamily: T.fontDisplay, fontSize: 11, letterSpacing: 3,
            color: T.gold, textTransform: 'uppercase',
          }}>{kicker}</span>
          <EDotRule width={24} />
        </div>
      )}
      {date && (
        <div style={{
          marginTop: 6, fontFamily: T.fontDisplay,
          fontSize: 13, letterSpacing: 3, color: T.ink,
        }}>· {date} ·</div>
      )}
    </div>
  );
}

// ───────── APP HEADER (in-app, compact) ─────────
export function EAppHeader({
  title, left, right,
}: { title: string; left?: ReactNode; right?: ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 18px 14px',
      borderBottom: `1px solid ${T.paperEdge}`,
      background: T.cream,
    }}>
      <div style={{ width: 60 }}>{left}</div>
      <div style={{ textAlign: 'center', minWidth: 0 }}>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600,
          letterSpacing: 3, color: T.ink, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{title}</div>
      </div>
      <div style={{ width: 60, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

// ───────── SHARE ICON ─────────
export function EShareIcon({ size = 18, color = T.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 17 L17 7 M9 7 H17 V15"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ───────── EDIT ICON ─────────
export function EEditIcon({ size = 14, color = T.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 20h4l10-10-4-4L4 16v4z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ───────── CLOCK / HISTORY ICON ─────────
export function EClockIcon({ size = 22, color = T.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.3" fill="none" />
      <path d="M12 7 V12 L15 14" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ───────── PEOPLE / PLAYERS ICON ─────────
export function EPeopleIcon({ size = 22, color = T.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="9" r="3.4" stroke={color} strokeWidth="1.3" />
      <path d="M3 20 Q3 14.5 9 14.5 Q15 14.5 15 20"
        stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <circle cx="17" cy="10" r="2.6" stroke={color} strokeWidth="1.3" opacity="0.7" />
      <path d="M21 20 Q21 16 17 15.5"
        stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
