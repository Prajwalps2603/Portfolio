"use client";

import { useSyncExternalStore } from "react";

/**
 * The opening's handshake with the hero stage (both owned by "hero").
 *
 *   pending  server render / before the boot mode is known: the stage shows the shipped window
 *   sketch   the opening is drawing: the stage window shows its sketch (the Intro draws it on)
 *   ship     the opening reached the window: the stage compiles it (MiniUI sketch -> ship + stamp)
 *   done     the opening is over or never played: the stage may start its project cycle
 *
 * Writers: the Intro only. Readers: useOpeningPhase() in the hero stage.
 */
export type OpeningPhase = "pending" | "sketch" | "ship" | "done";

let phase: OpeningPhase = "pending";
const listeners = new Set<() => void>();

export const opening = {
  get(): OpeningPhase {
    return phase;
  },
  set(next: OpeningPhase) {
    if (next === phase) return;
    phase = next;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useOpeningPhase(): OpeningPhase {
  return useSyncExternalStore(opening.subscribe, opening.get, () => "pending" as const);
}
