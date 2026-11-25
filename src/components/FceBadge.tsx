import { useId } from 'react';

// The sponsor's own artwork, lifted from the file FCE supplied — the mark's
// geometry and the lettering of the wordmark are theirs, not a redraw and not
// system type. Three pieces, because one size never fits:
//
//   FceWordmark — the three letters alone. This is the badge: at 14px a mark
//                 is a smudge while letters still read (Roman, 2026-11-25).
//   FceMark     — the gradient diamond, for places with room for it.
//   FceBadge    — the pill that rides beside a player's level.
//
// Gradient ids must not collide when several instances share a page, so each
// instance mints its own.

const NAVY = '#080d25';

/** The three letters, at their own proportions (≈2.46 : 1). */
export function FceWordmark({ height = 11, color = NAVY }: { height?: number; color?: string }) {
  return (
    <svg viewBox="137 32 182 74" height={height} width={height * 2.46}
         role="img" aria-label="FCE" style={{ display: 'block' }}>
      <g transform="translate(-44 -111)" fill={color}>
        <path d="M181 144H230V157H196V174H225V187H196V216H181Z" />
        <path d="M304 169H289C287 161 282 157 274 157 261 157 253 166 253 180 253 195 261 204 274 204 282 204 287 199 290 191H305C301 208 291 217 274 217 252 217 238 203 238 180 238 158 252 143 274 143 290 143 301 152 304 169Z" />
        <path d="M314 144H362V157H329V174H359V187H329V203H363V216H314Z" />
      </g>
    </svg>
  );
}

/** The gradient diamond on its own. */
export function FceMark({ size = 22 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  const blue = `fceb-${uid}`;
  const tip = `fcet-${uid}`;
  return (
    <svg viewBox="12 12 108 115" width={size} height={size * (115 / 108)}
         role="img" aria-label="FCE" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={blue} x1="56" y1="182" x2="164" y2="182" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0074ff" />
          <stop offset=".55" stopColor="#0088ff" />
          <stop offset="1" stopColor="#00dcf2" />
        </linearGradient>
        <linearGradient id={tip} x1="75" y1="153" x2="102" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0080ff" />
          <stop offset="1" stopColor="#00d5ef" />
        </linearGradient>
      </defs>
      <g transform="translate(-44 -111)">
        <g fill={`url(#${blue})`}>
          <path d="M100 123 56 167 71 182 56 197 95 236 95 216 76 197 84 189 100 205 100 184 79 167 100 146Z" />
          <path d="M100 158 90 168 100 178Z" />
          <path d="M110 130 164 184 110 238Z" />
        </g>
        <path fill={`url(#${tip})`} d="M100 123 75 148 85 159 100 146Z" />
      </g>
    </svg>
  );
}

/**
 * The verification badge. `tone` picks the ground it sits on: 'light' for the
 * club's paper, 'dark' for the navy band.
 */
export function FceBadge({ height = 11, tone = 'light' }: {
  height?: number; tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <span
      title="FCE verified"
      style={{
        display: 'inline-flex', alignItems: 'center', flexShrink: 0,
        background: dark ? 'rgba(255,255,255,0.12)' : '#e8f0fe',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.22)' : '#1e78f044'}`,
        borderRadius: 999, padding: `${Math.round(height * 0.36)}px ${Math.round(height * 0.62)}px`,
      }}
    >
      <FceWordmark height={height} color={dark ? '#ffffff' : NAVY} />
    </span>
  );
}
