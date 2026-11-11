"use client";

/**
 * THE DIVER (drawn inside the iceberg's SVG, over the ice and under the rows).
 *
 * He stands ready on the ledge at the tip's right foot, a hand on his mask. As the waterline rises
 * past the middle of the screen he takes a giant stride off the ledge, well clear of the ice, and
 * drops in feet first (a splash). Under the surface he pitches head down and moves out to his lane
 * beside the ice's right face (never into it, never into the rows), then keeps to about 40% of the
 * screen while the ice slides up past him: torch on the ice, kicking, trailing bubbles. Past the
 * underside he rights himself (through the horizontal) and lands standing on the seabed, torch down
 * on the languages.
 *
 * Scroll up and he turns (through the horizontal, face down) and swims up head first, torch
 * lighting the way; scroll down again and he turns back. His place follows the scroll position,
 * eased (about 0.12s), so wheel steps never make him jump; the frame loop runs only while he is
 * catching up, then stops. Bubbles and the splash are short one-off tweens.
 * Reduced motion and sketch mode: he stands ready on the ledge (in pencil in sketch mode).
 */
import { useEffect, useRef, type RefObject } from "react";
import type { Point } from "@/components/sketch/rough";
import { gsap } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/eases";
import { ASCEND, blendLimbs, diverShapes, DROP, LAND, LEG, READY, STRIDE, SURVEY, type DiverShapes, type Limbs, type Pose } from "./diverRig";
import type { IcebergDrawing } from "./iceberg";

type Track = IcebergDrawing["diver"];
type Part = Exclude<keyof DiverShapes, "mouth" | "feet">;
type Look = "above" | "under" | "sketch";

const SVG = "http://www.w3.org/2000/svg";
/** Back to front. */
const PARTS: Part[] = ["beam", "farFin", "farLeg", "farArm", "farGlove", "tank", "valve", "body", "bcd", "strap", "seam", "hose", "fin", "rails", "arm", "glove", "torch", "mask", "glint", "reg"];
/** Stroked lines, never filled. */
const LINES = new Set<Part>(["strap", "seam", "hose", "rails", "glint"]);

/** Dark on the paper above the water; lighter under it, on ink. Tangerine is the tank only. */
const LOOK: Record<Look, Record<Part, string>> = {
  above: {
    beam: "fill-lime",
    farFin: "fill-ash stroke-ink",
    farLeg: "fill-ash stroke-ink",
    farArm: "fill-ash stroke-ink",
    farGlove: "fill-ink-2 stroke-ink",
    tank: "fill-tangerine stroke-ink",
    valve: "fill-graphite stroke-ink",
    body: "fill-graphite stroke-ink",
    bcd: "fill-ink-2 stroke-ink",
    strap: "stroke-ash",
    seam: "stroke-ash",
    hose: "stroke-ink",
    fin: "fill-graphite stroke-ink",
    rails: "stroke-ink",
    arm: "fill-graphite stroke-ink",
    glove: "fill-ink-2 stroke-ink",
    torch: "fill-card stroke-ink",
    mask: "fill-card stroke-ink",
    glint: "stroke-line-strong",
    reg: "fill-ink-2 stroke-ink",
  },
  under: {
    beam: "fill-lime",
    farFin: "fill-seam stroke-ash",
    farLeg: "fill-seam stroke-ash",
    farArm: "fill-seam stroke-ash",
    farGlove: "fill-ink-2 stroke-ash",
    tank: "fill-tangerine stroke-ink",
    valve: "fill-ash stroke-fog",
    body: "fill-ash stroke-fog",
    bcd: "fill-graphite stroke-fog",
    strap: "stroke-ink",
    seam: "stroke-fog",
    hose: "stroke-fog",
    fin: "fill-fog stroke-ash",
    rails: "stroke-ash",
    arm: "fill-ash stroke-fog",
    glove: "fill-graphite stroke-fog",
    torch: "fill-card stroke-ink",
    mask: "fill-card stroke-ink",
    glint: "stroke-ash",
    reg: "fill-graphite stroke-fog",
  },
  sketch: Object.fromEntries(PARTS.map((p) => [p, p === "beam" ? "fill-none" : LINES.has(p) ? "stroke-pencil" : "fill-none stroke-graphite"])) as Record<Part, string>,
};

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const POSE_KEYS: (keyof Pose)[] = ["x", "y", "torso", "beam", "shoulder", "elbow", "shoulderB", "elbowB", "hipA", "kneeA", "finA", "hipB", "kneeB", "finB"];

/** x on a top-to-bottom polyline at height y (clamped to its ends). */
function xOn(pts: readonly Point[], y: number): number {
  if (y <= pts[0][1]) return pts[0][0];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if (y >= y1 && y <= y2) return y2 === y1 ? x2 : lerp(x1, x2, (y - y1) / (y2 - y1));
  }
  return pts[pts.length - 1][0];
}

function ready(t: Track): Pose {
  return { x: t.ledge[0], y: t.ledge[1] - LEG * t.s, s: t.s, torso: -90, beam: 0, ...READY };
}

