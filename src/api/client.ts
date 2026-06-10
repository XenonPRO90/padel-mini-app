// Tiny fetch wrapper. Adds X-Init-Data header (validated by backend in prod).

const API_BASE = 'https://padel-api-dev.cryptostart.my'; // dev branch: hardcoded dev API (Vercel env overrides .env, so pin it here)

function getInitData(): string {
  return window.Telegram?.WebApp?.initData || '';
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Init-Data': getInitData(),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}
