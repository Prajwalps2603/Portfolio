"use client";

/**
 * THE OPENING (owner: hero). docs/MOTION.md section 5, DIRECTION section 5 "Opening".
 *
 * The whole hero is first drawn as a sketch, then ships into the real hero. It plays OVER the real
 * hero DOM (an intro, not a loader) and renders nothing itself:
 *
 *   0.00 - 0.90  the sketch draws (pen): rough boxes where the header, the name, the note and the
 *                pills will be, a heavy scribble where the name will be. The stage window draws
 *                its own sketch (MiniUI sketch state) and the dashed connector draws into it.
 *   0.90 - 1.40  compile: outlines tighten onto their elements and fade; a compile line sweeps
 *                each line of text, erasing its squiggle and revealing the type; the name types
 *                in glyph by glyph (on the real text: kerning intact); the highlighters swipe.
 *   1.35         the window compiles (MiniUI sketch -> ship) and its SHIPPED stamp lands (~2.0s).
 *   2.60         finishBoot(): the header is live, the stage starts its project cycle.
 *
 * Modes (useIntroMode): "full" first home visit of the tab session; "short" repeats, the same
 * timeline at INTRO_TIMESCALE.short; "none" (reduced motion, deep links, returns): no opening,
 * only the role line's highlighter swiping once when in view (static with reduced motion).
 * Any input (pointerdown, keydown, wheel, touchstart) skips to the end. Without JS nothing is
 * hidden (html.booting is set by the head script only), and a 4.2s failsafe removes it anyway.
 */
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE, STAGGER } from "@/lib/motion/eases";
import { finishBoot, startBoot } from "@/lib/motion/boot";
import { prefersReducedMotion } from "@/lib/motion/media";
import { INTRO_TIMESCALE, useIntroMode } from "@/lib/motion/useIntroMode";
import { safeStart } from "@/lib/motion/splitArrive";
import { drawOn, showStrokes } from "@/components/sketch";
import { opening } from "./opening";
import { buildOpeningSketch, type PieceKey } from "./sketch";

const SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

type Reveal = "fade" | "line" | "pop" | "type";

/** When each piece draws (start, length), compiles, and how its element arrives (s, full speed). */
const PLAN: Record<PieceKey, { draw: number; len: number; compile: number; reveal: Reveal }> = {
  header: { draw: 0, len: 0.45, compile: 0.94, reveal: "fade" },
  name: { draw: 0.04, len: 0.62, compile: 0.9, reveal: "type" },
  note: { draw: 0.1, len: 0.6, compile: 1.0, reveal: "pop" },
  role: { draw: 0.2, len: 0.5, compile: 0.98, reveal: "line" },
  statement: { draw: 0.28, len: 0.45, compile: 1.04, reveal: "line" },
  actions: { draw: 0.34, len: 0.5, compile: 1.1, reveal: "fade" },
  status: { draw: 0.42, len: 0.42, compile: 1.16, reveal: "line" },
  chips: { draw: 0.5, len: 0.38, compile: 1.2, reveal: "line" },
  controls: { draw: 0.54, len: 0.34, compile: 1.26, reveal: "fade" },
};
const T = { window: 0.03, connector: 0.5, connectorLen: 0.6, roleSwipe: 1.2, noteSwipe: 1.12, ship: 1.35, end: 2.6 };
/** The compile line: one sweep per element. */
const LINE = { text: 0.44 };

/** If the fonts are slow, measure anyway (next/font fallbacks are metric-matched). */
const FONT_WAIT_MS = 450;

/**
 * THE COMPILE LINE: a vertical sweep, left to right, that erases a squiggle (the sketch) and reveals
 * the real text behind the same edge, so handwriting turns into type as the line passes.
 */
function compileLine(text: HTMLElement | null, fill: SVGGElement | null, duration: number) {
  const tr = text?.getBoundingClientRect() ?? null;
  const fr = fill && fill.childNodes.length ? fill.getBoundingClientRect() : null;
  const x0 = Math.min(tr?.left ?? Infinity, fr?.left ?? Infinity);
  const x1 = Math.max(tr?.right ?? -Infinity, fr?.right ?? -Infinity);
  const p = { x: x0 };
  const render = () => {
    if (text && tr) text.style.clipPath = `inset(-30% ${Math.max(0, tr.right - p.x).toFixed(1)}px -30% -6px)`;
    if (fill && fr) fill.style.clipPath = `inset(-50% -10px -50% ${Math.max(0, p.x - fr.left).toFixed(1)}px)`;
  };
  render();
  return gsap.to(p, {
    x: x1,
    duration,
    ease: EASE.pen,
    onUpdate: render,
    onComplete: () => {
      if (text) text.style.clipPath = "";
    },
  });
}

