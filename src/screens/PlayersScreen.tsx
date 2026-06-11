import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useMe } from '../api/me';
import { T } from '../lib/tokens';
import { LevelBadge, SideBadge } from '../components/Badges';
import { ELabel, EGoldFrame, EBtn } from '../lib/elegant';
import type { Player } from '../lib/types';

interface PlayersScreenProps {
  onOpenPlayer?: (p: Player) => void;
  onAddPlayer?: () => void;
  onOpenRequests?: () => void;
}

export function PlayersScreen({ onOpenPlayer, onAddPlayer, onOpenRequests }: PlayersScreenProps = {}) {
  const [q, setQ] = useState('');
  const { data: me } = useMe();
  const isAdmin = !!me?.is_admin;
  const pending = me?.pending_requests ?? 0;
  const { data, isLoading, error, refetch } = useQuery<{ items: Player[] }>({
    queryKey: ['players'],
    queryFn: () => api('/api/players'),
  });

  if (error) return <CenterError onRetry={() => refetch()} />;

  const items = data?.items ?? [];
  const filtered = q ? items.filter(p => p.name.toLowerCase().includes(q.toLowerCase())) : items;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{
        padding: '10px 18px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        <div>
          <ELabel>· Players · the library</ELabel>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 600,
            color: T.ink, marginTop: 2, fontVariantNumeric: 'tabular-nums',
          }}>{items.length} <span style={{
            fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 14, color: T.muted,
          }}>guests</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isAdmin && onOpenRequests && (
          <button onClick={onOpenRequests} style={{
            background: 'transparent', color: T.gold, border: `1px solid ${T.gold}`,
            borderRadius: 999, padding: '8px 14px', cursor: 'pointer',
            fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600, letterSpacing: 1,
            position: 'relative',
          }}>
            Заявки{pending > 0 ? ` · ${pending}` : ''}
          </button>
        )}
        {isAdmin && onAddPlayer && (
          <button onClick={onAddPlayer} style={{
            background: T.emerald, color: T.cream, border: 'none',
            borderRadius: 999, padding: '8px 16px',
            fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600,
            letterSpacing: 1.5, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            textTransform: 'uppercase',
          }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            Add
          </button>
        )}
        </div>
      </div>

      <div style={{ padding: '12px 18px 8px' }}>
        <div style={{
          background: T.paper, border: `1px solid ${T.paperEdge}`,
          borderRadius: 999, padding: '10px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ color: T.gold, fontSize: 14 }}>⌕</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: T.ink, fontSize: 15,
              fontFamily: T.fontSerif, fontStyle: q ? 'normal' : 'italic',
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 24px' }}>
        {isLoading ? (
          <Skeletons />
        ) : filtered.length === 0 ? (
          <div style={{
            padding: '60px 0', textAlign: 'center',
            fontFamily: T.fontSerif, fontStyle: 'italic',
            color: T.muted, fontSize: 14,
          }}>No matches</div>
        ) : (
          <EGoldFrame>
            <div style={{ padding: '4px 0' }}>
              {filtered.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => onOpenPlayer?.(p)}
                  style={{
                    display: 'grid', gridTemplateColumns: 'auto 1fr auto auto',
                    gap: 12, alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: i < filtered.length - 1 ? `1px solid ${T.paperEdge}` : 'none',
                    cursor: onOpenPlayer ? 'pointer' : 'default',
                  }}
                >
                  <Avatar name={p.name} size={32} photoUrl={p.photo_url} />
                  <span style={{
                    fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 500,
                    color: T.ink, whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{p.name}</span>
                  <SideBadge side={p.side} />
                  <LevelBadge level={p.level} size="sm" />
                </div>
              ))}
            </div>
          </EGoldFrame>
        )}
      </div>
    </div>
  );
}

// Elegant avatar — soft cream circle with gold border + ink initials in Playfair.
export function Avatar({ name, size = 40, photoUrl }: { name: string; size?: number; photoUrl?: string | null }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const [imgError, setImgError] = useState(false);
  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          border: `1px solid ${T.rule}`, flexShrink: 0, background: T.cream2,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: T.cream2,
      border: `1px solid ${T.rule}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: T.goldDeep, fontFamily: T.fontDisplay,
      fontWeight: 600, fontSize: size * 0.42,
      letterSpacing: 0.4, flexShrink: 0,
    }}>{initials}</div>
  );
}

function Skeletons() {
  return (
    <EGoldFrame>
      <div style={{ padding: '4px 0' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px',
            borderBottom: i < 7 ? `1px solid ${T.paperEdge}` : 'none',
          }}>
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            <div className="skeleton" style={{ flex: 1, height: 16, maxWidth: 180 }} />
            <div className="skeleton" style={{ width: 32, height: 18, borderRadius: 999 }} />
          </div>
        ))}
      </div>
    </EGoldFrame>
  );
}

function CenterError({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24,
    }}>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600,
        color: T.burgundy, letterSpacing: 2,
      }}>Could not load</div>
      <EBtn kind="primary" onClick={onRetry}>Retry</EBtn>
    </div>
  );
}
