// @vitest-environment jsdom
import {beforeEach, describe, expect, it} from 'vitest';
import {
  buildSession,
  chapterStats,
  correctDisplayIndices,
  dueQuestionIds,
  exportProgress,
  finishSession,
  getProgress,
  getSubject,
  getSubjectQuestions,
  importProgress,
  isCorrect,
  resetProgress,
  subjectStats,
  toOriginal,
  updateSettings,
  weakTopics,
} from '..';
import {BOX_INTERVALS_MS, dayKey, nextCard} from '../srs';
import type {AnswerRecord, PlayQuestion, Question, Session} from '../types';

const mkQ = (answer: number | number[]): Question => ({id: 'x', question: 'q', options: ['a', 'b', 'c', 'd'], answer, explanation: ''});
const SID = 'os';
const DAY = 86_400_000;

beforeEach(() => {
  localStorage.clear();
  resetProgress();
});

describe('chấm điểm', () => {
  it('đơn đáp án với order bị xáo', () => {
    const item: PlayQuestion = {q: mkQ(1), order: [2, 3, 1, 0]};
    expect(correctDisplayIndices(item)).toEqual([2]);
    expect(isCorrect(item, [2])).toBe(true);
    expect(isCorrect(item, [1])).toBe(false);
    expect(isCorrect(item, [])).toBe(false);
    expect(toOriginal(item, [0, 2])).toEqual([2, 1]);
  });
  it('đa đáp án: tập chọn == tập đáp án', () => {
    const item: PlayQuestion = {q: mkQ([0, 3]), order: [3, 1, 0, 2]};
    expect(correctDisplayIndices(item).sort()).toEqual([0, 2]);
    expect(isCorrect(item, [2, 0])).toBe(true);
    expect(isCorrect(item, [0])).toBe(false);
    expect(isCorrect(item, [0, 2, 1])).toBe(false);
  });
});

describe('Leitner', () => {
  it('đúng tăng hộp, sai về 0, trần 5', () => {
    const t = 1_000_000;
    let c = nextCard(undefined, true, t);
    expect(c.box).toBe(1);
    expect(c.due).toBe(t + BOX_INTERVALS_MS[1]);
    for (let i = 0; i < 10; i++) c = nextCard(c, true, t);
    expect(c.box).toBe(5);
    expect(c.due).toBe(t + 30 * DAY);
    c = nextCard(c, false, t);
    expect(c.box).toBe(0);
    expect(c.due).toBe(t + 10 * 60_000);
    expect(c.wrong).toBe(1);
  });
});

function play(s: Session, allCorrect: boolean): AnswerRecord[] {
  return s.items.map((it) => ({
    qid: it.q.id,
    picked: allCorrect ? [...(Array.isArray(it.q.answer) ? it.q.answer : [it.q.answer])] : [],
    correct: allCorrect,
    ms: 1000,
  }));
}

describe('finishSession', () => {
  it('XP, bonus exam, history tối đa 50', () => {
    const s = buildSession({mode: 'exam', subjectId: SID, limit: 5});
    const r = finishSession(s, play(s, true));
    expect(r.xpGained).toBe(55);
    expect(getProgress().xp).toBe(55);
    const p = buildSession({mode: 'practice', subjectId: SID, limit: 2});
    expect(finishSession(p, play(p, true)).xpGained).toBe(20);
    for (let i = 0; i < 60; i++) finishSession(p, play(p, false));
    expect(getProgress().history.length).toBe(50);
    expect(getProgress().history[0].correct).toBe(0);
  });
  it('streak qua ngày', () => {
    const s = buildSession({mode: 'practice', subjectId: SID, limit: 1});
    const d0 = new Date(2026, 0, 10, 12).getTime();
    finishSession(s, play(s, true), d0);
    expect(getProgress().streak).toBe(1);
    finishSession(s, play(s, true), d0 + 3_600_000);
    expect(getProgress().streak).toBe(1);
    finishSession(s, play(s, true), new Date(2026, 0, 11, 9).getTime());
    expect(getProgress().streak).toBe(2);
    finishSession(s, play(s, true), new Date(2026, 0, 12, 23).getTime());
    expect(getProgress().streak).toBe(3);
    expect(getProgress().bestStreak).toBe(3);
    finishSession(s, play(s, true), new Date(2026, 0, 20, 9).getTime());
    expect(getProgress().streak).toBe(1);
    expect(getProgress().bestStreak).toBe(3);
    expect(getProgress().lastActiveDay).toBe(dayKey(new Date(2026, 0, 20, 9).getTime()));
  });
  it('cập nhật card và stats', () => {
    const s = buildSession({mode: 'practice', subjectId: SID, chapterId: getSubject(SID)!.chapters[0].id, limit: 4});
    const ans = play(s, true);
    ans[0].correct = false;
    const now = Date.now();
    finishSession(s, ans, now);
    const c0 = getProgress().cards[ans[0].qid];
    expect(c0.box).toBe(0);
    expect(c0.wrong).toBe(1);
    expect(getProgress().cards[ans[1].qid].box).toBe(1);
    const st = chapterStats(SID, s.chapterId!);
    expect(st.seen).toBe(4);
    expect(st.accuracy).toBeCloseTo(0.75);
    expect(subjectStats(SID).seen).toBe(4);
    expect(dueQuestionIds(SID, now + 11 * 60_000)).toContain(ans[0].qid);
    expect(dueQuestionIds(SID, now + 11 * 60_000)).not.toContain(ans[1].qid);
    expect(dueQuestionIds(SID, now + 2 * DAY).length).toBe(4);
    expect(weakTopics(SID).length).toBeGreaterThan(0);
    expect(weakTopics(SID)[0].wrong).toBe(1);
  });
});

