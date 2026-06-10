import { T } from '../lib/tokens';
import { LevelBadge } from './Badges';
import { EMedal, EBallIcon } from '../lib/elegant';
import { courtDisplay, type Match } from '../lib/types';

export type Slot = 1 | 2 | 3 | 4;

interface Props {
  match: Match;
  onClick?: () => void;
  readonly?: boolean;
  medal?: 1 | 2 | 3;
  // ─ Edit mode (archived round editing) ─
  editable?: boolean;
  // Slot (1..4) selected for a swap within THIS card, or null.
  selectedSlot?: Slot | null;
  onPlayerTap?: (slot: Slot) => void;
  onWinnerTap?: () => void;
}

// Elegant court card — emerald label-block on the left (КОРТ + number + ball),
// score-card on the right with two team rows separated by a gold "vs".
export function CourtCard({
  match, onClick, readonly, medal,
  editable, selectedSlot, onPlayerTap, onWinnerTap,
}: Props) {
  const winner = match.winner;
  const recorded = winner !== null;
  return (
    <div onClick={editable ? undefined : onClick} style={{
      display: 'flex', borderRadius: 18, overflow: 'hidden',
      border: `1px solid ${recorded ? T.emerald : T.paperEdge}`,
      background: T.paper,
      boxShadow: recorded ? '0 0 0 1px rgba(47,74,58,0.08), 0 2px 8px -4px rgba(47,74,58,0.18)' : 'none',
      cursor: onClick && !editable ? 'pointer' : 'default',
      transition: 'border-color 200ms, box-shadow 200ms',
    }}>
      {/* Court column */}
      <div style={{
        background: T.emerald, color: T.cream,
        padding: '14px 8px', textAlign: 'center',
        width: 86, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', gap: 6,
        position: 'relative',
      }}>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 9, letterSpacing: 3,
        }}>КОРТ</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, lineHeight: 1,
        }}>{courtDisplay(match)}</div>
        <div style={{ width: 22, height: 1, background: T.goldSoft, opacity: 0.6 }} />
        {medal ? <EMedal place={medal} size={20} /> : <EBallIcon size={14} color={T.goldSoft} />}
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 9, letterSpacing: 2,
          color: T.goldSoft, opacity: 0.9,
        }}>{match.points} {match.points === 1 ? 'PT' : 'PTS'}</div>
        {recorded && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            width: 18, height: 18, borderRadius: 999,
            background: T.cream, color: T.emerald,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
            boxShadow: '0 0 0 2px rgba(245,239,228,0.4)',
          }}>✓</div>
        )}
      </div>

      {/* Teams */}
      <div style={{
        flex: 1, padding: '12px 14px', minWidth: 0,
        background: recorded ? 'linear-gradient(180deg, #f1ede0 0%, #f5f1e4 100%)' : 'transparent',
      }}>
        <TeamRow
          team={match.team1} baseSlot={1}
          highlight={winner === 1} dim={recorded && winner !== 1}
          editable={editable} selectedSlot={selectedSlot ?? null} onPlayerTap={onPlayerTap}
        />
        <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: recorded ? T.goldSoft : T.paperEdge }} />
          <span style={{
            fontFamily: T.fontSerif, fontSize: 11, fontStyle: 'italic', color: T.muted,
          }}>vs</span>
          <div style={{ flex: 1, height: 1, background: recorded ? T.goldSoft : T.paperEdge }} />
        </div>
        <TeamRow
          team={match.team2} baseSlot={3}
          highlight={winner === 2} dim={recorded && winner !== 2}
          editable={editable} selectedSlot={selectedSlot ?? null} onPlayerTap={onPlayerTap}
        />

        {editable ? (
          <div style={{ marginTop: 12 }}>
            <button onClick={onWinnerTap} style={{
              width: '100%', cursor: 'pointer',
              background: 'transparent', border: `1px solid ${T.gold}`,
              borderRadius: 999, padding: '7px 10px',
              color: T.gold, fontFamily: T.fontDisplay, fontSize: 10,
              fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase',
            }}>
              {recorded ? `✎ Победитель · сейчас Team ${winner}` : '✎ Указать победителя'}
            </button>
          </div>
        ) : !recorded ? (
          <div style={{
            marginTop: 10,
            fontFamily: T.fontDisplay, fontSize: 10, letterSpacing: 2,
            color: T.gold, textAlign: 'right',
          }}>{readonly ? 'NO RESULT' : 'TAP TO RECORD'}</div>
        ) : (
          <div style={{
            marginTop: 10,
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: T.emerald, color: T.cream,
              borderRadius: 999, padding: '3px 10px',
              fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 600,
              letterSpacing: 1.5, textTransform: 'uppercase',
            }}>✓ Team {winner} <span style={{ opacity: 0.75 }}>+{match.points}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamRow({
  team, baseSlot, highlight, dim, editable, selectedSlot, onPlayerTap,
}: {
  team: Match['team1'];
  baseSlot: 1 | 3;
  highlight: boolean;
  dim: boolean;
  editable?: boolean;
  selectedSlot?: Slot | null;
  onPlayerTap?: (slot: Slot) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      opacity: dim && !editable ? 0.45 : 1, minWidth: 0,
    }}>
      {team.map((p, i) => {
        const slot = (baseSlot + i) as Slot;
        const selected = editable && selectedSlot === slot;
        return (
          <div key={i} style={{ display: 'contents' }}>
            {i > 0 && (
              <span style={{
                color: T.gold, fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 13,
              }}>и</span>
            )}
            <div
              onClick={editable ? () => onPlayerTap?.(slot) : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexShrink: 1,
                cursor: editable ? 'pointer' : 'default',
                borderRadius: 999,
                padding: editable ? '4px 8px' : 0,
                margin: editable ? '2px 0' : 0,
                border: editable
                  ? `1.5px solid ${selected ? T.gold : T.paperEdge}`
                  : 'none',
                background: selected ? '#f9f1de' : 'transparent',
                boxShadow: selected ? '0 0 0 4px rgba(166,134,77,0.18)' : 'none',
                transition: 'all 160ms',
              }}>
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
        );
      })}
      {highlight && !editable && (
        <span style={{ color: T.win, fontSize: 14, marginLeft: 'auto' }}>✓</span>
      )}
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
