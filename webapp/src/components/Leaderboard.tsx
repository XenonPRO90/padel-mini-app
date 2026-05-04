import { T } from '../lib/tokens';
import { LevelBadge } from './Badges';
import type { ScoredPlayer } from '../lib/types';

export function LeaderboardRow({ rank, player, max }: { rank: number; player: ScoredPlayer; max: number }) {
  const pct = max ? player.points / max : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
      <div style={{
        width: 22, fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.1em',
        fontVariantNumeric: 'tabular-nums',
      }}>#{rank}</div>
      <div style={{
        width: 3, height: 28, background: T.accent, borderRadius: 2,
        opacity: 0.3 + 0.7 * pct,
      }} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: T.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {player.name}
        </span>
        <LevelBadge level={player.level} size="sm" />
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {player.points}
        </div>
        <div style={{ fontSize: 10, color: T.textDim, marginTop: 2, letterSpacing: '0.05em', fontVariantNumeric: 'tabular-nums' }}>
          ✓{player.wins}  ✗{player.losses}
        </div>
      </div>
    </div>
  );
}
