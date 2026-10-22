import { useMemo, useState } from 'react';
import { T } from '../lib/tokens';
import { useT, type StrKey } from '../lib/i18n';
import { useEloHistory } from '../api/players';
import type { EloPoint } from '../lib/types';

// Profile block: current ELO, progress to the next level and a per-tournament
// chart with the level thresholds drawn in. Visible on every profile — you
// can see what you are playing against (Roman, 2026-10-22).

type Period = 'm3' | 'm6' | 'all';
const PERIOD_DAYS: Record<Period, number | null> = { m3: 92, m6: 183, all: null };

const W = 340, H = 170, PAD_X = 6, PAD_TOP = 18, PAD_BOT = 8;

const ddmm = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}`;
const signed = (v: number, digits = 2) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toFixed(digits)}`;

export function EloChart({ pid }: { pid: number }) {
  const t = useT();
  const { data } = useEloHistory(pid);
  const [period, setPeriod] = useState<Period>('m3');
  const [sel, setSel] = useState<number | null>(null);
  // Period cut-offs count back from when the profile was opened.
  const [now] = useState(() => Date.now());

  const view = useMemo(() => {
    if (!data || !data.points.length || data.elo == null) return null;
    const days = PERIOD_DAYS[period];
    const cutoff = days ? new Date(now - days * 864e5).toISOString().slice(0, 10) : '';
    const pts: EloPoint[] = data.points.filter((p) => p.date >= cutoff);
    // The line starts from the rating going into the first tournament shown.
    const before = data.points.filter((p) => p.date < cutoff);
    const startVal = pts.length ? pts[0].elo_before : (before.length ? before[before.length - 1].elo_after : data.elo);
    const vals = [startVal, ...pts.map((p) => p.elo_after)];
    // Show the band just below and the next band so the reader sees where the
    // thresholds sit, without zooming the line flat.
    const lo0 = Math.min(...vals), hi0 = Math.max(...vals);
    const below = [...data.bands].reverse().find((b) => b.elo <= lo0 + 1e-9);
    const above = data.bands.find((b) => b.elo > hi0 + 1e-9);
    const lo = Math.min(lo0, below?.elo ?? lo0) - 0.03;
    const hi = Math.max(hi0, above?.elo ?? hi0) + 0.03;
    const bands = data.bands.filter((b) => b.elo >= lo && b.elo <= hi);
    return { pts, vals, lo, hi, bands, delta: vals[vals.length - 1] - vals[0] };
  }, [data, period, now]);

  if (!data || data.elo == null || !data.points.length || !view) return null;

  const { pts, vals, lo, hi, bands, delta } = view;
  const n = vals.length;
  const X = (i: number) => PAD_X + (W - 2 * PAD_X) * (n > 1 ? i / (n - 1) : 0.5);
  const Y = (v: number) => PAD_TOP + (H - PAD_TOP - PAD_BOT) * (hi - v) / (hi - lo);
  const line = vals.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${X(n - 1).toFixed(1)},${H} L${X(0).toFixed(1)},${H} Z`;

  // progress inside the current band
  const cur = [...data.bands].reverse().find((b) => b.elo <= data.elo! + 1e-9);
  const next = data.next;
  const progress = cur && next ? Math.max(0, Math.min(1, (data.elo - cur.elo) / (next.elo - cur.elo))) : 1;

  const all = data.points;
  const peak = all.reduce((a, p) => (p.elo_after > a.elo_after ? p : a), all[0]);
  const best = all.reduce((a, p) => (p.elo_after - p.elo_before > a.elo_after - a.elo_before ? p : a), all[0]);
  const selPt = sel != null ? pts[sel] : null;

  const tab = (p: Period) => (
    <button key={p} onClick={() => { setPeriod(p); setSel(null); }} style={{
      fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 700, letterSpacing: 0.6,
      padding: '4px 10px', cursor: 'pointer', borderRadius: 999,
      border: `1px solid ${period === p ? T.emeraldDeep : T.paperEdge}`,
      background: period === p ? T.emeraldDeep : 'transparent',
      color: period === p ? T.cream : T.muted,
    }}>{t(`elo.${p}` as StrKey)}</button>
  );

  const fact = (v: string, l: string) => (
    <div style={{
      background: T.cream, border: `1px solid ${T.paperEdge}`, borderRadius: 10,
      padding: '8px 4px', textAlign: 'center',
    }}>
      <div style={{ fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 700, color: T.emeraldDeep, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
      <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 11, color: T.muted, lineHeight: 1.15, marginTop: 2 }}>{l}</div>
    </div>
  );

  return (
    <div style={{
      background: T.paper, border: `1px solid ${T.paperEdge}`, borderRadius: 14,
      padding: '14px 14px 12px', marginBottom: 18,
    }}>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 10, fontWeight: 700, letterSpacing: 3,
        textTransform: 'uppercase', color: T.gold,
      }}>{t('elo.title')}</div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 }}>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 36, fontWeight: 800, color: T.emeraldDeep,
          lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>{data.elo.toFixed(3)}</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 700,
            color: delta > 0 ? T.win : delta < 0 ? T.burgundy : T.muted,
          }}>{signed(delta)}</div>
          <div style={{ fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 12, color: T.muted }}>{t('elo.forPeriod')}</div>
        </div>
      </div>

      {/* progress to the next level */}
      <div style={{ marginTop: 12 }}>
        <div style={{ height: 6, background: T.cream2, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: `${progress * 100}%`, height: '100%', borderRadius: 999,
            background: `linear-gradient(90deg, ${T.emerald}, ${T.gold})`,
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 4,
          fontFamily: T.fontSerif, fontSize: 12.5, color: T.muted,
        }}>
          <span>{cur ? `${cur.level} · ${cur.elo.toFixed(1)}` : ''}</span>
          <span>{next
            ? t('elo.toNext', { lvl: next.level, d: (next.elo - data.elo).toFixed(2) })
            : t('elo.top')}</span>
          <span>{next ? `${next.level} · ${next.elo.toFixed(1)}` : ''}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, margin: '12px 0 6px' }}>
        {(['m3', 'm6', 'all'] as Period[]).map(tab)}
      </div>

      {pts.length === 0 ? (
        <div style={{
          fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 13, color: T.muted,
          textAlign: 'center', padding: '28px 0',
        }}>{t('elo.empty')}</div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'manipulation' }}>
          {bands.map((b) => (
            <g key={b.level}>
              <line x1={PAD_X} x2={W - PAD_X} y1={Y(b.elo)} y2={Y(b.elo)}
                stroke={T.rule} strokeWidth={1} strokeDasharray="4 4" />
              <text x={W - PAD_X} y={Y(b.elo) - 4} textAnchor="end"
                fontFamily="Playfair Display, Georgia, serif" fontWeight={700} fontSize={10}
                fill={T.gold}>{b.level} · {b.elo.toFixed(1)}</text>
            </g>
          ))}
          <path d={area} fill={T.emerald} fillOpacity={0.07} />
          <path d={line} fill="none" stroke={T.emerald} strokeWidth={2.2}
            strokeLinejoin="round" strokeLinecap="round" />
          {sel != null && (
            <line x1={X(sel + 1)} x2={X(sel + 1)} y1={PAD_TOP - 6} y2={H}
              stroke={T.gold} strokeWidth={1} />
          )}
          {pts.map((p, i) => {
            const on = sel === i || (sel == null && i === pts.length - 1);
            return (
              <g key={p.tid} onClick={() => setSel(sel === i ? null : i)} style={{ cursor: 'pointer' }}>
                {/* generous invisible hit area for fingers */}
                <circle cx={X(i + 1)} cy={Y(p.elo_after)} r={12} fill="transparent" />
                <circle cx={X(i + 1)} cy={Y(p.elo_after)} r={on ? 4.5 : 2.2}
                  fill={on ? T.gold : T.emerald} stroke={T.paper} strokeWidth={on ? 1.5 : 0} />
              </g>
            );
          })}
        </svg>
      )}

      {selPt ? (
        <div style={{
          marginTop: 8, padding: '8px 10px', background: T.cream, borderRadius: 10,
          border: `1px solid ${T.paperEdge}`, display: 'flex', justifyContent: 'space-between',
          alignItems: 'baseline', gap: 8,
        }}>
          <div style={{ fontFamily: T.fontSerif, fontSize: 13, color: T.ink, minWidth: 0 }}>
            <b style={{ fontFamily: T.fontDisplay }}>{ddmm(selPt.date)}</b>
            <span style={{ color: T.muted }}> · {selPt.name}</span>
          </div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
            color: selPt.elo_after >= selPt.elo_before ? T.win : T.burgundy,
          }}>{signed(selPt.elo_after - selPt.elo_before, 3)} → {selPt.elo_after.toFixed(3)}</div>
        </div>
      ) : pts.length > 0 && (
        <div style={{
          marginTop: 6, fontFamily: T.fontSerif, fontStyle: 'italic', fontSize: 12,
          color: T.muted, textAlign: 'center',
        }}>{t('elo.tap')}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 10 }}>
        {fact(peak.elo_after.toFixed(3), `${t('elo.peak')} · ${ddmm(peak.date)}`)}
        {fact(signed(best.elo_after - best.elo_before, 3), `${t('elo.bestT')} · ${ddmm(best.date)}`)}
        {fact(String(all.length), t('elo.rated'))}
      </div>
    </div>
  );
}
