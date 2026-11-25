import { useState } from 'react';
import { useMe } from '../api/me';
import { useSetMyFceEmail, useFceStandings, useMyVouchers,
         type FceStandingRow, type FceVoucher } from '../api/fce';
import { FceBadge, FceMark } from '../components/FceBadge';
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
  const { data: standings } = useFceStandings();
  const { data: vouchers } = useMyVouchers();
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
          <FceMark size={28} />
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
                <FceBadge height={10} />
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
              {/* The link carries FCE's promo, so registering through it is
                  what makes the $1 000 appear. Opened outside Telegram: it is
                  an exchange sign-up with KYC, not a mini-app page. */}
              <button
                onClick={() => {
                  const url = standings?.signup_url;
                  if (!url) return;
                  const tg = window.Telegram?.WebApp;
                  if (tg?.openLink) tg.openLink(url);
                  else window.open(url, '_blank', 'noopener');
                }}
                disabled={!standings?.signup_url}
                style={{
                  marginTop: 12, width: '100%', padding: '12px 16px', borderRadius: 10,
                  border: 'none', background: NAVY, color: '#fff', cursor: 'pointer',
                  fontFamily: T.fontDisplay, fontSize: 14.5, fontWeight: 700,
                }}
              >Зарегистрироваться на fce.global</button>
              <div style={{
                marginTop: 6, fontFamily: T.fontSerif, fontSize: 12.5, color: T.muted,
                lineHeight: 1.45, textAlign: 'center',
              }}>По этой ссылке начисляется $1 000 обмена без комиссии</div>

              <div style={{ marginTop: 14, fontFamily: T.fontDisplay, fontSize: 11,
                            fontWeight: 700, letterSpacing: '0.1em', color: T.muted }}>
                ПОСЛЕ РЕГИСТРАЦИИ
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

        <MyVouchers list={vouchers?.vouchers ?? []} />

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

        <Standings data={standings} myId={player?.id ?? null} />
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


