import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { T } from '../lib/tokens';
import { useT } from '../lib/i18n';

// Phase 4: admin sends personal result cards to linked players' DMs.
// Preview (linked/total) → confirm → send → report.
export function SendResultsModal({ tid, onClose }: { tid: number; onClose: () => void }) {
  const t = useT();
  const [info, setInfo] = useState<{ linked: number; total: number } | null>(null);
  const [step, setStep] = useState<'loading' | 'confirm' | 'sending' | 'done'>('loading');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ linked_count: number; total_count: number }>(`/api/tournaments/${tid}/cards`)
      .then((d) => { if (!cancelled) { setInfo({ linked: d.linked_count, total: d.total_count }); setStep('confirm'); } })
      .catch((e) => { if (!cancelled) { setResult(t('common.error') + ': ' + (e as Error).message); setStep('done'); } });
    return () => { cancelled = true; };
  }, [tid, t]);

  // Sending renders and DMs in the background, so the POST only tells us how
  // many were queued. Poll the real delivery state instead — reporting the
  // queued count as success is what hid five weeks of broken rendering.
  const send = async () => {
    setStep('sending');
    try {
      const r = await api<{ sent: number; podium: number }>(
        `/api/tournaments/${tid}/cards/send`, { method: 'POST' });
      // Two messages go to each player: the personal card and the podium.
      const queued = r.sent + (r.podium ?? 0);
      if (queued === 0) {
        setResult(t('td.sent', { n: 0 }));
        setStep('done');
        return;
      }
      for (let i = 0; i < 30; i++) {
        await new Promise((res) => setTimeout(res, 2000));
        const d = await api<{
          sent_count: number; linked_count: number;
          report: { queued: number; ok: number; failed: { name: string; reason: string }[] } | null;
        }>(`/api/tournaments/${tid}/cards`);
        if (d.report) {
          let msg = t('td.sentOf', { n: d.report.ok, total: d.report.queued });
          if (d.report.failed.length) {
            msg += t('td.failed', { k: d.report.failed.length })
              + '\n' + t('td.sendReason', { r: d.report.failed[0].reason });
          }
          setResult(msg);
          setStep('done');
          return;
        }
      }
      setResult(t('td.sendSlow'));
    } catch (e) {
      setResult(t('common.error') + ': ' + (e as Error).message);
    }
    setStep('done');
  };

  const btn = (label: string, onClick: () => void, primary = true) => (
    <button onClick={onClick} style={{
      flex: 1, padding: '12px', borderRadius: 999, border: primary ? 'none' : `1px solid ${T.paperEdge}`,
      cursor: 'pointer', background: primary ? T.emerald : 'transparent',
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
          {t('td.sendResults').replace('📤 ', '')}
        </div>
        {step === 'loading' && (
          <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', color: T.muted }}>…</div>
        )}
        {step === 'confirm' && (
          <>
            <div style={{ fontFamily: T.fontSerif, fontSize: 14, color: T.ink, marginBottom: 14 }}>
              {t('td.sendConfirm', { n: info?.linked ?? 0, total: info?.total ?? 0 })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {btn(t('common.send'), send)}
              {btn(t('common.cancel'), onClose, false)}
            </div>
          </>
        )}
        {step === 'sending' && (
          <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', color: T.muted }}>{t('td.sending')}</div>
        )}
        {step === 'done' && (
          <>
            <div style={{
              fontFamily: T.fontSerif, fontSize: 14, color: T.ink, marginBottom: 14,
              whiteSpace: 'pre-line',  // the failure reason is appended on its own line
            }}>{result}</div>
            {btn(t('common.ok'), onClose, false)}
          </>
        )}
      </div>
    </div>
  );
}
