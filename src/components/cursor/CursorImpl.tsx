"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { subscribePointer } from "@/lib/motion/pointer";
import { onScroll, stage } from "@/lib/stores/stage";

/**
 * The cursor's implementation (see ./Cursor.tsx for the contract). Its own chunk: only fine
 * pointers with full motion ever fetch it.
 */
const INTERACTIVE = 'a[href],button:not(:disabled),[role="button"],[role="switch"],[role="tab"],summary,label[for],select,[data-cursor],[data-cursor-label]';
const FILL: Record<string, string> = {
  lime: "var(--color-lime)",
  blue: "var(--color-blue-soft)",
  tangerine: "var(--color-tangerine-soft)",
};
const RING = 34;

export default function CursorImpl() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringPosRef = useRef<HTMLDivElement>(null);
  const dotPosRef = useRef<HTMLDivElement>(null);
  const labelPosRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const labelTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const ringPos = ringPosRef.current;
    const dotPos = dotPosRef.current;
    const labelPos = labelPosRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    const labelText = labelTextRef.current;
    if (!root || !ringPos || !dotPos || !labelPos || !dot || !ring || !label || !labelText) return;
    const html = document.documentElement;
    html.classList.add("has-cursor");

    // Positions live on the fixed layers; modes (scale / alpha) on their children.
    gsap.set([dotPos, ringPos, labelPos], { x: -100, y: -100 });
    gsap.set([dot, ring, label], { xPercent: -50, yPercent: -50 });
    const ringX = gsap.quickTo(ringPos, "x", { duration: 0.42, ease: EASE.arrive });
    const ringY = gsap.quickTo(ringPos, "y", { duration: 0.42, ease: EASE.arrive });
    const labelX = gsap.quickTo(labelPos, "x", { duration: 0.42, ease: EASE.arrive });
    const labelY = gsap.quickTo(labelPos, "y", { duration: 0.42, ease: EASE.arrive });

    let visible = false;
    let mode: "idle" | "hover" | "label" | "hidden" = "idle";
    let fillNow = "";
    let lastTarget: Element | null = null;
    let lastX = -100;
    let lastY = -100;

    const show = (on: boolean) => {
      if (on === visible) return;
      visible = on;
      root.dataset.on = on ? "true" : "false";
    };

    const apply = (target: Element | null) => {
      const el = target?.closest?.(INTERACTIVE) ?? null;
      const toneEl = target?.closest?.("[data-tone]");
      root.dataset.tone = toneEl?.getAttribute("data-tone") === "ink" ? "ink" : "paper";
      const kind = el?.closest("[data-cursor]")?.getAttribute("data-cursor") ?? null;
      const text = el?.closest("[data-cursor-label]")?.getAttribute("data-cursor-label") ?? "";
      const field = target?.closest?.('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]),textarea,[contenteditable="true"]');
      let next: typeof mode = "idle";
      if (kind === "native" || kind === "hide" || field) next = "hidden";
      else if (text) next = "label";
      else if (el) next = "hover";
      if (next === "label" && labelText.textContent !== text) labelText.textContent = text;
      const fill = kind && FILL[kind] ? FILL[kind] : FILL.lime;
      if (next === mode && fill === fillNow) return;
      mode = next;
      fillNow = fill;
      root.style.setProperty("--cursor-fill", fill);
      root.dataset.mode = mode;
      if (mode === "hidden") {
        gsap.to([dot, ring, label], { autoAlpha: 0, duration: DUR.feedback, overwrite: "auto" });
        return;
      }
      gsap.to(dot, { autoAlpha: mode === "label" ? 0 : 1, scale: mode === "hover" ? 0.6 : 1, duration: DUR.ui, ease: EASE.arrive, overwrite: "auto" });
      gsap.to(ring, { autoAlpha: mode === "label" ? 0 : 1, scale: mode === "hover" ? 1.65 : 1, duration: DUR.ui, ease: EASE.arrive, overwrite: "auto" });
      gsap.to(label, { autoAlpha: mode === "label" ? 1 : 0, scale: mode === "label" ? 1 : 0.6, duration: DUR.ui, ease: mode === "label" ? EASE.arrive : EASE.exit, overwrite: "auto" });
    };

    const unsub = subscribePointer(
      (p, e) => {
        if (e.pointerType !== "mouse") {
          show(false);
          return;
        }
        lastX = p.x;
        lastY = p.y;
        gsap.set(dotPos, { x: p.x, y: p.y });
        ringX(p.x);
        ringY(p.y);
        labelX(p.x);
        labelY(p.y + 30);
        const t = e.target as Element | null;
        if (t !== lastTarget) {
          lastTarget = t;
          apply(t);
        }
        show(stage.get().transition === "idle");
      },
      () => show(false),
    );

    // With a still pointer, content scrolling underneath changes what is hovered.
    const offScroll = onScroll(() => {
      if (!visible) return;
      const t = document.elementFromPoint(lastX, lastY);
      if (t !== lastTarget) {
        lastTarget = t;
        apply(t);
      }
    });

    const down = () => gsap.to(ring, { scale: mode === "hover" ? 1.4 : 0.8, duration: DUR.tap, ease: EASE.arrive, overwrite: "auto" });
    const up = () => gsap.to(ring, { scale: mode === "hover" ? 1.65 : 1, duration: DUR.ui, ease: EASE.arrive, overwrite: "auto" });
    const leaveDoc = () => show(false);
    // A click can change what the element under a still pointer asks for (a radio that becomes
    // checked asks for the native cursor): read it again once React has committed.
    let reread = 0;
    const clicked = () => {
      cancelAnimationFrame(reread);
      reread = requestAnimationFrame(() => {
        if (lastTarget) apply(lastTarget);
      });
    };
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("click", clicked, { passive: true });
    window.addEventListener("blur", leaveDoc);

    return () => {
      unsub();
      offScroll();
      cancelAnimationFrame(reread);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("click", clicked);
      window.removeEventListener("blur", leaveDoc);
      html.classList.remove("has-cursor");
      gsap.killTweensOf([dotPos, ringPos, labelPos, dot, ring, label]);
    };
  }, []);

  const layer = "pointer-events-none fixed top-0 left-0 z-(--z-cursor) opacity-0 transition-opacity duration-(--dur-feedback) group-data-[on=true]/cursor:opacity-100";
  return (
    // display: contents: no box and no stacking context, so the ring layer blends with the page.
    <div ref={rootRef} aria-hidden="true" data-qa="cursor" data-on="false" data-tone="paper" data-mode="idle" className="group/cursor contents" style={{ ["--cursor-fill" as string]: FILL.lime }}>
      <div ref={ringPosRef} className={`${layer} mix-blend-multiply group-data-[tone=ink]/cursor:mix-blend-normal sketch:mix-blend-multiply`}>
        <div
          ref={ringRef}
          className="cursor-ring rounded-full border-[1.5px] border-ink/70 transition-[background-color,border-color] duration-(--dur-ui) ease-arrive group-data-[mode=hover]/cursor:border-transparent group-data-[mode=hover]/cursor:bg-(--cursor-fill) group-data-[tone=ink]/cursor:border-paper/70 group-data-[tone=ink]/cursor:group-data-[mode=hover]/cursor:border-lime group-data-[tone=ink]/cursor:group-data-[mode=hover]/cursor:bg-lime/15"
          style={{ width: RING, height: RING }}
        />
      </div>
      <div ref={dotPosRef} className={layer}>
        <div ref={dotRef} className="cursor-dot size-1.5 rounded-full bg-ink group-data-[tone=ink]/cursor:bg-paper" />
        {/* Sketch mode: the dot becomes a pencil, its tip on the pointer (CSS shows it). */}
        <svg aria-hidden="true" viewBox="0 0 32 32" className="cursor-pencil" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g transform="rotate(-45 16 16)">
            <path d="M10.6 12.4h13.8v7.2H10.6z" className="cursor-pencil-body" />
            <path d="M24.4 12.4h2.2a3.6 3.6 0 0 1 0 7.2h-2.2" className="cursor-pencil-cap" />
            <path d="M10.6 12.4 3.4 16l7.2 3.6" className="cursor-pencil-wood" />
            <path d="M3.4 16 6.1 14.6v2.8z" className="cursor-pencil-lead" />
            <path d="M10.6 12.4h13.8v7.2H10.6M24.4 12.4v7.2M10.6 12.4 3.4 16l7.2 3.6M24.4 12.4h2.2a3.6 3.6 0 0 1 0 7.2h-2.2" className="cursor-pencil-line" />
          </g>
        </svg>
      </div>
      <div ref={labelPosRef} className={layer}>
        <div ref={labelRef} className="cursor-label rounded-pill bg-ink px-3.5 py-2 whitespace-nowrap text-paper opacity-0 shadow-lift group-data-[tone=ink]/cursor:bg-lime group-data-[tone=ink]/cursor:text-ink">
          <span ref={labelTextRef} className="type-label" />
        </div>
      </div>
    </div>
  );
}
