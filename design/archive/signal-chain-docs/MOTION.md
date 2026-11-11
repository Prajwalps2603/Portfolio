# Signal Chain: motion system

Read with `docs/DESIGN.md`. Every value here exists in code: eases and durations in
`src/lib/motion/eases.ts` (GSAP) mirrored as CSS custom properties in `src/app/globals.css`.

## 1. Thesis

**Signals are discrete and they lock.** Motion on this site behaves like an instrument, not a
web page: a beam sweeps at a symmetric speed, a trigger catches with a 2% overshoot and
settles, sampled text resolves in hard steps (never tweens), pulses travel copper at constant
speed because signals don't ease, and UI chrome arrives quickly and quietly. Once something
has locked, it is still. Idle screens draw nothing.

Three consequences:
1. Each section gets **at most one authored moment** (table in §4). Nothing else in that
   section competes with it. Never the same fade-up on every section.
2. Arrivals are exponential ease-outs or the lock; **exits are faster than entrances** and
   accelerate away (`EASE.exit`). No bounce, no elastic, no back-ease by reflex.
3. Motion reaches beyond opacity/transform where it carries meaning: clip-path (beam wipes,
   curtain, menu scan), CSS masks (sample-and-hold), shader uniforms (the scope), stroke
   dash offsets (traces drawing in).

## 2. Imports

```ts
import { gsap, ScrollTrigger, SplitText, CustomEase, useGSAP } from "@/lib/motion/gsap"; // ONLY here
import { EASE, DUR, STAGGER, SAMPLE_STEPS } from "@/lib/motion/eases";
import { useReducedMotion } from "@/lib/motion/media";      // footer toggle + OS
import { useLoopsAllowed } from "@/lib/motion/preferences";  // Signals toggle + reduced motion
import { SplitReveal, safeStart } from "@/lib/motion/SplitReveal";
import { SampledText, sampleTimeline, beamWipe, clearSampling } from "@/lib/motion/sampled";
import { useScrollReveal } from "@/lib/motion/useScrollReveal";
import { useParallax } from "@/lib/motion/useParallax";
import { useMagnetic } from "@/lib/motion/useMagnetic";
import { useIntroMode, INTRO_TIMESCALE } from "@/lib/motion/useIntroMode";
import { startBoot, finishBoot, bootMode } from "@/lib/motion/boot";
```

`gsap.defaults` is `{ ease: "expo.out", duration: 0.6 }`. Name every ease anyway.

## 3. Named eases

| GSAP (`EASE.*`) | CSS (`ease-*` utility / `var(--ease-*)`) | Curve | Use for |
|---|---|---|---|
| `EASE.beam` = `"beam"` | `ease-beam` | cubic-bezier(.65,0,.35,1) | the beam crossing the screen, single-line beam wipes, trace draw-ins, scroll-cue sweep |
| `EASE.lock` = `"lock"` | `ease-lock` (CSS `linear()` sample) | M0,0 C.14,.62 .2,1.04 .34,1.02 .5,.99 .64,1 1,1 (2% overshoot, settle) | the trigger catching, lanes splitting, chips seating, the bench scope re-triggering, magnetic settle |
| `EASE.panel` = `"panel"` | `ease-panel` | cubic-bezier(.2,.8,.2,1) | UI chrome: hovers, chip expand, rows rising, menus, contact row indent |
| `EASE.wipe` = `"wipe"` | `ease-wipe` | cubic-bezier(.7,0,.2,1) | full-viewport clip-path wipes: route curtain, screen-to-sheet expansion |
| `EASE.out` = `"expo.out"` | `ease-expo` | cubic-bezier(.16,1,.3,1) | general arrivals: masked heading lines, datasheet sections |
| `EASE.probe` = `"power3.out"` | `ease-panel` | - | probe brackets, tooltips, readouts following a target; a new board sliding in |
| `EASE.exit` = `"power2.in"` | `ease-exit` | cubic-bezier(.55,0,1,.45) | anything leaving: old board off its rail, menu closing, curtain lifting |
| `EASE.inOut` = `"power3.inOut"` | - | - | symmetric moves that start and end at rest (unused by the route curtain since round 2) |
| `EASE.none` = `"none"` | `ease-linear` | linear | signals: pulses on copper, message dashes, anything scrubbed by scroll |

## 4. Durations and staggers

