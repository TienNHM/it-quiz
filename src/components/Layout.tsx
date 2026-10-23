import {useEffect, useLayoutEffect, useState, type ReactNode} from 'react';
import {Link, NavLink, useLocation} from 'react-router-dom';
import {useProgress} from '../lib';
import BottomSheet from './BottomSheet';
import {Icon, Logo} from './Icon';
import StylePicker from './StylePicker';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

const NAV = [
  {to: '/', label: 'Trang chủ', icon: 'home', end: true},
  {to: '/review', label: 'Ôn tập', icon: 'review', end: false},
  {to: '/stats', label: 'Thống kê', icon: 'stats', end: false},
  {to: '/settings', label: 'Cài đặt', icon: 'settings', end: false},
];

export default function Layout({children}: {children: ReactNode}) {
  const {settings} = useProgress();
  const {pathname} = useLocation();
  // Đang làm bài: ẩn header + dock để tối đa chỗ cho câu hỏi và thanh hành động ở đáy.
  const immersive = pathname.startsWith('/play/');
  // Trang dạng lưới/danh sách dùng bề ngang rộng trên desktop; trang đọc/làm bài giữ cột hẹp cho dễ đọc.
  const wide = pathname === '/' || pathname.startsWith('/s/') || pathname === '/stats';
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
    window.scrollTo(0, 0);
  }, [pathname]);

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
    <div className={immersive ? 'shell immersive' : 'shell'}>
      {!online && (
        <div className="offline-banner" role="status">
          Bạn đang offline - ứng dụng vẫn hoạt động bình thường
        </div>
      )}
      {!immersive && (
        <header className="app-header">
          <div className="app-header-inner">
            <Link to="/" className="app-brand">
              <Logo />
              <span>IT Quiz</span>
            </Link>
            {installEvt && (
              <button className="btn sm" onClick={() => void install()}>
                <Icon name="download" size={16} /> Cài app
              </button>
            )}
            <nav className="app-nav dock" aria-label="Điều hướng chính">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className={({isActive}) => (isActive ? 'active' : undefined)}>
                  <Icon name={n.icon} size={22} />
                  <span>{n.label}</span>
                </NavLink>
              ))}
              <button type="button" className="dock-btn" aria-label="Đổi giao diện" aria-expanded={paletteOpen} onClick={() => setPaletteOpen(true)}>
                <Icon name="palette" size={22} />
                <span>Giao diện</span>
              </button>
            </nav>
          </div>
        </header>
      )}
      <main className={`container app-main${immersive ? ' play-main' : ''}${wide ? ' wide' : ''}`}>
        <div key={pathname} className="page">
          {children}
        </div>
      </main>
      {paletteOpen && (
        <BottomSheet title="Giao diện" onClose={() => setPaletteOpen(false)}>
          <StylePicker compact />
        </BottomSheet>
      )}
    </div>
  );
}
