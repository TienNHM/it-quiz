import {Fragment, type ReactNode} from 'react';

const set = (s: string) => new Set(s.split(' '));

const SQL_KW = set(
  'select from where and or not in is null like ilike between exists any all some distinct as on using join inner left right full outer cross natural ' +
    'group by having order asc desc nulls first last limit offset fetch next rows row only union intersect except with recursive values ' +
    'insert into update set delete returning conflict do nothing create alter drop table view materialized index unique primary key foreign references ' +
    'constraint check default cascade restrict add column rename to if begin commit rollback savepoint release transaction isolation level read committed ' +
    'repeatable serializable grant revoke on public user role function procedure trigger returns language plpgsql declare end loop for each before after ' +
    'instead of case when then else over partition window filter within cast explain analyze truncate temp temporary schema extension replace ' +
    'true false current_date current_timestamp interval lateral generated always identity serial vacuum cluster lock share exclusive',
);
const SQL_TYPES = set('int integer bigint smallint numeric decimal real double precision float boolean bool text varchar char character date time timestamp timestamptz json jsonb uuid serial bigserial array');

const CS_KW = set(
  'abstract as async await base break case catch checked class const continue default delegate do else enum event explicit extern false finally fixed for foreach ' +
    'goto if implicit in init interface internal is lock namespace new null operator out override params partial private protected public readonly record ref required ' +
    'return sealed sizeof stackalloc static struct switch this throw true try typeof unchecked unsafe using virtual volatile when while with yield get set value ' +
    'global file scoped nameof and or not var dynamic',
);
const CS_TYPES = set('int long short byte sbyte uint ulong ushort double float decimal bool char string object void nint nuint');

const BASH_KW = set('if then else elif fi for in do done while until case esac function return exit export source alias unset local readonly cd echo sudo apt git dotnet docker npm curl cat ls rm mkdir cp mv');

type Rule = {re: string; cls: string | ((m: string) => string | null)};
type Lang = {rules: Rule[]; flags?: string};

const word = (kw: Set<string>, types: Set<string>, ci = false): ((m: string) => string | null) => (m) => {
  const w = ci ? m.toLowerCase() : m;
  if (kw.has(w)) return 'k';
  if (types.has(w)) return 't';
  return null;
};
const fnOrWord = (kw: Set<string>, types: Set<string>, ci = false): ((m: string) => string | null) => (m) => word(kw, types, ci)(m) ?? 'f';

