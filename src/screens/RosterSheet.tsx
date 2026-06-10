import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useReplacePlayer } from '../api/mutations';
import { T } from '../lib/tokens';
import { LevelBadge, SideBadge } from '../components/Badges';
import { ELabel, EBtn } from '../lib/elegant';
import { Avatar } from './PlayersScreen';
import { courtDisplay, type Match, type MatchPlayer, type Player } from '../lib/types';

interface Props {
  tid: number;
  roundMatches: Match[];
  onClose: () => void;
}

// All participants of the active tournament, derived from the round's
// matches so we don't need a dedicated /roster endpoint. The user can
// swap any participant for someone from the library; the new player
// inherits the slot, scores, pair-history and match participation.
export function RosterSheet({ tid, roundMatches, onClose }: Props) {
  const [swapping, setSwapping] = useState<MatchPlayer | null>(null);
  const replace = useReplacePlayer();

  // ESC closes
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);

  // Flatten current roster from match teams, preserve court order.
  const participants: { court: number; team: 1 | 2; player: MatchPlayer }[] = [];
  for (const m of roundMatches) {
    m.team1.forEach((p) => participants.push({ court: m.court_num, team: 1, player: p }));
    m.team2.forEach((p) => participants.push({ court: m.court_num, team: 2, player: p }));
  }

  const onPicked = async (newPlayer: Player) => {
    if (!swapping) return;
    try {
      await replace.mutateAsync({
        tid,
        oldPlayerId: swapping.player_id,
        newPlayerId: newPlayer.id,
      });
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium');
      setSwapping(null);
    } catch (e) {
      alert((e as Error).message || 'Replace failed');
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
        background: T.paper, borderTop: `1px solid ${T.rule}`,
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: '0 0 calc(env(safe-area-inset-bottom, 0px) + 12px)',
        maxHeight: '90%', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -20px 40px -20px rgba(31,42,36,0.35)',
        animation: 'slideUp 280ms cubic-bezier(.2,.7,.3,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px 12px', borderBottom: `1px solid ${T.paperEdge}`,
          textAlign: 'center', position: 'relative',
        }}>
          <div onClick={onClose} style={{
            display: 'flex', justifyContent: 'center',
            marginBottom: 6, cursor: 'pointer',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.rule, opacity: 0.6 }} />
          </div>
          <ELabel>Roster · {participants.length} players</ELabel>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600,
            color: T.ink, letterSpacing: 2, marginTop: 4,
          }}>Tap a player to replace</div>
        </div>

        {/* Participants — grouped per court */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 4px' }}>
          {roundMatches.map((m) => (
            <div key={m.match_id} style={{ marginBottom: 14 }}>
              <ELabel style={{ marginBottom: 6, paddingLeft: 4 }}>Court {courtDisplay(m)}</ELabel>
              <div style={{
                background: T.cream, border: `1px solid ${T.paperEdge}`,
                borderRadius: 14, overflow: 'hidden',
              }}>
                {[...m.team1, ...m.team2].map((p, i, arr) => (
                  <div
                    key={p.player_id}
                    onClick={() => setSwapping(p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px',
                      borderBottom: i < arr.length - 1 ? `1px solid ${T.paperEdge}` : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Avatar name={p.name} size={32} />
                    <span style={{
                      flex: 1, fontFamily: T.fontDisplay, fontSize: 15,
                      fontWeight: 500, color: T.ink,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{p.name}</span>
                    <SideBadge side={p.side} />
                    <LevelBadge level={p.level} size="sm" />
                    <span style={{ color: T.gold, fontSize: 14 }}>⇄</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Picker over the roster sheet */}
      {swapping && (
        <PlayerPicker
          tid={tid}
          oldPlayer={swapping}
          busy={replace.isPending}
          onClose={() => setSwapping(null)}
          onPick={onPicked}
        />
      )}
    </div>
  );
}

// ───────── Player picker (library minus current roster) ─────────
function PlayerPicker({
  tid: _tid, oldPlayer, busy, onClose, onPick,
}: {
  tid: number;
  oldPlayer: MatchPlayer;
  busy: boolean;
  onClose: () => void;
  onPick: (p: Player) => void;
}) {
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery<{ items: Player[] }>({
    queryKey: ['players'],
    queryFn: () => api('/api/players'),
  });

  // Pull current roster ids from cache via the active-tournament query.
  const active = useQuery<{ round?: { matches?: Match[] } }>({
    queryKey: ['active-tournament'],
    queryFn: () => api('/api/tournaments/active'),
  });
  const inTournament = new Set<number>();
  for (const m of active.data?.round?.matches ?? []) {
    [...m.team1, ...m.team2].forEach((p) => inTournament.add(p.player_id));
  }

  const items = data?.items ?? [];
  const filtered = items.filter((p) => !inTournament.has(p.id))
    .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 110,
      background: 'rgba(31,42,36,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          background: T.paper, borderTop: `1px solid ${T.rule}`,
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          padding: '14px 18px calc(env(safe-area-inset-bottom, 0px) + 14px)',
          display: 'flex', flexDirection: 'column', gap: 10,
          maxHeight: '85vh',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.rule, opacity: 0.6 }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <ELabel>Replace · {oldPlayer.name}</ELabel>
          <div style={{
            marginTop: 4, fontFamily: T.fontSerif, fontStyle: 'italic',
            fontSize: 13, color: T.muted,
          }}>New player takes the slot, scores and pair history.</div>
        </div>

        <div style={{
          background: T.cream, border: `1px solid ${T.paperEdge}`,
          borderRadius: 999, padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ color: T.gold }}>⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search library…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: T.ink, fontSize: 15,
              fontFamily: T.fontSerif, fontStyle: q ? 'normal' : 'italic',
            }}
          />
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', minHeight: 0,
          border: `1px solid ${T.paperEdge}`, borderRadius: 14,
        }}>
          {isLoading ? (
            <div className="skeleton" style={{ height: 220, borderRadius: 14 }} />
          ) : filtered.length === 0 ? (
            <div style={{
              padding: '36px 12px', textAlign: 'center',
              fontFamily: T.fontSerif, fontStyle: 'italic',
              color: T.muted, fontSize: 14,
            }}>
              {items.length === 0 ? 'Library is empty' : 'Nobody else available'}
            </div>
          ) : (
            filtered.map((p, i) => (
              <div
                key={p.id}
                onClick={() => !busy && onPick(p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderBottom: i < filtered.length - 1 ? `1px solid ${T.paperEdge}` : 'none',
                  cursor: busy ? 'wait' : 'pointer',
                  opacity: busy ? 0.5 : 1,
                  background: T.paper,
                }}
              >
                <Avatar name={p.name} size={32} />
                <span style={{
                  flex: 1, fontFamily: T.fontDisplay, fontSize: 15,
                  fontWeight: 500, color: T.ink,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{p.name}</span>
                <SideBadge side={p.side} />
                <LevelBadge level={p.level} size="sm" />
              </div>
            ))
          )}
        </div>

        <EBtn kind="ghost" style={{ width: '100%' }} onClick={onClose} disabled={busy}>
          Cancel
        </EBtn>
      </div>
    </div>
  );
}
