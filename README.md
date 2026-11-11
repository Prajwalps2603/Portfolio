<div align="center">

# ✏️ → 🚀 Prajwal M P

### Sketch → Ship

**A portfolio that draws itself, then compiles into real software.**

[**Live site**](https://prajwalps2603.github.io/Portfolio/) ·
[Case studies](https://prajwalps2603.github.io/Portfolio/work/) ·
[Résumé](https://prajwalps2603.github.io/Portfolio/resume/)

`Next.js 16` · `React 19` · `TypeScript` · `Tailwind 4` · `GSAP` · `Static export`

</div>

---

## The idea

Prajwal is a Full Stack Developer, and his work is taking an idea from a rough sketch to software
people use. So the site does exactly that. Every screen pairs a hand-drawn **sketch layer**
(pencil strokes, Caveat handwriting, highlighters, sticky notes) with a crisp **shipped layer**
(cards, real UI, mono labels).

- 🖊️ **The opening** draws the whole hero in pencil, then ships it.
- 🪟 **The hero's app window** cycles through real projects, each one sketched and then compiled.
- 📖 **Every case study** opens with its own sketch → ship.
- 🧊 **The stack is an iceberg**: the interface is the tip, everything else sits under the waterline,
  with a diver and a submarine for company.

> v2.0.0 is a complete rewrite and replaces the earlier portfolio in this repository.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to out/
```

Requires Node 20.9 or newer.

## Project layout

| Path | Holds |
|---|---|
| `src/app` | App Router routes: home, `/work/[slug]`, `/repos`, `/pull-request`, `/resume`, 404, social card |
| `src/components` | Sections and the sketch, mini-UI, stack, diagram and motion systems |
| `src/content` | Typed content: profile, projects, skills, experience, GitHub snapshot |
| `src/lib` | Route and base-path helpers, OG card |
| `scripts` | Build helpers: GitHub data, QR code, RSC flattening, preview server |
| `docs` | Design, motion and deploy notes; QA tooling |

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict)
- Tailwind CSS 4 (CSS-first `@theme` in `src/app/globals.css`): paper and ink plus three
  highlighters (lime = build, blue = code, tangerine = shipped / live / now)
- Fonts via `next/font`, self-hosted: Bricolage Grotesque (display), Inter (text), JetBrains Mono
  (labels and data), Caveat (handwriting)
- GSAP 3.15 (ScrollTrigger, SplitText, CustomEase) with `@gsap/react`, and Lenis smooth scroll:
  the opening, the sketch → ship compiles, the highlighter swipes, the changelog branch line and
  the page sheet between pages
- One seeded rough-path generator (`src/components/sketch/rough.ts`, no library) draws every
  sketch stroke, identically on the server and the client
- Mini-UIs (`src/components/miniui`): six small, real-feeling interfaces of the featured projects
  (editor, chat, phone, calendar, scan, pipeline), each rendered from one element list as a
  sketch and as shipped UI, so the compile is a per-element transform
- The stack section is an iceberg (`src/components/stack`): the Interface layer is the tip above
  the waterline, Server & APIs, Data, AI and Cloud & Delivery sit under it in the ink sea, and the
  languages are the seabed. The drawing is one SVG computed from the measured layout by the same
  rough-path generator (`iceberg.ts`); as you scroll, each layer's slice sketches itself in pencil,
  is inked over and fills, and its tools surface. Every tool opens a card listing where it was
  used. The waves roll as you scroll; a diver dives in off a ledge on the tip and follows the scroll
  down the ice with his torch on it, and a small submarine with its lights on cruises between the
  layers. No 3D library: the site is DOM + SVG + GSAP.
- Motion (`motion/react`) for React state swaps: the stack cards, copy → "Copied", menus
- The creative layer (diagram engine, case-study journey, stack map, command palette, sketch mode,
  the stack iceberg, the port, career figures, the about trio, idea ticket) is described below
- Static export (`output: "export"`, `trailingSlash: true`), no server code

## The creative layer

Built on top of the Sketch → Ship base; each piece has a one-line contract in `docs/DESIGN.md`
section 8.1 and its motion in `docs/MOTION.md`.

- **Diagram engine** (`src/components/diagram`, lazy): one engine draws a project's architecture
  as lanes (layers) and cards (real technologies) with hand-drawn edges, then runs its real `flow`
  as packets: lime = request, blue = data, tangerine = response. Layout and routing are pure TS (`geometry.ts`), specs come from `src/content`
  (`projectDiagram`). Used in the Work stage's "Architecture" side. Nodes are real buttons with
  hover / focus / pin notes; loops pause offscreen, on hover and with a visible pause control.
- **Case-study journey** ("How it works", `src/components/casestudy/journey`): the same grammar,
  driven by scroll. A packet travels the project's flow, every stop compiles from sketch to card as
  it arrives, and a tangerine response returns. Pinned board at 900px and up,
  vertical rail below. Step text lives in `src/content/journeys.ts`.
- **Stack map** (`src/components/build`, "What I build"): Interface → Deploy as a live map of the
  technologies in `skills.ts`; a capability row or a node lights its path. Engine is lazy.
- **Command palette** (Ctrl/Cmd+K or "/", `src/components/palette`): fuzzy search over sections,
  case studies and actions (show how my projects are built, copy email, résumé, GitHub, LinkedIn,
  send an email, toggle sketch mode, toggle motion), plus terminal commands generated from the
  content: `whoami`, `ls projects`, `git log --oneline`, `cat stack.txt`, `npm run hire-prajwal`,
  `help`, `clear`. A tiny shim is always loaded; the body loads on first open.
- **Sketch mode** (pencil toggle in the header, or the palette): turns the whole site back into
  its sketch. Rules: the wipe is a View Transition lens growing from the toggle (instant with
  reduced motion); `html[data-sketch]` redraws shared surfaces in CSS (notebook grid, Caveat
  type, pencil outlines, hatched accents); components with a sketch/ship pair read
  `useSketchMode()`; `data-sketch-skip` opts a subtree out; session only, never on by default.
- **The port** ("Also shipped", `src/components/work/port`): the archive projects are shipping
  containers in a container terminal, numbered and stencilled, with a real-looking owner code.
  A lime ship-to-shore crane (with its operator in the cab) loads them from the yard onto the
  MV SHIPPED one by one, on its own; with all nine aboard the SHIPPED stamp lands, then it
  unloads them and starts again (a pause button stops it). The yard list under it opens any
  container (tabs, arrow keys, or a click in the drawing): a bill of lading on a clipboard beside
  the container itself, doors swung wide, packed with the project's stack as stencilled crates.
- **Career figures** (`src/components/changelog`): every card in "Career, as a changelog" has a
  small animated drawing beside it that plays once as it arrives. Each role gets a figure of its
  own work, drawn from its stack (an AWS account guarded against a threat and scanned; a model
  pipeline fitting a curve; a reviewed pull request merged, then a request down React, Spring
  Boot, Hibernate and MySQL; Sheets and MongoDB feeding a live Next.js app on laptop and phone);
  the 1st-place award gets a medal that swings on its ribbon; the degree gets the college, its
  four years and a graduation cap tossed into the air. Click any of them to play it again.
- **About** (`src/components/about`): the README in a file viewer ("Preview | Code"; it renders
  itself from its markdown source the first time you see it); "The road so far", a hand-drawn map
  of Karnataka where a little bus drives Koppa -> Sullia -> Bengaluru and punches a ticket at each
  stop (schooling, the degree and the award, the current role); and the credentials in a bank vault, locked
  until you open it: click (or, with a mouse, turn) the wheel on its round door and the dial
  spins, the bolts pull back, the door swings open on the lit strongroom and the deposit boxes
  open one by one, a credential in each, every one with a Verify link. Left open, it stays open
  next time; click the door again to lock it all up. The hero's "Things I build" note is draggable, with its wire re-routed live.
- **Idea ticket** (contact): type an idea on a sticky note, ship it as a ticket, and open an
  email prefilled with it. No server; the page stores and sends nothing.
- **The sketchbook** (sketch mode): draw anywhere on the page with a pencil, a blue pen or a lime
  marker; erase, undo, clear. Drawings stay on the page they were drawn on (kept in this browser) and
  show only in sketch mode. On phones, pick a pencil to draw and the hand to scroll.
- **Light and dark mode** (the sun/moon in the header, or Ctrl K): follows the computer until you
  choose, remembers your choice, set before the first paint (no flash). Sketch mode and the newspaper
  keep their paper.
- **Lite mode** (`src/lib/perf.ts`): on a weak or software-rendered graphics card (detected before the
  first paint, or by a frame watch while scrolling) the site uses native scrolling, the native cursor
  and no lens canvas, so it stays smooth; everything else is the same. Ctrl K: "Turn lite mode on/off".
- **The Prajwal Times** (`/resume`, "Prajwal Times" in the header where Résumé was;
  `src/components/times`): the résumé as an old newspaper's front page, built from the site's content
  so it never goes out of date: Livora as the lead story, the case studies and more work as briefs,
  the roles with a chart, education, certifications, skills as classifieds, a WANTED ad with tear-off
  tabs, a markets ticker of skills, a comic, a puzzle. Real photos of the live sites. "Save as PDF"
  prints one A4 sheet.
- **Newsletter** (hero, after Résumé): his LinkedIn newsletter, AI & Software Insights (subscribe link).
- **The visiting card** (contact section, top right; `src/components/card`): a paper card that flips.
  The front has the name, role and company, "Open to new opportunities", the email and the site; the
  back a QR code to the site (generated at build by `scripts/card-qr.mjs`, decoded in the checks).
  "Save contact" downloads a .vcf (email, site, LinkedIn; no phone number); Share uses the phone's
  share sheet or copies the link. On a computer, when the pointer heads for the tabs to leave, the
  card shows once per visit in a "Before you go" popup; the palette has "Take my card" and "Save my
  contact".
- **Contact as a pull request** (`/pull-request`, from "Create a pull request" in the contact
  section and the palette; `src/components/pullrequest`): write to Prajwal like opening a GitHub PR:
  a title (it names the branch), a description with Write / Preview, labels (Full-time, Freelance,
  Collab) and a milestone. "Create pull request" opens your email app with all of it written out
  (subject `[PR][labels] title`); the ▾ has a draft (a quick hello) and "Copy as text". No server.
- **The repos editor** (`/repos`, "Repos" in the header; `src/components/repos`): every public
  GitHub repo as a workspace in a code editor drawn in the site's ink. The Explorer has a folder per
  language and per repo, each with a README.md (its source beside a rendered preview: description,
  dates, links to GitHub and the case study) and a repo.json (its metadata, highlighted, with a
  minimap). Search filters the repos; Timeline is a git log (a commit per repo on the day it was
  created); the terminal takes help, ls, cd, open (Tab completes), git log, neofetch and clear.
  Click a line to put the cursor on it (a note says when the repo was created and last pushed).
  **Run**: the play button in the left bar (or `npm run dev`, `npm start`, `run <repo>` in the
  terminal, after `cd <repo>` if you like) prints a dev-server start and opens the repo's live
  page in a browser tab inside the editor (reload, desktop or phone width, open in a new tab);
  Ctrl+C stops it. Live means its GitHub Pages site (or website field) answered when the site was
  built; a repo that isn't deployed opens a page that says so. The window is full width and grows
  with what is open (nothing scrolls inside it). No animation. The data is read from GitHub at build time (`scripts/garden-data.mjs`, run by `npm run
  build`, into `src/content/garden.json`): every deploy refreshes it; if GitHub cannot be reached,
  the last snapshot is used. (three.js stays a dependency only for the unmounted 3D library and
  garden; nothing mounted imports it.)

## Bundle (release measurements, gzip -9, `noModule` polyfill excluded)

| Route | First-load JS |
|---|---|
| `/` | 15 files, **306.5 KiB** (HTML 68.5 KiB; the sketchbook loads only in sketch mode) |
| `/work/[slug]` | 12 files, **235.9 KiB** |
| `/repos` | 11 files, **234.7 KiB** (HTML 15.1 KiB) |
| `/pull-request` | 11 files, **221.6 KiB** (HTML 12.2 KiB) |
| `/resume` | 11 files, **219.2 KiB** (HTML 26.5 KiB; its two fonts load on this page only) |
| `404` | 10 files, **209.4 KiB** |

Lazy chunks: diagram engine 18.2, Motion feature set 17.1, palette body 11.8, the career role
figures 9.2, the stack's iceberg drawing (with the waves, the diver and the submarine) 8.6, stack
map engine 6.1, the port drawing 8.2, Lenis 5.3, sketch wipe 1.2 (measured 2026-11-07; there is no
3D library any more). The medal and the college are in the home chunk (+3.0 KiB with the panels);
the port's yard list, bill of lading and opened container +6.1 KiB; the vault (door, strongroom,
deposit boxes) is in the home chunk too (the first-load figures above were re-measured with it,
and with the first road design back, on 2026-11-07). Details and the verification record: `docs/DEPLOY.md`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:3000 |
| `npm run build` | Fetches the repos' GitHub data, then the static export to `out/` for the site root (no base path) |
| `npm run garden` | Only fetch the GitHub data (`src/content/garden.json`: the repos, each with its live address if it answers, and the contribution calendar the unmounted garden used) |
| `npm run card-qr` | Only regenerate the visiting card's QR code (`src/content/cardQr.ts`, from the site's address; `npm run build` runs it too) |
| `npm run build:pages` | Static export for GitHub Pages (`NEXT_PUBLIC_BASE_PATH=/Portfolio`) |
| `npm run preview` | Serve `out/` on port 4173. For a Pages build set `NEXT_PUBLIC_BASE_PATH=/Portfolio` (and `PORT=4174` if 4173 is busy) first, then open `/Portfolio/` |
| `npm run typecheck` | `tsc --noEmit` |

Both build scripts finish with `scripts/flatten-rsc.mjs`, which copies the RSC payloads to the
flat file names the static client requests. Next 16 keeps `next dev` output in `.next/dev`, so a
production build can run while the dev server is up.

In Git Bash on Windows, prefix the preview command with `MSYS_NO_PATHCONV=1`. Without it, Git
Bash rewrites `/Portfolio` into a Windows path and every request returns 404.

Visual QA tools (headless Microsoft Edge screenshots, section measurements) live in
`docs/handoff/tools/` (`npm install` there once). See the handoff at the top of `Chat.md`.

## Editing content

All facts live in typed files in `src/content/` and are imported from `@/content`. Components
do not hard-code facts.

| File | Holds |
|---|---|
| `profile.ts` | name, role, email, statement, about text, learning, route, socials, résumé link |
| `projects.ts` | projects (six are `featured` and get a case study; the rest appear under "Also shipped"), with stack, architecture, request flow, approach and links |
| `capabilities.ts` | the six "What I build" rows and the projects or roles that prove each one |
| `experience.ts`, `education.ts` | the history, education and certifications |
| `skills.ts` | the stack groups; each skill's `usedIn` lists where it was used (no ratings) |
| `types.ts` | the types that every file is checked against |

Rules: no invented metrics, clients or links, and no phone number. Project internals (models,
endpoints, counts) go in `projects.ts` only after they are checked against the project's public
README. Mock UIs show real labels and features; anything illustrative must look illustrative.
Adding a featured project to `projects.ts` creates its `/work/<slug>/` page automatically
(`generateStaticParams`); give it a mini-UI template in `src/components/miniui/templates` or it
falls back to a generic checklist of its flow.

### Swapping the résumé link

Edit `resume.href` in `src/content/profile.ts` (currently a Google Drive share link). The header,
hero, menu and contact section all read it from there.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`: `npm ci`, then `npm run build` with
`NEXT_PUBLIC_BASE_PATH=/Portfolio` (it first reads the repos' data from GitHub, so each deploy
refreshes /repos), then it uploads `out/` and deploys it with GitHub Pages.
This replaces the old site at that address. In the repository settings, Pages must use "GitHub
Actions" as its source.

Because the site lives under `/Portfolio`:

- `next/link` and the helpers in `src/lib/routes.ts` add the base path themselves.
- Any raw asset URL (img, fetch, loaders) must go through `asset()` in `src/lib/asset.ts`.
  Today there are none: fonts are self-hosted by `next/font`.

### Social card

`src/app/og.png/route.tsx` renders the 1200×630 card at build time to `out/og.png`: a paper card
in the site's own lettering (Bricolage Grotesque and Inter, from small TTF subsets in
`src/fonts/og/`) with sketch strokes from the same generator. It is drawn by `src/lib/ogCard.tsx`.
It is a `.png` route rather than the `opengraph-image` convention, because the convention exports
an extensionless file that GitHub Pages would serve as `application/octet-stream`. `ogImages()` in
`src/lib/og.ts` adds it to the home page and every case study. `metadataBase` is the bare origin,
so the base path is applied exactly once: `https://prajwalps2603.github.io/Portfolio/og.png`.

`docs/DEPLOY.md` has the verification record and bundle sizes.

## Accessibility and reduced motion

- Honours the OS "reduce motion" setting, and the footer has a persisted "Motion" switch (the
  site-wide pause). With either: no opening, no hero cycle, no lens, no tilt, no scrubbing, native
  scroll instead of Lenis, the finished iceberg and a static background; colour and opacity
  feedback stay.
- The opening can be skipped with any key, click, wheel or touch, and plays in short form on
  repeat visits in the same session. Without JavaScript nothing is hidden.
- The hero cycle has its own pause control.
- Skip link, landmarks, one `h1` per page, logical headings, a visible 2px blue focus ring, Esc
  closes overlays, a focus-trapped mobile menu, external links announced as opening a new tab.
- Sketch strokes and canvases are `aria-hidden`; every interaction has a DOM equivalent (the
  mini-UIs are images with a description; the stack's iceberg is decoration beside real buttons
  and text, and its tools open with a click, Enter or Space, close with Esc, and a typed letter
  jumps to the next tool starting with it).
- Contrast: body text is ink on paper (about 17:1); coloured text uses the `-deep` variants.

## Performance notes

- The stack's iceberg is one SVG, loaded when the section is near, drawn from the measured
  layout and redrawn on resize; its dive plays once per layer (stroke-dashoffset and opacity
  only) and never loops.
- The paper dot grid is the page background (CSS); a tiny 2D canvas lens darkens dots near the
  pointer on fine pointers with full motion only, and sleeps when idle.
- Mini-UIs in the work section mount only near the viewport.
- Animation uses transform, opacity, clip-path and stroke-dashoffset only.

## Design docs

- `design/directions/sketch-to-ship/DIRECTION.md`: the creative direction (the contract)
- `docs/DESIGN.md`: tokens, type roles, components, the sketch system, the contracts
- `docs/MOTION.md`: eases, durations, the one authored moment per section, reduced motion
- `docs/DEPLOY.md`: base path rules, verification record, bundle sizes
- `design/reference/livora/`: the design reference (his own studio site; language, not sections)
- `design/archive/`: the rejected "Signal Chain" design, kept for reference only
- `docs/handoff/`: the content dossier, the review history and the visual QA tools
- `Chat.md`: the project handoff and the full build conversation

## Credits

Design and code by Prajwal M P. Fonts: Bricolage Grotesque, Inter, JetBrains Mono and Caveat (SIL
Open Font License), self-hosted through `next/font`. Built with Next.js, GSAP, Lenis and Motion.

## Publishing without GitHub Actions

If Actions is unavailable, build locally and publish the export to the `gh-pages` branch:

```bash
npm run build:pages          # static export to out/ with the /Portfolio base path
# copy out/ (plus an empty .nojekyll file) to a clean folder, commit it on a gh-pages branch, push
```

Then set **Settings → Pages → Source** to "Deploy from a branch", branch `gh-pages`, folder `/ (root)`.
