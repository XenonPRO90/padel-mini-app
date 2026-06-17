import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useNextRound, useUndoLastRound, useEliminate } from '../api/mutations';
import { useMe } from '../api/me';
import { T } from '../lib/tokens';
import { CourtCard } from '../components/CourtCard';
import { MainCTA } from '../components/MainCTA';
import { CourtSheet } from './CourtSheet';
import { RosterSheet } from './RosterSheet';
import { ELabel, EShareIcon, EPeopleIcon } from '../lib/elegant';
import { groups8CourtTag, type ActiveTournamentResponse, type Match, type MatchPlayer } from '../lib/types';

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
  const [elimOpen, setElimOpen] = useState(false);
  const nextRound = useNextRound();
  const undoRound = useUndoLastRound();
  const { data: me } = useMe();
  const isAdmin = !!me?.is_admin;

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
  const totalRounds = t.total_rounds ?? Math.max(round.round_num, 7);
  const canUndo = round.round_num > 1;
  // Americano / groups8 have a fixed number of rounds; the last one ends it.
  const isLastRound = t.total_rounds != null && round.round_num >= t.total_rounds;
  const isGroups8 = t.mode === 'groups8';
  const phaseLabel = isGroups8
    ? (round.round_num <= 3 ? `Групповой этап · тур ${round.round_num}`
       : round.round_num === 4 ? 'Полуфиналы и плей-офф 5–8'
       : 'Финалы')
    : null;

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
            fontSize: 12, color: phaseLabel ? T.gold : T.muted, marginTop: 2,
          }}>{phaseLabel ?? t.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isAdmin && (
            <button onClick={() => setRosterOpen(true)} aria-label="Roster" style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 4, color: T.gold,
            }}>
              <EPeopleIcon size={20} />
            </button>
          )}
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
          const tag = isGroups8 ? groups8CourtTag(round.round_num, m.court_num) : undefined;
          const medal = !isGroups8 && m.court_num <= 3 ? (m.court_num as 1 | 2 | 3) : undefined;
          return (
            <CourtCard
              key={m.match_id}
              match={m}
              onClick={isAdmin ? () => setOpenMatch(m) : undefined}
              medal={medal}
              tag={tag}
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
        {/* Admin-only controls. Last round of americano/groups8: advance()
            finishes the tournament (groups8 also computes final 1–8 placement). */}
        {isAdmin && (
          <>
            <MainCTA
              label={
                nextRound.isPending ? (isLastRound ? 'Finishing…' : 'Generating…')
                : !allDone ? `Waiting · ${recorded}/${total}`
                : isLastRound ? 'Завершить турнир'
                : 'Next round'
              }
              disabled={!allDone || nextRound.isPending}
              onClick={() => allDone && nextRound.mutate(t.id)}
            />
            {allDone && t.mode === 'rotating' && !isLastRound && t.num_courts > 1 && (
              <button onClick={() => setElimOpen(true)} style={{
                width: '100%', marginTop: 8, padding: '11px',
                background: 'transparent', border: `1px solid ${T.gold}`, borderRadius: 12,
                cursor: 'pointer', color: T.goldDeep,
                fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600, letterSpacing: 0.5,
              }}>🚪 Выбывание · убрать игроков и сократить корты</button>
            )}
            {canUndo && (
              <button onClick={onUndo} disabled={undoRound.isPending} style={{
                width: '100%', marginTop: 8, padding: '8px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: T.muted, fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 13,
              }}>
                {undoRound.isPending ? 'Откат…' : `↩ Ошибка в прошлом раунде? Откатить к раунду ${round.round_num - 1}`}
              </button>
            )}
          </>
        )}
      </div>

      {openMatch && (
        <CourtSheet match={openMatch} scoreMode={isGroups8} onClose={() => setOpenMatch(null)} />
      )}
      {rosterOpen && (
        <RosterSheet
          tid={t.id}
          roundMatches={round.matches}
          onClose={() => setRosterOpen(false)}
        />
      )}
      {elimOpen && (
        <EliminationModal tid={t.id} matches={round.matches} onClose={() => setElimOpen(false)} />
      )}
    </div>
  );
}

