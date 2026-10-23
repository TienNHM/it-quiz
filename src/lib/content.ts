import type {Question, Subject} from './types';

// Vite gom toàn bộ JSON vào bundle -> service worker precache -> chạy offline.
const files = import.meta.glob('../../content/*/*.json', {eager: true, import: 'default'}) as Record<string, any>;

const subjects: Subject[] = [];
const byChapter = new Map<string, Question[]>(); // `${subjectId}/${chapterId}`
const byId = new Map<string, Question>();

for (const [path, data] of Object.entries(files)) {
  const m = path.match(/content\/([^/]+)\/([^/]+)\.json$/);
  if (!m) continue;
  if (m[2] === 'subject') {
    subjects.push(data as Subject);
  } else {
    (data.questions as Question[]).forEach((q) => byId.set(q.id, q));
    byChapter.set(`${m[1]}/${data.id}`, data.questions);
  }
}

export const getSubjects = () => subjects;
export const getSubject = (id: string) => subjects.find((s) => s.id === id);
export const getChapterQuestions = (subjectId: string, chapterId: string) => byChapter.get(`${subjectId}/${chapterId}`) ?? [];
export const getSubjectQuestions = (subjectId: string) =>
  (getSubject(subjectId)?.chapters ?? []).flatMap((c) => getChapterQuestions(subjectId, c.id));
export const getQuestion = (qid: string) => byId.get(qid);
