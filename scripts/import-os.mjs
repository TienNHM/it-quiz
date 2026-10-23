// Chuyển ngân hàng câu hỏi OS (TS của site docs) sang JSON trung lập trong content/os.
// Chạy: npm run import:os [-- <thư mục nguồn>]
import {mkdirSync, writeFileSync, readdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const SRC = resolve(process.argv[2] ?? 'D:/repos/tiennhm.github.io/src/data/quiz/operating-system');
const OUT = resolve('content/os');
mkdirSync(OUT, {recursive: true});

const files = readdirSync(SRC).filter((f) => /^\d\d-.*\.ts$/.test(f)).sort();
const chapters = [];
let total = 0;

for (const f of files) {
  const mod = await import(pathToFileURL(join(SRC, f)).href);
  const set = Object.values(mod).find((v) => v && Array.isArray(v.questions));
  const slug = f.replace(/\.ts$/, '');
  const questions = set.questions.map((q) => ({
    id: q.id,
    topic: q.topic,
    source: q.source,
    question: q.question,
    ...(q.code ? {code: q.code} : {}),
    ...(q.diagram ? {diagram: q.diagram} : {}),
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
  }));
  total += questions.length;
  writeFileSync(join(OUT, `${slug}.json`), JSON.stringify({id: set.id, title: set.title, description: set.description ?? '', questions}, null, 2) + '\n');
  chapters.push({id: set.id, slug, title: set.title, description: set.description ?? '', count: questions.length});
}

writeFileSync(
  join(OUT, 'subject.json'),
  JSON.stringify(
    {
      id: 'os',
      title: 'Hệ điều hành',
      icon: 'cpu',
      description: 'Tiến trình, lập lịch CPU, đồng bộ, deadlock, quản lý bộ nhớ, thay trang, đĩa và hệ thống file.',
      chapters,
    },
    null,
    2,
  ) + '\n',
);
console.log(`OK: ${chapters.length} chương, ${total} câu hỏi -> ${OUT}`);
