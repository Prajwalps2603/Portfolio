"use client";

/**
 * CONTRACT 1 (owner: miniui): the six project mini-UIs and the signature "sketch -> ship" move.
 *
 *   import { MiniUI } from "@/components/miniui";
 *   <MiniUI projectId="resumai" />                                   // shipped UI
 *   <MiniUI projectId="resumai" state={state} onShipped={next} />   // controlled: "sketch" draws itself, then "ship" compiles
 *   <MiniUI projectId="resumai" autoplay size="lg" />               // plays sketch -> ship once when in view
 *
 * - Outer box: width 100% of its container, AppWindow ratio 16 / 11, IDENTICAL in both states (a
 *   "sketch" instance sits exactly under a "ship" instance: the hero lens). The sketch state is
 *   strokes only (transparent): give a lens that sits ON TOP of the ship UI a paper background.
 * - `state` (controlled, default "ship"): entering "sketch" draws the sketch (pen, <= 0.9s);
 *   "sketch" -> "ship" compiles (strokes tighten onto the real borders, labels swap, panels fill,
 *   <= 0.6s), lands the SHIPPED stamp (snap) only if `stamp` is on, and then calls `onShipped`.
 * - `autoplay`: starts as a sketch, draws when scrolled into view, holds, ships once, then calls
 *   `onShipped`. Reduced motion (or Motion: off): no drawing, no compile, the ship state at once
 *   (stamp visible) and `onShipped` right away.
 * - `stamp` (default false since 2026-11-10, his ask: the SHIPPED stamp only on the port's ship): the
 *   SHIPPED stamp on the shipped UI, if a caller turns it on.
 * - `size`: the stamp scale and the density cap: sm (cards, phones), md (hero stage), lg (case
 *   study). The internals also adapt to the real width (container queries), so any size fits.
 * - Sketch mode (src/lib/stores/sketchMode.ts) overrides `state`: every instance shows its sketch
 *   while it is on and compiles back (stamp, `onShipped`) when it goes off. The generic sketch-mode
 *   CSS skips everything inside [data-miniui], so the hidden crisp window keeps its true layout.
 * - Changing `projectId` swaps the template instantly in the current state (a sketch redraws).
 * - It is a picture of an app (role="img" with a description), never a control: wrap it in your
 *   own link / button. `data-state` on the root is "sketch" | "compiling" | "ship".
 *
 * Templates (src/components/miniui/templates): resumai -> editor, drone-intelligence -> chat,
 * audify-ai -> phone, bookmyvenue -> calendar, brain-tumor-detection -> scan, mcp-job-agent ->
 * pipeline (any other id -> a generic checklist of its flow). Every label is real (src/content);
 * illustrative data looks illustrative (./data.ts SAMPLE).
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE } from "@/lib/motion/eases";
import { useReducedMotion } from "@/lib/motion/media";
import { useInView } from "@/lib/hooks/useInView";
import { getSketchMode, useSketchMode } from "@/lib/stores/sketchMode";
import { AppWindow } from "@/components/ui";
import { ShippedStamp, stampIn } from "@/components/sketch";
import { projectData } from "./data";
import { cx } from "./kit";
import { SketchLayer, type LayerMode } from "./SketchLayer";
import { StampSlotContext } from "./StampSlot";
import { GENERIC, TEMPLATES } from "./templates";
import { startLab } from "./lab";

export type MiniUIState = "sketch" | "ship";

export const MINIUI_PROJECTS = [
  "resumai",
  "drone-intelligence",
  "audify-ai",
  "bookmyvenue",
  "brain-tumor-detection",
  "mcp-job-agent",
] as const;

export type MiniUIProjectId = (typeof MINIUI_PROJECTS)[number];

export type MiniUIProps = {
  projectId: string;
  /** Controlled. Default "ship". */
  state?: MiniUIState;
  /** Play sketch -> ship once when in view (instant with reduced motion). */
  autoplay?: boolean;
  onShipped?: () => void;
  stamp?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

type Phase = "sketch" | "compiling" | "ship";

/** Seconds the finished sketch is held before an autoplay compile. */
const HOLD = 0.22;

const STAMP_SIZE = { sm: "sm", md: "md", lg: "lg" } as const;

