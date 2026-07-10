import { useState } from 'react';
import { T } from '../lib/tokens';
import { EBtn } from '../lib/elegant';
import { useMe } from '../api/me';
import { useSubmitJoinRequest } from '../api/joinRequests';
import { useT } from '../lib/i18n';


// Self-contained: shows nothing for admins or already-linked users.
// Non-linked → "подать заявку" (or "на рассмотрении" if pending).
export function JoinBanner() {
  const t = useT();
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);

  if (!me || me.is_admin || me.player) return null;

  if (me.join_status === 'pending') {
    return (
      <div style={bannerStyle}>
        <div>
          <div style={titleStyle}>{t('join.pendingTitle')}</div>
          <div style={subStyle}>{t('join.pendingSub')}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={bannerStyle}>
        <div style={{ flex: 1 }}>
          <div style={titleStyle}>{t('join.wantTitle')}</div>
          <div style={subStyle}>{t('join.wantSub')}</div>
        </div>
        <EBtn kind="primary" onClick={() => setOpen(true)}>{t('welcome.apply')}</EBtn>
      </div>
      {open && <JoinModal defaultName={me.user.first_name || ''} onClose={() => setOpen(false)} />}
    </>
  );
}

function JoinModal({ defaultName, onClose }: { defaultName: string; onClose: () => void }) {
  const t = useT();
  const [name, setName] = useState(defaultName);
  const submit = useSubmitJoinRequest();

  const onSend = async () => {
    if (!name.trim()) { alert(t('form.enterName')); return; }
    try {
      await submit.mutateAsync({ name: name.trim(), level: 'C' });
      onClose();
    } catch (e) {
      alert((e as Error).message || t('form.submitFail'));
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(31,42,36,0.45)' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, background: T.paper,
        borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTop: `1px solid ${T.rule}`,
        padding: '18px 18px calc(env(safe-area-inset-bottom, 0px) + 18px)',
        boxShadow: '0 -20px 40px -20px rgba(31,42,36,0.35)',
      }}>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 600, color: T.ink,
          letterSpacing: 1, marginBottom: 14, textAlign: 'center',
        }}>{t('join.formTitle')}</div>

        <div style={{ fontFamily: T.fontDisplay, fontSize: 10, letterSpacing: 2, color: T.gold, marginBottom: 6, textTransform: 'uppercase' }}>{t('form.name')}</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('form.namePh')}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12,
            border: `1px solid ${T.paperEdge}`, background: T.cream, fontFamily: T.fontDisplay,
            fontSize: 16, color: T.ink, marginBottom: 14,
          }} />

        <div style={{
          fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 12.5, color: T.muted,
          background: T.cream, border: `1px solid ${T.paperEdge}`, borderRadius: 10,
          padding: '10px 12px', marginBottom: 18,
        }}>{t('form.levelCalib')}</div>

        <EBtn kind="primary" style={{ width: '100%' }} disabled={submit.isPending} onClick={onSend}>
          {submit.isPending ? t('form.submitting') : t('form.submit')}
        </EBtn>
      </div>
    </div>
  );
}

const bannerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: T.paper, border: `1px solid ${T.gold}`, borderRadius: 14,
  padding: '12px 14px', margin: '0 0 14px',
};
const titleStyle: React.CSSProperties = {
  fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink,
};
const subStyle: React.CSSProperties = {
  fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginTop: 2,
};
