import { useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "../data/storage.ts";

/**
 * 화면 색. 기본은 기기 설정(system)을 따르고, 사용자가 고르면 그 값이 이긴다.
 * Provider 가 없다. 모듈 하나가 저장소·matchMedia·<html data-theme> 를 들고 있고
 * 컴포넌트는 useSyncExternalStore 로 구독한다. index.html 의 인라인 스크립트가
 * 첫 페인트 전에 같은 규칙으로 data-theme 를 미리 박아 깜빡임을 막는다.
 */
export type ThemePref = "system" | "light" | "dark";
export type Theme = "light" | "dark";

export const THEME_KEY = "hanabi-theme";
export const THEME_COLOR: Record<Theme, string> = { dark: "#1b1e25", light: "#f4f5f8" };

const listeners = new Set<() => void>();

function readPref(): ThemePref {
  const stored = readStorage(THEME_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

let pref: ThemePref = readPref();

const media =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

export function resolveTheme(value: ThemePref = pref): Theme {
  if (value === "system") return media?.matches ? "dark" : "light";
  return value;
}

/** <html data-theme> 와 theme-color 메타를 현재 값에 맞춘다. */
export function applyTheme(): void {
  if (typeof document === "undefined") return;
  const theme = resolveTheme();
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[theme]);
}

function emit(): void {
  applyTheme();
  for (const fn of listeners) fn();
}

export function setThemePref(next: ThemePref): void {
  pref = next;
  writeStorage(THEME_KEY, next);
  emit();
}

export function getThemePref(): ThemePref {
  return pref;
}

media?.addEventListener("change", () => {
  if (pref === "system") emit();
});

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// 스냅숏은 값으로 비교된다. 기기 설정이 바뀌어 pref 는 그대로여도 theme 가 달라지면 문자열이 바뀐다.
function snapshot(): string {
  return `${pref}:${resolveTheme()}`;
}

export function useTheme(): { pref: ThemePref; theme: Theme; setPref: (next: ThemePref) => void } {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "system:dark");
  const [p, theme] = raw.split(":") as [ThemePref, Theme];
  return { pref: p, theme, setPref: setThemePref };
}

applyTheme();