const subscribeNothing = () => () => {};
/** false while hydrating server HTML, true for client-only mounts (and after hydration). */
function useClientMounted() {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

export function MiniUI(props: MiniUIProps) {
  // A new project is a new picture: remount so every state machine starts clean.
  return <MiniUIInner key={props.projectId} {...props} />;
}

// Dev-only visual QA lab (inert unless window.__MINIUI_LAB__ is set; stripped from production).
if (process.env.NODE_ENV !== "production") startLab(MiniUI, MINIUI_PROJECTS);

function MiniUIInner({
  projectId,
  state = "ship",
  autoplay = false,
  onShipped,
  stamp = false,
  size = "md",
  className,
}: MiniUIProps) {
  const project = projectData(projectId);
  const tpl = TEMPLATES[projectId] ?? GENERIC;
  const Template = tpl.Component;
  const title = `${projectId} — ${tpl.name}`;

  const reduced = useReducedMotion();
  const clientMount = useClientMounted();
  const rootRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLSpanElement>(null);
  // only autoplay waits for the viewport: other instances observe nothing
  const noRef = useRef<HTMLDivElement>(null);
  const inView = useInView(autoplay ? rootRef : noRef, {
    threshold: 0.35,
    once: true,
  });

  const [autoDone, setAutoDone] = useState(false);
  // Sketch mode (the whole site as its sketch) holds every mini-UI in its sketch; switching it off
  // compiles them back (stamp included). Autoplay keeps its own once-only ship for afterwards.
  const { on: sketchSite } = useSketchMode();
  const target: MiniUIState = sketchSite
    ? "sketch"
    : autoplay
      ? autoDone || reduced
        ? "ship"
        : "sketch"
      : state;
  // Server HTML is always the shipped UI for autoplay (content first); a client-only mount
  // (navigation) can start as the sketch with no flash.
  const [phase, setPhase] = useState<Phase>(() =>
    target === "sketch" && (!autoplay || clientMount) ? "sketch" : "ship",
  );

  const shippedCb = useRef(onShipped);
  useLayoutEffect(() => {
    shippedCb.current = onShipped;
  }, [onShipped]);
  const shippedFired = useRef(false);
  const fireShipped = useCallback(() => {
    if (shippedFired.current) return;
    shippedFired.current = true;
    shippedCb.current?.();
  }, []);

  // follow the target state
  useLayoutEffect(() => {
    if (target === "sketch") {
      shippedFired.current = false;
      if (phase !== "sketch") setPhase("sketch");
      return;
    }
    if (phase === "sketch") {
      if (reduced) {
        setPhase("ship");
        fireShipped();
      } else setPhase("compiling");
    }
  }, [target, phase, reduced, fireShipped]);

  // autoplay with reduced motion: shipped at once
  useEffect(() => {
    if (autoplay && reduced && !autoDone) {
      setAutoDone(true);
      fireShipped();
    }
  }, [autoplay, reduced, autoDone, fireShipped]);

  // autoplay: once the sketch has drawn itself, hold, then ship (in sketch mode: once it ends)
  const holdTimer = useRef(0);
  const drawnInSketchMode = useRef(false);
  const onDrawn = useCallback(() => {
    if (!autoplay) return;
    if (getSketchMode()) {
      drawnInSketchMode.current = true;
      return;
    }
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => setAutoDone(true), HOLD * 1000);
  }, [autoplay]);
  useEffect(() => {
    if (sketchSite || !drawnInSketchMode.current) return;
    drawnInSketchMode.current = false;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => setAutoDone(true), HOLD * 1000);
  }, [sketchSite]);
  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  // THE COMPILE: strokes tighten, the window settles in, every element fades in in reading order
  // while its strokes and label leave, then the stamp lands. <= 0.6s + the stamp (0.42s).
  useLayoutEffect(() => {
    if (phase !== "compiling") return;
    const win = winRef.current;
    const layer = layerRef.current;
    if (!win) {
      setPhase("ship");
      fireShipped();
      return;
    }
    const units = Array.from(win.querySelectorAll<HTMLElement>("[data-sk]"));
    const groups = new Map<number, Element>();
    const labels = new Map<string, HTMLElement>();
    layer
      ?.querySelectorAll("[data-unit]")
      .forEach((g) => groups.set(Number(g.getAttribute("data-unit")), g));
    layer
      ?.querySelectorAll<HTMLElement>("[data-label]")
      .forEach((l) => labels.set(l.dataset.label ?? "", l));
    const frame = layer?.querySelector("[data-frame]") ?? null;
    const paths = layer
      ? Array.from(layer.querySelectorAll<SVGPathElement>("path[data-tight]"))
      : [];
    const stampEl = stamp ? stampRef.current : null;

    gsap.set(win, { opacity: 0 });
    if (units.length) gsap.set(units, { opacity: 0 });
    if (stampEl) gsap.set(stampEl, { autoAlpha: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        setPhase("ship");
        fireShipped();
      },
    });
    // 1. every stroke straightens onto its crisp box
    for (const p of paths) {
      const d = p.getAttribute("data-tight");
      if (d && d !== p.getAttribute("d"))
        tl.to(p, { attr: { d }, duration: 0.22, ease: EASE.pen }, 0);
    }
    // 2. the crisp window settles in under the frame strokes; the handwritten title goes
    tl.fromTo(
      win,
      { opacity: 0, scale: 0.985 },
      { opacity: 1, scale: 1, duration: 0.34, ease: EASE.arrive },
      0.1,
    );
    if (frame)
      tl.to(frame, { opacity: 0, duration: DUR.exit, ease: EASE.exit }, 0.16);
    const titleLabel = labels.get("title");
    if (titleLabel)
      tl.to(
        titleLabel,
        { opacity: 0, duration: DUR.feedback, ease: EASE.exit },
        0.1,
      );
    // 3. sketch-only notes (arrows, margin notes) leave first: ideas, not UI
    const isNote = (u: HTMLElement) =>
      u.dataset.skNote !== undefined ||
      (u.dataset.sk === "arrow" && u.childElementCount === 0);
    units.forEach((u, i) => {
      if (!isNote(u)) return;
      const out = [groups.get(i), labels.get(String(i))].filter(
        Boolean,
      ) as Element[];
      if (out.length)
        tl.to(
          out,
          { opacity: 0, duration: DUR.feedback, ease: EASE.exit },
          0.02,
        );
    });
    // 4. elements in reading order: the label and highlighter leave, the crisp element arrives
    // (arrive) a beat later, its pencil fades (exit, faster)
    const cascade = units.filter((u) => !isNote(u));
    const n = cascade.length;
    const span = 0.18;
    cascade.forEach((u, rank) => {
      const i = units.indexOf(u);
      const at = 0.12 + (n > 1 ? (rank / (n - 1)) * span : 0);
      const l = labels.get(String(i));
      if (l)
        tl.to(l, { opacity: 0, y: -3, duration: 0.12, ease: EASE.exit }, at);
      const g = groups.get(i);
      if (g) {
        // highlighter bands wipe off left to right, like the swipe in reverse
        g.querySelectorAll<SVGPathElement>("path[data-swipe]").forEach(
          (band) => {
            let len = 0;
            try {
              len = Math.ceil(band.getTotalLength()) + 2;
            } catch {
              len = 0;
            }
            if (!len) return;
            tl.fromTo(
              band,
              { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 },
              { strokeDashoffset: -len, duration: 0.16, ease: EASE.exit },
              at,
            );
          },
        );
        tl.to(
          g,
          { opacity: 0, duration: DUR.exit, ease: EASE.exit },
          at + 0.04,
        );
      }
      tl.fromTo(
        u,
        { opacity: 0, scale: 0.97 },
        { opacity: 1, scale: 1, duration: DUR.ui, ease: EASE.arrive },
        at + 0.06,
      );
    });
    // 5. the stamp lands (snap), the window takes the hit
    if (stampEl) tl.add(stampIn(stampEl, { impact: win }), 0.5);

    return () => {
      tl.kill();
      gsap.set(win, { clearProps: "opacity,transform" });
      if (units.length) gsap.set(units, { clearProps: "opacity,transform" });
      if (stampEl)
        gsap.set(stampEl, { clearProps: "opacity,visibility,transform" });
    };
  }, [phase, stamp, fireShipped]);

  // the stamp: at a spot of the window (tpl.stamp classes) or inside the template's <StampSlot>
  const slotted = tpl.stamp === "slot";
  const renderStamp = useCallback(
    (position: string) =>
      stamp ? (
        <ShippedStamp
          ref={stampRef}
          size={STAMP_SIZE[size]}
          decorative
          className={cx(
            "pointer-events-none absolute z-(--z-raised) group-data-[state=sketch]/mui:invisible @max-md:text-(length:--text-label)",
            size === "lg" && "@max-2xl:text-(length:--text-ui)",
            position,
          )}
        />
      ) : null,
    [stamp, size],
  );

  const gate = !autoplay || inView;
  const layerMode: LayerMode =
    phase !== "sketch" || reduced ? "static" : gate ? "draw" : "hidden";

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={`${project?.shortTitle ?? projectId} interface: ${tpl.describe}`}
      data-miniui={projectId}
      data-template={tpl.name}
      data-state={phase}
      data-size={size}
      className={cx("group/mui @container relative w-full", className)}
    >
      <AppWindow
        ref={winRef}
        title={title}
        ratio="16 / 11"
        seed={`mui-${projectId}`}
        className="group-data-[state=sketch]/mui:opacity-0"
      >
        <StampSlotContext.Provider value={slotted ? renderStamp : null}>
          <Template p={project} size={size} />
        </StampSlotContext.Provider>
      </AppWindow>
      {phase !== "ship" ? (
        <SketchLayer
          ref={layerRef}
          rootRef={rootRef}
          winRef={winRef}
          seed={projectId}
          title={title}
          mode={layerMode}
          onDrawn={onDrawn}
        />
      ) : null}
      {slotted ? null : renderStamp(tpl.stamp)}
    </div>
  );
}
