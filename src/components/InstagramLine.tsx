import { useState } from 'react';
import { T } from '../lib/tokens';
import { useT } from '../lib/i18n';
import { useUpdateMyInstagram } from '../api/joinRequests';
import type { Player } from '../lib/types';

// A player's Instagram handle under their profile header. Anyone can tap it
// to open the profile; the owner sets it right here (Roman, 2026-10-22).

export function InstagramMark({ size = 15, color = T.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={2} style={{ display: 'block', flexShrink: 0 }}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill={color} />
    </svg>
  );
}

function openExternal(url: string) {
  // Same reason as in SocialProfile: plain links misbehave in the Telegram
  // in-app WebView, openLink hands the URL to the real app/browser.
  const tg = window.Telegram?.WebApp;
  if (tg?.openLink) tg.openLink(url);
  else window.open(url, '_blank', 'noopener');
}

// The API client throws "API 400: {\"detail\":\"…\"}" — show just the reason.
function apiDetail(e: unknown): string {
  const msg = (e as Error)?.message ?? '';
  try { return JSON.parse(msg.slice(msg.indexOf('{'))).detail ?? msg; } catch { return msg; }
}

export function InstagramLine({ player, isOwn }: { player: Player; isOwn: boolean }) {
  const t = useT();
  const save = useUpdateMyInstagram();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handle = player.instagram ?? '';

  if (!isOwn && !handle) return null;

  const link = (
    <button onClick={() => openExternal(`https://instagram.com/${handle}`)} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent',
      border: 'none', cursor: 'pointer', padding: '2px 4px',
      fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink,
    }}><InstagramMark />@{handle}</button>
  );

  if (!isOwn) {
    return <div style={{ display: 'flex', justifyContent: 'center', margin: '-8px 0 14px' }}>{link}</div>;
  }

  const val = draft ?? (handle ? `@${handle}` : '');
  const dirty = draft !== null && draft.replace(/^@/, '').trim() !== handle;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '-8px 0 14px' }}>
      <div style={{ display: 'flex', gap: 6, width: '100%', maxWidth: 320, alignItems: 'center' }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px',
          borderRadius: 999, border: `1px solid ${T.paperEdge}`, background: T.cream,
        }}>
          <InstagramMark />
          <input value={val} onChange={(e) => { setDraft(e.target.value); setError(null); }}
            placeholder={t('profile.instagramPh')} maxLength={60}
            autoCapitalize="off" autoCorrect="off" spellCheck={false}
            style={{
              flex: 1, minWidth: 0, padding: '8px 0', border: 'none', background: 'transparent',
              outline: 'none', fontFamily: T.fontDisplay, fontSize: 13, color: T.ink,
            }} />
        </div>
        {handle && !dirty && (
          <button onClick={() => openExternal(`https://instagram.com/${handle}`)} aria-label="Instagram" style={{
            background: 'transparent', border: `1px solid ${T.gold}`, borderRadius: 999,
            padding: '7px 10px', cursor: 'pointer', color: T.gold, display: 'flex',
          }}><InstagramMark /></button>
        )}
        {dirty && (
          <button disabled={save.isPending}
            onClick={() => save.mutate(
              { racket: player.racket ?? '', instagram: draft ?? '' },
              { onSuccess: () => setDraft(null), onError: (e) => setError(apiDetail(e)) },
            )}
            style={{
              background: T.emerald, color: T.cream, border: 'none', borderRadius: 999,
              padding: '8px 14px', cursor: 'pointer',
              fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600,
            }}>{save.isPending ? '…' : 'OK'}</button>
        )}
      </div>
      {error && (
        <div style={{ marginTop: 4, fontFamily: T.fontSerif, fontSize: 12, color: T.burgundy }}>{error}</div>
      )}
    </div>
  );
}
