import {Link} from 'react-router-dom';
import {dueQuestionIds, getSubjects, subjectStats, useProgress} from '../lib';
import {CountUp} from '../components/fx';
import {Icon} from '../components/Icon';
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
        <div className="card stat">
          <span className="stat-ico flame"><Icon name="flame" size={22} /></span>
          <div className="stat-big"><CountUp value={progress.streak} /></div>
          <div className="muted">ngày liên tiếp</div>
        </div>
        <div className="card stat">
          <span className="stat-ico"><Icon name="sparkle" size={22} /></span>
          <div className="stat-big"><CountUp value={progress.xp} /></div>
          <div className="muted">điểm XP</div>
        </div>
        <div className="card stat">
          <span className="stat-ico"><Icon name="trophy" size={22} /></span>
          <div className="stat-big"><CountUp value={progress.bestStreak} /></div>
          <div className="muted">kỷ lục</div>
        </div>
      </div>
      {first && (
        <Link className="btn primary big cta" to={`/play/${first.id}/daily`}>
          <Icon name="bolt" size={20} /> Luyện hôm nay
        </Link>
      )}
      <h2>Các môn học</h2>
      {subjects.length === 0 && <p className="muted">Chưa có môn học nào.</p>}
      <div className="grid">
        {subjects.map((s) => {
          const st = subjectStats(s.id);
          const due = dueQuestionIds(s.id).length;
          const p = pct(st.seen, st.total);
          return (
            <Link key={s.id} to={`/s/${s.id}`} className="card subj" style={{textDecoration: 'none', color: 'inherit', display: 'block', margin: 0}}>
              <div className="row">
                <span className="subj-ico"><Icon name={s.icon} size={28} /></span>
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
