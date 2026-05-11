import { useEffect, useRef, useState } from 'react';
import { T } from '../lib/tokens';
import { EBtn, ELabel } from '../lib/elegant';

interface Props {
  text: string;
  onClose: () => void;
}

/** Modal that shows the text in a textarea for manual selection / copy.
 * Used as a fallback when navigator.clipboard.writeText is blocked
 * (Telegram in-app WebView on iOS) and openTelegramLink isn't available. */
export function ShareTextModal({ text, onClose }: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTimeout(() => taRef.current?.select(), 80);
  }, []);

  const tryCopy = async () => {
    const txt = taRef.current?.value ?? text;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(txt);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        return;
      }
    } catch { /* fall through */ }
    try {
      taRef.current?.focus();
      taRef.current?.select();
      const ok = document.execCommand?.('copy');
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        return;
      }
    } catch { /* nothing to do */ }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(31,42,36,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: T.paper,
          borderTop: `1px solid ${T.rule}`,
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          padding: '14px 18px calc(env(safe-area-inset-bottom, 0px) + 18px)',
          display: 'flex', flexDirection: 'column', gap: 12,
          maxHeight: '85vh',
          boxShadow: '0 -20px 40px -20px rgba(31,42,36,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.rule, opacity: 0.6 }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <ELabel>SHARE AS TEXT · ВЫДЕЛИТЕ И СКОПИРУЙТЕ</ELabel>
        </div>
        <textarea
          ref={taRef}
          readOnly
          value={text}
          style={{
            width: '100%', minHeight: 220, resize: 'none',
            background: T.cream, color: T.ink,
            border: `1px solid ${T.paperEdge}`, borderRadius: 12,
            padding: 14, fontSize: 13, lineHeight: 1.6,
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            outline: 'none',
          }}
        />
        <EBtn kind="gold" onClick={tryCopy} style={{ width: '100%' }}>
          {copied ? '✓ Copied' : 'Copy text'}
        </EBtn>
        <EBtn kind="ghost" onClick={onClose} style={{ width: '100%' }}>Close</EBtn>
      </div>
    </div>
  );
}
