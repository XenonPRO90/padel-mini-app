// Shared components for PADEL CLAUB
const { useState, useEffect, useRef, useMemo } = React;

// ─── Ring (radial progress) ────────────────────────────────
function Ring({ size = 240, stroke = 10, value = 0, max = 1, color = T.accent, children, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const dash = c * pct;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 800ms cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Level Badge ───────────────────────────────────────────
function LevelBadge({ level, size = 'md' }) {
  const cfg = T.levels[level] || T.levels['C'];
  const sizes = {
    sm: { padding: '2px 7px', fontSize: 10 },
    md: { padding: '3px 9px', fontSize: 11 },
    lg: { padding: '4px 11px', fontSize: 12 },
  };
  return (
    <span style={{
      background: cfg.bg, color: cfg.fg,
      borderRadius: 999, fontWeight: 700, letterSpacing: 0.4,
      ...sizes[size],
      display: 'inline-flex', alignItems: 'center',
    }}>{level}</span>
  );
}

// ─── Side Badge (R / L / U) ────────────────────────────────
function SideBadge({ side }) {
  const icons = {
    R: <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5h6m-2-2 2 2-2 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    L: <svg width="10" height="10" viewBox="0 0 10 10"><path d="M8 5H2m2-2-2 2 2 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    U: <svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 5h4m-2-2-2 2 2 2m0-4 2 2-2 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };
  return (
    <span style={{
      border: `1px solid ${T.border}`, color: T.textMuted,
      borderRadius: 999, padding: '2px 8px',
      fontWeight: 700, fontSize: 10, letterSpacing: 0.5,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {icons[side]}
      {side}
    </span>
  );
}

// ─── Icons ─────────────────────────────────────────────────
const Icon = {
  back: (s=20,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevR: (s=16,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  search: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={c} strokeWidth="1.5"/><path d="M20 20l-3-3" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  plus: (s=20,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  trophy: (s=24,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M7 4h10v4a5 5 0 11-10 0V4zM4 5h3v3a2 2 0 01-2 2H4V5zm16 0h-3v3a2 2 0 002 2h1V5zM10 14h4v3l1 3H9l1-3v-3z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  home: (s=22,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-9z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  users: (s=22,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke={c} strokeWidth="1.5"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 11a3 3 0 100-6M21 20c0-2.5-2-4.5-5-5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  history: (s=22,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 109-9c-2.5 0-4.7 1-6.4 2.6M3 4v5h5" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 7v5l3 2" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  share: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 4v12M7 9l5-5 5 5M5 16v3a1 1 0 001 1h12a1 1 0 001-1v-3" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  edit: (s=16,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  trash: (s=16,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0v12a1 1 0 001 1h8a1 1 0 001-1V7" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: (s=14,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 6" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  x: (s=14,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
  medal1: (s=16) => <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="14" r="7" fill="#FFD24A" stroke="#A87C00" strokeWidth="1"/><path d="M8 4l4 7 4-7" fill="none" stroke="#FFD24A" strokeWidth="1.5"/><text x="12" y="17" textAnchor="middle" fontSize="8" fontWeight="700" fill="#7A4F00">1</text></svg>,
  medal2: (s=16) => <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="14" r="7" fill="#C7CDD3" stroke="#7A8290" strokeWidth="1"/><text x="12" y="17" textAnchor="middle" fontSize="8" fontWeight="700" fill="#3a3f47">2</text></svg>,
  medal3: (s=16) => <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="14" r="7" fill="#D49764" stroke="#7A4F1A" strokeWidth="1"/><text x="12" y="17" textAnchor="middle" fontSize="8" fontWeight="700" fill="#3F2200">3</text></svg>,
  bell: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 16V11a6 6 0 1112 0v5l1.5 2h-15L6 16zM10 20a2 2 0 004 0" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrowR: (s=14,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-5-5 5 5-5 5" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ─── Avatar ────────────────────────────────────────────────
function Avatar({ name, size = 40, level }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0,2).map(p => p[0]).join('').toUpperCase();
  // hash hue from name
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, oklch(0.45 0.06 ${hue}), oklch(0.32 0.04 ${hue}))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: T.textPrimary, fontWeight: 600, fontSize: size * 0.38,
      letterSpacing: -0.02, flexShrink: 0,
      border: `1px solid ${T.border}`,
    }}>{initials}</div>
  );
}

// ─── StatusBar (slim, dark) ────────────────────────────────
function StatusBar() {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 24px 8px', fontSize: 15, fontWeight: 600, color: T.textPrimary,
    }}>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', opacity: 0.9 }}>
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="0.5" fill="#F2F4F7"/><rect x="4.5" y="5" width="3" height="6" rx="0.5" fill="#F2F4F7"/><rect x="9" y="2.5" width="3" height="8.5" rx="0.5" fill="#F2F4F7"/><rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="#F2F4F7"/></svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="#F2F4F7"><path d="M7.5 3c1.7 0 3.2.7 4.4 1.8l1-1A8 8 0 007.5 1.5 8 8 0 002.1 3.8l1 1A6 6 0 017.5 3z"/><path d="M7.5 6.3c.9 0 1.7.4 2.3.9l1-1a5 5 0 00-3.3-1.3 5 5 0 00-3.3 1.3l1 1c.6-.5 1.4-.9 2.3-.9z"/><circle cx="7.5" cy="9.3" r="1.2"/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="#F2F4F7" fill="none" opacity="0.5"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#F2F4F7"/><path d="M23 4v4c.7-.3 1.2-.9 1.2-2s-.5-1.7-1.2-2z" fill="#F2F4F7" opacity="0.5"/></svg>
      </div>
    </div>
  );
}

// ─── Phone frame (Telegram WebApp style — minimal chrome) ───
function Phone({ children, height = 800, scrollable = true, label }) {
  return (
    <div style={{
      width: 390, height,
      background: T.bg, borderRadius: 40, position: 'relative',
      overflow: 'hidden', border: `1px solid #1a1d24`,
      boxShadow: '0 30px 70px rgba(0,0,0,0.45), 0 0 0 8px #0a0c10, 0 0 0 9px #1f242c',
      display: 'flex', flexDirection: 'column',
    }} className="padel-app">
      <StatusBar/>
      <div style={{
        flex: 1, overflow: scrollable ? 'auto' : 'hidden',
        position: 'relative',
      }}>{children}</div>
      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <div style={{ width: 130, height: 4, borderRadius: 2, background: 'rgba(242,244,247,0.45)' }}/>
      </div>
    </div>
  );
}

// ─── Bottom Tab Bar ────────────────────────────────────────
function TabBar({ active = 'tournament' }) {
  const tabs = [
    { id: 'tournament', label: 'TOURNAMENT', icon: Icon.trophy },
    { id: 'players', label: 'PLAYERS', icon: Icon.users },
    { id: 'history', label: 'HISTORY', icon: Icon.history },
  ];
  return (
    <div style={{
      borderTop: `1px solid ${T.border}`, background: T.bg,
      display: 'flex', padding: '8px 0 24px',
    }}>
      {tabs.map(t => {
        const isActive = t.id === active;
        const c = isActive ? T.accent : T.textDim;
        return (
          <div key={t.id} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: c,
          }}>
            {t.icon(22, c)}
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em' }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── MainButton (Telegram bottom CTA) ──────────────────────
function MainButton({ label, disabled, color, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', height: 50, borderRadius: 12, border: 'none',
      background: disabled ? T.surface2 : (color || T.accent),
      color: disabled ? T.textMuted : '#0B0E12',
      fontWeight: 700, fontSize: 13, letterSpacing: '0.1em',
      textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>{label}</button>
  );
}

// ─── Secondary button ──────────────────────────────────────
function SecondaryButton({ label, danger, fullWidth = true, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: fullWidth ? '100%' : 'auto', height: 48, borderRadius: 12,
      border: `1px solid ${danger ? T.loss : T.border}`,
      background: 'transparent', color: danger ? T.loss : T.textPrimary,
      fontWeight: 600, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '0 18px',
    }}>{label}</button>
  );
}

// ─── Court Card ────────────────────────────────────────────
function CourtCard({
  court, points,
  team1, team2,
  status = 'pending', // 'pending' | 'team1' | 'team2' | 'history-t1' | 'history-t2'
  medal,
  small = false,
}) {
  const isWinner = status === 'team1' || status === 'team2' || status === 'history-t1' || status === 'history-t2';
  const winnerSide = status === 'team1' || status === 'history-t1' ? 1
                   : status === 'team2' || status === 'history-t2' ? 2 : null;
  const readonly = status.startsWith('history');
  const teamColor = (n) => {
    if (winnerSide === null) return T.textPrimary;
    return winnerSide === n ? T.accent : T.textDim;
  };

  return (
    <div className="card" style={{
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="label" style={{ fontSize: 11 }}>COURT {court}</span>
          {medal === 1 && Icon.medal1(14)}
          {medal === 2 && Icon.medal2(14)}
          {medal === 3 && Icon.medal3(14)}
        </div>
        <span className="num" style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '0.08em' }}>
          {points} PTS
        </span>
      </div>

      {/* teams */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <TeamRow team={team1} color={teamColor(1)} winner={winnerSide === 1}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: T.border }}/>
          <span className="label" style={{ fontSize: 9, color: T.textDim }}>VS</span>
          <div style={{ flex: 1, height: 1, background: T.border }}/>
        </div>
        <TeamRow team={team2} color={teamColor(2)} winner={winnerSide === 2}/>
      </div>

      {/* status footer */}
      <div style={{ marginTop: 2 }}>
        {status === 'pending' ? (
          <div style={{
            border: `1px dashed ${T.border}`, borderRadius: 8,
            padding: '8px 10px', textAlign: 'center',
            fontSize: 10, fontWeight: 600, color: T.textMuted,
            letterSpacing: '0.16em',
          }}>PENDING</div>
        ) : (
          <div style={{
            background: isWinner ? `${T.accent}14` : 'transparent',
            border: `1px solid ${T.accent}40`, borderRadius: 8,
            padding: '8px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: T.accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
          }}>
            {Icon.check(11, T.accent)} TEAM {winnerSide} WON
          </div>
        )}
      </div>
    </div>
  );
}

function TeamRow({ team, color, winner }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {team.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: T.textDim, fontSize: 12, fontWeight: 500 }}>·</span>}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{
              fontSize: 14, fontWeight: 600, color,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{p.name}</span>
            <LevelBadge level={p.level} size="sm"/>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Leaderboard row ───────────────────────────────────────
function LeaderboardRow({ rank, name, level, points, max, w, l }) {
  const pct = max ? points / max : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
      <div style={{
        width: 22, fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.1em',
      }} className="num">#{rank}</div>
      <div style={{
        width: 3, height: 28, background: T.accent, borderRadius: 2,
        opacity: 0.3 + 0.7 * pct,
      }}/>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: T.textPrimary }}>{name}</span>
        <LevelBadge level={level} size="sm"/>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="num" style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, lineHeight: 1 }}>{points}</div>
        <div className="num" style={{ fontSize: 10, color: T.textDim, marginTop: 2, letterSpacing: '0.05em' }}>
          ✓{w}  ✗{l}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Ring, LevelBadge, SideBadge, Icon, Avatar, StatusBar, Phone, TabBar, MainButton, SecondaryButton, CourtCard, TeamRow, LeaderboardRow });
