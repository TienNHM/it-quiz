// Kiểm chứng đáp án câu hỏi .NET/C# bằng cách BIÊN DỊCH VÀ CHẠY THẬT (dotnet run file.cs).
//   node scripts/cs-verify.mjs                  # mọi file content/dotnet/verify/*.json
//   node scripts/cs-verify.mjs 04-csharp-core   # một chương
//
// Mỗi file verify là mảng mục, khóa theo id câu hỏi trong content/dotnet/<chương>.json
// (đáp án đúng lấy từ chính file chương). Chương trình là C# top-level statements; dòng đầu có thể
// là "#:package Tên@phiên-bản" để dùng NuGet. Các kiểu:
//  {id, kind:"cs-predict", program}
//      Chạy program, stdout phải KHỚP CHÍNH XÁC văn bản của đáp án đúng trong options (bỏ fence ``` nếu có).
//  {id, kind:"cs-choose", template, options:[snippet|null x4], expectOutput?}
//      Thay {{X}} trong template bằng từng snippet. Đáp án đúng phải biên dịch+chạy OK (và stdout = expectOutput
//      nếu có); mỗi đáp án sai phải LỖI hoặc cho stdout KHÁC đáp án đúng.
//  {id, kind:"cs-find-error", template, options:[snippet x4], errorKind:"compile"|"runtime", code?:"CS0029"}
//      Đáp án đúng gây đúng loại lỗi (và mã CS nếu có); 3 đáp án còn lại phải chạy OK.
//  {id, kind:"cs-outcome", program, expect:"compile-error"|"runtime-error"|"ok", code?:"CS0029"}
//      Chạy program và kiểm tra kết quả biên dịch/chạy (dùng cho câu "đoạn code này có biên dịch được không?").
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {runCs, norm} from './cs-lib.mjs';

const PARTS = process.argv.includes('--parts'); // kiểm tra từng nửa: content/dotnet/parts/<NN-slug>.A|B
const only = process.argv.slice(2).filter((a) => a !== '--parts');
const baseDir = PARTS ? 'content/dotnet/parts' : 'content/dotnet';
const dir = join(baseDir, 'verify');
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).filter((f) => !only.length || only.includes(f));
let total = 0, bad = 0;

const stripFence = (s) => norm(String(s).replace(/^\s*```[a-z]*\n?/i, '').replace(/\n?```\s*$/i, ''));
const fill = (tpl, snip) => tpl.split('{{X}}').join(snip);
const label = (r) => (r.outcome === 'ok' ? `ok[${r.stdout.slice(0, 40).replace(/\n/g, '\n')}]` : `${r.outcome}${r.codes.length ? ' ' + r.codes.join(',') : ''}`);

for (const f of files) {
  const chPath = join(baseDir, `${f}.json`);
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
    try {
      if (e.kind === 'cs-predict') {
        const r = await runCs(e.program);
        if (r.outcome !== 'ok') { fail(`chương trình không chạy OK: ${label(r)} ${r.stderr.split('\n')[0] ?? ''}`); continue; }
        const want = stripFence(q.options[correct]);
        if (r.stdout !== want) { fail(`stdout thật "${r.stdout.slice(0, 80)}" khác đáp án đúng "${want.slice(0, 80)}"`); continue; }
        const dup = q.options.filter((o, i) => i !== correct && stripFence(o) === want);
        if (dup.length) { fail('có đáp án sai trùng đáp án đúng'); continue; }
        ok++;
      } else if (e.kind === 'cs-outcome') {
        const r = await runCs(e.program);
        if (r.outcome !== e.expect) { fail(`kết quả thật ${label(r)} khác kỳ vọng ${e.expect}`); continue; }
        if (e.code && !r.codes.includes(e.code)) { fail(`thiếu mã lỗi ${e.code}, thật: ${r.codes.join(',') || '(không)'}`); continue; }
        ok++;
      } else if (e.kind === 'cs-choose' || e.kind === 'cs-find-error') {
        const res = await Promise.all(e.options.map((o) => (o == null ? null : runCs(fill(e.template, o)))));
        const c = res[correct];
        if (!c) { fail('đáp án đúng không có code'); continue; }
        if (e.kind === 'cs-find-error') {
          const want = e.errorKind === 'runtime' ? 'runtime-error' : 'compile-error';
          if (c.outcome !== want) { fail(`đáp án đúng lẽ ra ${want} nhưng là ${label(c)}`); continue; }
          if (e.code && !c.codes.includes(e.code)) { fail(`thiếu mã lỗi ${e.code}, thật: ${c.codes.join(',') || '(không)'}`); continue; }
          const notOk = res.map((r, i) => (i !== correct && r && r.outcome !== 'ok' ? `#${i}:${label(r)}` : '')).filter(Boolean);
          if (notOk.length) { fail('đáp án sai cũng lỗi: ' + notOk.join('; ')); continue; }
          ok++;
        } else {
          if (c.outcome !== 'ok') { fail(`đáp án đúng #${correct} không chạy OK: ${label(c)} ${c.stderr.split('\n')[0] ?? ''}`); continue; }
          if (e.expectOutput != null && c.stdout !== norm(e.expectOutput)) { fail(`stdout đáp án đúng "${c.stdout.slice(0, 60)}" khác expectOutput`); continue; }
          const same = res.map((r, i) => (i !== correct && r && r.outcome === 'ok' && r.stdout === c.stdout ? i : -1)).filter((i) => i >= 0);
          if (same.length) { fail(`đáp án sai #${same.join(',#')} cho kết quả GIỐNG đáp án đúng (mơ hồ)`); continue; }
          ok++;
        }
      } else fail(`kind không hợp lệ: ${e.kind}`);
    } catch (err) { fail('ngoại lệ trong verifier: ' + err.message); }
  }
  console.log(`${ok === entries.length ? '✓' : '✗'} ${f}: ${ok}/${entries.length} mục đạt (${questions.size} câu trong chương)`);
}
console.log(bad ? `\n${bad} lỗi / ${total} mục` : `\nOK: ${total} mục kiểm chứng đạt`);
process.exit(bad ? 1 : 0);
