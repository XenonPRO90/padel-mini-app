import { T } from '../lib/tokens';
import { useT } from '../lib/i18n';
import { useCasualPending, useConfirmCasual } from '../api/casual';

// Shows casual sessions awaiting THIS player's confirmation, with confirm/dispute.
// Renders nothing if there are none.
export function CasualPendingBanner() {
  const t = useT();
  const { data } = useCasualPending();
  const confirm = useConfirmCasual();
  const items = data?.items ?? [];
  if (!items.length) return null;

  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((s) => (
        <div key={s.id} style={{
          background: T.paper, border: `1px solid ${T.gold}`, borderRadius: 14, padding: '12px 14px',
        }}>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink }}>
            {t('casual.confirmTitle')} <span style={{ color: T.muted, fontWeight: 400 }}>{t('casual.confirmFrom', { name: s.author })}</span>
          </div>
          <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {s.games.map((g, i) => (
              <div key={i} style={{ fontFamily: T.fontSerif, fontSize: 13, color: T.ink }}>
                {g.team1[0]}/{g.team1[1]} <b style={{ color: T.goldDeep }}>{g.score1}:{g.score2}</b> {g.team2[0]}/{g.team2[1]}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={confirm.isPending}
              onClick={() => confirm.mutate({ sid: s.id, ok: true })}
              style={{ flex: 1, padding: '9px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: T.emerald, color: T.cream, fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600 }}>
              {t('casual.confirm')}
            </button>
            <button disabled={confirm.isPending}
              onClick={() => confirm.mutate({ sid: s.id, ok: false })}
              style={{ padding: '9px 16px', borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${T.rule}`, background: 'transparent', color: T.burgundy,
                fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600 }}>
              {t('casual.dispute')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