/**
 * THE NAME TYPES IN, on the real text (no splitting, so kerning never changes and nothing has to
 * be reverted): every glyph's right edge is measured with a Range, and a stepped clip-path
 * reveals the name glyph by glyph, line by line.
 */
function typeOn(el: HTMLElement, stagger: number) {
  const box = el.getBoundingClientRect();
  const range = document.createRange();
  const glyphs: { right: number; top: number; bottom: number }[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent ?? "";
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i])) continue;
      range.setStart(n, i);
      range.setEnd(n, i + 1);
      const r = range.getBoundingClientRect();
      if (r.width > 0) glyphs.push({ right: r.right - box.left, top: r.top - box.top, bottom: r.bottom - box.top });
    }
  }
  range.detach();
  // lines: glyphs whose vertical centres agree
  const line: number[] = [];
  const bands: { top: number; bottom: number }[] = [];
  for (const g of glyphs) {
    const mid = (g.top + g.bottom) / 2;
    let i = bands.findIndex((b) => Math.abs((b.top + b.bottom) / 2 - mid) < (g.bottom - g.top) / 2);
    if (i < 0) i = bands.push({ top: g.top, bottom: g.bottom }) - 1;
    line.push(i);
  }
  const X0 = -40;
  const X1 = box.width + 40;
  const TOP = -80;
  const BOTTOM = box.height + 80;
  // the cut between two lines sits halfway through their overlap
  const cut = (i: number) => (bands[i].bottom + bands[i + 1].top) / 2;
  const shape = (k: number) => {
    if (k < 0) return "polygon(0px 0px, 0px 0px, 0px 0px)";
    const L = line[k];
    const last = k === glyphs.length - 1 || line[k + 1] !== L;
    const x = last ? X1 : glyphs[k].right + 1;
    const yA = L === 0 ? TOP : cut(L - 1);
    const yB = L === bands.length - 1 ? BOTTOM : cut(L);
    const f = (n: number) => `${n.toFixed(1)}px`;
    return `polygon(${f(X0)} ${f(TOP)}, ${f(X1)} ${f(TOP)}, ${f(X1)} ${f(yA)}, ${f(x)} ${f(yA)}, ${f(x)} ${f(yB)}, ${f(X0)} ${f(yB)})`;
  };
  el.style.clipPath = shape(-1);
  const tl = gsap.timeline();
  glyphs.forEach((_, k) => tl.call(() => void (el.style.clipPath = shape(k)), [], k * stagger));
  tl.call(() => void (el.style.clipPath = ""), [], glyphs.length * stagger);
  return tl;
}

