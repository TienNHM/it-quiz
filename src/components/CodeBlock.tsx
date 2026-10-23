import {Fragment, type ReactNode} from 'react';

const KEYWORDS = new Set(
  (
    'select from where and or not in is null like ilike between exists any all some distinct as on using join inner left right full outer cross natural ' +
    'group by having order asc desc nulls first last limit offset fetch next rows row only union intersect except with recursive values ' +
    'insert into update set delete returning conflict do nothing create alter drop table view materialized index unique primary key foreign references ' +
    'constraint check default cascade restrict add column rename to if begin commit rollback savepoint release transaction isolation level read committed ' +
    'repeatable serializable grant revoke on public user role function procedure trigger returns language plpgsql declare end loop for each before after ' +
    'instead of case when then else over partition window filter within cast explain analyze truncate temp temporary schema extension replace ' +
    'true false current_date current_timestamp interval lateral generated always identity serial vacuum cluster lock share exclusive'
  ).split(' '),
);
const TYPES = new Set(
  'int integer bigint smallint numeric decimal real double precision float boolean bool text varchar char character date time timestamp timestamptz json jsonb uuid serial bigserial array'.split(' '),
);

const RE = /(--[^\n]*)|('(?:[^']|'')*')|("[^"\n]*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z_0-9]*)(\s*\()?|(::)/g;

/** Tô màu SQL rất gọn: từ khoá, kiểu, hàm, chuỗi, số, chú thích. Không phải parser, chỉ phục vụ đọc. */
export function highlightSql(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  RE.lastIndex = 0;
  while ((m = RE.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const [full, comment, str, ident, num, word, paren] = m;
    let cls: string | null = null;
    let text = full;
    if (comment) cls = 'c';
    else if (str) cls = 's';
    else if (ident) cls = 'i';
    else if (num) cls = 'n';
    else if (word) {
      const w = word.toLowerCase();
      if (KEYWORDS.has(w)) cls = 'k';
      else if (TYPES.has(w)) cls = 't';
      else if (paren) {
        // tên hàm: tô riêng phần tên, giữ nguyên dấu mở ngoặc
        out.push(
          <span key={k++} className="sql-f">
            {word}
          </span>,
        );
        out.push(paren);
        last = m.index + full.length;
        continue;
      }
    }
    out.push(cls ? <span key={k++} className={`sql-${cls}`}>{text}</span> : <Fragment key={k++}>{text}</Fragment>);
    last = m.index + full.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

/** Khối code; lang = 'sql' thì tô màu cú pháp. */
export default function CodeBlock({code, lang, label}: {code: string; lang?: string; label?: string}) {
  return (
    <pre aria-label={label ?? 'Đoạn mã'} className={lang ? `lang-${lang}` : undefined}>
      <code>{lang === 'sql' ? highlightSql(code) : code}</code>
    </pre>
  );
}
