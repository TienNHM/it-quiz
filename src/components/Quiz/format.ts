export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}
export const pct = (n: number, d: number): number => (d > 0 ? Math.round((n / d) * 100) : 0);
