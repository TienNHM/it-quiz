import type {PlayQuestion} from '../lib';
import Mermaid from './Mermaid';
import RichText from './RichText';

interface Props {
  item: PlayQuestion;
  flipped: boolean;
  onFlip: () => void;
}

/** Thẻ ghi nhớ: mặt trước = câu hỏi, mặt sau = đáp án đúng + giải thích. */
export default function Flashcard({item, flipped, onFlip}: Props) {
  const {q} = item;
  const ans = new Set(Array.isArray(q.answer) ? q.answer : [q.answer]);
  const correct = q.options.map((_, i) => i).filter((i) => ans.has(i));
  return (
    <div className="card flashcard" aria-live="polite">
      {q.topic && <span className="chip">{q.topic}</span>}
      <div style={{marginTop: 8}}>
        <RichText text={q.question} />
        {q.code && (
          <pre>
            <code>{q.code}</code>
          </pre>
        )}
        {q.diagram && <Mermaid chart={q.diagram} />}
      </div>
      {!flipped ? (
        <button type="button" className="btn primary" onClick={onFlip} style={{width: '100%'}}>
          Lật thẻ xem đáp án <span className="kbd">Enter</span>
        </button>
      ) : (
        <div style={{borderTop: '1px solid var(--border)', paddingTop: 12}}>
          <h3 style={{color: 'var(--success)'}}>Đáp án đúng</h3>
          <ul style={{paddingLeft: '1.3em', margin: '0 0 0.75em'}}>
            {correct.map((i) => (
              <li key={i}>
                <RichText text={q.options[i]} />
              </li>
            ))}
          </ul>
          {q.explanation && (
            <>
              <h3>Giải thích</h3>
              <RichText text={q.explanation} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