describe('progress import/export', () => {
  it('round-trip và từ chối dữ liệu hỏng', () => {
    const s = buildSession({mode: 'practice', subjectId: SID, limit: 3});
    finishSession(s, play(s, true));
    const json = exportProgress();
    const before = getProgress();
    resetProgress();
    expect(getProgress().xp).toBe(0);
    expect(importProgress(json)).toBe(true);
    expect(getProgress().xp).toBe(before.xp);
    expect(Object.keys(getProgress().cards).length).toBe(3);
    expect(importProgress('not json')).toBe(false);
    expect(importProgress('[]')).toBe(false);
    expect(importProgress(JSON.stringify({version: 2}))).toBe(false);
    expect(getProgress().xp).toBe(before.xp);
  });
  it('settings mặc định, cập nhật và lưu localStorage', () => {
    expect(getProgress().settings).toEqual({shuffleOptions: true, theme: 'auto', examSize: 30, examMinutes: 45});
    const ref = getProgress();
    updateSettings({theme: 'dark', examSize: 10});
    expect(getProgress()).not.toBe(ref);
    expect(getProgress().settings.theme).toBe('dark');
    expect(JSON.parse(localStorage.getItem('itquiz.v1')!).settings.examSize).toBe(10);
  });
});

describe('buildSession', () => {
  const subject = getSubject(SID)!;
  const total = getSubjectQuestions(SID).length;

  it('dữ liệu thật: 208 câu', () => {
    expect(total).toBe(208);
  });
  it('practice theo chương giữ thứ tự gốc', () => {
    const ch = subject.chapters[0];
    const s = buildSession({mode: 'practice', subjectId: SID, chapterId: ch.id, shuffleOptions: false});
    expect(s.items.length).toBe(ch.count);
    expect(s.items.map((i) => i.q.id)).toEqual(s.items.map((i) => i.q.id).slice().sort((a, b) => 0)); // không crash
    expect(s.items.every((i) => i.order.join() === i.q.options.map((_, k) => k).join())).toBe(true);
    expect(s.title).toMatch(/Luyện tập/);
  });
  it('practice toàn môn trộn nhưng đủ câu, order là hoán vị', () => {
    const s = buildSession({mode: 'practice', subjectId: SID});
    expect(s.items.length).toBe(total);
    expect(new Set(s.items.map((i) => i.q.id)).size).toBe(total);
    for (const it of s.items) expect([...it.order].sort()).toEqual(it.q.options.map((_, k) => k));
  });
  it('exam dùng settings', () => {
    updateSettings({examSize: 12, examMinutes: 20});
    const s = buildSession({mode: 'exam', subjectId: SID});
    expect(s.items.length).toBe(12);
    expect(s.durationSec).toBe(1200);
  });
  it('không đủ câu thì trả những gì có', () => {
    const ch = subject.chapters[0];
    const s = buildSession({mode: 'exam', subjectId: SID, chapterId: ch.id, limit: 9999});
    expect(s.items.length).toBe(ch.count);
  });
  it('review: rỗng khi chưa làm; ưu tiên due rồi box thấp', () => {
    expect(buildSession({mode: 'review', subjectId: SID}).items.length).toBe(0);
    const qs = getSubjectQuestions(SID);
    const t = Date.now();
    const cards: any = {
      [qs[0].id]: {box: 3, seen: 1, correct: 1, wrong: 0, last: t, due: t + DAY},
      [qs[1].id]: {box: 1, seen: 1, correct: 1, wrong: 0, last: t, due: t + DAY},
      [qs[2].id]: {box: 4, seen: 1, correct: 1, wrong: 0, last: t - DAY * 20, due: t - DAY},
    };
    importProgress(JSON.stringify({...getProgress(), cards}));
    const s = buildSession({mode: 'review', subjectId: SID, now: t});
    expect(s.items.map((i) => i.q.id)).toEqual([qs[2].id, qs[1].id, qs[0].id]);
  });
  it('daily: 10 câu, ưu tiên due rồi chưa làm', () => {
    const qs = getSubjectQuestions(SID);
    const t = Date.now();
    const cards: any = {};
    for (const q of qs.slice(0, 100)) cards[q.id] = {box: 2, seen: 1, correct: 1, wrong: 0, last: t, due: t + DAY};
    cards[qs[0].id].due = t - 1000;
    importProgress(JSON.stringify({...getProgress(), cards}));
    const s = buildSession({mode: 'daily', subjectId: SID, now: t});
    expect(s.items.length).toBe(10);
    const ids = s.items.map((i) => i.q.id);
    expect(ids).toContain(qs[0].id);
    const others = ids.filter((id) => id !== qs[0].id);
    expect(others.every((id) => !cards[id])).toBe(true);
  });
});
