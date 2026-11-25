import { useState } from 'react';
import { useMe } from '../api/me';
import { useSetMyFceEmail } from '../api/fce';
import { FceBadge } from '../components/FceBadge';
import { T } from '../lib/tokens';
import { useT } from '../lib/i18n';

// FCE Activity — the sponsor's programme inside the club app.
//
// The page is deliberately a GUEST on the club's paper: ground, type and cards
// stay Padel Masters, and FCE enters through the navy header band and a single
// blue accent that replaces gold inside this screen only. Pouring the whole FCE
// palette in would read as a different app (Roman, 2026-11-25).
const NAVY = '#091a38';
const BLUE = '#1e78f0';
const BLUE_TINT = '#e8f0fe';

export function FceCupScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { data: me } = useMe();
  const save = useSetMyFceEmail();
  const player = me?.player ?? null;
  const verified = !!player?.fce_verified;
  const [email, setEmail] = useState(player?.fce_email ?? '');
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    try {
      await save.mutateAsync(email.trim() || null);
    } catch (e) {
      setErr((e as Error).message.replace(/^API \d+: /, '') || t('common.error'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* co-branded band */}
      <div style={{ background: NAVY, padding: '12px 16px 18px' }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
          color: '#8aa0c4', fontFamily: T.fontSerif, fontSize: 14,
        }}>← {t('common.back')}</button>
        <div style={{
          marginTop: 14, fontFamily: T.fontDisplay, fontSize: 9.5, letterSpacing: '0.28em',
          color: '#8aa0c4', fontWeight: 700,
        }}>PADEL CLUB × FCE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <FceBadge size={26} />
          <div style={{ fontFamily: T.fontSerif, fontSize: 26, color: '#fff', fontWeight: 700 }}>
            FCE Activity
          </div>
        </div>
        <div style={{ marginTop: 8, fontFamily: T.fontSerif, fontSize: 13.5, color: '#b9c7de', lineHeight: 1.45 }}>
          Спонсорская программа клуба: бесплатные игры за победы, три iPhone 18 Pro
          за прорыв в рейтинге и фирменная форма.
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* status */}
        <div style={{
          background: verified ? BLUE_TINT : T.cream, borderRadius: 12,
          border: `1px solid ${verified ? `${BLUE}44` : T.paperEdge}`, padding: 14,
        }}>
          {verified ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FceBadge size={18} />
                <span style={{ fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 700,
                               letterSpacing: '0.1em', color: BLUE }}>УЧАСТВУЕШЬ</span>
              </div>
              <div style={{ marginTop: 8, fontFamily: T.fontSerif, fontSize: 14, color: T.ink, lineHeight: 1.5 }}>
                Регистрация подтверждена. У тебя $1 000 обмена без комиссии на fce.global,
                и ты в зачёте на призы.
              </div>
              {player?.fce_email && (
                <div style={{ marginTop: 6, fontFamily: T.fontDisplay, fontSize: 12, color: T.muted }}>
                  {player.fce_email}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 700,
                            letterSpacing: '0.1em', color: T.muted }}>КАК УЧАСТВОВАТЬ</div>
              <div style={{ marginTop: 8, fontFamily: T.fontSerif, fontSize: 14, color: T.ink, lineHeight: 1.5 }}>
                Зарегистрируйся на fce.global и пройди верификацию. Потом впиши здесь почту,
                на которую регистрировался — по ней мы тебя найдём в списке и включим в зачёт.
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="почта на fce.global"
                  inputMode="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  style={{
                    flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '10px 12px',
                    borderRadius: 10, border: `1px solid ${T.paperEdge}`, background: '#fff',
                    fontFamily: T.fontDisplay, fontSize: 14, color: T.ink,
                  }}
                />
                <button
                  onClick={submit}
                  disabled={save.isPending || !email.trim()}
                  style={{
                    padding: '10px 16px', borderRadius: 10, border: 'none',
                    background: email.trim() ? BLUE : T.paperEdge, color: '#fff',
                    fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 700,
                    cursor: email.trim() ? 'pointer' : 'default', flexShrink: 0,
                  }}
                >{save.isPending ? '…' : 'Сохранить'}</button>
              </div>
              {err && (
                <div style={{ marginTop: 8, fontFamily: T.fontSerif, fontSize: 13, color: T.loss }}>{err}</div>
              )}
              <div style={{ marginTop: 10, fontFamily: T.fontSerif, fontSize: 12, color: T.muted, lineHeight: 1.45 }}>
                Почту видит только администрация клуба — в клубе она не показывается.
              </div>
            </>
          )}
        </div>

        {/* what you can win */}
        <Section title="ЧТО МОЖНО ВЫИГРАТЬ">
          <Rule n="1" head="Бесплатная игра за победу">
            Занял 1-е место на турнире — следующую игру оплачивает FCE. В парных форматах
            награду получают оба партнёра.
          </Rule>
          <Rule n="2" head="3 × iPhone 18 Pro за прорыв квартала">
            Побеждает не сила, а рост: считается средний прирост рейтинга за турнир.
            Первые три места — iPhone, места с 4-го по 10-е — фирменная форма FCE.
          </Rule>
          <Rule n="3" head="Кто допущен">
            Нужно сыграть минимум 10 турниров за квартал и не меньше 3 турниров до его
            начала. Квартал идёт с 1 декабря по 28 февраля.
          </Rule>
        </Section>

        <div style={{
          border: `1px dashed ${T.paperEdge}`, borderRadius: 12, padding: 16,
          textAlign: 'center', fontFamily: T.fontSerif, fontSize: 13.5, color: T.muted,
        }}>
          Таблица «Прорыв квартала» появится здесь 1 декабря.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
        color: T.muted, marginBottom: 8,
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function Rule({ n, head, children }: { n: string; head: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', gap: 12, background: T.cream, borderRadius: 12,
      border: `1px solid ${T.paperEdge}`, padding: 12,
    }}>
      <div style={{
        fontFamily: T.fontSerif, fontSize: 20, fontWeight: 700, color: BLUE,
        lineHeight: 1, width: 18, flexShrink: 0,
      }}>{n}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: T.fontSerif, fontSize: 15, fontWeight: 700, color: T.ink }}>{head}</div>
        <div style={{ marginTop: 4, fontFamily: T.fontSerif, fontSize: 13.5, color: T.ink2, lineHeight: 1.5 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