| `DUR.*` | s | CSS | Use |
|---|---|---|---|
| `tap` | 0.12 | `--dur-tap` | press feedback |
| `hover` | 0.20 | `--dur-hover` | link underline to bone, colour shifts |
| `invert` | 0.22 | `--dur-invert` | button graphite ↔ bone |
| `probe` | 0.22 | - | probe brackets snapping |
| `exit` | 0.30 | - | generic exit (menu close) |
| `chip` | 0.32 | `--dur-chip` | lane chip expanding its tech list |
| `surface` | 0.35 | `--dur-surface` | top bar graphite ↔ bone |
| `curtainExpand` | 0.26 | - | route curtain OUT: bench panel expanding to the viewport |
| `curtainWipe` | 0.24 | - | route curtain OUT: bone sheet wipe behind the beam (screen -> sheet) |
| `curtainReturn` | 0.27 | - | route curtain OUT: graphite wipe behind the beam (sheet -> screen), expo out |
| `curtainLift` | 0.45 | - | route curtain IN: graphite wiping off home (expo out, input already live) |
| `curtainFade` | 0.15 | - | reduced-motion route crossfade, each way |
| `panel` | 0.50 | - | hero chrome arrival, menu items |
| `rise` | 0.55 | `--dur-rise` | rows rising (useScrollReveal default) |
| `wipe` | 0.60 | `--dur-wipe` | clip-path expansions, datasheet sections |
| `beamWipe` | 0.70 | - | "Full Stack Developer" wipe |
| `heading` | 0.90 | - | SplitReveal masked lines |
| `beam` | 0.90 | - | the opening's beam sweep |
| `traceDraw` | 1.00 | - | the contact output trace drawing in |
| `sampleStep` | 0.17 | - | one sample-and-hold step on the hero name (5 steps) |
| `sheetStep` | 0.11 | - | one step on a datasheet title (4 steps) |

`STAGGER`: `chrome` 0.035 · `rows` 0.05 · `bom` 0.04 · `history` 0.07 · `sheet` 0.06 ·
`chips` 0.06 · `lines` 0.08.

Exit rule: an exit uses at most ~70% of its entrance's duration and `EASE.exit`.

## 5. The one authored moment per section (from the spec)

