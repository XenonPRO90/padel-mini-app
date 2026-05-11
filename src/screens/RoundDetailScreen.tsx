import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { T } from '../lib/tokens';
import { CourtCard } from '../components/CourtCard';
import { ELabel } from '../lib/elegant';
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
      <div style={{
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
          color: T.gold, fontFamily: T.fontSerif, fontSize: 14,
        }}>← Back</button>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600,
            color: T.ink, letterSpacing: 3,
          }}>ROUND {roundNum}</div>
        </div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ padding: '12px 18px 8px', textAlign: 'center' }}>
        <ELabel>Read only · archived</ELabel>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '4px 16px 36px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
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
