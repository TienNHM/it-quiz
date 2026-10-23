import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {
  buildSession,
  finishSession,
  getSubject,
  isCorrect,
  toOriginal,
  type AnswerRecord,
  type Mode,
  type Session,
} from '../lib';
import ConfirmDialog from '../components/Quiz/ConfirmDialog';
import QuestionCard from '../components/Quiz/QuestionCard';
import {fmtDuration} from '../components/Quiz/format';
import '../components/Quiz/quiz.css';

const MODES: Mode[] = ['practice', 'exam', 'review', 'daily'];

export default function Play() {
  const {subjectId = '', mode = ''} = useParams();
  const [sp] = useSearchParams();
  const chapter = sp.get('chapter') ?? undefined;
  const key = `${subjectId}|${mode}|${chapter ?? ''}`;
  const ref = useRef<{key: string; session: Session | null} | null>(null);
  if (!ref.current || ref.current.key !== key) {
    const valid = MODES.includes(mode as Mode) && !!getSubject(subjectId);
    ref.current = {key, session: valid ? buildSession({mode: mode as Mode, subjectId, chapterId: chapter}) : null};
  }
  const session = ref.current.session;

  if (!session)
    return (
      <div className="card">
        <p>Không tìm thấy môn học hoặc chế độ chơi.</p>
        <Link className="btn" to="/">Về trang chủ</Link>
      </div>
    );
  if (session.items.length === 0)
    return (
      <div className="card">
        <h2>{session.title}</h2>
        <p>
          {session.mode === 'review'
            ? 'Hiện chưa có câu nào đến hạn ôn. Hãy luyện thêm rồi quay lại nhé!'
            : 'Chưa có câu hỏi nào trong phần này.'}
        </p>
        <Link className="btn primary" to={`/s/${session.subjectId}`}>Về môn học</Link>
      </div>
    );
  return <Runner key={session.id} session={session} />;
}

