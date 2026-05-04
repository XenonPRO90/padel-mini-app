// Design tokens for PADEL CLAUB — Whoop-inspired dark theme

const T = {
  bg: '#0B0E12',
  surface: '#141820',
  surface2: '#1B2029',
  border: '#252B36',
  textPrimary: '#F2F4F7',
  textMuted: '#7A8290',
  textDim: '#4B5260',
  accent: '#08FFC8',
  accentDim: '#04D4A6',
  win: '#08FFC8',
  loss: '#FF4D6D',
  warn: '#FFB400',

  // level badges
  levels: {
    'A+':       { bg: '#08FFC8', fg: '#0B0E12' },
    'A':        { bg: '#04D4A6', fg: '#0B0E12' },
    'B+':       { bg: '#00A37F', fg: '#F2F4F7' },
    'B':        { bg: '#3D7A6B', fg: '#F2F4F7' },
    'C+':       { bg: '#5A6B73', fg: '#F2F4F7' },
    'C':        { bg: '#4B5260', fg: '#F2F4F7' },
    'C-strong': { bg: '#3F454F', fg: '#F2F4F7' },
    'C-':       { bg: '#33383F', fg: '#F2F4F7' },
    'D':        { bg: '#252B36', fg: '#7A8290' },
  },

  font: '"Inter", -apple-system, system-ui, sans-serif',
  fontMono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

window.T = T;

// Inject base CSS once
if (typeof document !== 'undefined' && !document.getElementById('padel-tokens')) {
  const s = document.createElement('style');
  s.id = 'padel-tokens';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    .padel-app, .padel-app * { box-sizing: border-box; }
    .padel-app {
      font-family: ${T.font};
      color: ${T.textPrimary};
      background: ${T.bg};
      -webkit-font-smoothing: antialiased;
      letter-spacing: -0.01em;
    }
    .padel-app .label {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.14em;
      color: ${T.textMuted};
      text-transform: uppercase;
    }
    .padel-app .label-sm {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.16em;
      color: ${T.textMuted};
      text-transform: uppercase;
    }
    .padel-app .num {
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum";
      letter-spacing: -0.02em;
    }
    .padel-app .card {
      background: ${T.surface};
      border: 1px solid ${T.border};
      border-radius: 16px;
    }
    .padel-app .divider { height: 1px; background: ${T.border}; }
    .padel-app .pill {
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .padel-app button { font-family: inherit; cursor: pointer; }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .padel-skeleton {
      background: linear-gradient(90deg, ${T.surface} 0%, ${T.surface2} 50%, ${T.surface} 100%);
      background-size: 200% 100%;
      animation: shimmer 2s linear infinite;
      border-radius: 8px;
    }
    @keyframes ringFill {
      from { stroke-dashoffset: var(--circ); }
    }
    .ring-fill { animation: ringFill 800ms cubic-bezier(.4,.0,.2,1) both; }
    @keyframes confettiFall {
      0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(900px) rotate(720deg); opacity: 0; }
    }
  `;
  document.head.appendChild(s);
}
