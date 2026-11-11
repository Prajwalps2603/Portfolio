# Sketch → Ship · motion system

Motion has one job: show ideas becoming software. Strokes draw like a pen, sketches compile into
crisp UI (and on the port, the loaded ship gets its SHIPPED stamp). Everything else stays still or fades in once. Read with `docs/DESIGN.md`
and the direction (`design/directions/sketch-to-ship/DIRECTION.md` §5).

## 1. Principles

1. **One authored moment per section** (table in §4). Never the same fade-up everywhere.
2. **Arrivals are expo-out** (`EASE.arrive`), from an already-visible default.
3. **Exits are faster** than entrances (`EASE.exit`, `DUR.exit`).
4. **No bounce** except the stamp (`EASE.snap`): the SHIPPED stamp lands on the port's ship only
   (his ask, 2026-11-10), and the idea ticket's twin says "Drafted".
5. **Hidden states are set from JS only** (`gsap.set` / `gsap.from` inside `useGSAP`), so without
   JS everything is visible. The only CSS-hidden state is `html.booting [data-boot]`, set by the
   inline script and always removed by a 4.2s failsafe.
6. **Reduced motion or Motion: off** → no opening, no cycling, no lens, no tilt, no scrub, no
   Lenis, the finished iceberg, a static background. Colour and opacity feedback stay. Check with
   `useReducedMotion()` (React) / `prefersReducedMotion()` (effects); CSS: `reduced:` variant.
7. **Every hover reveal has a tap and keyboard twin.**

## 2. Vocabulary (`@/lib/motion/eases`)

| Name | GSAP | CSS (utility / var) | Curve | Use |
|---|---|---|---|---|
| arrive | `EASE.arrive` (`expo.out`) | `ease-arrive` / `--ease-arrive` | cubic-bezier(.16,1,.3,1) | entrances, reveals, settles, cursor follow |
| pen | `EASE.pen` (`gsap.registerEase` with `cubicBezier(.65,0,.35,1)`) | `ease-pen` / `--ease-pen` | cubic-bezier(.65,0,.35,1) | strokes drawing, highlighter swipes, pill fills, the page sheet |
| snap | `EASE.snap` (`back.out(1.4)`) | `ease-snap` / `--ease-snap` | 7% overshoot | ONLY the SHIPPED stamp (and its relabelled twins) |
| exit | `EASE.exit` (`power2.in`) | `ease-exit` / `--ease-exit` | cubic-bezier(.32,0,.67,0) | leaving |
| none | `EASE.none` | `ease-linear` | linear | scrubbed motion (the scroll is the easing) |

Durations (`DUR`, seconds; CSS `--dur-*` in ms):

| Key | s | Kind |
|---|---|---|
| `tap` | 0.12 | press feedback (`--dur-tap`) |
| `feedback` | 0.16 | hover / focus colour (`--dur-feedback`) |
| `ui` | 0.26 | UI state: menus, panels, rows, cursor (`--dur-ui`) |
| `exit` | 0.20 | leaving (`--dur-exit`) |
| `swipe` | 0.60 | highlighter swipe (`--dur-swipe`) |
| `draw` | 0.90 | a sketch drawing itself (max) |
| `compile` | 0.60 | strokes tightening into UI (max) |
| `stamp` | 0.42 | the stamp landing |
| `fade` | 0.50 | the quiet single fade-in |
| `sheetIn` / `sheetOut` | 0.46 / 0.56 | the page sheet |

Staggers (`STAGGER`): `chars` 0.028 (the name typing), `items` 0.05, `strokes` 0.07, `lines` 0.08.

## 3. Tooling

- **GSAP** only from `@/lib/motion/gsap` (`gsap`, `ScrollTrigger`, `SplitText`, `CustomEase`,
  `useGSAP`). In React always `useGSAP(() => {…}, { scope: ref, dependencies, revertOnUpdate })`:
  it reverts tweens and ScrollTriggers on unmount and is StrictMode-safe. Default ease is
  expo.out, default duration 0.6. Only ScrollTrigger (and useGSAP) is registered there:
  `SplitText` and `CustomEase` are re-exported unregistered, so they cost nothing until a module
  uses one, and that module registers it where it uses it (`gsap.registerPlugin(SplitText)`,
  idempotent; `splitArrive()` does). Registering a plugin in `gsap.ts` puts it on every page's
  first load (SplitText + CustomEase were 6.4 KB compressed there). The named "pen" ease is
  `cubicBezier()` from `./eases`, not a CustomEase, so GSAP, CSS and WAAPI draw the same curve.
