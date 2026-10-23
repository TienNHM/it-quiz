import {useEffect, useRef, useState} from 'react';
import StylePicker from '../components/StylePicker';
import {exportProgress, importProgress, resetProgress, updateSettings, useProgress} from '../lib';

const VERSION = '0.1.0';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v)));

function NumberField({label, value, min, max, onCommit}: {label: string; value: number; min: number; max: number; onCommit: (v: number) => void}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const n = Number(text);
    const v = Number.isFinite(n) && text.trim() !== '' ? clamp(n, min, max) : value;
    setText(String(v));
    onCommit(v);
  };
  return (
    <label style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '8px 0'}}>
      <span>
        {label}{' '}
        <span className="muted">
          ({min}-{max})
        </span>
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        style={{width: 90, minHeight: 40, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)'}}
      />
    </label>
  );
}

export default function Settings() {
  const {settings} = useProgress();
  const [msg, setMsg] = useState<{ok: boolean; text: string} | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [sw, setSw] = useState('Đang kiểm tra…');
  const [online, setOnline] = useState(() => navigator.onLine);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSw('Trình duyệt không hỗ trợ service worker');
      return;
    }
    let alive = true;
    const timer = setTimeout(() => alive && setSw('Chưa kích hoạt (có thể đang chạy chế độ dev)'), 3000);
    navigator.serviceWorker.ready
      .then(() => alive && setSw('Đã sẵn sàng, dùng được khi offline'))
      .catch(() => alive && setSw('Không khả dụng'));
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const doExport = () => {
    const blob = new Blob([exportProgress()], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `it-quiz-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ok: true, text: 'Đã xuất tiến độ.'});
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const ok = importProgress(await file.text());
      setMsg(ok ? {ok: true, text: 'Nhập tiến độ thành công.'} : {ok: false, text: 'File không hợp lệ, tiến độ hiện tại được giữ nguyên.'});
    } catch {
      setMsg({ok: false, text: 'Không đọc được file.'});
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <h1>Cài đặt</h1>

      <div className="card">
        <h2>Giao diện</h2>
        <StylePicker />
      </div>

      <div className="card">
        <h2>Luyện tập và thi thử</h2>
        <label style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, minHeight: 44}}>
          <span>Trộn thứ tự đáp án</span>
          <input type="checkbox" checked={settings.shuffleOptions} onChange={(e) => updateSettings({shuffleOptions: e.target.checked})} style={{width: 22, height: 22}} />
        </label>
        <NumberField label="Số câu đề thi thử" value={settings.examSize} min={5} max={100} onCommit={(v) => updateSettings({examSize: v})} />
        <NumberField label="Thời gian thi (phút)" value={settings.examMinutes} min={5} max={180} onCommit={(v) => updateSettings({examMinutes: v})} />
      </div>

      <div className="card">
        <h2>Dữ liệu tiến độ</h2>
        <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
          <button type="button" className="btn" onClick={doExport}>
            Xuất tiến độ (.json)
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Nhập tiến độ
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden aria-label="Chọn file tiến độ" onChange={(e) => doImport(e.target.files?.[0])} />
        </div>
        {msg && (
          <p role="status" style={{color: msg.ok ? 'var(--success)' : 'var(--danger)', marginTop: 12}}>
            {msg.text}
          </p>
        )}
        <hr style={{border: 0, borderTop: '1px solid var(--border)', margin: '16px 0'}} />
        {!confirmReset ? (
          <button type="button" className="btn danger" onClick={() => setConfirmReset(true)}>
            Xoá toàn bộ tiến độ
          </button>
        ) : (
          <div role="alertdialog" aria-label="Xác nhận xoá tiến độ">
            <p>Thao tác này xoá XP, chuỗi ngày, lịch sử và tiến độ ôn tập, không thể hoàn tác. Chắc chắn chứ?</p>
            <div style={{display: 'flex', gap: 8}}>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                  setMsg({ok: true, text: 'Đã xoá tiến độ.'});
                }}
              >
                Xoá hết
              </button>
              <button type="button" className="btn" onClick={() => setConfirmReset(false)}>
                Huỷ
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Thông tin ứng dụng</h2>
        <p>
          Phiên bản: <strong>{VERSION}</strong>
        </p>
        <p>
          Mạng: <strong>{online ? 'Đang online' : 'Đang offline'}</strong>
        </p>
        <p>
          Chế độ offline: <strong>{sw}</strong>
        </p>
        <p className="muted">IT Quiz giúp bạn ôn tập kiến thức IT và chuẩn bị phỏng vấn bằng quiz và thẻ ghi nhớ lặp lại ngắt quãng. Mọi dữ liệu nằm trên thiết bị của bạn.</p>
      </div>
    </div>
  );
}
