// Xuất dữ liệu mẫu DSC Shop ra src/data/dsc-shop.json để app hiển thị bảng dữ liệu cạnh câu hỏi SQL.
//   node scripts/sql-dump-tables.mjs
import {mkdirSync, writeFileSync} from 'node:fs';
import {freshDb} from './sql-lib.mjs';

const db = await freshDb();
const names = (await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'shop' AND table_type = 'BASE TABLE' ORDER BY table_name")).rows.map((r) => r.table_name);
const cell = (v) => (v == null ? null : typeof v === 'bigint' ? Number(v) : v instanceof Date ? v.toISOString().replace('T', ' ').replace(/\.000Z$/, 'Z') : typeof v === 'object' ? JSON.stringify(v) : v);
const tables = {};
for (const t of names) {
  const key = (await db.query(`SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = 'shop.${t}'::regclass AND i.indisprimary`)).rows.map((r) => r.attname);
  const res = await db.query(`SELECT * FROM shop.${t} ORDER BY 1`);
  tables[t] = {columns: res.fields.map((f) => f.name), pk: key, rows: res.rows.map((r) => Object.values(r).map(cell))};
}
mkdirSync('src/data', {recursive: true});
writeFileSync('src/data/dsc-shop.json', JSON.stringify({tables}) + '\n');
console.log(Object.entries(tables).map(([k, v]) => `${k}: ${v.rows.length} dòng`).join('\n'));
