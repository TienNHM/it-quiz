import {useCallback, useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import Flashcard from '../components/Flashcard';
import {dueQuestionIds, finishSession, getProgress, getQuestion, getSubjectQuestions, getSubjects, useProgress} from '../lib';
import type {AnswerRecord, PlayQuestion, Session} from '../lib';

const MAX_CARDS = 20;

/** Hàng đợi: câu đến hạn; nếu rỗng thì câu box thấp / đã làm sai. */
function buildQueue(subjectId: string | undefined): {items: PlayQuestion[]; due: boolean} {
  const toItems = (ids: string[]): PlayQuestion[] =>
    ids
      .map((id) => getQuestion(id))
      .filter((q): q is NonNullable<typeof q> => !!q)
      .slice(0, MAX_CARDS)
      .map((q) => ({q, order: q.options.map((_, i) => i)}));
  const due = toItems(dueQuestionIds(subjectId));
  if (due.length) return {items: due, due: true};
  const cards = getProgress().cards;
  const subjects = subjectId ? [subjectId] : getSubjects().map((s) => s.id);
  const weak = subjects
    .flatMap((s) => getSubjectQuestions(s))
    .filter((q) => {
      const c = cards[q.id];
      return !!c && c.seen > 0 && (c.box <= 1 || (c.wrong > 0 && c.box <= 3));
    })
    .sort((a, b) => cards[a.id].box - cards[b.id].box || cards[b.id].wrong - cards[a.id].wrong)
    .map((q) => q.id);
  return {items: toItems(weak), due: false};
}

export default function Review() {
  useProgress();
  const subjects = getSubjects();
  const [subjectId, setSubjectId] = useState<string>('');
  const [round, setRound] = useState(0);
  // Chỉ dựng lại hàng đợi khi đổi môn / bắt đầu lượt mới, không theo mỗi lần progress đổi.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const queue = useMemo(() => buildQueue(subjectId || undefined), [subjectId, round]);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [cardStart, setCardStart] = useState(() => Date.now());
  const [finished, setFinished] = useState<{correct: number; total: number; xp: number} | null>(null);

  const reset = useCallback(() => {
    setIdx(0);
    setFlipped(false);
    setAnswers([]);
    setFinished(null);
    const now = Date.now();
    setStartedAt(now);
    setCardStart(now);
  }, []);

  const total = queue.items.length;
  const current = queue.items[idx];

  const mark = useCallback(
    (ok: boolean) => {
      if (!current) return;
      const rec: AnswerRecord = {qid: current.q.id, picked: ok ? current.q.options.map((_, i) => i).filter((i) => (Array.isArray(current.q.answer) ? current.q.answer : [current.q.answer]).includes(i)) : [], correct: ok, ms: Date.now() - cardStart};
      const next = [...answers, rec];
      setAnswers(next);
      if (idx + 1 >= total) {
        const session: Session = {
          id: `review-${startedAt.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          mode: 'review',
          subjectId: subjectId || subjects[0]?.id || '',
          title: 'Ôn tập thẻ ghi nhớ',
          items: queue.items,
          startedAt,
        };
        const res = finishSession(session, next);
        setFinished({correct: res.correct, total: res.total, xp: res.xpGained});
      } else {
        setIdx(idx + 1);
        setFlipped(false);
        setCardStart(Date.now());
      }
    },
    [current, cardStart, answers, idx, total, startedAt, subjectId, subjects, queue.items],
  );

  useEffect(() => {
    if (finished || !current) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(t.tagName) && e.key !== '1' && e.key !== '2') return;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      if (!flipped && e.key === 'Enter') {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped && e.key === '1') mark(false);
      else if (flipped && e.key === '2') mark(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finished, current, flipped, mark]);

  return (
    <div>
      <h1>Ôn tập thẻ ghi nhớ</h1>
      {subjects.length > 1 && (
        <label style={{display: 'block', marginBottom: 12}}>
          <span className="muted">Môn học: </span>
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              reset();
            }}
            aria-label="Lọc theo môn"
            style={{minHeight: 40}}
          >
            <option value="">Tất cả các môn</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
      )}

      {finished ? (
        <div className="card" role="status">
          <h2>Hoàn thành lượt ôn</h2>
          <p>
            Bạn nhớ <strong>{finished.correct}</strong>/{finished.total} thẻ, nhận <strong>+{finished.xp} XP</strong>.
          </p>
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setRound((r) => r + 1);
                reset();
              }}
            >
              Ôn tiếp
            </button>
            <Link className="btn" to="/stats">
              Xem thống kê
            </Link>
            <Link className="btn ghost" to="/">
              Về trang chủ
            </Link>
          </div>
        </div>
      ) : !current ? (
        <div className="card" role="status">
          <h2>Hôm nay không còn câu đến hạn</h2>
          <p className="muted">Bạn đã ôn xong mọi thẻ cần nhắc. Hãy luyện thêm để củng cố kiến thức.</p>
          <Link className="btn primary" to={subjectId ? `/s/${subjectId}` : '/'}>
            Luyện thêm
          </Link>
        </div>
      ) : (
        <>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
            <span>
              Thẻ {idx + 1}/{total}
            </span>
            <span className="chip">{queue.due ? 'Đến hạn ôn' : 'Câu yếu / làm sai'}</span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={idx}
            aria-label="Tiến độ ôn tập"
            style={{marginBottom: 12}}
          >
            <span style={{width: `${(idx / total) * 100}%`}} />
          </div>
          <Flashcard key={current.q.id} item={current} flipped={flipped} onFlip={() => setFlipped(true)} />
          {flipped && (
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12}}>
              <button type="button" className="btn danger" onClick={() => mark(false)}>
                Chưa nhớ <span className="kbd">1</span>
              </button>
              <button type="button" className="btn primary" onClick={() => mark(true)}>
                Nhớ rồi <span className="kbd">2</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
