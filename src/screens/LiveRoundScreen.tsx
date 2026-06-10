import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useNextRound, useUndoLastRound } from '../api/mutations';
import { T } from '../lib/tokens';
import { CourtCard } from '../components/CourtCard';
import { MainCTA } from '../components/MainCTA';
import { CourtSheet } from './CourtSheet';
import { RosterSheet } from './RosterSheet';
import { ELabel, EShareIcon, EPeopleIcon } from '../lib/elegant';
import type { ActiveTournamentResponse, Match } from '../lib/types';

// Telegram's WebApp.showConfirm (window.confirm is unreliable in the in-app
// WebView); falls back to window.confirm outside Telegram.
function tgConfirm(message: string): Promise<boolean> {
  const tg = window.Telegram?.WebApp;
  if (tg?.showConfirm) {
    return new Promise((resolve) => tg.showConfirm!(message, (ok) => resolve(ok)));
  }
  return Promise.resolve(window.confirm(message));
}

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
  const [rosterOpen, setRosterOpen] = useState(false);
  const nextRound = useNextRound();
  const undoRound = useUndoLastRound();

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
      <div style={{
        padding: 24, color: T.muted, fontFamily: T.fontSerif,
        fontStyle: 'italic', textAlign: 'center',
      }}>No active round.</div>
    );
  }

  const { tournament: t, round } = data;
  const total = round.matches_total;
  const recorded = round.matches_recorded;
  const allDone = total > 0 && recorded === total;
  const totalRounds = Math.max(round.round_num, 7);
  const canUndo = round.round_num > 1;

  const onUndo = async () => {
    if (undoRound.isPending) return;
    const prev = round.round_num - 1;
    const lossNote = recorded > 0
      ? `\n\nВнесённые результаты раунда ${round.round_num} (${recorded}) будут удалены.`
      : '';
    const ok = await tgConfirm(
      `Откатить к раунду ${prev}?\n\nРаунд ${round.round_num} удалится и вы вернётесь в раунд ${prev} — поправьте победителя, затем снова нажмите «Next round».${lossNote}`
    );
    if (!ok) return;
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium');
    } catch { /* ignore */ }
    undoRound.mutate(t.id, {
      onError: (e) => alert((e as Error).message || 'Не удалось откатить раунд'),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '10px 16px 12px',
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
          }}>ROUND {round.round_num} <span style={{ color: T.muted, fontWeight: 500 }}>/ {totalRounds}</span></div>
          <div style={{
            fontFamily: T.fontSerif, fontStyle: 'italic',
            fontSize: 12, color: T.muted, marginTop: 2,
          }}>{t.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setRosterOpen(true)} aria-label="Roster" style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 4, color: T.gold,
          }}>
            <EPeopleIcon size={20} />
          </button>
          <button onClick={() => onShareSchedule?.()} aria-label="Share schedule" style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 4, color: T.gold,
          }}>
            <EShareIcon size={18} />
          </button>
        </div>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto',
        // Generous bottom breathing room so the last court's "RECORDED" pill
        // is never tucked under the sticky footer on iOS Telegram WebView,
        // which mis-measures viewport height when safe-area insets vary.
        padding: '14px 16px 36px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
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

      <div style={{
        padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 6px)',
        borderTop: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 10,
        }}>
          <ELabel color={allDone ? T.emerald : T.gold}>Results · {recorded} / {total}</ELabel>
          <div style={{ display: 'flex', gap: 4 }}>
            {round.matches.map((m, i) => (
              <div key={i} style={{
                width: 22, height: 4, borderRadius: 2,
                background: m.winner !== null ? T.emerald : T.paperEdge,
              }} />
            ))}
          </div>
        </div>
        <MainCTA
          label={
            nextRound.isPending ? 'Generating…'
            : allDone ? 'Next round'
            : `Waiting · ${recorded}/${total}`
          }
          disabled={!allDone || nextRound.isPending}
          onClick={() => allDone && nextRound.mutate(t.id)}
        />
        {canUndo && (
          <button onClick={onUndo} disabled={undoRound.isPending} style={{
            width: '100%', marginTop: 8, padding: '8px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: T.muted, fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 13,
          }}>
            {undoRound.isPending ? 'Откат…' : `↩ Ошибка в прошлом раунде? Откатить к раунду ${round.round_num - 1}`}
          </button>
        )}
      </div>

      {openMatch && (
        <CourtSheet match={openMatch} onClose={() => setOpenMatch(null)} />
      )}
      {rosterOpen && (
        <RosterSheet
          tid={t.id}
          roundMatches={round.matches}
          onClose={() => setRosterOpen(false)}
        />
      )}
    </div>
  );
}
