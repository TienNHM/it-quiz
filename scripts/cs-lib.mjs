// Chạy C# thật bằng "dotnet run file.cs" (file-based app, .NET 10). Dùng cho kiểm chứng đáp án câu hỏi .NET.
// Có thể dùng package NuGet bằng dòng đầu file:  #:package Tên@phiên-bản   (hoặc @*)
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const dir = join(tmpdir(), 'itquiz-cs');
mkdirSync(dir, {recursive: true});

const norm = (s) => String(s ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();

/** Chạy một chương trình C# (top-level statements). Trả về {outcome, stdout, stderr, codes}. */
export function runCs(source, {timeoutMs = 90000} = {}) {
  const hash = createHash('sha1').update(source).digest('hex').slice(0, 16);
  const file = join(dir, `p${hash}.cs`);
  writeFileSync(file, source);
  return new Promise((resolve) => {
    const child = spawn('dotnet', ['run', file], {cwd: dir, env: {...process.env, DOTNET_NOLOGO: '1', DOTNET_CLI_TELEMETRY_OPTOUT: '1', NO_COLOR: '1'}});
    let out = '', err = '', done = false;
    const finish = (r) => { if (!done) { done = true; clearTimeout(timer); resolve(r); } };
    const timer = setTimeout(() => { child.kill(); finish({outcome: 'timeout', stdout: norm(out), stderr: norm(err), codes: []}); }, timeoutMs);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('close', (code) => {
      const all = out + '\n' + err;
      const codes = [...new Set([...all.matchAll(/error (CS\d{4})/g)].map((m) => m[1]))];
      const compileFailed = codes.length > 0 || /The build failed/.test(all);
      if (compileFailed) return finish({outcome: 'compile-error', stdout: '', stderr: norm(all), codes});
      if (code !== 0) return finish({outcome: 'runtime-error', stdout: norm(out), stderr: norm(err), codes});
      finish({outcome: 'ok', stdout: norm(out), stderr: norm(err), codes});
    });
  });
}

export {norm};
