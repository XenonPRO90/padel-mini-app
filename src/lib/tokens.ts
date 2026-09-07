// Theme tokens. Source of truth.
//
// Two brands share this codebase, selected at build time by VITE_BRAND:
//   padel (default) — the club's cream/emerald/gold, serif, warm
//   fce             — First Crypto Exchange: white, deep navy, one blue accent
//
// Variable names are identical across brands (bg/surface/border/accent/gold/
// emerald/...) so every call-site works untouched. `gold` and `emerald` keep
// their names but carry the brand's accent and primary — renaming them across
// ~900 call-sites would buy nothing.
const BRAND = (import.meta.env.VITE_BRAND ?? 'padel') as 'padel' | 'fce';

const PADEL = {
  // Page surfaces
  bg:         '#f5efe4',  // cream page bg (was dark)
  surface:    '#fbf7ee',  // paper (slightly brighter cards)
  surface2:   '#ede4d2',  // softer cream, used for pressed/sheets
  border:     '#e7dcc4',  // hairline paper edge (was dark border)

  // Text
  textPrimary:'#1f2a24',  // ink — almost-black w/ green undertone
  textMuted:  '#7a7062',  // muted serif
  textDim:    '#a89e8a',  // disabled / metadata

  // Status / accents (mapped from Whoop palette to elegant equivalents)
  accent:     '#a6864d',  // antique gold (was cyan)
  accentDim:  '#8a6a35',  // darker gold for active type
  win:        '#3a6d4b',  // deep green for wins
  loss:       '#8a2a2a',  // burgundy for losses
  warn:       '#b87333',  // bronze

  // Elegant-only tokens
  cream:      '#f5efe4',
  cream2:     '#ede4d2',
  paper:      '#fbf7ee',
  paperEdge:  '#e7dcc4',
  ink:        '#1f2a24',
  ink2:       '#3a463d',
  muted:      '#7a7062',
  rule:       '#c9b48a',  // hairline gold rule
  gold:       '#a6864d',
  goldDeep:   '#8a6a35',
  goldSoft:   '#d9c08a',
  emerald:    '#2f4a3a',
  emeraldDeep:'#1d3327',
  burgundy:   '#8a2a2a',

  // Type stacks
  fontDisplay: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
  fontSerif:   '"Cormorant Garamond", "Playfair Display", Georgia, serif',
  fontUI:      '"Cormorant Garamond", "Playfair Display", Georgia, serif',
} as const;

// FCE house style: white ground, deep navy ink, a single blue accent, and no
// second accent colour by design. Loss borrows the kit's --warn, which is its
// only other hue.
// Every token is a plain string here, not the literal type `as const` gives
// PADEL — otherwise a second brand could only repeat the first brand's values.
type Theme = Record<keyof typeof PADEL, string>;

const FCE: Theme = {
  bg:         '#ffffff',
  surface:    '#f7fafd',
  surface2:   '#eef3fa',
  border:     '#e2e8f2',

  textPrimary:'#091a38',
  textMuted:  '#6b7a95',
  textDim:    '#94a1b8',

  accent:     '#1e78f0',
  accentDim:  '#0f5fd6',
  win:        '#1e78f0',
  loss:       '#e0533a',
  warn:       '#e0533a',

  cream:      '#ffffff',
  cream2:     '#eef3fa',
  paper:      '#f7fafd',
  paperEdge:  '#e2e8f2',
  ink:        '#091a38',
  ink2:       '#1f2d4d',
  muted:      '#6b7a95',
  rule:       '#cbd5e5',
  gold:       '#1e78f0',
  goldDeep:   '#0f5fd6',
  goldSoft:   '#5b9bf5',
  emerald:    '#1e78f0',
  emeraldDeep:'#0f5fd6',
  burgundy:   '#e0533a',

  fontDisplay: '"Manrope", system-ui, -apple-system, sans-serif',
  fontSerif:   '"Inter", system-ui, -apple-system, sans-serif',
  fontUI:      '"Inter", system-ui, -apple-system, sans-serif',
};

export const T: Theme = BRAND === 'fce' ? FCE : PADEL;

// Name of the club running this instance. BRAND_NAME is the display form used
// in headers and the default tournament name; BRAND_CLUB is the prose form
// used inside sentences. Kept apart so the padel wording stays exactly as it
// reads on production today. "King of the Court" and "Team Americano"
// elsewhere are FORMAT names, not branding — those stay.
export const BRAND_NAME = BRAND === 'fce' ? 'FCE PADEL' : 'PADEL MASTERS';
export const BRAND_CLUB = BRAND === 'fce' ? 'FCE Padel' : 'Padel Club';

// Level palette — elegant gradient from emerald (top) to cream (bottom).
// Each entry carries a compact label so the pill stays narrow even when
// the API returns longer strings like "C-strong" / "C- strong" which
// otherwise wrap and break the court-card layout.
type LevelStyle = { bg: string; fg: string; label: string };

const PADEL_LEVELS: Record<string, LevelStyle> = {
  'A+':        { bg: '#1d3327', fg: '#f5efe4', label: 'A+' },
  'A':         { bg: '#1d3327', fg: '#f5efe4', label: 'A'  },
  'B+':        { bg: '#2f4a3a', fg: '#f5efe4', label: 'B+' },
  'B':         { bg: '#2f4a3a', fg: '#f5efe4', label: 'B'  },
  'C+':        { bg: '#a6864d', fg: '#1f2a24', label: 'C+' },
  'C-strong':  { bg: '#a6864d', fg: '#1f2a24', label: 'C-s' },
  'C- strong': { bg: '#a6864d', fg: '#1f2a24', label: 'C-s' }, // legacy alias
  'C':         { bg: '#d9c08a', fg: '#1f2a24', label: 'C'  },
  'C-':        { bg: '#ede4d2', fg: '#1f2a24', label: 'C-' },
  'D':         { bg: '#ede4d2', fg: '#7a7062', label: 'D'  },
};

// Same ladder in the FCE palette: navy at the top fading to blue tint.
const FCE_LEVELS: Record<string, LevelStyle> = {
  'A+':        { bg: '#091a38', fg: '#ffffff', label: 'A+' },
  'A':         { bg: '#091a38', fg: '#ffffff', label: 'A'  },
  'B+':        { bg: '#1f2d4d', fg: '#ffffff', label: 'B+' },
  'B':         { bg: '#1f2d4d', fg: '#ffffff', label: 'B'  },
  'C+':        { bg: '#1e78f0', fg: '#ffffff', label: 'C+' },
  'C-strong':  { bg: '#5b9bf5', fg: '#ffffff', label: 'C-s' },
  'C- strong': { bg: '#5b9bf5', fg: '#ffffff', label: 'C-s' },
  'C':         { bg: '#e8f0fe', fg: '#0f5fd6', label: 'C'  },
  'C-':        { bg: '#eef3fa', fg: '#3a4a6b', label: 'C-' },
  'D':         { bg: '#eef3fa', fg: '#94a1b8', label: 'D'  },
};

export const LEVEL_COLORS = BRAND === 'fce' ? FCE_LEVELS : PADEL_LEVELS;
