import type {StyleId} from './types';

export interface StyleMeta {
  id: StyleId;
  name: string;
  desc: string;
  /** 3 màu minh hoạ [nền, nhấn, viền] cho thẻ chọn style (bản sáng, bản tối). */
  swatch: {light: [string, string, string]; dark: [string, string, string]};
}

export const STYLES: StyleMeta[] = [
  {id: 'obsidian', name: 'Obsidian', desc: 'Kính mờ + bóng cứng, vàng champagne trên nền tím đen.', swatch: {light: ['#f5efe3', '#e5a93a', '#17122b'], dark: ['#0a0814', '#e5a93a', '#f4eee0']}},
  {id: 'pop', name: 'Brutal Pop', desc: 'Neo-brutalism thuần: màu phẳng chói, viền đen dày, bóng cứng.', swatch: {light: ['#fff4d6', '#ff4d8d', '#000000'], dark: ['#141414', '#ffdd33', '#ffffff']}},
  {id: 'aurora', name: 'Aurora Glass', desc: 'Glassmorphism mềm mại: kính trong, bóng đổ êm, gradient cực quang.', swatch: {light: ['#dfe9ff', '#8b7cff', '#ffffff'], dark: ['#0b1230', '#38bdf8', '#a78bfa']}},
  {id: 'terminal', name: 'Terminal', desc: 'Chất hacker: monospace, xanh phosphor, góc vuông, phát sáng.', swatch: {light: ['#eef3e4', '#0b7a2b', '#10230f'], dark: ['#050a06', '#33ff66', '#33ff66']}},
  {id: 'paper', name: 'Paper', desc: 'Tối giản kiểu tạp chí: giấy ngà, mực đen, ít trang trí.', swatch: {light: ['#fafaf7', '#c2410c', '#1a1a1a'], dark: ['#121212', '#fb923c', '#3a3a3a']}},
  {id: 'sunset', name: 'Sunset', desc: 'Gradient hoàng hôn rực rỡ: cam, hồng, tím, bo tròn lớn.', swatch: {light: ['#ffe3d1', '#ff5e7e', '#3b0f4a'], dark: ['#1b0b2e', '#ff7a45', '#ff5e7e']}},
];

export const STYLE_IDS: StyleId[] = STYLES.map((s) => s.id);
