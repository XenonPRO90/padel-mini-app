import { T } from '../lib/tokens';
import { ETrophy, EPeopleIcon, EClockIcon } from '../lib/elegant';

type Tab = 'tournament' | 'players' | 'history';

interface Props { active: Tab; onChange: (t: Tab) => void }

export function TabBar({ active, onChange }: Props) {
  const tabs: { id: Tab; label: string; icon: (size: number, c: string) => React.ReactNode }[] = [
    { id: 'tournament', label: 'TOURNAMENT', icon: (s, c) => <ETrophy size={s} color={c} /> },
    { id: 'players',    label: 'PLAYERS',    icon: (s, c) => <EPeopleIcon size={s} color={c} /> },
    { id: 'history',    label: 'HISTORY',    icon: (s, c) => <EClockIcon size={s} color={c} /> },
  ];
  return (
    <div style={{
      borderTop: `1px solid ${T.rule}`,
      background: T.cream,
      display: 'flex',
      padding: '10px 0 calc(env(safe-area-inset-bottom, 0px) + 14px)',
    }}>
      {tabs.map(t => {
        const isActive = t.id === active;
        const c = isActive ? T.emerald : T.muted;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: c, background: 'transparent', border: 'none', padding: 4,
          }}>
            {t.icon(22, c)}
            <span style={{
              fontFamily: T.fontDisplay, fontSize: 9, fontWeight: 600,
              letterSpacing: '0.18em', color: c,
            }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
