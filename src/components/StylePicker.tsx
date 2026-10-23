import {STYLES, updateSettings, useProgress} from '../lib';
import type {Settings} from '../lib';

const MODES: {id: Settings['theme']; label: string; icon: string}[] = [
  {id: 'light', label: 'Sáng', icon: '☀️'},
  {id: 'dark', label: 'Tối', icon: '🌙'},
  {id: 'auto', label: 'Hệ thống', icon: '🖥️'},
];

/** Chọn chế độ sáng/tối/hệ thống + style. Dùng trong Cài đặt và popover ở header. */
export default function StylePicker({compact = false}: {compact?: boolean}) {
  const {settings} = useProgress();
  const mode = settings.theme === 'dark' || (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';

  return (
    <div className="stylepicker">
      <div className="seg" role="radiogroup" aria-label="Chế độ sáng tối">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={settings.theme === m.id}
            className={settings.theme === m.id ? 'on' : undefined}
            onClick={() => updateSettings({theme: m.id})}
          >
            <span aria-hidden="true">{m.icon}</span> {m.label}
          </button>
        ))}
      </div>
      <div className={compact ? 'style-list compact' : 'style-list'} role="radiogroup" aria-label="Phong cách giao diện">
        {STYLES.map((s) => {
          const [bg, accent, ink] = s.swatch[mode];
          const on = settings.style === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={on ? 'style-card on' : 'style-card'}
              onClick={() => updateSettings({style: s.id})}
            >
              <span className="swatch" aria-hidden="true" style={{background: bg, borderColor: ink}}>
                <i style={{background: accent}} />
                <i style={{background: ink}} />
              </span>
              <span className="style-name">{s.name}</span>
              {!compact && <span className="muted style-desc">{s.desc}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
