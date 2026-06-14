import { useState } from 'react';
import { T } from '../lib/tokens';
import { ELogo, EDivider, EBtn, EBallIcon } from '../lib/elegant';
import { useMe } from '../api/me';
import { useSubmitJoinRequest } from '../api/joinRequests';
import { useT } from '../lib/i18n';
import { LangToggle } from '../components/LangToggle';

const LEVELS = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'C-', 'D'];

// First screen for a brand-new user (not linked, not admin): explains the club
// and lets them apply right here. No browsing the club until accepted.
export function WelcomeScreen() {
  const t = useT();
  const { data: me } = useMe();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(me?.user.first_name || '');
  const [level, setLevel] = useState('C');
  const submit = useSubmitJoinRequest();
  const pending = me?.join_status === 'pending';

  const onSend = async () => {
    if (!name.trim()) { alert(t('form.enterName')); return; }
    try {
      await submit.mutateAsync({ name: name.trim(), level });
    } catch (e) {
      alert((e as Error).message || t('form.submitFail'));
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 14px 0' }}>
        <LangToggle />
      </div>
      <div style={{
        flex: 1, padding: '12px 24px 24px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center',
      }}>
        <ELogo size={84} />
        <div style={{
          marginTop: 14, fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 600,
          letterSpacing: 3, color: T.ink,
        }}>PADEL CLUB</div>
        <div style={{ marginTop: 10 }}><EDivider /></div>
        <div style={{
          marginTop: 12, fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 15,
          color: T.muted, lineHeight: 1.5, maxWidth: 300,
        }}>
          {t('welcome.tagline')}
        </div>

        <div style={{ width: '100%', maxWidth: 340, marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Feature icon="🏆" title={t('welcome.f1t')} text="King of the Court · Team Americano · Mini Tournament" />
          <Feature icon="📊" title={t('welcome.f2t')} text={t('welcome.f2x')} />
          <Feature icon="🥇" title={t('welcome.f3t')} text={t('welcome.f3x')} />
        </div>

        <div style={{ marginTop: 26, opacity: 0.5 }}><EBallIcon size={20} /></div>
      </div>

      <div style={{
        padding: '12px 20px calc(env(safe-area-inset-bottom, 0px) + 16px)',
        borderTop: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        {pending ? (
          <div style={{
            textAlign: 'center', fontFamily: T.fontSerif, fontStyle: 'italic',
            fontSize: 14, color: T.muted, padding: '8px 0',
          }}>{t('welcome.pending')}</div>
        ) : !showForm ? (
          <EBtn kind="primary" style={{ width: '100%' }} onClick={() => setShowForm(true)}>
            {t('welcome.apply')}
          </EBtn>
        ) : (
          <div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 10, letterSpacing: 2, color: T.gold, marginBottom: 6, textTransform: 'uppercase' }}>{t('form.name')}</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('form.namePh')}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12,
                border: `1px solid ${T.paperEdge}`, background: T.paper,
                fontFamily: T.fontDisplay, fontSize: 16, color: T.ink, marginBottom: 12,
              }} />
            <div style={{ fontFamily: T.fontDisplay, fontSize: 10, letterSpacing: 2, color: T.gold, marginBottom: 6, textTransform: 'uppercase' }}>{t('form.level')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {LEVELS.map((l) => (
                <button key={l} onClick={() => setLevel(l)} style={{
                  padding: '8px 12px', borderRadius: 999, cursor: 'pointer',
                  border: `1px solid ${level === l ? T.emerald : T.paperEdge}`,
                  background: level === l ? T.emerald : 'transparent',
                  color: level === l ? T.cream : T.ink,
                  fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600,
                }}>{l}</button>
              ))}
            </div>
            <EBtn kind="primary" style={{ width: '100%' }} disabled={submit.isPending} onClick={onSend}>
              {submit.isPending ? t('form.submitting') : t('form.submit')}
            </EBtn>
          </div>
        )}
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left',
      background: T.paper, border: `1px solid ${T.paperEdge}`, borderRadius: 14, padding: '12px 14px',
    }}>
      <span style={{ fontSize: 20, lineHeight: 1.2 }}>{icon}</span>
      <div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink }}>{title}</div>
        <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginTop: 2 }}>{text}</div>
      </div>
    </div>
  );
}
