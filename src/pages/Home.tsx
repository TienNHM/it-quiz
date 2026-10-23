import {Link} from 'react-router-dom';
import {dueQuestionIds, getSubjects, subjectStats, useProgress} from '../lib';
import {pct} from '../components/Quiz/format';
import '../components/Quiz/quiz.css';

export default function Home() {
  const progress = useProgress();
  const subjects = getSubjects();
  const first = subjects[0];
  return (
    <div>
      <section className="hero">
        <h1>Ôn tập kiến thức IT</h1>
        <p className="muted">Luyện trắc nghiệm, thi thử và ôn tập thông minh. Chạy offline, chuẩn bị cho phỏng vấn.</p>
      </section>
      <div className="stat-grid" aria-label="Thành tích">
        <div className="card">
          <div className="stat-big">🔥 {progress.streak}</div>
          <div className="muted">ngày liên tiếp</div>
        </div>
        <div className="card">
          <div className="stat-big">⭐ {progress.xp}</div>
          <div className="muted">XP</div>
        </div>
        <div className="card">
          <div className="stat-big">🏆 {progress.bestStreak}</div>
          <div className="muted">streak tốt nhất</div>
        </div>
      </div>
      {first && (
        <p style={{marginTop: 16}}>
          <Link className="btn primary" to={`/play/${first.id}/daily`}>
            ⚡ Luyện hôm nay
          </Link>
        </p>
      )}
      <h2>Các môn học</h2>
      {subjects.length === 0 && <p className="muted">Chưa có môn học nào.</p>}
      <div className="grid">
        {subjects.map((s) => {
          const st = subjectStats(s.id);
          const due = dueQuestionIds(s.id).length;
          const p = pct(st.seen, st.total);
          return (
            <Link key={s.id} to={`/s/${s.id}`} className="card" style={{textDecoration: 'none', color: 'inherit', display: 'block', margin: 0}}>
              <div className="row">
                <span style={{fontSize: '2rem'}} aria-hidden="true">
                  {s.icon}
                </span>
                <div style={{flex: 1, minWidth: 0}}>
                  <h3 style={{margin: 0}}>{s.title}</h3>
                  <span className="muted">{st.total} câu · {s.chapters.length} chương</span>
                </div>
                {due > 0 && <span className="badge" title="Số câu đến hạn ôn">{due} cần ôn</span>}
              </div>
              <p className="muted" style={{margin: '8px 0'}}>{s.description}</p>
              <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} aria-label={`Đã làm ${p}%`}>
                <span style={{width: `${p}%`}} />
              </div>
              <small className="muted">
                Đã làm {st.seen}/{st.total} · Thuộc {st.mastered}
              </small>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
