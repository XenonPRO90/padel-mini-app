import { T } from '../lib/tokens';

interface Props {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function MainCTA({ label, disabled, onClick }: Props) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', height: 50, borderRadius: 12, border: 'none',
      background: disabled ? T.surface2 : T.accent,
      color: disabled ? T.textMuted : '#0B0E12',
      fontWeight: 700, fontSize: 13, letterSpacing: '0.1em',
      textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}>{label}</button>
  );
}

export function SecondaryCTA({ label, danger, onClick }: { label: string; danger?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', height: 48, borderRadius: 12,
      border: `1px solid ${danger ? T.loss : T.border}`,
      background: 'transparent', color: danger ? T.loss : T.textPrimary,
      fontWeight: 600, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '0 18px',
    }}>{label}</button>
  );
}
