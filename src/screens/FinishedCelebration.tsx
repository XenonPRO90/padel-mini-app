import { useRef, useState } from 'react';
import { T } from '../lib/tokens';
import { LevelBadge } from '../components/Badges';
import { MainCTA, SecondaryCTA } from '../components/MainCTA';
import { Label } from '../components/CourtCard';
import type { ScoredPlayer, Tournament } from '../lib/types';

interface Props {
  tournament: Tournament;
  leaderboard: ScoredPlayer[];
  onClose: () => void;
  onShareText?: () => void;
}

export function FinishedCelebration({ tournament: t, leaderboard, onClose, onShareText }: Props) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  // Build "place" — handles ties (Roman 11, Jose & Georgii both 10 → both "2")
  const ranked: { place: number; p: ScoredPlayer }[] = [];
  let lastPts = -1;
  let placeNum = 0;
  let seen = 0;
  for (const p of leaderboard) {
    seen += 1;
    if (p.points !== lastPts) {
      placeNum = seen;
      lastPts = p.points;
    }
    ranked.push({ place: placeNum, p });
  }

  const onSharePoster = async () => {
    if (!posterRef.current) return;
    setBusy(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: T.bg,
        scale: 2,
        useCORS: true,
      });
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      );
      if (!blob) throw new Error('Could not encode poster');
      const file = new File([blob], `${t.name.replace(/[^\w]+/g, '_')}.png`, { type: 'image/png' });

      // Try Web Share API with file (works on iOS Safari, modern Chrome)
      const navAny = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean; share?: (data: { files: File[]; title?: string }) => Promise<void> };
      if (navAny.canShare?.({ files: [file] }) && navAny.share) {
        await navAny.share({ files: [file], title: t.name });
      } else {
        // Fallback: download the image so user can attach it manually
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${t.name.replace(/[^\w]+/g, '_')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (e) {
      // user cancelled share, or error — surface real errors
      const msg = (e as Error).message;
      if (msg && !msg.toLowerCase().includes('aborted') && !msg.toLowerCase().includes('canceled')) {
        alert(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      background: T.bg,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Poster — captured by html2canvas */}
      <div ref={posterRef} style={{
        background: `radial-gradient(ellipse at top, ${T.accent}18 0%, ${T.bg} 60%), ${T.bg}`,
        padding: '24px 20px 24px',
        position: 'relative',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ ...Label(), color: T.accent, marginBottom: 8 }}>🏆 TOURNAMENT COMPLETE 🏆</div>
          <div style={{
            fontSize: 26, fontWeight: 800, color: T.textPrimary,
            letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>{t.name}</div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 12,
          }}>
            <span style={{ flex: 1, height: 1, background: T.border, maxWidth: 80 }} />
            <span style={{ fontSize: 22 }}>🎾</span>
            <span style={{ flex: 1, height: 1, background: T.border, maxWidth: 80 }} />
          </div>
        </div>

        {/* Standings */}
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 18,
          padding: '4px 16px',
        }}>
          {ranked.map((row, i) => {
            const { place, p } = row;
            const isGold = place === 1;
            const isSilver = place === 2;
            const isBronze = place === 3;
            const isPodium = place <= 3;
            const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : `${place}.`;
            return (
              <div key={p.player_id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 0',
                borderBottom: i < ranked.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <div style={{
                  width: 36, textAlign: 'center', fontSize: isPodium ? 22 : 14,
                  fontWeight: 700, color:
                    isGold ? T.accent :
                    isSilver ? '#C7CDD3' :
                    isBronze ? '#D49764' : T.textMuted,
                  fontVariantNumeric: 'tabular-nums',
                }}>{medal}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: isPodium ? 17 : 15,
                    fontWeight: isPodium ? 700 : 500,
                    color: isGold ? T.accent : T.textPrimary,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{p.name}</div>
                </div>
                <LevelBadge level={p.level} size="sm" />
                <div style={{ textAlign: 'right', minWidth: 56 }}>
                  <div style={{
                    fontSize: isPodium ? 22 : 16,
                    fontWeight: 700,
                    color: isGold ? T.accent : T.textPrimary,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{p.points}<span style={{ fontSize: 11, color: T.textDim, fontWeight: 500 }}> pts</span></div>
                  <div style={{
                    fontSize: 11, color: T.textDim, marginTop: 4,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    <span style={{ color: T.accent }}>✓{p.wins}</span>
                    <span style={{ marginLeft: 6, color: T.loss }}>✗{p.losses}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          textAlign: 'center', marginTop: 20,
          fontSize: 11, color: T.textDim, letterSpacing: '0.16em',
        }}>· PADEL CLAUB · KING OF THE COURT ·</div>
      </div>

      {/* Action buttons — outside the poster region */}
      <div style={{ flex: 1 }} />

      <div style={{
        padding: '8px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)',
        background: T.bg, borderTop: `1px solid ${T.border}`,
        position: 'sticky', bottom: 0, zIndex: 2,
      }}>
        <MainCTA
          label={busy ? 'GENERATING…' : 'SHARE POSTER'}
          disabled={busy}
          onClick={onSharePoster}
        />
        {onShareText && (
          <>
            <div style={{ height: 8 }} />
            <SecondaryCTA label="SHARE AS TEXT" onClick={onShareText} />
          </>
        )}
        <div style={{ height: 8 }} />
        <SecondaryCTA label="BACK TO HOME" onClick={onClose} />
      </div>
    </div>
  );
}
