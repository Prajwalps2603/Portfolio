"use client";

/**
 * CERTIFICATIONS & AWARDS, in a vault (About). On the ink slab, one strongroom wall: on it the
 * round vault door in its frame (./vaultArt: lime rim and face, rivets, eight bolts, the
 * combination dial, the spoked wheel, the PMP plate, two hinges) in front of the strongroom (walls
 * of deposit boxes in perspective, a lamp), and beside it the wall's deposit boxes: small numbered
 * ones above and below, and one big box per credential, its little door hiding what is inside
 * (Oracle a framed certificate with a seal, GitHub a hexagonal badge, Dyashin a rolled diploma,
 * the 1st place a trophy) and its facts on the box's face: title, issuer · year, and Verify (the
 * award: what it was for). The facts are always readable; only the drawings are locked away.
 *
 * LOCKED UNTIL YOU OPEN IT (Prajwal's call): with JS and motion the vault starts shut and every box
 * locked. A click or tap on the door (or Enter / Space: it is a button) spins the dial left,
 * right, left, turns the wheel, pulls the bolts back and swings the door open; the strongroom's
 * lamp comes on and the boxes open one after another (on phones, each as it comes on screen).
 * With a mouse or pen the wheel can also be turned by hand: drag it round past half a turn and the
 * vault opens; let go sooner and it springs back. A click on the open door locks it all again. When
 * the door first comes on screen the wheel gives a small turn and back (the hint), and a note under
 * the door says what to do. Every run is started by the visitor (no loop), so no pause control.
 * Left open, it stays open: localStorage "pmp:vault" = "open" (VAULT_KEY), read again on the next
 * visit; locking it clears that. No flash on a refresh: the boot script and globals.css draw it
 * locked (or open, if it was left open) from the first paint, until this component takes over.
 * Reduced motion, sketch mode (a pencil drawing) and no JS: open, which is the markup, and no
 * button. Phones: the door above the boxes.
 */
import { useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { certifications } from "@/content";
import { ExternalLink } from "@/components/ui";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/eases";
import { safeStart } from "@/lib/motion/splitArrive";
import { useReducedMotion } from "@/lib/motion/media";
import { VAULT_KEY } from "@/lib/motion/bootScript";
import { useSketchMode } from "@/lib/stores/sketchMode";
import {
  BOLT,
  BOLTS,
  C,
  COMPARTMENT,
  DIAL,
  DOOR,
  FRAME,
  HATCH_DEG,
  KNUCKLE_CAPS,
  KNUCKLE_JOINTS,
  KNUCKLES,
  OPEN_DEG,
  PIVOT_ORIGIN,
  PLATE,
  R,
  ROOM,
  SPOKE,
  SPOKES,
  TUNNEL_C,
  TUNNEL_R,
  TUNNEL_RIM,
  TUNNEL_RING,
  VIEWBOX,
} from "./vaultArt";

type Cert = (typeof certifications)[number];
const CREDS: Cert[] = [...certifications.filter((c) => c.kind === "Certification"), ...certifications.filter((c) => c.kind === "Award")];

type Thing = "frame" | "badge" | "scroll" | "trophy";
const THING: Record<string, Thing> = { "oracle-agentic-ai": "frame", "github-foundations": "badge", "dyashin-java-full-stack": "scroll" };
const thingOf = (c: Cert): Thing => (c.kind === "Award" ? "trophy" : (THING[c.id] ?? "frame"));

/** The door's edge: layers behind its face, so the open door shows how thick it is. */
const EDGE = 9;
const EDGE_STEP = 1.15; // cqw (of the door's box) per layer
/** The strongroom before its lamp comes on. */
const DARK = 0.12;
/** Box numbers: the small row above, then the four big boxes, then the small row below. */
const FIRST = 101;
/** How far the wheel must be turned by hand (degrees) before the vault gives. */
const GIVE = 200;

type Phase = "locked" | "opening" | "open" | "closing";
const LABEL: Record<Phase, string> = {
  locked: "Unlock the vault",
  opening: "Unlocking the vault",
  open: "Lock the vault again",
  closing: "Locking the vault",
};
const CURSOR: Record<Phase, string | undefined> = { locked: "Turn the wheel", opening: undefined, open: "Lock it again", closing: undefined };

const angleOf = (e: { clientX: number; clientY: number }, cx: number, cy: number) => (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;

/** Was the vault left open (on an earlier visit)? Remember the visitor's choice. */
function leftOpen(): boolean {
  try {
    return localStorage.getItem(VAULT_KEY) === "open";
  } catch {
    return false;
  }
}
function remember(open: boolean) {
  try {
    if (open) localStorage.setItem(VAULT_KEY, "open");
    else localStorage.removeItem(VAULT_KEY);
  } catch {
    /* storage blocked: it simply starts locked next time */
  }
}

export function Vault() {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { on: sketch } = useSketchMode();
  const still = reduced || sketch;
  // unknown until the component takes over (the server cannot know if it was left open): no note,
  // no button until then; globals.css draws the right state meanwhile
  const [phase, setPhase] = useState<Phase | null>(null);
  const phaseRef = useRef<Phase>("open");
  const go = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };
  const shown: Phase | null = still ? "open" : phase;
  /** The boxes opened so far, those waiting to come on screen, and their runs. */
  const opened = useRef(new Set<number>());
  const waiting = useRef<ScrollTrigger[]>([]);
  const runs = useRef<gsap.core.Timeline[]>([]);
  /** The wheel being turned by hand, and a click to swallow after a turn. */
  const turn = useRef<{ id: number; cx: number; cy: number; hub: number; last: number; turned: number; travel: number; x: number; y: number } | null>(null);
  const swallow = useRef(false);

  const { contextSafe } = useGSAP(
    () => {
      const box = host.current;
      const p = box ? partsOf(box) : null;
      if (!box || !p) return;
      if (still) {
        box.removeAttribute("data-vault-boot");
        return;
      }
      gsap.set(p.dial, { svgOrigin: `${DIAL.x} ${DIAL.y}`, smoothOrigin: false });
      gsap.set(p.wheel, { svgOrigin: `${C} ${C}`, smoothOrigin: false });
      opened.current.clear();
      if (leftOpen()) {
        // left open last time: it stays open (the markup), every box with it
        p.hatches.forEach((_, i) => opened.current.add(i));
        box.removeAttribute("data-vault-boot");
        go("open");
        return () => {
          opened.current.clear();
          turn.current = null;
          phaseRef.current = "open";
        };
      }
      // locked (globals.css has drawn it so since the first paint; GSAP holds it from here)
      gsap.set(p.door, { rotationY: 0 });
      gsap.set(p.bolts, { x: BOLT.travel });
      gsap.set(p.light, { opacity: DARK });
      gsap.set([p.dial, p.wheel], { rotation: 0 });
      gsap.set(p.hatches, { rotationY: 0 });
      gsap.set(p.lamps, { opacity: 0.2 });
      box.removeAttribute("data-vault-boot");
      go("locked");
      // the hint, once: when the door comes on screen the wheel gives a small turn and back
      ScrollTrigger.create({
        trigger: p.stage,
        start: () => safeStart(p.stage, "top 65%"),
        once: true,
        onEnter: () => {
          if (phaseRef.current !== "locked" || turn.current) return;
          gsap
            .timeline({ delay: 0.25 })
            .to(p.wheel, { rotation: 34, duration: 0.34, ease: EASE.pen })
            .to(p.wheel, { rotation: -8, duration: 0.3, ease: EASE.pen })
            .to(p.wheel, { rotation: 0, duration: 0.4, ease: EASE.arrive });
        },
      });
      return () => {
        waiting.current = [];
        runs.current = [];
        opened.current.clear();
        turn.current = null;
        phaseRef.current = "open";
      };
    },
    { scope: host, dependencies: [still], revertOnUpdate: true },
  );

  /** One box: its little door swings open, its lamp lights, what is inside settles. */
  const openBox = contextSafe((p: Parts, i: number, delay: number) => {
    if (opened.current.has(i) || (phaseRef.current !== "opening" && phaseRef.current !== "open")) return;
    opened.current.add(i);
    const t = gsap.timeline({ delay });
    t.to(p.hatches[i], { rotationY: HATCH_DEG, duration: 0.6, ease: EASE.pen }, 0)
      .to(p.lamps[i], { opacity: 1, duration: 0.2, ease: EASE.arrive }, 0.12)
      .fromTo(p.things[i], { y: 6, scale: 0.92 }, { y: 0, scale: 1, duration: 0.5, ease: EASE.arrive }, 0.2);
    runs.current.push(t);
  });

  /** The boxes on screen open one after another; the others as each comes on screen. */
  const openBoxes = contextSafe((p: Parts) => {
    const vh = window.innerHeight;
    let k = 0;
    p.boxes.forEach((box, i) => {
      const r = box.getBoundingClientRect();
      if (r.bottom <= 0) openBox(p, i, 0);
      else if (r.top < vh * 0.92) openBox(p, i, 0.32 * k++);
      else waiting.current.push(ScrollTrigger.create({ trigger: box, start: "top 88%", once: true, onEnter: () => openBox(p, i, 0.1) }));
    });
  });

  /** Unlock: the combination (not when the wheel was turned by hand), the wheel, the bolts, the
   *  door, the lamp, then the boxes. */
  const unlock = contextSafe((byHand: boolean) => {
    const p = host.current ? partsOf(host.current) : null;
    if (!p || still || phaseRef.current !== "locked") return;
    go("opening");
    remember(true);
    gsap.killTweensOf(p.wheel);
    const t = gsap.timeline({ onComplete: () => go("open") });
    let at = 0;
    if (!byHand) {
      // left, right, left
      t.to(p.dial, { rotation: -270, duration: 0.45, ease: EASE.pen }, 0)
        .to(p.dial, { rotation: -180, duration: 0.3, ease: EASE.pen }, 0.5)
        .to(p.dial, { rotation: -360, duration: 0.38, ease: EASE.pen }, 0.85)
        .set(p.dial, { rotation: 0 }, 1.25);
      at = 1.3;
    }
    // the wheel goes on round to two spokes on (it looks the same after); the bolts pull back
    const from = Number(gsap.getProperty(p.wheel, "rotation")) || 0;
    const spin = Math.max(0.2, (0.7 * Math.max(0, 240 - from)) / 240);
    t.to(p.wheel, { rotation: 240, duration: spin, ease: byHand ? EASE.arrive : EASE.pen }, at);
    at += spin * 0.65;
    t.to(p.bolts, { x: 0, duration: 0.3, ease: EASE.pen, stagger: 0.02 }, at);
    // the door swings open, the lamp comes on, the boxes open
    t.to(p.door, { rotationY: OPEN_DEG, duration: 1.1, ease: EASE.pen }, at + 0.5);
    t.to(p.light, { opacity: 1, duration: 0.4, ease: EASE.arrive }, at + 0.9);
    t.call(() => openBoxes(p), undefined, at + 1.0);
  });

  /** Lock: the boxes shut (last first), the lamp goes off, the door swings shut, the bolts go
   *  home, the wheel turns back. */
  const lock = contextSafe(() => {
    const p = host.current ? partsOf(host.current) : null;
    if (!p || still || phaseRef.current !== "open") return;
    go("closing");
    remember(false);
    waiting.current.forEach((st) => st.kill());
    waiting.current = [];
    runs.current.forEach((r) => r.kill());
    runs.current = [];
    const shut = [...opened.current].sort((a, b) => b - a);
    opened.current.clear();
    const t = gsap.timeline({ onComplete: () => go("locked") });
    shut.forEach((i, k) => {
      t.to(p.hatches[i], { rotationY: 0, duration: 0.42, ease: EASE.pen }, k * 0.12);
      t.to(p.lamps[i], { opacity: 0.2, duration: 0.2, ease: EASE.exit }, k * 0.12 + 0.2);
    });
    const at = shut.length ? (shut.length - 1) * 0.12 + 0.3 : 0;
    t.to(p.light, { opacity: DARK, duration: 0.35, ease: EASE.exit }, at);
    t.to(p.door, { rotationY: 0, duration: 0.9, ease: EASE.pen }, at);
    t.to(p.bolts, { x: BOLT.travel, duration: 0.25, ease: EASE.pen, stagger: 0.02 }, at + 0.88);
    t.to(p.wheel, { rotation: 0, duration: 0.6, ease: EASE.pen }, at + 0.9);
  });

  /* ---- the wheel by hand (mouse and pen; a touch is a tap) ---- */
  const onPointerDown = contextSafe((e: ReactPointerEvent<HTMLButtonElement>) => {
    swallow.current = false;
    if (e.pointerType === "touch" || e.button !== 0 || phaseRef.current !== "locked") return;
    const p = host.current ? partsOf(host.current) : null;
    if (!p) return;
    e.preventDefault(); // no text selection while turning
    gsap.killTweensOf(p.wheel);
    const r = p.stage.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    turn.current = { id: e.pointerId, cx, cy, hub: r.width * 0.08, last: angleOf(e, cx, cy), turned: Number(gsap.getProperty(p.wheel, "rotation")) || 0, travel: 0, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  });

  const onPointerMove = contextSafe((e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = turn.current;
    if (!d || d.id !== e.pointerId) return;
    const p = host.current ? partsOf(host.current) : null;
    if (!p) return;
    d.travel = Math.max(d.travel, Math.hypot(e.clientX - d.x, e.clientY - d.y));
    const a = angleOf(e, d.cx, d.cy);
    // near the hub the angle jumps about: only follow the pointer away from it, after a real drag
    if (Math.hypot(e.clientX - d.cx, e.clientY - d.cy) < d.hub || d.travel < 4) {
      d.last = a;
      return;
    }
    let delta = a - d.last;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    d.last = a;
    d.turned = Math.min(300, Math.max(-40, d.turned + delta));
    gsap.set(p.wheel, { rotation: d.turned });
    if (d.turned >= GIVE) {
      turn.current = null;
      swallow.current = true;
      unlock(true);
    }
  });

  const onPointerUp = contextSafe((e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = turn.current;
    if (!d || d.id !== e.pointerId) return;
    turn.current = null;
    if (d.travel < 6) return; // a click
    // turned, but not far enough: it springs back
    swallow.current = true;
    const p = host.current ? partsOf(host.current) : null;
    if (p) gsap.to(p.wheel, { rotation: 0, duration: 0.5, ease: EASE.arrive });
  });

  const onClick = () => {
    if (swallow.current) {
      swallow.current = false;
      return;
    }
    if (phaseRef.current === "locked") unlock(false);
    else if (phaseRef.current === "open") lock();
  };

  return (
    <div ref={host} data-qa="vault" data-vault-boot="" data-phase={shown ?? "boot"} className="relative mt-8 rounded-[24px] border border-seam bg-ink-2 p-4 sm:mt-10 sm:p-6 lg:p-8">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)] lg:gap-10">
        <div className="flex flex-col items-center gap-3">
          <Door pen={sketch}>
            {still || !shown ? null : (
              <button
                type="button"
                data-qa="vault-door"
                aria-label={LABEL[shown]}
                onClick={onClick}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                data-cursor="lime"
                data-cursor-label={CURSOR[shown]}
                className="absolute inset-[4%] z-10 rounded-full select-none [-webkit-tap-highlight-color:transparent]"
              />
            )}
          </Door>
          {still ? null : <Note phase={shown} />}
        </div>

        {/* the wall of deposit boxes */}
        <div data-wall="">
          <div aria-hidden="true" className="mb-3 flex items-center justify-between gap-3 px-0.5">
            <span className="type-micro tracking-[0.18em] text-fog uppercase">
              <span className="max-sm:hidden">Strongroom · </span>deposit boxes
            </span>
            <span className="flex gap-1.5">
              {CREDS.map((c) => (
                <span key={c.id} data-lamp="" className="size-2 rounded-full bg-lime" />
              ))}
            </span>
          </div>
          <SmallBoxes from={FIRST} />
          <ol className="my-3 grid gap-3 md:grid-cols-2">
            {CREDS.map((c, i) => (
              <DepositBox key={c.id} cert={c} no={FIRST + 10 + i} pen={sketch} />
            ))}
          </ol>
          <SmallBoxes from={FIRST + 10 + CREDS.length} />
        </div>
      </div>
    </div>
  );
}

