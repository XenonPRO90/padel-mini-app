import { T } from '../lib/tokens';
import { LevelBadge } from './Badges';
import type { Match } from '../lib/types';

interface Props {
  match: Match;
  onClick?: () => void;
  readonly?: boolean;
  medal?: 1 | 2 | 3;
}

export function CourtCard({ match, onClick, readonly, medal }: Props) {
  const winner = match.winner;
  const teamColor = (n: 1 | 2) => {
    if (winner === null) return T.textPrimary;
    return winner === n ? T.accent : T.textDim;
  };

  return (
    <div onClick={onClick} style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 12,
      cursor: onClick ? 'pointer' : 'default',
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={Label()}>COURT {match.court_num}</span>
          {medal === 1 && <Medal kind={1} />}
          {medal === 2 && <Medal kind={2} />}
          {medal === 3 && <Medal kind={3} />}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '0.08em', fontVariantNumeric: 'tabular-nums' }}>
          {match.points} PTS
        </span>
      </div>

      {/* teams */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <TeamRow team={match.team1} color={teamColor(1)} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span style={{ ...Label(), fontSize: 9, color: T.textDim }}>VS</span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>
        <TeamRow team={match.team2} color={teamColor(2)} />
      </div>

      {/* footer */}
      <div style={{ marginTop: 2 }}>
        {winner === null ? (
          <div style={{
            border: `1px dashed ${T.border}`,
            borderRadius: 8, padding: '8px 10px', textAlign: 'center',
            fontSize: 10, fontWeight: 600, color: T.textMuted,
            letterSpacing: '0.16em',
          }}>{readonly ? 'NO RESULT' : 'PENDING'}</div>
        ) : (
          <div style={{
            background: `${T.accent}14`, border: `1px solid ${T.accent}40`,
            borderRadius: 8, padding: '8px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: T.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
          }}>
            ✓ TEAM {winner} WON
          </div>
        )}
      </div>
    </div>
  );
}

function TeamRow({ team, color }: { team: Match['team1']; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {team.map((p, i) => (
        <div key={i} style={{ display: 'contents' }}>
          {i > 0 && <span style={{ color: T.textDim, fontSize: 12, fontWeight: 500 }}>·</span>}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{
              fontSize: 14, fontWeight: 600, color,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{p.name}</span>
            <LevelBadge level={p.level} size="sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Label(): React.CSSProperties {
  return {
    fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
    color: T.textMuted, textTransform: 'uppercase',
  };
}

function Medal({ kind }: { kind: 1 | 2 | 3 }) {
  const colors = {
    1: { fill: '#FFD24A', stroke: '#A87C00', text: '#7A4F00' },
    2: { fill: '#C7CDD3', stroke: '#7A8290', text: '#3a3f47' },
    3: { fill: '#D49764', stroke: '#7A4F1A', text: '#3F2200' },
  } as const;
  const c = colors[kind];
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <circle cx="12" cy="14" r="7" fill={c.fill} stroke={c.stroke} strokeWidth="1" />
      <text x="12" y="17" textAnchor="middle" fontSize="8" fontWeight="700" fill={c.text}>{kind}</text>
    </svg>
  );
}
