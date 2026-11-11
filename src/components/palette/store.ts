"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny external store for the palette: open flag + optional pre-filled query.
 * Kept out of the lazy body so openPalette() costs nothing until first use.
 */
type State = { open: boolean; query: string; seq: number };
let state: State = { open: false, query: "", seq: 0 };
const listeners = new Set<() => void>();
let opener: HTMLElement | null = null;

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export function openPalette(query?: string): void {
  if (typeof document === "undefined") return;
  if (!state.open) {
    const a = document.activeElement;
    opener = a instanceof HTMLElement && a !== document.body ? a : null;
  }
  set({ open: true, query: query ?? "", seq: state.seq + 1 });
}

export function closePalette(): void {
  if (!state.open) return;
  set({ ...state, open: false });
}

export function togglePalette(): void {
  if (state.open) closePalette();
  else openPalette();
}

export function getOpener(): HTMLElement | null {
  return opener;
}

/** The header trigger registers itself so focus can return to it when nothing else is known. */
let trigger: HTMLElement | null = null;
export function registerTrigger(el: HTMLElement | null) {
  trigger = el;
}
export function getTrigger(): HTMLElement | null {
  return trigger;
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export function usePaletteState(): State {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