/**
 * Where he should be for the 40%-of-the-screen line `want` (dive coordinates) and the swim
 * direction `up` (0 = going down, 1 = going up), as a function of the scroll alone.
 *   rel <= -0.24      ready on the ledge          (rel = (want - waterline) / viewport height)
 *   -0.24 .. -0.06    the giant stride, then the drop in feet first
 *   -0.06 .. 0.10     under: pitch head down, out to his lane
 *   0.10 ..           the descent beside the ice; as the seabed rises to 60% of the screen he
 *                     stands up on it
 */
function target(t: Track, want: number, vh: number, up: number, kick: number): Pose {
  const s = t.s;
  const rel = (want - t.waterY) / vh;
  const standY = t.ledge[1] - LEG * s;
  const lane = (y: number) => Math.min(xOn(t.right, y) + 46 * s, t.laneMax);
  const dropX = Math.min(Math.max(t.ledge[0] + 40 * s, lane(t.waterY + 80 * s) - 6 * s), t.laneMax);
  const dropY = t.waterY + 30 * s;
  const turnEnd = t.waterY + 0.1 * vh;
  const bottom = t.lowY - 30 * s;
  let x: number;
  let y: number;
  let torso: number;
  let limbs: Limbs;
  let beam = 0;
  let landed = 0;
  if (rel <= -0.24) {
    x = t.ledge[0];
    y = standY;
    torso = -90;
    limbs = READY;
  } else if (rel < -0.06) {
    const e = (rel + 0.24) / 0.18;
    const step = ease(clamp(e / 0.4));
    const fall = clamp((e - 0.4) / 0.6);
    x = lerp(t.ledge[0], dropX, ease(clamp(e / 0.62)));
    y = fall > 0 ? lerp(standY, dropY, Math.pow(fall, 1.5)) : standY - Math.sin(Math.PI * step) * 9 * s;
    torso = -90 + 7 * Math.sin(Math.PI * Math.min(1, e / 0.7));
    limbs = e < 0.4 ? blendLimbs(READY, STRIDE, step) : blendLimbs(STRIDE, DROP, ease(fall));
  } else if (rel < 0.1) {
    const u = (rel + 0.06) / 0.16;
    const k = ease(u);
    y = lerp(dropY, turnEnd, u);
    x = lerp(dropX, lane(y), k);
    torso = lerp(lerp(-90, 92, k), -88, up);
    limbs = blendLimbs(blendLimbs(DROP, SURVEY, k), ASCEND, up);
    beam = clamp(k * 1.6);
  } else {
    y = Math.min(want, bottom);
    x = lane(y);
    torso = lerp(92, -88, up);
    limbs = blendLimbs(SURVEY, ASCEND, up);
    beam = 1;
    // the seabed: as it rises from 85% to 60% of the screen he rights himself (head down turns
    // through the horizontal, face down) and lands standing on it, straight below his lane
    const land = ease(clamp((want - t.bedY + 0.45 * vh) / (0.25 * vh)));
    if (land > 0) {
      y = lerp(y, t.bedY - LEG * s, land);
      x = lane(y);
      torso = lerp(torso, -90, land);
      limbs = blendLimbs(limbs, LAND, land);
    }
    landed = land;
  }
  // the kick: the legs scissor while he swims (under water, not once he stands on the seabed)
  if (rel >= -0.06) {
    const k = Math.sin(kick) * (1 - landed);
    limbs = {
      ...limbs,
      hipA: limbs.hipA - 9 * k,
      kneeA: limbs.kneeA - 10 * Math.max(0, k),
      finA: limbs.finA - 9 * k,
      hipB: limbs.hipB + 9 * k,
      kneeB: limbs.kneeB - 10 * Math.max(0, -k),
      finB: limbs.finB + 9 * k,
    };
  }
  return { x, y, s, torso, beam, ...limbs };
}

function ease2(a: Pose, b: Pose, k: number): Pose {
  const out = { ...b };
  for (const key of POSE_KEYS) out[key] = a[key] + (b[key] - a[key]) * k;
  return out;
}

function gap(a: Pose, b: Pose): number {
  let m = 0;
  for (const key of POSE_KEYS) m = Math.max(m, Math.abs(a[key] - b[key]));
  return m;
}

