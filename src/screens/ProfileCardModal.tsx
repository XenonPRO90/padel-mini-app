import { useEffect, useRef, useState } from 'react';
import { T } from '../lib/tokens';
import { ELogo, EBtn } from '../lib/elegant';
import { Avatar } from './PlayersScreen';
import { apiBlob } from '../api/client';
import type { PlayerProfile } from '../lib/types';

// Poster palette (cream/gold, serif) — matches FinishedCelebration.
const P = {
  bg: '#F4ECDA', card: '#FFFFFF', cardBorder: '#E5D7B7', divider: '#D9C495',
  ink: '#1F2D24', muted: '#6E5E3D', gold: '#B68838',
  serif: '"New York", "Cormorant Garamond", Georgia, "Times New Roman", serif',
};

export function ProfileCardModal({ profile, onClose }: { profile: PlayerProfile; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  // Load avatar as a data URL — html2canvas can't capture cross-origin t.me images.
  const [avatarData, setAvatarData] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (profile.player.photo_url) {
      apiBlob(`/api/players/${profile.player.id}/avatar`)
        .then((b) => new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(b);
        }))
        .then((d) => { if (!cancelled) setAvatarData(d); })
        .catch(() => { /* fall back to initials */ });
    }
    return () => { cancelled = true; };
  }, [profile.player.id, profile.player.photo_url]);
  const s = profile.stats;

  const tiles = [
    { v: `${Math.round(s.win_rate * 100)}%`, l: 'побед' },
    { v: String(s.tournaments), l: 'турниров' },
    { v: `${s.champion}×`, l: 'чемпион' },
    { v: `${s.podium}×`, l: 'подиум' },
  ];

  const onShare = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      if ((document.fonts as { ready?: Promise<unknown> })?.ready) {
        try { await (document.fonts as { ready: Promise<unknown> }).ready; } catch { /* noop */ }
      }
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(ref.current, { backgroundColor: P.bg, scale: 3, useCORS: true });
      const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), 'image/png', 0.95));
      if (!blob) throw new Error('Не удалось создать картинку');
      const file = new File([blob], `${profile.player.name.replace(/[^\w]+/g, '_')}.png`, { type: 'image/png' });
      const nav = navigator as Navigator & {
        canShare?: (d: { files: File[] }) => boolean; share?: (d: { files: File[]; title?: string }) => Promise<void>;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: profile.player.name });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = file.name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (e) {
      const msg = (e as Error).message || '';
      if (!/abort|cancel/i.test(msg)) alert(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(31,42,36,0.55)' }} />
      <div style={{ position: 'relative', margin: 'auto', padding: 16, width: '100%', maxWidth: 380 }}>
        {/* Captured card */}
        <div ref={ref} style={{
          background: `linear-gradient(180deg, #FBF6E9 0%, ${P.bg} 100%)`,
          border: `1px solid ${P.cardBorder}`, borderRadius: 18, padding: '26px 22px 22px',
          textAlign: 'center', fontFamily: P.serif,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}><ELogo size={40} color={P.gold} /></div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 9, letterSpacing: 5, color: P.gold, textTransform: 'uppercase' }}>Padel Club</div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 10px' }}>
            <div style={{ borderRadius: '50%', padding: 4, border: `2px solid ${P.gold}` }}>
              <Avatar name={profile.player.name} size={88} photoUrl={avatarData} />
            </div>
          </div>

          <div style={{ fontSize: 26, fontWeight: 700, color: P.ink, lineHeight: 1.1 }}>{profile.player.name}</div>
          <div style={{ fontSize: 13, fontStyle: 'italic', color: P.muted, marginTop: 4 }}>
            {profile.player.level}
            {s.club_rank ? ` · #${s.club_rank} в клубе` : ''}
            {profile.player.racket ? ` · ${profile.player.racket}` : ''}
          </div>

          <div style={{ height: 1, background: P.divider, opacity: 0.6, margin: '16px 8px' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {tiles.map((x) => (
              <div key={x.l}>
                <div style={{ fontSize: 22, fontWeight: 700, color: P.gold, lineHeight: 1 }}>{x.v}</div>
                <div style={{ fontSize: 10, fontStyle: 'italic', color: P.muted, marginTop: 3 }}>{x.l}</div>
              </div>
            ))}
          </div>

          {profile.best_partner && (
            <div style={{ fontSize: 12, fontStyle: 'italic', color: P.muted, marginTop: 16 }}>
              Лучший партнёр — <span style={{ color: P.ink }}>{profile.best_partner.name}</span>
            </div>
          )}
        </div>

        {/* Actions (not captured) */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <EBtn kind="primary" style={{ flex: 1 }} disabled={busy} onClick={onShare}>
            {busy ? 'Готовлю…' : 'Поделиться'}
          </EBtn>
          <EBtn kind="ghost" onClick={onClose}>Закрыть</EBtn>
        </div>
      </div>
    </div>
  );
}
