import type {ReactNode} from 'react';

/** Inline: **đậm** và `code`. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    out.push(tok.startsWith('**') ? <strong key={k++}>{tok.slice(2, -2)}</strong> : <code key={k++}>{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block = {t: 'p'; v: string} | {t: 'ul'; v: string[]} | {t: 'pre'; v: string};

function parse(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({t: 'p', v: para.join('\n')});
    para = [];
  };
  while (i < lines.length) {
    const line = lines[i];
    if (line.trimStart().startsWith('```')) {
      flush();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) code.push(lines[i++]);
      i++; // bỏ dòng đóng fence
      blocks.push({t: 'pre', v: code.join('\n')});
    } else if (/^\s*[-*] /.test(line)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*] /, ''));
      blocks.push({t: 'ul', v: items});
    } else if (line.trim() === '') {
      flush();
      i++;
    } else {
      para.push(line);
      i++;
    }
  }
  flush();
  return blocks;
}

export default function RichText({text}: {text: string}) {
  const blocks = parse(text);
  return (
    <div className="rich">
      {blocks.map((b, idx) => {
        if (b.t === 'pre')
          return (
            <pre key={idx}>
              <code>{b.v}</code>
            </pre>
          );
        if (b.t === 'ul')
          return (
            <ul key={idx}>
              {b.v.map((li, j) => (
                <li key={j}>{inline(li)}</li>
              ))}
            </ul>
          );
        return (
          <p key={idx} style={{whiteSpace: 'pre-wrap'}}>
            {inline(b.v)}
          </p>
        );
      })}
    </div>
  );
}
