import {Link, useParams} from 'react-router-dom';
import {chapterStats, dueQuestionIds, getSubject, subjectStats, useProgress} from '../lib';
import {Icon} from '../components/Icon';
import {pct} from '../components/Quiz/format';
import '../components/Quiz/quiz.css';

export default function SubjectPage() {
  const {subjectId = ''} = useParams();
  const {settings} = useProgress();
  const subject = getSubject(subjectId);
  if (!subject)
    return (
      <div className="card">
        <p>Không tìm thấy môn học.</p>
        <Link className="btn" to="/">Về trang chủ</Link>
      </div>
    );
  const st = subjectStats(subject.id);
  const due = dueQuestionIds(subject.id).length;
  const examCount = Math.min(settings.examSize, st.total);
  return (
    <div>
      <p><Link to="/" className="backlink"><Icon name="arrowLeft" size={16} /> Trang chủ</Link></p>
      <h1 className="titled"><span className="subj-ico"><Icon name={subject.icon} size={26} /></span> {subject.title}</h1>
      <p className="muted">{subject.description}</p>
      <div className="card">
        <div className="stack">
          <Link className="btn primary big" to={`/play/${subject.id}/practice`}><Icon name="layers" size={18} /> Luyện toàn môn ({st.total} câu)</Link>
          {due > 0 ? (
            <Link className="btn big" to={`/play/${subject.id}/review`}><Icon name="review" size={18} /> Ôn tập thông minh ({due} đến hạn)</Link>
          ) : (
            <button className="btn big" disabled title="Chưa có câu đến hạn ôn"><Icon name="review" size={18} /> Ôn tập thông minh (0)</button>
          )}
          <Link className="btn big" to={`/play/${subject.id}/exam`}><Icon name="exam" size={18} /> Thi thử</Link>
        </div>
        <p className="muted" style={{margin: '8px 0 0'}}>
          Thi thử: {examCount} câu, {settings.examMinutes} phút. Đã làm {st.seen}/{st.total}, thuộc {st.mastered}.
        </p>
      </div>
      <h2 style={{marginTop: 20}}>Các chương</h2>
      <div className="grid chapters">
      {subject.chapters.map((c) => {
        const cs = chapterStats(subject.id, c.id);
        const p = pct(cs.seen, cs.total);
        return (
          <div className="card" key={c.id}>
            <h3>{c.title}</h3>
            <p className="muted">{c.description}</p>
            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} aria-label={`Tiến độ ${c.title}`}>
              <span style={{width: `${p}%`}} />
            </div>
            <div className="row" style={{marginTop: 8}}>
              <small className="muted">
                {cs.seen}/{cs.total} câu · thuộc {cs.mastered} · đúng {Math.round(cs.accuracy * 100)}%
              </small>
              <Link className="btn primary" style={{marginLeft: 'auto'}} to={`/play/${subject.id}/practice?chapter=${encodeURIComponent(c.id)}`}>
                Luyện chương <Icon name="arrowRight" size={16} />
              </Link>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
