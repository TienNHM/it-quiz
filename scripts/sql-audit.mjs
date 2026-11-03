// So sánh bảng thực sự được SQL của câu hỏi chạm tới (theo mục kiểm chứng) với bảng mà panel dữ liệu sẽ hiển thị.
import {readFileSync, readdirSync, existsSync} from 'node:fs';
const K = ['categories','customers','employees','order_items','orders','payments','products'];
const re = (t) => new RegExp(`(?<![\w.])(?:shop\.)?${t}(?![\w])`, 'i');
const detect = (q) => { const text = [q.question, q.code ?? '', ...q.options].join('\n'); return K.filter((t) => re(t).test(text)); };
let nData = 0, nShown = 0, miss = [], none = [];
for (const f of readdirSync('content/sql').filter((f) => /^\d\d-.+\.json$/.test(f))) {
  const qs = JSON.parse(readFileSync('content/sql/' + f, 'utf8')).questions;
  const vp = 'content/sql/verify/' + f;
  const ver = new Map((existsSync(vp) ? JSON.parse(readFileSync(vp, 'utf8')) : []).map((e) => [e.id, e]));
  for (const q of qs) {
    const e = ver.get(q.id);
    const shown = detect(q);
    if (shown.length) nShown++;
    if (!e) continue;
    nData++;
    const truth = K.filter((t) => re(t).test(JSON.stringify(e)));
    const lack = truth.filter((t) => !shown.includes(t));
    if (lack.length) miss.push(`${q.id} thiếu ${lack.join(',')} (hiện: ${shown.join(',') || '-'})`);
    if (!truth.length && !shown.length) none.push(q.id);
  }
}
console.log({verified: nData, panelQuestions: nShown, verifiedMissingTables: miss.length, verifiedNoTableAtAll: none.length});
console.log(miss.join('\n')); console.log('NONE:', none.join(' '));
