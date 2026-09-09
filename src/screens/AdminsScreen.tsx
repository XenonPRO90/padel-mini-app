import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAdmins, useAddAdmin, useRemoveAdmin, useSetAdminRole, type AdminRole } from '../api/admins';
import { useMe } from '../api/me';
import { T } from '../lib/tokens';
import { useT } from '../lib/i18n';
import { ELabel, EGoldFrame } from '../lib/elegant';
import { Avatar } from './PlayersScreen';
import type { Player } from '../lib/types';

// Full admins hand out and take back rights here, so the club doesn't need a
// server-side SQL edit every time it gains a host (Liza, 2026-09-07).
// The server enforces the same rules — this screen only explains them.

function tgConfirm(message: string): Promise<boolean> {
  const tg = window.Telegram?.WebApp;
  if (tg?.showConfirm) return new Promise((r) => tg.showConfirm!(message, (ok) => r(ok)));
  return Promise.resolve(window.confirm(message));
}

export function AdminsScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { data, isLoading } = useAdmins();
  const { data: me } = useMe();
  const setRole = useSetAdminRole();
  const removeAdmin = useRemoveAdmin();
  const [adding, setAdding] = useState(false);
  const busy = setRole.isPending || removeAdmin.isPending;

  const items = data?.items ?? [];
  const fail = (e: unknown) => alert((e as Error).message || t('common.error'));

  if (adding) return <AddAdmin onDone={() => setAdding(false)} existing={items.map((a) => a.player_id)} />;

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
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
            color: T.ink, letterSpacing: 3, textTransform: 'uppercase',
          }}>{t('admins.title')}</div>
        </div>
        <button onClick={() => setAdding(true)} style={{
          background: 'transparent', color: T.gold, border: `1px solid ${T.gold}`,
          borderRadius: 999, padding: '5px 11px', cursor: 'pointer',
          fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600, letterSpacing: 1,
        }}>+ {t('admins.add')}</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 40px' }}>
        <div style={{
          fontFamily: T.fontSerif, fontSize: 13.5, color: T.muted,
          lineHeight: 1.55, marginBottom: 14,
        }}>{t('admins.explain')}</div>

        {isLoading ? (
          <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
        ) : (
          <EGoldFrame>
            <div style={{ padding: '2px 0', opacity: busy ? 0.6 : 1, pointerEvents: busy ? 'none' : 'auto' }}>
              {items.map((a, i) => {
                const isMe = me?.user?.id === a.tg_id;
                return (
                  <div key={a.tg_id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                    borderBottom: i === items.length - 1 ? 'none' : `1px solid ${T.paperEdge}`,
                  }}>
                    <Avatar name={a.name ?? '?'} size={34} photoUrl={a.photo_url} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 600, color: T.ink,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {a.name ?? `id ${a.tg_id}`}
                        {isMe && <span style={{ color: T.muted, fontWeight: 400 }}> · {t('admins.you')}</span>}
                      </div>
                      <div style={{ fontFamily: T.fontSerif, fontSize: 12, color: T.muted }}>
                        {a.username ? `@${a.username}` : t('admins.noPlayer')}
                      </div>
                    </div>

                    <RolePill
                      role={a.role}
                      disabled={isMe}
                      onToggle={() => setRole.mutate(
                        { tg_id: a.tg_id, role: a.role === 'full' ? 'host' : 'full' },
                        { onError: fail },
                      )}
                    />

                    {!isMe && (
                      <button
                        aria-label={t('admins.remove')}
                        onClick={async () => {
                          const ok = await tgConfirm(
                            t('admins.removeConfirm', { name: a.name ?? String(a.tg_id) }));
                          if (ok) removeAdmin.mutate(a.tg_id, { onError: fail });
                        }}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: T.muted, fontSize: 18, lineHeight: 1, padding: '2px 4px',
                        }}>×</button>
                    )}
                  </div>
                );
              })}
            </div>
          </EGoldFrame>
        )}
      </div>
    </div>
  );
}

