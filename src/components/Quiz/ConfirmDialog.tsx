import {useEffect, useRef} from 'react';
import './quiz.css';

export default function ConfirmDialog(props: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props]);
  return (
    <div className="dialog-back" onClick={props.onCancel}>
      <div className="card dialog" role="dialog" aria-modal="true" aria-label={props.title} onClick={(e) => e.stopPropagation()}>
        <h3>{props.title}</h3>
        <p>{props.message}</p>
        <div className="row" style={{justifyContent: 'flex-end'}}>
          <button ref={ref} className="btn" onClick={props.onCancel}>
            {props.cancelLabel ?? 'Hủy'}
          </button>
          <button className={`btn ${props.danger ? 'danger' : 'primary'}`} onClick={props.onConfirm}>
            {props.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