export function Diver({ track, rootRef, still, sketch }: { track: Track; rootRef: RefObject<HTMLDivElement | null>; still: boolean; sketch: boolean }) {
  const parts = useRef<Partial<Record<Part, SVGPathElement | null>>>({});
  const fx = useRef<SVGGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    let last = 0;
    let cur: Pose | null = null;
    let up = 0;
    let upTo = 0;
    let lastWant = Number.NaN;
    let kick = 0;
    let travel = 0;
    let lastFeet = Number.NaN;
    let look: Look | "" = "";

    const paint = (sh: DiverShapes, beam: number, mode: Look) => {
      for (const p of PARTS) {
        const el = parts.current[p];
        if (!el) continue;
        el.setAttribute("d", sh[p]);
        if (mode !== look) el.setAttribute("class", LOOK[mode][p]);
      }
      look = mode;
      parts.current.beam?.setAttribute("opacity", String(mode === "under" ? 0.16 * beam : 0));
    };

    const bubble = (m: Point) => {
      const layer = fx.current;
      if (!layer || layer.childElementCount > 18) return;
      const rise = Math.min(70 + Math.random() * 60, m[1] - track.waterY - 6);
      if (rise < 12) return;
      const c = document.createElementNS(SVG, "circle");
      c.setAttribute("cx", String(m[0]));
      c.setAttribute("cy", String(m[1]));
      c.setAttribute("r", String((1.3 + Math.random() * 1.9) * (track.s / 0.6)));
      c.setAttribute("class", "fill-none stroke-fog");
      c.setAttribute("stroke-width", "1");
      layer.appendChild(c);
      const d = 1.4 + Math.random() * 0.9;
      gsap.to(c, { attr: { cy: m[1] - rise }, duration: d, ease: EASE.none, onComplete: () => c.remove() });
      gsap.to(c, { attr: { cx: m[0] + (Math.random() - 0.5) * 16 }, duration: d, ease: EASE.arrive });
      gsap.to(c, { opacity: 0, duration: 0.45, delay: d - 0.45, ease: EASE.exit });
    };

    const splash = (x: number, down: boolean) => {
      const layer = fx.current;
      if (!layer) return;
      const wy = track.waterY;
      const k = track.s / 0.6;
      for (let i = 0; i < 2; i++) {
        const e = document.createElementNS(SVG, "ellipse");
        e.setAttribute("cx", String(x));
        e.setAttribute("cy", String(wy - 3));
        e.setAttribute("rx", "4");
        e.setAttribute("ry", "1.5");
        e.setAttribute("class", "fill-none stroke-ink");
        e.setAttribute("stroke-width", "1.3");
        layer.appendChild(e);
        gsap.to(e, { attr: { rx: (28 + i * 18) * k, ry: 5 + i * 2 }, opacity: 0, duration: 0.8 + i * 0.2, delay: i * 0.12, ease: EASE.arrive, onComplete: () => e.remove() });
      }
      for (let j = 0; j < (down ? 9 : 4); j++) {
        const c = document.createElementNS(SVG, "circle");
        const sx = x + (Math.random() - 0.5) * 10;
        c.setAttribute("cx", String(sx));
        c.setAttribute("cy", String(wy - 4));
        c.setAttribute("r", String(1.4 + Math.random() * 1.6));
        c.setAttribute("class", "fill-ink");
        layer.appendChild(c);
        const rise = (22 + Math.random() * 34) * k;
        const tl = gsap.timeline({ onComplete: () => c.remove() });
        tl.to(c, { attr: { cx: sx + (Math.random() - 0.5) * 80 * k }, duration: 0.66, ease: EASE.none }, 0)
          .to(c, { attr: { cy: wy - 4 - rise }, duration: 0.28, ease: EASE.arrive }, 0)
          .to(c, { attr: { cy: wy + 2 }, duration: 0.38, ease: EASE.exit }, 0.28);
      }
    };

    const step = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const vh = window.innerHeight;
      const want = 0.4 * vh - root.getBoundingClientRect().top;
      if (!Number.isNaN(lastWant) && Math.abs(want - lastWant) > 0.5) upTo = want < lastWant ? 1 : 0;
      lastWant = want;
      up += (upTo - up) * (1 - Math.exp(-dt / 0.28));
      const goal = target(track, want, vh, up, kick);
      const prev = cur;
      cur = prev ? ease2(prev, goal, 1 - Math.exp(-dt / 0.12)) : goal;
      const moved = prev ? Math.hypot(cur.x - prev.x, cur.y - prev.y) : 0;
      kick += moved * 0.055;
      travel += moved;
      const sh = diverShapes(cur);
      const under = sh.mouth[1] > track.waterY;
      paint(sh, cur.beam, under ? "under" : "above");
      if (!Number.isNaN(lastFeet) && lastFeet <= track.waterY !== sh.feet <= track.waterY) splash(cur.x, sh.feet > lastFeet);
      lastFeet = sh.feet;
      if (under && sh.mouth[1] > track.waterY + 10 && travel > 30) {
        travel = 0;
        bubble(sh.mouth);
      }
      if (gap(cur, goal) > 0.04 || Math.abs(up - upTo) > 0.004) raf = requestAnimationFrame(step);
      else last = 0;
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };

    if (still) {
      paint(diverShapes(ready(track)), 0, sketch ? "sketch" : "above");
      return;
    }
    wake();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    return () => {
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      if (raf) cancelAnimationFrame(raf);
      fx.current?.replaceChildren();
    };
  }, [rootRef, track, still, sketch]);

  return (
    <g data-qa="stack-diver" data-still={still ? "true" : "false"}>
      {PARTS.map((p) => (
        <path
          key={p}
          ref={(el) => {
            parts.current[p] = el;
          }}
          fill={LINES.has(p) ? "none" : undefined}
          strokeWidth={p === "beam" ? 0 : LINES.has(p) ? 1 : 1.8}
          paintOrder="stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      <g ref={fx} />
    </g>
  );
}