function Standings({ data, myId }: {
  data: ReturnType<typeof useFceStandings>['data']; myId: number | null;
}) {
  if (!data?.quarter) {
    return (
      <div style={{
        border: `1px dashed ${T.paperEdge}`, borderRadius: 12, padding: 16,
        textAlign: 'center', fontFamily: T.fontSerif, fontSize: 13.5, color: T.muted,
      }}>
        Таблица «Прорыв квартала» появится здесь 1 декабря.
      </div>
    );
  }
  const need = data.min_tournaments ?? 10;
  const rows = data.rows;
  const ranked = rows.filter((r) => r.place !== null);
  const mine = myId ? rows.find((r) => r.player_id === myId) : undefined;

  return (
    <div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
        color: T.muted, marginBottom: 8,
      }}>ПРОРЫВ КВАРТАЛА</div>

      {/* Your own standing first: for most people the table is someone else's
          race, while "4 of 10 played" is the thing they can act on. */}
      {mine && (
        <div style={{
          background: BLUE_TINT, border: `1px solid ${BLUE}44`, borderRadius: 12,
          padding: 12, marginBottom: 10,
        }}>
          {mine.eligible ? (
            <div style={{ fontFamily: T.fontSerif, fontSize: 14, color: T.ink }}>
              Ты на <b>{mine.place} месте</b> — {fmtRate(mine.rate)} за турнир,
              сыграно {mine.played}.
            </div>
          ) : (
            <>
              <div style={{ fontFamily: T.fontSerif, fontSize: 14, color: T.ink }}>
                Сыграно <b>{mine.played} из {need}</b> турниров — этого пока мало для зачёта.
              </div>
              <div style={{
                marginTop: 8, height: 6, borderRadius: 999, background: '#ffffff',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(100, (mine.played / need) * 100)}%`,
                  height: '100%', background: BLUE,
                }} />
              </div>
            </>
          )}
        </div>
      )}

      <div style={{
        background: T.cream, border: `1px solid ${T.paperEdge}`, borderRadius: 12,
        overflow: 'hidden',
      }}>
        {ranked.length > 0 && (
          <div style={{
            padding: '7px 12px', background: '#f3f7fe',
            fontFamily: T.fontDisplay, fontSize: 9.5, fontWeight: 700,
            letterSpacing: '0.16em', color: BLUE,
          }}>ПРИЗОВАЯ ЗОНА · 1–3 iPhone · 4–10 ФОРМА</div>
        )}
        {ranked.length === 0 && (
          <div style={{ padding: 14, fontFamily: T.fontSerif, fontSize: 13.5, color: T.muted }}>
            Пока никто не набрал {need} турниров — таблица заполнится по ходу квартала.
          </div>
        )}
        {ranked.map((r, i) => (
          <Row
            key={r.player_id}
            r={r}
            mine={r.player_id === myId}
            lastPrize={!!r.prize && !ranked[i + 1]?.prize}
          />
        ))}
      </div>

      <div style={{
        marginTop: 8, fontFamily: T.fontSerif, fontSize: 12, color: T.muted, lineHeight: 1.45,
      }}>
        Считается средний прирост рейтинга за турнир. Места 1–3 — iPhone 18 Pro,
        места 4–10 — форма FCE. Допуск: {need} турниров за квартал и 3 до его начала.
      </div>
    </div>
  );
}

function fmtRate(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(4)}`;
}

function Row({ r, mine, lastPrize }: {
  r: FceStandingRow; mine: boolean; lastPrize: boolean;
}) {
  const prize = r.prize === 'iphone' ? 'iPhone' : r.prize === 'kit' ? 'форма' : '';
  // The prize zone has to be visible at a glance: the three iPhone places get
  // a solid blue disc, the seven kit places a tinted one, everyone below a
  // plain number — and a rule closes the zone so you can see where it ends.
  const disc = r.prize === 'iphone'
    ? { background: BLUE, color: '#fff', border: `1px solid ${BLUE}` }
    : r.prize === 'kit'
      ? { background: BLUE_TINT, color: BLUE, border: `1px solid ${BLUE}55` }
      : { background: 'transparent', color: T.muted, border: '1px solid transparent' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
      borderTop: `1px solid ${T.paperEdge}`,
      borderBottom: lastPrize ? `2px solid ${BLUE}55` : undefined,
      background: mine ? BLUE_TINT : 'transparent',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 999, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.fontSerif, fontSize: 13.5, fontWeight: 700, ...disc,
      }}>{r.place}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: T.fontSerif, fontSize: 14.5, color: T.ink, fontWeight: mine ? 700 : 400,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{r.name}</div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 11, color: T.muted }}>
          {r.level} · {r.played} турн.
          {prize && <span style={{ color: BLUE, fontWeight: 700 }}> · {prize}</span>}
          {!prize && !r.fce_verified && r.place !== null && r.place <= 12 && (
            <span style={{ color: T.loss }}> · без регистрации приз уходит дальше</span>
          )}
        </div>
      </div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 700,
        color: r.rate >= 0 ? BLUE : T.loss, fontVariantNumeric: 'tabular-nums',
      }}>{fmtRate(r.rate)}</div>
    </div>
  );
}


function MyVouchers({ list }: { list: FceVoucher[] }) {
  const live = list.filter((v) => v.state === 'active' || v.state === 'locked');
  if (live.length === 0) return null;
  const active = live.filter((v) => v.state === 'active').length;
  const locked = live.length - active;
  return (
    <div style={{
      background: T.cream, border: `1px solid ${T.paperEdge}`, borderRadius: 12, padding: 14,
    }}>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 700,
        letterSpacing: '0.18em', color: T.muted,
      }}>МОИ БЕСПЛАТНЫЕ ИГРЫ</div>
      <div style={{
        marginTop: 6, fontFamily: T.fontSerif, fontSize: 22, fontWeight: 700,
        color: active ? BLUE : T.muted,
      }}>{live.length}</div>
      <div style={{ marginTop: 2, fontFamily: T.fontSerif, fontSize: 13.5, color: T.ink2, lineHeight: 1.5 }}>
        {locked > 0
          ? `${locked} из них откроется после регистрации на fce.global. Оплату игры подтверждает организатор.`
          : 'Скажи организатору перед игрой — он спишет её с твоего счёта.'}
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {live.slice(0, 5).map((v) => (
          <div key={v.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: T.fontDisplay, fontSize: 12.5, color: T.ink,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: 999, flexShrink: 0,
              background: v.state === 'active' ? BLUE : T.paperEdge,
            }} />
            <span style={{
              flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis', color: v.state === 'active' ? T.ink : T.muted,
            }}>{v.tournament ?? 'турнир'}</span>
            <span style={{ color: T.muted, fontSize: 11.5 }}>до {v.expires_at}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