- **ScrollTrigger**: `once: true` for arrivals; `start: () => safeStart(el, "top 80%")` so
  elements near the page bottom still trigger; `invalidateOnRefresh: true` when values depend
  on layout. `SmoothScroll` refreshes ScrollTrigger after fonts load and on document height
  changes; without Lenis (touch, reduced motion) that refresh waits for the scroll to settle
  (150 ms quiet, at most 1.5 s), because a refresh cancels a native smooth scroll still in flight.
  Call `ScrollTrigger.refresh()` yourself after you change layout imperatively.
- **Lenis** runs inside `<SmoothScroll>` (wheel only, off with reduced motion) on GSAP's ticker,
  and only where there is a wheel: fine pointers. It is its own chunk, fetched after hydration;
  touch screens never load it, scroll natively, and `scrollTo()` uses the browser's smooth scroll
  there (instant with reduced motion or `immediate`). The ticker's lag smoothing is off on every
  device with motion (one real-time clock for timelines, ScrollTrigger and the boot failsafe).
  Never create another Lenis. Scroll programmatically with `useSmoothScroll().scrollTo(target)`;
  lock for overlays with `lock(true)` / `lock(false)` (ref-counted). Scrollable overlays need
  `data-lenis-prevent`. Per-frame scroll: `onScroll(fn)` from `@/lib/stores/stage`.
- **Motion** (`motion/react`) only for React state swaps (copy → "Copied", panel content,
  AnimatePresence). Its durations/eases come from `CSS_EASE` / `DUR`. Always wrap a swap in
  `<MotionLite>` (`@/lib/motion/lazyMotion`) and use the `m` components
  (`import * as m from "motion/react-m"`): the animation features load in a separate chunk on
  first use (about 17 KB gzip kept off the first load). `MotionLite` is `strict`: a full
  `motion.*` component inside it throws.
- **CSS transitions** for hover / focus (`transition-colors duration-(--dur-feedback)
  ease-arrive`, `hocus:` variant).
- Pointer: `trackPointer()` / `subscribePointer(fn)` from `@/lib/motion/pointer` (one shared
  listener); `gsap.quickTo` for followers. `useMagnetic(ref)` (or `<Pill magnetic>`) on 1–2 CTAs.

## 4. One authored moment per section

