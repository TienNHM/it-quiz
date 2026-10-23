// Chạy thử SQL trên DSC Shop thật (PostgreSQL 16-compatible, dữ liệu nạp mới mỗi lần chạy).
//   node scripts/sql-run.mjs "SELECT count(*) FROM customers"
//   node scripts/sql-run.mjs --file query.sql
//   echo "SELECT 1" | node scripts/sql-run.mjs
import {readFileSync} from 'node:fs';
import {freshDb, run, table} from './sql-lib.mjs';

const args = process.argv.slice(2);
let sql;
if (args[0] === '--file') sql = readFileSync(args[1], 'utf8');
else if (args.length) sql = args.join(' ');
else sql = readFileSync(0, 'utf8');

const db = await freshDb();
console.log(table(await run(db, sql)));
await db.close();
