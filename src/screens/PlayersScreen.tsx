import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { T } from '../lib/tokens';
import { LevelBadge, SideBadge } from '../components/Badges';
import { Label } from '../components/CourtCard';
import type { Player } from '../lib/types';

interface PlayersScreenProps {
  onOpenPlayer?: (p: Player) => void;
  onAddPlayer?: () => void;
}

export function PlayersScreen({ onOpenPlayer, onAddPlayer }: PlayersScreenProps = {}) {
  const [q, setQ] = useState('');
  const { data, isLoading, error, refetch } = useQuery<{ items: Player[] }>({
    queryKey: ['players'],
    queryFn: () => api('/api/players'),
  });

  if (error) {
    return (
      <CenterError onRetry={() => refetch()} />
    );
  }

  const items = data?.items ?? [];
  const filtered = q ? items.filter(p => p.name.toLowerCase().includes(q.toLowerCase())) : items;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={Label()}>PLAYERS</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{items.length}</div>
        </div>
        {onAddPlayer && (
          <button
            onClick={onAddPlayer}
            style={{
              background: T.accent, color: '#0B0E12',
              border: 'none', borderRadius: 999,
              padding: '8px 14px', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.1em', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#0B0E12" strokeWidth="2" strokeLinecap="round" />
            </svg>
            ADD
          </button>
        )}
      </div>
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <SearchIcon />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search players"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: T.textPrimary, fontSize: 14, fontFamily: 'inherit',
            }}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 24px' }}>
        {isLoading ? (
          <Skeletons />
        ) : (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '0 16px' }}>
            {filtered.map((p, i) => (
              <div
                key={p.id}
                onClick={() => onOpenPlayer?.(p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                  borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none',
                  cursor: onOpenPlayer ? 'pointer' : 'default',
                }}>
                <Avatar name={p.name} size={36} />
                <span style={{ flex: 1, fontSize: 16, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </span>
                <SideBadge side={p.side} />
                <LevelBadge level={p.level} size="sm" />
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '40px 0', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                No matches
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, oklch(0.45 0.06 ${hue}), oklch(0.32 0.04 ${hue}))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: T.textPrimary, fontWeight: 600, fontSize: size * 0.38,
      flexShrink: 0, border: `1px solid ${T.border}`,
    }}>{initials}</div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={T.textMuted} strokeWidth="1.5" />
      <path d="M20 20l-3-3" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Skeletons() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '0 16px' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
          <div className="skeleton" style={{ flex: 1, height: 16, maxWidth: 180 }} />
          <div className="skeleton" style={{ width: 32, height: 18, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}

function CenterError({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ ...Label(), color: T.loss }}>COULDN'T LOAD</div>
      <button onClick={onRetry} style={{
        padding: '10px 22px', borderRadius: 10,
        background: T.surface2, border: `1px solid ${T.border}`,
        color: T.accent, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
      }}>RETRY</button>
    </div>
  );
}
