import { T } from '../lib/tokens';
import { LevelBadge } from './Badges';
import { EMedal, EPlace } from '../lib/elegant';
import type { ScoredPlayer } from '../lib/types';

// Elegant leaderboard row — medal (1-3) or numbered place, name in Playfair,
// gold points number on the right, W/L in serif italic.
export function LeaderboardRow({ rank, player, max: _max }: { rank: number; player: ScoredPlayer; max: number }) {
  const isPodium = rank <= 3;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '40px 1fr auto auto auto',
      alignItems: 'center', gap: 10,
      padding: '10px 14px',
      borderBottom: `1px solid ${T.paperEdge}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {isPodium ? <EMedal place={rank as 1 | 2 | 3} size={26} /> : <EPlace n={rank} />}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, minWidth: 0,
      }}>
        <span style={{
          fontFamily: T.fontDisplay, fontSize: 15, fontWeight: isPodium ? 600 : 500, color: T.ink,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{player.name}</span>
        <LevelBadge level={player.level} size="sm" />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{
          fontFamily: T.fontDisplay, fontSize: isPodium ? 18 : 16, fontWeight: 600,
          color: T.goldDeep,
        }}>{player.points}</span>
        <span style={{
          fontFamily: T.fontSerif, fontSize: 11, fontStyle: 'italic', color: T.muted,
        }}>pts</span>
      </div>
      <div style={{ width: 1, height: 14, background: T.paperEdge }} />
      <div style={{ fontFamily: T.fontDisplay, fontSize: 12, letterSpacing: 0.5 }}>
        <span style={{ color: T.win }}>W {player.wins}</span>
        <span style={{ margin: '0 4px', color: T.paperEdge }}>·</span>
        <span style={{ color: T.burgundy }}>L {player.losses}</span>
      </div>
    </div>
  );
}
