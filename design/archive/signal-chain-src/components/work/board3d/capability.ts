"use client";

import { useSyncExternalStore } from "react";

/**
 * Where the 3D bench board runs (everything else keeps the SVG board):
 *   - layout: desktop or large-tablet landscape, wide enough for the sticky instrument panel,
 *     with a fine pointer that can hover (phones and portrait tablets keep the SVG);
 *   - device: WebGL2, more than 2 GB of memory, no Save-Data;
 *   - runtime: no failure so far (a context that cannot be created or is lost turns it off).
 * Reduced motion still gets the 3D board, as a static one (no tilt, no pulses, instant swaps).
 * The server and the first client render assume the SVG board.
 */
export const BOARD3D_MEDIA = "(min-width: 1100px) and (orientation: landscape) and (hover: hover) and (pointer: fine)";

let mql: MediaQueryList | null = null;
let device: boolean | null = null;
let failed = false;
const listeners = new Set<() => void>();

const query = () => (mql ??= window.matchMedia(BOARD3D_MEDIA));

function deviceAllows3D(): boolean {
  if (device !== null) return device;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory <= 2)) return (device = false);
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    device = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    device = false;
  }
  return device;
}

function subscribe(fn: () => void) {
  const m = query();
  m.addEventListener("change", fn);
  listeners.add(fn);
  return () => {
    m.removeEventListener("change", fn);
    listeners.delete(fn);
  };
}

const snapshot = () => !failed && query().matches && deviceAllows3D();

/** True where the 3D board should render (reactive to the layout and to runtime failures). */
export function useBoard3D(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}

/** A WebGL failure turns the 3D board off for the rest of the page (the SVG board takes over). */
export function markBoard3DFailed() {
  if (failed) return;
  failed = true;
  listeners.forEach((fn) => fn());
}
