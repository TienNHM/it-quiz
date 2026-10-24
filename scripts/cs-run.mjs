// Chạy thử C#:  node scripts/cs-run.mjs --file a.cs   |   node scripts/cs-run.mjs "Console.WriteLine(1+1);"
import {readFileSync} from 'node:fs';
import {runCs} from './cs-lib.mjs';

const a = process.argv.slice(2);
const src = a[0] === '--file' ? readFileSync(a[1], 'utf8') : a.length ? a.join(' ') : readFileSync(0, 'utf8');
const r = await runCs(src);
console.log(`[${r.outcome}${r.codes.length ? ' ' + r.codes.join(',') : ''}]`);
if (r.stdout) console.log(r.stdout);
if (r.outcome !== 'ok' && r.stderr) console.log(r.stderr.split('\n').slice(0, 12).join('\n'));
