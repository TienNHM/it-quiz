// Ghép hai nửa (A/B) của mỗi chương thành file chương + verify chính thức.
//   node scripts/merge-parts.mjs dotnet
// Nguồn: content/<môn>/parts/<NN-slug>.A.json|.B.json (+ parts/verify/<NN-slug>.A.json|.B.json)
// Đích:  content/<môn>/<NN-slug>.json (id chương, title, description lấy từ nửa A) và verify/<NN-slug>.json
import {readFileSync, writeFileSync, readdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const subj = process.argv[2];
const base = join('content', subj);
const parts = join(base, 'parts');
const wanted = process.argv.slice(3);
const slugs = [...new Set(readdirSync(parts).filter((f) => /^\d\d-.+\.[AB]\.json$/.test(f)).map((f) => f.replace(/\.[AB]\.json$/, '')))].filter((s) => !wanted.length || wanted.includes(s)).sort();
let total = 0;
for (const slug of slugs) {
  const read = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
  const a = read(join(parts, `${slug}.A.json`));
  const b = read(join(parts, `${slug}.B.json`));
  if (!a) {
    console.log(`✗ ${slug}: thiếu nửa A`);
    continue;
  }
  const questions = [...a.questions, ...(b?.questions ?? [])].sort((x, y) => x.id.localeCompare(y.id));
  const conceptual = a.conceptual && (!b || b.conceptual);
  const set = {id: a.id, title: a.title, description: a.description, ...(conceptual ? {conceptual: true} : {}), questions};
  writeFileSync(join(base, `${slug}.json`), JSON.stringify(set, null, 2) + '\n');
  const va = read(join(parts, 'verify', `${slug}.A.json`)) ?? [];
  const vb = read(join(parts, 'verify', `${slug}.B.json`)) ?? [];
  writeFileSync(join(base, 'verify', `${slug}.json`), JSON.stringify([...va, ...vb], null, 2) + '\n');
  total += questions.length;
  console.log(`✓ ${slug}: ${a.questions.length} + ${b?.questions.length ?? 0} câu, ${va.length + vb.length} kiểm chứng`);
}
console.log(`OK: ${slugs.length} chương, ${total} câu`);
