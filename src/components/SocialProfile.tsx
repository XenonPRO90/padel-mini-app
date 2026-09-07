import { useState } from 'react';
import { T } from '../lib/tokens';
import { useT } from '../lib/i18n';
import { useUpdateMyProfile } from '../api/joinRequests';
import type { Player } from '../lib/types';

// Self-declared work profile, shown only where the instance enables it
// (FCE runs its league as a networking surface; the padel club does not).
// The player edits their own; everyone else sees a read-only card.

function openExternal(url: string) {
  // A plain <a> inside the Telegram in-app WebView either does nothing or
  // traps the user in a webview with no way back. openLink hands it to the
  // real browser.
  const tg = window.Telegram?.WebApp;
  if (tg?.openLink) tg.openLink(url);
  else window.open(url, '_blank', 'noopener');
}

function LinkedInMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM2.4 9.5h5.16V21H2.4zM9.9 9.5h4.95v1.57h.07c.69-1.24 2.38-2.55 4.9-2.55 5.24 0 6.2 3.3 6.2 7.6V21h-5.16v-4.9c0-1.17-.02-2.67-1.7-2.67-1.7 0-1.96 1.27-1.96 2.58V21H9.9z" />
    </svg>
  );
}

export function SocialProfile({ player, isOwn }: { player: Player; isOwn: boolean }) {
  const t = useT();
  const save = useUpdateMyProfile();
  const [draft, setDraft] = useState<
    { company: string; position: string; linkedin: string; about: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const company = player.company ?? '';
  const position = player.position ?? '';
  const linkedin = player.linkedin ?? '';
  const about = player.about ?? '';
  const hasAny = !!(company || position || linkedin || about);

  if (!isOwn && !hasAny) return null;

  const card: React.CSSProperties = {
    width: '100%', marginBottom: 18, padding: '14px 16px',
    background: T.paper, border: `1px solid ${T.paperEdge}`, borderRadius: 14,
    textAlign: 'left',
  };
  const label: React.CSSProperties = {
    fontFamily: T.fontDisplay, fontSize: 9, letterSpacing: 2,
    textTransform: 'uppercase', color: T.muted, marginBottom: 4,
  };
  const input: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 10,
    border: `1px solid ${T.paperEdge}`, background: T.cream,
    fontFamily: T.fontDisplay, fontSize: 13, color: T.ink, marginBottom: 10,
  };

  // ── read-only ──
  if (!isOwn || draft === null) {
    return (
      <div style={card}>
        <div style={label}>{t('social.title')}</div>
        {company && (
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 700,
            color: T.ink, lineHeight: 1.3,
          }}>{company}</div>
        )}
        {position && (
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 14, color: T.muted,
            lineHeight: 1.4, marginTop: company ? 2 : 0,
          }}>{position}</div>
        )}
        {about && (
          <div style={{
            fontFamily: T.fontSerif, fontSize: 14, color: T.ink2,
            lineHeight: 1.55, marginTop: (company || position) ? 9 : 0,
            whiteSpace: 'pre-line',
          }}>{about}</div>
        )}
        {!hasAny && (
          <div style={{ fontFamily: T.fontSerif, fontSize: 13, color: T.muted }}>
            {t('social.empty')}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: hasAny ? 10 : 8, flexWrap: 'wrap' }}>
          {linkedin && (
            <button onClick={() => openExternal(linkedin)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: T.emerald, color: T.cream, border: 'none', borderRadius: 999,
              padding: '7px 13px', cursor: 'pointer',
              fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600,
            }}><LinkedInMark /> LinkedIn</button>
          )}
          {isOwn && (
            <button onClick={() => { setError(null); setDraft({ company, position, linkedin, about }); }} style={{
              background: 'transparent', color: T.gold, border: `1px solid ${T.gold}`,
              borderRadius: 999, padding: '7px 13px', cursor: 'pointer',
              fontFamily: T.fontDisplay, fontSize: 12, fontWeight: 600,
            }}>{hasAny ? t('social.edit') : t('social.add')}</button>
          )}
        </div>
      </div>
    );
  }

  // ── editing your own ──
  return (
    <div style={card}>
      <div style={label}>{t('social.title')}</div>

      <div style={label}>{t('social.company')}</div>
      <input style={input} maxLength={80} value={draft.company}
        placeholder={t('social.companyPh')}
        onChange={(e) => setDraft({ ...draft, company: e.target.value })} />

      <div style={label}>{t('social.position')}</div>
      <input style={input} maxLength={80} value={draft.position}
        placeholder={t('social.positionPh')}
        onChange={(e) => setDraft({ ...draft, position: e.target.value })} />

      <div style={label}>{t('social.about')}</div>
      <textarea style={{ ...input, minHeight: 88, resize: 'vertical', lineHeight: 1.5 }}
        maxLength={400} value={draft.about}
        placeholder={t('social.aboutPh')}
        onChange={(e) => setDraft({ ...draft, about: e.target.value })} />
      <div style={{
        marginTop: -6, marginBottom: 10, textAlign: 'right',
        fontFamily: T.fontDisplay, fontSize: 11, color: T.muted,
      }}>{draft.about.length} / 400</div>

      <div style={label}>LinkedIn</div>
      <input style={input} maxLength={160} value={draft.linkedin}
        placeholder="linkedin.com/in/…"
        autoCapitalize="none" autoCorrect="off" spellCheck={false}
        onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })} />

      {error && (
        <div style={{
          fontFamily: T.fontSerif, fontSize: 12, color: T.burgundy, marginBottom: 8,
        }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={save.isPending}
          onClick={() => {
            setError(null);
            save.mutate(
              { racket: player.racket ?? '', ...draft },
              {
                onSuccess: () => setDraft(null),
                onError: (e) => setError((e as Error).message || t('common.error')),
              },
            );
          }}
          style={{
            flex: 1, background: T.emerald, color: T.cream, border: 'none', borderRadius: 999,
            padding: '9px', cursor: 'pointer',
            fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600,
          }}>{save.isPending ? '…' : t('common.save')}</button>
        <button onClick={() => { setDraft(null); setError(null); }} style={{
          flex: 1, background: 'transparent', color: T.muted,
          border: `1px solid ${T.paperEdge}`, borderRadius: 999, padding: '9px',
          cursor: 'pointer', fontFamily: T.fontDisplay, fontSize: 13,
        }}>{t('common.cancel')}</button>
      </div>
    </div>
  );
}
