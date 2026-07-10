import { T } from '../lib/tokens';
import { ELabel, EGoldFrame } from '../lib/elegant';
import { LevelBadge } from '../components/Badges';
import { Avatar } from './PlayersScreen';
import { useJoinRequests, useReviewJoinRequest } from '../api/joinRequests';
import { useLevelSuggestions, useSetLevel, type LevelSuggestion } from '../api/levels';
import { useT } from '../lib/i18n';

interface Props {
  onBack: () => void;
}

export function AdminRequestsScreen({ onBack }: Props) {
  const t = useT();
  const { data, isLoading } = useJoinRequests('pending');
  const review = useReviewJoinRequest();
  const items = data?.items ?? [];
  const { data: sug, isLoading: sugLoading } = useLevelSuggestions();
  const suggestions = sug?.items ?? [];
  const nothing = !isLoading && !sugLoading && items.length === 0 && suggestions.length === 0;

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
        ) : items.length > 0 && (
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
                      {r.username && (
                        <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 12, color: T.muted, marginTop: 3 }}>
                          @{r.username}
                        </div>
                      )}
                    </div>
                    <button disabled={review.isPending}
                      onClick={() => review.mutate({ id: r.id, action: 'reject' })}
                      style={{
                        background: 'transparent', border: `1px solid ${T.rule}`, borderRadius: 999,
                        color: T.burgundy, padding: '6px 10px', cursor: 'pointer',
                        fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600,
                      }}>✕</button>
                    <button disabled={review.isPending}
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

        {suggestions.length > 0 && (
          <div style={{ marginTop: items.length > 0 ? 22 : 0 }}>
            <ELabel style={{ marginBottom: 4, paddingLeft: 2 }}>{t('admin.levelTitle')}</ELabel>
            <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted, margin: '0 0 8px 2px' }}>
              {t('admin.levelHint')}
            </div>
            <EGoldFrame>
              <div style={{ padding: '2px 0' }}>
                {suggestions.map((s, i) => (
                  <SuggestionRow key={s.player_id} s={s} last={i === suggestions.length - 1} />
                ))}
              </div>
            </EGoldFrame>
          </div>
        )}

        {nothing && (
          <div style={{
            textAlign: 'center', color: T.muted, fontFamily: T.fontSerif,
            fontStyle: 'italic', fontSize: 14, padding: 32,
          }}>{t('admin.noRequests')}</div>
        )}
      </div>
    </div>
  );
}

function SuggestionRow({ s, last }: { s: LevelSuggestion; last: boolean }) {
  const t = useT();
  const setLevel = useSetLevel();
  const down = s.kind === 'demote';
  const accent = down ? T.burgundy : T.emerald;
  const label = s.kind === 'assign' ? t('admin.sugAssign') : s.kind === 'promote' ? t('admin.sugUp') : t('admin.sugDown');
  const sub = s.kind === 'assign'
    ? t('admin.sugCalibrated', { g: s.games })
    : t('club.playsAs', { lvl: s.elo_level });
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
      borderBottom: last ? 'none' : `1px solid ${T.paperEdge}`, opacity: setLevel.isPending ? 0.6 : 1,
    }}>
      <Avatar name={s.name} size={36} photoUrl={s.photo_url} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 600, color: T.ink,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{s.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          {s.kind !== 'assign' && <LevelBadge level={s.level} size="sm" />}
          {s.kind !== 'assign' && <span style={{ color: T.textDim, fontSize: 12 }}>→</span>}
          <LevelBadge level={s.suggested} size="sm" />
          <span style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted, whiteSpace: 'nowrap' }}>
            · ELO {s.elo.toFixed(2)} · {sub}
          </span>
        </div>
      </div>
      <button disabled={setLevel.isPending}
        onClick={() => setLevel.mutate({ pid: s.player_id, level: s.suggested }, {
          onError: (e) => alert((e as Error).message),
        })}
        style={{
          background: accent, border: 'none', borderRadius: 999,
          color: T.cream, padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
          fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
        }}>{label} {s.suggested}</button>
    </div>
  );
}
