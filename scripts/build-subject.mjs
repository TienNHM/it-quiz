// Dựng content/<môn>/subject.json từ meta + các file chương: node scripts/build-subject.mjs sql
import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const subj = process.argv[2];
if (!subj) throw new Error('Thiếu tên môn');
const dir = join('content', subj);
const meta = JSON.parse(readFileSync(join(dir, 'subject.meta.json'), 'utf8'));
const files = readdirSync(dir).filter((f) => /^\d\d-.+\.json$/.test(f)).sort();
const chapters = files.map((f) => {
  const set = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  return {id: set.id, slug: f.replace(/\.json$/, ''), title: set.title, description: set.description ?? '', count: set.questions.length};
});
writeFileSync(join(dir, 'subject.json'), JSON.stringify({...meta, chapters}, null, 2) + '\n');
console.log(`OK: ${subj} - ${chapters.length} chương, ${chapters.reduce((s, c) => s + c.count, 0)} câu`);
