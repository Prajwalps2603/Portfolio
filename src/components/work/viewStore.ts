"use client";

import { useSyncExternalStore } from "react";

/**
 * Which side of a project is up: its interface (the mini-UI) or its architecture (the living
 * diagram).
 * - The shared side (`useWorkView`): the pinned stage's one window, and the side every stacked card
 *   starts on. Set by the stage's switch and by the palette's "Show how my projects are built".
 * - A card's own side (`setProjectView`): each stacked card has its own switch and turns over on
 *   its own. Setting the shared side clears them, so every card follows it again.
 * Remembered while the visitor moves between projects, and across a trip to a case study and back
 * (module state lives as long as the tab's app does).
 */
export type WorkView = "interface" | "architecture";

export type WorkState = Readonly<{
  /** The shared side. */
  view: WorkView;
  /** The cards turned away from the shared side (project id -> side). */
  sides: Readonly<Record<string, WorkView>>;
  /** Counts shared turns, so a reader can tell one from a card's own turn. */
  seq: number;
}>;

const INITIAL: WorkState = { view: "interface", sides: {}, seq: 0 };
/** Replaced on every change, never mutated (a stable snapshot for useSyncExternalStore). */
let state: WorkState = INITIAL;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getWorkView(): WorkView {
  return state.view;
}

export function setWorkView(next: WorkView): void {
  if (next === state.view && Object.keys(state.sides).length === 0) return;
  state = { view: next, sides: {}, seq: state.seq + 1 };
  emit();
}

/** The side a card shows (its own choice, else the shared side). */
export function sideOf(s: WorkState, id: string): WorkView {
  return s.sides[id] ?? s.view;
}

export function setProjectView(id: string, next: WorkView): void {
  if (sideOf(state, id) === next) return;
  const sides = { ...state.sides };
  delete sides[id];
  if (next !== state.view) sides[id] = next;
  state = { ...state, sides };
  emit();
}

/** Any change of the shared side or of a card's own side (non-React). */
export function subscribeWorkView(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const getState = () => state;
const serverState = () => INITIAL;
const serverView = (): WorkView => "interface";

export function useWorkView(): [WorkView, (v: WorkView) => void] {
  return [useSyncExternalStore(subscribeWorkView, getWorkView, serverView), setWorkView];
}

/** The whole state: the shared side, every card's own side, the shared-turn count. */
export function useWorkState(): WorkState {
  return useSyncExternalStore(subscribeWorkView, getState, serverState);
}