/** What to do, under the door (spoken too, politely, as it changes). */
function Note({ phase }: { phase: Phase | null }) {
  return (
    <p data-vault-note="" aria-live="polite" className={`type-hand-sm flex min-h-[1.5em] items-center gap-1.5 text-center ${phase === "locked" ? "text-lime" : "text-fog"}`}>
      {phase === null ? null : phase === "locked" ? (
        <>
          <svg aria-hidden="true" viewBox="0 0 22 22" className="size-5 shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 18c-1-6 3-11 10-12M11 3l4.5 3-3.5 4" strokeWidth={1.8} className="stroke-lime" />
          </svg>
          <span>
            <span className="pointer-coarse:hidden">turn the wheel</span>
            <span className="hidden pointer-coarse:inline">tap the door</span> to open the vault
          </span>
        </>
      ) : phase === "opening" ? (
        "unlocking…"
      ) : phase === "open" ? (
        <span>
          open. <span className="pointer-coarse:hidden">click</span>
          <span className="hidden pointer-coarse:inline">tap</span> the door to lock it again
        </span>
      ) : (
        "locking…"
      )}
    </p>
  );
}

function partsOf(box: HTMLElement) {
  const one = <T extends Element>(s: string) => box.querySelector<T>(s);
  const all = <T extends Element>(s: string) => Array.from(box.querySelectorAll<T>(s));
  const stage = one<HTMLElement>("[data-stage]");
  const door = one<HTMLElement>("[data-door]");
  const dial = one<SVGGElement>("[data-dial]");
  const wheel = one<SVGGElement>("[data-wheel]");
  const light = one<SVGGElement>("[data-light]");
  if (!stage || !door || !dial || !wheel || !light) return null;
  return {
    stage,
    door,
    dial,
    wheel,
    light,
    bolts: all<SVGRectElement>("[data-bolt]"),
    boxes: all<HTMLElement>("[data-box]"),
    hatches: all<HTMLElement>("[data-hatch]"),
    things: all<HTMLElement>("[data-thing]"),
    lamps: all<HTMLElement>("[data-lamp]"),
  };
}
type Parts = NonNullable<ReturnType<typeof partsOf>>;

