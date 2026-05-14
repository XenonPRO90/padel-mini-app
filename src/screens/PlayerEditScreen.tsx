import { useState } from 'react';
import { LEVEL_COLORS, T } from '../lib/tokens';
import { LevelBadge } from '../components/Badges';
import { MainCTA, SecondaryCTA } from '../components/MainCTA';
import { Avatar } from './PlayersScreen';
import { ELabel, EOrnRule } from '../lib/elegant';
import { useCreatePlayer, useUpdatePlayer, useDeletePlayer, type SideValue } from '../api/players';

const LEVELS = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'C- strong', 'C-', 'D'];
const SIDES: { id: SideValue; label: string }[] = [
  { id: 'right', label: 'Right' },
  { id: 'left',  label: 'Left' },
  { id: 'both',  label: 'Universal' },
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
      if (isNew) await create.mutateAsync({ name, level, side });
      else       await update.mutateAsync({ name, level, side });
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
      <div style={{
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
          color: T.gold, fontFamily: T.fontSerif, fontSize: 14,
        }}>← Back</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
            color: T.ink, letterSpacing: 3, textTransform: 'uppercase',
          }}>{isNew ? 'New Player' : 'Edit Player'}</div>
        </div>
        <div style={{ width: 50 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0 14px' }}>
          <Avatar name={name || '?'} size={88} />
          <div style={{ marginTop: 10 }}><EOrnRule width={200} /></div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <ELabel style={{ marginBottom: 6 }}>Name</ELabel>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Player name"
            style={{
              width: '100%', background: T.paper,
              border: `1px solid ${T.paperEdge}`,
              borderRadius: 14, padding: '14px 16px',
              fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 500,
              color: T.ink, outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <ELabel style={{ marginBottom: 8 }}>Level</ELabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {LEVELS.map((l) => {
              const active = l === level;
              // Use the canonical compact label from tokens so C-strong shows
              // as "C-s" (matching the badge), not duplicated "C-".
              const display = LEVEL_COLORS[l]?.label ?? l;
              return (
                <div
                  key={l}
                  onClick={() => setLevel(l)}
                  style={{
                    textAlign: 'center', padding: '10px 4px',
                    background: active ? T.emerald : T.paper,
                    color: active ? T.cream : T.ink,
                    border: `1px solid ${active ? T.emerald : T.paperEdge}`,
                    borderRadius: 14, cursor: 'pointer',
                    fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600,
                    letterSpacing: 1,
                  }}
                >{display}</div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <ELabel style={{ marginBottom: 8 }}>Preferred Side</ELabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {SIDES.map((s) => {
              const active = s.id === side;
              const letter = s.id === 'right' ? 'R' : s.id === 'left' ? 'L' : 'U';
              return (
                <div
                  key={s.id}
                  onClick={() => setSide(s.id)}
                  style={{
                    textAlign: 'center', padding: '14px 6px',
                    background: active ? T.emerald : T.paper,
                    color: active ? T.cream : T.ink,
                    border: `1px solid ${active ? T.emerald : T.paperEdge}`,
                    borderRadius: 14, cursor: 'pointer',
                    fontFamily: T.fontDisplay,
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{letter}</div>
                  <div style={{
                    fontFamily: T.fontSerif, fontStyle: 'italic',
                    fontSize: 12, opacity: 0.85, marginTop: 2,
                  }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {!isNew && (
          <div style={{ marginTop: 22 }}>
            <button
              onClick={onDelete}
              disabled={busy}
              style={{
                background: 'transparent', border: 'none', width: '100%',
                padding: 14, color: T.burgundy,
                fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600,
                letterSpacing: 2, textTransform: 'uppercase',
                cursor: busy ? 'wait' : 'pointer',
              }}
            >Delete Player</button>
          </div>
        )}
      </div>

      <div style={{
        padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 6px)',
        borderTop: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        <MainCTA
          label={busy ? 'Saving…' : 'Save'}
          disabled={!canSave}
          onClick={onSave}
        />
      </div>
    </div>
  );
}

// Re-export to avoid TS unused warnings
export { LevelBadge, SecondaryCTA };
