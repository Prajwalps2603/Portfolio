# Signal Chain: design system

The contract for every section builder. Read it with `docs/MOTION.md`,
`design/directions/signal-chain/DIRECTION.json` (the spec) and the approved sketch
(`design/directions/signal-chain/index.html`). Follow this file literally; where it is silent,
the spec decides; where the spec and the craft floor disagree, the craft floor wins.

The foundation owns `src/app/{layout,page,globals.css,not-found}.tsx`, `src/lib/**`,
`src/components/{chrome,cursor,transition,icons,ui}/**`, `src/fonts/**`, `docs/**`. If you need a
token, primitive or shell change, do not edit those files: ask (openIssues) with the exact change.

---

## 1. The world in one paragraph

The site is an oscilloscope locking onto a full stack developer. Two materials:
**screens** (graphite, live signals: hero, statement, bench, stack, contact) and **sheets**
(bone, records: History and the `/work/[slug]/` datasheets). Four channel colours encode the
same four layers everywhere; **bone is Σ and "you"** (focus ring, CTA fill, probe, trigger).
Headings, nav and body are plain language ("Selected systems", "Stack", "Experience"); the
instrument dialect lives only in short mono labels.

---

## 2. Colour

Every colour is a Tailwind token (`bg-*`, `text-*`, `border-*`, `fill-*`, `stroke-*`). The
default Tailwind palette is switched off (`--color-*: initial`), so `text-gray-400` will not
compile. Canvas/WebGL/SVG attributes that cannot take CSS variables use `PALETTE` /
`CHANNELS[n].hex` from `src/lib/channels.ts` (keep both in sync).

### On screens (graphite `#0E0F0D`)

| Token | Hex | Role | Contrast on graphite |
|---|---|---|---|
| `graphite` | #0E0F0D | page background, WebGL clear colour | - |
| `bezel` | #171815 | raised panels, bench surround, pressed state | - |
| `graticule` | #2B2D28 | rules, grid lines, hairline borders (decorative) | 1.4:1 |
| `graticule-strong` | #3A3C36 | stronger rules, idle outlines (decorative) | 1.7:1 |
| `bone` | #ECE8DF | primary text, Σ, focus ring, CTA fill, "you" | 15.7:1 |
| `muted` | #A29E93 | secondary text (ledes, captions, table cells) | 7.2:1 (6.7 on bezel) |
| `dim` | #85827A | mono labels, off LEDs. **Never paragraphs.** | 5.0:1 (4.6 on bezel) |
| `ch1` | #F2B53D | CH1 Interface | 10.5:1 |
| `ch2` | #4EC1BC | CH2 Services | 8.9:1 |
| `ch3` | #93CF63 | CH3 Data; copy success | 10.4:1 |
| `ch4` | #7FA8F5 | CH4 Intelligence | 8.1:1 |

### On sheets (bone `#ECE8DF`)

| Token | Hex | Role | Contrast on bone |
|---|---|---|---|
| `ink` | #141512 | primary text, focus ring, solid button | 15.0:1 |
| `ink-muted` | #57544C | secondary text and labels | 6.2:1 (5.7 on bone-shade) |
| `rule` | #CFCABE | table rules (decorative) | - |
| `tick` | #8D887C | ruler minor ticks (decorative) | - |
| `bone-shade` | #E4DFD4 | highlighted row (CURRENT revision) | ink 13.8:1 |
| `ch1-ink` | #8A5F00 | CH1 label on bone (**not** on bone-shade: 4.25:1) | 4.62:1 |
| `ch2-ink` | #0F6E6A | CH2 label | 4.97:1 |
| `ch3-ink` | #386F17 | CH3 label | 4.97:1 |
| `ch4-ink` | #2F5DB8 | CH4 label | 5.08:1 |

### Colour rules

1. Channel colours are **hairlines, outlines, traces, small marks and short labels**, never
   large fills, never backgrounds of text blocks, never glows (the only glow is the beam).
