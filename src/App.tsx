import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TabBar } from './components/TabBar';
import { HomeScreen } from './screens/HomeScreen';
import { PlayersScreen } from './screens/PlayersScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { T } from './lib/tokens';

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000, retry: 1 } },
});

type Tab = 'tournament' | 'players' | 'history';

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
      };
    };
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('tournament');

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

  return (
    <QueryClientProvider client={qc}>
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        background: T.bg, color: T.textPrimary,
      }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {tab === 'tournament' && <HomeScreen />}
          {tab === 'players' && <PlayersScreen />}
          {tab === 'history' && <HistoryScreen />}
        </div>
        <TabBar active={tab} onChange={setTab} />
      </div>
    </QueryClientProvider>
  );
}
