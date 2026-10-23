// Tiện ích chạy SQL thật bằng PGlite (PostgreSQL chạy trong Node) trên dữ liệu DSC Shop.
// Dùng cho script kiểm chứng đáp án câu hỏi SQL; không nằm trong bundle của app.
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';

const seed = ['01_schema.sql', '02_seed.sql'].map((f) => readFileSync(new URL(`../content/sql/seed/${f}`, import.meta.url), 'utf8')).join('\n');

/** DB mới nạp sẵn schema shop + seed, search_path và timezone giống môi trường của khóa học. */
export async function freshDb() {
  const db = new PGlite();
  await db.exec(seed);
  await db.exec("SET search_path = shop, public; SET timezone = 'Asia/Ho_Chi_Minh';");
  return db;
}

const plain = (v) => (typeof v === 'bigint' ? v.toString() : v instanceof Date ? v.toISOString() : v);

/** Chạy một khối SQL (nhiều câu). Trả về kết quả câu cuối cùng có cột, hoặc {error}. */
export async function run(db, sql) {
  try {
    const results = await db.exec(sql);
    const last = [...results].reverse().find((r) => r.fields?.length) ?? results[results.length - 1];
    return {
      fields: last?.fields?.map((f) => f.name) ?? [],
      rows: (last?.rows ?? []).map((r) => Object.values(r).map(plain)),
      affected: last?.affectedRows ?? 0,
    };
  } catch (e) {
    return {error: String(e.message ?? e).split('\n')[0]};
  }
}

/** Chạy trong giao dịch rồi hoàn tác, để mỗi phương án thử độc lập. Có thể chạy thêm `probe` trước khi hoàn tác. */
export async function runIsolated(db, sql, probe) {
  await db.exec('BEGIN');
  try {
    const r = await run(db, sql);
    if (r.error) return r;
    if (probe) {
      const p = await run(db, probe);
      return {...r, probe: p};
    }
    return r;
  } finally {
    await db.exec('ROLLBACK').catch(() => {});
  }
}

export function table(r) {
  if (r.error) return `ERROR: ${r.error}`;
  if (!r.fields.length) return `(OK, ${r.affected} dòng bị ảnh hưởng)`;
  const rows = [r.fields, ...r.rows.map((x) => x.map((v) => (v === null ? 'NULL' : String(v))))];
  const w = r.fields.map((_, i) => Math.max(...rows.map((x) => String(x[i]).length)));
  const line = (x) => x.map((v, i) => String(v).padEnd(w[i])).join(' | ');
  return [line(rows[0]), w.map((n) => '-'.repeat(n)).join('-+-'), ...rows.slice(1).map(line), `(${r.rows.length} dòng)`].join('\n');
}
