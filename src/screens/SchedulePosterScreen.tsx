import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { T } from '../lib/tokens';
import { MainCTA, SecondaryCTA } from '../components/MainCTA';
import type { ActiveTournamentResponse, Match, MatchPlayer } from '../lib/types';

interface Props {
  onClose: () => void;
}

// Same poster palette as FinishedCelebration
const P = {
  bg: '#F4ECDA',
  bgGradient: '#FBF6E9',
  card: '#FFFFFF',
  cardBorder: '#E5D7B7',
  divider: '#D9C495',
  textPrimary: '#1F2D24',
  textMuted: '#6E5E3D',
  textDim: '#998760',
  accentGold: '#B68838',
  accentGoldSoft: '#D9B863',
  // Court labels are dark forest squares with cream text — matches reference
  courtBg: '#2A3A2D',
  courtText: '#F4ECDA',
  serif: '"New York", "Cormorant Garamond", Georgia, "Times New Roman", serif',
};

export function SchedulePosterScreen({ onClose }: Props) {
  const { data, isLoading } = useQuery<ActiveTournamentResponse>({
    queryKey: ['active-tournament'],
    queryFn: () => api('/api/tournaments/active'),
  });

  const posterRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading || !data) {
    return <div style={{ padding: 24, color: T.textMuted, textAlign: 'center', marginTop: 80 }}>Loading…</div>;
  }
  if (!data.tournament || !data.round) {
    return (
      <div style={{ padding: 40, color: T.textMuted, textAlign: 'center' }}>
        No active round to share.
        <div style={{ height: 16 }} />
        <SecondaryCTA label="BACK" onClick={onClose} />
      </div>
    );
  }

  const t = data.tournament;
  const round = data.round;
  const parsed = parseTitle(t.name);

  const onShare = async () => {
    if (!posterRef.current) return;
    setBusy(true);
    try {
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
      const filename = `${(parsed.main + '_R' + round.round_num).replace(/[^\w]+/g, '_')}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      const navAny = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files: File[]; title?: string }) => Promise<void>;
      };
      if (navAny.canShare?.({ files: [file] }) && navAny.share) {
        await navAny.share({ files: [file], title: `${t.name} · Round ${round.round_num}` });
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.bg }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 16px' }}>
        <div ref={posterRef} style={{
          width: '100%',
          background: `linear-gradient(180deg, ${P.bgGradient} 0%, ${P.bg} 100%)`,
          borderRadius: 18,
          padding: '28px 18px 24px',
          fontFamily: P.serif,
          color: P.textPrimary,
          position: 'relative',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}>
          <CornerLeaves position="tl" />
          <CornerLeaves position="tr" />
          <CornerLeaves position="bl" />
          <CornerLeaves position="br" />

          <CrownAndRackets />

          {/* Title */}
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <div style={{
              fontFamily: P.serif, fontSize: 32, fontWeight: 600,
              letterSpacing: '0.06em', lineHeight: 1.05,
            }}>{parsed.main}</div>
            {parsed.subtitle && (
              <div style={{
                marginTop: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <span style={{ flex: '0 1 32px', height: 1, background: P.accentGold, opacity: 0.5 }} />
                <span style={{
                  fontFamily: P.serif, fontStyle: 'italic',
                  fontSize: 13, letterSpacing: '0.18em',
                  color: P.accentGold, fontWeight: 500,
                }}>{parsed.subtitle}</span>
                <span style={{ flex: '0 1 32px', height: 1, background: P.accentGold, opacity: 0.5 }} />
              </div>
            )}
            {parsed.date && (
              <div style={{
                marginTop: 8,
                fontFamily: P.serif, fontSize: 14,
                letterSpacing: '0.32em', color: P.textMuted,
              }}>· {parsed.date} ·</div>
            )}
            <div style={{
              marginTop: 10,
              fontFamily: P.serif, fontSize: 13, fontStyle: 'italic',
              color: P.textMuted, letterSpacing: '0.04em',
            }}>Расписание · Раунд {round.round_num}</div>
          </div>

          {/* Sprig */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 12px' }}>
            <Sprig />
          </div>

          {/* Court cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {round.matches.map((m) => (
              <CourtRow key={m.match_id} match={m} />
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <DotDivider />
            <div style={{
              marginTop: 12,
              fontFamily: P.serif, fontSize: 14,
              letterSpacing: '0.04em', color: P.textPrimary,
            }}>Пожалуйста, не опаздывайте!</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <DotDivider />
            </div>
          </div>
        </div>
      </div>

      <div style={{
        flexShrink: 0,
        padding: '8px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)',
        background: T.bg, borderTop: `1px solid ${T.border}`,
      }}>
        <MainCTA
          label={busy ? 'GENERATING POSTER…' : '📸 SHARE POSTER'}
          disabled={busy}
          onClick={onShare}
        />
        <div style={{ height: 8 }} />
        <SecondaryCTA label="BACK" onClick={onClose} />
      </div>
    </div>
  );
}

function CourtRow({ match }: { match: Match }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
      {/* Court label — dark forest square with court number + ball */}
      <div style={{
        width: 72,
        background: P.courtBg,
        color: P.courtText,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '12px 4px',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: P.serif, fontSize: 11, fontWeight: 500,
          letterSpacing: '0.18em',
        }}>КОРТ</div>
        <div style={{
          fontFamily: P.serif, fontSize: 30, fontWeight: 700, lineHeight: 1,
          marginTop: 2,
        }}>{match.court_num}</div>
        <div style={{ marginTop: 6 }}>
          <TennisBallSmall />
        </div>
      </div>
      {/* Players card */}
      <div style={{
        flex: 1,
        background: P.card,
        border: `1px solid ${P.cardBorder}`,
        borderLeft: 'none',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        padding: '10px 14px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <PlayerLine a={match.team1[0]} b={match.team1[1]} />
        <div style={{
          height: 1, background: P.cardBorder, margin: '8px 0',
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            background: P.card,
            padding: '0 8px',
            fontFamily: P.serif, fontSize: 13, fontStyle: 'italic',
            color: P.accentGold, fontWeight: 500,
          }}>и</span>
        </div>
        <PlayerLine a={match.team2[0]} b={match.team2[1]} />
      </div>
    </div>
  );
}

function PlayerLine({ a, b }: { a: MatchPlayer; b: MatchPlayer }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: P.serif,
    }}>
      <span style={{ fontSize: 17, fontWeight: 600, color: P.textPrimary, flexShrink: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</span>
      <span style={{ fontSize: 12, color: P.textDim, flexShrink: 0 }}>({a.level})</span>
      <span style={{ fontStyle: 'italic', fontSize: 12, color: P.accentGold, margin: '0 4px', flexShrink: 0 }}>и</span>
      <span style={{ fontSize: 17, fontWeight: 600, color: P.textPrimary, flexShrink: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
      <span style={{ fontSize: 12, color: P.textDim, flexShrink: 0 }}>({b.level})</span>
    </div>
  );
}

function parseTitle(name: string): { main: string; subtitle: string; date: string } {
  const dateMatch = name.match(/(\d{1,2}\.\d{1,2}(?:\.\d{2,4})?)\s*$/);
  const date = dateMatch ? dateMatch[1] : '';
  const withoutDate = (dateMatch ? name.slice(0, dateMatch.index).trim() : name).replace(/[·•—–-]+$/, '').trim();
  const idx = withoutDate.toUpperCase().indexOf('PADEL MASTERS');
  if (idx === 0) {
    const rest = withoutDate.slice('PADEL MASTERS'.length).trim();
    return { main: 'PADEL MASTERS', subtitle: rest.toUpperCase(), date };
  }
  return { main: withoutDate.toUpperCase(), subtitle: '', date };
}

function CrownAndRackets() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width="140" height="100" viewBox="0 0 140 100" fill="none">
        <g transform="translate(70 0)">
          <path d="M-12 14 L-8 4 L-4 12 L0 2 L4 12 L8 4 L12 14 Z" fill="#C8A24A" stroke="#8E6826" strokeWidth="0.7" strokeLinejoin="round" />
          <circle cx="-12" cy="4" r="1.6" fill="#8E6826" />
          <circle cx="0" cy="2" r="1.6" fill="#8E6826" />
          <circle cx="12" cy="4" r="1.6" fill="#8E6826" />
        </g>
        <g transform="translate(70 50) rotate(-30)"><Racket /></g>
        <g transform="translate(70 50) rotate(30)"><Racket /></g>
        <Laurel side="left" />
        <Laurel side="right" />
      </svg>
    </div>
  );
}

function Racket() {
  return (
    <g>
      <ellipse cx="0" cy="-22" rx="13" ry="18" fill="#FAEFD5" stroke="#8E6826" strokeWidth="1.6" />
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
        <circle cx="20" cy="40" r="1.6" fill="#FFFFFF" stroke="#C8A24A" strokeWidth="0.5" />
        <circle cx="42" cy="34" r="1.4" fill="#FFFFFF" stroke="#C8A24A" strokeWidth="0.5" />
        <circle cx="50" cy="80" r="1.6" fill="#FFFFFF" stroke="#C8A24A" strokeWidth="0.5" />
      </svg>
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

function DotDivider() {
  return (
    <svg width="100" height="8" viewBox="0 0 100 8" fill="none">
      <line x1="0" y1="4" x2="42" y2="4" stroke="#B68838" strokeWidth="0.8" opacity="0.4" />
      <circle cx="50" cy="4" r="2" fill="#B68838" />
      <line x1="58" y1="4" x2="100" y2="4" stroke="#B68838" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

function TennisBallSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" fill="#D4D070" stroke="#F4ECDA" strokeWidth="0.5" />
      <path d="M2 5 Q 7 6.5 12 5" stroke="#FFFFFF" strokeWidth="0.6" fill="none" opacity="0.85" />
      <path d="M2 9 Q 7 7.5 12 9" stroke="#FFFFFF" strokeWidth="0.6" fill="none" opacity="0.85" />
    </svg>
  );
}
