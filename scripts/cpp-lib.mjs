// Biên dịch và chạy C/C++ thật bằng g++ (MinGW-w64/GCC). Dùng cho kiểm chứng đáp án câu hỏi C/C++.
// Tìm g++ trong PATH; trên Windows có thể cài: winget install BrechtSanders.WinLibs.POSIX.UCRT
import {spawn, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync, writeFileSync, existsSync, readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const dir = join(tmpdir(), 'itquiz-cpp');
mkdirSync(dir, {recursive: true});

export const norm = (s) => String(s ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();

function findGpp() {
  const exe = process.platform === 'win32' ? 'g++.exe' : 'g++';
  if (spawnSync(exe, ['--version']).status === 0) return exe;
  const local = process.env.LOCALAPPDATA;
  if (local) {
    const pk = join(local, 'Microsoft', 'WinGet', 'Packages');
    if (existsSync(pk)) {
      for (const d of readdirSync(pk).filter((n) => /WinLibs/i.test(n))) {
        for (const sub of readdirSync(join(pk, d))) {
          const p = join(pk, d, sub, 'bin', exe);
          if (existsSync(p)) return p;
        }
      }
    }
  }
  throw new Error('Không tìm thấy g++. Cài: winget install BrechtSanders.WinLibs.POSIX.UCRT (Windows) hoặc apt install g++.');
}
export const GPP = findGpp();

function exec(cmd, args, {input = '', timeoutMs}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {cwd: dir});
    let out = '', err = '', done = false;
    const finish = (r) => { if (!done) { done = true; clearTimeout(timer); resolve(r); } };
    const timer = setTimeout(() => { child.kill(); finish({code: null, out, err, timeout: true}); }, timeoutMs);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => finish({code: -1, out, err: String(e), timeout: false}));
    child.on('close', (code) => finish({code, out, err, timeout: false}));
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

/**
 * Biên dịch + chạy một chương trình C++ (hoặc C nếu lang:'c'). Trả về {outcome, stdout, stderr, codes}.
 * outcome: 'ok' | 'compile-error' | 'runtime-error' | 'timeout'. codes: nội dung các dòng "error:" (để so khớp).
 * warn:true bật -Wall (để kiểm tra câu hỏi về cảnh báo, xem trường warnings).
 */
export async function runCpp(source, {stdin = '', std = 'c++17', lang = 'cpp', warn = false, timeoutMs = 10000} = {}) {
  const hash = createHash('sha1').update(lang + std + String(warn) + source).digest('hex').slice(0, 16);
  const src = join(dir, `p${hash}.${lang === 'c' ? 'c' : 'cpp'}`);
  const exe = join(dir, `p${hash}.exe`);
  writeFileSync(src, source);
  const flags = [lang === 'c' ? `-std=${std === 'c++17' ? 'c11' : std}` : `-std=${std}`];
  const c = await exec(GPP, [...flags, warn ? '-Wall' : '-w', '-O0', '-o', exe, src], {timeoutMs: 60000});
  if (c.code !== 0) {
    const codes = [...c.err.matchAll(/error: ([^\n]*)/g)].map((m) => m[1]);
    return {outcome: 'compile-error', stdout: '', stderr: norm(c.err), codes};
  }
  const r = await exec(exe, [], {input: stdin, timeoutMs});
  if (r.timeout) return {outcome: 'timeout', stdout: norm(r.out), stderr: norm(r.err), codes: []};
  if (r.code !== 0) return {outcome: 'runtime-error', stdout: norm(r.out), stderr: norm(r.err), codes: [], exit: r.code};
  return {outcome: 'ok', stdout: norm(r.out), stderr: norm(r.err), codes: [], warnings: warn ? norm(c.err) : ''};
}
