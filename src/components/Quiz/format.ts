export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}
export const pct = (n: number, d: number): number => (d > 0 ? Math.round((n / d) * 100) : 0);

const ORD: Record<string, number> = {nhất: 0, đầu: 0, hai: 1, ba: 2, tư: 3, bốn: 3, cuối: -1};

/**
 * Lời giải hay viết "Phương án 2 sai", "phương án cuối...". Khi app xáo trộn phương án, số/vị trí đó không còn đúng,
 * nên đổi sang vị trí đang hiển thị (order[i] = index gốc của phương án ở vị trí i).
 */
export function localizeExplanation(text: string, order: number[]): string {
  const n = order.length;
  if (n < 2 || order.every((o, i) => o === i)) return text;
  const shown = (orig: number) => order.indexOf(orig) + 1;
  return text.replace(/(?<![\p{L}\d])(Phương án|phương án|Đáp án|đáp án)\s+(?:thứ\s+)?(?:(\d)|(nhất|đầu|hai|ba|tư|bốn|cuối))(?![\p{L}\d`])/gu, (m, word: string, digit?: string, ord?: string) => {
    const orig = digit !== undefined ? Number(digit) - 1 : ORD[ord!] === -1 ? n - 1 : ORD[ord!];
    if (orig < 0 || orig >= n) return m;
    return `${word} ${shown(orig)}`;
  });
}