| Section | Authored moment | Implementation notes | Reduced motion |
|---|---|---|---|
| 00 Source (intro-hero + scene) | **The Lock**, ~3.0s, over the real hero DOM: beam powers on (0-150ms), sweeps (150-1050ms, beam), free-runs with AUTO blinking (to 1450ms), triggers (TRIG'D, roll stops 180ms power2.out, noise → 0.6% on lock ease over 500ms), splits into CH1-4 + Σ (1500-2100ms, lock), name samples in 5 × 170ms (1720-2570ms), "Full Stack Developer" beam-wipes (2100-2800ms), chrome rises 10px with 35ms stagger (2450-3000ms, panel). Skip on any key/pointerdown/wheel/touch: `timeScale(9)`. Repeat visit: `timeScale(2.6)`. Afterwards still: probe feedback, trigger, scroll-cue sweep (3 loops). | Build ONE master timeline. Animate `scope.signal` fields and call `wakeScope()` from `onUpdate`. Hero DOM uses `data-boot` (chrome), `data-boot-sample` (name), `data-boot-wipe` + `.beam-wipe` (role): they are hidden only while `html.booting`, with a 5.2s failsafe. Call `startBoot()` at start, `finishBoot()` on complete or skip. | `useIntroMode()` returns `"none"`: `lockScope()`, `finishBoot()`, one locked frame |
| 01 Signal (about) | **Scrubbed reading**: words rise from 20% to 100% opacity in reading order (scrub 0.6), finishing by 45% of the viewport; channel underlines grow continuously across line breaks (background-size). | ScrollTrigger `scrub: 0.6`, `end` such that the last word is lit when the paragraph's bottom is at 45% of the viewport. Set the 20% state in `useGSAP` only. Underlines are backgrounds so wrapping is safe. | fully lit, underlines full |
| 02 Systems (work) | **Re-acquisition** when an entry crosses 55% of the viewport: old board off its rail (400ms, `EASE.exit`), new one in (500ms, `EASE.probe`), chips seat (60ms stagger, lock), copper draws at constant speed (`EASE.none`), probes re-clip (300ms), scope re-triggers (lock). | Drive a state machine from ScrollTrigger `onToggle` / `onEnter(Back)`. Re-acquire `stage.returnFrom` on return. Two renderings share one probe state (`Board.tsx` picks one): on qualifying desktops the **3D bench board** (`src/components/work/board3d`, R3F, demand frameloop) runs the acquisition as one GSAP timeline on per-chip and per-wire shader uniforms (`Scene.tsx`, "acquisition"), with a damped pointer tilt of ±4° (600ms, `EASE.probe`) and a bone request pulse at constant speed; elsewhere the SVG board does the same in plain GSAP on DOM and SVG. Probe readouts and what-if effect swaps use Motion (`AnimatePresence`: expo-out in 240ms, power2.in out 140ms). | instant swaps, no pulses, static dashes; the 3D board is static (no tilt) |
| 02.b Also built (work) | none of its own: the names index is clip-path wiped in once on scroll (skipped if it is above the fold at load); the full parts table sits in a native `<details>` and its rows clip-path wipe in when opened (`EASE.out`, `STAGGER.rows`) | secondary; the `<details>` works without JS and find-in-page reaches it | visible, static |
| 03 Stack (skills) | **Group rules draw** (600ms, `scaleX` from 0, origin left, `EASE.beam`); rows rise 12px with 40ms stagger. Hover/focus a part → its lane lights in the strip (300ms) and the systems using it highlight. | rule draw is the moment; rows are secondary (`STAGGER.bom`) | rules full, rows visible; highlight via colour only |
| 04 History (about) | **Material change**: the top bar swaps to bone (350ms, already done by the header) as the sheet passes; revision rows rise 14px, 70ms stagger. | `useScrollReveal(ref, { targets: "[data-rev]", y: 14, stagger: STAGGER.history })`; nothing else moves | visible |
| 05 Connect (contact) | **The output trace** draws in from the left over 1.0s on entry (`EASE.beam`, stroke-dashoffset or clip-path); a copy sends a 700ms bone pulse along it (`EASE.none`); link rows indent 12px on hover (`ease-panel`). | the pulse is a state-change cue (allowed), not a loop | trace fully drawn; copy feedback by colour/text only |
| Footer (contact) | none | | |
| /work/[slug] (work) | **Screen-to-sheet arrival**: title sampled in (`<SampledText play={ready && arrival === "curtain"}>`, 4 × 110ms), sections rise 18px with 60ms stagger (600ms, `EASE.out`); message dashes move at constant speed, stop when Signals is paused. | see `usePageArrival` docs in `src/components/transition/usePageArrival.ts` | plain, static |

Use `<SplitReveal>` (masked lines, expo.out) only where a section has no stronger authored
moment, and never on two adjacent sections.

## 6. Primitives

### `<SplitReveal as="h2" type="lines|words" trigger="scroll|mount|manual">`
Masked lines rise (yPercent 110 → 0, `DUR.heading`, `EASE.out`, `STAGGER.lines`). Text is
visible in server HTML; SplitText splits after mount (autoSplit re-splits on resize/font
load and sets aria-label). Reduced motion: not split, not hidden. `start` defaults to
`"top 85%"` and is made reachable by `safeStart()` for elements near the page end.

### Sample-and-hold
- `sampleTimeline(el, { steps, stepDuration, slice })` returns a GSAP timeline of **hard
  steps** (`tl.call`, not tweens) stepping the mask pitch 24 → 12 → 6 → 3px → solid. Nest it
  in a master timeline (the hero adds it at 1.72s with `stepDuration: DUR.sampleStep`).
- `<SampledText as="h1" play={…}>` the datasheet title rule (4 × 110ms).
- `clearSampling(el)` removes the mask immediately (skip, cleanup).

### Beam wipe
Add `className="beam-wipe"` to a single-line element and call `beamWipe(el)` (tween `--rp`
0 → 1, `DUR.beamWipe`, `EASE.beam`). A 1.5px bone beam rides the clip edge and fades out at
the end.

### `useScrollReveal(scopeRef, { targets, y, stagger, duration, ease, start })`
Secondary, record-level arrival for rows and tables. Once, then the ScrollTrigger kills
itself. Default `targets: "[data-reveal]"`, `y: 12`, `EASE.panel`, `DUR.rise`.

### `useParallax(ref, { speed, trigger, start, end, toOpacity })`
Scrubbed, linear (`EASE.none`), `|speed| <= 0.15` of the viewport height. Disabled with reduced
motion. Only the hero copy uses it (`-0.07`); do not add parallax elsewhere without asking.

### `useMagnetic(ref, { strength, innerRef })`
Fine pointers only; settles with the lock ease. Use on at most one control per screen (e.g. the
hero primary CTA). Not for the probe zones.

## 7. Reduced motion

Source of truth: `useReducedMotion()` / `prefersReducedMotion()` (OS setting **or** the footer
"Motion: reduced", persisted). The `reduced:` CSS variant mirrors it (`html.rm`).

In reduced mode: no intro (one locked frame), no sampling, no Lenis (native scroll), no probe
cursor, no parallax/scrub/pinning that moves content, statement fully lit, bench swaps
instant, no pulses, static dashes, RUN LED steady, route transitions = a 150ms + 150ms opacity
crossfade through the destination's material (nothing moves).
Keep opacity/colour feedback for state changes (hover, pressed, copied).

**Signals: paused** (footer) stops every looping signal: scroll-cue sweep, bench pulses,
datasheet dashes (`signals-off:` variant, `useLoopsAllowed()`). Loops are allowed only when
`useLoopsAllowed()` is true. The AUTO blink is under 3 flashes per second.

## 8. GSAP in React: conventions

```tsx
const ref = useRef<HTMLElement>(null);
const reduced = useReducedMotion();
useGSAP(
  () => {
    if (reduced) return;                       // nothing hidden, nothing moves
    gsap.from("[data-row]", {                  // hidden state set by JS, not CSS
      y: 12, autoAlpha: 0, duration: DUR.rise, ease: EASE.panel, stagger: STAGGER.rows,
      scrollTrigger: { trigger: ref.current, start: "top 80%", once: true },
    });
  },
  { scope: ref, dependencies: [reduced], revertOnUpdate: true },
);
```

- Always `useGSAP` with a `scope` ref (auto-revert on unmount and on dependency change), or
  `gsap.context()` inside an effect that you `revert()` on cleanup. Selector strings are then
  scoped to your section: no global `.parts` lookups that warn on missing targets.
- Guard missing targets: `const rows = gsap.utils.toArray(sel, root); if (!rows.length) return;`
  (the sketch's "GSAP target .parts not found" warnings must not come back).
- StrictMode double-mounts in dev: effects must be idempotent (create in the effect, revert in
  cleanup; never keep "already ran" flags in module scope).
- ScrollTriggers: prefer `once: true` for arrivals; scrubbed ones die with the context. Use
  function-based values (`start: () => …`) with `invalidateOnRefresh: true` when they depend on
  layout. `<SmoothScroll>` already calls `ScrollTrigger.refresh()` after fonts load and whenever
  the document height changes; call it yourself only after a layout change that does not change
  the document height (e.g. a pinned element's internal reflow).
- Lenis drives scroll through the GSAP ticker; never create another Lenis or rAF scroll loop.
  Read scroll from `scroll` / `onScroll` (`@/lib/stores/stage`).
- Pinning: only where the spec asks (the bench's sticky right column is CSS `position: sticky`
  at `top-bar`, not a GSAP pin). Never pin with reduced motion.
- Wait for the opening: anything in the first viewport that animates on load must wait for
  `useStage((s) => s.intro) === "done"`.

## 9. Performance budget

- Animate `transform`, `opacity`, `clip-path`, mask properties, CSS custom properties and
  shader uniforms. Never animate `top/left/width/height`, `filter: blur()` on large areas, or
  box-shadow.
- No idle loops. Converge then stop: the hero scope stops at 0 draws once locked; the bench is DOM/SVG and
  its small scopes render only on change. Pause on `visibilitychange` and
  when offscreen (IntersectionObserver).
- WebGL (hero scope only, raw WebGL2, no three.js in the shipped bundle): `next/dynamic({ ssr: false })`, DPR from `dprForTier(getQualityTier())` (desktop ≤ 1.75,
  mobile ≤ 1.5), `hasWebGL()` false → CSS/SVG fallback (`.graticule`, SVG board) and
  `stage.set({ scene: "fallback" })`. Dispose geometries, materials, textures on unmount.
  Hero GPU ≤ 2ms/frame on integrated GPUs; adaptive ladder at 90-frame median 20ms / 24ms.
- JS budget (planned: initial ≤ 180KB gz). Measured on the final export: `/` first load 280.9 KB gz
  (react-dom and Next runtime dominate), `/work/[slug]` 260.0 KB gz; the raw-WebGL2 scope chunk is
  8.5 KB gz and lazy. See `docs/DEPLOY.md` for the table. The bench is not split out yet.
- Targets: LCP < 1.8s on 4G (the name is painted through the mask from frame 0), CLS < 0.02,
  INP < 150ms.
- `will-change` only on elements that are animating right now; remove it after.

## 8. Route curtain budget (foundation, `TransitionProvider`)

Input is blocked only while the curtain falls (OUT); OUT + IN is at most 0.9s of animation.

| Route | OUT (input blocked) | IN (input live) |
|---|---|---|
| home -> datasheet | panel expands 260ms (`wipe`); bone sheet + beam wipe 240ms starting halfway through: ~370ms | curtain dropped at once; the datasheet's own arrival (sampled title, sections rise) |
| datasheet -> home | graphite wipe right -> left behind the beam, 270ms (`expo.out`, `DUR.curtainReturn`, ~60% of the 450ms lift) | graphite keeps travelling left and uncovers home, 450ms (`expo.out`), pointer events released first |
| reduced motion | destination material fades in, 150ms | fades out, 150ms |

Skip: a second click on any transition link or `Esc` fast-forwards OUT (the route changes at
once); `Esc` also completes IN. Back/forward while OUT is running aborts the curtain (the browser
already moved). Measured on the /Portfolio static export in headless Edge (software GL):
home -> datasheet about 0.5s from click to a live datasheet; datasheet -> home input live after
about 0.45s, curtain gone at about 1.0s (the extra time is home's first render, not animation).