/** The door in its frame, the strongroom through the doorway, the hinges; `children` sits on top
 *  (the button). */
function Door({ pen, children }: { pen: boolean; children?: ReactNode }) {
  const clip = `vault-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ink = !pen;
  return (
    <div data-stage="" className="relative aspect-square w-full max-w-[17.5rem] [container-type:inline-size] sm:max-w-[20rem] lg:max-w-[25rem]">
      <div aria-hidden="true" className="absolute inset-0 [perspective:440cqw]">
        {/* the frame in the wall, the tunnel, the strongroom */}
        <svg viewBox={VIEWBOX} fill="none" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 size-full overflow-visible">
          <defs>
            <clipPath id={clip}>
              <circle cx={TUNNEL_C[0]} cy={TUNNEL_C[1]} r={TUNNEL_R} />
            </clipPath>
          </defs>
          <path d={FRAME.ring} fillRule="evenodd" strokeWidth={1.5} className={ink ? "fill-seam stroke-ash" : "stroke-graphite"} />
          <path d={FRAME.rivets} className={ink ? "fill-ash" : "fill-pencil"} />
          {BOLTS.map((a) => (
            <rect key={a} x={C + R.opening - 4} y={C - 12} width={22} height={24} rx={3} transform={`rotate(${a} ${C} ${C})`} strokeWidth={1.2} className={ink ? "fill-ink stroke-ash" : "stroke-graphite"} />
          ))}
          <path d={TUNNEL_RING} fillRule="evenodd" className={ink ? "fill-ink" : ""} />
          <g clipPath={`url(#${clip})`}>
            {ink ? (
              <>
                <path d={ROOM.ceiling} className="fill-ink" />
                <path d={ROOM.walls} className="fill-ink-2" />
                <path d={ROOM.floor} className="fill-seam" />
                <path d={ROOM.back} className="fill-ink-2" />
              </>
            ) : null}
            <g data-light="">
              <path d={ROOM.runner} strokeWidth={1} className={ink ? "fill-ink-2 stroke-ash" : "stroke-pencil"} />
              <path d={ROOM.edges + ROOM.boxes} strokeWidth={1} className={ink ? "stroke-ash" : "stroke-pencil"} />
              <path d={ROOM.holes} className={ink ? "fill-fog" : "fill-pencil"} />
              {ink ? <path d={ROOM.cone} className="fill-lime" opacity={0.08} /> : null}
              {ink ? <path d={ROOM.pool} className="fill-lime" opacity={0.14} /> : null}
              <path d={ROOM.cord} strokeWidth={1.5} className={ink ? "stroke-fog" : "stroke-graphite"} />
              <path d={ROOM.shade} strokeWidth={1.2} className={ink ? "fill-ash stroke-fog" : "stroke-graphite"} />
              <path d={ROOM.bulb} strokeWidth={1.2} className={ink ? "fill-lime" : "stroke-graphite"} />
            </g>
          </g>
          <path d={TUNNEL_RIM} strokeWidth={1.2} className={ink ? "stroke-ash" : "stroke-graphite"} />
        </svg>

        {/* the door, turning on its hinge pins */}
        <div data-door="" className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: `rotateY(${OPEN_DEG}deg)`, transformOrigin: PIVOT_ORIGIN }}>
          {Array.from({ length: EDGE }, (_, k) => (
            <svg key={k} data-door-edge="" viewBox={VIEWBOX} className="absolute inset-0 size-full overflow-visible" style={{ transform: `translateZ(-${((EDGE - k) * EDGE_STEP).toFixed(2)}cqw)` }}>
              <circle cx={C} cy={C} r={R.door} strokeWidth={k === 0 && pen ? 2 : 0} className={ink ? "fill-lime-deep" : "fill-card stroke-graphite"} />
            </svg>
          ))}
          <svg viewBox={VIEWBOX} fill="none" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 size-full overflow-visible">
            <Face ink={ink} />
          </svg>
        </div>

        {/* the hinge knuckles, on the frame */}
        <svg viewBox={VIEWBOX} fill="none" strokeLinejoin="round" className="absolute inset-0 size-full overflow-visible">
          <path d={KNUCKLES} strokeWidth={1.5} className={ink ? "fill-ink-2 stroke-ash" : "stroke-graphite"} />
          <path d={KNUCKLE_JOINTS} strokeWidth={1.2} className={ink ? "stroke-ash" : "stroke-graphite"} />
          <path d={KNUCKLE_CAPS} className={ink ? "fill-ash" : "fill-graphite"} />
        </svg>
      </div>
      {children}
    </div>
  );
}

