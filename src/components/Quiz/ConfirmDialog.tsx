import BottomSheet from '../BottomSheet';
import './quiz.css';

/** Xác nhận dạng bottom sheet: nút hành động nằm sát đáy, vừa tầm ngón cái. */
export default function ConfirmDialog(props: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <BottomSheet title={props.title} onClose={props.onCancel}>
      <p className="muted">{props.message}</p>
      <div className="sheet-actions">
        <button className={`btn big ${props.danger ? 'danger' : 'primary'}`} onClick={props.onConfirm}>
          {props.confirmLabel}
        </button>
        <button className="btn big" autoFocus onClick={props.onCancel}>
          {props.cancelLabel ?? 'Hủy'}
        </button>
      </div>
    </BottomSheet>
  );
}
