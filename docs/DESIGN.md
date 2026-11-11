# Sketch → Ship · design system

The creative direction (the contract) is `design/directions/sketch-to-ship/DIRECTION.md`. This
document is how to build it with the foundation: tokens, primitives, the sketch system, the shell
and the contracts. Builders follow it literally so the site reads as one hand. Motion lives in
`docs/MOTION.md`. Design reference: Livora (`design/reference/livora/*.png`): use its language
(warm paper, ink, highlighter blocks, heavy grotesque, handwritten notes, crisp product UI, pill
buttons, soft shadows), never its sections.

Foundation-owned (ask, do not edit): `src/app/{layout,page,not-found}.tsx`, `src/app/globals.css`,
`src/app/icon.svg`, `src/app/og.png/**`, `src/lib/**`, `src/fonts/**`,
`src/components/{chrome,cursor,transition,icons,ui,background}/**`, this file and MOTION.md.
`src/components/sketch/**` was created by the foundation and is now owned by **miniui** (keep the
APIs below stable; extend, do not break).

---

## 0. Ten rules

1. **Facts only from `@/content`** (`profile`, `experience`, `projects`, `featuredProjects`,
   `archiveProjects`, `capabilities`, `skillGroups`, `education`, `certifications`, `site`). Never
   hard-code a fact, never invent a metric, client, testimonial, KPI or number. Mock UIs use real
   labels and features; illustrative data must look illustrative ("Venue A"). Livora is a project
   he built: never "co-founder". No phone number. The current role reads **Full Stack Developer**
   (Maruti Flex Traders LLP, Dec 2025 – Present). One content module is deliberately NOT in the
   barrel: `src/content/journeys.ts` (`journeys: Record<projectId, JourneyStep[]>`, one entry per
   `flow` step: where it runs and what happens there). Import it directly as `@/content/journeys`
   (case studies only), so it never enters the home page bundle.
2. **Tokens only.** No hex, px font sizes, radii, shadows, eases or z-index numbers in components.
   Off-palette colour utilities do not compile (the palette is reset in `@theme`).
3. **Paper + ink + three highlighters**, each with ONE meaning: lime = BUILD, blue = CODE /
   interaction, tangerine = SHIPPED / LIVE / NOW. Used like a highlighter: behind text, on notes,
   keycaps, status dots. Never gradients, glows or gradient text.
4. **One `h1` per page** (home: the hero name; case study: the project title; 404: the line).
   Headings in order; every section is a `<Section>` with an `id` and `labelledBy`.
5. **Type through the `type-*` roles** (section 3). Never monospace for body copy.
6. **Pills for actions, Tags for labels, Cards for "ship" surfaces.** Never nest cards; never a grid
   of same-size icon + heading + text cards.
7. **The sketch layer is decoration**: every sketch SVG is `aria-hidden`; meaning lives in real text.
8. **Hidden states only from JS** (`gsap.set` / `from`), so content is visible without JS.
   Reduced motion (or Motion: off) = static, final state.
9. **Links:** internal pages via `<TransitionLink>` / `<Pill href>` (the page sheet); in-page
   anchors are plain `href="#id"`; external via `<ExternalLink>` / `<Pill href>` (new tab,
   `rel="noopener noreferrer"`, an sr-only "opens in a new tab"). No placeholder links, no
   controls that do nothing.
10. **Refuse:** electronics / hardware metaphors and vocabulary (channels, scope, probes, traces,
    datasheets…), emoji or unicode glyphs as icons (use `@/components/icons`), glass/blur as
    decoration (the header blur is the one functional exception), coloured side-stripe borders,
    the hero-metric template, skill percentages / ratings / radar charts / logo clouds, cursor
    trails, avatars, "Hi, I'm" greetings, "built with love" clichés.

---

## 1. Imports cheat sheet

| Need | Import |
|---|---|
| Facts | `import { profile, projects, featuredProjects, … } from "@/content"` |
| Section, Pill, IconButton, Card, Label, Tag, ExternalLink, AppWindow, LiveDot, MotionToggle, Highlight | `from "@/components/ui"` |
| Icons | `from "@/components/icons"` |
| Sketch primitives, notes, stamp, draw-on, generator | `from "@/components/sketch"` (raw paths also `@/components/sketch/rough`) |
| Page links / arrival | `import { TransitionLink, usePageArrival } from "@/components/transition"` |
| GSAP (+ plugins, useGSAP) | `from "@/lib/motion/gsap"` (never from `"gsap"`) |
| Eases / durations / staggers | `import { EASE, DUR, STAGGER } from "@/lib/motion/eases"` |
| Reduced motion, media | `import { useReducedMotion, useFinePointer, usePhone, useCompact, useDesktop } from "@/lib/motion/media"` |
| Smooth scroll API | `import { useSmoothScroll } from "@/lib/motion/SmoothScroll"` |
| Split arrival, quiet fade | `@/lib/motion/splitArrive`, `@/lib/motion/useScrollReveal` |
| In view | `import { useInView } from "@/lib/hooks/useInView"` |
| Later than first load (idle) | `import { onIdle, useIdle } from "@/lib/idle"` (see §13) |
| Copy to clipboard | `import { useCopy } from "@/lib/hooks/useCopy"` |
| Routes, section ids | `import { routes } from "@/lib/routes"`, `import { SECTIONS } from "@/lib/sections"` |
| App state (intro, active section, menu, transition) | `import { useStage, stage } from "@/lib/stores/stage"` |
| WebGL quality / DPR | `import { getQualityTier, dprForTier, hasWebGL } from "@/lib/gpu"` |
| Raw asset URL | `import { asset } from "@/lib/asset"` |
| Mini-UI (contract 1) | `import { MiniUI } from "@/components/miniui"` |
| Living system diagram (lazy: `dynamic(() => import("@/components/diagram").then((m) => m.SystemDiagram), { ssr: false })`) | `SystemDiagram`, `projectDiagram(project)`, `buildSpec`, `orderLanes` / `routeEdges` from `@/components/diagram` |
| Case-study journey steps (not in the barrel) | `import { journeys } from "@/content/journeys"` |
| Work stage side (Interface / Architecture) | `import { setWorkView, useWorkView } from "@/components/work/viewStore"` |
| Sketch mode (contract 5) | `import { useSketchMode, getSketchMode } from "@/lib/stores/sketchMode"` |
| Command palette (contract 6) | `import { openPalette } from "@/components/palette"` |
| Motion state swaps (lazy features) | `import { MotionLite } from "@/lib/motion/lazyMotion"` + `import * as m from "motion/react-m"` + `AnimatePresence` from `motion/react` |
| Phone folds | `import { Fold, FoldToggle } from "@/components/ui"` |

---

## 2. Colour

Utilities: `bg-*`, `text-*`, `border-*`, `fill-*`, `stroke-*` with these names (opacity
modifiers work: `bg-paper/92`).

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `paper` | `#F4F4EF` | page background (paper sections are transparent and show the dot grid) | ink on it 17.6:1 |
| `paper-2` | `#EAEAE3` | alternate band (`#work`), sunken wells, window frames | ink 16.1, graphite 6.2 |
| `card` | `#FBFBF8` | crisp "ship" cards and panels | ink 18.8 |
| `ink` | `#0D0D0C` | text; ink sections; primary pill | |
| `ink-2` | `#1A1A18` | raised surfaces on ink (cards inside ink sections) | paper 15.8 |
| `graphite` | `#55554F` | secondary text on paper | 6.8 on paper |
| `pencil` | `#8A8A82` | sketch strokes, dots, placeholder shapes: **decorative or ≥24px text only** | 3.2 |
| `line` | `#DDDDD5` | hairlines, card borders on paper | decorative |
| `line-strong` | `#C9C9C0` | control outlines (tags, outline icon buttons) | decorative |
| `fog` | `#A9A99F` | secondary text **on ink** | 8.2 on ink |
| `ash` | `#6E6E66` | decorative strokes / dots on ink | 3.8 |
| `seam` | `#2A2A27` | hairlines on ink | decorative |
| `lime` | `#C8F53B` | BUILD: highlighter, CTAs on ink, "building" | ink on it 15.4 |
| `lime-deep` | `#557200` | lime-coloured **text** on paper | 5.0 (4.6 on paper-2) |
| `lime-soft` | `#E9F9B0` | lime wash, lime sticky note | ink 17 |
| `blue` | `#3D5AFE` | CODE: focus ring, interactive marks, icons, fills behind paper text | paper on it 4.7 |
| `blue-deep` | `#2C44D8` | blue **text** and links on paper | 6.5 (5.9 on paper-2) |
| `blue-soft` | `#DDE3FF` | blue highlighter / note | ink 15.3 |
| `tangerine` | `#FF6A2B` | SHIPPED / LIVE / NOW: the port ship's stamp, live dots, "current", HEAD | ink on it 6.8 |
| `tangerine-deep` | `#B53C0A` | tangerine **text** on paper | 5.3 |
| `tangerine-soft` | `#FFE1D3` | tangerine highlighter / note | ink 15.7 |

**Text colour rules.** On paper: `text-ink` (primary), `text-graphite` (secondary); coloured text
uses the `-deep` tokens. On lime / blue-soft / tangerine-soft / lime-soft: always `text-ink`. On
ink: `text-paper`, `text-fog`, `text-lime`, `text-tangerine` (6.8:1). Paper text on `blue` is OK;
**never white/paper text on tangerine** (use ink). `blue` as text only ≥ 24px or on paper/card,
never on paper-2 (use `blue-deep`).

**Where each accent goes.**
- lime: the highlighter for "build" words, primary CTAs on ink, the selected tool in the stack
  (and the band behind a selected language), window dot 1, sticky pin, the "building" state.
- blue: focus rings (automatic), links (`.link` = blue-deep), "code-ish" marks, window dot 2,
  in-progress state, git feature branches.
