import { useRef, useState } from 'react';
import { T } from '../lib/tokens';
import { MainCTA, SecondaryCTA } from '../components/MainCTA';
import { ETrophy } from '../lib/elegant';
import type { ScoredPair, ScoredPlayer, Tournament } from '../lib/types';

interface Props {
  tournament: Tournament;
  leaderboard: ScoredPlayer[];
  pairLeaderboard?: ScoredPair[];
  onClose: () => void;
  onShareText?: () => void;
}

// Unified row shape so the dense-ranking loop works the same for
// per-player and per-pair leaderboards.
interface PosterRow {
  key: string;
  name: string;
  points: number;
  wins: number;
  losses: number;
}

// ── Poster palette (separate from Mini App's dark theme — premium tournament look)
const P = {
  bg: '#F4ECDA',          // warm cream
  bgGradient: '#FBF6E9',
  card: '#FFFFFF',
  cardBorder: '#E5D7B7',
  divider: '#D9C495',
  textPrimary: '#1F2D24',  // dark forest green
  textMuted: '#6E5E3D',
  textDim: '#998760',
  accentGold: '#B68838',
  accentGoldSoft: '#D9B863',
  win: '#4A7A3F',
  loss: '#B14545',
  serif: '"New York", "Cormorant Garamond", Georgia, "Times New Roman", serif',
};

