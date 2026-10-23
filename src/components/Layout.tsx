import {useEffect, useLayoutEffect, useState, type ReactNode} from 'react';
import {Link, NavLink} from 'react-router-dom';
import {useProgress} from '../lib';
import StylePicker from './StylePicker';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

const NAV = [
  {to: '/', label: 'Trang chủ', icon: '🏠', end: true},
  {to: '/review', label: 'Ôn tập', icon: '🔁', end: false},
  {to: '/stats', label: 'Thống kê', icon: '📊', end: false},
  {to: '/settings', label: 'Cài đặt', icon: '⚙️', end: false},
];

export default function Layout({children}: {children: ReactNode}) {
  const {settings} = useProgress();
  const [online, setOnline] = useState(() => navigator.onLine);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [installEvt, setInstallEvt] = useState<InstallPromptEvent | null>(null);

  // Áp style + chế độ (sáng/tối/hệ thống -> data-mode luôn là light|dark đã resolve).
  useLayoutEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'auto' && mq.matches);
      root.dataset.mode = dark ? 'dark' : 'light';
      root.dataset.theme = settings.theme;
      root.dataset.style = settings.style;
    };
    apply();
    if (settings.theme !== 'auto') return;
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme, settings.style]);

  useEffect(() => {
    if (!paletteOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPaletteOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstallEvt(null);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    await installEvt.userChoice;
    setInstallEvt(null);
  };

  return (
    <>
      {!online && (
        <div className="offline-banner" role="status">
          Bạn đang offline - ứng dụng vẫn hoạt động bình thường
        </div>
      )}
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="app-brand">
            IT Quiz
          </Link>
          {installEvt && (
            <button className="btn" onClick={() => void install()}>
              Cài app
            </button>
          )}
          <div className="palette-wrap">
            <button className="btn ghost palette-btn" aria-label="Đổi giao diện" aria-expanded={paletteOpen} onClick={() => setPaletteOpen((o) => !o)}>
              🎨
            </button>
            {paletteOpen && (
              <>
                <div className="palette-back" onClick={() => setPaletteOpen(false)} />
                <div className="palette card" role="dialog" aria-label="Giao diện">
                  <StylePicker compact />
                </div>
              </>
            )}
          </div>
          <nav className="app-nav" aria-label="Điều hướng chính">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({isActive}) => (isActive ? 'active' : undefined)}>
                <span aria-hidden="true">{n.icon}</span>
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="container app-main">{children}</main>
    </>
  );
}
