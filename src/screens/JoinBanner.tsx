import { useState } from 'react';
import { T } from '../lib/tokens';
import { EBtn } from '../lib/elegant';
import { useMe } from '../api/me';
import { useSubmitJoinRequest } from '../api/joinRequests';

const LEVELS = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'C-', 'D'];

// Self-contained: shows nothing for admins or already-linked users.
// Non-linked → "подать заявку" (or "на рассмотрении" if pending).
export function JoinBanner() {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);

  if (!me || me.is_admin || me.player) return null;

  if (me.join_status === 'pending') {
    return (
      <div style={bannerStyle}>
        <div>
          <div style={titleStyle}>Заявка на рассмотрении</div>
          <div style={subStyle}>Организатор скоро её подтвердит — тогда откроется твой кабинет.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={bannerStyle}>
        <div style={{ flex: 1 }}>
          <div style={titleStyle}>Хочешь в клуб?</div>
          <div style={subStyle}>Подай заявку — после подтверждения появится личный кабинет со статистикой.</div>
        </div>
        <EBtn kind="primary" onClick={() => setOpen(true)}>Подать заявку</EBtn>
      </div>
      {open && <JoinModal defaultName={me.user.first_name || ''} onClose={() => setOpen(false)} />}
    </>
  );
}

function JoinModal({ defaultName, onClose }: { defaultName: string; onClose: () => void }) {
  const [name, setName] = useState(defaultName);
  const [level, setLevel] = useState('C');
  const submit = useSubmitJoinRequest();

  const onSend = async () => {
    if (!name.trim()) { alert('Укажи имя'); return; }
    try {
      await submit.mutateAsync({ name: name.trim(), level });
      onClose();
    } catch (e) {
      alert((e as Error).message || 'Не удалось отправить заявку');
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
        }}>Заявка на вступление</div>

        <div style={{ fontFamily: T.fontDisplay, fontSize: 10, letterSpacing: 2, color: T.gold, marginBottom: 6 }}>ИМЯ</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Как тебя зовут"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12,
            border: `1px solid ${T.paperEdge}`, background: T.cream, fontFamily: T.fontDisplay,
            fontSize: 16, color: T.ink, marginBottom: 14,
          }} />

        <div style={{ fontFamily: T.fontDisplay, fontSize: 10, letterSpacing: 2, color: T.gold, marginBottom: 6 }}>УРОВЕНЬ</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
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
          {submit.isPending ? 'Отправка…' : 'Отправить заявку'}
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
