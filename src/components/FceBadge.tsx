// The sponsor's mark, shown beside a player who finished KYC on fce.global.
// Public for the duration of the programme (Roman, 2026-11-25). The geometric
// mark is used rather than the full lockup: at 14px a wordmark is a smudge.
const FCE_BLUE = '#1e78f0';

export function FceBadge({ size = 16, title = 'FCE verified' }: { size?: number; title?: string }) {
  return (
    <span
      title={title}
      aria-label={title}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, borderRadius: 999, flexShrink: 0,
        background: '#ffffff', border: `1px solid ${FCE_BLUE}33`,
      }}
    >
      <svg viewBox="6.3 2.3 80.4 85.4" width={size * 0.58} height={size * 0.58} aria-hidden="true">
        <g fill={FCE_BLUE}>
          <path d="M48.3,10.9v76.8l38.4-38.4L48.3,10.9z" />
          <polygon points="41.2,72.1 41.2,55.6 22.8,37.2 41.2,18.9 41.2,2.3 6.3,37.2" />
        </g>
      </svg>
    </span>
  );
}
