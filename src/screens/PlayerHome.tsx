import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useMe } from '../api/me';
import { usePlayerProfile } from '../api/players';
import { T } from '../lib/tokens';
import { EHero, EDivider, EGoldFrame, ELabel } from '../lib/elegant';
import { Avatar } from './PlayersScreen';
import { useT } from '../lib/i18n';
import type { ActiveTournamentResponse } from '../lib/types';

interface Props {
  onOpenProfile: () => void;
  onOpenClub: () => void;
  onOpenLiveRound: () => void;
}

// Personalized home for a linked, non-admin participant.
export function PlayerHome({ onOpenProfile, onOpenClub, onOpenLiveRound }: Props) {
  const tx = useT();
  const { data: me } = useMe();
  const pid = me?.player?.id;
  const { data: profile } = usePlayerProfile(pid ?? 0);
  const { data: active } = useQuery<ActiveTournamentResponse>({
    queryKey: ['active-tournament'],
    queryFn: () => api('/api/tournaments/active'),
  });

  if (!me?.player) return null;
  const s = profile?.stats;
  const t = active?.tournament;
  const round = active?.round;
  const totalRounds = t?.total_rounds ?? (t ? Math.max(t.current_round, 7) : 0);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '6px 16px 24px' }}>
      <EHero title="PADEL CLUB" compact />
      <EDivider />

      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <Avatar name={me.player.name} size={52} photoUrl={me.player.photo_url} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 600, color: T.ink,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{tx('home.hi', { name: me.player.name.split(/\s+/)[0] })}</div>
          {s && (
            <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginTop: 2 }}>
              {s.club_rank ? `${tx('profile.inClub', { n: s.club_rank })} · ` : ''}{tx('home.winsShort', { wr: Math.round(s.win_rate * 100) })}
            </div>
          )}
        </div>
      </div>

      {/* Form pills */}
      {s && s.form.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {s.form.map((r, i) => (
            <span key={i} style={{
              width: 20, height: 20, borderRadius: 999, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 700, color: T.cream,
              background: r === 'W' ? T.win : T.burgundy,
            }}>{r}</span>
          ))}
        </div>
      )}

      {/* Active tournament card */}
      {t && round && (
        <EGoldFrame style={{ marginTop: 18 }}>
          <div onClick={onOpenLiveRound} style={{ padding: '14px 16px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <ELabel color={T.emerald}>{tx('home.live')}</ELabel>
              <span style={{ color: T.gold }}>›</span>
            </div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 600, color: T.ink }}>{t.name}</div>
            <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginTop: 2 }}>
              {tx('home.round', { n: round.round_num, total: totalRounds })}
            </div>
          </div>
        </EGoldFrame>
      )}

      {/* Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
        <Shortcut label={tx('home.myCabinet')} sub={tx('home.myCabinetSub')} onClick={onOpenProfile} />
        <Shortcut label={tx('home.clubRating')} sub={tx('home.clubRatingSub')} onClick={onOpenClub} />
      </div>

      {!t && (
        <div style={{
          textAlign: 'center', fontFamily: T.fontSerif, fontStyle: 'italic',
          fontSize: 13, color: T.muted, marginTop: 22,
        }}>{tx('home.noActive')}</div>
      )}
    </div>
  );
}

function Shortcut({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', background: T.paper, border: `1px solid ${T.paperEdge}`,
      borderRadius: 14, padding: '14px 14px', cursor: 'pointer',
    }}>
      <div style={{ fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink }}>{label}</div>
      <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted, marginTop: 3 }}>{sub}</div>
    </button>
  );
}