function Runner({session}: {session: Session}) {
  const navigate = useNavigate();
  const isExam = session.mode === 'exam';
  const n = session.items.length;
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<number[][]>(() => session.items.map(() => []));
  const [checked, setChecked] = useState<boolean[]>(() => session.items.map(() => false));
  const [marked, setMarked] = useState<Set<number>>(() => new Set());
  const [confirm, setConfirm] = useState<null | 'exit' | 'submit'>(null);
  const [remaining, setRemaining] = useState<number | null>(session.durationSec ?? null);
  const msRef = useRef<number[]>(session.items.map(() => 0));
  const enterRef = useRef(performance.now());
  const doneRef = useRef(false);

  const item = session.items[idx];
  const multi = Array.isArray(item.q.answer);

  const flushTime = useCallback((i: number) => {
    const now = performance.now();
    msRef.current[i] += now - enterRef.current;
    enterRef.current = now;
  }, []);

  const idxRef = useRef(idx);
  idxRef.current = idx;
  const picksRef = useRef(picks);
  picksRef.current = picks;

  const finish = useCallback(
    (picksNow: number[][]) => {
      if (doneRef.current) return;
      doneRef.current = true;
      flushTime(idxRef.current);
      const answers: AnswerRecord[] = session.items.map((it, i) => ({
        qid: it.q.id,
        picked: toOriginal(it, picksNow[i]),
        correct: isCorrect(it, picksNow[i]),
        ms: Math.max(1, Math.round(msRef.current[i])),
      }));
      finishSession(session, answers);
      navigate('/result', {replace: true});
    },
    [flushTime, navigate, session],
  );

  // Đồng hồ thi
  useEffect(() => {
    if (!isExam || !session.durationSec) return;
    const end = session.startedAt + session.durationSec * 1000;
    const tick = () => {
      const left = Math.ceil((end - Date.now()) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) finish(picksRef.current);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [isExam, session, finish]);

  const goTo = (i: number) => {
    if (i === idx || i < 0 || i >= n) return;
    flushTime(idx);
    setIdx(i);
  };

  const check = () => {
    if (picks[idx].length === 0 || checked[idx]) return;
    flushTime(idx);
    setChecked((c) => c.map((v, i) => (i === idx ? true : v)));
  };

  const pick = (d: number) => {
    if (checked[idx]) return;
    if (multi) {
      setPicks((p) => p.map((arr, i) => (i !== idx ? arr : arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d])));
    } else {
      setPicks((p) => p.map((arr, i) => (i === idx ? [d] : arr)));
      if (!isExam) {
        flushTime(idx);
        setChecked((c) => c.map((v, i) => (i === idx ? true : v)));
      }
    }
  };

  const next = () => {
    if (idx < n - 1) goTo(idx + 1);
    else if (!isExam) finish(picks);
    else setConfirm('submit');
  };

  const actions = useRef({pick, check, next});
  actions.current = {pick, check, next};
  const stateRef = useRef({checked, multi, isExam, idx, confirm});
  stateRef.current = {checked, multi, isExam, idx, confirm};

  // Phím tắt: 1-9 chọn, Enter kiểm tra / câu tiếp
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (s.confirm || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (/^[1-9]$/.test(e.key)) {
        const d = Number(e.key) - 1;
        if (d < session.items[s.idx].order.length) actions.current.pick(d);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!s.isExam && !s.checked[s.idx] && s.multi) actions.current.check();
        else if (s.isExam || s.checked[s.idx]) actions.current.next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session]);

  const answered = picks.filter((p) => p.length > 0).length;
  const progressNow = isExam ? answered : checked.filter(Boolean).length;
  const pctDone = Math.round((progressNow / n) * 100);
  const isLast = idx === n - 1;
  const revealed = !isExam && checked[idx];

  return (
    <div>
      <div className="row" style={{marginBottom: 8}}>
        <button className="btn" onClick={() => setConfirm('exit')} aria-label="Thoát phiên">✕ Thoát</button>
        <strong style={{flex: 1, minWidth: 0}}>{session.title}</strong>
        {remaining !== null && (
          <span className={`q-timer${remaining <= 60 ? ' low' : ''}`} role="timer" aria-label="Thời gian còn lại">
            ⏱ {fmtDuration(remaining * 1000)}
          </span>
        )}
      </div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pctDone} aria-label="Tiến độ">
        <span style={{width: `${pctDone}%`}} />
      </div>
      <p className="muted" style={{margin: '4px 0 12px'}}>
        Câu {idx + 1}/{n}
        {isExam && ` · đã trả lời ${answered}`}
      </p>

      <div className="card">
        <QuestionCard item={item} picked={picks[idx]} revealed={revealed} onPick={pick} />
        <div className="q-actions">
          {isExam ? (
            <>
              <button className="btn" disabled={idx === 0} onClick={() => goTo(idx - 1)}>← Trước</button>
              <button
                className="btn"
                aria-pressed={marked.has(idx)}
                onClick={() =>
                  setMarked((m) => {
                    const s = new Set(m);
                    if (s.has(idx)) s.delete(idx);
                    else s.add(idx);
                    return s;
                  })
                }
              >
                {marked.has(idx) ? '⚑ Bỏ đánh dấu' : '⚐ Đánh dấu'}
              </button>
              <span className="spacer" />
              {isLast ? (
                <button className="btn primary" onClick={() => setConfirm('submit')}>Nộp bài</button>
              ) : (
                <button className="btn primary" onClick={next}>Câu tiếp →</button>
              )}
            </>
          ) : (
            <>
              {multi && !checked[idx] && (
                <button className="btn primary" disabled={picks[idx].length === 0} onClick={check}>Kiểm tra</button>
              )}
              <span className="spacer" />
              {checked[idx] && (
                <button className="btn primary" onClick={next}>
                  {isLast ? 'Hoàn thành' : 'Câu tiếp'} <span className="kbd">Enter</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isExam && (
        <div className="card">
          <div className="row">
            <strong>Danh sách câu</strong>
            <button className="btn primary" style={{marginLeft: 'auto'}} onClick={() => setConfirm('submit')}>Nộp bài</button>
          </div>
          <div className="q-nav">
            {session.items.map((_, i) => (
              <button
                key={i}
                className={`${i === idx ? 'cur' : picks[i].length ? 'done' : ''}${marked.has(i) ? ' flag' : ''}`}
                aria-label={`Câu ${i + 1}${picks[i].length ? ', đã trả lời' : ''}${marked.has(i) ? ', đã đánh dấu' : ''}`}
                aria-current={i === idx}
                onClick={() => goTo(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {confirm === 'exit' && (
        <ConfirmDialog
          title="Thoát phiên?"
          message="Kết quả phiên này sẽ không được lưu."
          confirmLabel="Thoát"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            doneRef.current = true;
            navigate(`/s/${session.subjectId}`);
          }}
        />
      )}
      {confirm === 'submit' && (
        <ConfirmDialog
          title="Nộp bài?"
          message={
            n - answered > 0
              ? `Bạn còn ${n - answered} câu chưa trả lời (tính là sai). Vẫn nộp bài?`
              : 'Bạn đã trả lời tất cả các câu. Nộp bài ngay?'
          }
          confirmLabel="Nộp bài"
          cancelLabel="Làm tiếp"
          onCancel={() => setConfirm(null)}
          onConfirm={() => finish(picks)}
        />
      )}
    </div>
  );
}
