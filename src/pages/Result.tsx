import {Link, Navigate} from 'react-router-dom';
import {getQuestion, getSubject, useProgress} from '../lib';
import RichText from '../components/RichText';
import Mermaid from '../components/Mermaid';
import {fmtDuration, pct} from '../components/Quiz/format';
import '../components/Quiz/quiz.css';

export default function Result() {
  const {history, streak} = useProgress();
  const r = history[0];
  if (!r) return <Navigate to="/" replace />;
  const score = pct(r.correct, r.total);
  const wrong = r.answers.filter((a) => !a.correct);
  const subject = getSubject(r.subjectId);
  const retry = `/play/${r.subjectId}/${r.mode}${r.chapterId ? `?chapter=${encodeURIComponent(r.chapterId)}` : ''}`;
  const verdict = score >= 80 ? 'Xuất sắc!' : score >= 50 ? 'Khá tốt, cố thêm chút nữa!' : 'Đừng nản, ôn lại và thử lần nữa nhé!';
  return (
    <div>
      <h1>Kết quả</h1>
      <p className="muted">{r.title}</p>
      <div className="card" style={{textAlign: 'center'}}>
        <div style={{fontSize: '3rem', fontWeight: 800, color: score >= 50 ? 'var(--success)' : 'var(--danger)'}}>{score}%</div>
        <p>{verdict}</p>
      </div>
      <div className="stat-grid" style={{marginTop: 12}}>
        <div className="card"><div className="stat-big">{r.correct}/{r.total}</div><div className="muted">đúng</div></div>
        <div className="card"><div className="stat-big">{fmtDuration(r.durationMs)}</div><div className="muted">thời gian</div></div>
        <div className="card"><div className="stat-big">+{r.xpGained}</div><div className="muted">XP</div></div>
        <div className="card"><div className="stat-big">🔥 {streak}</div><div className="muted">streak</div></div>
      </div>
      <div className="row" style={{margin: '16px 0'}}>
        <Link className="btn primary" to={retry}>Làm lại</Link>
        {wrong.length > 0 && <Link className="btn" to={`/play/${r.subjectId}/review`}>Ôn câu sai ({wrong.length})</Link>}
        <Link className="btn" to={`/s/${r.subjectId}`}>Về môn học{subject ? ` ${subject.title}` : ''}</Link>
      </div>
      <h2>Câu trả lời sai ({wrong.length})</h2>
      {wrong.length === 0 && <p className="muted">Tuyệt vời, bạn không sai câu nào!</p>}
      {wrong.map((a, i) => {
        const q = getQuestion(a.qid);
        if (!q) return null;
        const ans = Array.isArray(q.answer) ? q.answer : [q.answer];
        return (
          <details className="acc" key={a.qid}>
            <summary>
              {i + 1}. {q.question.replace(/[*`]/g, '').split('\n')[0].slice(0, 120)}
            </summary>
            <div>
              <RichText text={q.question} />
              {q.code && <pre><code>{q.code}</code></pre>}
              {q.diagram && <Mermaid chart={q.diagram} />}
              <p><strong style={{color: 'var(--danger)'}}>Bạn chọn:</strong></p>
              {a.picked.length ? (
                <ul>{a.picked.map((p) => <li key={p}><RichText text={q.options[p] ?? ''} /></li>)}</ul>
              ) : (
                <p className="muted">(chưa trả lời)</p>
              )}
              <p><strong style={{color: 'var(--success)'}}>Đáp án đúng:</strong></p>
              <ul>{ans.map((p) => <li key={p}><RichText text={q.options[p] ?? ''} /></li>)}</ul>
              <div className="q-explain"><strong>Giải thích</strong><RichText text={q.explanation} /></div>
            </div>
          </details>
        );
      })}
    </div>
  );
}
