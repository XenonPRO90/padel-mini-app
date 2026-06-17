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

  const send = async () => {
    setStep('sending');
    try {
      const r = await api<{ sent: number; failed: { name: string; reason: string }[] }>(
        `/api/tournaments/${tid}/cards/send`, { method: 'POST' });
      setResult(t('td.sent', { n: r.sent }) + (r.failed.length ? t('td.failed', { k: r.failed.length }) : ''));
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
            <div style={{ fontFamily: T.fontSerif, fontSize: 14, color: T.ink, marginBottom: 14 }}>{result}</div>
            {btn(t('common.ok'), onClose, false)}
          </>
        )}
      </div>
    </div>
  );
}