2. Colour is never the only cue: every channel colour sits next to its text label
   (`<ChannelMark ch={2} /> Services`).
3. Map content layers to channels with `channelForLayer(layer)` from `src/lib/channels.ts`
   (`Interface`→CH1, `API`→CH2 Services, `Data`→CH3, `Intelligence`→CH4, `Infrastructure`→Σ).
4. No orange, no gradients on text, no glass/blur, no coloured side-stripe borders, no cards.
5. Secondary text on a surface is that surface's muted token (`muted` on graphite,
   `ink-muted` on bone). Never a flat grey, never `opacity-50` on text.

---

## 3. Type

Fonts (`src/fonts/index.ts`, next/font/google, self-hosted, `display: swap`, size-adjusted
fallbacks): **Archivo** variable (wdth 62-125, wght 100-900) and **Martian Mono** variable
(wdth 75-112.5). Width is chosen with `font-stretch`; the role utilities do it for you.
Families: `font-display` (Archivo), `font-mono` (Martian Mono). There is no other face.

### Role utilities (use these; each sets family, size, weight, width, leading, tracking)

| Utility | Use | Size | Weight / width | Leading / tracking |
|---|---|---|---|---|
| `type-name` | PRAJWAL M P only (hero h1 line 1) | clamp(54px,10.2vw,170px); <=860px clamp(44px,14.4vw,120px) | 800 / 125%, uppercase | 0.86 / -0.035em |
| `type-display` | H2 of every section, datasheet h1 | clamp(36px→86px) | 700 / 112% | 0.95 / -0.03em |
| `type-statement` | the 01 Signal paragraph | clamp(28px→64px) | 600 / 100% | 1.1 / -0.022em |
| `type-role` | "Full Stack Developer" (hero h1 line 2) | clamp(24px→48px) | 500 / 100% | 1.05 / -0.014em |
| `type-title` | H3 (bench entries, datasheet sections) | clamp(26px→40px) | 700 / 108% | 1.02 / -0.022em |
| `type-email` | the contact address | clamp(25px→98px) | 700 / 112% | 1 / -0.03em |
| `type-lead` | ledes, one-liners, table primary cells | 17→19px | 500 | 1.4 |
| `type-body` | paragraphs | 16→17px | 400 | 1.55 |
| `type-small` | secondary lines in tables, captions (not paragraphs) | 15px | 400 | 1.5 |
| `type-label` | mono UPPERCASE labels, max a few words | **11px** | 500 / 87.5% | +0.07em |
| `type-readout` | mono natural-case data: endpoints, refdes, values | 12px | 500 / 87.5% | +0.02em |
| `type-button` | mono button text (`.btn` already includes it) | 12px | 600 / 87.5% | +0.08em |
| `num` | a number inside running text (0.86em mono, tabular) | inherit | inherit | 0 |
| `measure` | `max-width: 62ch` for body copy | | | |

### Type rules

- **11px is the floor** for any functional text (labels, links, nav, meta rows, captions,
  timecodes). Non-interactive legal smallprint may go to 10px. Nothing smaller, anywhere.
- Wide tracking (> 0.05em) only on `type-label` / `type-button`: short uppercase strings. Never
  on sentences. If a label grows past ~5 words, it is a `type-readout` or `type-small` instead.
- **Mono is for data**: numbers, endpoints, protocol names, refdes, timestamps, channel labels.
  Every numeral on the site is mono (`num` inside prose; `type-readout` / `type-label` alone).
  Mono is never a costume for headings or paragraphs.
- Headings `text-wrap: balance` (base layer does it); paragraphs `pretty`.
- Body copy: `type-body measure` (or `type-lead` with `max-w-[44ch]`-ish for ledes).
- Never set `tracking-*` tighter than `-0.04em`. Never `font-size` in px in components: use a
  role utility, or the `text-label|readout|small|body|lead|title|…` size tokens.
- One `h1` per page (the hero owns it on `/`; the datasheet title on `/work/*`). Each home
  section has an `h2` (visually hidden if the design has none, as in 01 Signal).
