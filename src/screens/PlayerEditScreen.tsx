import { useState } from 'react';
import { T } from '../lib/tokens';
import { LevelBadge } from '../components/Badges';
import { MainCTA, SecondaryCTA } from '../components/MainCTA';
import { Label } from '../components/CourtCard';
import { Avatar } from './PlayersScreen';
import { useCreatePlayer, useUpdatePlayer, useDeletePlayer, type SideValue } from '../api/players';

const LEVELS = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'C- strong', 'C-', 'D'];
const SIDES: { id: SideValue; label: string }[] = [
  { id: 'right', label: 'RIGHT' },
  { id: 'left', label: 'LEFT' },
  { id: 'both', label: 'UNIVERSAL' },
];

interface Props {
  player?: { id: number; name: string; level: string; side: string } | null;
  onClose: () => void;
}

export function PlayerEditScreen({ player, onClose }: Props) {
  const isNew = !player;
  const [name, setName] = useState(player?.name ?? '');
  const sideInit: SideValue =
    player?.side === 'right' || player?.side === 'left' ? player.side : 'both';
  const [side, setSide] = useState<SideValue>(sideInit);
  const [level, setLevel] = useState(player?.level ?? 'C');

  const create = useCreatePlayer();
  const update = useUpdatePlayer(player?.id ?? 0);
  const del = useDeletePlayer();

  const busy = create.isPending || update.isPending || del.isPending;
  const canSave = !busy && name.trim().length > 0;

  const onSave = async () => {
    try {
      if (isNew) {
        await create.mutateAsync({ name, level, side });
      } else {
        await update.mutateAsync({ name, level, side });
      }
      onClose();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const onDelete = async () => {
    if (!player) return;
    const ok = window.Telegram?.WebApp ? true : confirm(`Delete ${player.name}?`);
    if (!ok) return;
    try {
      await del.mutateAsync(player.id);
      onClose();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: T.textMuted, padding: 4, cursor: 'pointer',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ ...Label(), flex: 1, textAlign: 'center' }}>{isNew ? 'NEW PLAYER' : 'EDIT PLAYER'}</div>
        <div style={{ width: 30 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 20px' }}>
          <Avatar name={name || '?'} size={88} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ ...Label(), marginBottom: 8 }}>NAME</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Player name"
            style={{
              width: '100%', background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '14px 16px', fontSize: 17, fontWeight: 500,
              color: T.textPrimary, outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ ...Label(), marginBottom: 8 }}>LEVEL</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {LEVELS.map((l) => {
              const active = l === level;
              return (
                <div
                  key={l}
                  onClick={() => setLevel(l)}
                  style={{
                    flexShrink: 0, padding: '10px 14px', borderRadius: 10,
                    background: active ? T.surface2 : T.surface,
                    border: `1px solid ${active ? T.accent : T.border}`,
                    color: active ? T.accent : T.textMuted,
                    fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
                    cursor: 'pointer',
                  }}
                >{l}</div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ ...Label(), marginBottom: 8 }}>SIDE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {SIDES.map((s) => {
              const active = s.id === side;
              return (
                <div
                  key={s.id}
                  onClick={() => setSide(s.id)}
                  style={{
                    background: active ? `${T.accent}10` : T.surface,
                    border: `1px solid ${active ? T.accent : T.border}`,
                    borderRadius: 12, padding: '14px 8px', textAlign: 'center',
                    color: active ? T.accent : T.textMuted, fontWeight: 700,
                    fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer',
                  }}
                >{s.label}</div>
              );
            })}
          </div>
        </div>

        {!isNew && (
          <div style={{ marginTop: 24 }}>
            <button
              onClick={onDelete}
              disabled={busy}
              style={{
                background: 'transparent', border: 'none',
                width: '100%', padding: 14, color: T.loss,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
                textTransform: 'uppercase', cursor: busy ? 'wait' : 'pointer',
              }}
            >🗑 DELETE PLAYER</button>
          </div>
        )}
      </div>

      <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${T.border}` }}>
        <MainCTA
          label={busy ? 'SAVING…' : 'SAVE'}
          disabled={!canSave}
          onClick={onSave}
        />
      </div>
    </div>
  );
}

// Re-export to avoid TS unused warnings
export { LevelBadge, SecondaryCTA };
