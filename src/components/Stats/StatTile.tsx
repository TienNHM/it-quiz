export default function StatTile({label, value, sub}: {label: string; value: string | number; sub?: string}) {
  return (
    <div className="card" style={{textAlign: 'center'}}>
      <div style={{fontSize: '1.6rem', fontWeight: 800}}>{value}</div>
      <div className="muted" style={{fontSize: '0.85rem'}}>
        {label}
      </div>
      {sub && (
        <div className="muted" style={{fontSize: '0.75rem'}}>
          {sub}
        </div>
      )}
    </div>
  );
}
