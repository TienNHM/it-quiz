import {useEffect, useState} from 'react';
import type {Question} from '../../lib';
import CodeBlock from '../CodeBlock';

interface TableData {
  ddl: string;
  columns: string[];
  pk: string[];
  rows: (string | number | boolean | null)[][];
}
type Tables = Record<string, TableData>;

let cache: Promise<Tables> | null = null;
const loadTables = () => (cache ??= import('../../data/dsc-shop.json').then((m) => (m.default as {tables: Tables}).tables));

type Q = Pick<Question, 'id' | 'question' | 'code' | 'options' | 'tables'>;

/** Các bảng DSC Shop mà câu hỏi SQL nhắc tới (trong đề, đoạn SQL hoặc phương án), theo thứ tự xuất hiện. */
export function shopTablesOf(q: Q, known: string[]): string[] {
  if (!q.id.startsWith('sql-')) return [];
  const text = [q.question, q.code ?? '', ...q.options].join('\n');
  const found = known
    .map((t) => ({t, at: text.search(new RegExp(String.raw`(?<![\w.])(?:shop\.)?${t}(?![\w])`, 'i'))}))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((x) => x.t);
  return [...found, ...(q.tables ?? []).filter((t) => known.includes(t) && !found.includes(t))];
}

const KNOWN = ['categories', 'customers', 'employees', 'order_items', 'orders', 'payments', 'products'];

/** Dữ liệu mẫu của các bảng mà câu hỏi dùng, để người học có cơ sở tự tính kết quả. */
export default function DataPanel({q}: {q: Q}) {
  const names = shopTablesOf(q, KNOWN);
  const key = names.join(',');
  const [tables, setTables] = useState<Tables | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!key || !open) return;
    let alive = true;
    loadTables().then((t) => alive && setTables(t));
    return () => {
      alive = false;
    };
  }, [key, open]);
  useEffect(() => setOpen(false), [key]);
  if (!names.length) return null;
  return (
    <details className="data-panel" open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>Dữ liệu và cấu trúc bảng: {names.join(', ')}</summary>
      {open && !tables && <p className="muted">Đang tải...</p>}
      {open &&
        tables &&
        names.map((n) => {
          const t = tables[n];
          if (!t) return null;
          return (
            <div key={n} className="data-table">
              <div className="data-caption">
                <code>{n}</code> <span className="muted">({t.rows.length} dòng)</span>
              </div>
              <CodeBlock code={t.ddl} lang="sql" label={`Cấu trúc bảng ${n}`} />
              <div className="data-scroll">
                <table>
                  <thead>
                    <tr>
                      {t.columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((r, i) => (
                      <tr key={i}>
                        {r.map((v, j) => (
                          <td key={j} className={v === null ? 'null' : typeof v === 'number' ? 'num' : undefined}>
                            {v === null ? 'NULL' : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
    </details>
  );
}
