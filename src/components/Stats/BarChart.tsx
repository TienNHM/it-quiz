export interface Bar {
  label: string;
  value: number; // 0..1
  hint?: string;
}

/** Biểu đồ cột CSS thuần, giá trị 0..1. */
export default function BarChart({bars, title}: {bars: Bar[]; title: string}) {
  if (!bars.length) return <p className="muted">Chưa có dữ liệu.</p>;
  const color = (v: number) => (v >= 0.8 ? 'var(--success)' : v >= 0.5 ? 'var(--primary)' : 'var(--warning)');
  return (
    <div role="img" aria-label={`${title}: ${bars.map((b) => `${b.label} ${Math.round(b.value * 100)}%`).join(', ')}`}>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, overflowX: 'auto'}}>
        {bars.map((b, i) => (
          <div
            key={i}
            title={b.hint ?? `${b.label}: ${Math.round(b.value * 100)}%`}
            style={{flex: '1 0 22px', minWidth: 22, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center'}}
          >
            <span style={{fontSize: '0.7rem', color: 'var(--muted)'}}>{Math.round(b.value * 100)}</span>
            <div style={{width: '100%', height: `${Math.max(2, b.value * 85)}%`, background: color(b.value), borderRadius: '4px 4px 0 0'}} />
          </div>
        ))}
      </div>
      <div style={{display: 'flex', gap: 6, overflowX: 'auto'}}>
        {bars.map((b, i) => (
          <span key={i} style={{flex: '1 0 22px', minWidth: 22, textAlign: 'center', fontSize: '0.7rem', color: 'var(--muted)'}}>
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