/** The door's face: bolts under the rim, rim and rivets, the face, the hinge arms, the dial, the
 *  wheel, the plate. */
function Face({ ink }: { ink: boolean }) {
  return (
    <>
      {BOLTS.map((a) => (
        <g key={a} transform={`rotate(${a} ${C} ${C})`}>
          <rect data-bolt="" x={C + BOLT.x} y={C - BOLT.h / 2} width={BOLT.w} height={BOLT.h} rx={3} strokeWidth={2} className={ink ? "fill-paper-2 stroke-ink" : "stroke-graphite"} />
        </g>
      ))}
      <circle cx={C} cy={C} r={R.door} strokeWidth={ink ? 4 : 2} className={ink ? "fill-lime stroke-ink" : "fill-card stroke-graphite"} />
      <path d={DOOR.rivets} className={ink ? "fill-ink" : "fill-graphite"} />
      <circle cx={C} cy={C} r={R.face} strokeWidth={ink ? 3 : 1.5} className={ink ? "fill-lime-soft stroke-ink" : "fill-card stroke-graphite"} />
      <path d={DOOR.arms} strokeWidth={2} className={ink ? "fill-ink-2 stroke-ink" : "stroke-graphite"} />
      <path d={DOOR.armBolts} className={ink ? "fill-lime" : "fill-graphite"} />

      {/* the combination dial in its bezel, the index above it */}
      <circle cx={DIAL.x} cy={DIAL.y} r={DIAL.bezel} strokeWidth={2} className={ink ? "fill-ink-2 stroke-ink" : "stroke-graphite"} />
      <path d={DOOR.index} className={ink ? "fill-lime" : "fill-graphite"} />
      <g data-dial="">
        <circle cx={DIAL.x} cy={DIAL.y} r={DIAL.r} strokeWidth={2} className={ink ? "fill-paper stroke-ink" : "fill-card stroke-graphite"} />
        <path d={DOOR.ticks} strokeWidth={1.5} className={ink ? "stroke-ink" : "stroke-graphite"} />
        <path d={`M${DIAL.x} ${DIAL.y}V${DIAL.y - 14}`} strokeWidth={3} className={ink ? "stroke-tangerine" : "stroke-graphite"} />
        <circle cx={DIAL.x} cy={DIAL.y} r={4.5} className={ink ? "fill-ink" : "fill-graphite"} />
      </g>

      {/* the wheel */}
      <g data-wheel="">
        {SPOKES.map((a) => (
          <g key={a} transform={`rotate(${a} ${C} ${C})`}>
            <path d={`M${C} ${C}V${C - SPOKE.len}`} strokeWidth={ink ? 10 : 1.6} className={ink ? "stroke-ink" : "stroke-graphite"} />
            <circle cx={C} cy={C - SPOKE.len - 2} r={SPOKE.ball} strokeWidth={3} className={ink ? "fill-lime stroke-ink" : "stroke-graphite"} />
          </g>
        ))}
        <circle cx={C} cy={C} r={SPOKE.hub} strokeWidth={ink ? 3 : 1.5} className={ink ? "fill-ink-2 stroke-ink" : "fill-card stroke-graphite"} />
        <circle cx={C} cy={C} r={SPOKE.cap} strokeWidth={1.5} className={ink ? "fill-lime" : "stroke-graphite"} />
      </g>

      {/* the maker's plate */}
      <rect x={PLATE.x} y={PLATE.y} width={PLATE.w} height={PLATE.h} rx={5} strokeWidth={1.5} className={ink ? "fill-ink" : "stroke-graphite"} />
      <path d={`M${PLATE.x + 9.2} ${PLATE.y + 14}a2.2 2.2 0 1 0 -4.4 0a2.2 2.2 0 1 0 4.4 0ZM${PLATE.x + PLATE.w - 4.8} ${PLATE.y + 14}a2.2 2.2 0 1 0 -4.4 0a2.2 2.2 0 1 0 4.4 0Z`} className={ink ? "fill-lime" : "fill-graphite"} />
      <text x={C + 1.3} y={PLATE.y + 20.5} textAnchor="middle" className={`font-display ${ink ? "fill-lime" : "fill-graphite"}`} style={{ fontSize: 19, fontWeight: 800, letterSpacing: "0.14em" }}>
        PMP
      </text>
    </>
  );
}

