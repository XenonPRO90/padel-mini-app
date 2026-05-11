import { LEVEL_COLORS, T } from '../lib/tokens';
import type { Side } from '../lib/types';

interface LevelProps { level: string; size?: 'sm' | 'md' | 'lg' }
export function LevelBadge({ level, size = 'md' }: LevelProps) {
  const cfg = LEVEL_COLORS[level] || LEVEL_COLORS['C'];
  const dim = size === 'lg' ? { w: 42, h: 22, f: 12 }
            : size === 'sm' ? { w: 26, h: 16, f: 10 }
            :                  { w: 32, h: 18, f: 11 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: dim.w, height: dim.h, borderRadius: 999,
      background: cfg.bg, color: cfg.fg,
      fontFamily: T.fontDisplay, fontSize: dim.f, fontWeight: 600,
      letterSpacing: 0.4, whiteSpace: 'nowrap',
    }}>{level}</span>
  );
}

const SIDE_LABEL: Record<string, 'R' | 'L' | 'U'> = {
  right: 'R', R: 'R',
  left: 'L', L: 'L',
  both: 'U', U: 'U',
};

interface SideProps { side: Side }
// Elegant side mark — small letter pill with hue from token.
// R → emerald · L → gold · U → muted.
export function SideBadge({ side }: SideProps) {
  const s = SIDE_LABEL[side as string] || 'U';
  const c = s === 'R' ? T.emerald : s === 'L' ? T.gold : T.muted;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: 999,
      border: `1px solid ${c}`, color: c,
      fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600,
    }}>{s}</span>
  );
}
