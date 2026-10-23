// Kiểm tra định dạng/chất lượng file câu hỏi SQL: node scripts/sql-lint.mjs [NN-slug ...]
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const only = process.argv.slice(2);
const dir = 'content/sql';
const chapters = readdirSync(dir).filter((f) => /^\d\d-.+\.json$/.test(f)).map((f) => f.replace(/\.json$/, '')).filter((f) => !only.length || only.includes(f));
const emoji = /[\u{1F300}-\u{1FAFF}☀-➿⬀-⯿️]/u;
const seen = new Set();
let bad = 0;
const err = (ch, id, m) => { bad++; console.log(`✗ ${ch}${id ? ' / ' + id : ''}: ${m}`); };

for (const ch of chapters) {
  const day = ch.slice(0, 2);
  const set = JSON.parse(readFileSync(join(dir, `${ch}.json`), 'utf8'));
  if (set.id !== `sql-d${day}`) err(ch, '', `id chương phải là sql-d${day}, đang là ${set.id}`);
  if (!set.title || !set.description) err(ch, '', 'thiếu title/description');
  const qs = set.questions ?? [];
  if (qs.length < 8 || qs.length > 18) err(ch, '', `số câu ${qs.length} ngoài khoảng 8-18`);
  const ansCount = [0, 0, 0, 0];
  for (const q of qs) {
    const id = q.id;
    if (!new RegExp(`^sql-d${day}-[0-9]{2}$`).test(id ?? '')) err(ch, id, `id phải dạng sql-d${day}-NN`);
    if (seen.has(id)) err(ch, id, 'trùng id'); seen.add(id);
    if (!q.topic) err(ch, id, 'thiếu topic');
    if (!q.source) err(ch, id, 'thiếu source');
    if (!q.question || q.question.length > 700) err(ch, id, 'question rỗng hoặc quá dài');
    if (!Array.isArray(q.options) || q.options.length !== 4) { err(ch, id, 'phải có đúng 4 phương án'); continue; }
    if (new Set(q.options.map((o) => String(o).trim())).size !== 4) err(ch, id, 'có phương án trùng nhau');
    if (q.options.some((o) => !String(o).trim())) err(ch, id, 'phương án rỗng');
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) err(ch, id, 'answer phải là 0-3 (chưa dùng câu nhiều đáp án)'); else ansCount[q.answer]++;
    if (!q.explanation || q.explanation.length < 60) err(ch, id, 'explanation quá ngắn');
    const all = [q.question, q.code, q.explanation, ...q.options].filter(Boolean).join('\n');
    if (emoji.test(all)) err(ch, id, 'không dùng emoji');
    if ((all.match(/```/g) ?? []).length % 2) err(ch, id, 'fence ``` không đóng');
    if (/^\s*\|.*\|\s*$/m.test(q.explanation) || /^#{1,6} /m.test(q.explanation)) err(ch, id, 'explanation không hỗ trợ bảng markdown/tiêu đề; dùng bullet "- " và fence');
    if (q.code && q.codeLang !== 'sql' && /\b(SELECT|INSERT|UPDATE|DELETE|CREATE)\b/.test(q.code)) err(ch, id, 'code là SQL thì đặt codeLang: "sql"');
    for (const o of q.options) if (/\b(SELECT|INSERT INTO|UPDATE|DELETE FROM|CREATE|ALTER|DROP|WITH)\b/.test(o) && !o.trimStart().startsWith('```sql')) { err(ch, id, 'phương án là câu lệnh SQL phải bọc trong fence ```sql'); break; }
  }
  const max = Math.max(...ansCount);
  if (qs.length >= 8 && max / qs.length > 0.5) err(ch, '', `đáp án phân bố lệch ${ansCount.join('/')}`);
  const vf = join(dir, 'verify', `${ch}.json`);
  const nVer = existsSync(vf) ? JSON.parse(readFileSync(vf, 'utf8')).length : 0;
  const ratio = qs.length ? nVer / qs.length : 0;
  console.log(`${bad ? '·' : '✓'} ${ch}: ${qs.length} câu, ${nVer} kiểm chứng SQL (${Math.round(ratio * 100)}%), đáp án ${ansCount.join('/')}`);
  if (ratio < 0.4 && !set.conceptual) err(ch, '', `chỉ ${Math.round(ratio * 100)}% câu được kiểm chứng bằng SQL thật (cần >= 40%, hoặc đặt "conceptual": true cho chương thuần lý thuyết)`);
}
console.log(bad ? `\n${bad} lỗi` : '\nOK');
process.exit(bad ? 1 : 0);
