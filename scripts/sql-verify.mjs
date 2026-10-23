// Kiểm chứng đáp án câu hỏi SQL bằng cách CHẠY THẬT trên DSC Shop (PGlite).
//   node scripts/sql-verify.mjs                       # mọi file content/sql/verify/*.json
//   node scripts/sql-verify.mjs 08-aggregate-functions # một chương
//
// Mỗi file verify là mảng mục kiểm chứng, khóa theo id câu hỏi trong content/sql/<chương>.json
// (đáp án đúng lấy từ chính file chương, không khai báo lại). Các kiểu:
//  {id, kind:"choose-query", options:[sql|null x4], ordered?:bool, probe?:sql}
//      Đáp án đúng chạy được; mỗi đáp án sai phải LỖI hoặc cho kết quả KHÁC đáp án đúng.
//      ordered=true: so cả thứ tự dòng, mặc định so không phân biệt thứ tự.
//      probe: truy vấn chạy sau khi thực hiện phương án (dùng cho INSERT/UPDATE/DELETE/DDL) để so trạng thái.
//  {id, kind:"find-error", options:[sql|null x4]}
//      Đáp án đúng là phương án gây LỖI; các phương án còn lại phải chạy được.
//  {id, kind:"predict", query, format:"scalar"|"rowcount"|"list"|"text", probe?:sql}
//      Chạy query (và probe), định dạng kết quả và so với CHÍNH văn bản của đáp án đúng trong options.
//      scalar: ô đầu tiên; rowcount: số dòng; list: cột đầu nối bằng ", "; text: toàn bộ bảng (dòng nối \n, ô nối " | ").
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {freshDb, runIsolated} from './sql-lib.mjs';

const only = process.argv.slice(2);
const dir = 'content/sql/verify';
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).filter((f) => !only.length || only.includes(f));
let total = 0, bad = 0;

const norm = (r, ordered) => {
  if (r.error) return `ERR`;
  const rows = r.rows.map((x) => JSON.stringify(x));
  return JSON.stringify([r.fields.length, ordered ? rows : [...rows].sort()]);
};
const sig = (r, ordered, probe) => (probe ? norm(r.probe ?? r, ordered) : norm(r, ordered));

for (const f of files) {
  const db = await freshDb(); // DB mới cho mỗi chương: sequence/COMMIT của chương khác không rò sang
  const chPath = join('content/sql', `${f}.json`);
  if (!existsSync(chPath)) { console.log(`✗ ${f}: không có ${chPath}`); bad++; continue; }
  const questions = new Map(JSON.parse(readFileSync(chPath, 'utf8')).questions.map((q) => [q.id, q]));
  const entries = JSON.parse(readFileSync(join(dir, `${f}.json`), 'utf8'));
  let ok = 0;
  for (const e of entries) {
    total++;
    const q = questions.get(e.id);
    const fail = (m) => { bad++; console.log(`✗ ${f} / ${e.id}: ${m}`); };
    if (!q) { fail('id không có trong file chương'); continue; }
    if (Array.isArray(q.answer)) { fail('chưa hỗ trợ kiểm chứng câu nhiều đáp án'); continue; }
    const correct = q.answer;
    if (e.kind === 'choose-query' || e.kind === 'find-error') {
      const res = [];
      for (const o of e.options) res.push(o == null ? null : await runIsolated(db, o, e.probe));
      const c = res[correct];
      if (!c) { fail('đáp án đúng không có SQL'); continue; }
      if (e.kind === 'find-error') {
        if (!c.error) { fail('đáp án đúng lẽ ra phải gây lỗi nhưng chạy được'); continue; }
        const works = res.every((r, i) => i === correct || r === null || !r.error);
        if (!works) { fail('có đáp án sai cũng gây lỗi: ' + res.map((r, i) => (r?.error ? `#${i}:${r.error}` : '')).filter(Boolean).join('; ')); continue; }
        ok++; continue;
      }
      if (c.error) { fail(`đáp án đúng #${correct} bị lỗi: ${c.error}`); continue; }
      const ref = sig(c, e.ordered, e.probe);
      const same = res.map((r, i) => (i !== correct && r && !r.error && sig(r, e.ordered, e.probe) === ref ? i : -1)).filter((i) => i >= 0);
      if (same.length) { fail(`đáp án sai #${same.join(',#')} cho kết quả GIỐNG đáp án đúng (mơ hồ)`); continue; }
      ok++;
    } else if (e.kind === 'predict') {
      const r = await runIsolated(db, e.query, e.probe);
      const t = e.probe ? r.probe : r;
      if (!t || t.error) { fail(`query lỗi: ${t?.error ?? r.error}`); continue; }
      const text = { scalar: () => String(t.rows[0]?.[0]), rowcount: () => String(t.rows.length), list: () => t.rows.map((x) => x[0]).join(', '), text: () => t.rows.map((x) => x.join(' | ')).join('\n') }[e.format]?.();
      const want = String(q.options[correct]).trim();
      if (text === undefined) { fail('format không hợp lệ'); continue; }
      if (text.trim() !== want) { fail(`kết quả thật "${text.slice(0, 80)}" khác đáp án đúng "${want.slice(0, 80)}"`); continue; }
      const dup = q.options.filter((o, i) => i !== correct && String(o).trim() === want);
      if (dup.length) { fail('có đáp án sai trùng đáp án đúng'); continue; }
      ok++;
    } else fail(`kind không hợp lệ: ${e.kind}`);
  }
  const covered = entries.length;
  await db.close();
  console.log(`${ok === covered ? '✓' : '✗'} ${f}: ${ok}/${covered} mục đạt (${questions.size} câu trong chương, ${covered} được kiểm chứng bằng SQL thật)`);
}
console.log(bad ? `\n${bad} lỗi / ${total} mục` : `\nOK: ${total} mục kiểm chứng đạt`);
process.exit(bad ? 1 : 0);
