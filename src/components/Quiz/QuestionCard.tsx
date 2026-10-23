import {useEffect, useRef} from 'react';
import {correctDisplayIndices, type PlayQuestion} from '../../lib';
import {Icon} from '../Icon';
import Mermaid from '../Mermaid';
import RichText from '../RichText';
import './quiz.css';

export default function QuestionCard(props: {
  item: PlayQuestion;
  picked: number[]; // index hiển thị
  /** true: đã kiểm tra, hiện xanh/đỏ + giải thích */
  revealed: boolean;
  disabled?: boolean;
  onPick: (displayIndex: number) => void;
}) {
  const {item, picked, revealed} = props;
  const {q} = item;
  const multi = Array.isArray(q.answer);
  const correct = new Set(revealed ? correctDisplayIndices(item) : []);
  const sel = new Set(picked);
  const explainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (revealed) explainRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'});
  }, [revealed]);
  return (
    <div>
      <div className="q-head">
        {q.topic && <span className="chip">{q.topic}</span>}
        {multi && <span className="chip">Chọn nhiều đáp án</span>}
      </div>
      <RichText text={q.question} />
      {q.code && (
        <pre aria-label="Đoạn mã">
          <code>{q.code}</code>
        </pre>
      )}
      {q.diagram && <Mermaid chart={q.diagram} />}
      <div className="q-opts" role={multi ? 'group' : 'radiogroup'} aria-label="Các phương án">
        {item.order.map((orig, d) => {
          const isSel = sel.has(d);
          let cls = 'q-opt';
          if (revealed) {
            if (correct.has(d)) cls += ' correct';
            else if (isSel) cls += ' wrong';
          } else if (isSel) cls += ' selected';
          return (
            <button
              key={d}
              type="button"
              className={cls}
              style={{['--i' as string]: d}}
              disabled={props.disabled || revealed}
              role={multi ? 'checkbox' : 'radio'}
              aria-checked={isSel}
              onClick={() => props.onPick(d)}
            >
              <span className={multi ? 'key box' : 'key'} aria-hidden="true">
                {multi ? (isSel || (revealed && correct.has(d)) ? <Icon name="check" size={14} /> : null) : d + 1}
              </span>
              <span style={{flex: 1, minWidth: 0}}>
                <RichText text={q.options[orig]} />
              </span>
              {revealed && (correct.has(d) ? <span className="mark ok"><Icon name="check" size={20} /></span> : isSel ? <span className="mark bad"><Icon name="close" size={20} /></span> : null)}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className="q-explain" aria-live="polite" ref={explainRef}>
          <strong>Giải thích</strong>
          <RichText text={q.explanation} />
        </div>
      )}
    </div>
  );
}
