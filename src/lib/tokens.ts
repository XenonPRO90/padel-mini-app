// Elegant cream/emerald/gold theme tokens. Source of truth.
// Re-skinned from the Whoop-dark predecessor — variable names kept stable
// (bg/surface/border/textPrimary/accent/win/loss) so existing call-sites map
// without rename. New tokens (gold/emerald/cream/...) added below.

export const T = {
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

// Level palette — elegant gradient from emerald (top) to cream (bottom).
// Note key is `C-strong` (no space) to match brief / API.
export const LEVEL_COLORS: Record<string, { bg: string; fg: string }> = {
  'A+':        { bg: '#1d3327', fg: '#f5efe4' },
  'A':         { bg: '#1d3327', fg: '#f5efe4' },
  'B+':        { bg: '#2f4a3a', fg: '#f5efe4' },
  'B':         { bg: '#2f4a3a', fg: '#f5efe4' },
  'C+':        { bg: '#a6864d', fg: '#1f2a24' },
  'C-strong':  { bg: '#a6864d', fg: '#1f2a24' },
  'C- strong': { bg: '#a6864d', fg: '#1f2a24' }, // legacy alias from old API
  'C':         { bg: '#d9c08a', fg: '#1f2a24' },
  'C-':        { bg: '#ede4d2', fg: '#1f2a24' },
  'D':         { bg: '#ede4d2', fg: '#7a7062' },
};
