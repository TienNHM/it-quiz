import {useEffect, useState, type ReactNode} from 'react';
import {Link, NavLink} from 'react-router-dom';
import {useProgress} from '../lib';

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
  const [installEvt, setInstallEvt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

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
