export interface Bar {
  label: string;
  value: number; // 0..1
  hint?: string;
}

/** Biểu đồ cột CSS thuần, giá trị 0..1. Cột và nhãn cùng một lưới nên luôn thẳng hàng. */
export default function BarChart({bars, title}: {bars: Bar[]; title: string}) {
  if (!bars.length) return <p className="muted">Chưa có dữ liệu.</p>;
  const color = (v: number) => (v >= 0.8 ? 'var(--success)' : v >= 0.5 ? 'var(--primary)' : 'var(--warning)');
  return (
    <div className="bars" role="img" aria-label={`${title}: ${bars.map((b) => `${b.label} ${Math.round(b.value * 100)}%`).join(', ')}`}>
      <div className="bars-grid" style={{gridTemplateColumns: `repeat(${bars.length}, minmax(26px, 1fr))`}}>
        {bars.map((b, i) => (
          <div key={'c' + i} className="bar-col" title={b.hint ?? `${b.label}: ${Math.round(b.value * 100)}%`}>
            <span className="bar-val">{Math.round(b.value * 100)}</span>
            <div className="bar-fill" style={{height: `${Math.max(3, b.value * 85)}%`, background: color(b.value), animationDelay: `${i * 40}ms`}} />
          </div>
        ))}
        {bars.map((b, i) => (
          <span key={'l' + i} className="bar-label">
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