/** A row of small locked boxes (the wall's texture): five on phones, eight, then ten. */
function SmallBoxes({ from }: { from: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
      {Array.from({ length: 10 }, (_, k) => (
        <span key={k} className={`flex h-9 items-end justify-between rounded-[6px] border border-seam bg-ink px-1.5 pb-1 ${k >= 8 ? "max-lg:hidden" : k >= 5 ? "max-sm:hidden" : ""}`}>
          <span className="type-micro text-fog tabular-nums">{from + k}</span>
          <span className="mb-1 size-1.5 rounded-full bg-ash" />
        </span>
      ))}
    </div>
  );
}

/** A credential's deposit box: the compartment (its little door open, the object inside) and the
 *  facts on the box's face. */
function DepositBox({ cert: c, no, pen }: { cert: Cert; no: number; pen: boolean }) {
  return (
    <li data-box="" className="relative flex items-center gap-3.5 rounded-[14px] border border-line-strong bg-paper-2 p-3 text-ink sm:gap-4 sm:p-3.5">
      <div aria-hidden="true" className="relative h-[4.75rem] w-[5.25rem] shrink-0 [perspective:700px] sm:h-[5.25rem] sm:w-[6rem]">
        <div className={`absolute inset-0 overflow-hidden rounded-[9px] border ${pen ? "border-graphite" : "border-ink bg-ink"}`}>
          <svg viewBox={COMPARTMENT.view} preserveAspectRatio="none" className="absolute inset-0 size-full" fill="none">
            {pen ? (
              <path d={COMPARTMENT.edges} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-pencil" />
            ) : (
              <>
                <path d={COMPARTMENT.ceiling} className="fill-ink" />
                <path d={COMPARTMENT.walls} className="fill-ink-2" />
                <path d={COMPARTMENT.floor} className="fill-seam" />
                <path d={COMPARTMENT.back} className="fill-ink-2" />
                <path d={COMPARTMENT.edges} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-ash" />
              </>
            )}
          </svg>
          <div data-thing="" className="absolute inset-y-0 right-0 left-[22%] grid place-items-center">
            <ThingArt kind={thingOf(c)} ink={!pen} />
          </div>
        </div>
        {/* its little door: a number, two keyholes, a pull */}
        <div
          data-hatch=""
          className={`absolute inset-0 flex origin-left flex-col justify-between rounded-[9px] border-2 border-graphite p-1.5 ${pen ? "" : "bg-fog"}`}
          style={{ transform: `rotateY(${HATCH_DEG}deg)` }}
        >
          <span className="type-micro text-ink tabular-nums">{no}</span>
          <svg viewBox="0 0 26 12" className="h-3 w-auto self-start" fill="none">
            <path d="M5 1.5a3 3 0 0 1 1.4 5.6l1 4.4h-4.8l1-4.4A3 3 0 0 1 5 1.5ZM17 1.5a3 3 0 0 1 1.4 5.6l1 4.4h-4.8l1-4.4A3 3 0 0 1 17 1.5Z" className={pen ? "stroke-graphite" : "fill-ink"} />
          </svg>
          <span className="absolute top-1/2 right-1.5 h-6 w-1 -translate-y-1/2 rounded-full bg-graphite" />
        </div>
      </div>
      <div className="min-w-0">
        <h4 className="type-ui text-pretty">{c.title}</h4>
        <p className="type-mono mt-1 text-graphite">
          {c.issuer}{" "}
          <span className="whitespace-nowrap">
            <span aria-hidden="true">·</span> <span className="tabular-nums">{c.year}</span>
          </span>
        </p>
        {c.href ? (
          <ExternalLink href={c.href} hint="the credential, opens in a new tab" data-cursor="blue" className="type-ui mt-1.5 inline-block text-blue-deep underline decoration-blue-deep/40 underline-offset-4 hocus:decoration-blue-deep">
            Verify<span className="sr-only">: {c.title}</span>
          </ExternalLink>
        ) : c.note ? (
          <p className="type-hand-sm mt-1 text-graphite">for {c.note}</p>
        ) : null}
      </div>
    </li>
  );
}

