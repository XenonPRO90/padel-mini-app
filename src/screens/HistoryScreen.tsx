import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { T } from '../lib/tokens';
import { Label } from '../components/CourtCard';
import type { HistoryItem } from '../lib/types';

interface HistoryScreenProps {
  onOpenTournament?: (tid: number) => void;
}

export function HistoryScreen({ onOpenTournament }: HistoryScreenProps = {}) {
  const { data, isLoading, error, refetch } = useQuery<{ items: HistoryItem[] }>({
    queryKey: ['history'],
    queryFn: () => api('/api/tournaments/history'),
  });

  if (error) {
    return <CenterError onRetry={() => refetch()} />;
  }

  const items = data?.items ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 16px 4px' }}>
        <div style={Label()}>HISTORY</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{items.length}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          <Skeletons />
        ) : items.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
            No finished tournaments yet
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              onClick={() => onOpenTournament?.(it.id)}
              style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '14px 16px',
                cursor: onOpenTournament ? 'pointer' : 'default',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{it.name}</div>
                  <div style={{ ...Label(), fontSize: 10, marginTop: 6 }}>
                    {fmtDate(it.created_at)} · {it.mode.toUpperCase()} · {it.players_count} PLAYERS
                  </div>
                </div>
                <span style={{ color: T.textMuted, fontSize: 18 }}>›</span>
              </div>
              {it.winner && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
                  padding: '10px 12px', background: T.surface2, borderRadius: 10,
                }}>
                  <span style={{ fontSize: 13 }}>🥇</span>
                  <span style={{ color: T.accent, fontWeight: 600, fontSize: 13 }}>{it.winner}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
  } catch { return iso.slice(0, 10); }
}

function Skeletons() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />
      ))}
    </>
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
