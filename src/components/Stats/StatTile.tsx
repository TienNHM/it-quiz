import {CountUp} from '../fx';
import {Icon} from '../Icon';

/** Ô số liệu: cao bằng nhau trong lưới (dòng phụ luôn chiếm chỗ), số đếm tăng dần khi là số nguyên. */
export default function StatTile({label, value, sub, icon}: {label: string; value: string | number; sub?: string; icon: string}) {
  return (
    <div className="card stat-tile">
      <span className="stat-ico">
        <Icon name={icon} size={20} />
      </span>
      <div className="stat-big">{typeof value === 'number' ? <CountUp value={value} /> : value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-sub muted">{sub ?? ' '}</div>
    </div>
  );
}