- tangerine: the SHIPPED stamp (on the port's ship only), `LiveDot`, "Now / current / HEAD", window dot 3,
  "Copied ✓" feedback (with the authored Check icon).

**One highlighter per heading, rotating through the page** (with `<Highlight>`):

| Section | Heading word | Colour |
|---|---|---|
| 01 Hero | "Full Stack" | lime |
| 02 What I build | "build" | blue |
| 03 Selected work | e.g. "work" / "shipped" | tangerine |
| 04 Stack (paper, then the ink sea) | "stack" | lime |
| 05 Changelog | one word | blue |
| 06 About | one word | tangerine |
| 07 Contact (ink) | "build" | lime |

---

## 3. Typography

Families (next/font, self-hosted, CSS variables on `<html>`): **Bricolage Grotesque** (display,
variable with optical size: big type automatically gets the tight display cut), **Inter**
(400/500/600), **JetBrains Mono** (400/500), **Caveat** (500–700). Utilities: `font-display`,
`font-sans` (default), `font-mono`, `font-hand`.

Use the role utilities; each sets family, size, weight, leading and tracking:

| Class | Font / weight | Size (fluid) | Use |
|---|---|---|---|
| `type-hero` | Bricolage 800, −0.04em, lh .88 | 56 → 152px | the hero `h1` name only |
| `type-display` | Bricolage 700, −0.035em, lh .95 | 40 → 80px | H2 section headings, case-study `h1`, the 404 line |
| `type-h3` | Bricolage 700, −0.025em | 24 → 36px | H3: row titles, project titles |
| `type-h4` | Bricolage 700, −0.015em, lh 1.3 | 19 → 22px | card titles, panel titles, tab titles (text leading: they wrap at 19px) |
| `type-lead` | Inter 400, lh 1.45 | 18 → 22px | sub-lines under headings, intros |
| `type-body` | Inter 400, lh 1.6 | 17 → 18px | paragraphs (use with `measure`, 66ch) |
| `type-ui` | Inter 500 | 15px | nav, inline controls, chips with natural text |
| `type-small` | Inter 400 | 15px | captions, meta lines (not paragraphs) |
| `type-mono` | JetBrains 400, tabular | 13px | data values, dates, versions, file names (`resumai — editor`) |
| `type-label` | JetBrains 500, UPPER, +0.1em | 12px | short labels (1–3 words), **max one per section** |
| `type-micro` | JetBrains 500, tabular | 11px | the floor: dense mini-UI data only |
| `type-hand-sm` / `type-hand` / `type-hand-lg` | Caveat 600/700 | 20 / 22→26 / 28→36px | the sketch layer: notes, annotations |

Rules: headings balance (`text-wrap: balance` is global for h1–h4); body never below 16px,
45–75ch (`measure`); functional text never below 11px (legal smallprint ≥ 10px); Caveat never
below 20px; letter-spacing above 0.05em only on short uppercase mono labels; dates and numbers
`tabular-nums` (automatic on `time`, `data`, `td`, `th`; add `tabular-nums` elsewhere). Override
a role's size only with a fluid `clamp()` (e.g. the hero role line
`type-display text-[clamp(1.875rem,1rem+2.6vw,3.25rem)]`). No kicker / eyebrow label stacked above
every heading: a `Label` is metadata (a status, a file name, a date range), not decoration.

---

## 4. Layout, spacing, breakpoints

| Prefix | Min width | Device |
|---|---|---|
| (none) | 0 | phone (< 600) |
| `sm:` | 600px | tablet portrait |
| `md:` | 900px | laptop / tablet landscape (the header shows the full nav from here) |
| `lg:` | 1200px | desktop |
| `xl:` | 1440px | wide |

JS twins: `usePhone()` (< 600), `useCompact()` (< 900), `useDesktop()` (≥ 1200), `BREAKPOINTS`.

- **Content column:** `.wrap` = `min(100% − 2 × --margin, 1240px)`, centred. `--margin` is 20 → 48px.
  `<Section>` wraps its children in `.wrap` unless `bleed`.
- **Section rhythm:** `py-section` (top 88 → 168px, bottom 80 → 152px). `spacing="compact"` for
  short bands. More space above a heading than below it; heading → content gap 40–56px
  (`mt-10`–`mt-14`); related items 8–16px; groups 24–40px.
- **The header is fixed** (`--header-h` 72px, 64px below 900). The first section of a page pads its
  top: `pt-[calc(var(--header-h)+clamp(32px,6vw,88px))]` (see the hero / case-study stubs).
  Section anchors land at the section top; the header sits over the section's own top padding.
- **Z layers** (always `z-(--z-…)`): `--z-bg` −1 (grid canvas), `--z-raised` 10 (notes over windows,
  stamps), `--z-sticky` 20 (sticky columns), `--z-header` 60, `--z-menu` 70, `--z-sheet` 90,
  `--z-cursor` 100, `--z-skip` 110.
- **Touch targets ≥ 44px** (pills and icon buttons enforce it on coarse pointers; give text links
  `min-h-11` + `inline-flex items-center` when they stand alone).
- No layout shift: reserve space for canvases / media (aspect-ratio boxes), never inject above
  the fold after load.

---

## 5. Surfaces, shape, depth

| Radius utility | Value | Use |
|---|---|---|
| `rounded-xs` | 6px | tiny bits inside mini-UIs |
| `rounded-chip` | 10px | chips, keycaps, small tiles, focusable text links |
| `rounded-panel` | 14px | inner panels, wells inside cards |
| `rounded-window` | 18px | the inner app-window panel |
| `rounded-card` | 28px | big cards, window frames |
| `rounded-slab` | 40px | inset ink slabs |
| `rounded-pill` / `rounded-full` | ∞ | pills, dots, round buttons |

- **Shadows (two only):** `shadow-card` (resting cards, windows) and `shadow-lift` (hover,
  floating notes, the label cursor). Long, soft, offset. Never a zero-offset glow, never a hard
  offset block shadow.
- **Cards** ("ship" layer): `card` background, 1px `line` border, 28px radius, `shadow-card`
  → `<Card>`. Inside a card use panels: `rounded-panel border border-line bg-paper` (no shadow).
- **Ink sections:** full bleed (`<Section tone="ink">`) or an inset slab
  (`<Section tone="ink" slab>`, 40px radius, page gutters, paper + dots around it). Inside ink:
  cards become `ink-2` with `seam` borders automatically; pills and links switch automatically.
- **The paper dot grid** is the `html` background (pencil @ 35%, 16px pitch, anchored to the
  document). Paper sections are transparent and show it; `paper-2` and ink sections are opaque.
  To put the static grid on another surface: `paper-dots`. On fine pointers with full motion a
  tiny canvas lens (src/components/background) grows and darkens the dots near the pointer.
- **Sketch strokes:** 1.6px (`Stroke` default), round caps, `ink/80` or `pencil`; 2px for emphasis
  (underlines, cracks). Same generator everywhere (section 7).

---

## 6. Components (`@/components/ui`)

**`<Section id tone="paper|paper-2|ink" slab spacing="default|compact|none" bleed labelledBy as className innerClassName>`**
Sets `data-tone` (read by the cursor, the background lens and every on-ink style). Children sit in
`.wrap` unless `bleed`.
```tsx
<Section id="work" tone="paper-2" labelledBy="work-title">
  <h2 id="work-title" className="type-display">Selected <Highlight color="tangerine">work</Highlight></h2>
</Section>
```