| Section | Moment | Owner | Technique | Reduced motion |
|---|---|---|---|---|
| Opening + 01 Hero | **sketch → ship** (opening ≤ 2.6s; the stage window cycles projects, each drawing then compiling) | hero, miniui | §5 + §6 | no opening, static ship, no cycle, no lens |
| 02 What I build | **row flood**: the row floods with its accent (lime / blue-soft / tangerine-soft rotating), a handwritten "proof:" note slides in. Second beat, **the live stack map** (`StackMap.tsx` + lazy `engine.ts`): arrival = the sketch draws (0.9s), compiles (≤ 0.6s), one lime request walks Interface → Deploy; then a few slow idle packets; a row or a node lights its path (highlighter bands under the wires, others dim to 35%) | build | `clip-path` / `scaleX` fill (pen, `DUR.ui`–`swipe`), note `x` + opacity (arrive); map packets on LUT-sampled paths in a GSAP ticker | colour change only, note just appears; static finished map, no packets, lighting by colour / opacity |
| 03 Work | **stage re-compile**: the stage wipes and the mini-UI re-compiles for the active project. The "Interface \| Architecture" switch turns the window over (the transition between sides) to the **living architecture diagram** (`@/components/diagram`, lazy): it draws, compiles, then a packet walks the project's real `flow` (lime request, blue data, tangerine response), narrated under the window, with a pause control | work, miniui, diagram | `clip-path` wipe (pen, ~0.5s) + `MiniUI state` sketch → ship; diagram packets in a GSAP ticker (transform / opacity) | instant swap; the finished diagram, static, no packets, the numbered flow as text |
| 03 Work: Also shipped | **the crane works the ship on its own** (a clock, no scrolling needed): for each container in turn (2.4s) the trolley runs out over the yard, the spreader drops and locks, hoists, carries it along the boom and sets it in its slot on the ship, bottom tier first; with all nine aboard the SHIPPED stamp lands on the hull and the funnel puffs; the ship rests full (3.4s), the crane unloads it the same way, rests empty (1.6s) and starts again (~48s a round). The sea rolls all the while. A loop longer than 5s, so it has a **visible pause control** (round, over the drawing's top right corner) and runs through the play gate (only on screen, only in a visible tab; it resumes where it stopped). Choosing a container (tab, arrow keys or a click in the drawing): the opened container's doors swing shut (0.3s), the crates and the bill of lading go, the paint and the papers switch, the doors swing open (0.75s), the crates settle in (staggered) and the bill lands on its clipboard; the first time the panel arrives, its doors open the same way | work | `stateAt(layout, p)` (pure: smoothstep phases per ninth of p) with p from the clock, attributes written per frame; the doors are `doorShapes(side, theta)` projected in one-point perspective (0..115 degrees) and written straight to the DOM from a GSAP proxy; `stampIn` (snap) | the loaded ship, stamped, still; doors open, the papers switch at once |
| 04 Stack | **the dive**: as each layer row reaches the bottom fifth of the screen, its slice of the iceberg draws in pencil, the ink twin traces over it, the pencil settles to half-strength construction lines, the slice fills and that layer's tools surface; the waterline draws with the tip, the seabed line and the five languages land last. Once per layer; rows already passed show finished. Scroll-driven companions (no clock): the waves roll with the scroll position; the diver giant-strides off the tip's ledge as the waterline passes mid-screen, drops in feet first, pitches head down and follows the scroll down the ice (eased ~0.12s, torch on, kicking, bubbles), swims up head first when you scroll up, and stands upright on the seabed at the bottom; the submarine cruises the Data / AI gap and switches its lights on (one flicker) | stack | `stroke-dashoffset` on `pathLength=1` paths (pen, `DUR.draw` then `DUR.compile`), fills `opacity` (arrive), tools `opacity` + `y` (`STAGGER.items`); one ScrollTrigger per row, `once` | the finished drawing at once, tools visible; sketch mode: the pencil drawing |
| 05 Experience | **branch line draws** as you scroll (scrubbed stroke-dashoffset); commits pop on (scale .6 → 1, arrive). Each card's panel plays once as it reaches 80% of the screen (all under 5s, no loop, so no pause control): a role's **figure** draws in pencil, inks and fills (~1s), then its story runs (cloud: status lights, a request, data to RDS / S3 and back, a bug knocked back at the shield, a scan sweep ticking each part; ml: the five steps tick down the log while the chart lands the data, strikes the outliers, fits a line, shows its errors and tunes the curve; java: branch, commits, review, merge, then a request down the stack and back; ops: a new sheet row, Apps Script fires, packets feed the app, it fills on both screens, live); the **medal** is let go from the side and swings to rest on its ribbon (a damped pendulum, equal half-swings, amplitude halving), then a glint crosses the disc and shine strokes draw; the **college** draws, its four years run 2021 → 2025 and the cap is tossed up from the 2025 mark, spinning, its dotted flight path landing behind it. Click: replay / swing / toss again | changelog | branch: ScrollTrigger `scrub` + `EASE.none`; panels: one ScrollTrigger each (`once`), `stroke-dashoffset` on `pathLength=1` paths (pen), fills `opacity` (arrive), packets along polylines (`along()`), node pulses on `stroke-width`, pendulum `rotation` about the ribbon's top (`svgOrigin`, `smoothOrigin: false`) | line fully drawn, no scrub; every panel finished and still (medal hanging, cap in the air), no replay |
| 06 About | two moments, each once, each under 5s, none needing a scroll: **the README renders** (it shows its markdown source, then a pencil line sweeps down and the rendered README appears above it, ~1.6s); **the bus drives the road** (from Koppa, ticket 1 punched, down the Ghats to Sullia, ticket 2, across to Bengaluru, ticket 3, the pin rings once; the road inks in tangerine behind it; ~4.3s; a click drives it again). And **the vault, which waits for the visitor**: locked by default (door shut, bolts out, every deposit box shut); a click, a tap or Enter on the door spins the dial left, right, left (1.15s), turns the wheel two spokes on, pulls the eight bolts back, swings the door open on its hinge (1.1s) and lights the strongroom; then the boxes on screen open one after another (0.32s apart: little door, lamp, the object settling), the rest as each comes on screen. A mouse or pen can turn the wheel by hand (past 200 degrees it gives; sooner, it springs back). A click on the open door shuts the boxes (last first), the door and the bolts. When the door first comes on screen the wheel gives a small turn and back (the hint) | about | README: `clip-path` inset from a GSAP proxy (pen); bus: `getPointAtLength` on the road's legs, `stroke-dashoffset` trails, punches `scale`; vault: dial and wheel `rotation` (svgOrigin), bolts `x`, door and boxes' little doors `rotationY` under `perspective` (pen), lamp `opacity`, objects `y`/`scale` (arrive) | the rendered README; the bus parked, the road inked, tickets punched; the vault open, every box open, no button |
| Repos (/repos) | none: an editor window; only UI state changes (a folder's chevron turns, ~150ms). No scene, no loop (his ask after the 3D library: "no animation like the garden and the library"). **A run** (play button, `npm run dev`): the terminal's lines arrive one every ~220ms (~1.5s), then the browser tab opens; opening a file far down scrolls the page to the tabs (the site's smooth scroll) | repos | timeouts (cleared on unmount, on Ctrl+C and on a new run) | the run's lines at once; the scroll is instant |
| 07 Contact | **hand-underline + copy swap**: a sketch underline draws under the email on hover / focus; Copy → "Copied ✓" (tangerine) | contact | `SketchUnderline draw="manual" play={hover}` or `drawOn`; Motion `AnimatePresence` | underline shown statically on hover/focus; swap is a fade |
| Case study | sketch → ship once (hero MiniUI); "How it works" = **the request journey**: a lime packet travels the project's flow scrubbed by scroll (board pinned by CSS sticky ≥ 900px, a vertical rail below), each stop compiles on arrival (`tight()` morph), its card and lane light in sync, and a tangerine response returns | casestudy | ScrollTrigger `onUpdate` + `gsap.quickTo` smoothing; packets follow LUT-sampled paths | the finished board + step list, static |
| Page change | the page sheet | foundation | §7 | none (instant) |
| Sketch mode (site-wide) | **the x-ray lens grown to the whole screen**: ship → sketch, the sketch is revealed inside a hand-circled lens that grows out of the pencil toggle; sketch → ship, it collapses back into the pencil; mini-UIs draw / compile live inside the lens | sketchmode | §11 | instant swap |

**Highlighter swipes** on headings are shared, not a section's moment: `<Highlight>` swipes once
when the heading's top reaches 70% of the viewport (`scaleX`-like reveal of the band, pen, 0.6s).
**Quiet fade**: supporting content may fade in once with `useScrollReveal(ref)` (opacity only,
expo out, 0.5s, staggered). Use it sparingly; most content should simply be there.

## 5. The opening (owner: hero; runtime: foundation)

Runtime (`@/lib/motion/boot`, `bootScript`, `useIntroMode`):
- The inline `<head>` script decides `window.__pmpBoot`: **"full"** (first home load of the tab
  session), **"short"** (repeat home loads: the same timeline at `INTRO_TIMESCALE.short` = 2.4),
  **"none"** (reduced motion, any other page, a `#hash` deep link, a hard return from a case study).
- For full/short it adds `html.booting`: **every `[data-boot]` element is hidden** (opacity 0) until
  the Intro reveals it. The header carries `data-boot`; mark the hero parts you reveal with
  `data-boot` too. A 4.2s failsafe removes `booting` anyway; `startBoot()` re-arms it from the
  moment the opening really starts, so slow hydration never reveals the hero mid-opening.
- In the Intro: `const mode = useIntroMode()` ("pending" first render → then the real mode). On
  "full"/"short": `startBoot()`, build ONE GSAP timeline, set `tl.timeScale(INTRO_TIMESCALE[mode])`,
  and call `finishBoot()` in `onComplete`. Skippable by ANY input (`pointerdown`, `keydown`,
  `wheel`, `touchstart`): `tl.progress(1)` then `finishBoot()`. On "none": `finishBoot()` at once.
- Everything else waits for `useStage((s) => s.intro) === "done"` (e.g. the hero cycle starts
  after the opening).

The choreography (DIRECTION §5, ≤ 2.6s at full speed):

| t (s) | What |
|---|---|
| 0.00 – 0.90 | Sketch layer draws (`drawOn`, pen): rough boxes where the header, the name, the sticky note and the window will be; a `scribble` where the name will be |
| 0.90 – 1.50 | Compile: strokes tighten into the real elements (sketch layer fades / scales to the real boxes, real elements fade in from `data-boot`), the name types in glyph by glyph (a stepped clip-path on the real, unsplit text, so kerning stays intact and nothing has to be reverted; splitting into chars measured 6px wider at 1440), the highlighter swipes run (`swipeHighlights`) |
| 1.50 – 2.00 | Window content compiles (MiniUI sketch → ship) |
| ~2.00 | (no stamp since 2026-11-10: the hero's window just stays shipped) |
| ≤ 2.60 | `finishBoot()` |

Measure the real elements (`getBoundingClientRect`) to place the sketch boxes; draw them with the
generator into one absolutely positioned `<svg>` over the hero.

## 6. Sketch → ship compile (owner: miniui; reused by the hero, work, case studies)

One element list, two renders (DESIGN.md §7). The compile, per element, within `DUR.compile`:
1. **Strokes tighten:** sketch strokes fade (opacity 1 → 0, `DUR.ui`) while the crisp borders /
   fills fade and settle in (opacity 0 → 1, a slight `scale` 0.98 → 1, arrive), staggered in
   reading order (`STAGGER.items`).
2. **Labels swap:** Caveat labels → real text (crossfade, `DUR.feedback`–`DUR.ui`).
3. **Panels fill:** backgrounds `card` / `paper` / accent fills come in (opacity, arrive).
4. **Stamp** (only if `stamp`, off by default since 2026-11-10 and unused): `stampIn(stampEl, {
   impact: windowEl })` (snap, 0.42s); then `onShipped()`.
Draw-in of the sketch (before a compile): `drawOn(sketchLayer, { duration: DUR.draw })`.
Reduced motion: render the ship state directly (stamp visible if `stamp`), call `onShipped`.

## 7. Page sheet (foundation)

OUT (input blocked only here): a paper sheet slides in from the left (`DUR.sheetIn` 0.46s, pen),
hand-cut pencil edges leading and trailing, the destination written in Caveat with a tangerine
swash drawing under it. The route changes under it, the scroll lands (top, or the `#hash` on home),
focus moves to `#main` (or the hash target). IN: the sheet keeps travelling right and uncovers the
page (`DUR.sheetOut` 0.56s, arrive) with input already live. Esc or a second click fast-forwards;
back/forward aborts; a stalled route hard-navigates after 4s. Reduced motion: no sheet.
Destination pages: `usePageArrival()` → start their own arrival when `ready`.

## 8. Loops, the lens, the background

- **Loops** (the hero cycle every ~6s, idle breathing): pause on hover, focus and when offscreen
  (`useInView`) or `document.hidden`; never with reduced motion. Anything that moves or
  auto-advances for more than 5s needs a **visible pause control** (`Pause` / `Play` icons,
  `IconButton aria-pressed`) besides the site-wide `<MotionToggle>` (WCAG 2.2.2).
- **The hero lens** (hover the window → the sketch under a ~140px circular `clip-path` that
  follows the pointer): fine pointers + full motion only; `gsap.quickTo` on the clip centre; no
  lens on touch.
- **Tilt** (work stage ±6°): fine pointers + full motion only; settle back with arrive.
- **Background lens** (foundation): dots within ~120px of the pointer grow and darken (alpha
  ≤ 0.3); breathes slowly at rest; sleeps after 20s idle or over ink / paper-2.
- **Live dot**: pulses 3× after load, then rests (`animate-live`).

## 9. Performance rules

Animate `transform`, `opacity`, `clip-path`, `stroke-dashoffset`, CSS variables on small
elements. No layout properties in loops. `will-change` only while animating. One rAF per
canvas, stopped when idle / offscreen / hidden. `gsap.quickTo` / `quickSetter` for pointer
followers. Kill your ScrollTriggers (useGSAP does). Never animate `filter: blur` on large areas.
Never hide a focus target with `autoAlpha` / `visibility` while it may receive focus: staggered
arrivals of links (the mobile menu) animate `opacity`, so focus can land on the first link at once.
Heavy motion code loads later than first load (DESIGN.md §13.3): the cursor (fine pointer + full
motion), Lenis (fine pointers), the sketch wipe (first switch), the diagram and map engines, the
stack's iceberg drawing (near the section), the changelog's role figures (near each card), the port
drawing in "Also shipped" (near the card).

## 10. Reduced-motion matrix

| Thing | Full | Reduced / Motion off |
|---|---|---|
| Opening | ≤ 2.6s sketch → ship | none (`bootMode` "none") |
| Hero cycle, lens | on | static ship state, no lens |
| Highlighter swipes | swipe once | static block (pinned in CSS: `html.rm .hl { --hl-p: 1 !important }`, so a script setting 0 during hydration cannot hide it) |
| Draw-on, compile, stamp | animated | final state |
| Work tilt, stage wipe | on | off, instant swap |
| Stack (the iceberg) | the dive: pencil, ink, fill, tools surface, once per layer | the finished drawing at once |
| Changelog line | scrubbed | fully drawn |
| Career panels (role figures, medal, college) | play once on arrival; click replays | finished and still, no replay |
| About (README, road, vault) | source renders; the bus drives; the vault waits, locked, for a click | rendered; parked, inked, punched; open, every box open, no button |
| The repos editor (/repos) | a chevron's turn; a run's terminal lines arrive one by one (~1.5s) | a run prints at once |
| Pills / icon buttons | fill sweep | fill fades |
| Smooth scroll (Lenis) | on (fine pointers; touch screens scroll natively) | native |
| Page sheet | on | none |
| Cursor, background lens | on (fine pointer) | native cursor, static dots |
| Sketch-mode wipe | lens grows / collapses (View Transition) | instant swap |
| Sketch-mode extras | notes write in, boxes boil under the pencil, the toggle's one-time scribble | static notes and boxes, no scribble |
| Architecture diagram (work stage) | draws, compiles, packets walk the flow (loop) | finished diagram, packet hidden, the numbered flow as text |
| The port (Also shipped) | the crane loads and unloads the ship on a clock (pause control), stamp while full, doors swing, cargo settles | the loaded ship, stamped, still; doors open, instant switch |
| Command palette | panel scales in, terminal lines type out | panel fades only, every line printed at once |
| Idea ticket | note → ticket compile | the finished ticket at once |
| Pull request (/pull-request) | none beyond the ▾ turning (150ms) | the same |
| The Prajwal Times (/resume) | none; a torn tab drops away (0.3s) | the tab just goes |
| The ship floats (Also shipped port) | rides the waves all the while; each container set down: a dip of about 0.11 container heights and a tip toward the box, a damped bob that settles in about 2s, ripples from the hull; a lift: it rises; loaded it rests lower (spring model in the crane's frame loop) | the ship does not move |
| Sketchbook (sketch mode) | none: strokes appear as drawn; the toolbar does not move | the same |
| Theme switch (light / dark) | a 260ms crossfade of the whole page (view transition) | at once (also in lite mode) |
| Lite mode (html.lite, weak GPUs) | every animation stays; native scrolling instead of Lenis, the native cursor instead of the custom one, no paper-grid lens | (reduced motion already has all three off) |
| Visiting card (contact, popup) | Flip turns it on its long edge (0.65s, ease arrive); the popup fades and rises 16px (0.3s) over a fading scrim (0.2s); the tilt never moves (no hover motion, at his ask) | the sides swap at once; the popup appears at once |
| Hero note | lift, tilt and spring | follows the pointer 1:1, stays where dropped, no lift / tilt / spring |

Loops are gated twice: `playGate` (`@/components/diagram/playGate`) only answers "on screen and
the tab visible" (one-off moments still need it in reduced motion to show their final state), and
every loop ANDs `useReducedMotion()` (the OS setting or the footer's Motion toggle). Verified in
round 2 (2026-11-06, desktop + 390px) with the OS setting, with `pmp:motion = reduced`, and by
flipping the footer toggle while the diagram's packet was mid-journey: it stopped at once, hidden,
the diagram stayed finished and every highlight band went full. The vault (About) stands open
in reduced motion, every box open and no button; the stack's iceberg is shown finished.

## 11. Sketch-mode wipe (owner: sketchmode; `src/lib/motion/sketchWipe.ts`)

`setSketchMode(on, origin)` measures what is being read (the block at 38% of the viewport), then
`document.startViewTransition`: the update callback sets `html[data-sketch]`, flushes React
synchronously (`flushSync`, so every sketch/ship pair has switched before the new state is
captured), restores the reading position (Caveat reflows every heading) and mounts the rim.
- **In** (ship → sketch): `::view-transition-new(root)` gets `clip-path: circle(0 → R at origin)`,
  0.78s, pen. The rim (a `roughCircle`, one pass, non-scaling 2.2px stroke, in its own
  `view-transition-name: sk-rim` group so it sits above both snapshots) scales with the clip just
  inside its edge and lifts off over the last 14%.
- **Out** (sketch → ship): `::view-transition-old(root)` on top, `circle(R → 0)`, 0.62s, pen
  (exits are faster). (Until 2026-11-10 the header toggle then landed a SHIPPED stamp; gone.)
- The new snapshot is live: mini-UIs draw themselves (in) or compile (out)
  inside the moving lens. A second toggle mid-wipe skips the first. Reduced motion, a hidden tab
  or no View Transitions: an instant swap with the same anchoring.
- The wipe is not on the first load: `sketchMode.ts` (the always-loaded store) imports
  `sketchWipe.ts` on the first switch, and the header toggle warms that chunk on hover, focus and
  press (`warmSketchWipe()`), so it is there before the click. A request made while the chunk is
  still loading lands on the latest state; if the chunk cannot load (offline) the switch is
  instant.
- Sketch-only CSS motion: margin notes write in (clip-path, pen, 0.32s delay) and their arrows
  draw (stroke-dashoffset); a hovered pencil box "boils" (three hand-drawn outlines, 8 per second,
  only while hovered); the toggle scribbles once per session after the opening. All off with
  `html.rm`.

## 12. The diagram grammar in motion (owner: diagram; `src/components/diagram/*`)

One engine, two paces (see DESIGN.md 8.1 for what the parts mean: lime request, blue data,
tangerine response).
- **First view of a spec in the session, ~3s:** the sketch draws (pen, 0.9s, once on screen) ->
  compiles (strokes tighten onto the cards, Caveat becomes Inter + mono, cards fill, 0.6s) -> the
  first request runs the whole route at speed (~1-1.4s: the route inks in, every step badge pops,
  the highlighter bands swipe) -> the response is journey 1 (no stamp since 2026-11-10).
- **A spec already drawn this session:** never redraws. "Ship" is a 0.7s cross-wipe (a pencil line
  sweeps the layers, cards settle as it passes), then the route inks in (~0.8s). A click, tap or Enter during the reveal skips to shipped (0.42s wipe).
- **The loop (reading pace):** packets only; compiled once per view and never recompiled. A step
  holds at least 1.7s so the narration line can be read, each card the packet reaches gets one ink
  pulse (border + a ring breathing out once + its badge ticks), the last step holds 1.8s, a 0.6s
  rest, then the next request sets off. Everything is transform / opacity / stroke-dashoffset in a
  GSAP ticker, with packets on sampled paths.
- **Pauses:** offscreen, hidden tab (`playGate`), pointer over the diagram, a hovered / focused /
  pinned part, and the visible pause control (`paused`). Hover / focus / tap on a part inks its
  edges, dims the rest to 35% and writes a handwritten note placed where it buries no other part.
- **Case-study journey** is the same grammar driven by scroll instead of a clock (section 4,
  "Case study": ScrollTrigger `onUpdate` plus `gsap.quickTo` smoothing). **Stack map:** a lazy
  engine, a GSAP ticker, a lime request across the layers, a few slow idle packets.
- **Vault** (`about/Vault.tsx`): no loop and nothing on scroll but the hint (the wheel's small turn
  and back, once, ~1.3s); every run is started by the visitor (a click, a tap, Enter, or the wheel
  turned by hand with a mouse or pen, followed with `gsap.set` on pointer moves). Opening ~4.2s,
  locking ~2.4s; clicks during either are ignored. Its state outlives a refresh (localStorage
  "pmp:vault"); the boot script sets html[data-vault] and globals.css draws the right state from
  the first paint, until the component removes [data-vault-boot].
- **Road trip** (`about/RoadTrip.tsx`, kept but not mounted: the first design, the map, is back): a
  one-way trip of ~12.5s, so if it is mounted again it keeps its pause control and `usePlayGate`.
- **Repo library** (`repos/Library3D.tsx`, now unmounted; /repos is the code editor, which has no loop): the
  dust is a loop, so if it is mounted again it keeps the pause control and `usePlayGate`; the loop renders only
  while something moves and otherwise on demand.
- **Palette:** panel scales 0.98 -> 1 + fade in (~160ms), 110ms out; terminal lines type out.
  **Idea ticket:** the note compiles into a ticket (strokes tighten, card fills left to right, rows
  arrive, the "Drafted" stamp lands).