- Banned: gradient text, outline text, letter scramble, typewriter, eyebrow/kicker labels above
  headings. The "Electronics & Communication → Full Stack" idea must be integrated into a
  composition (e.g. a status row or the lane legend), not stacked as an eyebrow over the name.

---

## 4. Layout

| Token / utility | Value | Use |
|---|---|---|
| `--margin`, `px-margin`, `mx-margin` | clamp(16px, 4vw, 64px) | page side margins (every section) |
| `--divisions`, `grid-divisions` | 10 columns (4 at <=860px) | the graticule column grid; align big type and column starts to it (`col-span-4` / `col-span-6` = the bench's 4/10 + 6/10) |
| `--bar`, `pt-bar`, `top-bar`, `scroll-mt-bar` | 56px (52px <=860px) | fixed top bar; sticky things sit at `top-bar` |
| `--section-y`, `--section-y-end`, `py-section` | clamp(96px,17vh,180px) / clamp(80px,14vh,150px) | section padding |
| `--measure`, `measure` | 62ch | body measure |

Spacing rhythm (8px base): **8 / 16 / 24 / 40 / 64 / 104** → Tailwind `2 / 4 / 6 / 10 / 16 / 26`.
Inside components use 4px steps (`gap-2.5` = 10px for button rows is the established exception).

Breakpoints (Tailwind variants; the defaults are replaced):

| Variant | Min width | Meaning |
|---|---|---|
| (none) | 0 | phone + tablet portrait (the `portrait:` variant = max-width 860px) |
| `sm:` | 600px | datasheet diagrams switch to landscape |
| `md:` | 861px | small laptop / tablet landscape |
| `lg:` | 1100px | desktop |
| `xl:` | 1440px | wide |

Radii: none. Everything is square (instrument panels). Hairlines are 1px.
Asymmetry: big type left-aligned to division lines, labels pinned to edges like bezel engraving.

### Z layers (never invent numbers)

`z-(--z-scene)` 0 · `z-(--z-content)` 1 · `z-(--z-raised)` 10 · `z-(--z-sticky)` 20 ·
`z-(--z-header)` 60 · `z-(--z-menu)` 70 · `z-(--z-curtain)` 90 · `z-(--z-cursor)` 100 ·
`z-(--z-skip)` 110.

---

## 5. Custom variants

| Variant | When it applies |
|---|---|
| `reduced:` | reduced motion is in effect (OS setting **or** the footer toggle). Prefer this over `motion-reduce:` |
| `signals-off:` | the footer "Signals: paused" toggle: stop every looping signal |
| `booting:` | while the opening plays (`html.booting`) |
| `probe-on:` | the probe cursor is mounted |
| `sheet:` | inside a `[data-surface="sheet"]` (bone) element |
| `fine:` / `coarse:` | hover-capable fine pointer / touch |
| `portrait:` | max-width 860px |

---

## 6. Browser surfaces (already themed in globals.css, do not override)

`::selection` bone on graphite / ink on sheets · `caret-color` bone / ink · `scrollbar-color`
graticule-strong on graphite (bone on a datasheet page: `html:has(#main > [data-surface="sheet"]:only-child)`,
the `:only-child` keeps home graphite even though #experience is a sheet) · `:focus-visible` 2px bone ring at
3px offset (ink inside sheets) · links: 1px underline, 0.22em offset · `tabular-nums` on
`time`, `data`, `td`, `th` · `accent-color` bone.

Do not remove outlines. Do not add `outline-none` to interactive elements. If a control has
its own focus treatment, it must be at least as visible as the ring.

---

## 7. Components and primitives

Import from `@/components/ui`, `@/components/icons`, `@/components/transition`,
`@/lib/motion/*`, `@/lib/*`.

### Classes (globals.css `@layer components`)

- `.btn` instrument button: mono 12px, min-height 44px, 1px bone/42% border, **inverts
  graphite ↔ bone on hover (220ms)**, `:active` and `:disabled` styled. `.btn btn-solid` = bone
  fill (the primary CTA; one per group). Inside sheets both swap to ink automatically.
- `.link-mono` short mono link with a hairline underline that turns bone on hover (ink on
  sheets). 44px tall on coarse pointers. Use for Repository / Live / Datasheet links.
- `.link-text` underlined link inside running prose.
- `.rule-t`, `.rule-b` 1px graticule (rule on sheets) hairlines.
- `.ruler` / `<Ruler />` the engraved top edge of every sheet (8px minor / 80px major ticks).
- `.graticule` procedural CSS grid (WebGL fallback, 404).
- `.beam-wipe` + `--rp` 0→1: single-line reveal with a 1.5px bone beam (see MOTION.md).
- `[data-sampling]` the sample-and-hold mask (driven by `sampleTimeline` / `<SampledText>`).

### React primitives

| Component | Purpose |
|---|---|
| `<Section id surface labelledBy instrument?>` | home section shell: id (anchor contract), `data-surface`, `aria-labelledby`, material colours. Padding is yours (`px-margin py-section`) |
| `<ExternalLink href hint? arrow?>` | every off-site link: `target="_blank" rel="noopener noreferrer"`, arrow-up-right icon, sr-only "(opens in a new tab)" |
| `<TransitionLink href kind? origin?>` | every internal route link between `/` and `/work/*` (plays the curtain) |
| `<ChannelMark ch={1..4 \| "sigma"} surface?>` | the filled channel square "1" / "Σ"; always next to a text label |
| `<Led state="on\|off\|blink" color?>` | status LED (RUN, TRIG'D, CURRENT). `blink` stops with reduced motion |
| `<Ruler />` | sheet top edge |
| `<SkipLink />`, `<InlineScript />` | shell only |

### Icons (`@/components/icons`)

One authored set on a 24px grid, **1.5px non-scaling stroke, square caps, miter joins**,
`currentColor`, sized 1em by default: `ArrowRight`, `ArrowLeft`, `ArrowDown`, `ArrowUp`,
`ArrowUpRight` (external), `Copy`, `Check`, `Mail`, `Github`, `Linkedin`, `XLogo`, `Instagram`,
`Menu`, `Close`, `SocialIcon kind=`. Decorative by default; pass `title` for a standalone icon.
Never use emoji or unicode glyphs (→ ↗ ✓) as icons; use these. (Arrows in running copy that
are text, such as "ECE → Full Stack", are typography, not icons.) Need a new icon? Ask the
foundation; draw it on the same grid and stroke.

### Content

Every fact comes from `@/content` (`profile`, `experience`, `projects`, `featuredProjects`,
`archiveProjects`, `skillGroups`, `practices`, `education`, `certifications`, `site`). Never
hard-code a name, date, metric, link or count in a component. Counts are computed
(`archiveProjects.length`). No phone number anywhere. Email = `profile.email`. Résumé =
`profile.resume`. Livora is "a studio website he built", never "founded".

---

## 8. Section ids and materials (the anchor contract, `src/lib/sections.ts`)

| Order | id | Component (owner) | Material | Nav label | Stage (mono label) |
|---|---|---|---|---|---|
| 00 | `#source` | `hero/Hero` + `intro/Intro` + `scene/Scene` (intro-hero, scene) | screen | (brand) | Source |
| 01 | `#signal` | `about/Statement` (about) | screen | - | Signal |
| 02 | `#work` | `work/Work` (work) | screen | Work | Systems |
| 03 | `#stack` | `skills/Stack` (skills) | screen | Stack | Channel setup |
| 04 | `#experience` | `about/History` (about) | **sheet** | Experience | History |
| 05 | `#contact` | `contact/Contact` (contact) | screen | Contact | Connect |
| - | footer | `footer/Footer` (contact), rendered by the layout on every page | screen | - | - |
| - | `/work/[slug]/` | `src/app/work/[slug]/page.tsx` (work) | **sheet** | - | Datasheet |

Rules:
- Do not rename ids. Put `data-surface="screen|sheet"` on the section root (use `<Section>`):
  the top bar swaps material from it, and `html:has(#main > [data-surface=sheet])` themes
  datasheet pages.
- Sequence numbers like "02" may appear only as **real record information** in mono labels
  (e.g. a datasheet part number PMP-ACQ-02, the revision table's 2.0 / 1.3). No "01 / 02 / 03"
  section counters above headings.
- `<Scene>` mounts in `src/app/page.tsx` inside `<div class="relative isolate bg-graphite">`
  behind `<Hero>` (the scope is hero-only by design). It must be `absolute inset-0`,
  `aria-hidden`, `pointer-events-none` unless it owns input.
- The hero section is transparent (the scene paints the graticule).

---

## 9. Cursor contract (the probe)

On fine pointers with full motion, the native cursor is replaced **only inside instrument
zones** by a 22px crosshair (6px gap, 1:1, difference blend). Elsewhere the native cursor
stays and normal hover states do the work.

| Attribute | Where | Effect |
|---|---|---|
| `data-instrument` | the hero section, the bench panel (and only those) | probe zone: native cursor hidden, crosshair shown |
| `data-cursor-label="Probe /ws/kpi"` | any target inside a zone | four 9px corner brackets fly to the target box +5px (220ms, power3.out) and an 11px mono readout names the action |
| `data-probe="…"` | alias of `data-cursor-label` | same |
| `data-cursor="native"` | an element inside a zone (inputs, sliders that need the system cursor) | native cursor back, no crosshair over it |

Readout copy is an **action in the instrument dialect**, 1-4 words: "Probe /ws/kpi",
"Drag: trigger level", "Open datasheet", "Switch provider", "Jump to the bench".

Canvas targets (no DOM box, e.g. the hero scope) call the imperative API from their pointer handlers:

```ts
import { probeAt, probeRelease, probeActive } from "@/components/cursor";
probeAt({ left, top, right, bottom }, "Probe /ws/kpi"); // viewport px
probeRelease();
```

Pointer state for your own effects: `import { pointer, trackPointer, subscribePointer } from
"@/lib/motion/pointer"` (one shared listener; never add your own `pointermove` on window).

Every hover reveal must also exist on focus and on tap. The probe never hides a focus ring.

Keyboard parity (round 2): when a `data-cursor-label` target inside a zone takes `:focus-visible`,
the brackets and readout seat on it with no crosshair. They step out to +9px so they sit clear of
the 2px ring at 3px offset, and they follow the element while the page scrolls. The next pointer
move hands the probe back to the pointer. Targets need nothing extra: the label you already set
for hover is the label keyboard users see.

---

## 10. Transition API (`@/components/transition`)

```tsx
// Bench -> datasheet: the bench panel's rectangle expands into the curtain.
const panelRef = useRef<HTMLDivElement>(null);
<TransitionLink href={routes.work(project.id)} origin={panelRef} data-cursor-label="Open datasheet">
  Datasheet <ArrowRight />
</TransitionLink>

// Datasheet -> bench
<TransitionLink href={routes.section("work")}>Back to the bench</TransitionLink>
```

- `routes.home`, `routes.work(slug)`, `routes.section(id)` from `@/lib/routes`: app paths
  without basePath (next/link adds it). Raw asset URLs go through `asset()` from `@/lib/asset`.
- Destination pages read `usePageArrival()` → `{ arrival: "load"|"curtain"|"history"|"plain", ready }`
  and play their in-timeline only when `ready && arrival === "curtain"`.
- Returning home sets `stage.returnFrom = slug` **before the route commits**, so the bench can
  read it in a mount effect. The bench re-acquires that system, then clears it with
  `stage.set({ returnFrom: null })`. For the bench's scroll sync to agree, `/#work` lands on
  `[data-system="<slug>"]` (the system's bench entry) at the 60% reading line when that attribute
  exists. Without it, the landing falls back to the top of `#work`, and the reading line then
  picks system 01.
- Modified clicks, back/forward: plain navigation. Reduced motion: a 150ms + 150ms opacity
  crossfade. A second click or `Esc` fast-forwards the curtain. A route that stalls for 4s
  falls back to a hard navigation. Budget and timings: docs/MOTION.md section 8.
- `<TransitionLink>` does not viewport-prefetch home-bound links (`/`, `/#work`): prefetching
  home injects its resource hints (hero CSS, display fonts) into datasheets and the 404, where
  the browser then warns they were preloaded but unused. Every link still warms its route on
  hover, focus and touchstart. Datasheet links keep viewport prefetch.
- Same-page anchors (`<a href="#work">`) are smooth-scrolled app-wide by `<SmoothScroll>`
  (focus moves to the target). To scroll from code: `useSmoothScroll().scrollTo("#work")`.
  Mark an element `data-scroll="manual"` if it handles its own anchor clicks.

---

## 11. Stage store API (`@/lib/stores/stage`)

One tiny observable store (`useSyncExternalStore`). Select primitives only.

```ts
const intro = useStage((s) => s.intro);   // React
stage.get().trigger; stage.set({ trigger: "auto" }); stage.subscribe(fn); // anywhere
```

| Field | Values | Writer | Readers |
|---|---|---|---|
| `intro` | `pending → playing → done` | intro (`startBoot()` / `finishBoot()`); transition provider finishes it on pages without an intro | everyone: wait for `"done"` before section entrances that sit in the first viewport |
| `trigger` | `locked` / `auto` | hero (trigger slider, opening) | top-bar TRIG'D indicator, scene |
| `activeSection` | SectionId / null | header (reading line at 45% of the viewport) | nav, anything section-aware |
| `surface` | `screen` / `sheet` | header | header material |
| `menuOpen` | boolean | header / mobile menu | - |
| `transition` | `idle` / `leaving` / `entering` | transition provider | cursor, pages |
| `arrival`, `arrivalPath` | see §10 | transition provider | `usePageArrival()` |
| `returnFrom` | slug / null | transition provider | bench (clears it) |
| `scene` | `pending` / `webgl` / `fallback` | scene | hero (fallback layout tweaks) |

Non-reactive per-frame buses (read inside rAF / ticker code, never in React state):
- `scroll` + `onScroll(fn)`: `{ y, max, progress, velocity, direction }`, written only by
  `<SmoothScroll>`.
- `scope.signal` / `scope.layout`: hero (writer) → WebGL scene (reader). Writers call
  `wakeScope()` after changing anything; the scene registers with `onScopeWake(fn)`.
  `lockScope()`, `resetScopeToUntriggered()`, `LOCKED_SIGNAL` give the canonical states.

Motion preferences: `useReducedMotion()` (from `@/lib/motion/media`) is the only source of
truth (it includes the footer toggle). `useLoopsAllowed()` / `useSignals()` from
`@/lib/motion/preferences` gate looping signals.

---

## 12. Do / don't

Do
- Put hidden initial states in JS (`gsap.set` / `gsap.from` inside `useGSAP`), never in CSS.
  Without JS, every word is visible.
- Use `<Section>`, the role utilities, the tokens, `.btn`, `.link-mono`, `<ExternalLink>`.
- Make touch targets >= 44px on coarse pointers (`coarse:min-h-11`).
- Give canvases `aria-hidden` and a DOM equivalent (list, table, `role="img"` summary).
- Reserve space for every canvas and media box (aspect-ratio or fixed height): no CLS.
- Test your real copy at 390, 834, 1280 and 1440 widths; fix overflow with wrapping, not
  smaller type.

Don't
- Eyebrows/kickers above headings, "01/02/03" counters, hero-metric templates, card grids of
  icon + heading + text, skill bars/percentages/ratings, logo clouds.
- Gradient text, glass/blur as decoration, glows (except the beam), side-stripe borders,
  rounded cards, shadows as decoration.
- Emoji or unicode glyph icons; mono as a costume; system fonts for display.
- Placeholder links (`href="#"`), buttons that do nothing, fake output, invented numbers.
- Raw `import gsap from "gsap"` (use `@/lib/motion/gsap`), raw `window.addEventListener("pointermove")`,
  raw z-index numbers, raw hex colours in className.
- A custom cursor on coarse pointers; anything revealed only on hover.

---

## 13. QA notes: detector findings judged intentional or false positives

The design detector (`impeccable detect`) is run on every touched file and on the rendered
home page at 1440x900 and 390x844. A computed-style walk (every visible text node, colour x
ancestor opacity composited over the nearest opaque background) is the tie-breaker for contrast.
Current state (refinement round 1): **0 low-contrast text nodes** at rest and after scrolling
through, desktop and mobile, full and reduced motion. Remaining detector hits and why they stay:

| Finding | Where | Verdict |
|---|---|---|
| `cream-palette` (bone #ECE8DF page background) | datasheets, #experience | **Intentional.** Bone is the direction's second material ("sheets carry records"), paired with ink #141512 at 15.0:1. It is the oscilloscope-to-datasheet idea, not a default warm template. |
| `low-contrast` "#ECE8DF on #ECE8DF" | hero secondary CTAs (Résumé, Email) | **False positive.** The detector reads the bone `::before` hover fill, which is clipped to `inset(0 100% 0 0)` (invisible) at rest. Rendered: bone on graphite, 15.7:1; on hover ink on bone, 15.0:1. |
| `low-contrast` "#ADC3EC on #7FA8F5" (sampled) | a Statement word at 390px | **False positive.** The "background" is the CH4 channel underline, a 2px `background-size` strip under the glyphs, not a fill behind them. The word itself is bone on graphite. |
| `low-contrast` "#3A3A37 on #0E0F0D" (1.7:1, earlier scan) | Statement words before they are read | **Resolved** (about area): unread words now start at 42% opacity (bone over graphite clears 3:1 for this display size) and light in reading order by 45% of the viewport; reduced motion and no-JS show them fully lit. |
| `low-contrast` "#95B5F1 on #7FA8F5" | hero lane chip over the CH4 trace | **Sampled pixel**, the trace showing through a 90% chip fill. Fix requested from the hero area: opaque `bg-graphite` on the lane chips. |
| `repeating-stripes-gradient` (advisory) | body | **Intentional.** The graticule and the sample-and-hold mask are the instrument itself (DIRECTION.json background + opening), not surface decoration. |

### Refinement round 2: reviewed false positives (no code change)

Three detector flags from the round 1 evidence pack were reviewed against the rendered page.
They stay as they are:

| Finding | Where | Verdict |
|---|---|---|
| `low-contrast` 1.0:1 on `a.btn.cta` | hero CTAs (Résumé, Email) | **False positive.** The button background is transparent. The bone fill is a `::before` layer clipped to `inset(0 100% 0 0)`, so it covers nothing at rest. The detector composites the clipped fill under the bone label. Rendered: bone on graphite 15.7:1 at rest; ink on bone 15.0:1 on hover and focus, when the fill wipes in. |
| `repeating-stripes-gradient` | `body` | **Intentional.** The stripes are the graticule (the scope's division grid, DIRECTION.json "background"), not decorative striping. |
| `low-contrast` 1.3:1 lane label digit | hero lane chips (`ChannelMark`) | **False positive.** The digit is graphite `#0E0F0D` on its own inline channel fill (CH1 10.5:1, CH2 8.9:1, CH3 10.4:1, CH4 8.1:1, Σ bone 15.7:1). The detector measures it against the chip's graphite or graticule parent and ignores the inline `background`. The mark is also `aria-hidden` and always paired with its text label. |

Splitting the bench bundle (largest app chunk, see `docs/DEPLOY.md`) stays with the work area
and is deferred.
