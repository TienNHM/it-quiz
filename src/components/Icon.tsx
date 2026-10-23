import type {SVGProps} from 'react';

/**
 * Bộ icon tự vẽ: lưới 24x24, nét 1.75, đầu/góc bo tròn, kế thừa màu từ currentColor.
 * Mỗi icon là một chuỗi path; vài icon có phần tô (fill) riêng.
 */
type Def = {d: string; fill?: string; dots?: [number, number, number][]};

const ICONS: Record<string, Def> = {
  home: {d: 'M4 11.2 12 4l8 7.2M6 9.8v9.7h4.4v-5h3.2v5H18V9.8'},
  review: {d: 'M4.2 12a7.8 7.8 0 0 1 13.4-5.4L20 8.8M20 4.2v4.6h-4.6M19.8 12a7.8 7.8 0 0 1-13.4 5.4L4 15.2M4 19.8v-4.6h4.6'},
  stats: {d: 'M5 20v-8M12 20V4M19 20v-5'},
  settings: {d: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 4.8v4.4M9 14.8v4.4'},
  palette: {
    d: 'M12 3.5a8.5 8.5 0 1 0 0 17c1.5 0 2.1-.9 2.1-1.8 0-1.3-1.1-1.6-1.1-2.7 0-1 .8-1.6 1.9-1.6H17a3.5 3.5 0 0 0 3.5-3.5C20.5 6.6 16.7 3.5 12 3.5Z',
    dots: [[7.6, 11.2, 1.05], [10.2, 7.6, 1.05], [14.6, 7.6, 1.05]],
  },
  flame: {d: 'M12 3s5.6 4.3 5.6 9.9A5.6 5.6 0 0 1 12 18.6a5.6 5.6 0 0 1-5.6-5.7c0-2.4 1.2-3.8 2.4-4.9.2 1.8 1 2.7 2 3.1C10.6 8 11.2 5.5 12 3ZM9.4 21h5.2'},
  sparkle: {d: 'M11 3c.7 4.6 2.8 6.7 7.4 7.4-4.6.7-6.7 2.8-7.4 7.4-.7-4.6-2.8-6.7-7.4-7.4C8.2 9.7 10.3 7.6 11 3ZM19 15.6c.2 1.4.8 2 2.2 2.2-1.4.2-2 .8-2.2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2Z'},
  trophy: {d: 'M8 4h8v5.2a4 4 0 0 1-8 0V4ZM8 6H5v1.4a3 3 0 0 0 3.2 3M16 6h3v1.4a3 3 0 0 1-3.2 3M12 13.2V17M9.8 20h4.4M10 17h4'},
  layers: {d: 'M4 7.3 12 3.5l8 3.8-8 3.8-8-3.8ZM4 12l8 3.8 8-3.8M4 16.6 12 20.4l8-3.8'},
  bolt: {d: 'M13.2 3 5.2 13.6h6L10.4 21l8.4-10.6h-6L13.2 3Z'},
  exam: {d: 'M9 4h6v3H9V4ZM7.2 5.6H6.5A1.5 1.5 0 0 0 5 7.1v12.4A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V7.1a1.5 1.5 0 0 0-1.5-1.5h-.7M8.6 14.2l2.5 2.5 4.4-5'},
  flag: {d: 'M6 21V4M6 4.6h10.6l-2.1 3.6 2.1 3.6H6'},
  close: {d: 'M6 6l12 12M18 6 6 18'},
  arrowLeft: {d: 'M19 12H5.5M11 6.2 5.2 12l5.8 5.8'},
  arrowRight: {d: 'M5 12h13.5M13 6.2l5.8 5.8-5.8 5.8'},
  chevronRight: {d: 'M9.5 5.5 16 12l-6.5 6.5'},
  check: {d: 'M5 12.6l4.5 4.5L19 7.4'},
  clock: {d: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM12 7.6V12l3 1.9'},
  grid: {d: 'M4 4h6.5v6.5H4V4ZM13.5 4H20v6.5h-6.5V4ZM4 13.5h6.5V20H4v-6.5ZM13.5 13.5H20V20h-6.5v-6.5Z'},
  list: {d: 'M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01'},
  sun: {d: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4'},
  moon: {d: 'M20 14.6A8 8 0 0 1 9.4 4 8 8 0 1 0 20 14.6Z'},
  monitor: {d: 'M4 5h16v11H4V5ZM9 20h6M12 16v4'},
  cpu: {d: 'M7 7h10v10H7V7ZM10 10h4v4h-4v-4ZM9.5 3v4M14.5 3v4M9.5 17v4M14.5 17v4M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4'},
  download: {d: 'M12 4v11M7.4 10.8 12 15.4l4.6-4.6M5 20h14'},
  target: {d: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', dots: [[12, 12, 0.9]]},
  retry: {d: 'M4.4 12a7.6 7.6 0 1 0 2.4-5.5M4.2 4v4.6h4.6'},
  play: {d: 'M8 5.6v12.8l10.5-6.4L8 5.6Z'},
  info: {d: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM12 11v5.2', dots: [[12, 7.8, 1]]},
  database: {d: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3ZM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6'},
  eye: {d: 'M2.8 12S6.2 5.8 12 5.8 21.2 12 21.2 12 17.8 18.2 12 18.2 2.8 12 2.8 12ZM12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Z'},
};

export type IconName = keyof typeof ICONS;

export function Icon({name, size = 20, filled = false, ...rest}: {name: string; size?: number; filled?: boolean} & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  const def = ICONS[name] ?? ICONS.info;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      fillOpacity={filled ? 0.22 : undefined}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={def.d} />
      {def.dots?.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
      ))}
    </svg>
  );
}

/** Logo: viên ngọc nhiều mặt, tô gradient theo theme. */
export function Logo({size = 26}: {size?: number}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" className="logo-mark">
      <defs>
        <linearGradient id="logog" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--logo-a)" />
          <stop offset="100%" stopColor="var(--logo-b)" />
        </linearGradient>
      </defs>
      <path d="M12 2.6 20.6 9 12 21.4 3.4 9 12 2.6Z" fill="url(#logog)" />
      <path d="M3.4 9h17.2M9 9l3 12.4L15 9M9 9l3-6.4L15 9" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}