**`<Pill variant="primary|outline|lime|ghost" size="sm|md|lg" href external hint label magnetic icon iconBefore nudge>`**
Every button-like action. 40 / 48 / 60px tall (44 min on touch). Hover / focus sweeps a
highlighter fill in from the left (pen) and out to the right; press scales 0.97.
- `href` internal (`/work/x/`, `/#work`) → page sheet (`label` = sheet caption, e.g. the
  project's `shortTitle`); `#id` / `mailto:` → plain link; `http(s)` → new tab + sr hint
  (`hint="PDF on Google Drive, opens in a new tab"` for the résumé). No `href` → `<button>`.
- External links get `ArrowUpRight` automatically (`icon={null}` removes it). `nudge`:
  `up-right | right | down | none`.
- primary on paper = ink; **inside an ink section it becomes lime with ink text automatically**;
  outline becomes a paper outline. `magnetic` only on 1–2 primary CTAs per page.
- Disabled: `disabled` (button) / `aria-disabled="true"` (link).
```tsx
<Pill href="#work" size="lg" icon={<ArrowDown />} nudge="down">See my work</Pill>
<Pill href={profile.resume.href} variant="outline" hint="PDF on Google Drive, opens in a new tab">{profile.resume.label}</Pill>
```

**`<IconButton label icon variant="outline|ink|lime" size="sm|md|lg" href external>`** Round,
40 / 48 / 56px. `label` is required (aria-label). Fills from the centre on hover/focus;
`aria-pressed` / `aria-expanded` hold the fill.

**`<Card as interactive padding="none|sm|md|lg" tone="auto|paper">`** The ship surface.
`interactive` lifts 4px with `shadow-lift` (use when the whole card is one action).

**`<Label dot="lime|blue|tangerine|ink|pencil" as>`** 12px mono uppercase. Max one per section.

**`<Tag tone="outline|lime|blue|tangerine|ink" caps as>`** Stack items, categories. Natural case
by default (`caps` for 1–2 word categories). Not clickable (use `<Pill size="sm" variant="ghost">`).
Lists: `<ul className="flex flex-wrap gap-2">{…<Tag as="li">}</ul>`.

**`<ExternalLink href arrow hint className="link">`** In-text links that leave the site. `.link` is
the in-text link style (blue-deep, 1px underline at 0.24em, thicker on hover; lime on ink).

**`<AppWindow title variant="ship|sketch" frame ratio actions seed bodyClassName ref>`** The
product frame for every mini-UI: Livora's device frame (paper-2, 10px, 28px radius) around a
card panel (18px radius) with a 40px bar: three dots in the three highlighters + a mono title
(`resumai — editor`) + optional `actions`. `variant="sketch"` keeps the **identical box model**
(borders reserved transparent, same bar height) and draws the frame, the panel, the dots and the
bar line as pencil strokes with a Caveat title. `ratio="16 / 11"` is the MiniUI ratio.

**`<Highlight color="lime|blue|tangerine" trigger="view|mount|manual|static" play delay>`** The
highlighter swipe behind 1–3 words (see MOTION.md). Text inside is always ink; on ink sections the
word stays light until the band arrives, and there the band is a full block (1.04em, centred,
no negative margin) so no ascender, descender or neighbouring comma is ever ink-on-ink or
paper-on-lime (the detector flagged the old 0.8em band on `#stack-title` / `#contact-title`
correctly). Reduced motion pins the band full in CSS (`html.rm .hl`). Tune per use with `[--hl-h:1.05em] [--hl-y:60%]`
(band height and vertical position), e.g. full-line blocks on Caveat lines.

**`<LiveDot tone="tangerine|lime|blue" pulse size>`** Status dot (pulses 3× then rests). Always
next to text that says the same thing.

**`<MotionToggle>`** "Motion On/Off" switch (role="switch"): the site-wide pause for WCAG 2.2.2.
Lives in the footer. **`<SkipLink>`** is in the layout already.

**`<Fold>` + `<FoldToggle controls more less>`** Phone folds (client, server children allowed):
on phones with JS, rows after the fourth of a `data-fold-list` (or a whole `data-fold-rest` block)
fold behind the toggle; the folding is CSS (globals.css "PHONE FOLDS"), so the server HTML is
complete and nothing shifts. Used by the
changelog cards (highlights behind "Details"; each card's figure stays visible above it).
Desktop and no-JS show everything.

**Icons** (`@/components/icons`, 24-grid, 1.5px round strokes, `size` default 1em, decorative
unless `title`): ArrowUpRight, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronDown,
ChevronRight, External, Copy, Check, Plus, Minus, Close, Menu, Pause, Play, Replay, Download,
Upload, Send, Search, LinkIcon, Eye, Pencil, Mail, Clock, MapPin, FileText, Calendar, Mic, Chat,
ImageIcon, Database, Layers, AppWindowIcon (a project's interface), Diagram (parts wired
together: an architecture), Terminal, Code, Globe, Sparkle, Award, Package, GitBranch,
GitCommit, Github, Linkedin, XLogo, Instagram, `SocialIcon kind`. Need another? Ask the foundation.

---

## 7. The sketch system (`@/components/sketch`)

Two layers meet on every screen: **sketch** (the idea: pencil-rough strokes, Caveat, highlighters,
sticky notes, doodled arrows) and **ship** (crisp UI: cards, hairlines, mono labels, real data).
One seeded generator draws every rough path. It is pure and deterministic (no `Math.random`): the
same seed and size give the same path on server and client.

### Generator (`@/components/sketch/rough`, pure TS, server-safe)
Every function returns ONE SVG `d` string (sub-paths in pen order, so draw-on traces it like a hand).

| Function | Draws |
|---|---|
| `roughRect(x, y, w, h, { seed, radius, roughness, bowing, passes, overshoot })` | box; `radius 0` = four crossing strokes with overshooting corners; `radius > 0` = one continuous stroke |
| `roughLine(from, to, { seed, passes })` | line (2 passes default) |
| `roughPolyline(points, { seed, close, passes })` | open / closed polyline |
| `roughEllipse(cx, cy, rx, ry, { seed, passes })`, `roughCircle(cx, cy, r, o)` | a loop that overshoots its start |
| `roughArrow(from, to, { seed, bend, head, headAngle, heads })` | doodled arrow (shaft + V heads) |
| `arrowGeometry(...)`, `arrowHeads(...)` | shaft only / heads only (dashed connectors) |
| `roughUnderline(x, y, w, { seed, style: "single"|"double"|"swash" })` | hand underline |
| `scribble(x, y, w, h, { seed, density, slant })` | zig-zag fill ("text will be here", crossed-out) |
| `roughCheck(x, y, size)`, `roughCross(x, y, size)` | marks |
| `roughEdge(x, y0, y1, { seed, amp, step })` | a hand-cut vertical edge (the page sheet) |
| `tight(options)` | the straightened twin of any call above: same options with no wobble, bow or overshoot, so `roughRect(…, o)` and `roughRect(…, tight(o))` have the same commands; tween `d` from one to the other and a pencil line straightens onto its crisp box (how mini-UIs and diagrams compile) |
| `seeded(seed)`, `hashSeed(seed)` | the PRNG, if you need deterministic jitter |

**Seeds:** stable and meaningful (`"hero-window"`, `` `${project.id}-chunk-2` ``), unique per
element, never an array index that shifts when data changes. `roughness` 0.6–1.2 for UI sketches,
up to 2 for scrawls.

### Components (client; aria-hidden; `seed` required)
- **Fit mode** (default): absolutely covers the nearest positioned ancestor (give it `relative`),
  measures it, draws at true pixel size. `inset` grows (−) or shrinks (+) the box. Strokes appear
  after hydration.
- **Fixed mode**: pass `width` + `height`: an inline SVG of exactly that size, identical on server
  and client.
- Common props: `seed`, `tone="ink|pencil|graphite|paper|lime|blue|tangerine"` (ink = ink/80),
  `strokeWidth` (1.6), `roughness`, `draw="view|mount|manual"` + `play`, `drawDelay`,
  `drawDuration` (total, default 0.9s), `className`, `style`.

| Component | Use |
|---|---|
| `<SketchRect radius passes>` | the sketch twin of any box (fit) |
| `<SketchLine from to orientation passes>` | rules, dividers, connectors |
| `<SketchArrow from to units="px|fraction" bend head heads dashed>` | connectors; `dashed` draws on through a mask |
| `<SketchCircle inset={-6}>` | circle a word / element |
| `<SketchUnderline offset style>` | hand underline under a box (the contact email) |
| `<Scribble density slant>` | placeholder text / crossed-out idea |
| `<SketchCheck size>` | hand-drawn check (finished stage chips) |
| `<SketchSvg viewBox draw title>` + `<Stroke d strokeWidth dash>` | your own illustration or diagram from generator paths, scaled to the container (strokes stay 1.6px) |
| `<HandNote tone size="sm|md|lg" rotate arrow="left|right|up|down" seed>` | handwritten margin note (Caveat ≥ 20px), optional doodled arrow; server component |
| `<HandArrow direction seed tone>` | just the doodled arrow (52×34) |
| `<StickyNote color="paper|lime|blue|tangerine" tilt pin="lime|blue|tangerine|ink|none" pinSide>` | a tilted note with soft shadow, curl and pin; content is yours |
| `<ShippedStamp size="sm|md|lg" label tilt decorative ref>` + `stampIn(el, { impact, delay })`, `hideStamp(el)` | the tangerine SHIPPED stamp (ink text, ink frame, authored check). **Only on the port's ship** (his ask, 2026-11-10: "remove everywhere except in ship"); the idea ticket's relabelled twin says "Drafted". Nothing else may show it: not the project pictures, the stack map, the architecture windows, the case-study journey, the sketch toggle, the palette, the newspaper or the social card |

Draw-on helpers: `drawOn(target, { duration, ease, delay })` returns a timeline (hides strokes at
once, draws every `[data-stroke]` in pen order within `duration`); `hideStrokes`, `showStrokes`,
`strokesIn`; `useDrawOn(ref, { trigger, play, … })` for your own SVGs. Mark hand-drawn paths in
your own SVG with `data-stroke` (the `<Stroke>` component does it).

### Building a sketch twin (mini-UIs, case-study diagrams)
Render ONE element list twice: as **ship** (crisp boxes, real text) and as **sketch** (a
`SketchRect` with the same radius at the same box, `type-hand` labels at the same positions,
`Scribble` where body text will be). Same container, same sizes, so the compile is a per-element
transform (MOTION.md "Sketch → ship compile"). Use `AppWindow variant` for the frame.

---

## 8. The contracts (stable exports; owners replace internals)

1. **`src/components/miniui/index.tsx`** (owner: miniui)
   ```ts
   export type MiniUIState = "sketch" | "ship";
   export const MINIUI_PROJECTS = ["resumai","drone-intelligence","audify-ai","bookmyvenue","brain-tumor-detection","mcp-job-agent"] as const;
   export function MiniUI(props: { projectId: string; state?: MiniUIState; autoplay?: boolean; onShipped?: () => void; stamp?: boolean; size?: "sm" | "md" | "lg"; className?: string })
   ```
   Outer box: width 100% of its container, `aspect-ratio: 16 / 11` (an `AppWindow` with
   `ratio="16 / 11"`), IDENTICAL in both states, so a sketch instance can sit exactly under a ship
   instance (the hero lens). `state` is controlled (default "ship"); "sketch" → "ship" plays the
   compile, then calls `onShipped` (`stamp` adds the SHIPPED stamp; off by default since 2026-11-10,
   and no caller turns it on). `autoplay` = hold the sketch while it draws,
   ship once when in view (instant with reduced motion), then `onShipped`. `size` = density of the
   internals (sm: cards / phones ≤ 420px wide, md: the hero stage, lg: the case-study hero).
   Templates: resumai → editor, drone-intelligence → chat, audify-ai → phone, bookmyvenue →
   calendar, brain-tumor-detection → scan, mcp-job-agent → pipeline; window titles like
   `resumai — editor`.
   - **Each picture shows its project's main concept with real-looking content** (his ask,
     2026-11-10: grey bars that say nothing do not count). Illustrative values live in
     `miniui/data.ts` `SAMPLE` and read as samples (placeholder names like "Contact B", rules
     restated from a public source); the project's own parts (models, stores, steps, providers)
     come from `@/content`. **drone-intelligence → chat:** a sample question about a flight, the
     answer (it restates DGCA's Drone Rules, 2021), the retrieval step (`Retrieve top 5 ·
     ChromaDB`) over the passages it read (as many as fit: the column wraps and the overflow is
     clipped whole), the source chip; beside it the airspace check: a drawn map with a quadcopter
     in the green zone, an airport's red and yellow zones, the verdict pill and a legend.
     **audify-ai → phone:** the screen is the transcript (title "Transcript", "Contact B ·
     11:05", "2 speakers"): a small player, then the call written out speaker by speaker
     (diarization), the last line still typing; beside it the speech-to-text provider picked
     in Settings among the others (from its highlights), the flow at "Transcribe · step 4 of
     5", and the call's summary as a row in a Google Sheet (empty rows below it, none made up).
     It transcribes recordings after the call, so nothing says "live". Both shed parts as the
     window narrows (448px, 416px, 400px, 384px; the comments at the top of `chat.tsx` and
     `phone.tsx` list what goes when) so nothing is clipped mid-line at 320px.
   - The sketch state is **strokes only** (transparent). A lens that sits ON TOP of the shipped
     UI needs its own paper background (the hero uses `bg-paper paper-dots`).
   - The root is `role="img"` with a description and carries `data-state` = `sketch` |
     `compiling` | `ship`. It is a picture, never a control: wrap it in your own link or button.
   - Internals adapt to the real container width (container queries); `size` mainly sets the
     (unused) stamp's scale (sm 12px, md 15px, lg 20px only when the window is at least 672px wide).
   - Changing `projectId` remounts the picture (a sketch redraws itself); `onShipped` fires once
     after the compile. The hero relies on all three.
2. **`src/components/stack/state.ts`** (owner: stack): `StackKey` `{ id, label, groupId,
   groupLabel, letter, usedIn }` and `stackKeys` (from `skillGroups`, de-duplicated, in layer
   order). Plain data; which tool is open is local state of the dive (one card per layer).
3. **The iceberg** (owner: stack; 2026-11-07, it replaced the 3D keyboard and three.js / R3F).
   `stack/Dive.tsx` renders the rows and marks what the drawing measures: `[data-art-col]` (the
   art column, or the tip's own band below 900px), the `[data-layer]` rows (their `h3` and `ul`),
   `[data-sea]` and `[data-seabed]`. `stack/IcebergArt.tsx` (lazy: `dynamic` + `useInView` at
   1000px) measures them, draws `stack/iceberg.ts` (pure: `drawIceberg(input)` returns per layer
   `fill`, `outline`, `ridges`, `hatch`, `leader`, `seam`, each in a pencil hand and its tight
   ink twin, plus the sea surface and the seabed) and redraws on every resize. Keep those hooks
   if the rows change.
4. **`src/app/work/[slug]/page.tsx`** (owner: casestudy): `dynamicParams = false`,
   `generateStaticParams` over `featuredProjects`, `params: Promise<{ slug }>`,
   `generateMetadata` with `title: project.title` (the layout template appends
   " · Prajwal M P"), `alternates.canonical` = `${site.url}work/${id}/`, and `openGraph` /
   `twitter` restated with `images: ogImages()`.
5. **Sketch mode: `src/lib/stores/sketchMode.ts`** (owner: sketchmode). One switch that turns the
   whole site back into the sketch it started as.
   ```ts
   useSketchMode(): { on: boolean; toggle(origin?: { x: number; y: number }): void; set(on: boolean, origin?): void }
   getSketchMode(): boolean;  subscribeSketchMode(fn): () => void;   // non-React
   onSketchModeChange(fn: ({ on, origin, animated, finished }) => void): () => void;  // each switch
   ```
   - Entry points: the header's pencil toggle (`SketchToggle`, `data-qa="sketch-toggle"`), the
     palette (calls `toggle`), the hero (may call `set`). `origin` = where the wipe starts
     (viewport px); without one it starts at the header toggle.
   - While on, `<html data-sketch>` (set before first paint from sessionStorage `pmp:sketch` by
     the boot script; never on by default, session only, no opening while it is on).
   - **Components with a sketch/ship pair show their SKETCH state while it is on** (read
     `useSketchMode().on`). MiniUI does it by itself for every instance (and compiles back
     when it goes off). The stack's iceberg shows its pencil drawing (no ink,
     no fills).
   - **Everything else is redrawn by CSS** (globals.css "SKETCH MODE", unlayered): the notebook
     grid; Caveat for `type-hero/display/h3/h4`, `font-display`, `h1–h4` (with `font-size-adjust`,
     so every clamp still applies), for `type-label/mono/micro`, `font-mono`, `.tag`, `kbd` (20px
     floor) and `type-ui`, `.pill` (22px); text graphite; `.card`, bordered `rounded-card/window/
     panel/chip` boxes become rough pencil rectangles (border-image); fills (`bg-card`,
     `bg-paper-2`) and shadows go; accent fills (`bg-lime|blue|tangerine|graphite`, `tag-*`)
     become coloured-pencil hatching; `.hl` highlights become scribbled underlines; `.link` gets a
     wavy underline; ink sections and slabs turn to paper with a pencil-hatched edge (the
     neutrals are swapped inside them: `text-paper` reads ink, `text-fog` graphite,
     `border-seam` a pencil line; ink-on-accent is re-pinned to ink); light text is ink
     everywhere; any other canvas is drawn grey.
   - Hooks for builders: the **`sketch:` variant** (`sketch:hidden`, `sketch:font-hand`,
     `sketch:bg-transparent`…) to fine-tune a component; **`data-sketch-skip`** on an element
     opts it and its subtree out of the generic restyle (draw your own sketch then). Never
     style on a bare `[data-sketch]` selector: sketch primitives carry `data-sketch` too; use
     `html[data-sketch]` or the variant.
   - Margin notes: `<Section>` writes one handwritten design note per home section in its top
     padding (`src/components/ui/SketchNote.tsx`), visible only in sketch mode. The note sits
     below the fixed header's line (`--header-h` + 10–16px), because a section reached from the
     nav lands with its top under the header; its host (`.sk-note-host`, the section or the
     slab) grows its top padding to `max(--section-y, note top + 3.5rem + gap)` so the note
     never touches the heading (+21px at 1440, +50px on phones; sketch mode only).

### 8.1 The creative layer (what each piece is and where it lives)

**Diagram grammar** (`src/components/diagram/*`, one engine; lazy). A diagram is data:
`DiagramSpec` = lanes (layers) + nodes + edges + the `steps` a request takes. `buildSpec()` makes
one from labels; `projectDiagram(project)` makes one from `src/content` (`architecture` layers
become lanes, `flow` becomes the journey; the step-to-node mapping lives in `diagram/projects.ts`
and restates the project's own text, nothing is invented; a route that no longer matches the
content is dropped and the diagram falls back to its layers). The grammar is fixed site-wide:

| Element | Meaning |
|---|---|
| Lane | a layer (Interface, API, Intelligence, Data, Infrastructure, Automation, Deploy), top to bottom or left to right (`orientation: "auto"` picks what fits) |
| Card (node) | a real technology or step from the content: Inter label, mono layer micro-label, a real button (arrow keys move between nodes, click / tap / Enter pins its note) |
| Solid edge (`route`) | part of the journey; inks in as the first request runs |
| Dashed edge (`link`) | a relationship the content states; never carries packets |
| **Lime packet** | a request going in |
| **Blue packet** | data or code moving between services |
| **Tangerine packet** | the response / shipped result coming back |
| Numbered badge + highlighter band | a step of the flow, in order, lit for good once the route has run |

Layout is pure TS (`geometry.ts`: `layoutLanes` orders nodes so edges stay short, `planGrid`
makes a CSS grid, `routeEdges` routes every edge as a hand-drawn path with a tight twin and a
sampled packet track from the MEASURED boxes). Every stroke comes from the seeded generator, so
server and client agree. Sketch state = pencil boxes, Caveat labels, rough edges; ship state =
Inter, mono, cards. Used in: the Work stage's "Architecture" side (`ArchitectureWindow`, with a
pause control and a narration line) and, with its own scroll-driven board, the case-study journey.
All loops pass through `playGate` (`@/components/diagram/playGate`, dependency-free): on screen
and tab visible, ANDed with `useReducedMotion()`.

**Case-study journey** (`casestudy/HowItWorks`, `casestudy/journey/{Board,Steps,model}`,
`@/content/journeys`). "How it works": the project's architecture as lanes and its flow as stops.
A lime packet travels the flow scrubbed by scroll (board pinned by CSS sticky at 900px and up, a
vertical rail below), each stop compiles from sketch to card on arrival, its step card and lane
light in sync, and a tangerine response returns. Reduced motion: the
finished board plus the ordered step list. `journeys.ts` is not in the content barrel (it is
case-study only, so it never enters the home bundle).

**Live stack map** (`build/StackMap`, `build/engine.ts` lazy, `build/model.ts`, `build/graph.ts`).
The second beat of "What I build": Interface to Deploy as nodes (real buttons in an ordered list)
listing the technologies from `skills.ts`; the engine owns the aria-hidden SVG layers (sketch
draws, compiles, one lime request walks the route, then slow idle packets). A
capability row or a node lights its path; others dim to 35%. Sketch mode shows the sketch.

**Command palette** (`palette/{index,Body,commands,fuzzy,store}`). Ctrl/Cmd+K or "/" (never in a
field), the header trigger, or `openPalette(query?)`. The always-loaded shim is the key listener,
trigger and store; the body loads on first open (warmed on trigger hover / focus / touch). It is a
terminal-flavoured launcher, not a real shell: fuzzy search over Go to (sections, six case
studies), Actions (show how my projects are built, which flips Work to Architecture and goes
there; copy email; open résumé, GitHub, LinkedIn; send an email; toggle sketch mode; toggle
motion) and Terminal commands. Commands: `whoami`, `ls projects`, `git log --oneline` (the
experience as commits), `cat stack.txt`, `npm run hire-prajwal` (a build log that ends in an
email pill), `help`, `clear`, plus a few jokes (`sudo`, `rm`, `vim`, `hello`) and "did you mean".
All output is generated from `@/content`. Focus-trapped, Esc closes, focus returns to the opener.

**Sketch mode**: contract 5 above (rules: CSS redraw plus `sketch:` variant plus
`data-sketch-skip`; sketch/ship pairs read `useSketchMode()`; session only; never on by default).

**About, in a README** (`about/{index,Readme,RoadMap,roadArt,Vault,vaultArt}`; 2026-11-07).
- **The README** (`Readme.tsx`): the bio as README.md in a file viewer: the file tab, an "Open to
  new opportunities" badge (LiveDot), a "Preview | Code" tablist (the markdown source is generated
  from the same content, with line numbers and coloured marks), and what he is learning as open
  branches (blue tags with the branch icon). The first time it comes in it shows the source, then a
  pencil line sweeps down and renders it (sketch -> ship).
- **The road so far** (`RoadMap.tsx`, map art in `roadArt.ts`; it replaced the Education list and the
  README's Route row): a hand-drawn map, north up, not to scale (the Arabian Sea and the coast, the
  Western Ghats in hills and trees, rivers, the plateau's fields and villages, Bengaluru's skyline,
  a compass, a small container ship passing) with the road Koppa -> Sullia (hairpins down the Ghats)
  -> Bengaluru and numbered pins; under it the facts as three bus tickets (stop, place, years, the
  chapter, the schools and grades / the degree and the award / the current focus) with a
  conductor's punch hole. A tangerine bus drives the road once (see MOTION.md). The ECE note sits
  under the README from 1200px, pointing at the degree's ticket. Prajwal chose this first design
  back ("i need first design") over the road trip that followed it (`RoadTrip.tsx` + `tripArt.ts`:
  a side-on parallax bus journey from Koppa to Bengaluru, day into night, with a signpost of arrow
  boards and a mynah), which is kept, not mounted (the switch is noted at its top).
- **The vault** (`Vault.tsx`, drawing in `vaultArt.ts`; certifications and the award, the fifth
  design for them after stickers, certificates on a line, a passport and night summits, which he
  turned down): on the ink slab, one strongroom wall (ink-2 panel). On it a round vault door in its
  frame (lime rim with rivets, lime-soft face, eight paper-2 bolts that cross the gap into the
  frame's receivers when locked, a combination dial in a bezel with a lime index, a spoked ink
  wheel with lime grips, a "PMP" maker's plate, hinge arms and knuckles); behind it, seen through
  the doorway in one-point perspective, the strongroom: side walls and a back wall of deposit
  boxes, a runner, a hanging lamp. The open door stands at -72 degrees on its hinge (CSS 3D, 9
  lime-deep layers for its thickness). Beside the door the wall's deposit boxes: a row of small
  numbered ones (101-110) above and below (115-124), four status lamps, and one big box per
  credential (paper-2 face; a dark compartment in perspective with its little fog-steel door,
  number, two keyholes and a pull; inside it the credential as an object: Oracle a framed
  certificate with a blue seal, GitHub a hexagonal lime badge, Dyashin a rolled diploma with a
  tangerine ribbon, the 1st place a lime trophy) with the title, issuer · year and a Verify link
  (the award: what it was for, in Caveat). The facts are always on the box faces; only the drawings
  are locked away. **Locked until the visitor opens it** (his call): the door is a button
  ("Unlock the vault" / "Lock the vault again"); a note under it says "turn the wheel to open the
  vault" (phones: "tap the door"). Left open, it stays open on the next visit (localStorage
  "pmp:vault"); a refresh never flashes the other state (the boot script and globals.css draw it
  from the first paint). Below 1200px the door sits above the boxes; below 900px the boxes
  are one column.

**The repos editor** (`/repos`, "Repos" last in the header nav, the phone menu and the palette;
`src/app/repos` + `components/repos/{index,RepoEditor,editorData,books}`; data
`src/content/garden.{json,ts}` from `scripts/garden-data.mjs`; 2026-11-09). His pick from a list of
ideas ("code editor explorer"), with "no animation like the garden and the library, make it more
creative". It replaced the 3D library (`Library3D.tsx`, unmounted; "no need of this kind
animation"), which had replaced the garden (`components/garden`, unmounted). "All my repos" (display,
lime highlighter) and a plain intro, then **an editor window in the site's ink** (`data-tone="ink"`,
18px corners, hairline `seam` borders, `ink-2` chrome; JetBrains Mono for all its text, Bricolage
only for a README preview's title): a title bar (three dots in tangerine, lime, blue; the open file's
name), an activity bar (Explorer, Search, Timeline; the active one with a lime edge), the side bar,
tabs (up to six, closable), breadcrumbs, the editor, a terminal and a status bar. **Explorer**: the
workspace (his GitHub user) holds a README.md and a folder per language (a dot in the language's
colour: TypeScript blue, JavaScript lime, HTML tangerine, CSS blue-soft, notebooks fog, none ash; a
count), a folder per repo (a tangerine dot on the ones with a case study) and in each a README.md
and a repo.json. **A README** opens as source (line numbers, Markdown tokens: headings bold paper,
quotes fog italic, links blue-soft, URLs fog) beside its rendered preview (title, chips for language,
started, last push, stars, case study; the GitHub description as a quote; "Open on GitHub", "Read the
case study"); below 1280px the preview alone, with a Preview / Source switch. **repo.json** is the
repo's GitHub metadata highlighted (keys blue-soft, strings lime, numbers and null tangerine) with a
minimap (a bar per line in the token's colour; hidden on phones). **The workspace README** opens
first: the count, the years, a language bar (GitHub's kind, in the dots' colours) with percentages,
the five newest repos and the case studies. **Cursor**: a click on a line (or the minimap) puts the
cursor there: the line is marked, its number lights, and it carries a quiet note at its end as an
editor's blame would (when the repo was created and last pushed; on the workspace README the count
and the fetch date); the status bar follows (`Ln 8, Col 1`). **Search** filters by name, language
or description. **Timeline** is a git log: a commit per repo on the day it was created (`feat:
create <name>`, a short hash from its name, a dot in its language's colour on a line), newest first;
a click opens that README. **Terminal** (`prajwal@repos ~ $`): help, ls [language], open / cat
<repo> [json] (Tab completes a repo's name), git log, neofetch (the workspace at a glance: role, repos,
languages, first and latest repo, case studies, profile), whoami, clear; arrow keys for history;
errors in tangerine. **Status bar**: `main` in lime, the counts, 0 problems, Ln/Col, the file's
language, UTF-8, the fetch date. Below 768px the side bar takes the editor's place while open (the activity bar opens and closes
it; opening a file closes it). Every word in it comes from the GitHub data.
Sketch mode: the window turns to paper like every ink surface (its inner ink panes use the
`--color-ink` token, not `.bg-ink`, so they swap too) and pale-blue text turns blue-deep. Motion:
none beyond UI state (a chevron's turn) and a run's lines arriving. **Size**: the title sits in the content column; the window breaks out of it to the full width
(the page gutter only, up to 1920px; his: "use max width"). Nothing in it scrolls on its own (his:
"no need that scrolling, extend the height"): the window is as tall as what is open (the tree, the
git log, the file, the terminal's output) and the page scrolls; opening a file brings the tabs back
under the header when they are off screen, and a command keeps the prompt on screen. Below 768px the
side bar takes the editor's place while it is open. **Run** (his: a play icon in the left bar, and
"run", "npm run dev", "npm start" in the terminal; "cd <name>" changes the folder and running then
runs that app): a lime play button last in the activity bar opens **Run and debug** (a lime "Run
<repo>" button, the live repos each with a play glyph and their address, the count not deployed)
and runs the open repo (from the workspace README: the Portfolio repo, his live page). The terminal
prints `> <repo>@live dev`, "looking up the live build…", "✓ ready: served by GitHub Pages", `➜ Live:
<url>` (a line every ~220ms; at once with reduced motion), then a **browser tab** opens in the editor
(a globe icon, "<repo> · live"): reload, an address bar with a lock and the real URL, desktop / phone
width (the phone one is a 390px frame with 28px corners), "New tab"; the live page in a frame. The
live address is real: the repo's website field on GitHub or its GitHub Pages address, kept at build
time only if it answered (6 of 22: Portfolio, BookMyVenue, Livora, Valentine, Buddy, the
prajwalps2603.github.io root; LifeSync and College-Website have Pages switched on but answer 404, so
they are not live). A repo that is not deployed prints "✗ … isn't deployed" in tangerine and opens
a page that says so ("Nothing to open", its code on GitHub, the live ones to run instead); nothing is
marked running. While something runs: a tangerine dot and "running <repo>" in the status bar and the
terminal's header. Terminal: `cd <repo>` / `cd ..` (the prompt shows `~/<repo>`), `pwd`, `ls` in a
repo, `npm run dev` / `npm start` / `yarn dev` / `pnpm dev` / `bun dev` / `run [repo]`, `stop` or
Ctrl+C (closes the browser tab); Tab completes after open, cd and run. A README of a live repo has a
lime "npm run dev" button; the workspace README lists the live ones.

**The stack iceberg** (`stack/{index,Dive,IcebergArt,iceberg,Evidence,state,usedin}`). "My
stack, all the way down": a stack is an iceberg, users only see the interface. The Interface layer
is the tip above a hand-drawn waterline (paper); Server & APIs, Data, AI and Cloud & Delivery sit
in the ink sea beside their slice of the submerged body (seams mark where each slice begins); the
languages are the seabed, set huge. From 900px the ice is in an art column left of the rows, its
bulk leaning into the left margin, with a leader from each heading (it turns a corner when an open
Interface card drops the waterline). Below 900px the rows take the full width, the tip gets its
own band and the body is drawn quieter behind the rows (row text gets an ink backing). Every tool
is a button that opens a card under its own layer with where it was used (`usedIn` resolved to
case studies, roles, repos); Esc closes it; type-ahead (a letter opens and focuses the next tool)
works only while focus is inside the dive. Three Caveat notes from 900px: "what users see", "and
everything I build under it", "it all runs on these".
The sea surface is a rolling swell (`drawSurface` in `iceberg.ts`: a long wave, a shorter sea and a
chop with sharpened crests and flat troughs, whitecaps under the tall crests, a distant swell
behind, two quiet lines under it), recomputed from the scroll position, so it rolls while the page
moves and rests when it rests. A **diver** (`stack/Diver.tsx`; rig in `stack/diverRig.ts`: a
wetsuit body of tapered capsules, a buoyancy vest with a strap, a tank with its valve and hose, a
hooded head with a mask, gloves, a torch, long fins with foot pockets and rails, posed by angles
relative to the torso) stands ready on a ledge at the tip's right foot, a hand on his mask. As the
waterline passes mid-screen he takes a giant stride off the ledge, clear of the ice, and drops in
feet first (a splash); under the surface he pitches head down and moves out to his lane, ~46px off
the ice's right face and never into the rows (`laneMax`), then keeps to ~40% of the screen: torch
on the ice (a lime cone), kicking as the page moves, trailing bubbles. Scrolling up turns him
(through the horizontal, face down) to swim up head first, torch lighting the way. As the seabed
rises to 60% of the screen he rights himself and lands standing on it, torch down on the
languages. His place follows the scroll, eased (~0.12s), so wheel steps never jolt him; the frame
loop runs only while he is catching up.
A research **submarine** (`stack/Submarine.tsx`) cruises the gap between the Data and AI rows with
the scroll, propeller turning, trailing bubbles; its lights (portholes, a headlamp cone) come on with
one flicker as it comes into view. All of it is a function of the scroll (no loop, nothing moves on
its own); reduced motion and sketch mode park the diver on the ledge and the sub in its lane (lights
on; pencil in sketch mode). Both sit in the drawing's SVG, under the rows.

**The port** ("Also shipped", `work/AlsoShipped.tsx`, `work/port/{model,scene,PortScene,container,OpenContainer}`;
2026-11-07, it replaced the table-like list). The archive projects are shipping containers:
numbered 01-09, painted from a fixed cycle (blue-soft, ink, card, graphite, paper-2; paper
stencils on the dark ones), a tangerine LIVE placard when the project has a live site, and an owner
code like a real one (`PMPU` = PMP + the ISO 6346 freight category U, the year and number, and the
ISO 6346 check digit).
- **The drawing** (lazy, aria-hidden, laid out for the measured box): a faint skyline (sheds, two
  distant cranes), clouds and gulls; the quay (capping beam, rails, bollards, fenders, a ladder)
  with the yard (three stacks of three, other containers outlined behind); a ship-to-shore gantry
  crane painted lime (tapered box legs on wheeled bogies, sill and cross bracing, a zig-zag
  stairway, a box-girder boom with a walkway rail, the A-frame with a tangerine aviation light and
  double stays, the machinery house on the backreach, festoon loops and floodlights under the
  boom; the trolley with the operator's cab and the operator, hoist ropes, headblock, spreader);
  the MV SHIPPED (dark hull, raked bow, forecastle with foremast, rail and anchor, a white sheer
  line, tangerine boot-top, Plimsoll and draft marks, hatch covers, three bays of three, the
  accommodation block with its decks of windows, the bridge with a window band and wings, a radar
  mast, the funnel with a tangerine band and lime disc, a tangerine free-fall lifeboat on its
  ramp) in blue water. The names are stencilled on the containers from ~85px wide; below that
  only the numbers. A round pause control sits over the drawing's top right corner.
- **The yard list** (a tablist: one tab per container with its paint, number, name, a LiveDot
  when live; arrow keys, Home, End). A click on a container in the drawing selects its tab.
- **The opened container** (on a paper-dots panel): left, the tabpanel, a **bill of lading** on a
  clipboard (paper card tilted -1.2 degrees, an ink clip with a lime bar; "Bill of lading" label and the
  code; the project's title, category and year, line, summary, "Cargo: ..." and the source / live
  pills); right, the container itself in one-point perspective (`container.ts`): its paint on the
  frame, the doors (corrugated, two locking bars with keepers and handles, the seal) swung wide to
  115 degrees, the walls shaded per wall, a planked floor, and the box packed full: the stack as
  stencilled wooden crates in the front row (sized to their names, a tier at a time) and cartons
  stacked behind toward the ceiling (seeded per project). On phones the container comes first
  and the stack is repeated under it as crates (the stencils are small there).
Without JavaScript the drawings and the tabs are hidden and every bill of lading is listed.

**Career figures** (`changelog/{index,RoleFigure,figures,Medal,College}`; 2026-11-07). Every
card in "Career, as a changelog" has a panel beside its text from 1200px (as tall as the text, a
min height), under the summary below that (max 26rem): a sketchbook inset (`rounded-panel border
border-line bg-paper paper-dots`, aria-hidden; the card's text carries every fact). The panels hold:
- **A figure of each role's work** (`RoleFigure.tsx`, geometry in `figures.ts`, pure; lazy, loaded
  as the card comes near), drawn only from that role's highlights and stack, no numbers: *cloud*
  (Techbyheart) users reach EC2 through network security on AWS, EC2 uses RDS and S3, a threat (a
  bug) is knocked back at the shield ("blocked") and a vulnerability scan sweeps the account,
  ticking each resource; *ml* (Rooman) a notebook-style run (01 eda ... 05 tune, a lime band on the
  running step, ticks when done) beside a chart: the data lands, the outliers are struck out, a
  straight fit and its errors, then the tuned curve pulls the errors in, labelled "model" where it
  ends; *java* (Dyashin) a pull request on a blue branch is reviewed (lime check) and merged into
  main, then a request runs React, REST, Spring Boot, Hibernate, SQL, MySQL and back; *ops* (Maruti
  Flex) Google Sheets through Apps Script and MongoDB through a REST API feed a React / Next.js
  app on a laptop and a phone, which fills and goes live. Laid out for the measured box (1 unit =
  1px, labels 11-12px; from ~190 x 205 on a 360px phone to 360 x 440). Packets keep the diagram
  grammar (lime request, blue data, tangerine response) and run under the nodes.
- **The award's medal** (`Medal.tsx`): a lime "1st" disc in a scalloped rim on a lime-striped
  ribbon that runs off the panel's top edge.
- **The college** (`College.tsx`, the init card): a college front (steps, six columns, the
  pediment, a dark door), the four years on a line under it (2021 to 2025, lime when passed) and a
  graduation cap high in the air beside it, a dotted flight path down to the 2025 mark.
Clicks replay a figure (cursor "Replay"), swing the medal ("Swing it") or toss the cap again
("Toss the cap"). Sketch mode: the pencil drawings (figure labels stay mono, `data-sketch-skip`).

**Hero note** (`hero/DraggableNote.tsx`): the "Things I build" note is pickable (lift, tilt, soft
spring where dropped); the dashed wire is re-routed live and never crosses the note, fading when
no clear route exists. Arrow keys nudge, Esc / Home / double-click / "put back" return it.
Reduced motion: it follows the pointer 1:1, no lift, tilt or spring.

**The Prajwal Times** (`/resume`, `src/app/resume` + `components/times/{index,TimesBits,fonts}`, photos in
`public/times`; 2026-11-09). His pick from the eight mockups (idea 5), then: "remove the Résumé button,
in its place the Times; when I click it a new page opens with the résumé newspaper", "make it more
creative", "use images", "olden times paper", "Livora is my main project, not BookMyVenue", "clean,
no dots", "no empty space in a newspaper", "Indian edition". **Header:** the outline pill that was
Résumé is now a newspaper icon + "Prajwal Times" (just "Times" below 1440px, where the row is tight;
the header fits at 900-1440); the phone menu has it too; the palette has "The Prajwal Times
(résumé)". **The page:** "← Back to the site" and "Save as PDF" (the browser's print) above a sheet of
clean cream newsprint (`.times-paper`: the site's neutrals re-tinted inside it: paper #f5efe1, card
#faf6ec, paper-2 #ebe2cd, ink #1f1c16; a documented exception, like the garden painting was), tilted
0.35deg with a fold line across the middle **from 900px only**: on phones the paper is one long
column (~6000px), where the tilt pushed its top onto the screen's left edge and its bottom onto the
right, and the fold landed on a line of text like a strikethrough (his ask, 2026-11-10: "fix the
mobile view"); there it is straight, centred, no fold. The bottom row (comic, advertisement, puzzle)
is three columns from 1200px (1.75fr / 0.85fr / 1fr: the wider comic's strip comes within ~45px of
the puzzle's height, the advertisement stretches); from 600px the comic runs across (the strip
capped at 36rem, centred) and the other two share the row under it; the 4x4 sudoku shrinks to
its column (at most 9.5rem). Type: UnifrakturMaguntia (blackletter) for the masthead and
Newsreader (news serif) for the text, loaded only on this page (`times/fonts.ts`, next/font); mono
for kickers. **Masthead:** two ears (Forecast: "Clear skies. Good for shipping."; Price: "1 interview.
Bengaluru or wherever you are."), "The Prajwal Times" on one line, the dateline (today in Bengaluru;
the slogan; "Indian edition"), a Markets ticker (each skill and ▲ how many projects and jobs use it,
from `skillGroups.usedIn`). **Three columns, balanced** (the lead column is the naturally tallest;
the last boxes of the other two stretch, so no column ends short): the lead story (Livora: headline,
deck, byline; the about text with a drop cap beside a small photo of the live site and his own words
as the pull quote), Also in this issue (BookMyVenue and Buddy pictured; nine briefs in a 3x3 grid:
the six case studies and his HRMS, SRMS, Support Ticket System as "Also built", names only, from
`profile.alsoBuilt`), From the archive (the other site projects by name and year); Business (the four
roles with a chart of them over time, the current one with its summary), Education, Corrections
("Older copies of this résumé (the PDF) predate the current job..."), Notices (learning, focus, the
road so far), How I work (the practices, spread down the box); Classifieds (skills by layer,
certifications with verify links, a Directory of his profiles, Subscribe: the newsletter, the WANTED
ad: "A desk anywhere on the map. Bags packed for any city or time zone, ready for any software
development role. Apply within: email", with six tear-off tabs that copy the email). **Bottom row:**
Comics (sketch → build → ship), an Advertisement (What I build: the six capabilities, one per line),
the Puzzle corner (a 4x4 sudoku, a nod to his Sudoku Solver; **the reader solves it** (his ask,
2026-11-10): tap or Tab to an open square (blue), then a number on the 1-4 pad (a slim column beside the
grid, as tall as it, so it adds no row; it keeps its place when the puzzle is done), or
type 1-4 / Backspace / arrows; a repeat in a row, column or box turns tangerine and the status line
says so; a full, correct grid turns lime ("Solved!", "Play again"); "Solve it" still fills it by
backtracking and reports the tries, "Clear" starts over. An ARIA grid with a roving tabindex; the
grid lines are ink: bold for the boxes, thin between squares). A footer
with his links and an "Always up to date" postmark. Photos: real screenshots of the live sites, in
greyscale with a touch of sepia (no dot screen, at his ask). **Print:** one A4 sheet (root 8.2px, the
columns kept, the tabs and the bottom row left off). **Sketch:** dark boxes become pencil outlines.
Nothing moves on its own (a torn tab drops; none when reduced).

**The visiting card** (`components/card/{VisitingCard,CardPopup,contact}`, `src/content/cardQr.ts`
from `scripts/card-qr.mjs`; 2026-11-09, his pick "take my card", placed by him: "at the top I need my
visiting card, at the bottom the old timing"). In the contact section's right column: the card at
the top beside "Let's build something." (a paper card, 16px corners, a soft drop shadow, lying at
-9deg on wide screens and -4deg below; still: no hover motion, at his ask), the "Now" card (the
Bengaluru clock, role and availability) back at the bottom; on phones the card comes after the
socials, at most 25rem wide. **Front:** a pin and "Bengaluru, India", a tangerine dot, the name
(Bricolage 800) with a bright lime marker stroke under it (his ask: "use lime green"), the role and
company, the lime dot and "Open to new opportunities", the email (a mailto link) and the site.
**Back (lime):** the QR on a paper tile taped on at -3deg (the idea ticket's tape), round dots,
rounded finder eyes, the "PM" mark in the middle (an ink square, lime letters, the wordmark's
tangerine dot), "↖ scan me" in Caveat; "Scan for the whole story", a line, the address in a lime-on-
ink chip. The QR encodes `site.url`, generated at build (error correction Q so the mark can cover
the middle; dots at 0.48 of a module: smaller ones stopped decoding) and `verify-card.mjs` decodes
it from screenshots, flat and as it lies on the card. **Under it:** Flip (outline pill; the card
turns on its long edge, 0.65s; reduced motion swaps the sides), Save contact (lime pill: a vCard
3.0 file, `Prajwal-M-P.vcf`, with the name, role, company, email, site, LinkedIn and Bengaluru, never a
phone number), Share (a round icon button: the phone's share sheet, else copy the link), and a status
line. **The popup** ("Before you go / Take my card with you."): his ask was for the card to show when
a visitor closes the tab; browsers allow only their own "Leave site?" box on close, so it is exit
intent: on a mouse, after 6s on the page, when the pointer leaves through the top edge, once per
visit, never over another dialog, never on touch screens. An ink dialog over a 70% ink scrim, the
untilted card, Esc / the close button / a click outside close it, Tab stays inside, focus returns.
The palette has "Take my card" (opens it) and "Save my contact" (downloads the .vcf).

**Idea ticket** (`contact/IdeaTicket.tsx`): "Sketch your idea" on a sticky note (120 characters);
shipping it compiles the note into a ticket with a "Drafted" stamp and opens a prefilled `mailto:`
(subject "Let's build: <idea>"), with a copy-email button beside it. The hero has a "Newsletter" outline pill
(LinkedIn icon) after Résumé: his LinkedIn newsletter, AI & Software Insights, subscribe link (`profile.newsletter`). No server, nothing is stored or sent by the
page. Sketch mode keeps the note a sketch; reduced motion shows the finished ticket at once. Under
it: "Hiring, or a bigger project?" and "Create a pull request" (outline pill), to `/pull-request`.

**The ship floats** (the "Also shipped" port, `work/port/{PortScene,scene}.ts(x)`; 2026-11-10, his ask:
"when the crane drops the container into the ship, the ship needs a movement, because the container
has weight and it is in water"). The ship's parts are one SVG group that heaves (px) and pitches
(degrees) about the middle of its waterline (`L.float`), driven by a small spring model in the
crane's frame loop: it rides the drawn waves (the mean surface under the hull, the slope bow to
stern, `surfaceAt`, plus a slow swell); each container set down kicks it down (about 0.11 of a
container's height, 4-5px on desktop) and tips it toward where the box landed, then it bobs back and
settles in about 2s (heave 6.5 rad/s, damping 0.22; pitch 5.2 rad/s, 0.25); lifting a box off makes
it rise; loaded it rests lower (0.012 container heights per box) and trims toward its load. A landing
sends ripples out from the hull's ends along the sea and the swell lines (gone in about 2s). The
containers aboard ride with it (their transform is the ship's, then their slot), the crane sets each
box down on the moving deck (the spreader follows the deck under that slot while it is at the ship),
the SHIPPED stamp sits in a layer that moves with the hull, and the mooring lines are redrawn from
the bollards to the moving fairleads. The pause control and the play gate stop it with the crane;
reduced motion and sketch mode: the ship does not move. Cost on his GPU: about 0.5ms a frame.

**The sketchbook** (sketch mode only; `components/sketchbook/{index,SketchbookImpl}`, loaded the first
time sketch mode turns on; globals.css "THE SKETCHBOOK"; 2026-11-10, his ask: "in sketch mode I should
be able to draw anywhere, like a book"). A press and drag on anything that is not a link or a control
(nor the header, a dialog, the draggable sticky note) draws; a plain click leaves no mark and does
what it did; the click that ends a stroke is swallowed; no text gets selected while drawing. A mouse
or a pen draws at once (the pencil is picked); on touch screens the hand is picked (a finger
scrolls) and picking a pencil hands the finger to drawing (`html.sk-drawing`: touch-action none).
**Tools** (a hand-drawn pill at the bottom, "sketchbook" in Caveat, 44px round buttons, the picked
one lime-hatched, a colour dot on the inks): hand, pencil (graphite #2a2a27, 2.1px), pen (blue ink
#2c44d8, 2.6px), marker (lime #c8f53b, 16px at 55%), eraser (takes whole strokes it touches), undo
(Ctrl+Z; redo Ctrl+Y / Ctrl+Shift+Z) and clear (undoable). The custom cursor's pencil turns over for
the eraser; without the custom cursor (lite, reduced motion) a pencil or eraser cursor. A one-time
Caveat hint: "press and drag anywhere to draw" / "pick a pencil, then draw with a finger". **Where the
drawings live:** one SVG over the whole document (pointer-events none, z 55: over the page, under the
header); each stroke is pinned to the block of the page it started on (a child of `<main>` or the
footer) and to the centre line, so it stays with its section as the layout changes; kept in
localStorage per page and per layout ("pmp:sketchbook:wide|narrow:/path"; wide from 900px), so phone
drawings belong to the phone layout; nothing leaves the browser. Shown only in sketch mode.

**Light and dark mode** (`src/lib/stores/theme.ts`, `components/chrome/ThemeToggle.tsx`, globals.css "DARK
MODE"; 2026-11-10, his ask: "I need light mode and dark mode"). `html[data-theme="dark"]` is dark,
light has no attribute. Set before the first paint by the boot script: the visitor's choice
(localStorage "pmp:theme") or the computer's setting, followed live until the visitor chooses. The
switch: a round 44px button left of the sketch pencil in the header (phones too), a moon in light
mode, a sun in dark, `aria-pressed`, "Dark mode"; the palette has "Turn dark mode on/off"; switching
crossfades (a view transition, 260ms; at once with reduced motion or in lite mode); `theme-color`
follows. **The dark palette** re-tints the same tokens: paper #11110f, paper-2 #181816, card #1c1c1a,
ink #ecebe3 (text), graphite #adaca2, lines #2a2a27 / #3c3c38, the page dots at 13% light; accent TEXT
shades lighten (lime-deep = lime, blue-deep #a5b3ff, tangerine-deep #ff8d5c, blue #6d83ff) and the
soft washes darken (lime-soft #2a350f, blue-soft #222a52, tangerine-soft #3a2216). **Ink slabs** stay
dark panels a step up from the page (#1e1e1c, raised #282826) and inside them the light-mode values
return, so light cards in them (the vault boxes, the visiting card) stay light. On lime and
tangerine the text stays dark (`bg-lime`, `bg-tangerine`, `.pill-lime`, a selected container tab, a
hovered note button, and the floods marked `data-flood="lime"`: an open "What I build" row, the lit
stack-map boxes, which also set `color` so inheriting text follows); filled blue stays the deep
#3d5afe under light text (the calendar day, the work view switch). The lime highlighter's words turn
dark as the band paints. The cursor drops its multiply on dark (a faint accent wash instead); the
lens canvas draws light dots; the card popup's scrim is a fixed dark. **Unchanged in dark:** sketch
mode (the paper drawing; every dark rule is `:not([data-sketch])`, the theme button loses the
pencil's lime hatching there), the newspaper (`.times-paper` keeps every light value). Checked with
`verify-contrast.mjs`: every text on six pages >= 4.5:1 in both themes.

**Lite mode: smoother on older computers** (`src/lib/perf.ts`, `html.lite`; 2026-11-09, his ask: "it's
getting lag, make it smoother"). Measured on his machine's GPU (GeForce GT 610, Edge): the main
thread is light (home page load TBT ~170 ms, one hydration task; scrolling ~0.1 s of long tasks per
full-page scroll), so the lag is GPU work per frame. On a weak graphics card the site keeps every bit
of content and motion and drops only what the GPU redraws every frame: the JS smooth scroll (Lenis:
native scrolling runs on the compositor and stays smooth when the page is busy), the custom cursor
(the native one instead) and the paper-grid lens canvas. Decided before the first paint by the boot
script: a throwaway WebGL context's renderer name against weak and software GPUs (old GeForce GT /
8-9 series, old Intel HD Graphics up to 5500, old Radeon HD / R5 / R7, old mobile GPUs,
SwiftShader / llvmpipe / Basic Render) or 2 CPU cores; remembered in localStorage "pmp:lite". A frame
watch (`PerfWatch` in the layout) times the first ~1.5 s of scrolling and switches any other machine
under ~40 fps to lite. The palette has "Turn lite mode on / off" (remembered, and the watch then
leaves it alone). For everyone: the header bar lost its backdrop blur (it was 92% opaque; the blur
re-rendered every scroll frame), now solid paper at 97%. Text fields show focus with their own lime
border (no doubled blue ring); the text caret is lime (bright on ink, lime-deep on paper).

**3D only while moving** (his GeForce GT 610 in Edge left stale paint around the Certifications slab
while scrolling and under the cursor, only when the vault was closed): the closed vault is flat (from
the first paint and in the "locked" phase: the door's transform none and its edge layers hidden, the
box doors flat; `globals.css`); the visiting card is flat at rest (only the visible side, no 3D) and
3D only during the 0.65s flip (Web Animations). The README's Preview/Code switch: the selected tab
kept its text on hover (`aria-selected:hocus:text-paper`; the hover made it ink on ink).

**Ink slabs clip with a rounded clip-path** (`slab-clip` in globals.css, on `Section`'s ink slab and
the certifications slab) as well as `overflow: hidden`: in Edge, the vault's 3D door and deposit-box
doors left a stale copy of the slab's edge on screen while scrolling (his report, the Certifications &
awards container). The sketch turns the clip-path off (its pencil box sits just outside the edge).

**Contact as a pull request** (`/pull-request`, `src/app/pull-request` +
`components/pullrequest/{index,PullRequestForm}`; reached from the contact section's "Create a pull
request" button under "Ship it" and from the palette, not the header; 2026-11-09, his pick from the
ideas list, then "a button called create a pull request ... it opens the pull request page"). "Open
a pull request" (display, lime highlighter), "Back to contact" above it, a plain intro, then a PR
window in ink (18px corners): **the compare bar** (`base: prajwal/main <- compare: you/<the title in
kebab-case, whole words, ~32 characters>`, "Able to merge. I reply to every email." in lime, "1
commit, 1 file changed, +1 idea"); **the title** (required: an empty one is refused with a tangerine
border, a message and focus); **the description** with Write / Preview tabs (a "## What / ## Details /
-" template to start from, 1500 characters; Preview renders headings, lists and paragraphs); **the
side bar** (Reviewers: Prajwal M P, "requested"; Labels to toggle: Full-time blue, Freelance lime,
Collab tangerine, outlined, filled when on with a check; Milestone: ASAP / This month / Just
exploring, radio buttons in lime); **Create pull request** (a lime split pill) opens the visitor's
email app with a `mailto:` to him: subject `[PR][labels] title`, the description, then `Labels:` and
`When:` lines. The caret holds "Create draft pull request" (`[Draft PR] title`, a hello with no
details) and "Copy as text" (To, Subject and body, for webmail). After creating, the note says what
happened and how to copy instead. Nothing is sent or stored by the site. On phones the side bar comes
before the button. No motion beyond the caret turning. The contact section's idea ticket stays; under
it a hairline, "Hiring, or a bigger project?" and an outline pill with a branch icon: "Create a pull
request".

---

## 9. Cursor contract (fine pointers + full motion only)

An ink dot (1:1) and a 34px ring (eased lag). Over anything interactive (`a`, `button`,
`[role=button]`, `[data-cursor]`, …) the ring grows and fills with the element's accent like a
highlighter (multiply on paper; a lime ring with a faint wash on ink). Attributes on the element
or an ancestor:

| Attribute | Effect |
|---|---|
| (none) on a link / button | lime fill |
| `data-cursor="lime" | "blue" | "tangerine"` | fill colour (blue for code/repo, tangerine for live/shipped) |
| `data-cursor-label="View case study"` | the ring becomes an ink pill with this mono label |
| `data-cursor="native"` | hide the custom cursor here, show the native one (canvases with their own affordance) |
| `data-cursor="hide"` | hide both |

Text fields always get the native cursor. The label is a hint only: the element still says what it
does in its own text or accessible name. Touch and reduced motion keep the native cursor, and never
download the cursor: `<Cursor>` is a tiny gate, the implementation (`cursor/CursorImpl.tsx`) is a
lazy chunk fetched after hydration on fine pointers with full motion (root `data-qa="cursor"`).

The hero stage window uses `data-cursor="native"` while its lens is on, not a label: the lens is
its own pointer affordance, and a label pill (drawn below the pointer) would cover a third of
the 140px lens. The work stage keeps its label.

---

## 10. Page transitions

`<TransitionLink href label>` (or `<Pill href label>`) for every internal page link. A paper sheet
with hand-cut pencil edges slides across carrying the destination in Caveat (`label`, default
from the path), the route changes under it, then it uncovers the new page. Reduced motion: none.

**Prefetch: on intent, never on view.** In a static export Next prefetches a route with a HEAD
probe of the page (Chromium logs it as `net::ERR_ABORTED` even when it succeeds) plus three
segment files (`__next._tree.txt`, `__next._index.txt`, the page segment). Viewport prefetch put
that on every home load for each case-study link on screen (the hero window as it cycles, the work
stage). So `TransitionLink` defaults to `prefetch={false}` and warms its route when a pointer
MOVES onto it and rests for 90ms, on focus and on touchstart (once per destination); the sheet's
0.46s cover hides the fetch. The hover timer is armed by `mousemove`, never `mouseenter`: a link
that scrolls under a still pointer gets enter events but no move (checked in Chromium), so a
wheel scroll through the work section no longer warms the case studies it passes (before: one
HEAD probe, logged `ERR_ABORTED`, plus three segment files per link it stopped on).
Pass `prefetch` only for a link that is the obvious next step and rarely hovered.
On the destination: `const { arrival, ready } = usePageArrival()` (`arrival`: "load" | "sheet" |
"history" | "plain"). Coming back home from a case study sets `stage.returnFrom = slug` (the work
section may pre-select it, then clear it with `stage.set({ returnFrom: null })`).

---

## 11. Shell, ids, sections

Layout order: boot script → `SmoothScroll` → `TransitionProvider` → `SkipLink`, `Background`,
`Header`, `<main id="main">`, `Footer`, `Cursor`, `CommandPalette`.

**Header:** wordmark "Prajwal M P" + tangerine `LiveDot` (hover draws a tangerine swash) · Work ·
Stack · Experience · About · Contact (lime highlighter band on hover, focus and the active
section, from `stage.activeSection`) · then the actions: the **sketch-mode pencil** (44px,
`aria-pressed`, Caveat tip on hover / focus that stays down after a switch until the next hover or
focus (`data-tip-muted`; a tap's confirmation still shows); no stamp lands under it any more) · `PaletteTrigger` (contract 6, just before the desktop actions) · Résumé (outline pill) ·
Let's talk (ink pill → `#contact`, from 1200px: below that the row would overflow and "Contact"
is the same link). Transparent at the top, translucent paper + blur once scrolled. Below 900px:
wordmark + theme + pencil + palette + Menu → full-screen paper menu (big Bricolage
links each with its own highlighter, socials, résumé, "Open the terminal", a "Now:" line). **It fits
every phone** (the row ran off the right edge at 320-375px and 400-430px until 2026-11-10): Menu is
icon only below 480px; below 400px the palette button leaves the row (the menu's "Open the
terminal" opens it) and the buttons sit 6px apart; below 360px the wordmark is 19px. Every button
stays 44px; the row keeps the page margin on both sides (`verify-mobile.mjs`). focus-trapped, Esc closes,
scroll locked, rest of the page inert. The panel (`chrome/MobileMenuPanel.tsx`) is a lazy chunk:
desktops never fetch it; compact screens fetch it on idle, or on the toggle's press / focus,
whichever comes first (an empty hidden `#site-menu` keeps `aria-controls` valid until then).
QA hooks: `data-qa="menu-toggle"`, `data-qa="menu-panel"`.

| id | Section | Tone | Owner | Component |
|---|---|---|---|---|
| `top` | 01 Hero (+ the opening) | paper | hero | `Hero` (+ `Intro`) |
| `build` | 02 What I build | paper | build | `BuildSection` (a Server Component; client island `BuildBody`, the live stack map, lazy `engine.ts`) |
| `work` | 03 Selected work | paper-2 | work | `Work` (stage + cards, Interface / Architecture sides; the diagram engine is a lazy chunk) |
| `stack` | 04 Stack | paper, then the ink sea | stack | `Stack` (a Server Component; client island `Dive`, lazy `IcebergArt`) |
| `changelog` | 05 Experience | paper | changelog | `Changelog` |
| `about` | 06 About | paper | about | `About` |
| `contact` | 07 Contact | ink slab | contact | `Contact` |
| — | footer | paper | contact | `Footer` (keep `<MotionToggle />` and the `PaletteHint`, the palette's visible cue) |

Nav labels: `build` and `top` are not in the nav; `changelog` reads "Experience".
The 404 (`not-found.tsx`): "This page never shipped." with a sketched broken window.

---

## 12. Accessibility checklist (every builder)

- Landmarks come from the layout; your section is a `<Section>` with `labelledBy` → its heading.
- Logical heading levels: h2 per section, h3 inside, never skip.
- Focus: the global ring (2px blue, 3px offset) must never be removed; give custom shapes
  `rounded-*` so the ring follows them.
- Every hover reveal has a tap and keyboard twin (`hocus:` variant = hover OR focus-visible;
  `group-focus-visible:`; tap toggles on touch).
- Canvases and sketch SVGs are `aria-hidden` with a DOM equivalent for every interaction.
- External links announced (ExternalLink / Pill do it). Icon-only controls have `label`.
- `aria-live="polite"` for content that changes on selection (stack panel, copy feedback).
- Reduced motion: check your section with `--reduced-motion` captures.

## 13. Performance budget

- Fonts: ~231 KB woff2 total (4 families, preloaded). Do not add fonts.
- JS: no 3D library since the keyboard went (2026-11-07): everything is DOM + SVG + GSAP. No new
  dependencies without a reason in openIssues.
- Canvases: DPR via `dprForTier(getQualityTier())`, `frameloop="demand"` / rAF only while needed,
  pause offscreen (`useInView`) and when `document.hidden`, dispose on unmount.
- Animate transforms, opacity, clip-path, stroke-dashoffset; never layout properties in loops.
- Images (if any) through `asset()`; reserve their box (aspect-ratio).
- **The creative layer's budget:** at most ~25 KB gzip on the home page's first-load JS for all the
  new features together. Everything else loads later (13.3). Current figures: 13.2.

### 13.1 Measuring first-load JS

Always from a production export, never from `next dev`. Two numbers:

1. **Bytes on the wire.** Sum the `<script src>` tags of each exported HTML file, gzip level 9
   (GitHub Pages serves gzip). Count module scripts only: every page also lists the `noModule`
   polyfill chunk (110 KB raw, 38.6 KiB gzip), which modern browsers never fetch. (The round-1
   review's "339 KB" was decimal kB of all tags, polyfill included: 292.7 KiB of real first load.)
2. **Who owns the bytes.** Turbopack's analyzer knows every module of every chunk:

   ```bash
   npx next analyze --output --snapshot audit          # ~10 s, writes .next/diagnostics/analyze only
   npx next analyze export --snapshot audit > graph.jsonl
   ```

   Per route, `group` records give each client chunk's kind: `bootstrap` and `render_dependent`
   are the first load, `async` is a `next/dynamic` / `import()` chunk (with its trigger module).
   `part` records give each module's bytes in each chunk: `size` (raw, minified) and
   `compressed_size` (each module compressed on its own: about 25% above the real gzip of the
   chunk, so use it to attribute and compare, not to total). Neither command writes `out/`; while
   others are building, run them (and any test export) in a scratch copy of the project with a
   `node_modules` junction and `turbopack.root` set to a common parent.

### 13.2 Audit (refinement round 1, 2026-11-06)

First-load module scripts, gzip -9:

| Route | Baseline (the reviewed 19:55 export) | After (this round, `/Portfolio` build) |
|---|---|---|
| `/` | 14 files, 909.0 KB raw / **292.7 KiB** | 14 files, 874.0 KB raw / **281.2 KiB** (−11.5) |
| `/work/[slug]` | 12 files, 782.2 KB / **250.3 KiB** | 12 files, 740.9 KB / **236.0 KiB** (−14.3) |
| 404 | 10 files, 699.7 KB / **224.3 KiB** | 10 files, 654.9 KB / **209.4 KiB** (−14.9) |

"After" includes the other builders' work of the same hour; the foundation's own share, measured
with the analyzer on an identical tree (module bytes, raw / compressed):

| Moved off the first load | Raw | Compr. | Loads now |
|---|---|---|---|
| GSAP SplitText + CustomEase + its path parser, no longer registered in `lib/motion/gsap.ts` (Turbopack drops the unused re-exports), less the native cubic-bezier that now draws "pen" | −13.1 KB | −6.4 KB | never on these pages; only with a module that registers them |
| Lenis | −18.2 KB | −5.3 KB | after hydration on fine pointers; touch screens scroll natively |
| Cursor implementation (+ the pointer bus, which only it uses here) | −6.0 KB | −2.2 KB | after hydration, fine pointer + full motion only |
| Mobile menu panel (net of its shell and `lib/idle`) | −4.2 KB | −1.6 KB | on idle below 900px, or on the toggle's press / focus |
| Sketch-mode wipe (net of the warm-up hooks) | −1.9 KB | −0.9 KB | on the first switch (warmed on the toggle's hover / focus / press) |
| **Total** (with ±0.1 KB elsewhere) | **−42.8 KB** | **−16.3 KB** | |

Where the creative layer loads on `/` (compressed module bytes; ≈ ×0.8 for real gzip):

| Feature | First load | Later | How |
|---|---|---|---|
| Architecture diagram (`diagram/*`, `ArchitectureWindow`) | 1.1 KB (ViewSwitch + view store) | 17.8 KB | `next/dynamic` when the Work stage turns to Architecture |
| 3D keyboard (removed 2026-11-07: the stack is now an SVG iceberg, see below) | 0 | was one chunk, 245.8 KiB gzip (three.js + R3F) | no longer exists |
| Command palette | 1.9 KB (the shim: Ctrl/⌘K and "/" listener, trigger, store, footer hint) | 9.3 KB (body, commands, fuzzy search) | first open; warmed on trigger hover / focus / touch |
| Live stack map | 3.8 KB (the static map shell) | 6.0 KB (engine) | `import()` near the section |
| Sketch mode | 2.6 KB (store, toggle, margin notes) | 1.1 KB (the wipe) | first switch |
| Throwable stickers (replaced 2026-11-07; the vault holds the credentials now) | 3.9 KB | — | eager (about) |
| Draggable hero note | 3.5 KB | — | eager (hero) |
| Idea ticket | 3.0 KB | — | eager (contact) |
| **On the first load** | **20.0 KB compressed (45.7 KB raw), ≈ 16 KiB gzip** | | inside the 25 KB budget |

On case studies the request journey (`casestudy/journey/*`, `HowItWorks`, `content/journeys`) is
first load: 13.9 KB compressed (37.4 KB raw), below the fold. The largest first-load items overall
are not the creative layer: the Next runtime (93 KB compressed), react-dom (64), GSAP core +
ScrollTrigger + CSSPlugin + Observer (44), Motion's `m` components + AnimatePresence (26, for three
state swaps: the stack map's handwritten line, the contact copy button, the stack panel) and
`content/projects.ts` (5.6: whole project records, case-study fields included).

**Round 2 (2026-11-06, 22:30): the creative layer's real gzip, by counterfactual.** No pre-layer
tree was kept, so the layer was measured as a diff of two `/Portfolio` exports built from ONE
source snapshot in scratch copies (§13.1): the tree as it is, and the same tree with the layer
stubbed out (palette → no-op exports, sketch-mode store → always off, `SketchToggle`,
`SketchNote`, `ViewSwitch`, `StackMap`, `HandPath`, `IdeaTicket` and `Stickers` → `null`,
`DraggableNote` → the note and its wire, static). First-load module scripts, gzip -9
(`tools/bundle2.mjs`):

| Route | Layer stubbed | As built | Layer costs |
|---|---|---|---|
| `/` | 13 files, 826.9 KB raw / 265.3 KiB | 14 files, 874.3 KB raw / **281.4 KiB** | **+16.1 KiB** (+47.4 KB raw) |
| `/work/[slug]` | 11 files / 232.0 KiB | 12 files / 236.1 KiB | +4.1 KiB |
| 404 | 10 files / 205.1 KiB | 10 files / 209.5 KiB | +4.4 KiB |

+16.1 KiB is an upper bound (the `Stickers` and `DraggableNote` stubs also drop the plainer
versions those surfaces had before the layer), inside the ~25 KB allowance, so nothing had to
move. The analyzer on the same snapshot agrees: 47.1 KB raw / 20.4 KB part-compressed on `/`
(sketch mode 2.6, palette shim 1.9, view switch 1.3, stack map shell 3.8, stickers 4.0, idea
ticket 3.2, hero note 3.5). Against the build before the layer (the 17:48 integration export,
`integ-prev.json`: "340.9 KB gzip across 12 scripts", a KiB count that includes the 38.6 KiB
noModule polyfill, so ≈ 302.3 KiB of module scripts), the home page now loads ≈ 21 KiB LESS JS:
the integration's split and round 1's moves (§13.2 above) paid for the layer. The layer also adds
2.2 KiB of CSS gzip (28.1 vs 25.9, mostly sketch mode) and 7.1 KiB of home HTML gzip (48.2 vs
41.1, its server-rendered markup). Lazy, not counted above (analyzer, part-compressed): the
diagram + Architecture window 19.1 KB, the palette body 9.5, the map engine 6.0, the sketch wipe
1.1; the 3D keyboard chunk was 246.0 KiB real gzip (removed 2026-11-07).

**2026-11-07, the stack iceberg and the certificates:** the 3D keyboard, three.js and R3F were
removed, and their 246 KiB lazy chunk with them; the certificates on a line replaced the sticker
physics. First-load module scripts: `/` 14 files, 891.5 KB raw / **279.8 KiB** gzip (281.6 before),
`/work/[slug]` 236.3 KiB, 404 209.7 KiB. The iceberg drawing (`IcebergArt`, `iceberg.ts`, the
diver and the submarine) is one lazy chunk, 8.6 KiB gzip, fetched when the section is near.

### 13.3 Rules: later than first load

Nothing that is invisible in the first viewport, or not needed for the first interaction, rides on
the first load. Pick the latest moment that still feels instant:

- **On first use:** `import()` inside the handler, warmed on `pointerenter` / `focus` /
  `pointerdown` so the chunk is there before the click lands (the palette body, the sketch wipe).
  Always-on listeners (a global shortcut) stay a few lines in an always-loaded shim.
- **Near the viewport:** `useInView(ref, { rootMargin: "1000px 0px", once: true })`, then render a
  `dynamic(() => import("./Heavy"), { ssr: false, loading: Shell })`. `Shell` is the static twin in
  the same box (server-rendered, readable without JS), so nothing shifts when the real one swaps in.
- **On idle:** `useIdle()` / `onIdle()` from `@/lib/idle` (the menu panel).
- **Device-gated:** import nothing where it cannot be used (the cursor: fine pointer + full
  motion; Lenis: fine pointers).
- **GSAP plugins** are registered where they are used, never in `lib/motion/gsap.ts` (MOTION.md §3).
- **Links** warm routes on intent, not on view (§10).
- Re-measure (13.1) after adding anything, and update 13.2.

## 14. Do / Don't

| Do | Don't |
|---|---|
| Heavy, tight Bricolage headlines with one highlighter word | gradient text, outlined text, all-caps paragraphs |
| Handwritten notes that state real facts in his voice | invented quotes, metrics, "trusted by" |
| Crisp cards with real content + one sketch annotation | sketch strokes on everything (the sketch is the seasoning) |
| `Label` for a status / file name | a label stacked above every heading |
| Numbered rows only in "What I build" | 01/02/03 section numbers elsewhere |
| Tags for stacks | skill bars, percentages, ratings |
| `LiveDot` + "Now: …" text | a pulsing dot with no words |
| One authored moment per section (MOTION.md) | the same fade-up on every block |