const LANGS: Record<string, Lang> = {
  sql: {
    flags: 'g',
    rules: [
      {re: '--[^\\n]*|/\\*[\\s\\S]*?\\*/', cls: 'c'},
      {re: "'(?:[^']|'')*'", cls: 's'},
      {re: '"[^"\\n]*"', cls: 'i'},
      {re: '\\b\\d+(?:\\.\\d+)?\\b', cls: 'n'},
      {re: '[A-Za-z_][A-Za-z_0-9]*(?=\\s*\\()', cls: fnOrWord(SQL_KW, SQL_TYPES, true)},
      {re: '[A-Za-z_][A-Za-z_0-9]*', cls: word(SQL_KW, SQL_TYPES, true)},
    ],
  },
  csharp: {
    flags: 'g',
    rules: [
      {re: '//[^\\n]*|/\\*[\\s\\S]*?\\*/', cls: 'c'},
      {re: '"""[\\s\\S]*?"""|\\$@?"(?:[^"\\\\\\n]|\\\\.)*"|@\\$?"(?:[^"]|"")*"|"(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)\'', cls: 's'},
      {re: '^[ \\t]*#\\w+[^\\n]*', cls: 'c'},
      {re: '\\[[A-Z]\\w*(?:\\([^)\\n]*\\))?\\]', cls: 't'},
      {re: '\\b\\d[\\d_]*(?:\\.\\d+)?(?:[fFdDmMuUlL]{0,2})\\b', cls: 'n'},
      {re: '[A-Za-z_][A-Za-z_0-9]*(?=\\s*[(<]\\s*[\\w(]|\\s*\\()', cls: (m) => (CS_KW.has(m) ? 'k' : CS_TYPES.has(m) ? 't' : /^[A-Z]/.test(m) ? 'f' : null)},
      {re: '[A-Za-z_][A-Za-z_0-9]*', cls: word(CS_KW, CS_TYPES)},
    ],
  },
  bash: {
    flags: 'g',
    rules: [
      {re: '(?:^|\\s)#[^\\n]*', cls: 'c'},
      {re: '"(?:[^"\\\\]|\\\\.)*"|\'[^\']*\'', cls: 's'},
      {re: '\\$\\{?[A-Za-z_][\\w]*\\}?|\\$\\(', cls: 'f'},
      {re: '(?<=\\s)--?[A-Za-z][\\w-]*', cls: 't'},
      {re: '\\b\\d+(?:\\.\\d+)?\\b', cls: 'n'},
      {re: '[A-Za-z_][\\w-]*', cls: (m) => (BASH_KW.has(m) ? 'k' : null)},
    ],
  },
  json: {
    flags: 'g',
    rules: [
      {re: '"(?:[^"\\\\\\n]|\\\\.)*"(?=\\s*:)', cls: 'f'},
      {re: '"(?:[^"\\\\\\n]|\\\\.)*"', cls: 's'},
      {re: '-?\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b', cls: 'n'},
      {re: '\\b(?:true|false|null)\\b', cls: 'k'},
    ],
  },
  yaml: {
    flags: 'gm',
    rules: [
      {re: '#[^\\n]*', cls: 'c'},
      {re: '^[ \\t-]*[\\w./"-]+(?=\\s*:)', cls: 'f'},
      {re: '"(?:[^"\\\\\\n]|\\\\.)*"|\'[^\'\\n]*\'', cls: 's'},
      {re: '\\b\\d+(?:\\.\\d+)?\\b', cls: 'n'},
      {re: '\\b(?:true|false|null|yes|no)\\b', cls: 'k'},
    ],
  },
  xml: {
    flags: 'g',
    rules: [
      {re: '<!--[\\s\\S]*?-->', cls: 'c'},
      {re: '<\\/?[A-Za-z][\\w:.-]*|\\/?>', cls: 'k'},
      {re: '[A-Za-z_:][\\w:.-]*(?==)', cls: 't'},
      {re: '"[^"]*"|\'[^\']*\'', cls: 's'},
    ],
  },
  dockerfile: {
    flags: 'gm',
    rules: [
      {re: '^\\s*#[^\\n]*', cls: 'c'},
      {re: '^\\s*(?:FROM|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\\b|\\bAS\\b', cls: 'k'},
      {re: '"(?:[^"\\\\]|\\\\.)*"|\'[^\']*\'', cls: 's'},
      {re: '\\$\\{?[A-Za-z_]\\w*\\}?', cls: 'f'},
    ],
  },
  http: {
    flags: 'gm',
    rules: [
      {re: '^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|HTTP\\/\\d(?:\\.\\d)?)\\b', cls: 'k'},
      {re: '^[A-Za-z][\\w-]*(?=:)', cls: 'f'},
      {re: '"(?:[^"\\\\\\n]|\\\\.)*"', cls: 's'},
      {re: '\\b\\d+\\b', cls: 'n'},
    ],
  },
};
const ALIAS: Record<string, string> = {cs: 'csharp', 'c#': 'csharp', sh: 'bash', shell: 'bash', yml: 'yaml', html: 'xml', csproj: 'xml', docker: 'dockerfile', postgresql: 'sql', pgsql: 'sql'};

const compiled = new Map<string, {re: RegExp; rules: Rule[]}>();
function getLang(lang: string) {
  const key = ALIAS[lang] ?? lang;
  const def = LANGS[key];
  if (!def) return null;
  let c = compiled.get(key);
  if (!c) {
    c = {re: new RegExp(def.rules.map((r) => `(${r.re})`).join('|'), def.flags ?? 'g'), rules: def.rules};
    compiled.set(key, c);
  }
  return c;
}

/** Tô màu gọn cho vài ngôn ngữ phổ biến. Không phải parser, chỉ phục vụ đọc. Ngôn ngữ lạ: văn bản thường. */
export function highlight(code: string, lang?: string): ReactNode[] {
  const c = lang ? getLang(lang.toLowerCase()) : null;
  if (!c) return [code];
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  c.re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = c.re.exec(code))) {
    if (m[0] === '') {
      c.re.lastIndex++;
      continue;
    }
    if (m.index > last) out.push(code.slice(last, m.index));
    let idx = 1;
    while (idx < m.length && m[idx] === undefined) idx++;
    const rule = c.rules[idx - 1];
    const cls = typeof rule.cls === 'function' ? rule.cls(m[0]) : rule.cls;
    out.push(cls ? <span key={k++} className={`sql-${cls}`}>{m[0]}</span> : <Fragment key={k++}>{m[0]}</Fragment>);
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

/** Khối code; có lang hỗ trợ thì tô màu cú pháp. */
export default function CodeBlock({code, lang, label}: {code: string; lang?: string; label?: string}) {
  return (
    <pre aria-label={label ?? 'Đoạn mã'} className={lang ? `lang-${lang}` : undefined}>
      <code>{highlight(code, lang)}</code>
    </pre>
  );
}
