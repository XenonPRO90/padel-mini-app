import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useNextRound } from '../api/mutations';
import { T } from '../lib/tokens';
import { CourtCard, Label } from '../components/CourtCard';
import { MainCTA } from '../components/MainCTA';
import { CourtSheet } from './CourtSheet';
import type { ActiveTournamentResponse, Match } from '../lib/types';

interface Props {
  onBack: () => void;
  onShareSchedule?: () => void;
}

export function LiveRoundScreen({ onBack, onShareSchedule }: Props) {
  const { data, isLoading } = useQuery<ActiveTournamentResponse>({
    queryKey: ['active-tournament'],
    queryFn: () => api('/api/tournaments/active'),
  });
  const [openMatch, setOpenMatch] = useState<Match | null>(null);
  const nextRound = useNextRound();

  if (isLoading) {
    return (
      <div style={{ padding: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16, marginBottom: 10 }} />
        ))}
      </div>
    );
  }

  if (!data?.tournament || !data?.round) {
    return (
      <div style={{ padding: 24, color: T.textMuted }}>No active round.</div>
    );
  }

  const { tournament: t, round } = data;
  const total = round.matches_total;
  const recorded = round.matches_recorded;
  const allDone = total > 0 && recorded === total;
  const max = data.tournament.num_courts;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', padding: 4, color: T.textMuted, cursor: 'pointer',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            ROUND <span style={{ color: T.accent }}>{round.round_num}</span>
            <span style={{ color: T.textDim, fontWeight: 500 }}> / {Math.max(round.round_num, 7)}</span>
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{t.name}</div>
        </div>
        <button
          onClick={() => onShareSchedule?.()}
          style={{
            background: T.accent, border: 'none', borderRadius: 999,
            padding: '6px 12px', color: '#0B0E12', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v12M7 9l5-5 5 5M5 16v3a1 1 0 001 1h12a1 1 0 001-1v-3" stroke="#0B0E12" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          POSTER
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {round.matches.map((m) => {
          const medal = m.court_num <= 3 ? (m.court_num as 1 | 2 | 3) : undefined;
          return (
            <CourtCard
              key={m.match_id}
              match={m}
              onClick={() => setOpenMatch(m)}
              medal={medal}
            />
          );
        })}
      </div>

      <div style={{ padding: '10px 16px 12px', borderTop: `1px solid ${T.border}`, background: T.bg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ ...Label(), fontSize: 10 }}>{recorded} / {total} RESULTS</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {round.matches.map((m, i) => (
              <div key={i} style={{
                width: 100 / max + '%', maxWidth: 26, height: 4, borderRadius: 2,
                background: m.winner !== null ? T.accent : T.border,
              }} />
            ))}
          </div>
        </div>
        <MainCTA
          label={
            nextRound.isPending ? 'GENERATING…'
            : allDone ? 'NEXT ROUND'
            : `WAITING · ${recorded}/${total}`
          }
          disabled={!allDone || nextRound.isPending}
          onClick={() => allDone && nextRound.mutate(t.id)}
        />
      </div>

      {openMatch && (
        <CourtSheet
          match={openMatch}
          onClose={() => setOpenMatch(null)}
        />
      )}
    </div>
  );
}
