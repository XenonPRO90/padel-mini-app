import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { T } from '../lib/tokens';
import { CourtCard, type Slot } from '../components/CourtCard';
import { ELabel } from '../lib/elegant';
import { useSwapPlayers } from '../api/mutations';
import { CourtSheet } from './CourtSheet';
import { groups8CourtTag, type Round, type Match } from '../lib/types';

interface Props {
  tid: number;
  roundNum: number;
  mode?: string;
  onBack: () => void;
}

interface Resp {
  round: Round;
  matches: Match[];
}

interface Selection { matchId: number; slot: Slot; }

export function RoundDetailScreen({ tid, roundNum, mode, onBack }: Props) {
  const isGroups8 = mode === 'groups8';
  const { data, isLoading } = useQuery<Resp>({
    queryKey: ['round', tid, roundNum],
    queryFn: () => api(`/api/tournaments/${tid}/rounds/${roundNum}`),
  });

  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [winnerMatch, setWinnerMatch] = useState<Match | null>(null);
  const swap = useSwapPlayers();

  const exitEdit = () => { setEditMode(false); setSelected(null); };

  const onPlayerTap = (match: Match, slot: Slot) => {
    if (swap.isPending) return;
    // First pick — select it.
    if (!selected) { setSelected({ matchId: match.match_id, slot }); return; }
    // Tap the same slot again — deselect.
    if (selected.matchId === match.match_id && selected.slot === slot) {
      setSelected(null);
      return;
    }
    // Second pick — swap the two.
    const a = selected;
    const b = { matchId: match.match_id, slot };
    setSelected(null);
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch { /* ignore */ }
    swap.mutate({ a, b }, {
      onError: (e) => alert((e as Error).message || 'Не удалось поменять игроков'),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        <button onClick={editMode ? exitEdit : onBack} style={{
          background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
          color: T.gold, fontFamily: T.fontSerif, fontSize: 14,
        }}>{editMode ? 'Отмена' : '← Back'}</button>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600,
            color: T.ink, letterSpacing: 3,
          }}>ROUND {roundNum}</div>
        </div>
        <button onClick={() => (editMode ? exitEdit() : setEditMode(true))} style={{
          background: editMode ? T.emerald : 'transparent',
          border: `1px solid ${editMode ? T.emerald : T.gold}`,
          borderRadius: 999, padding: '5px 12px', cursor: 'pointer',
          color: editMode ? T.cream : T.gold,
          fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600, letterSpacing: 1,
        }}>{editMode ? 'Готово' : 'Править'}</button>
      </div>

      <div style={{ padding: '12px 18px 8px', textAlign: 'center' }}>
        {editMode ? (
          <ELabel color={T.gold}>
            {selected ? 'Выберите второго игрока для обмена' : 'Тапните игрока, затем второго — поменять местами'}
          </ELabel>
        ) : (
          <ELabel>Read only · archived</ELabel>
        )}
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '4px 16px 36px',
        display: 'flex', flexDirection: 'column', gap: 12,
        opacity: swap.isPending ? 0.6 : 1, transition: 'opacity 150ms',
        pointerEvents: swap.isPending ? 'none' : 'auto',
      }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />
          ))
        ) : (
          data?.matches.map((m) => {
            const tag = isGroups8 ? groups8CourtTag(roundNum, m.court_num) : undefined;
            const medal = !isGroups8 && m.court_num <= 3 ? (m.court_num as 1 | 2 | 3) : undefined;
            return (
              <div key={m.match_id} style={{ opacity: editMode ? 1 : 0.92 }}>
                <CourtCard
                  match={m}
                  medal={medal}
                  tag={tag}
                  readonly
                  editable={editMode}
                  selectedSlot={selected?.matchId === m.match_id ? selected.slot : null}
                  onPlayerTap={(slot) => onPlayerTap(m, slot)}
                  onWinnerTap={() => setWinnerMatch(m)}
                />
              </div>
            );
          })
        )}
      </div>

      {winnerMatch && (
        <CourtSheet
          match={winnerMatch}
          initialEditing
          scoreMode={isGroups8}
          onClose={() => setWinnerMatch(null)}
        />
      )}
    </div>
  );
}
