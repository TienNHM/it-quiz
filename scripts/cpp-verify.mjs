// Kiểm chứng đáp án câu hỏi C/C++ bằng cách BIÊN DỊCH VÀ CHẠY THẬT (g++).
//   node scripts/cpp-verify.mjs                  # mọi file content/cpp/verify/*.json
//   node scripts/cpp-verify.mjs 01-cpp-so        # một chương
//
// Mỗi file verify là mảng mục, khóa theo id câu hỏi trong content/cpp/<chương>.json. Trường chung (tuỳ chọn):
//   stdin: chuỗi đưa vào chương trình; std: "c++17" (mặc định) | "c++11" | "c++20"...; lang: "c" để biên dịch như C.
//  {id, kind:"cpp-predict", program}
//      Chạy program, stdout phải KHỚP CHÍNH XÁC văn bản đáp án đúng (bỏ fence ```).
//  {id, kind:"cpp-choose", template, options:[snippet|null x4], expectOutput?}
//      Thay {{X}} trong template bằng từng snippet. Đáp án đúng phải chạy OK (và stdout = expectOutput nếu có);
//      đáp án sai phải LỖI hoặc cho stdout KHÁC.
//  {id, kind:"cpp-find-error", template, options:[snippet x4], errorKind:"compile"|"runtime", match?:"chuỗi trong thông báo lỗi"}
//      Đáp án đúng gây đúng loại lỗi; 3 đáp án còn lại phải chạy OK.
//  {id, kind:"cpp-outcome", program, expect:"compile-error"|"runtime-error"|"ok", match?:"..."}
//      Kiểm tra kết quả biên dịch/chạy ("đoạn code này có biên dịch được không?").
//  {id, kind:"cpp-output-contains", program, contains:"..."}  (hiếm dùng)
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {runCpp, norm} from './cpp-lib.mjs';

const only = process.argv.slice(2);
const dir = join('content', 'cpp', 'verify');
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).filter((f) => !only.length || only.includes(f));
let total = 0, bad = 0;

const stripFence = (s) => norm(String(s).replace(/^\s*```[a-z+]*\n?/i, '').replace(/\n?```\s*$/i, ''));
const fill = (tpl, snip) => tpl.split('{{X}}').join(snip);
const label = (r) => (r.outcome === 'ok' ? `ok[${r.stdout.slice(0, 40)}]` : `${r.outcome}${r.codes.length ? ' ' + r.codes[0] : ''}`);
const matches = (r, m) => !m || r.stderr.includes(m) || r.codes.some((c) => c.includes(m));

// chạy song song có giới hạn
async function pool(items, n, fn) {
  const res = [];
  let i = 0;
  await Promise.all(Array.from({length: n}, async () => { while (i < items.length) { const k = i++; res[k] = await fn(items[k]); } }));
  return res;
}

for (const f of files) {
  const chPath = join('content', 'cpp', `${f}.json`);
  if (!existsSync(chPath)) { console.log(`✗ ${f}: không có ${chPath}`); bad++; continue; }
  const questions = new Map(JSON.parse(readFileSync(chPath, 'utf8')).questions.map((q) => [q.id, q]));
  const entries = JSON.parse(readFileSync(join(dir, `${f}.json`), 'utf8'));
  let ok = 0;
  const results = await pool(entries, 4, async (e) => {
    const q = questions.get(e.id);
    const o = {stdin: e.stdin ?? '', std: e.std ?? 'c++17', lang: e.lang ?? 'cpp'};
    const fail = (m) => `✗ ${f} / ${e.id}: ${m}`;
    if (!q) return fail('id không có trong file chương');
    if (Array.isArray(q.answer)) return fail('chưa hỗ trợ kiểm chứng câu nhiều đáp án');
    const correct = q.answer;
    try {
      if (e.kind === 'cpp-predict') {
        const r = await runCpp(e.program, o);
        if (r.outcome !== 'ok') return fail(`chương trình không chạy OK: ${label(r)} ${r.stderr.split('\n')[0] ?? ''}`);
        const want = stripFence(q.options[correct]);
        if (r.stdout !== want) return fail(`stdout thật "${r.stdout.slice(0, 80)}" khác đáp án đúng "${want.slice(0, 80)}"`);
        if (q.options.some((x, i) => i !== correct && stripFence(x) === want)) return fail('có đáp án sai trùng đáp án đúng');
        return null;
      }
      if (e.kind === 'cpp-outcome') {
        const r = await runCpp(e.program, o);
        if (r.outcome !== e.expect) return fail(`kết quả thật ${label(r)} khác kỳ vọng ${e.expect}`);
        if (!matches(r, e.match)) return fail(`thiếu "${e.match}" trong lỗi: ${r.codes[0] ?? r.stderr.slice(0, 100)}`);
        return null;
      }
      if (e.kind === 'cpp-output-contains') {
        const r = await runCpp(e.program, o);
        if (r.outcome !== 'ok' || !r.stdout.includes(e.contains)) return fail(`stdout không chứa "${e.contains}": ${label(r)}`);
        return null;
      }
      if (e.kind === 'cpp-choose' || e.kind === 'cpp-find-error') {
        const res = await Promise.all(e.options.map((x) => (x == null ? null : runCpp(fill(e.template, x), o))));
        const c = res[correct];
        if (!c) return fail('đáp án đúng không có code');
        if (e.kind === 'cpp-find-error') {
          const want = e.errorKind === 'runtime' ? 'runtime-error' : 'compile-error';
          if (c.outcome !== want) return fail(`đáp án đúng lẽ ra ${want} nhưng là ${label(c)}`);
          if (!matches(c, e.match)) return fail(`thiếu "${e.match}" trong lỗi: ${c.codes[0] ?? ''}`);
          const notOk = res.map((r, i) => (i !== correct && r && r.outcome !== 'ok' ? `#${i}:${label(r)}` : '')).filter(Boolean);
          if (notOk.length) return fail('đáp án sai cũng lỗi: ' + notOk.join('; '));
          return null;
        }
        if (c.outcome !== 'ok') return fail(`đáp án đúng #${correct} không chạy OK: ${label(c)} ${c.stderr.split('\n')[0] ?? ''}`);
        if (e.expectOutput != null && c.stdout !== norm(e.expectOutput)) return fail(`stdout đáp án đúng "${c.stdout.slice(0, 60)}" khác expectOutput`);
        const same = res.map((r, i) => (i !== correct && r && r.outcome === 'ok' && r.stdout === c.stdout ? i : -1)).filter((i) => i >= 0);
        if (same.length) return fail(`đáp án sai #${same.join(',#')} cho kết quả GIỐNG đáp án đúng (mơ hồ)`);
        return null;
      }
      return fail(`kind không hợp lệ: ${e.kind}`);
    } catch (err) { return fail('ngoại lệ trong verifier: ' + err.message); }
  });
  for (const m of results) { total++; if (m) { bad++; console.log(m); } else ok++; }
  console.log(`${ok === entries.length ? '✓' : '✗'} ${f}: ${ok}/${entries.length} mục đạt (${questions.size} câu trong chương)`);
}
console.log(bad ? `\n${bad} lỗi / ${total} mục` : `\nOK: ${total} mục kiểm chứng đạt`);
process.exit(bad ? 1 : 0);
