import type { ReactNode } from 'react';
import { T } from '../lib/tokens';

interface Props {
  label: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

// Primary CTA → emerald pill in Elegant. Accepts ReactNode so callers
// can put an icon next to the label (camera, share, …).
export function MainCTA({ label, disabled, onClick }: Props) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', height: 50, borderRadius: 999, border: 'none',
      background: disabled ? T.cream2 : T.emerald,
      color: disabled ? T.muted : T.cream,
      fontFamily: T.fontDisplay,
      fontWeight: 600, fontSize: 14, letterSpacing: 1.5,
      textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'opacity 100ms',
      opacity: disabled ? 0.6 : 1,
    }}>{label}</button>
  );
}

// Secondary CTA → outline ghost with gold rule.
export function SecondaryCTA({ label, danger, onClick }: { label: string; danger?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', height: 48, borderRadius: 999,
      border: `1px solid ${danger ? T.burgundy : T.rule}`,
      background: 'transparent',
      color: danger ? T.burgundy : T.ink,
      fontFamily: T.fontDisplay,
      fontWeight: 600, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase',
      padding: '0 18px',
    }}>{label}</button>
  );
}
