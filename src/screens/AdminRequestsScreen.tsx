import { T } from '../lib/tokens';
import { ELabel, EGoldFrame } from '../lib/elegant';
import { LevelBadge } from '../components/Badges';
import { Avatar } from './PlayersScreen';
import { useJoinRequests, useReviewJoinRequest } from '../api/joinRequests';
import { useT } from '../lib/i18n';

interface Props {
  onBack: () => void;
}

export function AdminRequestsScreen({ onBack }: Props) {
  const t = useT();
  const { data, isLoading } = useJoinRequests('pending');
  const review = useReviewJoinRequest();
  const items = data?.items ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
          color: T.gold, fontFamily: T.fontSerif, fontSize: 14,
        }}>← {t('common.back')}</button>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
            color: T.ink, letterSpacing: 3, textTransform: 'uppercase',
          }}>{t('admin.requests')}</div>
        </div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px' }}>
        {isLoading ? (
          <div className="skeleton" style={{ height: 80, borderRadius: 14 }} />
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center', color: T.muted, fontFamily: T.fontSerif,
            fontStyle: 'italic', fontSize: 14, padding: 32,
          }}>{t('admin.noRequests')}</div>
        ) : (
          <>
            <ELabel style={{ marginBottom: 8, paddingLeft: 2 }}>{t('admin.pending', { n: items.length })}</ELabel>
            <EGoldFrame>
              <div style={{ padding: '2px 0', opacity: review.isPending ? 0.6 : 1 }}>
                {items.map((r, i) => (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                    borderBottom: i === items.length - 1 ? 'none' : `1px solid ${T.paperEdge}`,
                  }}>
                    <Avatar name={r.name} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 600, color: T.ink,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{r.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <LevelBadge level={r.level} size="sm" />
                        {r.username && (
                          <span style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 12, color: T.muted }}>
                            @{r.username}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      disabled={review.isPending}
                      onClick={() => review.mutate({ id: r.id, action: 'reject' })}
                      style={{
                        background: 'transparent', border: `1px solid ${T.rule}`, borderRadius: 999,
                        color: T.burgundy, padding: '6px 10px', cursor: 'pointer',
                        fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600,
                      }}>✕</button>
                    <button
                      disabled={review.isPending}
                      onClick={() => review.mutate({ id: r.id, action: 'approve' }, {
                        onError: (e) => alert((e as Error).message || t('admin.approveFail')),
                      })}
                      style={{
                        background: T.emerald, border: 'none', borderRadius: 999,
                        color: T.cream, padding: '6px 12px', cursor: 'pointer',
                        fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
                      }}>{t('admin.approve')}</button>
                  </div>
                ))}
              </div>
            </EGoldFrame>
          </>
        )}
      </div>
    </div>
  );
}
