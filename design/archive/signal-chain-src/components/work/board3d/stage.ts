"use client";

import type { ReactNode } from "react";
import { createRoot, type ReconcilerRoot, type RootStore } from "@react-three/fiber";
import { dprForTier, getQualityTier } from "@/lib/gpu";

/**
 * ONE WebGL context for the bench board, kept across system switches.
 *
 * The bench keys its board by system, so the board component remounts on every re-acquisition.
 * Mounting a fresh R3F <Canvas> each time would create a new context and recompile every
 * shader in the middle of the authored moment. Instead a single canvas + R3F root lives here
 * and is lent to whichever board is mounted: `lease()` moves the canvas into that board's host,
 * `release()` takes it back. If no board asks for it within a grace period (the visitor opened a
 * datasheet, or the layout switched to the SVG board) the root is unmounted: R3F disposes the
 * renderer and forces the context to be released.
 */

type Stage = {
  canvas: HTMLCanvasElement;
  root: ReconcilerRoot<HTMLCanvasElement>;
  store: RootStore | null;
  host: HTMLElement | null;
  timer: ReturnType<typeof setTimeout> | null;
  lost: boolean;
  onLost: (() => void) | null;
};

let stage: Stage | null = null;
const GRACE_MS = 2500;

export type Lease = {
  render: (node: ReactNode) => void;
  resize: (width: number, height: number) => void;
  release: () => void;
  canvas: HTMLCanvasElement;
};

function create(): Stage {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%;opacity:0;transition:opacity 180ms cubic-bezier(0.16,1,0.3,1)";
  const root = createRoot(canvas);
  const s: Stage = { canvas, root, store: null, host: null, timer: null, lost: false, onLost: null };
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    s.lost = true;
    s.onLost?.();
  });
  return s;
}

function destroy() {
  const s = stage;
  if (!s) return;
  stage = null;
  s.root.unmount();
  s.canvas.remove();
}

/**
 * Lend the shared canvas to `host` (it must be positioned and visible). The first lease
 * configures the root: demand frameloop, DPR clamp from the quality tier, no tone mapping (the
 * palette's hex values render as they are), an orthographic camera the scene frames itself, and
 * no R3F pointer events (picking is analytic, in the scene).
 */
export function lease(host: HTMLElement, width: number, height: number, onLost: () => void): Lease {
  if (stage?.lost) destroy();
  const s = stage ?? (stage = create());
  if (s.timer) clearTimeout(s.timer);
  s.timer = null;
  s.host = host;
  s.onLost = onLost;
  host.appendChild(s.canvas);
  s.root
    .configure({
      gl: { antialias: true, alpha: true, powerPreference: "high-performance", stencil: false },
      dpr: dprForTier(getQualityTier()),
      frameloop: "demand",
      flat: true,
      orthographic: true,
      camera: { manual: true, near: 0.1, far: 80, position: [0, 20, 10] },
      size: { width, height, top: 0, left: 0 },
      onCreated: (state) => state.gl.setClearColor(0x000000, 0),
    })
    .catch(() => onLost());
  const mine = () => stage === s && s.host === host;
  return {
    canvas: s.canvas,
    render(node) {
      if (!mine()) return;
      try {
        s.store = s.root.render(node);
      } catch {
        onLost();
      }
    },
    resize(w, h) {
      if (!mine() || !w || !h) return;
      s.store?.getState().setSize(w, h, 0, 0);
    },
    release() {
      if (!mine()) return;
      s.host = null;
      s.onLost = null;
      s.canvas.style.opacity = "0";
      s.canvas.remove();
      s.timer = setTimeout(destroy, GRACE_MS);
    },
  };
}
