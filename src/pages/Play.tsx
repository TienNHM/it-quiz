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
import BottomSheet from '../components/BottomSheet';
import {haptic} from '../components/fx';
import {Icon} from '../components/Icon';
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
  const [confirm, setConfirm] = useState<null | 'exit' | 'submit' | 'list'>(null);
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
    haptic(isCorrect(item, picks[idx]) ? 12 : [28, 40, 28]);
  };

  const pick = (d: number) => {
    if (checked[idx]) return;
    if (multi) {
      setPicks((p) => p.map((arr, i) => (i !== idx ? arr : arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d])));
    } else {
      setPicks((p) => p.map((arr, i) => (i === idx ? [d] : arr)));
      if (!isExam) {
        haptic(isCorrect(item, [d]) ? 12 : [28, 40, 28]);
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

  const nextLabel = isLast ? (isExam ? 'Nộp bài' : 'Hoàn thành') : 'Câu tiếp';
  const toggleMark = () =>
    setMarked((m) => {
      const s = new Set(m);
      if (s.has(idx)) s.delete(idx);
      else s.add(idx);
      return s;
    });

  return (
    <div className="play">
      <div className="playtop">
        <button className="iconbtn" onClick={() => setConfirm('exit')} aria-label="Thoát phiên">
          <Icon name="close" size={20} />
        </button>
        <div className="progress thin" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pctDone} aria-label="Tiến độ">
          <span style={{width: `${pctDone}%`}} />
        </div>
        <span className="q-count">
          {idx + 1}/{n}
        </span>
        {remaining !== null && (
          <span className={`q-timer${remaining <= 60 ? ' low' : ''}`} role="timer" aria-label="Thời gian còn lại">
            <Icon name="clock" size={14} /> {fmtDuration(remaining * 1000)}
          </span>
        )}
      </div>
      <p className="muted play-title">
        {session.title}
        {isExam && ` · đã trả lời ${answered}`}
      </p>

      <div className="card q-card">
        <div key={idx} className="q-slide">
          <QuestionCard item={item} picked={picks[idx]} revealed={revealed} onPick={pick} />
        </div>
      </div>

      <div className="actionbar" role="toolbar" aria-label="Hành động">
        {isExam ? (
          <>
            <button className="iconbtn" onClick={() => setConfirm('list')} aria-label="Danh sách câu">
              <Icon name="grid" size={20} />
            </button>
            <button className={`iconbtn${marked.has(idx) ? ' on' : ''}`} aria-pressed={marked.has(idx)} aria-label={marked.has(idx) ? 'Bỏ đánh dấu' : 'Đánh dấu'} onClick={toggleMark}>
              <Icon name="flag" size={20} filled={marked.has(idx)} />
            </button>
            <button className="iconbtn" disabled={idx === 0} onClick={() => goTo(idx - 1)} aria-label="Câu trước">
              <Icon name="arrowLeft" size={20} />
            </button>
            <button className="btn primary big grow" onClick={next}>
              {nextLabel} <Icon name={isLast ? 'check' : 'arrowRight'} size={18} />
            </button>
          </>
        ) : checked[idx] ? (
          <button className="btn primary big grow" onClick={next} autoFocus>
            {nextLabel} <Icon name={isLast ? 'check' : 'arrowRight'} size={18} />
          </button>
        ) : multi ? (
          <button className="btn primary big grow" disabled={picks[idx].length === 0} onClick={check}>
            <Icon name="check" size={18} /> Kiểm tra
          </button>
        ) : (
          <button className="btn big grow" disabled>
            Chọn một đáp án
          </button>
        )}
      </div>

      {confirm === 'list' && (
        <BottomSheet title={`Danh sách câu · ${answered}/${n}`} onClose={() => setConfirm(null)}>
          <div className="q-nav">
            {session.items.map((_, i) => (
              <button
                key={i}
                className={`${i === idx ? 'cur' : picks[i].length ? 'done' : ''}${marked.has(i) ? ' flag' : ''}`}
                aria-label={`Câu ${i + 1}${picks[i].length ? ', đã trả lời' : ''}${marked.has(i) ? ', đã đánh dấu' : ''}`}
                aria-current={i === idx}
                onClick={() => {
                  goTo(i);
                  setConfirm(null);
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="sheet-actions">
            <button className="btn primary big" onClick={() => setConfirm('submit')}>
              Nộp bài
            </button>
          </div>
        </BottomSheet>
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
