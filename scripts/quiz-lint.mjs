// Kiểm tra định dạng/chất lượng file câu hỏi theo môn:  node scripts/quiz-lint.mjs <sql|dotnet> [NN-slug ...]
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const FENCE = '```';
const CONFIG = {
  sql: {
    idPrefix: (n) => `sql-d${n}`,
    lang: 'sql',
    isCode: (o) => /\b(SELECT|INSERT INTO|UPDATE|DELETE FROM|CREATE|ALTER|DROP|WITH)\b/.test(o),
    codeFieldLooksLikeCode: (c) => /\b(SELECT|INSERT|UPDATE|DELETE|CREATE)\b/.test(c),
    count: [8, 18],
    minVerify: 0.4,
  },
  dotnet: {
    idPrefix: (n) => `dotnet-m${n}`,
    lang: 'csharp',
    isCode: (o) => /;|=>|\{|\}/.test(o) || /^\s*(public|private|internal|var|using|await|class|record|interface|dotnet|git|docker)\b/.test(o),
    codeFieldLooksLikeCode: (c) => /;|=>|\{|\}/.test(c),
    count: [12, 24],
    minVerify: 0.25,
  },
};
const subject = process.argv[2];
const cfg = CONFIG[subject];
if (!cfg) throw new Error(`Môn không hỗ trợ: ${subject}. Dùng: ${Object.keys(CONFIG).join(', ')}`);
const PARTS = process.argv.includes('--parts'); // lint từng nửa chương: content/<môn>/parts/<NN-slug>.A|B.json
const only = process.argv.slice(3).filter((a) => a !== '--parts');
const dir = PARTS ? join('content', subject, 'parts') : join('content', subject);
if (PARTS) cfg.count = [6, 12];
const chapters = readdirSync(dir)
  .filter((f) => (PARTS ? /^\d\d-.+\.[AB]\.json$/ : /^\d\d-.+\.json$/).test(f))
  .map((f) => f.replace(/\.json$/, ''))
  .filter((f) => !only.length || only.includes(f));
const emoji = /[\u{1F300}-\u{1FAFF}☀-➿⬀-⯿️]/u;
const ALLOWED_LANGS = new Set(['sql', 'csharp', 'bash', 'json', 'yaml', 'xml', 'dockerfile', 'text', 'http', 'ini', 'toml']);
const seen = new Set();
let bad = 0;
const err = (ch, id, m) => {
  bad++;
  console.log(`✗ ${ch}${id ? ' / ' + id : ''}: ${m}`);
};

for (const ch of chapters) {
  const n = ch.slice(0, 2);
  const prefix = cfg.idPrefix(n);
  const set = JSON.parse(readFileSync(join(dir, `${ch}.json`), 'utf8'));
  if (set.id !== prefix) err(ch, '', `id chương phải là ${prefix}, đang là ${set.id}`);
  if (!set.title || !set.description) err(ch, '', 'thiếu title/description');
  const qs = set.questions ?? [];
  if (qs.length < cfg.count[0] || qs.length > cfg.count[1]) err(ch, '', `số câu ${qs.length} ngoài khoảng ${cfg.count.join('-')}`);
  const ansCount = [0, 0, 0, 0];
  for (const q of qs) {
    const id = q.id;
    if (!new RegExp(`^${prefix}-[0-9]{2}$`).test(id ?? '')) err(ch, id, `id phải dạng ${prefix}-NN`);
    if (seen.has(id)) err(ch, id, 'trùng id');
    seen.add(id);
    if (!q.topic) err(ch, id, 'thiếu topic');
    if (!q.source) err(ch, id, 'thiếu source');
    if (!q.question || q.question.length > 800) err(ch, id, 'question rỗng hoặc quá dài');
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      err(ch, id, 'phải có đúng 4 phương án');
      continue;
    }
    if (new Set(q.options.map((o) => String(o).trim())).size !== 4) err(ch, id, 'có phương án trùng nhau');
    if (q.options.some((o) => !String(o).trim())) err(ch, id, 'phương án rỗng');
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) err(ch, id, 'answer phải là 0-3 (chưa dùng câu nhiều đáp án)');
    else ansCount[q.answer]++;
    if (!q.explanation || q.explanation.length < 60) err(ch, id, 'explanation quá ngắn');
    const all = [q.question, q.code, q.explanation, ...q.options].filter(Boolean).join('\n');
    if (emoji.test(all)) err(ch, id, 'không dùng emoji');
    if ((all.match(/```/g) ?? []).length % 2) err(ch, id, 'fence không đóng');
    for (const m of all.matchAll(/```([a-zA-Z0-9#+-]*)/g)) {
      if (m[1] && !ALLOWED_LANGS.has(m[1].toLowerCase())) {
        err(ch, id, `ngôn ngữ fence không hỗ trợ: ${m[1]} (dùng: ${[...ALLOWED_LANGS].join(', ')})`);
        break;
      }
    }
    if (/^\s*\|.*\|\s*$/m.test(q.explanation) || /^#{1,6} /m.test(q.explanation)) err(ch, id, 'explanation không hỗ trợ bảng markdown/tiêu đề; dùng bullet "- " và fence');
    if (q.code && !q.codeLang && cfg.codeFieldLooksLikeCode(q.code)) err(ch, id, `code là mã nguồn thì đặt codeLang (ví dụ "${cfg.lang}")`);
    for (const o of q.options) {
      if (cfg.isCode(o) && !o.trimStart().startsWith(FENCE)) {
        err(ch, id, `phương án là mã nguồn phải bọc trong fence ${FENCE}${cfg.lang}`);
        break;
      }
    }
  }
  const max = Math.max(...ansCount);
  if (qs.length >= 8 && max / qs.length > 0.5) err(ch, '', `đáp án phân bố lệch ${ansCount.join('/')}`);
  const vf = join(dir, 'verify', `${ch}.json`);
  const nVer = existsSync(vf) ? JSON.parse(readFileSync(vf, 'utf8')).length : 0;
  const ratio = qs.length ? nVer / qs.length : 0;
  console.log(`${bad ? '·' : '✓'} ${ch}: ${qs.length} câu, ${nVer} kiểm chứng bằng chạy thật (${Math.round(ratio * 100)}%), đáp án ${ansCount.join('/')}${set.conceptual ? ' [thuần lý thuyết]' : ''}`);
  if (ratio < cfg.minVerify && !set.conceptual) err(ch, '', `chỉ ${Math.round(ratio * 100)}% câu được kiểm chứng bằng chạy thật (cần >= ${cfg.minVerify * 100}%, hoặc đặt "conceptual": true cho chương thuần lý thuyết)`);
}
console.log(bad ? `\n${bad} lỗi` : '\nOK');
process.exit(bad ? 1 : 0);