// KotC elimination: pick losing pairs (bottom courts pre-selected) to drop out;
// the remaining players continue on fewer courts. Remaining must stay a multiple of 4.
function EliminationModal({ tid, matches, onClose }: {
  tid: number; matches: Match[]; onClose: () => void;
}) {
  const elim = useEliminate();
  const rows = [...matches]
    .sort((a, b) => b.court_num - a.court_num)  // bottom courts first
    .map((m) => {
      const losers = m.winner === 1 ? m.team2 : m.winner === 2 ? m.team1 : [];
      return { court: m.court_num, label: m.court_label || String(m.court_num), losers };
    })
    .filter((r) => r.losers.length === 2);
  // Pre-select losing pairs of the two lowest courts (Liza's typical cut).
  const initial = new Set<number>();
  rows.slice(0, 2).forEach((r) => r.losers.forEach((p) => initial.add(p.player_id)));
  const [sel, setSel] = useState<Set<number>>(initial);

  const totalPlayers = matches.length * 4;
  const remaining = totalPlayers - sel.size;
  const valid = sel.size > 0 && remaining >= 4 && remaining % 4 === 0;

  const togglePair = (ps: MatchPlayer[]) => {
    setSel((prev) => {
      const next = new Set(prev);
      const allIn = ps.every((p) => next.has(p.player_id));
      ps.forEach((p) => (allIn ? next.delete(p.player_id) : next.add(p.player_id)));
      return next;
    });
  };

  const confirm = () => {
    if (!valid || elim.isPending) return;
    elim.mutate({ tid, player_ids: [...sel] }, {
      onSuccess: onClose,
      onError: (e) => alert((e as Error).message || 'Не удалось'),
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(31,42,36,0.55)' }} />
      <div style={{
        position: 'relative', margin: 'auto', width: '100%', maxWidth: 400,
        maxHeight: '86vh', overflowY: 'auto',
        background: T.cream, border: `1px solid ${T.paperEdge}`, borderRadius: 18, padding: '20px 18px',
      }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 700, color: T.ink }}>Выбывание</div>
        <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginTop: 4, marginBottom: 14 }}>
          Отметь, кто завершает турнир. Оставшиеся продолжат на меньшем числе кортов (нужно кратно 4).
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => {
            const on = r.losers.every((p) => sel.has(p.player_id));
            return (
              <button key={r.court} onClick={() => togglePair(r.losers)} style={{
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                border: `1px solid ${on ? T.burgundy : T.paperEdge}`,
                background: on ? '#f7ecec' : T.paper,
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  border: `1px solid ${on ? T.burgundy : T.rule}`,
                  background: on ? T.burgundy : 'transparent', color: T.cream,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                }}>{on ? '✓' : ''}</span>
                <div>
                  <div style={{ fontFamily: T.fontDisplay, fontSize: 10, letterSpacing: 1, color: T.gold }}>КОРТ {r.label} · проигравшие</div>
                  <div style={{ fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink }}>
                    {r.losers.map((p) => p.name).join(' & ')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{
          marginTop: 14, fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 13,
          color: valid ? T.muted : T.burgundy, textAlign: 'center',
        }}>
          Выбывает: {sel.size} · останется: {remaining}{remaining % 4 !== 0 ? ' (не кратно 4!)' : ` (${remaining / 4} корта)`}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={confirm} disabled={!valid || elim.isPending} style={{
            flex: 1, padding: '12px', borderRadius: 999, border: 'none',
            cursor: valid ? 'pointer' : 'default',
            background: valid ? T.emerald : T.paperEdge, color: T.cream,
            fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600,
          }}>{elim.isPending ? 'Применяю…' : 'Подтвердить и след. раунд'}</button>
          <button onClick={onClose} style={{
            padding: '12px 16px', borderRadius: 999, border: `1px solid ${T.paperEdge}`,
            background: 'transparent', color: T.muted, cursor: 'pointer',
            fontFamily: T.fontDisplay, fontSize: 14,
          }}>Отмена</button>
        </div>
      </div>
    </div>
  );
}