export function Intro() {
  const mode = useIntroMode();
  const orphan = useRef(0);

  useEffect(() => {
    window.clearTimeout(orphan.current);
    if (mode === "pending") return;

    if (mode === "none") {
      opening.set("done");
      finishBoot();
      if (prefersReducedMotion()) return;
      // No opening: the role line's highlighter still swipes once, when it is in view.
      const hl = document.querySelector<HTMLElement>('#top [data-hero="role"] .hl');
      if (!hl) return;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          hl,
          { "--hl-p": 0 },
          {
            "--hl-p": 1,
            duration: DUR.swipe,
            ease: EASE.pen,
            delay: 0.15,
            scrollTrigger: { trigger: hl, start: () => safeStart(hl, "top 70%"), once: true, invalidateOnRefresh: true },
          },
        );
      });
      return () => ctx.revert();
    }

    const hero = document.getElementById("top");
    // Only over a hero that is actually on screen (a restored scroll position skips it).
    if (!hero || window.scrollY > 48 || prefersReducedMotion()) {
      opening.set("done");
      finishBoot();
      return;
    }

    startBoot();

    let cancelled = false;
    let skipped = false;
    let finished = false;
    let raf = 0;
    let ctx: gsap.Context | null = null;
    let tl: gsap.core.Timeline | null = null;
    let svg: SVGSVGElement | null = null;
    let touched: Element[] = [];

    const off = () => SKIP_EVENTS.forEach((ev) => window.removeEventListener(ev, skip, { capture: true }));
    /** Remove every trace of the opening (the overlay, the inline styles). */
    const teardown = () => {
      off();
      svg?.remove();
      svg = null;
      const connector = hero.querySelector('[data-hero="connector"]');
      if (connector) showStrokes(connector);
      if (touched.length) gsap.set(touched, { clearProps: "opacity,visibility,transform,clipPath,--hl-p" });
      touched = [];
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      // Reveal first (booting off), then drop the inline styles that were holding things visible.
      finishBoot();
      opening.set("done");
      ctx?.kill();
      ctx = null;
      teardown();
    };
    function skip() {
      skipped = true;
      off();
      if (tl) tl.progress(1);
      finish();
    }
    SKIP_EVENTS.forEach((ev) => window.addEventListener(ev, skip, { passive: true, capture: true }));

    const begin = () => {
      if (cancelled || finished) return;
      if (skipped) {
        finish();
        return;
      }
      // The stage window turns into its sketch now and draws itself (MiniUI, 0.9s), in step with t = 0.
      opening.set("sketch");
      ctx = gsap.context(() => {
        const sketch = buildOpeningSketch(hero);
        svg = sketch.svg;
        const master = gsap.timeline({ paused: true, onComplete: finish });
        tl = master;

        // 1. The sketch draws.
        for (const piece of sketch.pieces) {
          const plan = PLAN[piece.key];
          master.add(drawOn(piece.group, { duration: plan.len }), plan.draw);
        }
        const windowEl = hero.querySelector<HTMLElement>('[data-hero="window"]');
        if (windowEl) {
          touched.push(windowEl);
          master.set(windowEl, { opacity: 1 }, T.window);
        }
        const connector = hero.querySelector<HTMLElement>('[data-hero="connector"]');
        if (connector) {
          touched.push(connector);
          master.set(connector, { opacity: 1 }, 0);
          master.add(drawOn(connector, { duration: T.connectorLen }), T.connector);
        }

        // 2. Compile: outlines tighten onto their element and fade; text compiles under a sweep.
        for (const piece of sketch.pieces) {
          const { box: b, pad, frame, fill, target } = piece;
          const { compile: at, reveal } = PLAN[piece.key];
          touched.push(target);
          master.to(
            frame,
            {
              opacity: 0,
              scaleX: pad ? b.w / (b.w + pad * 2) : 0.985,
              scaleY: pad ? b.h / (b.h + pad * 2) : 0.94,
              svgOrigin: `${(b.x + b.w / 2).toFixed(1)} ${(b.y + b.h / 2).toFixed(1)}`,
              duration: DUR.ui,
              ease: EASE.exit,
            },
            at,
          );
          if (reveal === "line") {
            master.set(target, { opacity: 1 }, at);
            master.add(compileLine(target, fill, LINE.text), at);
          } else if (reveal === "type") {
            master.set(target, { opacity: 1 }, at);
            master.add(typeOn(target, STAGGER.chars * 1.6), at + 0.02);
            master.to(fill, { opacity: 0, duration: DUR.ui, ease: EASE.exit }, at);
          } else {
            master.to(fill, { opacity: 0, duration: DUR.feedback, ease: EASE.exit }, at);
            if (reveal === "pop") master.fromTo(target, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: DUR.fade, ease: EASE.arrive }, at + 0.04);
            else master.fromTo(target, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: DUR.fade, ease: EASE.arrive }, at + 0.04);
          }
        }

        // The highlighters swipe: the note's four lines, then "Full Stack".
        const noteHls = Array.from(hero.querySelectorAll<HTMLElement>('[data-hero="note"] .hl'));
        if (noteHls.length) {
          touched.push(...noteHls);
          master.fromTo(noteHls, { "--hl-p": 0 }, { "--hl-p": 1, duration: DUR.swipe * 0.8, ease: EASE.pen, stagger: STAGGER.items * 1.4 }, T.noteSwipe);
        }
        const roleHl = hero.querySelector<HTMLElement>('[data-hero="role"] .hl');
        if (roleHl) {
          touched.push(roleHl);
          master.fromTo(roleHl, { "--hl-p": 0 }, { "--hl-p": 1, duration: DUR.swipe, ease: EASE.pen }, T.roleSwipe);
        }

        // 3. The window compiles (MiniUI sketch -> ship, then its stamp lands). 4. Done.
        master.call(() => opening.set("ship"), [], T.ship);
        master.call(() => undefined, [], T.end);
        master.timeScale(INTRO_TIMESCALE[mode]);
        master.play(0);
      });
    };

    const fonts = document.fonts?.ready ?? Promise.resolve();
    Promise.race([fonts, new Promise((r) => window.setTimeout(r, FONT_WAIT_MS))]).then(() => {
      if (cancelled) return;
      raf = requestAnimationFrame(begin);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      off();
      if (finished) return;
      // Unmounted mid-opening (StrictMode re-runs cancel this): never leave the page booting.
      ctx?.revert();
      ctx = null;
      teardown();
      orphan.current = window.setTimeout(() => {
        finishBoot();
        opening.set("done");
      }, 0);
    };
  }, [mode]);

  return null;
}
