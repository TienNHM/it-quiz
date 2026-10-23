import {useEffect, useId, useState} from 'react';

function isDark(): boolean {
  const t = document.documentElement.dataset.theme;
  if (t === 'dark') return true;
  if (t === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export default function Mermaid({chart}: {chart: string}) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState('');
  const [failed, setFailed] = useState(false);
  const [dark, setDark] = useState(isDark);

  // Theo dõi đổi theme (data-theme hoặc prefers-color-scheme).
  useEffect(() => {
    const update = () => setDark(isDark());
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener('change', update);
    return () => {
      mo.disconnect();
      mq?.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({startOnLoad: false, securityLevel: 'strict', theme: dark ? 'dark' : 'default'});
        const {svg: out} = await mermaid.render(`mmd-${rid}-${dark ? 'd' : 'l'}`, chart);
        if (!cancelled) setSvg(out);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, dark, rid]);

  if (failed)
    return (
      <pre aria-label="Sơ đồ (mã nguồn)">
        <code>{chart}</code>
      </pre>
    );
  if (!svg) return <p className="muted">Đang tải sơ đồ…</p>;
  return <div className="mermaid-box" role="img" aria-label="Sơ đồ minh hoạ" dangerouslySetInnerHTML={{__html: svg}} />;
}
