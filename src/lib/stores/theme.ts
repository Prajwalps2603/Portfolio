"use client";

/**
 * LIGHT AND DARK (his ask: "I need light mode and dark mode"). html[data-theme="dark"] is dark; light
 * has no attribute. Set before the first paint by the boot script (src/lib/motion/bootScript.ts):
 * the visitor's choice (localStorage "pmp:theme") or, until they choose, the OS setting, which is
 * followed live. The switch crossfades (a view transition; at once with reduced motion or in lite
 * mode). Sketch mode stays a paper drawing whatever the theme (globals.css keys dark on
 * :not([data-sketch])). The colours: globals.css, "DARK MODE".
 */
import { useSyncExternalStore } from "react";
import { THEME_KEY } from "@/lib/motion/bootScript";

export type Theme = "light" | "dark";
const listeners = new Set<() => void>();
const PAPER = { light: "#f4f4ef", dark: "#11110f" } as const;

export const getTheme = (): Theme =>
  typeof document !== "undefined" &&
  document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";

function apply(t: Theme) {
  const d = document.documentElement;
  if (t === "dark") d.setAttribute("data-theme", "dark");
  else d.removeAttribute("data-theme");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", PAPER[t]);
  listeners.forEach((l) => l());
}

/** switch the theme (remembered unless asked not to), crossfading where motion is welcome */
export function setTheme(t: Theme, remember = true) {
  if (remember) {
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
  }
  if (t === getTheme()) return;
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => unknown;
  };
  const calm =
    document.documentElement.classList.contains("rm") ||
    document.documentElement.classList.contains("lite");
  if (!calm && typeof doc.startViewTransition === "function")
    doc.startViewTransition(() => apply(t));
  else apply(t);
}

export const toggleTheme = () =>
  setTheme(getTheme() === "dark" ? "light" : "dark");

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "light");
}

/** follow the OS setting live, for as long as the visitor has not chosen */
export function followSystem(): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => {
    try {
      if (localStorage.getItem(THEME_KEY)) return;
    } catch {}
    apply(mq.matches ? "dark" : "light");
  };
  // the meta colour, once, for the theme the boot script chose
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", PAPER[getTheme()]);
  mq.addEventListener("change", sync);
  return () => mq.removeEventListener("change", sync);
}
