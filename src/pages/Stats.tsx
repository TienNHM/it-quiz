import {Link} from 'react-router-dom';
import BarChart from '../components/Stats/BarChart';
import StatTile from '../components/Stats/StatTile';
import {chapterStats, getSubjects, subjectStats, useProgress, weakTopics} from '../lib';

const MODE_LABEL: Record<string, string> = {practice: 'Luyện tập', exam: 'Thi thử', review: 'Ôn tập', daily: 'Hằng ngày'};

function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)} phút ${s % 60} giây` : `${s} giây`;
}

export default function Stats() {
  const progress = useProgress();
  const subjects = getSubjects();
  const totals = subjects.map((s) => subjectStats(s.id));
  const total = totals.reduce((a, t) => a + t.total, 0);
  const seen = totals.reduce((a, t) => a + t.seen, 0);
  const mastered = totals.reduce((a, t) => a + t.mastered, 0);
  let ok = 0;
  let tries = 0;
  for (const c of Object.values(progress.cards)) {
    ok += c.correct;
    tries += c.correct + c.wrong;
  }
  const accuracy = tries ? Math.round((ok / tries) * 100) : 0;
  const recent = progress.history.slice(0, 14).reverse();

  return (
    <div className="container">
      <h1>Thống kê</h1>
      <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))'}}>
        <StatTile label="Tổng XP" value={progress.xp} />
        <StatTile label="Chuỗi ngày" value={`🔥 ${progress.streak}`} sub={`Kỷ lục ${progress.bestStreak}`} />
        <StatTile label="Đã học" value={`${seen}/${total}`} />
        <StatTile label="Thành thạo" value={`${mastered}/${total}`} />
        <StatTile label="Độ chính xác" value={`${accuracy}%`} />
      </div>

      <h2 style={{marginTop: 24}}>Độ chính xác 14 phiên gần nhất</h2>
      <div className="card">
        <BarChart
          title="Độ chính xác theo phiên"
          bars={recent.map((r, i) => ({
            label: String(i + 1),
            value: r.total ? r.correct / r.total : 0,
            hint: `${r.title}: ${r.correct}/${r.total}`,
          }))}
        />
      </div>

      {subjects.map((s) => {
        const weak = weakTopics(s.id).slice(0, 8);
        return (
          <section key={s.id}>
            <h2 style={{marginTop: 24}}>
              {s.icon} {s.title}
            </h2>
            <div className="card">
              <h3>Độ chính xác theo chương</h3>
              <BarChart
                title={`Độ chính xác theo chương, ${s.title}`}
                bars={s.chapters.map((c, i) => {
                  const acc = chapterStats(s.id, c.id).accuracy;
                  return {label: String(i + 1), value: acc, hint: `${c.title}: ${Math.round(acc * 100)}%`};
                })}
              />
            </div>
            <div className="card">
              <h3>Chủ đề yếu</h3>
              {weak.length === 0 ? (
                <p className="muted">Chưa có chủ đề yếu. Cứ luyện tập nhé!</p>
              ) : (
                <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                  {weak.map((w) => (
                    <li key={w.topic} style={{display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)'}}>
                      <span>
                        {w.topic}{' '}
                        <span className="muted">
                          · sai {w.wrong}/{w.total}
                        </span>
                      </span>
                      <Link to={`/play/${s.id}/review`}>Luyện</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}

      <h2 style={{marginTop: 24}}>Lịch sử phiên</h2>
      {progress.history.length === 0 ? (
        <div className="card">
          <p className="muted">Chưa có phiên nào.</p>
        </div>
      ) : (
        <div className="card" style={{padding: 0, overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem'}}>
            <thead>
              <tr style={{textAlign: 'left'}}>
                <th style={{padding: 10}}>Chế độ</th>
                <th style={{padding: 10}}>Điểm</th>
                <th style={{padding: 10}}>Thời gian</th>
                <th style={{padding: 10}}>Lúc</th>
              </tr>
            </thead>
            <tbody>
              {progress.history.map((r) => (
                <tr key={r.sessionId} style={{borderTop: '1px solid var(--border)'}}>
                  <td style={{padding: 10}}>{MODE_LABEL[r.mode] ?? r.mode}</td>
                  <td style={{padding: 10}}>
                    {r.correct}/{r.total} ({r.total ? Math.round((r.correct / r.total) * 100) : 0}%)
                  </td>
                  <td style={{padding: 10}}>{fmtDuration(r.durationMs)}</td>
                  <td style={{padding: 10}}>{new Date(r.at).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
