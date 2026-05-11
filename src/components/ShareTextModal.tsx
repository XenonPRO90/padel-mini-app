import { useEffect, useRef, useState } from 'react';
import { T } from '../lib/tokens';
import { MainCTA, SecondaryCTA } from './MainCTA';
import { Label } from './CourtCard';

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

  // Pre-select the text so the user can hit "Copy" from the native menu
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
    // Legacy fallback (deprecated but still works inside iOS Telegram)
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
    // Last resort — user copies manually from selection
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: T.surface2, borderTopLeftRadius: 20, borderTopRightRadius: 20,
          padding: '14px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)',
          display: 'flex', flexDirection: 'column', gap: 12,
          maxHeight: '85vh',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border }} />
        </div>
        <div style={{ ...Label() }}>SHARE AS TEXT · ВЫДЕЛИТЕ И СКОПИРУЙТЕ</div>
        <textarea
          ref={taRef}
          readOnly
          value={text}
          style={{
            width: '100%', minHeight: 200, resize: 'none',
            background: T.bg, color: T.textPrimary,
            border: `1px solid ${T.border}`, borderRadius: 12,
            padding: 12, fontSize: 13, lineHeight: 1.5,
            fontFamily: 'inherit', outline: 'none',
          }}
        />
        <MainCTA label={copied ? '✓ COPIED' : 'COPY TO CLIPBOARD'} onClick={tryCopy} />
        <SecondaryCTA label="CLOSE" onClick={onClose} />
      </div>
    </div>
  );
}
