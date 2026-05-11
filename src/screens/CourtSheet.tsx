import { useEffect, useState } from 'react';
import { T } from '../lib/tokens';
import { LevelBadge, SideBadge } from '../components/Badges';
import { useSetWinner } from '../api/mutations';
import type { Match, MatchPlayer } from '../lib/types';
import { Avatar } from './PlayersScreen';
import { ELabel, EBtn } from '../lib/elegant';

interface Props {
  match: Match;
  onClose: () => void;
}

export function CourtSheet({ match, onClose }: Props) {
  const setWinner = useSetWinner();
  const [editing, setEditing] = useState(match.winner === null);
  const [celebrate, setCelebrate] = useState<1 | 2 | null>(null);

  const winner = celebrate ?? match.winner;

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);

  const onPick = async (team: 1 | 2) => {
    setCelebrate(team);
    try {
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
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(31,42,36,0.45)',
      }} />

      {/* sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: T.paper,
        borderTop: `1px solid ${T.rule}`,
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: '0 0 calc(env(safe-area-inset-bottom, 0px) + 16px)',
        maxHeight: '90%', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -20px 40px -20px rgba(31,42,36,0.35)',
        animation: 'slideUp 280ms cubic-bezier(.2,.7,.3,1)',
        overflow: 'hidden',
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Court header (emerald block) */}
        <div style={{
          background: T.emerald, color: T.cream,
          padding: '14px 22px 16px', textAlign: 'center', position: 'relative',
        }}>
          <div onClick={onClose} style={{
            position: 'absolute', top: 6, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', cursor: 'pointer',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.goldSoft, opacity: 0.5 }} />
          </div>
          <div style={{ marginTop: 10, fontFamily: T.fontDisplay, fontSize: 10, letterSpacing: 4, opacity: 0.85 }}>КОРТ</div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 44, fontWeight: 600,
            lineHeight: 1, margin: '4px 0',
          }}>{match.court_num}</div>
          <div style={{
            fontFamily: T.fontSerif, fontSize: 13, fontStyle: 'italic',
            color: T.goldSoft,
          }}>worth {match.points} {match.points === 1 ? 'point' : 'points'}</div>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'transparent', border: 'none', color: T.cream,
            fontSize: 22, cursor: 'pointer', lineHeight: 1,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '16px 18px', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <ELabel>{editing ? 'Who won this court?' : 'Result recorded'}</ELabel>
          </div>

          <TeamZone
            teamLabel="Team 1"
            team={match.team1}
            isWinner={winner === 1}
            isLoser={winner !== null && winner !== 1}
            isCelebrating={celebrate === 1}
            tappable={editing && !setWinner.isPending}
            onTap={() => onPick(1)}
          />

          <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0' }}>
            <div style={{ flex: 1, height: 1, background: T.paperEdge }} />
            <span style={{
              fontFamily: T.fontSerif, fontStyle: 'italic',
              color: T.gold, padding: '0 14px', fontSize: 16,
            }}>or</span>
            <div style={{ flex: 1, height: 1, background: T.paperEdge }} />
          </div>

          <TeamZone
            teamLabel="Team 2"
            team={match.team2}
            isWinner={winner === 2}
            isLoser={winner !== null && winner !== 2}
            isCelebrating={celebrate === 2}
            tappable={editing && !setWinner.isPending}
            onTap={() => onPick(2)}
          />
        </div>

        {/* Footer */}
        <div style={{ padding: '4px 18px 0' }}>
          {!editing && match.winner !== null ? (
            <EBtn kind="ghost" style={{ width: '100%' }} onClick={() => setEditing(true)}>
              Edit result
            </EBtn>
          ) : setWinner.isPending ? (
            <div style={{
              textAlign: 'center', color: T.emerald,
              fontFamily: T.fontDisplay, fontSize: 12, letterSpacing: 2,
              padding: 14, fontWeight: 600, textTransform: 'uppercase',
            }}>Saving…</div>
          ) : (
            <div style={{
              textAlign: 'center', color: T.muted,
              fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 13,
              padding: 14,
            }}>Tap a team above to record the winner</div>
          )}
        </div>
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
      border: isWinner ? `1.5px solid ${T.gold}` : `1px solid ${T.paperEdge}`,
      background: isWinner ? '#f9f1de' : T.paper,
      borderRadius: 14, padding: '14px 16px',
      opacity: isLoser ? 0.45 : 1,
      transition: 'all 200ms',
      transform: isCelebrating ? 'scale(1.02)' : 'scale(1)',
      boxShadow: isCelebrating ? `0 0 0 6px rgba(166,134,77,0.25), 0 0 30px rgba(166,134,77,0.4)` : 'none',
      cursor: tappable ? 'pointer' : 'default',
      animation: isCelebrating ? 'elegantGlow 600ms ease-out' : undefined,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10,
      }}>
        <ELabel color={isWinner ? T.gold : T.muted}>{teamLabel}</ELabel>
        {isWinner && <span style={{ color: T.gold, fontSize: 18 }}>✓</span>}
      </div>
      {team.map((p, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginTop: i ? 10 : 0,
        }}>
          <Avatar name={p.name} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
              color: isWinner ? T.win : T.ink,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{p.name}</div>
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
