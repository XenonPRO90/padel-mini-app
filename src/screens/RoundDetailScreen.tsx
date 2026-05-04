import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { T } from '../lib/tokens';
import { CourtCard, Label } from '../components/CourtCard';
import type { Round, Match } from '../lib/types';

interface Props {
  tid: number;
  roundNum: number;
  onBack: () => void;
}

interface Resp {
  round: Round;
  matches: Match[];
}

export function RoundDetailScreen({ tid, roundNum, onBack }: Props) {
  const { data, isLoading } = useQuery<Resp>({
    queryKey: ['round', tid, roundNum],
    queryFn: () => api(`/api/tournaments/${tid}/rounds/${roundNum}`),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: T.textMuted, padding: 4, cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ ...Label(), flex: 1, textAlign: 'center' }}>ROUND DETAIL</div>
        <div style={{ width: 30 }} />
      </div>

      <div style={{ padding: '8px 16px 4px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          ROUND <span style={{ color: T.accent }}>{roundNum}</span>
        </div>
      </div>

      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: T.surface2, border: `1px solid ${T.border}`,
          fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: '0.1em',
        }}>READ ONLY · ARCHIVED</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />
          ))
        ) : (
          data?.matches.map((m) => {
            const medal = m.court_num <= 3 ? (m.court_num as 1 | 2 | 3) : undefined;
            return (
              <div key={m.match_id} style={{ opacity: 0.92 }}>
                <CourtCard match={m} medal={medal} readonly />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
