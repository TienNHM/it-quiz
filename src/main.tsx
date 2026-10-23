import {StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App';
import './styles/global.css';

type Notice = 'update' | 'offline' | null;

let setNoticeExternal: (n: Notice) => void = () => {};

const updateSW = registerSW({
  onNeedRefresh() {
    setNoticeExternal('update');
  },
  onOfflineReady() {
    setNoticeExternal('offline');
  },
});

function Root() {
  const [notice, setNotice] = useState<Notice>(null);
  useEffect(() => {
    setNoticeExternal = setNotice;
    return () => {
      setNoticeExternal = () => {};
    };
  }, []);

  return (
    <>
      <App />
      {notice && (
        <div className="toast" role="status" aria-live="polite">
          <span>{notice === 'update' ? 'Có bản mới' : 'Đã sẵn sàng dùng offline'}</span>
          {notice === 'update' && (
            <button className="btn primary" onClick={() => void updateSW(true)}>
              Tải lại
            </button>
          )}
          <button className="btn ghost" aria-label="Đóng thông báo" onClick={() => setNotice(null)}>
            ✕
          </button>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