function RolePill({ role, disabled, onToggle }: {
  role: AdminRole; disabled: boolean; onToggle: () => void;
}) {
  const t = useT();
  const full = role === 'full';
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      title={disabled ? t('admins.selfLock') : t('admins.toggleHint')}
      style={{
        flex: 'none', cursor: disabled ? 'default' : 'pointer',
        background: full ? T.emerald : 'transparent',
        color: full ? T.cream : T.goldDeep,
        border: `1px solid ${full ? T.emerald : T.gold}`,
        borderRadius: 999, padding: '4px 10px',
        fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
        opacity: disabled ? 0.55 : 1,
      }}>{full ? t('admins.roleFull') : t('admins.roleHost')}</button>
  );
}

// Only linked players can be granted rights: without a Telegram id there is
// nothing to authorise against.
function AddAdmin({ onDone, existing }: { onDone: () => void; existing: (number | null)[] }) {
  const t = useT();
  const add = useAddAdmin();
  const [q, setQ] = useState('');
  // /api/players does not return telegram_id, so filtering this list on it
  // silently matched nobody and the picker was always empty. /api/players/linked
  // already means "has a linked Telegram", which is exactly the requirement.
  const { data, isLoading } = useQuery<{ items: Player[] }>({
    queryKey: ['players-linked'],
    queryFn: () => api('/api/players/linked'),
  });

  const taken = new Set(existing.filter((x): x is number => x !== null));
  const candidates = (data?.items ?? [])
    .filter((p) => !taken.has(p.id))
    .filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid ${T.paperEdge}`, background: T.cream,
      }}>
        <button onClick={onDone} style={{
          background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
          color: T.gold, fontFamily: T.fontSerif, fontSize: 14,
        }}>{t('common.cancel')}</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600,
            color: T.ink, letterSpacing: 3, textTransform: 'uppercase',
          }}>{t('admins.add')}</div>
        </div>
        <div style={{ width: 54 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 40px' }}>
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={t('admins.searchPh')}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 999,
            border: `1px solid ${T.paperEdge}`, background: T.paper, marginBottom: 12,
            fontFamily: T.fontDisplay, fontSize: 14, color: T.ink,
          }}
        />
        <ELabel style={{ marginBottom: 8, paddingLeft: 2 }}>{t('admins.onlyLinked')}</ELabel>

        {isLoading ? (
          <div className="skeleton" style={{ height: 180, borderRadius: 14 }} />
        ) : candidates.length === 0 ? (
          <div style={{
            fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 14,
            color: T.muted, textAlign: 'center', marginTop: 24,
          }}>{t('admins.noCandidates')}</div>
        ) : (
          <EGoldFrame>
            <div style={{ padding: '2px 0', opacity: add.isPending ? 0.6 : 1 }}>
              {candidates.map((p, i) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                  borderBottom: i === candidates.length - 1 ? 'none' : `1px solid ${T.paperEdge}`,
                }}>
                  <Avatar name={p.name} size={34} photoUrl={p.photo_url} />
                  <div style={{
                    flex: 1, minWidth: 0, fontFamily: T.fontDisplay, fontSize: 15,
                    fontWeight: 600, color: T.ink,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{p.name}</div>
                  {(['host', 'full'] as AdminRole[]).map((role) => (
                    <button key={role}
                      disabled={add.isPending}
                      onClick={() => add.mutate({ player_id: p.id, role }, {
                        onSuccess: onDone,
                        onError: (e) => alert((e as Error).message || t('common.error')),
                      })}
                      style={{
                        background: role === 'full' ? T.emerald : 'transparent',
                        color: role === 'full' ? T.cream : T.goldDeep,
                        border: `1px solid ${role === 'full' ? T.emerald : T.gold}`,
                        borderRadius: 999, padding: '4px 10px', cursor: 'pointer',
                        fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600,
                      }}>{role === 'full' ? t('admins.roleFull') : t('admins.roleHost')}</button>
                  ))}
                </div>
              ))}
            </div>
          </EGoldFrame>
        )}
      </div>
    </div>
  );
}
