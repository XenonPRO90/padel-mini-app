import { T } from '../lib/tokens';
import { LevelBadge } from './Badges';
import { EMedal, EBallIcon } from '../lib/elegant';
import type { Match } from '../lib/types';

interface Props {
  match: Match;
  onClick?: () => void;
  readonly?: boolean;
  medal?: 1 | 2 | 3;
}

// Elegant court card — emerald label-block on the left (КОРТ + number + ball),
// score-card on the right with two team rows separated by a gold "vs".
export function CourtCard({ match, onClick, readonly, medal }: Props) {
  const winner = match.winner;
  return (
    <div onClick={onClick} style={{
      display: 'flex', borderRadius: 18, overflow: 'hidden',
      border: `1px solid ${T.paperEdge}`,
      background: T.paper,
      cursor: onClick ? 'pointer' : 'default',
    }}>
      {/* Court column */}
      <div style={{
        background: T.emerald, color: T.cream,
        padding: '14px 8px', textAlign: 'center',
        width: 86, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', gap: 6,
      }}>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 9, letterSpacing: 3,
        }}>КОРТ</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, lineHeight: 1,
        }}>{match.court_num}</div>
        <div style={{ width: 22, height: 1, background: T.goldSoft, opacity: 0.6 }} />
        {medal ? <EMedal place={medal} size={20} /> : <EBallIcon size={14} color={T.goldSoft} />}
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 9, letterSpacing: 2,
          color: T.goldSoft, opacity: 0.9,
        }}>{match.points} {match.points === 1 ? 'PT' : 'PTS'}</div>
      </div>

      {/* Teams */}
      <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
        <TeamRow team={match.team1} highlight={winner === 1} dim={winner !== null && winner !== 1} />
        <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: T.paperEdge }} />
          <span style={{
            fontFamily: T.fontSerif, fontSize: 11, fontStyle: 'italic', color: T.muted,
          }}>vs</span>
          <div style={{ flex: 1, height: 1, background: T.paperEdge }} />
        </div>
        <TeamRow team={match.team2} highlight={winner === 2} dim={winner !== null && winner !== 2} />

        {winner === null ? (
          <div style={{
            marginTop: 10,
            fontFamily: T.fontDisplay, fontSize: 10, letterSpacing: 2,
            color: T.gold, textAlign: 'right',
          }}>{readonly ? 'NO RESULT' : 'TAP TO RECORD'}</div>
        ) : (
          <div style={{
            marginTop: 10,
            fontFamily: T.fontDisplay, fontSize: 10, letterSpacing: 2,
            color: T.win, textAlign: 'right',
          }}>RECORDED · TEAM {winner} +{match.points}</div>
        )}
      </div>
    </div>
  );
}

function TeamRow({ team, highlight, dim }: { team: Match['team1']; highlight: boolean; dim: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, opacity: dim ? 0.45 : 1, minWidth: 0,
    }}>
      {team.map((p, i) => (
        <div key={i} style={{ display: 'contents' }}>
          {i > 0 && (
            <span style={{
              color: T.gold, fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 13,
            }}>и</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexShrink: 1 }}>
            <span style={{
              fontFamily: T.fontDisplay, fontSize: 14,
              fontWeight: highlight ? 600 : 500,
              color: highlight ? T.win : T.ink,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: 110,
            }}>{p.name}</span>
            <LevelBadge level={p.level} size="sm" />
          </div>
        </div>
      ))}
      {highlight && <span style={{ color: T.win, fontSize: 14, marginLeft: 'auto' }}>✓</span>}
    </div>
  );
}

// Re-export Label helper used elsewhere as Elegant gold caps.
export function Label(): React.CSSProperties {
  return {
    fontFamily: T.fontDisplay,
    fontSize: 10, fontWeight: 600, letterSpacing: 3,
    color: T.gold, textTransform: 'uppercase',
  };
}
