import {useSyncExternalStore} from 'react';
import type {CardState, ProgressState, SessionResult, Settings, StyleId} from './types';
import {STYLE_IDS} from './styles';

export const STORAGE_KEY = 'itquiz.v1';
export const MAX_HISTORY = 50;

export const defaultSettings = (): Settings => ({style: 'obsidian', shuffleOptions: true, theme: 'auto', examSize: 30, examMinutes: 45});

export const defaultProgress = (): ProgressState => ({
  version: 1,
  cards: {},
  xp: 0,
  streak: 0,
  lastActiveDay: '',
  bestStreak: 0,
  history: [],
  settings: defaultSettings(),
});

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const posInt = (v: unknown, d: number) => {
  const n = num(v, d);
  return n >= 1 ? Math.floor(n) : d;
};

/** Kiểm tra + chuẩn hoá dữ liệu bất kỳ thành ProgressState; null nếu không hợp lệ. */
export function migrate(raw: unknown): ProgressState | null {
  if (!isObj(raw)) return null;
  if (raw.version !== undefined && raw.version !== 1) return null;
  if (raw.cards !== undefined && !isObj(raw.cards)) return null;
  const base = defaultProgress();

  const cards: Record<string, CardState> = {};
  for (const [id, c] of Object.entries(raw.cards ?? {})) {
    if (!isObj(c)) continue;
    cards[id] = {
      box: Math.min(5, Math.max(0, Math.floor(num(c.box)))),
      seen: Math.max(0, num(c.seen)),
      correct: Math.max(0, num(c.correct)),
      wrong: Math.max(0, num(c.wrong)),
      last: num(c.last),
      due: num(c.due),
    };
  }

  const s = isObj(raw.settings) ? raw.settings : {};
  const settings: Settings = {
    style: STYLE_IDS.includes(s.style as StyleId) ? (s.style as StyleId) : base.settings.style,
    shuffleOptions: typeof s.shuffleOptions === 'boolean' ? s.shuffleOptions : base.settings.shuffleOptions,
    theme: s.theme === 'light' || s.theme === 'dark' || s.theme === 'auto' ? s.theme : base.settings.theme,
    examSize: posInt(s.examSize, base.settings.examSize),
    examMinutes: posInt(s.examMinutes, base.settings.examMinutes),
  };

  const history: SessionResult[] = Array.isArray(raw.history)
    ? (raw.history.filter((h) => isObj(h) && typeof h.sessionId === 'string' && Array.isArray(h.answers)) as SessionResult[]).slice(0, MAX_HISTORY)
    : [];

  const streak = Math.max(0, Math.floor(num(raw.streak)));
  return {
    version: 1,
    cards,
    xp: Math.max(0, num(raw.xp)),
    streak,
    lastActiveDay: typeof raw.lastActiveDay === 'string' ? raw.lastActiveDay : '',
    bestStreak: Math.max(streak, Math.floor(num(raw.bestStreak))),
    history,
    settings,
  };
}

function load(): ProgressState {
  try {
    const txt = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (txt) {
      const m = migrate(JSON.parse(txt));
      if (m) return m;
    }
  } catch {
    /* localStorage không dùng được hoặc JSON hỏng -> mặc định */
  }
  return defaultProgress();
}

let state: ProgressState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* fallback in-memory */
  }
}

/** Thay state bằng tham chiếu mới (bất biến), lưu và thông báo. */
export function commitProgress(next: ProgressState): void {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export const getProgress = (): ProgressState => state;
export const useProgress = (): ProgressState => useSyncExternalStore(subscribe, getProgress, getProgress);

export function updateSettings(patch: Partial<Settings>): void {
  const merged = migrate({...state, settings: {...state.settings, ...patch}});
  if (merged) commitProgress({...state, settings: merged.settings});
}

export function resetProgress(): void {
  commitProgress(defaultProgress());
}

export const exportProgress = (): string => JSON.stringify(state, null, 2);

export function importProgress(json: string): boolean {
  try {
    const m = migrate(JSON.parse(json));
    if (!m) return false;
    commitProgress(m);
    return true;
  } catch {
    return false;
  }
}

/** Chỉ dùng cho test: nạp lại từ localStorage. */
export function reloadProgress(): void {
  commitProgress(load());
}
