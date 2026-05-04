import { useEffect, useState } from 'react';
import { T } from '../lib/tokens';
import { LevelBadge, SideBadge } from '../components/Badges';
import { useSetWinner } from '../api/mutations';
import type { Match, MatchPlayer } from '../lib/types';
import { Avatar } from './PlayersScreen';
import { Label } from '../components/CourtCard';
import { SecondaryCTA } from '../components/MainCTA';

interface Props {
  match: Match;
  onClose: () => void;
}

export function CourtSheet({ match, onClose }: Props) {
  const setWinner = useSetWinner();
  const [editing, setEditing] = useState(match.winner === null);
  const [celebrate, setCelebrate] = useState<1 | 2 | null>(null);

  const winner = celebrate ?? match.winner;

  // ESC closes
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);

  const onPick = async (team: 1 | 2) => {
    setCelebrate(team);
    try {
      // haptic if in Telegram
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium');
    } catch { /* ignore */ }
    try {
      await setWinner.mutateAsync({ matchId: match.match_id, winner: team });
      setTimeout(() => onClose(), 600);
    } catch (e) {
      setCelebrate(null);
      alert((e as Error).message || 'Failed to record');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      {/* dimmer */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />

      {/* sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: T.surface2, borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 20px)',
        maxHeight: '88%', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.6)',
        animation: 'slideUp 280ms cubic-bezier(.2,.7,.3,1)',
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* drag handle */}
        <div onClick={onClose} style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 12px', cursor: 'pointer' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
        </div>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>COURT {match.court_num}</span>
          <span style={{ color: T.textMuted, fontSize: 12, letterSpacing: '0.08em', fontWeight: 600 }}>
            {match.points} PTS
          </span>
        </div>
        <div style={{ ...Label(), marginBottom: 18 }}>
          {editing ? 'TAP THE WINNING TEAM' : 'RESULT RECORDED'}
        </div>

        {/* team 1 */}
        <TeamZone
          teamLabel="TEAM 1"
          team={match.team1}
          isWinner={winner === 1}
          isLoser={winner !== null && winner !== 1}
          isCelebrating={celebrate === 1}
          tappable={editing && !setWinner.isPending}
          onTap={() => onPick(1)}
        />

        {/* divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.textMuted, letterSpacing: '0.2em', fontVariantNumeric: 'tabular-nums' }}>VS</span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>

        {/* team 2 */}
        <TeamZone
          teamLabel="TEAM 2"
          team={match.team2}
          isWinner={winner === 2}
          isLoser={winner !== null && winner !== 2}
          isCelebrating={celebrate === 2}
          tappable={editing && !setWinner.isPending}
          onTap={() => onPick(2)}
        />

        <div style={{ flex: 1, minHeight: 12 }} />

        {/* footer */}
        {!editing && match.winner !== null ? (
          <SecondaryCTA label="EDIT RESULT" onClick={() => setEditing(true)} />
        ) : setWinner.isPending ? (
          <div style={{ textAlign: 'center', color: T.accent, fontSize: 12, letterSpacing: '0.16em', padding: 14, fontWeight: 700 }}>
            SAVING…
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: T.textDim, fontSize: 11, letterSpacing: '0.1em', padding: 14 }}>
            TAP A TEAM ABOVE
          </div>
        )}
      </div>
    </div>
  );
}

function TeamZone({
  teamLabel, team, isWinner, isLoser, isCelebrating, tappable, onTap,
}: {
  teamLabel: string;
  team: MatchPlayer[];
  isWinner: boolean;
  isLoser: boolean;
  isCelebrating: boolean;
  tappable: boolean;
  onTap: () => void;
}) {
  return (
    <div onClick={tappable ? onTap : undefined} style={{
      border: `1.5px solid ${isWinner ? T.accent : T.border}`,
      background: isWinner ? `${T.accent}10` : 'transparent',
      borderRadius: 16, padding: '18px 16px',
      opacity: isLoser ? 0.4 : 1,
      minHeight: 100,
      transition: 'all 200ms',
      transform: isCelebrating ? 'scale(1.02)' : 'scale(1)',
      boxShadow: isCelebrating ? `0 0 0 4px ${T.accent}33, 0 0 40px ${T.accent}66` : 'none',
      cursor: tappable ? 'pointer' : 'default',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ ...Label(), color: isWinner ? T.accent : T.textMuted }}>{teamLabel}</span>
        {isWinner && (
          <span style={{
            background: T.accent, color: '#0B0E12',
            borderRadius: 999, padding: '3px 10px',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            ✓ WINNER
          </span>
        )}
      </div>
      {team.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: i ? 10 : 0 }}>
          <Avatar name={p.name} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <LevelBadge level={p.level} size="sm" />
              <SideBadge side={p.side} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