export function FinishedCelebration({ tournament: t, leaderboard, pairLeaderboard, onClose, onShareText }: Props) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  // For pair-based tournaments (fixed, americano, groups8) collapse partners
  // into one row — otherwise both members of the winning pair get their own
  // gold medal which is semantically wrong (it's one pair sharing the place).
  const rows: PosterRow[] = pairLeaderboard?.length
    ? pairLeaderboard.map((pair, i) => ({
        key: `pair-${i}`,
        name: `${pair.name_a} & ${pair.name_b}`,
        points: pair.points,
        wins: pair.wins,
        losses: pair.losses,
      }))
    : leaderboard.map((p) => ({
        key: `p-${p.player_id}`,
        name: p.name,
        points: p.points,
        wins: p.wins,
        losses: p.losses,
      }));

  // Dense ranking with tiebreaker on wins.
  const ranked: { place: number; row: PosterRow }[] = [];
  let lastPts = -1;
  let lastWins = -1;
  let placeNum = 0;
  for (const r of rows) {
    if (r.points !== lastPts || r.wins !== lastWins) {
      placeNum += 1;
      lastPts = r.points;
      lastWins = r.wins;
    }
    ranked.push({ place: placeNum, row: r });
  }

  // Parse name into "PADEL MASTERS" (main) + "WITH JOSE IN PAUS" (subtitle) + date
  // Convention: "PADEL MASTERS WITH JOSE IN PAUS 04.05.2026"
  // Heuristic: trailing date pattern, plus we split off "PADEL MASTERS" if present.
  const parsedTitle = parseTitle(t.name);

  const onSharePoster = async () => {
    if (!posterRef.current) return;
    setBusy(true);
    try {
      // Wait for any pending fonts to settle so they capture cleanly
      if (document.fonts && (document.fonts as { ready?: Promise<unknown> }).ready) {
        try { await (document.fonts as { ready: Promise<unknown> }).ready; } catch { /* noop */ }
      }
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: P.bg,
        scale: 3,
        useCORS: true,
      });
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png', 0.95),
      );
      if (!blob) throw new Error('Could not encode poster');
      const filename = `${(parsedTitle.main + '_' + parsedTitle.date).replace(/[^\w]+/g, '_')}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

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
        a.download = filename;
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.cream }}>
      {/* Scrollable poster region */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 16px' }}>
        <div ref={posterRef} style={{
          width: '100%',
          background: `linear-gradient(180deg, ${P.bgGradient} 0%, ${P.bg} 100%)`,
          borderRadius: 18,
          padding: '28px 22px 24px',
          fontFamily: P.serif,
          color: P.textPrimary,
          position: 'relative',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}>
          {/* Corner decorations */}
          <CornerLeaves position="tl" />
          <CornerLeaves position="tr" />
          <CornerLeaves position="bl" />
          <CornerLeaves position="br" />

          {/* Crown + crossed rackets */}
          <CrossedRackets />

          {/* Trophy + title row */}
          <div style={{
            textAlign: 'center', marginTop: 14, marginBottom: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <ETrophy size={22} color={P.accentGold} />
            <span style={{
              fontFamily: P.serif, fontSize: 18, fontWeight: 600,
              letterSpacing: '0.04em', color: P.textPrimary,
            }}>ТУРНИР ЗАВЕРШЁН</span>
            <ETrophy size={22} color={P.accentGold} />
          </div>

          {/* Decorative dot divider */}
          <DotDivider color={P.accentGold} />

          {/* Tournament title — big serif */}
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <div style={{
              fontFamily: P.serif, fontSize: 32, fontWeight: 600,
              letterSpacing: '0.06em', color: P.textPrimary, lineHeight: 1.05,
            }}>{parsedTitle.main}</div>
            {parsedTitle.subtitle && (
              <div style={{
                marginTop: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <span style={{ flex: '0 1 32px', height: 1, background: P.accentGold, opacity: 0.5 }} />
                <span style={{
                  fontFamily: P.serif, fontStyle: 'italic',
                  fontSize: 13, letterSpacing: '0.18em',
                  color: P.accentGold, fontWeight: 500,
                }}>{parsedTitle.subtitle}</span>
                <span style={{ flex: '0 1 32px', height: 1, background: P.accentGold, opacity: 0.5 }} />
              </div>
            )}
            {parsedTitle.date && (
              <div style={{
                marginTop: 10,
                fontFamily: P.serif, fontSize: 14,
                letterSpacing: '0.32em', color: P.textMuted,
              }}>· {parsedTitle.date} ·</div>
            )}
          </div>

          {/* Ornament between header and table */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0 14px' }}>
            <Sprig />
          </div>

          {/* Standings card */}
          <div style={{
            background: P.card,
            border: `1px solid ${P.cardBorder}`,
            borderRadius: 14,
            padding: '6px 14px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            {ranked.map(({ place, row }, i) => {
              const isPodium = place <= 3;
              return (
                <div key={row.key} style={{
                  display: 'grid',
                  gridTemplateColumns: '36px minmax(0, 1fr) auto',
                  alignItems: 'center', columnGap: 12, rowGap: 2,
                  padding: isPodium ? '12px 0' : '9px 0',
                  borderBottom: i < ranked.length - 1 ? `1px solid ${P.cardBorder}` : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignSelf: 'start', paddingTop: 4 }}>
                    {place === 1 && <Medal kind="gold" />}
                    {place === 2 && <Medal kind="silver" />}
                    {place === 3 && <Medal kind="bronze" />}
                    {place > 3 && (
                      <span style={{
                        fontFamily: P.serif, fontSize: 16, fontWeight: 500,
                        color: P.textMuted, fontVariantNumeric: 'tabular-nums',
                      }}>{place}.</span>
                    )}
                  </div>
                  {/* Name — wraps to 2 lines for fixed-pair "A & B" labels. */}
                  <div style={{
                    fontFamily: P.serif,
                    fontSize: isPodium ? 20 : 16,
                    fontWeight: isPodium ? 600 : 500,
                    color: P.textPrimary, lineHeight: 1.25,
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}>{row.name}</div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    justifySelf: 'end', whiteSpace: 'nowrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{
                        fontFamily: P.serif,
                        fontSize: isPodium ? 24 : 18,
                        fontWeight: 600,
                        color: P.accentGold, lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}>{row.points}</span>
                      <span style={{
                        fontFamily: P.serif, fontSize: 12, fontStyle: 'italic',
                        color: P.textMuted,
                      }}>pts</span>
                    </div>
                    <div style={{ width: 1, height: 22, background: P.divider, opacity: 0.6 }} />
                    <div style={{
                      fontFamily: P.serif, fontSize: 13, color: P.textMuted,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      <span style={{ color: P.win, fontWeight: 600 }}>W{row.wins}</span>
                      <span style={{ marginLeft: 6, color: P.loss, fontWeight: 600 }}>L{row.losses}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tennis ball footer */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
            <TennisBall />
          </div>
        </div>
      </div>

      {/* Sticky bottom action bar.
          Primary = Save Poster (PNG via navigator.share / download).
          Secondary left = As Text (standings table in a copy modal).
          Secondary right = Home.
          The previous "Send to Chat" experiment used openTelegramLink
          but on iOS Telegram WebView the link opened web.telegram.org
          in a separate tab instead of the native chat picker — so we
          revert to the poster-image flow as the primary action. */}
      <div style={{
        flexShrink: 0,
        padding: '8px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)',
        background: T.cream, borderTop: `1px solid ${T.paperEdge}`,
      }}>
        <MainCTA
          label={
            <>
              {busy ? null : <CameraIcon size={18} />}
              <span>{busy ? 'Generating poster…' : 'Save poster'}</span>
            </>
          }
          disabled={busy}
          onClick={onSharePoster}
        />
        <div style={{ height: 8 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {onShareText && (
            <div style={{ flex: 1 }}>
              <SecondaryCTA label="As text" onClick={onShareText} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <SecondaryCTA label="Home" onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 8 H8 L10 6 H14 L16 8 H19 V18 H5 Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"
      />
      <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────

function parseTitle(name: string): { main: string; subtitle: string; date: string } {
  // Try to extract trailing date like "04.05.2026" or "04.05" or "29.04"
  const dateMatch = name.match(/(\d{1,2}\.\d{1,2}(?:\.\d{2,4})?)\s*$/);
  const date = dateMatch ? dateMatch[1] : '';
  const withoutDate = (dateMatch ? name.slice(0, dateMatch.index).trim() : name).replace(/[·•—–-]+$/, '').trim();

  // Split into "PADEL MASTERS" + rest if present
  const idx = withoutDate.toUpperCase().indexOf('PADEL MASTERS');
  if (idx === 0) {
    const rest = withoutDate.slice('PADEL MASTERS'.length).trim();
    return { main: 'PADEL MASTERS', subtitle: rest.toUpperCase(), date };
  }
  return { main: withoutDate.toUpperCase(), subtitle: '', date };
}

function CrossedRackets() {
  // Crown above two crossed tennis rackets, golden tones
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
      <svg width="140" height="100" viewBox="0 0 140 100" fill="none">
        {/* Crown */}
        <g transform="translate(70 0)">
          <path d="M-12 14 L-8 4 L-4 12 L0 2 L4 12 L8 4 L12 14 Z" fill="#C8A24A" stroke="#8E6826" strokeWidth="0.7" strokeLinejoin="round" />
          <circle cx="-12" cy="4" r="1.6" fill="#8E6826" />
          <circle cx="0" cy="2" r="1.6" fill="#8E6826" />
          <circle cx="12" cy="4" r="1.6" fill="#8E6826" />
        </g>
        {/* Left racket */}
        <g transform="translate(70 50) rotate(-30)">
          <Racket />
        </g>
        {/* Right racket */}
        <g transform="translate(70 50) rotate(30)">
          <Racket />
        </g>
        {/* Laurel sprigs */}
        <Laurel side="left" />
        <Laurel side="right" />
      </svg>
    </div>
  );
}

function Racket() {
  return (
    <g>
      {/* Frame */}
      <ellipse cx="0" cy="-22" rx="13" ry="18" fill="#FAEFD5" stroke="#8E6826" strokeWidth="1.6" />
      {/* String pattern */}
      <g stroke="#8E6826" strokeWidth="0.5" opacity="0.55">
        <line x1="-10" y1="-22" x2="10" y2="-22" />
        <line x1="-10" y1="-28" x2="10" y2="-28" />
        <line x1="-10" y1="-16" x2="10" y2="-16" />
        <line x1="-10" y1="-10" x2="10" y2="-10" />
        <line x1="-10" y1="-34" x2="10" y2="-34" />
        <line x1="0" y1="-40" x2="0" y2="-4" />
        <line x1="-6" y1="-40" x2="-6" y2="-4" />
        <line x1="6" y1="-40" x2="6" y2="-4" />
      </g>
      {/* Handle */}
      <rect x="-2" y="-4" width="4" height="22" rx="1.5" fill="#8E6826" />
      <rect x="-3" y="14" width="6" height="6" rx="1" fill="#5C4513" />
    </g>
  );
}

function Laurel({ side }: { side: 'left' | 'right' }) {
  const flip = side === 'right' ? 'scale(-1 1)' : '';
  return (
    <g transform={`translate(${side === 'left' ? 18 : 122} 78) ${flip}`}>
      {[-12, -6, 0, 6].map((y, i) => (
        <g key={i} transform={`translate(0 ${y}) rotate(-25)`}>
          <ellipse cx="0" cy="0" rx="6" ry="2.4" fill="#7E9E6C" />
          <line x1="-6" y1="0" x2="6" y2="0" stroke="#3F5C30" strokeWidth="0.4" />
        </g>
      ))}
      <path d="M-2 -16 Q 0 0 -2 8" stroke="#3F5C30" strokeWidth="1" fill="none" />
    </g>
  );
}

function CornerLeaves({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const isTop = position === 'tl' || position === 'tr';
  const isLeft = position === 'tl' || position === 'bl';
  return (
    <div style={{
      position: 'absolute',
      [isTop ? 'top' : 'bottom']: -8,
      [isLeft ? 'left' : 'right']: -8,
      width: 110, height: 110,
      pointerEvents: 'none', opacity: 0.85,
      transform: `${isLeft ? '' : 'scaleX(-1)'} ${isTop ? '' : 'scaleY(-1)'}`,
    }}>
      <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
        {/* Soft branch with leaves */}
        <path d="M5 5 Q 30 30, 40 60 Q 45 80, 60 95" stroke="#7E9E6C" strokeWidth="1.2" fill="none" />
        {[
          [16, 16, 0],
          [28, 30, -25],
          [38, 50, -10],
          [48, 70, -5],
          [22, 22, 35],
          [34, 42, 25],
          [44, 60, 15],
        ].map(([cx, cy, rot], i) => (
          <g key={i} transform={`translate(${cx} ${cy}) rotate(${rot})`}>
            <ellipse cx="0" cy="0" rx="9" ry="3.4" fill="#9CB78A" />
            <ellipse cx="0" cy="0" rx="9" ry="3.4" fill="none" stroke="#5A7A4A" strokeWidth="0.4" />
            <line x1="-9" y1="0" x2="9" y2="0" stroke="#5A7A4A" strokeWidth="0.4" />
          </g>
        ))}
        {/* Tiny flowers (dots) */}
        <circle cx="20" cy="40" r="1.6" fill="#FFFFFF" stroke="#C8A24A" strokeWidth="0.5" />
        <circle cx="42" cy="34" r="1.4" fill="#FFFFFF" stroke="#C8A24A" strokeWidth="0.5" />
        <circle cx="50" cy="80" r="1.6" fill="#FFFFFF" stroke="#C8A24A" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

function Medal({ kind }: { kind: 'gold' | 'silver' | 'bronze' }) {
  const palette = {
    gold:   { fill: '#E5BB4A', stroke: '#8E6826', text: '#5C3F0E', label: '1' },
    silver: { fill: '#CFD3D9', stroke: '#7B8189', text: '#3A3F47', label: '2' },
    bronze: { fill: '#CD8B5C', stroke: '#7A4A20', text: '#3F2200', label: '3' },
  }[kind];
  return (
    <svg width="32" height="36" viewBox="0 0 32 36" fill="none">
      {/* Ribbon */}
      <path d="M8 0 L11 12 L16 8 L21 12 L24 0" fill={palette.fill} stroke={palette.stroke} strokeWidth="0.8" strokeLinejoin="round" />
      {/* Coin */}
      <circle cx="16" cy="22" r="11" fill={palette.fill} stroke={palette.stroke} strokeWidth="1" />
      <circle cx="16" cy="22" r="8" fill="none" stroke={palette.stroke} strokeWidth="0.5" opacity="0.4" />
      <text x="16" y="26" textAnchor="middle" fontFamily="serif" fontSize="11" fontWeight="700" fill={palette.text}>{palette.label}</text>
    </svg>
  );
}

function DotDivider({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
      <span style={{ flex: '0 1 60px', height: 1, background: color, opacity: 0.45 }} />
      <span style={{ width: 4, height: 4, borderRadius: 2, background: color }} />
      <span style={{ flex: '0 1 60px', height: 1, background: color, opacity: 0.45 }} />
    </div>
  );
}

function Sprig() {
  return (
    <svg width="120" height="20" viewBox="0 0 120 20" fill="none">
      <path d="M10 10 H 110" stroke="#B68838" strokeWidth="0.8" opacity="0.4" />
      <g transform="translate(60 10)">
        <path d="M-8 0 Q 0 -8 8 0" stroke="#7E9E6C" strokeWidth="1" fill="none" />
        <ellipse cx="-6" cy="-2" rx="3" ry="1.4" fill="#9CB78A" stroke="#5A7A4A" strokeWidth="0.3" />
        <ellipse cx="0" cy="-5" rx="3.5" ry="1.6" fill="#9CB78A" stroke="#5A7A4A" strokeWidth="0.3" />
        <ellipse cx="6" cy="-2" rx="3" ry="1.4" fill="#9CB78A" stroke="#5A7A4A" strokeWidth="0.3" />
        <circle cx="0" cy="-5" r="0.8" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

function TennisBall() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7.5" fill="#D4D070" stroke="#8E6826" strokeWidth="0.6" />
      <path d="M3 6 Q 9 8 15 6" stroke="#FFFFFF" strokeWidth="0.7" fill="none" opacity="0.85" />
      <path d="M3 12 Q 9 10 15 12" stroke="#FFFFFF" strokeWidth="0.7" fill="none" opacity="0.85" />
    </svg>
  );
}
