import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TabBar } from './components/TabBar';
import { HomeScreen } from './screens/HomeScreen';
import { PlayersScreen } from './screens/PlayersScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { LiveRoundScreen } from './screens/LiveRoundScreen';
import { PlayerEditScreen } from './screens/PlayerEditScreen';
import { PlayerProfileScreen } from './screens/PlayerProfileScreen';
import { AdminRequestsScreen } from './screens/AdminRequestsScreen';
import { ClubScreen } from './screens/ClubScreen';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { PlayerHome } from './screens/PlayerHome';
import { WizardScreen } from './screens/WizardScreen';
import { TournamentDetailScreen } from './screens/TournamentDetailScreen';
import { RoundDetailScreen } from './screens/RoundDetailScreen';
import { CelebrationScreen } from './screens/CelebrationScreen';
import { SchedulePosterScreen } from './screens/SchedulePosterScreen';
import { useMe } from './api/me';
import { T } from './lib/tokens';
import type { Player } from './lib/types';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 5_000, retry: 1 } },
});

type Tab = 'tournament' | 'players' | 'club' | 'history';

type Screen =
  | { name: 'home' }
  | { name: 'liveRound' }
  | { name: 'wizard' }
  | { name: 'playerEdit'; player: Player | null }
  | { name: 'playerProfile'; player: Player }
  | { name: 'myProfile' }
  | { name: 'adminRequests' }
  | { name: 'tournamentDetail'; tid: number }
  | { name: 'roundDetail'; tid: number; roundNum: number; mode?: string }
  | { name: 'celebration'; tid: number }
  | { name: 'schedulePoster' };

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initData: string;
        themeParams?: Record<string, string>;
        setHeaderColor?: (c: string) => void;
        setBackgroundColor?: (c: string) => void;
        HapticFeedback?: { impactOccurred?: (style: string) => void };
        showConfirm?: (message: string, cb: (ok: boolean) => void) => void;
        openTelegramLink?: (url: string) => void;
        BackButton?: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
      };
    };
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('tournament');
  const [stack, setStack] = useState<Screen[]>([{ name: 'home' }]);

  const top = stack[stack.length - 1];
  const push = (s: Screen) => setStack((prev) => [...prev, s]);
  const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        tg.setHeaderColor?.(T.bg);
        tg.setBackgroundColor?.(T.bg);
      } catch { /* not in Telegram */ }
    }
  }, []);

  // Telegram BackButton wiring: show on inner screens, fire pop on tap
  useEffect(() => {
    const back = window.Telegram?.WebApp?.BackButton;
    if (!back) return;
    const goBack = () => pop();
    if (top.name !== 'home') {
      back.show();
      back.onClick(goBack);
    } else {
      back.hide();
    }
    return () => back.offClick(goBack);
  }, [top.name]);

  const showTabBar = top.name === 'home';

  return (
    <QueryClientProvider client={qc}>
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        background: T.bg, color: T.textPrimary,
      }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {top.name === 'home' && tab === 'tournament' && (
            <HomeRouter
              onOpenLiveRound={() => push({ name: 'liveRound' })}
              onCreateTournament={() => push({ name: 'wizard' })}
              onTournamentFinished={(tid) => setStack([{ name: 'home' }, { name: 'celebration', tid }])}
              onOpenMyProfile={(p) => push({ name: 'playerProfile', player: p })}
              onOpenClub={() => setTab('club')}
            />
          )}
          {top.name === 'home' && tab === 'players' && (
            <PlayersScreen
              onOpenPlayer={(p) => push({ name: 'playerProfile', player: p })}
              onAddPlayer={() => push({ name: 'playerEdit', player: null })}
              onOpenRequests={() => push({ name: 'adminRequests' })}
            />
          )}
          {top.name === 'home' && tab === 'club' && (
            <ClubScreen
              onOpenPlayer={(p) => push({ name: 'playerProfile', player: p })}
              onOpenTournament={(tid) => push({ name: 'tournamentDetail', tid })}
            />
          )}
          {top.name === 'home' && tab === 'history' && (
            <HistoryScreen
              onOpenTournament={(tid) => push({ name: 'tournamentDetail', tid })}
            />
          )}
          {top.name === 'liveRound' && (
            <LiveRoundScreen
              onBack={pop}
              onShareSchedule={() => push({ name: 'schedulePoster' })}
            />
          )}
          {top.name === 'wizard' && (
            <WizardScreen onClose={pop} />
          )}
          {top.name === 'playerEdit' && (
            <PlayerEditScreen player={top.player} onClose={pop} />
          )}
          {top.name === 'myProfile' && (
            <MyCabinet
              onBack={pop}
              onOpenTournament={(tid) => push({ name: 'tournamentDetail', tid })}
              onEdit={(p) => push({ name: 'playerEdit', player: p })}
            />
          )}
          {top.name === 'adminRequests' && (
            <AdminRequestsScreen onBack={pop} />
          )}
          {top.name === 'playerProfile' && (
            <PlayerProfileScreen
              pid={top.player.id}
              onBack={pop}
              onEdit={() => push({ name: 'playerEdit', player: top.player })}
              onOpenTournament={(tid) => push({ name: 'tournamentDetail', tid })}
            />
          )}
          {top.name === 'tournamentDetail' && (
            <TournamentDetailScreen
              tid={top.tid}
              onBack={pop}
              onOpenRound={(rn, mode) => push({ name: 'roundDetail', tid: top.tid, roundNum: rn, mode })}
            />
          )}
          {top.name === 'roundDetail' && (
            <RoundDetailScreen tid={top.tid} roundNum={top.roundNum} mode={top.mode} onBack={pop} />
          )}
          {top.name === 'celebration' && (
            <CelebrationScreen tid={top.tid} onClose={pop} />
          )}
          {top.name === 'schedulePoster' && (
            <SchedulePosterScreen onClose={pop} />
          )}
        </div>
        {showTabBar && (
          <TabBar
            active={tab}
            onChange={(t) => { if (t === 'cabinet') push({ name: 'myProfile' }); else setTab(t); }}
          />
        )}
      </div>
    </QueryClientProvider>
  );
}

