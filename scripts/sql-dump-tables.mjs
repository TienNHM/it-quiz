// Xuất dữ liệu mẫu DSC Shop ra src/data/dsc-shop.json để app hiển thị bảng dữ liệu cạnh câu hỏi SQL.
//   node scripts/sql-dump-tables.mjs
import {mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import {freshDb} from './sql-lib.mjs';

const schema = readFileSync(new URL('../content/sql/seed/01_schema.sql', import.meta.url), 'utf8');
/** Câu CREATE TABLE (bỏ tiền tố shop.) và các CREATE INDEX của bảng, để người học thấy cột, kiểu, khóa, ràng buộc. */
const ddlOf = (t) => {
  const m = schema.match(new RegExp(String.raw`CREATE TABLE shop\.${t} \([\s\S]*?\n\);`));
  const idx = [...schema.matchAll(new RegExp(String.raw`^CREATE INDEX ON shop\.${t} .*;$`, 'gm'))].map((x) => x[0]);
  return [m?.[0], ...idx].filter(Boolean).join('\n').replaceAll('shop.', '');
};
const db = await freshDb();
const names = (await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'shop' AND table_type = 'BASE TABLE' ORDER BY table_name")).rows.map((r) => r.table_name);
const cell = (v) => (v == null ? null : typeof v === 'bigint' ? Number(v) : v instanceof Date ? v.toISOString().replace('T', ' ').replace(/\.000Z$/, 'Z') : typeof v === 'object' ? JSON.stringify(v) : v);
const tables = {};
for (const t of names) {
  const key = (await db.query(`SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = 'shop.${t}'::regclass AND i.indisprimary`)).rows.map((r) => r.attname);
  const res = await db.query(`SELECT * FROM shop.${t} ORDER BY 1`);
  tables[t] = {ddl: ddlOf(t), columns: res.fields.map((f) => f.name), pk: key, rows: res.rows.map((r) => Object.values(r).map(cell))};
}
mkdirSync('src/data', {recursive: true});
writeFileSync('src/data/dsc-shop.json', JSON.stringify({tables}) + '\n');
console.log(Object.entries(tables).map(([k, v]) => `${k}: ${v.rows.length} dòng`).join('\n'));
