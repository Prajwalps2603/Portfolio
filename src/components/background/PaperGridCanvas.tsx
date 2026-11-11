"use client";

import { useEffect, useRef } from "react";
import { dprForTier, getQualityTier } from "@/lib/gpu";
import { subscribePointer } from "@/lib/motion/pointer";
import { onScroll } from "@/lib/stores/stage";
import { getSketchMode, subscribeSketchMode } from "@/lib/stores/sketchMode";

/**
 * The pointer lens on the paper dot grid (loaded lazily by <Background>, fine pointers and full
 * motion only).
 *
 * The grid itself is CSS (html background: pencil dots at 35%, 16px pitch, anchored to the
 * document). This canvas only draws the dots near the pointer, on the SAME lattice: within
 * ~120px they grow and darken toward ink (alpha <= 0.35, never hurting legibility), with an eased
 * follow and no trail. When the pointer rests, the lens breathes very slowly; after 20s at rest,
 * or when the pointer is over an ink / paper-2 section, it fades out and the loop stops.
 * Fixed, aria-hidden, z-index -1 (above the page background, below all content), DPR-clamped
 * via src/lib/gpu.ts, paused when the tab is hidden.
 *
 * Sketch mode (html[data-sketch]): the page is a notebook grid (24px lines), and the same lens
 * inks in the grid lines near the pointer instead (one radial-gradient stroke, a few dozen chords
 * per frame), over every section, since ink and paper-2 bands are paper in the sketch.
 */

const GRID = 16;
const OFF = GRID / 2; // dot centres sit at 8 + 16k (radial-gradient centred in each tile)
const R = 124; // lens radius (px)
/** Sketch mode: the notebook grid (globals.css --sk-grid). Lines sit at 24k (+0.5 for a crisp 1px). */
const SK_GRID = 24;
const IDLE_MS = 1600;
const SLEEP_MS = 20000;

export default function PaperGridCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, dprForTier(getQualityTier())[1]);

    let W = 0;
    let H = 0;
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      prev = null;
      wake();
    };

    // state
    let tx = -9999; // pointer target
    let ty = -9999;
    let cx = -9999; // eased lens centre
    let cy = -9999;
    let k = 0; // eased intensity 0..1
    let inside = false;
    let overPaper = true;
    let lastMove = 0;
    let raf = 0;
    let running = false;
    let prev: { x: number; y: number; w: number; h: number } | null = null;

    const draw = (now: number) => {
      const sketch = getSketchMode();
      const resting = now - lastMove > IDLE_MS;
      const asleep = now - lastMove > SLEEP_MS;
      // breathing at rest: a slow 6s swell of radius and intensity
      const breath = resting ? 0.5 + 0.5 * Math.sin((now / 6000) * Math.PI * 2) : 1;
      // sketch mode: every section is paper (the notebook), so the lens works everywhere
      const target = !inside || (!overPaper && !sketch) || asleep ? 0 : resting ? 0.55 + 0.25 * breath : 1;
      k += (target - k) * (target > k ? 0.12 : 0.08);
      if (cx < -9000) {
        cx = tx;
        cy = ty;
      }
      cx += (tx - cx) * 0.2;
      cy += (ty - cy) * 0.2;
      const radius = R * (resting ? 0.92 + 0.08 * breath : 1);

      if (prev) ctx.clearRect(prev.x, prev.y, prev.w, prev.h);
      prev = null;
      if (k > 0.004 && sketch) {
        // the notebook grid under a lamp: the lines near the pointer ink in (blue, radial falloff)
        const sy = window.scrollY;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        glow.addColorStop(0, `rgb(44 68 216 / ${(0.42 * k).toFixed(3)})`);
        glow.addColorStop(0.55, `rgb(44 68 216 / ${(0.16 * k).toFixed(3)})`);
        glow.addColorStop(1, "rgb(44 68 216 / 0)");
        ctx.strokeStyle = glow;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = Math.ceil((cx - radius) / SK_GRID); i * SK_GRID <= cx + radius; i++) {
          const x = i * SK_GRID + 0.5;
          const h = Math.sqrt(Math.max(0, radius * radius - (x - cx) * (x - cx)));
          ctx.moveTo(x, cy - h);
          ctx.lineTo(x, cy + h);
        }
        for (let j = Math.ceil((cy + sy - radius) / SK_GRID); j * SK_GRID - sy <= cy + radius; j++) {
          const y = j * SK_GRID - sy + 0.5;
          const w = Math.sqrt(Math.max(0, radius * radius - (y - cy) * (y - cy)));
          ctx.moveTo(cx - w, y);
          ctx.lineTo(cx + w, y);
        }
        ctx.stroke();
        const pad = 4;
        prev = { x: cx - radius - pad, y: cy - radius - pad, w: (radius + pad) * 2, h: (radius + pad) * 2 };
      } else if (k > 0.004) {
        const sy = window.scrollY;
        const i0 = Math.floor((cx - radius - OFF) / GRID);
        const i1 = Math.ceil((cx + radius - OFF) / GRID);
        const j0 = Math.floor((cy + sy - radius - OFF) / GRID);
        const j1 = Math.ceil((cy + sy + radius - OFF) / GRID);
        // ink dots on paper; on the dark page, light dots
        ctx.fillStyle =
          document.documentElement.getAttribute("data-theme") === "dark"
            ? "rgb(236 235 227)"
            : "rgb(13 13 12)";
        for (let i = i0; i <= i1; i++) {
          const x = i * GRID + OFF;
          const dx = x - cx;
          for (let j = j0; j <= j1; j++) {
            const y = j * GRID + OFF - sy;
            const d = Math.hypot(dx, y - cy);
            if (d >= radius) continue;
            const f = 1 - d / radius;
            const s = f * f * (3 - 2 * f) * k; // smoothstep falloff
            if (s < 0.01) continue;
            ctx.globalAlpha = 0.3 * s;
            ctx.beginPath();
            ctx.arc(x, y, 0.9 + 1.25 * s, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        const pad = 4;
        prev = { x: cx - radius - pad, y: cy - radius - pad, w: (radius + pad) * 2, h: (radius + pad) * 2 };
      }

      if (k <= 0.004 && target === 0) {
        running = false; // faded out: sleep until the pointer moves or the page scrolls
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    function wake() {
      if (running || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(draw);
    }

    const unsubPointer = subscribePointer(
      (p, e) => {
        if (e.pointerType !== "mouse") return;
        tx = p.x;
        ty = p.y;
        inside = true;
        lastMove = performance.now();
        const t = e.target as Element | null;
        overPaper = !t?.closest?.('[data-tone="ink"],[data-tone="paper-2"]');
        wake();
      },
      () => {
        inside = false;
        wake();
      },
    );
    const offScroll = onScroll(() => wake());
    // dots <-> notebook lines: redraw on the next frame in the other style
    const offSketch = subscribeSketchMode(() => wake());
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        running = false;
      } else wake();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);
    resize();

    return () => {
      cancelAnimationFrame(raf);
      unsubPointer();
      offScroll();
      offSketch();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-(--z-bg)" />;
}
