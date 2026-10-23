import {getChapterQuestions, getSubject, getSubjectQuestions, getSubjects} from './content';
import {getProgress} from './progress';
import type {Question} from './types';

type Stat = {total: number; seen: number; mastered: number; accuracy: number};

function statsFor(qs: Question[]): Stat {
  const cards = getProgress().cards;
  let seen = 0;
  let mastered = 0;
  let ok = 0;
  let tries = 0;
  for (const q of qs) {
    const c = cards[q.id];
    if (!c || c.seen <= 0) continue;
    seen++;
    if (c.box >= 4) mastered++;
    ok += c.correct;
    tries += c.correct + c.wrong;
  }
  return {total: qs.length, seen, mastered, accuracy: tries > 0 ? ok / tries : 0};
}

export const chapterStats = (subjectId: string, chapterId: string): Stat => statsFor(getChapterQuestions(subjectId, chapterId));
export const subjectStats = (subjectId: string): Stat => statsFor(getSubjectQuestions(subjectId));

/** Id câu đã làm và đến hạn ôn (due <= now), sắp theo due tăng dần. */
export function dueQuestionIds(subjectId?: string, now: number = Date.now()): string[] {
  const cards = getProgress().cards;
  const allowed = subjectId ? new Set(getSubjectQuestions(subjectId).map((q) => q.id)) : null;
  return Object.entries(cards)
    .filter(([id, c]) => c.seen > 0 && c.due <= now && (!allowed || allowed.has(id)))
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}

/** Chủ đề có câu sai, giảm dần theo tỉ lệ sai (wrong/total lượt trả lời). */
export function weakTopics(subjectId: string): {topic: string; wrong: number; total: number}[] {
  if (!getSubject(subjectId) && !getSubjects().length) return [];
  const cards = getProgress().cards;
  const map = new Map<string, {topic: string; wrong: number; total: number}>();
  for (const q of getSubjectQuestions(subjectId)) {
    const c = cards[q.id];
    if (!c || c.wrong <= 0) continue;
    const topic = q.topic ?? 'Khác';
    const e = map.get(topic) ?? {topic, wrong: 0, total: 0};
    e.wrong += c.wrong;
    e.total += c.correct + c.wrong;
    map.set(topic, e);
  }
  return [...map.values()].sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.wrong - a.wrong);
}
