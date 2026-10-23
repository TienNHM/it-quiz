// Kiểm tra toàn bộ content/**: id duy nhất, answer hợp lệ, option không rỗng.
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

let errors = 0, total = 0;
const seen = new Set();
const err = (m) => (errors++, console.error('✗', m));

for (const subj of readdirSync('content', {withFileTypes: true}).filter((d) => d.isDirectory())) {
  const dir = join('content', subj.name);
  const meta = JSON.parse(readFileSync(join(dir, 'subject.json'), 'utf8'));
  for (const ch of meta.chapters) {
    const set = JSON.parse(readFileSync(join(dir, `${ch.slug}.json`), 'utf8'));
    if (set.questions.length !== ch.count) err(`${ch.slug}: count lệch`);
    for (const q of set.questions) {
      total++;
      const where = `${ch.slug}/${q.id}`;
      if (seen.has(q.id)) err(`${where}: trùng id`);
      seen.add(q.id);
      if (!q.question || !q.explanation) err(`${where}: thiếu question/explanation`);
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.some((o) => !String(o).trim())) err(`${where}: options lỗi`);
      const ans = Array.isArray(q.answer) ? q.answer : [q.answer];
      if (!ans.length || ans.some((a) => !Number.isInteger(a) || a < 0 || a >= q.options.length)) err(`${where}: answer ngoài phạm vi`);
    }
  }
}
console.log(errors ? `${errors} lỗi` : `OK: ${total} câu hợp lệ`);
process.exit(errors ? 1 : 0);
