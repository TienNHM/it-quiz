import {useEffect, useRef, useState} from 'react';

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Rung nhẹ trên thiết bị hỗ trợ (bỏ qua nếu giảm chuyển động). */
export function haptic(pattern: number | number[] = 12) {
  try {
    if (!reduced()) navigator.vibrate?.(pattern);
  } catch {
    /* không hỗ trợ */
  }
}

/** Đếm số tăng dần tới `value` (easeOutCubic). */
export function CountUp({value, duration = 900, suffix = '', prefix = ''}: {value: number; duration?: number; suffix?: string; prefix?: string}) {
  const [shown, setShown] = useState(reduced() ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (reduced()) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(a + (value - a) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <>
      {prefix}
      {shown}
      {suffix}
    </>
  );
}

/** Vòng tròn điểm số, nét vẽ chạy từ 0 -> pct. */
export function ScoreRing({pct, size = 168}: {pct: number; size?: number}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 60);
    return () => clearTimeout(t);
  }, []);
  const good = pct >= 50;
  return (
    <div className="ring" style={{width: size, height: size}}>
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={good ? 'var(--ring-a)' : 'var(--danger)'} />
            <stop offset="100%" stopColor={good ? 'var(--ring-b)' : 'var(--warning)'} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ringg)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={on ? c * (1 - pct / 100) : c}
          transform="rotate(-90 60 60)"
          style={{transition: 'stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)'}}
        />
      </svg>
      <div className="ring-label">
        <CountUp value={pct} suffix="%" />
      </div>
    </div>
  );
}

/** Pháo giấy CSS thuần, chạy 1 lần rồi tự biến mất. */
export function Confetti({count = 36}: {count?: number}) {
  const [alive, setAlive] = useState(!reduced());
  useEffect(() => {
    const t = setTimeout(() => setAlive(false), 3200);
    return () => clearTimeout(t);
  }, []);
  if (!alive) return null;
  const colors = ['var(--gold)', 'var(--primary)', 'var(--success)', '#ff7aa8', '#7dd3fc'];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({length: count}, (_, i) => {
        const left = (i * 97) % 100;
        const delay = (i % 9) * 0.07;
        const dur = 1.8 + ((i * 13) % 10) / 10;
        const rot = (i * 53) % 360;
        const w = 6 + (i % 4) * 2;
        return (
          <i
            key={i}
            style={{
              left: `${left}%`,
              width: w,
              height: w * (i % 2 ? 1.8 : 1),
              background: colors[i % colors.length],
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
              ['--r' as string]: `${rot}deg`,
              ['--dx' as string]: `${((i * 31) % 80) - 40}px`,
              borderRadius: i % 3 === 0 ? '50%' : 2,
            }}
          />
        );
      })}
    </div>
  );
}
