// Whoop-inspired dark theme tokens. Source of truth — sync with design/.
export const T = {
  bg: '#0B0E12',
  surface: '#141820',
  surface2: '#1B2029',
  border: '#252B36',
  textPrimary: '#F2F4F7',
  textMuted: '#7A8290',
  textDim: '#4B5260',
  accent: '#08FFC8',
  accentDim: '#04D4A6',
  win: '#08FFC8',
  loss: '#FF4D6D',
  warn: '#FFB400',
} as const;

export const LEVEL_COLORS: Record<string, { bg: string; fg: string }> = {
  'A+':       { bg: '#08FFC8', fg: '#0B0E12' },
  'A':        { bg: '#04D4A6', fg: '#0B0E12' },
  'B+':       { bg: '#00A37F', fg: '#F2F4F7' },
  'B':        { bg: '#3D7A6B', fg: '#F2F4F7' },
  'C+':       { bg: '#5A6B73', fg: '#F2F4F7' },
  'C':        { bg: '#4B5260', fg: '#F2F4F7' },
  'C- strong':{ bg: '#3F454F', fg: '#F2F4F7' },
  'C-':       { bg: '#33383F', fg: '#F2F4F7' },
  'D':        { bg: '#252B36', fg: '#7A8290' },
};
