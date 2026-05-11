import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { T } from '../lib/tokens';
import { ELabel, EMedal, EBtn } from '../lib/elegant';
import type { HistoryItem } from '../lib/types';

interface HistoryScreenProps {
  onOpenTournament?: (tid: number) => void;
}

export function HistoryScreen({ onOpenTournament }: HistoryScreenProps = {}) {
  const { data, isLoading, error, refetch } = useQuery<{ items: HistoryItem[] }>({
    queryKey: ['history'],
    queryFn: () => api('/api/tournaments/history'),
  });

  if (error) return <CenterError onRetry={() => refetch()} />;

  const items = data?.items ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '10px 18px 8px', background: T.cream,
        borderBottom: `1px solid ${T.paperEdge}`,
      }}>
        <ELabel>· History · finished tournaments</ELabel>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 600,
          color: T.ink, marginTop: 2, fontVariantNumeric: 'tabular-nums',
        }}>{items.length} <span style={{
          fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 14, color: T.muted,
        }}>played</span></div>
      </div>
      <div style={{
        flex: 1, overflowY: 'auto', padding: '14px 18px 24px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {isLoading ? (
          <Skeletons />
        ) : items.length === 0 ? (
          <div style={{
            padding: '60px 0', textAlign: 'center',
            fontFamily: T.fontSerif, fontStyle: 'italic',
            color: T.muted, fontSize: 14,
          }}>No finished tournaments yet</div>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              onClick={() => onOpenTournament?.(it.id)}
              style={{
                background: T.paper, border: `1px solid ${T.paperEdge}`,
                borderRadius: 14, padding: '14px 16px',
                cursor: onOpenTournament ? 'pointer' : 'default',
              }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'baseline', marginBottom: 4,
              }}>
                <span style={{
                  fontFamily: T.fontDisplay, fontSize: 11,
                  letterSpacing: 2.5, color: T.gold,
                  textTransform: 'uppercase',
                }}>{fmtDate(it.created_at)}</span>
                <span style={{
                  fontFamily: T.fontSerif, fontStyle: 'italic',
                  fontSize: 12, color: T.muted,
                }}>{it.players_count} guests · {it.mode}</span>
              </div>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600,
                color: T.ink, marginBottom: 6,
              }}>{it.name}</div>
              {it.winner && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <EMedal place={1} size={18} />
                  <span style={{
                    fontFamily: T.fontSerif, fontStyle: 'italic',
                    fontSize: 13, color: T.muted,
                  }}>won by <span style={{
                    color: T.ink, fontStyle: 'normal', fontWeight: 500,
                  }}>{it.winner}</span></span>
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
        <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />
      ))}
    </>
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
