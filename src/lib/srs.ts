import type {CardState} from './types';

export const MAX_BOX = 5;
const MIN = 60_000;
const DAY = 86_400_000;
/** Khoảng ôn theo hộp Leitner: 0 = 10 phút, 1 = 1 ngày, 2 = 3, 3 = 7, 4 = 14, 5 = 30 ngày. */
export const BOX_INTERVALS_MS: readonly number[] = [10 * MIN, 1 * DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];

export const emptyCard = (): CardState => ({box: 0, seen: 0, correct: 0, wrong: 0, last: 0, due: 0});

/** Cập nhật thẻ sau một lần trả lời: đúng -> box+1, sai -> box 0. */
export function nextCard(card: CardState | undefined, correct: boolean, now: number): CardState {
  const c = card ?? emptyCard();
  const box = correct ? Math.min(MAX_BOX, c.box + 1) : 0;
  return {
    box,
    seen: c.seen + 1,
    correct: c.correct + (correct ? 1 : 0),
    wrong: c.wrong + (correct ? 0 : 1),
    last: now,
    due: now + BOX_INTERVALS_MS[box],
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' theo giờ local. */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Ngày hôm trước (giờ local) của timestamp. */
export function prevDayKey(ts: number): string {
  const d = new Date(ts);
  d.setDate(d.getDate() - 1);
  return dayKey(d.getTime());
}
