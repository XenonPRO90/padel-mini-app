import { useEffect } from 'react';
import { T } from '../lib/tokens';

// Tap a player's photo to see it bigger (Roman, 2026-11-23).
//
// Telegram only serves this avatar at 320px — asking the same URL for 640
// returns 404 — so the view is deliberately capped rather than stretched to
// the full screen, which would just magnify the softness.
export function PhotoLightbox({ src, alt, onClose }: {
  src: string; alt: string; onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(20,24,21,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        // Telegram's WebView zooms on a double tap and selects whatever sits
        // under the finger; neither helps when you just want the photo closed.
        touchAction: 'manipulation', WebkitUserSelect: 'none', userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(78vw, 320px)', height: 'min(78vw, 320px)',
            borderRadius: '50%', objectFit: 'cover', display: 'block',
            border: `2px solid ${T.goldSoft}`,
            boxShadow: '0 18px 50px -12px rgba(0,0,0,0.6)',
          }}
        />
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 600,
          color: T.cream, letterSpacing: 0.4, textAlign: 'center',
        }}>{alt}</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 9, letterSpacing: 2.4,
          textTransform: 'uppercase', color: T.goldSoft, opacity: 0.8,
        }}>tap to close</div>
      </div>
    </div>
  );
}
