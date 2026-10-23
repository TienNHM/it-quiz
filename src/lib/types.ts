// HỢP ĐỒNG DÙNG CHUNG — không đổi chữ ký nếu chưa báo. Engine (src/lib/*) cài đặt, UI (src/pages, src/components) tiêu thụ.

/* ---------- Nội dung (content/<subject>/*.json) ---------- */
export type Answer = number | number[]; // index theo options GỐC, từ 0

export interface Question {
  id: string;
  topic?: string;
  source?: string;
  question: string; // markdown tối giản: **đậm**, `code`, "- " bullet, ``` fence
  code?: string; // khối <pre> kèm đề
  diagram?: string; // mermaid
  options: string[];
  answer: Answer;
  explanation: string;
}

export interface ChapterMeta {
  id: string;
  slug: string;
  title: string;
  description: string;
  count: number;
}
export interface Subject {
  id: string;
  title: string;
  icon: string;
  description: string;
  chapters: ChapterMeta[];
}

/* ---------- Phiên chơi ---------- */
export type Mode = 'practice' | 'exam' | 'review' | 'daily';

/** Câu hỏi đã trộn phương án: order[i] = index GỐC của phương án hiển thị ở vị trí i. */
export interface PlayQuestion {
  q: Question;
  order: number[];
}

export interface Session {
  id: string;
  mode: Mode;
  subjectId: string;
  chapterId?: string; // undefined = trộn toàn môn
  title: string;
  items: PlayQuestion[];
  durationSec?: number; // chỉ exam
  startedAt: number; // epoch ms
}

export interface AnswerRecord {
  qid: string;
  picked: number[]; // index GỐC
  correct: boolean;
  ms: number;
}

export interface SessionResult {
  sessionId: string;
  mode: Mode;
  subjectId: string;
  chapterId?: string;
  title: string;
  at: number;
  total: number;
  correct: number;
  durationMs: number;
  xpGained: number;
  answers: AnswerRecord[];
}

/* ---------- Tiến độ lưu máy (localStorage, key 'itquiz.v1') ---------- */
export interface CardState {
  box: number; // Leitner 0..5; 0 = mới/sai gần nhất
  seen: number;
  correct: number;
  wrong: number;
  last: number; // epoch ms lần làm gần nhất
  due: number; // epoch ms đến hạn ôn
}

export interface Settings {
  shuffleOptions: boolean;
  theme: 'auto' | 'light' | 'dark';
  examSize: number; // số câu đề thi thử, mặc định 30
  examMinutes: number; // mặc định 45
}

export interface ProgressState {
  version: 1;
  cards: Record<string, CardState>; // key = question id
  xp: number;
  streak: number; // số ngày liên tiếp
  lastActiveDay: string; // 'YYYY-MM-DD' giờ local, '' nếu chưa
  bestStreak: number;
  history: SessionResult[]; // tối đa 50, mới nhất đầu
  settings: Settings;
}

/* ---------- API engine (src/lib/index.ts re-export tất cả; UI chỉ import từ '../lib') ---------- */
export interface EngineAPI {
  // content.ts (đã có sẵn)
  getSubjects(): Subject[];
  getSubject(id: string): Subject | undefined;
  getChapterQuestions(subjectId: string, chapterId: string): Question[];
  getSubjectQuestions(subjectId: string): Question[];
  getQuestion(qid: string): Question | undefined;

  // session.ts
  buildSession(opts: {
    mode: Mode;
    subjectId: string;
    chapterId?: string;
    limit?: number; // practice: mặc định tất cả; exam: settings.examSize; daily: 10; review: tối đa 20
    shuffleQuestions?: boolean; // mặc định true trừ practice-theo-chương
    shuffleOptions?: boolean; // mặc định lấy từ settings
  }): Session; // review = câu đến hạn / box thấp / vừa sai; daily = trộn, ưu tiên đến hạn + chưa làm

  isCorrect(item: PlayQuestion, pickedDisplay: number[]): boolean; // pickedDisplay là index HIỂN THỊ
  toOriginal(item: PlayQuestion, pickedDisplay: number[]): number[];
  correctDisplayIndices(item: PlayQuestion): number[];
  /** Tính XP, cập nhật Leitner, streak, history (unshift), lưu localStorage. Trả về result đã lưu. */
  finishSession(session: Session, answers: AnswerRecord[]): SessionResult;

  // progress.ts — store ngoài React, dùng useSyncExternalStore
  useProgress(): ProgressState;
  getProgress(): ProgressState;
  updateSettings(patch: Partial<Settings>): void;
  resetProgress(): void;
  exportProgress(): string; // JSON
  importProgress(json: string): boolean;

  // stats.ts
  chapterStats(subjectId: string, chapterId: string): {total: number; seen: number; mastered: number; accuracy: number}; // mastered = box>=4; accuracy 0..1
  subjectStats(subjectId: string): {total: number; seen: number; mastered: number; accuracy: number};
  dueQuestionIds(subjectId?: string): string[];
  weakTopics(subjectId: string): {topic: string; wrong: number; total: number}[]; // giảm dần theo tỉ lệ sai
}