/** What is in each box. */
function ThingArt({ kind, ink }: { kind: Thing; ink: boolean }) {
  const cls = "size-12 sm:size-14";
  if (kind === "trophy") {
    return (
      <svg viewBox="0 0 64 64" className={cls} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12h-6a6.5 6.5 0 0 0 7.5 11M45 12h6a6.5 6.5 0 0 1 -7.5 11" strokeWidth={2.5} className={ink ? "stroke-lime" : "stroke-graphite"} />
        <path d="M19 8h26v14a13 13 0 0 1 -26 0Z" strokeWidth={1.5} className={ink ? "fill-lime" : "stroke-graphite"} />
        <path d="M29 34h6v10h-6Z" strokeWidth={1.5} className={ink ? "fill-lime" : "stroke-graphite"} />
        <path d="M20 44h24v9h-24Z" strokeWidth={1.5} className={ink ? "fill-card stroke-lime" : "stroke-graphite"} />
        <text x={32} y={26} textAnchor="middle" className={`font-display ${ink ? "fill-ink" : "fill-graphite"}`} style={{ fontSize: 16, fontWeight: 800 }}>
          1
        </text>
      </svg>
    );
  }
  if (kind === "badge") {
    return (
      <svg viewBox="0 0 64 64" className={cls} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 5l24 13.5v27L32 59 8 45.5v-27Z" strokeWidth={3} className={ink ? "fill-card stroke-lime" : "stroke-graphite"} />
        <path d="M32 14l16 9v18l-16 9-16-9V23Z" strokeWidth={1.2} className={ink ? "fill-ink-2" : "stroke-graphite"} />
        <path d="M24 32l6 6 11-12" strokeWidth={3.5} className={ink ? "stroke-lime" : "stroke-graphite"} />
      </svg>
    );
  }
  if (kind === "scroll") {
    return (
      <svg viewBox="0 0 64 64" className={cls} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g transform="rotate(-14 32 32)">
          <rect x={5} y={23} width={50} height={18} rx={9} strokeWidth={1.5} className={ink ? "fill-card stroke-line-strong" : "stroke-graphite"} />
          <ellipse cx={51} cy={32} rx={4.5} ry={9} strokeWidth={1.5} className={ink ? "fill-paper-2 stroke-line-strong" : "stroke-graphite"} />
          <ellipse cx={51} cy={32} rx={1.8} ry={3.6} strokeWidth={1.2} className={ink ? "stroke-line-strong" : "stroke-graphite"} />
          <path d="M27 21.5v21M33 21.5v21" strokeWidth={4} strokeLinecap="butt" className={ink ? "stroke-tangerine" : "stroke-graphite"} />
          <path d="M30 42.5l-6 14M30 42.5l6 14" strokeWidth={3} className={ink ? "stroke-tangerine" : "stroke-graphite"} />
        </g>
      </svg>
    );
  }
  // a framed certificate with a seal on ribbons
  return (
    <svg viewBox="0 0 64 64" className={cls} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x={7} y={7} width={50} height={40} rx={2} strokeWidth={3} className={ink ? "fill-card stroke-blue" : "stroke-graphite"} />
      <path d="M15 18h34M15 25h26M15 32h30" strokeWidth={2} className={ink ? "stroke-line-strong" : "stroke-pencil"} />
      <path d="M40 48l-5 12 4.5-2.5 3.5 4 1.5-12Z M48 48l5 12-4.5-2.5-3.5 4-1.5-12Z" strokeWidth={1.2} className={ink ? "fill-blue" : "stroke-graphite"} />
      <circle cx={44} cy={43} r={8} strokeWidth={1.5} className={ink ? "fill-blue stroke-card" : "stroke-graphite"} />
    </svg>
  );
}
