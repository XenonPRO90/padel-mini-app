// Tiny fetch wrapper. Adds X-Init-Data header (validated by backend in prod).

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

function getInitData(): string {
  // @ts-expect-error Telegram global
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
