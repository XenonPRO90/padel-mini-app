import { useState } from 'react';
import { useFceAdmin, useFceImport, useFceResolve, useFceStandings,
         useFceSnapshot, useFceVouchers, useRedeemVoucher,
         useBackfillVouchers, type FcePendingRow, type FceVoucher } from '../api/fce';
import { T } from '../lib/tokens';
import { useT } from '../lib/i18n';

// Where the sponsor's daily export is turned into badges.
//
// Most of it settles itself: a row whose address a player has already declared
// matches exactly. What is left — people who never filled the field in, or
// mistyped it — lands here with the likeliest players under each row, so the
// decision is one tap and not a search.
const BLUE = '#1e78f0';

function tgConfirm(message: string): Promise<boolean> {
  const tg = window.Telegram?.WebApp;
  if (tg?.showConfirm) return new Promise((r) => tg.showConfirm!(message, (ok) => r(ok)));
  return Promise.resolve(window.confirm(message));
}

export function FceAdminScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { data, isLoading } = useFceAdmin();
  const doImport = useFceImport();
  const resolve = useFceResolve();
  const { data: standings } = useFceStandings();
  const snapshot = useFceSnapshot();
  const { data: vouchers } = useFceVouchers();
  const redeem = useRedeemVoucher();
  const backfill = useBackfillVouchers();
  const [text, setText] = useState('');
  const [report, setReport] = useState<Record<string, number> | null>(null);

  const runImport = async () => {
    try {
      setReport(await doImport.mutateAsync(text));
      setText('');
    } catch (e) {
      alert((e as Error).message || t('common.error'));
    }
  };

  const s = data?.stats;
  const pending = data?.pending ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      <div style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid ${T.paperEdge}`, background: T.cream, position: 'sticky', top: 0,
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
          color: T.gold, fontFamily: T.fontSerif, fontSize: 14,
        }}>← {t('common.back')}</button>
        <div style={{ fontFamily: T.fontSerif, fontSize: 17, fontWeight: 700, color: T.ink }}>
          FCE · сопоставление
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {s && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Stat n={s.verified} label="с бейджем" accent />
            <Stat n={s.declared} label="вписали почту" />
            <Stat n={s.pending} label="ждут решения" />
          </div>
        )}

        {/* The baseline the whole quarter is measured from. Taking it twice
            while the quarter is running would move everyone's starting point,
            so the button says what it does and asks first. */}
        <div style={{
          background: T.cream, border: `1px solid ${T.paperEdge}`, borderRadius: 12, padding: 12,
        }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', color: T.muted,
          }}>КВАРТАЛ</div>
          {standings?.quarter ? (
            <div style={{ marginTop: 6, fontFamily: T.fontSerif, fontSize: 14, color: T.ink }}>
              {standings.quarter.code}: {standings.quarter.start_date} — {standings.quarter.end_date}
              <div style={{ fontFamily: T.fontDisplay, fontSize: 12, color: T.muted, marginTop: 2 }}>
                снапшот снят {standings.quarter.taken_at}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 6, fontFamily: T.fontSerif, fontSize: 14, color: T.ink }}>
              Снапшот ещё не снят — зачёт не считается.
            </div>
          )}
          <button
            onClick={async () => {
              const again = !!standings?.quarter;
              const msg = again
                ? 'Снапшот уже снят. Снять заново? Стартовые рейтинги всех игроков будут перезаписаны текущими, и зачёт начнётся заново.'
                : 'Зафиксировать текущие рейтинги как стартовые для квартала 1 декабря — 28 февраля?';
              if (!(await tgConfirm(msg))) return;
              try {
                const r = await snapshot.mutateAsync({
                  code: '2026-Q4', start_date: '2026-12-01', end_date: '2027-02-28' });
                alert(`Снапшот снят: ${r.players} игроков`);
              } catch (e) { alert((e as Error).message); }
            }}
            disabled={snapshot.isPending}
            style={{
              marginTop: 10, width: '100%', padding: '10px 14px', borderRadius: 10,
              border: `1px solid ${standings?.quarter ? T.paperEdge : BLUE}`,
              background: standings?.quarter ? 'transparent' : BLUE,
              color: standings?.quarter ? T.muted : '#fff',
              fontFamily: T.fontDisplay, fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            }}
          >{snapshot.isPending ? '…' : standings?.quarter ? 'Снять снапшот заново' : 'Снять снапшот квартала'}</button>
        </div>

        <div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', color: T.muted, marginBottom: 8,
          }}>ВЫГРУЗКА ОТ FCE</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Вставь строки из выгрузки — CSV, таблицу или просто список.\nВ каждой строке нужна почта, имя необязательно.'}
            rows={5}
            style={{
              width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 10,
              border: `1px solid ${T.paperEdge}`, background: '#fff', resize: 'vertical',
              fontFamily: T.fontDisplay, fontSize: 13, color: T.ink, lineHeight: 1.5,
            }}
          />
          <button
            onClick={runImport}
            disabled={doImport.isPending || !text.trim()}
            style={{
              marginTop: 8, width: '100%', padding: '11px 16px', borderRadius: 10,
              border: 'none', background: text.trim() ? BLUE : T.paperEdge, color: '#fff',
              fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 700,
              cursor: text.trim() ? 'pointer' : 'default',
            }}
          >{doImport.isPending ? 'Загружаю…' : 'Загрузить'}</button>
          {report && (
            <div style={{
              marginTop: 10, background: T.cream, border: `1px solid ${T.paperEdge}`,
              borderRadius: 10, padding: 12, fontFamily: T.fontDisplay, fontSize: 13, color: T.ink,
            }}>
              {Object.entries(report).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ color: T.muted }}>{k}</span><b>{v}</b>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vouchers. The club pays the winners' games out of FCE's budget and
            burns them here, so the count of what is still owed is visible. */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <span style={{
              fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', color: T.muted,
            }}>БЕСПЛАТНЫЕ ИГРЫ</span>
            <button
              onClick={async () => {
                if (!(await tgConfirm('Выдать ваучеры за все прошедшие турниры, где их ещё нет?'))) return;
                try {
                  const r = await backfill.mutateAsync(null);
                  alert(`Просмотрено турниров: ${r.tournaments}, выдано: ${r.issued}`);
                } catch (e) { alert((e as Error).message); }
              }}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                fontFamily: T.fontDisplay, fontSize: 12, color: BLUE,
              }}
            >добрать за прошлые турниры</button>
          </div>
          {vouchers && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Stat n={vouchers.counts.active ?? 0} label="можно гасить" accent />
              <Stat n={vouchers.counts.locked ?? 0} label="ждут регистрации" />
              <Stat n={vouchers.counts.redeemed ?? 0} label="погашено" />
            </div>
          )}
          <div style={{
            background: T.cream, border: `1px solid ${T.paperEdge}`, borderRadius: 12,
            overflow: 'hidden',
          }}>
            {(vouchers?.vouchers ?? []).filter((v) => v.state !== 'redeemed').slice(0, 40)
              .map((v) => (
                <VoucherRow key={v.id} v={v} busy={redeem.isPending}
                  onRedeem={async () => {
                    if (!(await tgConfirm(`Погасить игру для ${v.name}? Это действие не отменяется.`))) return;
                    try { await redeem.mutateAsync(v.id); }
                    catch (e) { alert((e as Error).message.replace(/^API \d+: /, '')); }
                  }} />
              ))}
            {(vouchers?.vouchers ?? []).filter((v) => v.state !== 'redeemed').length === 0 && (
              <div style={{ padding: 14, fontFamily: T.fontSerif, fontSize: 13.5, color: T.muted }}>
                Непогашенных игр нет.
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', color: T.muted, marginBottom: 8,
          }}>ТРЕБУЮТ РЕШЕНИЯ {pending.length > 0 && `· ${pending.length}`}</div>
          {isLoading && <Muted>Загружаю…</Muted>}
          {!isLoading && pending.length === 0 && (
            <Muted>Всё разобрано. Строки, которые сошлись по почте, бейдж получили сами.</Muted>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map((row) => (
              <PendingCard
                key={row.row_id}
                row={row}
                busy={resolve.isPending}
                onPick={(pid) => resolve.mutate({ row_id: row.row_id, player_id: pid })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingCard({ row, busy, onPick }: {
  row: FcePendingRow; busy: boolean; onPick: (pid: number | null) => void;
}) {
  return (
    <div style={{
      background: T.cream, border: `1px solid ${T.paperEdge}`, borderRadius: 12, padding: 12,
    }}>
      <div style={{ fontFamily: T.fontSerif, fontSize: 15, fontWeight: 700, color: T.ink }}>
        {row.name || '— без имени —'}
      </div>
      {row.email && (
        <div style={{ fontFamily: T.fontDisplay, fontSize: 12.5, color: BLUE, marginTop: 2 }}>
          {row.email}
        </div>
      )}
      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {row.candidates.length === 0 && (
          <span style={{ fontFamily: T.fontSerif, fontSize: 13, color: T.muted }}>
            Похожих игроков не нашлось
          </span>
        )}
        {row.candidates.map((c) => (
          <button
            key={c.id}
            disabled={busy}
            onClick={() => onPick(c.id)}
            style={{
              padding: '7px 11px', borderRadius: 999, cursor: 'pointer',
              border: `1px solid ${BLUE}55`, background: '#fff', color: T.ink,
              fontFamily: T.fontDisplay, fontSize: 13,
            }}
          >{c.name} <span style={{ color: T.muted }}>· {c.level}</span></button>
        ))}
        <button
          disabled={busy}
          onClick={() => onPick(null)}
          style={{
            padding: '7px 11px', borderRadius: 999, cursor: 'pointer',
            border: `1px solid ${T.paperEdge}`, background: 'transparent', color: T.muted,
            fontFamily: T.fontDisplay, fontSize: 13,
          }}
        >не наш игрок</button>
      </div>
    </div>
  );
}

function Stat({ n, label, accent }: { n: number; label: string; accent?: boolean }) {
  return (
    <div style={{
      flex: 1, background: accent ? '#e8f0fe' : T.cream, borderRadius: 10,
      border: `1px solid ${accent ? `${BLUE}44` : T.paperEdge}`, padding: '10px 6px',
      textAlign: 'center',
    }}>
      <div style={{ fontFamily: T.fontSerif, fontSize: 20, fontWeight: 700,
                    color: accent ? BLUE : T.ink }}>{n}</div>
      <div style={{ fontFamily: T.fontDisplay, fontSize: 9.5, letterSpacing: '0.06em',
                    color: T.muted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: T.fontSerif, fontSize: 13.5, color: T.muted, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}


function VoucherRow({ v, busy, onRedeem }: {
  v: FceVoucher; busy: boolean; onRedeem: () => void;
}) {
  const locked = v.state === 'locked';
  const expired = v.state === 'expired';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
      borderTop: `1px solid ${T.paperEdge}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: T.fontSerif, fontSize: 14.5, color: expired ? T.muted : T.ink,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{v.name}</div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 11, color: T.muted }}>
          {v.tournament ?? 'турнир'} · до {v.expires_at}
          {locked && <span style={{ color: '#9a3b3b' }}> · нет регистрации</span>}
          {expired && <span> · просрочен</span>}
        </div>
      </div>
      <button
        onClick={onRedeem}
        disabled={busy || locked || expired}
        style={{
          padding: '7px 13px', borderRadius: 999, flexShrink: 0,
          border: `1px solid ${locked || expired ? T.paperEdge : BLUE}`,
          background: locked || expired ? 'transparent' : BLUE,
          color: locked || expired ? T.muted : '#fff',
          fontFamily: T.fontDisplay, fontSize: 12.5, fontWeight: 700,
          cursor: locked || expired ? 'default' : 'pointer',
        }}
      >Погасить</button>
    </div>
  );
}
