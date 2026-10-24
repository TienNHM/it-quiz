import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {highlight} from '../CodeBlock';

const html = (code: string, lang: string) => renderToStaticMarkup(<code>{highlight(code, lang)}</code>);
/** Văn bản sau khi bỏ thẻ phải bằng đúng mã nguồn gốc (không mất/thêm ký tự). */
const textOf = (h: string) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'");

const SAMPLES: Record<string, string> = {
  csharp: 'public async Task<int> Foo(string s) // note\n{\n  var x = $"a{s}" + 42;\n  return await Bar(x);\n}\n[HttpGet("a")] record P(int A);',
  sql: "SELECT COUNT(*), name FROM customers WHERE city = 'HN' -- c\nORDER BY 1;",
  bash: 'git commit -m "msg" --amend # c\necho $HOME && dotnet run -c Release',
  json: '{"a": 1, "b": [true, null], "c": "x"}',
  yaml: 'services:\n  api:\n    image: "x"\n    ports: [80]\n# c',
  xml: '<Project Sdk="x"><PropertyGroup a="1"/><!-- c --></Project>',
  dockerfile: 'FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build\nRUN dotnet publish -o /app\n# c',
  http: 'GET /api/x HTTP/1.1\nAuthorization: Bearer abc\n\n{"a":1}',
};

describe('highlight', () => {
  for (const [lang, code] of Object.entries(SAMPLES)) {
    it(`${lang}: giữ nguyên văn bản và có tô màu`, () => {
      const h = html(code, lang);
      expect(textOf(h)).toBe(code);
      expect(h).toContain('class="sql-');
    });
  }
  it('csharp: từ khoá, kiểu, chuỗi, chú thích', () => {
    const h = html('public string Name = "a"; // c', 'csharp');
    expect(h).toContain('<span class="sql-k">public</span>');
    expect(h).toContain('<span class="sql-t">string</span>');
    expect(h).toContain('<span class="sql-s">&quot;a&quot;</span>');
    expect(h).toContain('<span class="sql-c">// c</span>');
  });
  it('ngôn ngữ lạ hoặc rỗng: văn bản thường', () => {
    expect(html('abc <x>', 'brainfuck')).toBe('<code>abc &lt;x&gt;</code>');
  });
});
