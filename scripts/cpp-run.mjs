// Chạy thử một chương trình C++: npm run cpp:run -- --file x.cpp [--std c++17] [--c] [--stdin "1 2"] [--warn]
import {readFileSync} from 'node:fs';
import {runCpp} from './cpp-lib.mjs';

const a = process.argv.slice(2);
const opt = (k) => (a.includes(k) ? a[a.indexOf(k) + 1] : undefined);
const file = opt('--file');
if (!file) throw new Error('Thiếu --file');
const r = await runCpp(readFileSync(file, 'utf8'), {std: opt('--std') ?? 'c++17', lang: a.includes('--c') ? 'c' : 'cpp', stdin: (opt('--stdin') ?? '').replace(/\\n/g, '\n'), warn: a.includes('--warn')});
console.log(`[${r.outcome}]${r.exit != null ? ' exit=' + r.exit : ''}`);
if (r.stdout) console.log(r.stdout);
if (r.stderr) console.error(r.stderr);
if (r.warnings) console.error(r.warnings);
process.exit(r.outcome === 'ok' ? 0 : 1);