// Role-aware first screen (the 'tournament' tab). Inside the provider so it can
// read /api/me: admins → management home, linked players → personal dashboard,
// brand-new users → welcome + join.
function HomeRouter({ onOpenLiveRound, onCreateTournament, onTournamentFinished, onOpenMyProfile, onOpenClub }: {
  onOpenLiveRound: () => void;
  onCreateTournament: () => void;
  onTournamentFinished: (tid: number) => void;
  onOpenMyProfile: (p: Player) => void;
  onOpenClub: () => void;
}) {
  const { data: me, isLoading } = useMe();
  if (isLoading) return null;
  if (me && !me.is_admin && me.player) {
    return (
      <PlayerHome
        onOpenProfile={() => onOpenMyProfile(me.player!)}
        onOpenClub={onOpenClub}
        onOpenLiveRound={onOpenLiveRound}
      />
    );
  }
  if (me && !me.is_admin && !me.player) {
    return <WelcomeScreen />;
  }
  return (
    <HomeScreen
      onOpenLiveRound={onOpenLiveRound}
      onCreateTournament={onCreateTournament}
      onTournamentFinished={onTournamentFinished}
    />
  );
}

// Personal cabinet entry: resolves the current user's linked player and shows
// their profile. Lives inside the provider so it can read /api/me.
function MyCabinet({ onBack, onOpenTournament, onEdit }: {
  onBack: () => void;
  onOpenTournament: (tid: number) => void;
  onEdit: (p: Player) => void;
}) {
  const { data: me, isLoading } = useMe();
  if (isLoading) return null;
  if (!me?.player) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center', color: '#7c7468',
        fontFamily: 'Georgia, serif', fontStyle: 'italic',
      }}>Профиль не привязан</div>
    );
  }
  return (
    <PlayerProfileScreen
      pid={me.player.id}
      onBack={onBack}
      onEdit={() => onEdit(me.player!)}
      onOpenTournament={onOpenTournament}
    />
  );
}
