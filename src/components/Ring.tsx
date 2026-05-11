import { type ReactNode } from 'react';
import { T } from '../lib/tokens';

interface Props {
  size?: number;
  stroke?: number;
  value?: number;
  max?: number;
  color?: string;
  children?: ReactNode;
}

// Elegant ring: thin gold rule for the empty arc, emerald 2px for the filled.
// Hero ring sits centered in EHomeActive — keeps the radial progress affordance
// but in a quiet, antique-frame mood (no Whoop glow).
export function Ring({ size = 220, stroke = 2, value = 0, max = 1, color = T.emerald, children }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const dash = c * pct;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.rule} strokeWidth={1} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 800ms cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  );
}
