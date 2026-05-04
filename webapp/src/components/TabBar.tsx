import { T } from '../lib/tokens';

type Tab = 'tournament' | 'players' | 'history';

interface Props { active: Tab; onChange: (t: Tab) => void }

export function TabBar({ active, onChange }: Props) {
  const tabs: { id: Tab; label: string; icon: (size: number, c: string) => React.ReactNode }[] = [
    { id: 'tournament', label: 'TOURNAMENT', icon: trophyIcon },
    { id: 'players', label: 'PLAYERS', icon: usersIcon },
    { id: 'history', label: 'HISTORY', icon: historyIcon },
  ];
  return (
    <div style={{
      borderTop: `1px solid ${T.border}`, background: T.bg,
      display: 'flex', padding: '8px 0 calc(env(safe-area-inset-bottom, 0px) + 12px)',
    }}>
      {tabs.map(t => {
        const isActive = t.id === active;
        const c = isActive ? T.accent : T.textDim;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: c, background: 'transparent', border: 'none', padding: 4,
          }}>
            {t.icon(22, c)}
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const trophyIcon = (s: number, c: string) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M7 4h10v4a5 5 0 11-10 0V4zM4 5h3v3a2 2 0 01-2 2H4V5zm16 0h-3v3a2 2 0 002 2h1V5zM10 14h4v3l1 3H9l1-3v-3z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);
const usersIcon = (s: number, c: string) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="8" r="3" stroke={c} strokeWidth="1.5"/>
    <path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 11a3 3 0 100-6M21 20c0-2.5-2-4.5-5-5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const historyIcon = (s: number, c: string) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M3 12a9 9 0 109-9c-2.5 0-4.7 1-6.4 2.6M3 4v5h5" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 7v5l3 2" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
