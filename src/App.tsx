import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TabBar } from './components/TabBar';
import { HomeScreen } from './screens/HomeScreen';
import { PlayersScreen } from './screens/PlayersScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { LiveRoundScreen } from './screens/LiveRoundScreen';
import { T } from './lib/tokens';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 5_000, retry: 1 } },
});

type Tab = 'tournament' | 'players' | 'history';
type Screen = 'home' | 'liveRound';

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
  const [screen, setScreen] = useState<Screen>('home');

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        tg.setHeaderColor?.(T.bg);
        tg.setBackgroundColor?.(T.bg);
      } catch { /* not in Telegram, fine */ }
    }
  }, []);

  // Telegram BackButton wiring: show on inner screens, fire goHome on tap
  useEffect(() => {
    const back = window.Telegram?.WebApp?.BackButton;
    if (!back) return;
    const goHome = () => setScreen('home');
    if (screen !== 'home') {
      back.show();
      back.onClick(goHome);
    } else {
      back.hide();
    }
    return () => back.offClick(goHome);
  }, [screen]);

  return (
    <QueryClientProvider client={qc}>
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        background: T.bg, color: T.textPrimary,
      }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {tab === 'tournament' && screen === 'home' && (
            <HomeScreen onOpenLiveRound={() => setScreen('liveRound')} />
          )}
          {tab === 'tournament' && screen === 'liveRound' && (
            <LiveRoundScreen onBack={() => setScreen('home')} />
          )}
          {tab === 'players' && <PlayersScreen />}
          {tab === 'history' && <HistoryScreen />}
        </div>
        {screen === 'home' && (
          <TabBar active={tab} onChange={(t) => { setTab(t); setScreen('home'); }} />
        )}
      </div>
    </QueryClientProvider>
  );
}
