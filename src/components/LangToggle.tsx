import { T } from '../lib/tokens';
import { useLang, setLang, type Lang } from '../lib/i18n';

// Small EN | RU pill. Telegram auto-detects language; this is the manual override.
export function LangToggle() {
  const lang = useLang();
  const opts: Lang[] = ['en', 'ru'];
  return (
    <div style={{
      display: 'inline-flex', borderRadius: 999, border: `1px solid ${T.paperEdge}`,
      overflow: 'hidden', background: T.paper,
    }}>
      {opts.map((l) => {
        const active = l === lang;
        return (
          <button key={l} onClick={() => setLang(l)} style={{
            border: 'none', cursor: 'pointer', padding: '4px 10px',
            background: active ? T.emerald : 'transparent',
            color: active ? T.cream : T.muted,
            fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
          }}>{l.toUpperCase()}</button>
        );
      })}
    </div>
  );
}
