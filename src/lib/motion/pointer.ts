"use client";

/**
 * One shared, allocation-free pointer tracker for the whole page.
 * The cursor, magnetic pills, the background lens, the hero lens and the 3D keyboard tilt all read
 * the same state, so there is exactly one pointermove listener and every consumer stays in sync.
 *
 *   useEffect(() => trackPointer(), []);            // keep tracking alive while mounted
 *   pointer.x / pointer.nx ...                       // read inside rAF / ticker code
 *   useEffect(() => subscribePointer((p, e) => {}), []); // 1:1 per-event work (the cursor dot)
 */
export type PointerState = {
  /** Viewport pixels. */
  x: number;
  y: number;
  /** Normalised device coords, -1..1 (y up), handy for shaders/3D. */
  nx: number;
  ny: number;
  /** Smoothed velocity in px/event. */
  vx: number;
  vy: number;
  /** True once the pointer has moved at least once and is inside the window. */
  active: boolean;
  /** Pointer currently pressed. */
  down: boolean;
  /** Last pointer type: "mouse" | "pen" | "touch". */
  type: string;
};

export const pointer: PointerState = { x: 0, y: 0, nx: 0, ny: 0, vx: 0, vy: 0, active: false, down: false, type: "mouse" };

type PointerListener = (p: PointerState, e: PointerEvent) => void;
const listeners = new Set<PointerListener>();
const leaveListeners = new Set<() => void>();

let refCount = 0;
let lastX = 0;
let lastY = 0;

function onMove(e: PointerEvent) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1);
  pointer.vx = pointer.vx * 0.8 + (e.clientX - lastX) * 0.2;
  pointer.vy = pointer.vy * 0.8 + (e.clientY - lastY) * 0.2;
  pointer.type = e.pointerType;
  lastX = e.clientX;
  lastY = e.clientY;
  pointer.active = true;
  listeners.forEach((fn) => fn(pointer, e));
}
const onDown = (e: PointerEvent) => {
  pointer.down = true;
  pointer.type = e.pointerType;
};
const onUp = () => (pointer.down = false);
const onLeave = () => {
  pointer.active = false;
  leaveListeners.forEach((fn) => fn());
};

/** Start tracking (ref-counted). Returns a stop function: call it from an effect. */
export function trackPointer(): () => void {
  if (typeof window === "undefined") return () => {};
  if (refCount++ === 0) {
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
  }
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    if (--refCount === 0) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    }
  };
}

/**
 * Per-event subscription (also starts tracking). Use for work that must be 1:1 with the pointer.
 * Returns an unsubscribe function.
 */
export function subscribePointer(fn: PointerListener, onPointerLeave?: () => void): () => void {
  const stop = trackPointer();
  listeners.add(fn);
  if (onPointerLeave) leaveListeners.add(onPointerLeave);
  return () => {
    listeners.delete(fn);
    if (onPointerLeave) leaveListeners.delete(onPointerLeave);
    stop();
  };
}
