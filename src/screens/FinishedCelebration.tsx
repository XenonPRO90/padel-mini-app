import { T } from '../lib/tokens';
import { LevelBadge } from '../components/Badges';
import { Ring } from '../components/Ring';
import { MainCTA, SecondaryCTA } from '../components/MainCTA';
import { Label } from '../components/CourtCard';
import type { ScoredPlayer, Tournament } from '../lib/types';

interface Props {
  tournament: Tournament;
  leaderboard: ScoredPlayer[];
  onClose: () => void;
  onShare?: () => void;
}

export function FinishedCelebration({ tournament: t, leaderboard, onClose, onShare }: Props) {
  const top3 = leaderboard.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      background: `radial-gradient(ellipse at top, ${T.accent}18 0%, ${T.bg} 60%)`,
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Confetti */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 18 }).map((_, i) => {
          const left = (i * 53) % 100;
          const colors = [T.accent, T.warn, '#FFD24A', T.accentDim, '#fff'];
          return (
            <div key={i} style={{
              position: 'absolute', left: `${left}%`, top: -20,
              width: 6, height: 10, background: colors[i % colors.length],
              animation: `confettiFall ${3 + (i % 4) * 0.8}s linear ${i * 0.15}s infinite`,
              borderRadius: 1,
            }} />
          );
        })}
      </div>

      <div style={{ padding: '20px 20px 8px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ ...Label(), color: T.accent }}>TOURNAMENT COMPLETE</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>{t.name}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 16px', position: 'relative', zIndex: 1 }}>
        <Ring size={200} stroke={10} value={1} max={1}>
          <div style={{ fontSize: 56, fontWeight: 700, color: T.accent, fontVariantNumeric: 'tabular-nums' }}>
            100<span style={{ fontSize: 28, color: T.textDim }}>%</span>
          </div>
          <div style={{ ...Label(), marginTop: 4 }}>COMPLETE</div>
        </Ring>
      </div>

      <div style={{ padding: '0 20px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ ...Label(), color: T.textMuted }}>WINNERS</div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
        {top3.map((p, i) => (
          <div key={p.player_id} style={{
            background: i === 0 ? `${T.accent}10` : T.surface,
            border: `1px solid ${i === 0 ? T.accent : T.border}`,
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 28 }}>{medals[i]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? T.accent : T.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <LevelBadge level={p.level} size="sm" />
                <span style={{ fontSize: 11, color: T.textDim, fontVariantNumeric: 'tabular-nums' }}>✓{p.wins} ✗{p.losses}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: i === 0 ? T.accent : T.textPrimary, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {p.points}
              </div>
              <div style={{ ...Label(), fontSize: 9, marginTop: 4 }}>PTS</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: '8px 16px 16px', position: 'relative', zIndex: 1 }}>
        {onShare && <MainCTA label="SHARE FINAL TABLE" onClick={onShare} />}
        <div style={{ height: 8 }} />
        <SecondaryCTA label="BACK TO HOME" onClick={onClose} />
      </div>
    </div>
  );
}
