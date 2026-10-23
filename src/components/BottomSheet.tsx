import {useEffect, useRef, useState, type ReactNode} from 'react';

/**
 * Bottom sheet: trượt từ đáy (ngón cái với tới), kéo tay cầm xuống để đóng.
 * Từ 768px trở lên hiển thị như modal giữa màn hình.
 */
export default function BottomSheet({title, onClose, children}: {title: string; onClose: () => void; children: ReactNode}) {
  const [dy, setDy] = useState(0);
  const [closing, setClosing] = useState(false);
  const startY = useRef<number | null>(null);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 180);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`sheet-back${closing ? ' out' : ''}`} onClick={close}>
      <div
        className={`sheet${closing ? ' out' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={dy ? {transform: `translateY(${dy}px)`, transition: 'none'} : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sheet-handle"
          onPointerDown={(e) => {
            startY.current = e.clientY;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => startY.current !== null && setDy(Math.max(0, e.clientY - startY.current))}
          onPointerUp={() => {
            if (dy > 90) close();
            setDy(0);
            startY.current = null;
          }}
          aria-hidden="true"
        >
          <span />
        </div>
        <h3 className="sheet-title">{title}</h3>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
