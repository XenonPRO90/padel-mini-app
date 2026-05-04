import { LEVEL_COLORS, T } from '../lib/tokens';
import type { Side } from '../lib/types';

interface LevelProps { level: string; size?: 'sm' | 'md' | 'lg' }
export function LevelBadge({ level, size = 'md' }: LevelProps) {
  const cfg = LEVEL_COLORS[level] || LEVEL_COLORS['C'];
  const sizes = {
    sm: { padding: '2px 7px', fontSize: 10 },
    md: { padding: '3px 9px', fontSize: 11 },
    lg: { padding: '4px 11px', fontSize: 12 },
  };
  return (
    <span style={{
      background: cfg.bg, color: cfg.fg,
      borderRadius: 999, fontWeight: 700, letterSpacing: 0.4,
      ...sizes[size],
      display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
    }}>{level}</span>
  );
}

const SIDE_LABEL: Record<string, 'R' | 'L' | 'U'> = {
  right: 'R', R: 'R',
  left: 'L', L: 'L',
  both: 'U', U: 'U',
};

interface SideProps { side: Side }
export function SideBadge({ side }: SideProps) {
  const s = SIDE_LABEL[side as string] || 'U';
  const icons = {
    R: <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5h6m-2-2 2 2-2 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    L: <svg width="10" height="10" viewBox="0 0 10 10"><path d="M8 5H2m2-2-2 2 2 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    U: <svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 5h4m-2-2-2 2 2 2m0-4 2 2-2 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  };
  return (
    <span style={{
      border: `1px solid ${T.border}`, color: T.textMuted,
      borderRadius: 999, padding: '2px 8px',
      fontWeight: 700, fontSize: 10, letterSpacing: 0.5,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {icons[s]}
      {s}
    </span>
  );
}
