import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { T } from '../lib/tokens';

interface State { linked_count: number; total_count: number; sent_count: number }
interface Report { queued: number; ok: number; failed: { name: string; reason: string }[] }

// Admin sends the round's line-up to every linked player: one rendered image
// of the whole round plus a personal caption ("you are on court 2, with X").
// Like the results send, delivery happens in the background, so we poll the
// real state instead of trusting the queued count.
export function NotifyRoundModal({ tid, roundNum, onClose }: {
  tid: number; roundNum: number; onClose: () => void;
}) {
  const [info, setInfo] = useState<State | null>(null);
  const [step, setStep] = useState<'loading' | 'confirm' | 'sending' | 'done'>('loading');
  const [result, setResult] = useState<string | null>(null);

  const url = `/api/tournaments/${tid}/rounds/${roundNum}/notify`;

  useEffect(() => {
    let cancelled = false;
    api<State>(url)
      .then((d) => { if (!cancelled) { setInfo(d); setStep('confirm'); } })
      .catch((e) => { if (!cancelled) { setResult('Ошибка: ' + (e as Error).message); setStep('done'); } });
    return () => { cancelled = true; };
  }, [url]);

  const send = async () => {
    setStep('sending');
    try {
      const r = await api<{ sent: number }>(url, { method: 'POST' });
      if (r.sent === 0) {
        setResult('Все уже получили расписание.');
        setStep('done');
        return;
      }
      for (let i = 0; i < 30; i++) {
        await new Promise((res) => setTimeout(res, 2000));
        const d = await api<State & { report: Report | null }>(url);
        if (d.report) {
          let msg = `Доставлено ${d.report.ok} из ${d.report.queued}`;
          if (d.report.failed.length) {
            msg += `\nНе дошло: ${d.report.failed.length}`
              + `\nПричина: ${d.report.failed[0].reason}`;
          }
          setResult(msg);
          setStep('done');
          return;
        }
      }
      setResult('Отправка ещё идёт — загляни сюда позже.');
    } catch (e) {
      setResult('Ошибка: ' + (e as Error).message);
    }
    setStep('done');
  };

  const btn = (label: string, onClick: () => void, primary = true) => (
    <button onClick={onClick} style={{
      flex: 1, padding: '12px', borderRadius: 999,
      border: primary ? 'none' : `1px solid ${T.paperEdge}`, cursor: 'pointer',
      background: primary ? T.emerald : 'transparent',
      color: primary ? T.cream : T.muted,
      fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600,
    }}>{label}</button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(31,42,36,0.55)' }} />
      <div style={{
        position: 'relative', margin: 'auto', width: '100%', maxWidth: 360,
        background: T.cream, border: `1px solid ${T.paperEdge}`, borderRadius: 18, padding: '22px 20px',
      }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 12 }}>
          Расписание раунда {roundNum}
        </div>
        {step === 'loading' && (
          <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', color: T.muted }}>…</div>
        )}
        {step === 'confirm' && (
          <>
            <div style={{ fontFamily: T.fontSerif, fontSize: 14, color: T.ink, marginBottom: 14 }}>
              Отправить расписание {info?.linked_count ?? 0} привязанным игрокам
              {info && info.total_count > info.linked_count
                ? ` (из ${info.total_count} на кортах)` : ''}?
              {info && info.sent_count > 0
                ? ` Уже получили: ${info.sent_count}.` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {btn('Отправить', send)}
              {btn('Отмена', onClose, false)}
            </div>
          </>
        )}
        {step === 'sending' && (
          <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', color: T.muted }}>Отправляю…</div>
        )}
        {step === 'done' && (
          <>
            <div style={{
              fontFamily: T.fontSerif, fontSize: 14, color: T.ink, marginBottom: 14,
              whiteSpace: 'pre-line',
            }}>{result}</div>
            {btn('OK', onClose, false)}
          </>
        )}
      </div>
    </div>
  );
}
