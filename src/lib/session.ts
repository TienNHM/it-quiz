import {getChapterQuestions, getSubject, getSubjectQuestions} from './content';
import {commitProgress, getProgress, MAX_HISTORY} from './progress';
import {dayKey, nextCard, prevDayKey} from './srs';
import type {AnswerRecord, Mode, PlayQuestion, Question, Session, SessionResult} from './types';

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const answerSet = (q: Question): number[] => (Array.isArray(q.answer) ? q.answer : [q.answer]);

export function toOriginal(item: PlayQuestion, pickedDisplay: number[]): number[] {
  return pickedDisplay.map((d) => item.order[d]).filter((v) => v !== undefined);
}

export function isCorrect(item: PlayQuestion, pickedDisplay: number[]): boolean {
  const picked = new Set(toOriginal(item, pickedDisplay));
  const ans = new Set(answerSet(item.q));
  if (picked.size === 0 || picked.size !== ans.size) return false;
  for (const a of ans) if (!picked.has(a)) return false;
  return true;
}

export function correctDisplayIndices(item: PlayQuestion): number[] {
  const ans = new Set(answerSet(item.q));
  const out: number[] = [];
  item.order.forEach((orig, d) => {
    if (ans.has(orig)) out.push(d);
  });
  return out;
}

const MODE_TITLE: Record<Mode, string> = {
  practice: 'Luyện tập',
  exam: 'Thi thử',
  review: 'Ôn tập thông minh',
  daily: 'Thử thách hằng ngày',
};

export interface BuildOptions {
  mode: Mode;
  subjectId: string;
  chapterId?: string;
  limit?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  /** Thời điểm hiện tại (epoch ms), mặc định Date.now() — để test. */
  now?: number;
}

export function buildSession(opts: BuildOptions): Session {
  const {mode, subjectId, chapterId} = opts;
  const now = opts.now ?? Date.now();
  const progress = getProgress();
  const cards = progress.cards;
  const subject = getSubject(subjectId);
  const chapter = chapterId ? subject?.chapters.find((c) => c.id === chapterId) : undefined;

  const pool: Question[] = chapterId ? getChapterQuestions(subjectId, chapterId) : getSubjectQuestions(subjectId);
  const doShuffleOpts = opts.shuffleOptions ?? progress.settings.shuffleOptions;

  let picked: Question[];
  let durationSec: number | undefined;
  let title: string;
  const scope = chapter?.title ?? subject?.title ?? subjectId;

  if (mode === 'practice') {
    const shuf = opts.shuffleQuestions ?? !chapterId;
    picked = shuf ? shuffle(pool) : pool.slice();
    if (opts.limit !== undefined) picked = picked.slice(0, Math.max(0, opts.limit));
    title = `Luyện tập: ${scope}`;
  } else if (mode === 'exam') {
    const limit = opts.limit ?? progress.settings.examSize;
    picked = (opts.shuffleQuestions === false ? pool.slice() : shuffle(pool)).slice(0, Math.max(0, limit));
    durationSec = progress.settings.examMinutes * 60;
    title = `Thi thử: ${scope}`;
  } else if (mode === 'review') {
    const limit = opts.limit ?? 20;
    const seen = pool.filter((q) => (cards[q.id]?.seen ?? 0) > 0);
    const rank = (q: Question) => {
      const c = cards[q.id];
      return {due: c.due <= now, box: c.box, recentWrong: c.wrong > 0 && c.box === 0};
    };
    const sorted = seen
      .map((q) => ({q, r: rank(q), c: cards[q.id]}))
      .sort((a, b) => {
        if (a.r.due !== b.r.due) return a.r.due ? -1 : 1;
        if (a.r.due) return a.c.due - b.c.due || a.r.box - b.r.box;
        if (a.r.box !== b.r.box) return a.r.box - b.r.box;
        if (a.r.recentWrong !== b.r.recentWrong) return a.r.recentWrong ? -1 : 1;
        return b.c.last - a.c.last;
      })
      .map((x) => x.q);
    picked = sorted.slice(0, Math.max(0, limit));
    if (opts.shuffleQuestions) picked = shuffle(picked);
    title = `Ôn tập thông minh: ${scope}`;
  } else {
    const limit = opts.limit ?? 10;
    const due: Question[] = [];
    const fresh: Question[] = [];
    const rest: Question[] = [];
    for (const q of pool) {
      const c = cards[q.id];
      if (!c || c.seen <= 0) fresh.push(q);
      else if (c.due <= now) due.push(q);
      else rest.push(q);
    }
    picked = [...shuffle(due), ...shuffle(fresh), ...shuffle(rest)].slice(0, Math.max(0, limit));
    if (opts.shuffleQuestions !== false) picked = shuffle(picked);
    title = `Thử thách hằng ngày: ${subject?.title ?? subjectId}`;
  }

  const items: PlayQuestion[] = picked.map((q) => {
    const idx = q.options.map((_, i) => i);
    return {q, order: doShuffleOpts ? shuffle(idx) : idx};
  });

  const session: Session = {
    id: `${mode}-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    mode,
    subjectId,
    title: title || MODE_TITLE[mode],
    items,
    startedAt: now,
  };
  if (chapterId) session.chapterId = chapterId;
  if (durationSec !== undefined) session.durationSec = durationSec;
  return session;
}

export function finishSession(session: Session, answers: AnswerRecord[], now: number = Date.now()): SessionResult {
  const prev = getProgress();
  const correct = answers.filter((a) => a.correct).length;
  const total = session.items.length;
  const bonus = session.mode === 'exam' && total > 0 && correct / total >= 0.8 ? 5 : 0;
  const xpGained = correct * 10 + bonus;

  const cards = {...prev.cards};
  for (const a of answers) cards[a.qid] = nextCard(cards[a.qid], a.correct, now);

  const today = dayKey(now);
  let streak: number;
  if (prev.lastActiveDay === today) streak = Math.max(1, prev.streak);
  else if (prev.lastActiveDay === prevDayKey(now)) streak = prev.streak + 1;
  else streak = 1;

  const result: SessionResult = {
    sessionId: session.id,
    mode: session.mode,
    subjectId: session.subjectId,
    ...(session.chapterId ? {chapterId: session.chapterId} : {}),
    title: session.title,
    at: now,
    total,
    correct,
    durationMs: Math.max(0, now - session.startedAt),
    xpGained,
    answers,
  };

  commitProgress({
    ...prev,
    cards,
    xp: prev.xp + xpGained,
    streak,
    lastActiveDay: today,
    bestStreak: Math.max(prev.bestStreak, streak),
    history: [result, ...prev.history].slice(0, MAX_HISTORY),
  });
  return result;
}
