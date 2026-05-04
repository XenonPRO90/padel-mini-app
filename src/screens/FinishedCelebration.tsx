import { useRef, useState } from 'react';
import { T } from '../lib/tokens';
import { LevelBadge } from '../components/Badges';
import { Ring } from '../components/Ring';
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
  // posterRef wraps just the visual content we want in the PNG
  const posterRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  // Compute place numbers with proper tie handling
  // (e.g. Roma 11 → #1, Jose 10 + Georgii 10 → both #2, next → #4)
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

  const top3 = ranked.filter((r) => r.place <= 3);
  const rest = ranked.filter((r) => r.place > 3);

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

      const navAny = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files: File[]; title?: string }) => Promise<void>;
      };
      if (navAny.canShare?.({ files: [file] }) && navAny.share) {
        await navAny.share({ files: [file], title: t.name });
      } else {
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
      const msg = (e as Error).message || '';
      if (!msg.toLowerCase().includes('aborted') && !msg.toLowerCase().includes('canceled')) {
        alert(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.bg }}>
      {/* Scrollable region — content can be longer than viewport */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div ref={posterRef} style={{
          background: `radial-gradient(ellipse at top, ${T.accent}18 0%, ${T.bg} 60%), ${T.bg}`,
          padding: '20px 16px 20px',
          position: 'relative',
        }}>
          {/* Subtle confetti — only top 200px, won't dominate poster */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 220,
            overflow: 'hidden', pointerEvents: 'none',
          }}>
            {Array.from({ length: 12 }).map((_, i) => {
              const left = (i * 53) % 100;
              const colors = [T.accent, T.warn, '#FFD24A', T.accentDim];
              return (
                <div key={i} style={{
                  position: 'absolute', left: `${left}%`, top: -16,
                  width: 5, height: 9, background: colors[i % colors.length],
                  animation: `confettiFall ${3 + (i % 4) * 0.6}s linear ${i * 0.2}s infinite`,
                  borderRadius: 1,
                }} />
              );
            })}
          </div>

          {/* Title + ring */}
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, marginBottom: 8 }}>
            <div style={{ ...Label(), color: T.accent, marginBottom: 6 }}>🏆 TOURNAMENT COMPLETE 🏆</div>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{t.name}</div>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'center',
            padding: '10px 0 12px', position: 'relative', zIndex: 1,
          }}>
            <Ring size={170} stroke={9} value={1} max={1}>
              <div style={{ fontSize: 44, fontWeight: 700, color: T.accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                100<span style={{ fontSize: 22, color: T.textDim }}>%</span>
              </div>
              <div style={{ ...Label(), marginTop: 4 }}>COMPLETE</div>
            </Ring>
          </div>

          {/* Top-3 podium cards */}
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column', gap: 8,
            margin: '4px 0 12px',
          }}>
            {top3.map(({ place, p }) => {
              const isGold = place === 1;
              const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';
              return (
                <div key={p.player_id} style={{
                  background: isGold ? `${T.accent}10` : T.surface,
                  border: `1px solid ${isGold ? T.accent : T.border}`,
                  borderRadius: 14, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 26, lineHeight: 1 }}>{medal}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 17, fontWeight: 700,
                      color: isGold ? T.accent : T.textPrimary,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                      <LevelBadge level={p.level} size="sm" />
                      <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ color: T.accent }}>✓{p.wins}</span>
                        <span style={{ marginLeft: 6, color: T.loss }}>✗{p.losses}</span>
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 26, fontWeight: 700, lineHeight: 1,
                      color: isGold ? T.accent : T.textPrimary,
                      fontVariantNumeric: 'tabular-nums',
                    }}>{p.points}</div>
                    <div style={{ ...Label(), fontSize: 9, marginTop: 4 }}>PTS</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rest of standings — compact list */}
          {rest.length > 0 && (
            <div style={{
              position: 'relative', zIndex: 1,
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: '4px 14px',
            }}>
              {rest.map(({ place, p }, i) => (
                <div key={p.player_id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 0',
                  borderBottom: i < rest.length - 1 ? `1px solid ${T.border}` : 'none',
                }}>
                  <span style={{
                    width: 22, fontSize: 12, fontWeight: 700, color: T.textDim,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{place}.</span>
                  <span style={{
                    flex: 1, fontSize: 14, fontWeight: 500,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{p.name}</span>
                  <LevelBadge level={p.level} size="sm" />
                  <span style={{
                    fontSize: 14, fontWeight: 700, color: T.textPrimary,
                    minWidth: 28, textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}>{p.points}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{
            position: 'relative', zIndex: 1,
            textAlign: 'center', marginTop: 14,
            fontSize: 10, color: T.textDim, letterSpacing: '0.16em',
          }}>· PADEL CLAUB · KING OF THE COURT ·</div>
        </div>
      </div>

      {/* Sticky bottom action bar — always visible */}
      <div style={{
        flexShrink: 0,
        padding: '8px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)',
        background: T.bg, borderTop: `1px solid ${T.border}`,
      }}>
        <MainCTA
          label={busy ? 'GENERATING POSTER…' : '📸 SHARE POSTER'}
          disabled={busy}
          onClick={onSharePoster}
        />
        <div style={{ height: 8 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {onShareText && (
            <div style={{ flex: 1 }}>
              <SecondaryCTA label="AS TEXT" onClick={onShareText} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <SecondaryCTA label="HOME" onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}
