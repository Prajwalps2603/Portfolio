export const meta = {
  name: 'portfolio-creative-boost',
  description: 'Creative boost on the liked Sketch -> Ship site: 9 features in parallel (animated project architecture diagrams, case-study request journey, live stack map, sketch mode, terminal palette, physics stickers, idea ticket, hero play, keyboard legends), then integration, review loops and release checks',
  phases: [
    { title: 'Boost', detail: '9 creative features in parallel' },
    { title: 'Integrate', detail: 'production build; the features fit together; JS split' },
    { title: 'Refine', detail: 'capture, 4-lens review, triage, parallel fixes (looped)' },
    { title: 'Finish', detail: 'GitHub Pages check, docs' },
  ],
}

const A = args || {}
const MAX_ROUNDS = A.maxRounds || 2

const ROOT = 'C:/Users/Prajwal/Desktop/Portfolio'
const SP = 'C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad'
const SHOTS = SP + '/shots/v2'
const TOOLS = ROOT + '/docs/handoff/tools'
const SHOT = TOOLS + '/shot.mjs'
const DETECT = 'C:/Users/Prajwal/.claude/skills/impeccable/scripts/bin/windows-x64/impeccable.exe'
const DEV = 'http://localhost:3000'
const PREVIEW = 'http://localhost:4173'
const SPEC = ROOT + '/design/directions/sketch-to-ship/DIRECTION.md'
const LIVORA = ROOT + '/design/reference/livora'

const STACK = [
  'PROJECT: the personal portfolio of Prajwal M P, a Full Stack Developer (current role: Full Stack Developer at Maruti Flex Traders LLP, Dec 2025 - Present). Root: ' + ROOT,
  'STATUS: the "Sketch -> Ship" redesign is BUILT and integrated, and Prajwal likes it. The rejected "Signal Chain" electronics design is archived in design/archive/ - never reuse its look, palette, vocabulary (channels, scope, probes, traces, datasheets) or any electronics/hardware metaphor.',
  'STACK (installed, pinned): Next.js 16.4 App Router (Turbopack) + React 19.3 + TypeScript 5.9 strict + Tailwind CSS 4.3 (CSS-first @theme in src/app/globals.css) + GSAP 3.15 (ScrollTrigger, SplitText, CustomEase free) + @gsap/react 2.1 + three 0.187 + @react-three/fiber 9.8 + motion 14.9 (import from "motion/react") + lenis 1.3. @react-three/drei was removed; three/examples/jsm (e.g. RoundedBoxGeometry) is available. Add a dependency only if truly necessary (npm i <pkg>@<exact version>) and say so.',
  'NEXT.JS 16 IS NEWER THAN YOUR TRAINING DATA (AGENTS.md): read the relevant guide in ' + ROOT + '/node_modules/next/dist/docs/ before writing Next-specific code (routing, metadata, next/font, static export, route handlers, async params) and heed deprecations. Leave AGENTS.md alone.',
  'DEPLOYMENT: static export (output "export", trailingSlash) to GitHub Pages under basePath /Portfolio. No server code, no API routes (only force-static GET route handlers), no next/image optimisation; raw asset URLs go through asset() in src/lib/asset.ts; next/link handles basePath. metadataBase is the bare origin (site.origin); share-card paths come from src/lib/og.ts ogImages().',
  'CONTENT: every fact comes from src/content/* (typed; import from "@/content"): profile (name, title, statement, tagline, about, learning, route, socials, resume), experience, projects (featured + archive, architecture, flow, links), capabilities ("What I build"), skills (usedIn evidence), education, certifications. Never hard-code facts; never invent metrics, clients, testimonials or KPIs (mock UIs use real labels/features; illustrative data must look illustrative). Livora is a project he built - NEVER call him co-founder. No phone number. Email prajwalnair2603@gmail.com. The current role must read "Full Stack Developer".',
  'REUSABLE UTILITIES (read before writing; refactor if needed): src/lib/motion/gsap.ts (import gsap/ScrollTrigger/SplitText/CustomEase/useGSAP only from here), src/lib/motion/SmoothScroll.tsx (Lenis + ScrollTrigger + app-wide anchor handling), src/lib/motion/media.ts, src/lib/motion/pointer.ts, src/lib/motion/useMagnetic.ts, src/lib/motion/useIntroMode.ts (+ its boot helpers), src/lib/hooks/useCopy.ts, src/lib/gpu.ts, src/lib/asset.ts, src/lib/routes.ts, src/lib/og.ts.',
].join('\n')

const DIRECTION_BLOCK = [
  'CREATIVE DIRECTION (the contract - READ IT FULLY FIRST): ' + SPEC + ' . Concept "Sketch -> Ship": every screen pairs a hand-drawn sketch layer (pencil-rough strokes, Caveat handwriting, highlighters, sticky notes) with a crisp shipped-software layer (cards, real UI, mono labels); the signature move is a sketch that compiles into real UI with a tangerine SHIPPED stamp. Palette: paper #F4F4EF + ink #0D0D0C with THREE highlighter accents - lime #C8F53B (build), electric blue #3D5AFE (code/interaction), tangerine #FF6A2B (shipped/live/now) - plus their soft/deep variants in the spec. Type: Bricolage Grotesque (display), Inter (text), JetBrains Mono (labels/data), Caveat (handwriting).',
  'DESIGN REFERENCE: Prajwal\'s own studio site Livora - he explicitly asked to use its design language, not to copy it. Look at the screenshots in ' + LIVORA + ' (Read the PNGs) for the level of polish: warm paper with faint grid, heavy tight grotesque headlines with highlighter blocks behind key words, tilted handwritten sticky note wired by a dashed line into a crisp product-UI mockup, pill buttons, soft-shadowed rounded cards, mono micro-labels, ink slabs with big radii, playful interactive objects. Do NOT copy Livora\'s specific sections (WhatsApp float, orbit diagram, lanyard badges, sticky-note FAQ board, handwritten-logo intro, team cards).',
].join('\n\n')

const CRAFT = [
  'CRAFT FLOOR (checked on the built result):',
  '- Contrast: body >= 4.5:1, large >= 3:1. Coloured text on paper uses the -deep variants; text on lime/blue-soft/tangerine-soft highlights is ink; never white on tangerine.',
  '- Type: fluid clamp() sizes; body >= 16px, 45-75ch; display tracking floor -0.045em; text-wrap: balance on headings; functional text never below 11px (legal smallprint >= 10px); Caveat >= 20px; letter-spacing > 0.05em only on short uppercase mono labels.',
  '- The reference (Livora) uses short mono section labels and numbered rows: allowed here, but max one short label per section and only when it carries information; numbered rows only in "What I build".',
  '- Motion: one authored moment per section (listed in the spec), never the same fade-up everywhere; arrivals expo-out; exits faster; no bounce except the SHIPPED stamp and sticker peel (back.out 1.4). Content stays visible if JS fails (hidden states set from JS).',
  '- Refuse: gradient text; glass/blur as decoration (the sticky header blur is functional and allowed); coloured side-stripe borders; same-size icon+heading+text card grids; the hero-metric template; emoji/unicode as icons (authored SVG only); monospace for body copy; skill percentages/ratings/radar charts/logo clouds; cursor trails; placeholder links or controls that do nothing; "Hi, I\'m" greetings; avatars; electronics/hardware imagery.',
  '- Theme browser surfaces: ::selection lime with ink text, caret blue, warm thin scrollbar, :focus-visible 2px blue ring offset 3px, underline offsets, tabular-nums for dates/data.',
  '- States: hover, focus-visible, active, disabled where relevant; every control works; every hover reveal has a tap/keyboard equivalent.',
].join('\n')

const A11Y = [
  'ACCESSIBILITY, MOTION & PERFORMANCE:',
  '- prefers-reduced-motion and the site Motion toggle (if any): no opening animation, no cycling, no lens, no tilt, no scrub, Lenis off, 2D keyboard, static background; keep colour/opacity feedback.',
  '- WebGL/canvas: lazy (next/dynamic ssr:false), DPR clamp via src/lib/gpu.ts, pause offscreen/hidden, dispose on unmount, DOM fallback; canvases aria-hidden with a DOM equivalent for every interaction.',
  '- Semantics: skip link, header/nav/main/footer, one h1 per page, logical headings, Esc closes overlays, focus trap in the mobile menu, external links rel="noopener noreferrer" target="_blank" with an accessible hint.',
  '- Touch targets >= 44px; no layout shift (next/font, reserved space for media/canvases); zero console errors/hydration warnings.',
  '- GSAP in React: useGSAP with scope (auto cleanup), kill ScrollTriggers on unmount, ScrollTrigger.refresh after fonts/layout changes; StrictMode-safe effects.',
].join('\n')

const VERIFY = [
  'BROWSER VERIFICATION (mandatory - look at your own work):',
  '- Dev server: ' + DEV + ' (hot reload). If it does not answer (curl -s -o /dev/null -w "%{http_code}" ' + DEV + '/), start: cd ' + ROOT + ' && npx next dev -p 3000 > ' + SP + '/dev.log 2>&1 &  and wait. Warm a route (curl it) before screenshots: cold Turbopack compiles of three/R3F take 10-20 s. If a capture shows a Next error overlay caused by another agent\'s in-progress edit, wait 30 s and retry.',
  '- Screenshot tool (headless Edge, WebGL works): node "' + SHOT + '" --url <url> --out <dir> --name <prefix> [--viewport desktop|laptop|tablet|tablet-landscape|mobile|WxH] [--wait ms] [--frames 0,500,...] [--scroll y1,y2 | steps:N] [--wheel] [--settle ms] [--full] [--reduced-motion] [--hover x,y] [--hover-selector css] [--click css] [--keys "Tab,Tab"] [--eval js] [--selector css]. Prints SAVED paths, METRICS (scrollHeight, canvases, horizontalOverflow) and LOGS (console errors, failed requests). Read the PNGs. Use --wheel for scroll captures (Lenis). Each run is a fresh session, so the opening plays each time (use --wait 4000+ or --frames).',
  '- Other tools in ' + TOOLS + ': measure.mjs <url> [WxH] (section offsets, canvases, logs). Design detector: "' + DETECT + '" detect --json <files or url> [--viewport 390x844] - fix real findings.',
  '- Type-check: cd ' + ROOT + ' && npx tsc --noEmit . Do NOT run "next build" during parallel phases (the integrator owns production builds).',
  '- Save screenshots under ' + SHOTS + '/<your-label>/ .',
].join('\n')

const AREAS = {
  foundation: 'src/app/layout.tsx, src/app/page.tsx, src/app/globals.css, src/app/not-found.tsx, src/app/icon.svg, src/app/og.png/**, src/lib/**, src/fonts/**, src/components/chrome/**, src/components/cursor/**, src/components/transition/**, src/components/icons/**, src/components/ui/**, src/components/background/**, docs/DESIGN.md, docs/MOTION.md, next.config.ts',
  hero: 'src/components/intro/**, src/components/hero/**',
  miniui: 'src/components/miniui/**, src/components/sketch/** (keep sketch primitive APIs stable)',
  diagram: 'src/components/diagram/**',
  build: 'src/components/build/**',
  work: 'src/components/work/**',
  casestudy: 'src/app/work/**, src/components/casestudy/**',
  content: 'src/content/**',
  stack: 'src/components/stack/** EXCEPT src/components/stack/keyboard3d/**',
  stack3d: 'src/components/stack/keyboard3d/**',
  changelog: 'src/components/changelog/**',
  about: 'src/components/about/**',
  contact: 'src/components/contact/**, src/components/footer/**',
  palette: 'src/components/palette/**',
}
const AREA_MODEL = { foundation: undefined, hero: undefined, miniui: undefined, diagram: undefined, build: undefined, work: undefined, casestudy: undefined, content: 'sonnet', stack: 'sonnet', stack3d: 'sonnet', changelog: 'sonnet', about: 'sonnet', contact: 'sonnet', palette: 'sonnet' }
const withModel = (opts, model) => (model ? Object.assign(opts, { model }) : opts)

const RESULT = {
  type: 'object',
  properties: {
    area: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    verification: { type: 'string', description: 'what you checked in the browser and what you saw' },
    screenshots: { type: 'array', items: { type: 'string' } },
    openIssues: { type: 'array', items: { type: 'string' } },
  },
  required: ['area', 'filesChanged', 'summary', 'verification', 'screenshots', 'openIssues'],
}
const INTEG = {
  type: 'object',
  properties: {
    buildOk: { type: 'boolean' }, typecheckOk: { type: 'boolean' },
    consoleErrors: { type: 'array', items: { type: 'string' } },
    fixesMade: { type: 'array', items: { type: 'string' } },
    remainingProblems: { type: 'array', items: { type: 'string' } },
    screenshots: { type: 'array', items: { type: 'string' } },
  },
  required: ['buildOk', 'typecheckOk', 'consoleErrors', 'fixesMade', 'remainingProblems', 'screenshots'],
}
const CAPTURE = {
  type: 'object',
  properties: {
    buildOk: { type: 'boolean' },
    shots: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, what: { type: 'string' } }, required: ['path', 'what'] } },
    consoleAndNetwork: { type: 'string' }, detector: { type: 'string' }, bundle: { type: 'string' }, links: { type: 'string' }, overflow: { type: 'string' },
  },
  required: ['buildOk', 'shots', 'consoleAndNetwork', 'detector', 'bundle', 'links', 'overflow'],
}
const FINDINGS = {
  type: 'object',
  properties: {
    lens: { type: 'string' },
    verdict: { type: 'string', enum: ['ship', 'fix', 'rebuild'] },
    findings: { type: 'array', items: { type: 'object', properties: {
      severity: { type: 'string', enum: ['high', 'medium', 'low'] },
      area: { type: 'string', enum: Object.keys(AREAS) },
      title: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' },
    }, required: ['severity', 'area', 'title', 'evidence', 'fix'] } },
    keep: { type: 'array', items: { type: 'string' } },
  },
  required: ['lens', 'verdict', 'findings', 'keep'],
}
const PLAN = {
  type: 'object',
  properties: {
    stop: { type: 'boolean' }, rationale: { type: 'string' }, highCount: { type: 'number' }, mediumCount: { type: 'number' },
    workstreams: { type: 'array', items: { type: 'object', properties: {
      area: { type: 'string', enum: Object.keys(AREAS) },
      fixes: { type: 'array', items: { type: 'object', properties: {
        severity: { type: 'string', enum: ['high', 'medium', 'low'] }, title: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' },
      }, required: ['severity', 'title', 'evidence', 'fix'] } },
    }, required: ['area', 'fixes'] } },
    keep: { type: 'array', items: { type: 'string' } },
  },
  required: ['stop', 'rationale', 'highCount', 'mediumCount', 'workstreams', 'keep'],
}
const HERO_REVIEW = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['strong', 'promising', 'weak'] },
    firstImpression: { type: 'string', description: 'what a recruiter and a design director feel in the first 5 seconds' },
    fixes: { type: 'array', items: { type: 'object', properties: {
      severity: { type: 'string', enum: ['high', 'medium', 'low'] }, area: { type: 'string', enum: ['foundation', 'hero'] }, issue: { type: 'string' }, fix: { type: 'string' },
    }, required: ['severity', 'area', 'issue', 'fix'] } },
    keep: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'firstImpression', 'fixes', 'keep'],
}

const common = (extra) => [STACK, DIRECTION_BLOCK, CRAFT, A11Y, VERIFY].concat(extra || []).join('\n\n')
const ownership = (areas) => 'FILE OWNERSHIP: you may create/edit ONLY: ' + areas.map((a) => AREAS[a]).join(', ') + ' . Other agents edit other areas in parallel. Need a change elsewhere? Do not make it; put the exact change in openIssues.'

// ================= Contracts shared by parallel builders =================
const CONTRACTS = [
  'CONTRACTS (created as compiling stubs by the foundation lead; owners replace the internals but MUST keep these exports and props stable, because other agents build against them in parallel):',
  '1. src/components/miniui/index.tsx (owner: miniui) - export type MiniUIState = "sketch" | "ship"; export const MINIUI_PROJECTS = ["resumai","drone-intelligence","audify-ai","bookmyvenue","brain-tumor-detection","mcp-job-agent"] as const; export function MiniUI(props: { projectId: string; state?: MiniUIState /* controlled, default "ship" */; autoplay?: boolean /* play sketch->ship once when in view; instant with reduced motion */; onShipped?: () => void; stamp?: boolean; size?: "sm" | "md" | "lg"; className?: string }). Both states render with IDENTICAL outer dimensions so a "sketch" instance can sit exactly under a "ship" instance (the hero lens masks one over the other). Changing state from "sketch" to "ship" plays the compile + SHIPPED stamp and then calls onShipped.',
  '2. src/components/stack/state.ts (owner: stack) - export type StackKey = { id: string; label: string; groupId: string; groupLabel: string; tone: "lime" | "blue" | "tangerine" | "paper" | "graphite"; letter: string; usedIn: string[] }; export const stackKeys: StackKey[] (derived from src/content/skills.ts, de-duplicated); export const KEY_ROWS: string[][] (key ids per keyboard row, 4-5 rows); export function useStackSelection(): { selected: string | null; pressed: string | null; select(id: string | null): void; press(id: string): void } - a tiny external store (useSyncExternalStore) shared by the DOM UI and the 3D canvas; press(id) marks pressed for ~260ms and selects it.',
  '3. src/components/stack/keyboard3d/index.tsx (owner: stack3d) - export function Keyboard3D(props: { className?: string; onReady?: () => void }) reading/writing selection only through useStackSelection(); the stack shell lazy-loads it with next/dynamic(ssr:false) and decides when to show it vs the 2D keyboard.',
  '4. src/app/work/[slug]/page.tsx (owner: casestudy) - generateStaticParams over featuredProjects, async params, metadata via ogImages() + canonical URL; may import <MiniUI> and src/components/sketch primitives.',
].join('\n')

// ================= Creative boost (added after Prajwal liked the redesign) =================
const CONTRACT_S = '5. SKETCH MODE (owner: sketchmode) - src/lib/stores/sketchMode.ts exports useSketchMode(): { on: boolean; toggle(origin?: { x: number; y: number }): void; set(on: boolean, origin?: { x: number; y: number }): void }, plus getSketchMode() and subscribeSketchMode(fn). While it is on, <html> carries the data-sketch attribute. Every component that has a sketch/ship pair (MiniUI, every diagram, the hero stage, the idea ticket) shows its SKETCH state while it is on, and its normal state when it is off. No bare single-letter global keyboard shortcuts anywhere: the Stack section uses letter keys.'
const CONTRACT_P = '6. COMMAND PALETTE (owner: palette) - src/components/palette/index.tsx exports CommandPalette() (mounted once in src/app/layout.tsx), PaletteTrigger({ className? }) (rendered in the header just before the desktop actions; it decides its own responsive look) and openPalette(query?: string). Others may call openPalette() but never edit src/components/palette/**. Keep both mount points when editing layout.tsx or Header.tsx.'
const CONTRACTS_ALL = CONTRACTS + '\n' + CONTRACT_S + '\n' + CONTRACT_P

const BOOST_CONTEXT = [
  'WHERE WE ARE: the Sketch -> Ship site is built and integrated (home: opening + hero with the cycling stage, 02 What I build, 03 Selected work, 04 Stack with the 3D keyboard, 05 Experience changelog, 06 About README + stickers, 07 Contact; /work/<slug>/ case studies; 404). Prajwal checked it and said: "current design I liked it ... if you have more creative ideas add them, make it amazing ... more creative animation designs like animated diagrams, projects, something crazy".',
  'SO: do NOT restyle what exists. Add a bold new creative layer in the SAME visual language (tokens, type roles, sketch system, eases and durations from docs/DESIGN.md and docs/MOTION.md - read both first, then read the current code of your area and take a screenshot of it before you change anything). Layout changes inside your own area are fine when the new feature needs room. "Crazy" means surprising, playful and technically impressive - never cluttered, never broken, never slow.',
  'PERFORMANCE BUDGET for the new layer: at most ~25 KB gzip extra on the initial JS of the home page in total across all features. Lazy-load anything heavy (next/dynamic or import() on first open / near the viewport). Animate transform, opacity, clip-path, stroke-dashoffset and offset-distance only; pause loops offscreen (IntersectionObserver) and in hidden tabs.',
  'QA HOOKS: put stable data-qa="..." attributes on your new controls and states and list them in qaHooks (selector + what it does + how to trigger it), so the capture and review agents can drive your feature in a headless browser.',
].join('\n')
const BOOST_RESULT = {
  type: 'object',
  properties: Object.assign({}, RESULT.properties, { qaHooks: { type: 'array', items: { type: 'string' } } }),
  required: RESULT.required.concat(['qaHooks']),
}
const PRIOR_ISSUES = (A.priorRemaining || []).map((i) => 'from the previous integration: ' + i)

const DIAGRAM_GRAMMAR = [
  'DIAGRAM GRAMMAR (every animated diagram on the site follows it, so they read as one family, even though they are built in parallel by different agents):',
  '- Nodes: crisp cards (bg-card, 1px line border, chip/panel radius, the soft card shadow), a short mono micro-label for the layer (INTERFACE / API / INTELLIGENCE / DATA / INFRA / AUTOMATION / DEPLOY) and an Inter label with the real technology or step from src/content. Before they compile, nodes are rough sketch boxes (src/components/sketch: rough.ts, SketchRect, HandNote) with Caveat labels.',
  '- Edges: hand-drawn rough strokes (graphite, ~1.5px) that draw on with the pen ease; the active path turns ink.',
  '- Packets: small rounded pills/dots travelling along the edges (SVG path with getPointAtLength in a GSAP ticker, or CSS offset-path; transform/opacity only) in the three accents with FIXED meanings: lime = a request going in, blue = data or code moving between services, tangerine = the response / shipped result coming back. 1-3 packets on screen per path, never a swarm.',
  '- Compile: sketch -> crisp uses the same move as the MiniUI (strokes tighten into borders, Caveat swaps to Inter/mono, panels fill, snap ease); the SHIPPED stamp is reserved for the end of a full journey.',
  '- Interaction: hover or keyboard focus on a node brightens its connected path, dims the rest to ~35%, and shows a short Caveat note saying what happens there (from content; never invented). Touch: tap does the same.',
  '- Accessibility: the SVG is aria-hidden; a DOM equivalent (ordered list of steps or a description list) carries the same information; every interactive node is a real focusable element.',
  '- Reduced motion / the site Motion toggle: the finished diagram, static, no packets, no scrub, everything readable.',
  '- Sketch mode (contract 5): render the sketch state.',
].join('\n')

const BOOSTERS = [
  { key: 'diagram-work', areas: ['diagram', 'work'], model: undefined, grammar: true, task: 'Build src/components/diagram/ - a reusable "living system diagram" engine that implements the DIAGRAM GRAMMAR (layout from data, sketch draw-on, compile, looping packets along a route, node focus/hover notes, reduced motion, sketch mode, pause offscreen) - and use it to give every featured project an animated ARCHITECTURE view in "03 Selected work". The work stage gets a compact segmented control ("Interface" | "Architecture"; a radio group: arrow keys, visible focus, blue = interaction) that remembers the choice while you move between projects. Architecture shows the project\'s REAL architecture from src/content/projects.ts (its `architecture` layers Interface / API / Intelligence / Data / Infrastructure with their items, laid out top-to-bottom or left-to-right, whichever fills the window better) and runs packets along its `flow`: on entering, the sketch draws, the boxes compile into crisp nodes, then packets loop through the flow (lime request in, blue between services, tangerine response out) while the current flow step is written in Caveat under the window (replacing the static "flow:" line while this view is on). Switching projects redraws the new architecture (sketch -> compile). The view has exactly the same outer size as the Interface view (no layout shift). Mobile stacked cards: a small toggle per card, with a vertical layout that is legible at 390 wide. This is the "animated diagrams of my projects" Prajwal asked for: make it the most impressive thing on the page, and keep it calm enough to read. Do not edit src/content/** (read only; another agent owns it): if a node needs a note that the content lacks, show the layer name only and put the suggestion in openIssues.' },
  { key: 'casestudy-journey', areas: ['casestudy', 'content'], model: undefined, grammar: true, task: 'Turn the case-study "How it works" section (src/components/casestudy/HowItWorks.tsx and friends) into a scroll-driven REQUEST JOURNEY (the page\'s authored moment), following the DIAGRAM GRAMMAR. You cannot import src/components/diagram/** (another agent is writing it in parallel) - build this in src/components/casestudy/. Desktop: pin the architecture diagram for about 1.5-2 viewports while ONE lime request packet travels the project\'s `flow` step by step, scrubbed by scroll; each node it reaches compiles from sketch to crisp and lights up, and a step card beside the diagram (the flow step + what happens there, from projects.ts) highlights in sync; at the end the tangerine response packet runs back to the user and the diagram gets the SHIPPED stamp. Tablet portrait and phones: no pin; a vertical flow where the packet travels down as you scroll. Reduced motion: the finished diagram and the ordered step list. If it clearly improves the page, give the case-study hero a small "how it\'s built" strip (layers as chips) too. CONTENT (you own src/content/**): verify every featured project\'s `approach`, `problem`, `highlights` and `flow` against its public GitHub README (links.repo; fetch https://raw.githubusercontent.com/Prajwalps2603/<repo>/HEAD/README.md - try main/master if HEAD fails - with WebFetch or curl). Keep what the README supports, correct what it does not, add `problem` only where the README states one, reconcile Audify AI\'s "four-stage pipeline" highlight with its five-step flow. Never invent facts, numbers or endpoints. Keep existing exports and field names stable (other agents read them).' },
  { key: 'build-map', areas: ['build'], model: undefined, grammar: true, task: 'Add a LIVE STACK MAP to "02 What I build" (src/components/build/**), following the DIAGRAM GRAMMAR. You cannot import src/components/diagram/** (being written in parallel) - build the map inside your folder. Desktop: a sticky map beside the six capability rows (rebalance the grid, roughly rows 55% / map 45%; keep the row flood and the proof notes). Phones and tablet portrait: a compact map above the rows. The map is the shape of what he builds end to end: Interface -> API -> Intelligence -> Data -> Automation -> Deploy, each node listing 2-4 of his real technologies from src/content/skills.ts. Idle: a few slow packets circulate through the whole system. Hover, focus or open a capability row: the map lights only the nodes and edges that capability uses (derive the path from the capability\'s tags and its proof projects\' stacks/architecture - e.g. AI-Powered Applications = Interface -> API -> Intelligence -> Data), packets speed up along that path in the row\'s accent colour, and a Caveat label names the path. Touch: opening a row does the same. The map is the section\'s second beat: calm by default, vivid on interaction.' },
  { key: 'sketchmode', areas: ['foundation', 'miniui'], model: undefined, grammar: false, task: 'Build SKETCH MODE: one switch that turns the whole site back into the sketch it started as - the concept\'s ultimate expression. Implement contract 5 fully (src/lib/stores/sketchMode.ts; a stub exists). Entry points: a pencil toggle in the header (authored SVG pencil, aria-pressed, accessible name "Sketch mode", a short Caveat tooltip; visible on phones too, at 44px), the palette (it calls toggle), and the hero (its owner may wire its pencil button to the store). Transition: document.startViewTransition (fallback: instant) with a wipe that starts at the toggle - a growing circle or a diagonal pen sweep - ship -> sketch and back; shipping back ends with a small tangerine SHIPPED stamp near the toggle. Rendering, CSS-first under html[data-sketch] in globals.css: headings, labels and buttons switch to Caveat (sizes adjusted so it stays readable), text turns graphite, cards/pills/windows lose fills and shadows and get hand-drawn outlines (the irregular border-radius trick, e.g. 255px 15px 225px 15px / 15px 225px 15px 255px, or rough SVG borders), highlights become scribbled underlines, ink slabs become paper with a pencil-hatched edge, the dot grid becomes a notebook grid, canvases turn to pencil (show the 2D keyboard instead of the 3D one, or filter the canvas), and every MiniUI (you own src/components/miniui/**) renders state "sketch" while on. Everything stays usable and readable (text contrast >= 4.5:1); it is a delightful x-ray, not a broken page. Persist for the session only (sessionStorage); never on by default. Reduced motion: instant swap. Keep the CommandPalette mount in layout.tsx and the PaletteTrigger slot in Header.tsx (contract 6). Verify every home section, a case study and the 404 in sketch mode at 1440 and 390 wide.' },
  { key: 'palette', areas: ['palette'], model: 'sonnet', grammar: false, task: 'Build a COMMAND PALETTE that doubles as a tiny terminal (contract 6; stubs exist and are already mounted). Opens with Ctrl+K / Cmd+K or "/" (never while typing in a field), with the header trigger (a compact pill: authored terminal glyph + "Ctrl K" on Windows/Linux, "⌘K" on Mac; icon-only 44px button on phones) and with openPalette(). Panel: a centred card on a dim paper scrim; a JetBrains Mono prompt line "prajwal@portfolio ~ $" with a blue caret; fuzzy-filtered groups - Go to (each home section, each case study), Actions (copy email -> "Copied", open résumé, GitHub, LinkedIn, email, toggle sketch mode via contract 5, toggle motion via the existing preference store in src/lib/motion/preferences.ts) - and terminal commands that print typed-out output inside the panel: whoami (name, role, location, from content), ls projects (featured + archive, each a link), git log --oneline (his experience from experience.ts as commits, newest first, HEAD -> main on the current role), cat stack.txt (the skill groups), npm run hire-prajwal (a 2-3 s animated build log - "compiling interface", "wiring APIs", "loading data", "training the AI"... each line ticking a lime check, ending "shipped: opening your email client" and then the mailto), help, clear, and one or two tasteful jokes (e.g. sudo -> "nice try. Ask Prajwal for access."). Unknown commands answer helpfully with a suggestion. Accessible: role="dialog" aria-modal, combobox + listbox semantics, arrow keys + Enter, Esc closes, focus returns to the trigger, fully usable without a mouse, screen-reader announcements for command output (aria-live polite). Motion: snappy open (scale 0.98 -> 1 + fade, ~160 ms, exit faster), reduced motion = fade only. Lazy-load the palette body and command data on first open so the initial JS cost is tiny. Put any hint you want elsewhere on the site (e.g. "Press Ctrl K" in the footer) in openIssues for the integrator.' },
  { key: 'about-physics', areas: ['about'], model: 'sonnet', grammar: false, task: 'Make the certification stickers on the ink lid in "06 About" PHYSICAL: drag and throw them (pointer events; velocity from the last few moves; friction; they bounce off the lid edges, with rotation from the throw), while held they lift (bigger shadow, slight scale) and their peel corner curls more. Clicking without dragging (movement < 4px) still peels / opens the verify link exactly as now. Keyboard: arrow keys nudge a focused sticker. A small "Tidy up" pill flies them back to their layout (and only appears once something moved). Touch: stickers capture the drag (touch-action: none on stickers only) while the page scrolls normally everywhere else. Reduced motion and sketch mode (contract 5): no physics, today\'s behaviour. A tiny hand-written integrator in requestAnimationFrame (no physics library), sleeping when nothing moves and when offscreen. Positions are not persisted.' },
  { key: 'contact-ticket', areas: ['contact'], model: 'sonnet', grammar: false, task: 'Add a "Sketch your idea" moment to "07 Contact" (an extra; keep the email, the Copy pill, the socials, the résumé pill and the Now card as they are): a one-line field "What should we build?" (Caveat label, Inter input, 44px+ tall, max ~120 chars); as the visitor types, the words appear on a tilted lime sticky note in Caveat; "Ship it" turns the note into a crisp ticket card (mono "ISSUE #001", the idea as the title, a status chip "ready to build", assignee Prajwal M P) using the site\'s compile move (strokes tighten, card fills) with a tangerine stamp "DRAFTED", then opens a mailto to his email with subject "Let\'s build: <idea>" and a short prefilled body; a small line says "Your email app opens with it." Empty submit: a gentle shake and a hint (reduced motion: no shake). Sketch mode (contract 5): the ticket stays a sketch. Real form semantics (label, button type submit), works on phones, no layout shift. Do not touch the footer unless something is broken.' },
  { key: 'hero-play', areas: ['hero'], model: 'sonnet', grammar: false, task: 'Small, delightful upgrades to the hero WITHOUT changing its look or the opening (Prajwal likes it). (1) The "Things I build" sticky note can be picked up and dragged (pointer: it lifts and tilts while held, settles with a soft spring, stays inside the hero area), and the dashed hand-drawn connector to the window re-routes live as it moves; double-click or a small "put back" affordance returns it; arrow keys nudge it when focused; touch drag must not block page scroll elsewhere. (2) Wire the stage\'s pencil button to sketch mode (contract 5) only if it fits naturally next to the existing x-ray behaviour (e.g. a second small control with its own accessible name); otherwise leave it and say so. (3) If the stage chips (idea, sketch, ui, api, data, deploy, shipped) do not already light up in sequence as the current project compiles, make them do so, so the chip row reads as a live pipeline. (4) In sketch mode the whole hero shows its sketch state. Verify the opening still plays exactly as before.' },
  { key: 'keyboard-legends', areas: ['stack', 'stack3d'], model: 'sonnet', grammar: false, task: 'Fix the 3D keyboard legends: the longest names ("Sentence Transformers", "WebSockets & Socket.IO", "Hibernate & JDBC", "TensorFlow & Keras", "CNNs & computer vision", "AWS - EC2, S3, RDS") render at about 6 CSS px. Every legend must read at >= 9 CSS px at 1440x900: give long names wider keys (1.5u-2.25u), or two short lines, and/or a short keycap legend (add an optional `short` field in src/components/stack/state.ts; keep contract 2 compatible) with the full name in the hover label and the side panel; widen the keyboard box if the stack grid allows. Make a key press feel satisfying (no sound): a quick accent ring/flash on the pressed key and a subtle squash. Keep the 2D keyboard in sync (same short legends where it helps). Sketch mode (contract 5): show the 2D keyboard (or whatever the sketchmode owner documents) - coordinate through the store only. Verify at 1440x900 and 1280x800 (idle, a pressed key, a selected long-name key) and the 2D fallback at 834 and 390.' },
]

phase('Boost')
log('Creative boost: ' + BOOSTERS.length + ' features in parallel - ' + BOOSTERS.map((b) => b.key).join(', '))
const boosted = await parallel(BOOSTERS.map((b) => () => agent(common([
  'ROLE: senior creative developer adding ONE creative feature to a finished site that the client likes, in parallel with ' + (BOOSTERS.length - 1) + ' other feature builders.',
  BOOST_CONTEXT,
  CONTRACTS_ALL,
  b.grammar ? DIAGRAM_GRAMMAR : '',
  ownership(b.areas),
  'TASK: ' + b.task,
  'QUALITY BAR: Awwwards Site-of-the-Day craft. Before coding, screenshot the current state of your area. Then build, and verify at 1440x900, 1280x800, 834x1194 and 390x844, with reduced motion, keyboard only, and touch-size targets; read your screenshots critically (filmstrips with --frames for anything animated) and iterate at least twice. npx tsc --noEmit passes; the detector is clean on your files; zero console errors. Report qaHooks.',
]), withModel({ label: 'boost:' + b.key, phase: 'Boost', schema: BOOST_RESULT }, b.model))))
log('Boost: ' + boosted.map((r, i) => BOOSTERS[i].key + (r ? ' ok' : ' FAILED')).join(', '))
const qaHooks = boosted.filter(Boolean).flatMap((r, i) => (r.qaHooks || []).map((h) => r.area + ': ' + h))

// ================= Integrate =================
phase('Integrate')
const integratePrompt = (when, issues) => common([
  'ROLE: integration engineer (' + when + '). You are the only agent running. You may edit any file; keep edits surgical in areas owned by others and keep every contract stable.',
  BOOST_CONTEXT,
  CONTRACTS_ALL,
  DIAGRAM_GRAMMAR,
  'NEW FEATURES AND THEIR QA HOOKS:\n' + JSON.stringify(qaHooks, null, 1),
  'OPEN ISSUES:\n' + JSON.stringify(issues || [], null, 1),
  'DO: (1) npx tsc --noEmit, fix; (2) npm run build, fix; (3) ensure a static preview at ' + PREVIEW + ' (cd ' + ROOT + ' && node scripts/serve.mjs > ' + SP + '/preview.log 2>&1 & if not answering) and restart it after each build; (4) screenshot the production home (desktop scroll steps:12 --wheel, mobile steps:14), one case study (desktop scroll through the journey, mobile) and reduced motion; drive EVERY new feature through its QA hooks (work Architecture view, case-study journey, build map + a hovered row, palette open + a command, sketch mode on/off on home + a case study + mobile, sticker drag, idea ticket, hero sticky-note drag, keyboard legends) and read the screenshots; (5) make the parallel features fit together: one diagram family (the three diagrams follow the grammar consistently; unify on src/components/diagram/ where it is cheap and safe), sketch mode covers the new features, no z-index fights (palette above everything, cursor, header, transition sheet), no section feeling cluttered; (6) resolve real open issues (add the palette hint in the footer if the palette builder asked); (7) zero console errors/hydration warnings; (8) measure the initial JS gzip of out/index.html and the lazy chunks and compare with the budget. Report home scrollHeight at 1440x900 and 390x844.',
])
const boostIssues = boosted.filter(Boolean).flatMap((r) => r.openIssues.map((i) => r.area + ': ' + i)).concat(PRIOR_ISSUES).concat([
  'PERFORMANCE (from the previous integration): home first-load JS was 340.9 KB gzip in 12 scripts, with one app chunk carrying every section, all six mini-UI templates and the content. Split it where it is safe: lazy mini-UI templates (load the template a MiniUI needs on demand), below-the-fold interactive client code via next/dynamic or React.lazy while keeping server-rendered HTML (no content hidden without JS, no layout shift), the palette body on first open. Target <= 260 KB gzip initial; report before/after.',
  'MOBILE LENGTH (from the previous integration): home is 21,395 px tall at 390x844 (Work 6.4k, Experience 4.8k). On phones only, show the first 4 "Also shipped" rows with a "Show all 9" toggle, and collapse each changelog card\'s highlights behind a "Details" disclosure (the role, company, dates and stack stay visible). Desktop unchanged.',
])
let integ = await agent(integratePrompt('after the creative boost', boostIssues), { label: 'integrate:boost', phase: 'Integrate', schema: INTEG })
log('Integration: build ' + (integ && integ.buildOk ? 'OK' : 'FAILED'))

// ================= Refine =================
const NEW_LAYER = 'the NEW creative layer (animated project architecture diagrams in Work, the case-study request journey, the live stack map in What I build, the Ctrl/⌘K terminal palette, sketch mode, throwable stickers, the idea ticket in Contact, the draggable hero sticky note, the readable keyboard legends)'
const LENSES = [
  { key: 'craft', model: 'fable', lens: 'Awwwards Site-of-the-Day juror and studio design director. First-viewport memory test, typography, composition and spacing rhythm, colour (the three accents combined creatively yet tastefully), the sketch->ship signature, coherence with the spec and the Livora reference polish, browser-surface theming, craft-floor refusals. Judge ' + NEW_LAYER + ': delightful, purposeful and polished - or gimmicky, cluttered, off-brand or half-finished? Does the page still feel calm and premium between the big moments? Prajwal asked for "amazing" and "something crazy": would a top studio ship this today?' },
  { key: 'motion', model: 'sonnet', lens: 'Motion director. Opening pacing (filmstrip), hero stage cycle, one authored moment per section, easing/timing in code, page transitions, cursor/hover feel, the 3D keyboard, and ' + NEW_LAYER + ': packet motion and pacing in the diagrams, the journey scrub, the sketch-mode transition, the sticker physics feel, the palette open/close and the hire-prajwal log. Every animation must have a purpose; reduced-motion path complete.' },
  { key: 'qa', model: 'sonnet', lens: 'Frontend QA, accessibility and performance engineer. Console/hydration errors, overflow at every viewport, keyboard path and focus (--keys), semantics/headings, computed contrast (also in sketch mode), dead/placeholder links, alts, JS payload incl. lazy chunks against the budget, WebGL hygiene, CLS/font loading, detector findings. Drive every control of ' + NEW_LAYER + ' by keyboard and by touch-size viewport: palette commands all work, sketch mode is readable, stickers do not block page scroll on touch, the ticket opens a correct mailto, nothing traps focus.' },
  { key: 'hiring', model: 'haiku', lens: 'Engineering manager/recruiter reviewing 50 portfolios a week. In 10 seconds: is it clear he is a Full Stack Developer (current role correct) who ships real software? Projects, stack, experience, résumé and contact findable fast on desktop AND mobile? Copy clear and truthful to src/content? Do the new features (architecture diagrams, palette, sketch mode, idea ticket) help you understand his work and remember him, or distract? Creative AND credible - clearly software, not electronics?' },
]
const capturePrompt = (round) => [
  STACK, VERIFY,
  'ROLE: capture engineer for review round ' + round + '. Evidence pack of the PRODUCTION build; edit nothing.',
  'QA HOOKS of the new features:\n' + JSON.stringify(qaHooks, null, 1),
  'STEPS: (1) cd ' + ROOT + ' && npm run build; (2) (re)start the preview at ' + PREVIEW + '; (3) capture into ' + SHOTS + '/r' + round + '/ : intro filmstrip desktop (--frames 0,300,700,1100,1600,2100,2700,4000); hero stage cycle filmstrip (--wait 3000 --frames 3000,4500,6000,7500,9000,10500); home desktop scroll (--wait 4500 --scroll steps:14 --wheel --settle 1400); laptop 1280x800 steps:10; tablet 834x1194 steps:12; mobile 390x844 steps:16; mobile menu open (--click); keyboard focus (--keys "Tab,Tab,Tab"); reduced motion full page desktop+mobile; one case study desktop (scroll filmstrip through the request journey) + mobile; the 404; (4) EVERY new feature through its QA hooks, idle and active: Work Architecture view (filmstrip), build map idle + a hovered row, palette open + "npm run hire-prajwal" output (--keys), sketch mode on (desktop scroll + mobile), a dragged sticker (scripted pointer events via --eval), the idea ticket after Ship it (neutralise the mailto navigation via --eval first), the dragged hero sticky note, a 3D keycap with a long name; (5) detector on the page at 1440x900 and 390x844; (6) JS payload (initial script tags of out/index.html, gzip) + every lazy chunk; (7) internal link check of out/**/*.html; (8) overflow + LOGS per capture. Open several PNGs to confirm validity. Return every screenshot path with what it shows.',
].join('\n\n')
const reviewPrompt = (l, cap, round) => common([
  'ROLE: independent reviewer, lens = ' + l.lens,
  BOOST_CONTEXT,
  'Review round ' + round + '. Edit NOTHING. Open the PNGs, read relevant source, take extra captures against ' + PREVIEW + ' if needed (save under ' + SHOTS + '/r' + round + '/' + l.key + '/).',
  'EVIDENCE (JSON):\n' + JSON.stringify(cap, null, 1),
  'Return verdict (ship/fix/rebuild) and findings ordered by impact: severity (high = broken, inaccessible, untruthful, or clearly below the anchor/Livora bar), owning area (' + Object.keys(AREAS).map((k) => k + ' = ' + AREAS[k]).join(' | ') + '), evidence (screenshot/file:line), specific fix. Also what to keep.',
])
const triagePrompt = (reviews, round) => [
  'ROLE: creative director running triage for refinement round ' + round + ' of ' + MAX_ROUNDS + '. Edit nothing.',
  DIRECTION_BLOCK,
  'Prajwal liked the redesign and explicitly asked for MORE: "make it amazing", "more creative animation designs like animated diagrams, projects, something crazy". Keep bold ideas and fix their execution; cut or tone down a feature only when it breaks accessibility or performance, clutters the page or reads as a gimmick even when well executed.',
  'REVIEWS (JSON):\n' + JSON.stringify(reviews, null, 1),
  'Merge duplicates, resolve conflicts, drop findings contradicting the spec, group into one workstream per owning area (' + Object.keys(AREAS).join(', ') + '), order by impact, max ~8 fixes per workstream. stop=true only if no high findings remain and the mediums are cosmetic.',
].join('\n\n')
const fixPrompt = (w, round) => common([
  'ROLE: senior creative developer applying refinement round ' + round + ' fixes for one area, in parallel with other areas.',
  BOOST_CONTEXT,
  CONTRACTS_ALL,
  ownership([w.area]),
  'FIXES:\n' + JSON.stringify(w.fixes, null, 1),
  'Apply every high and medium fix with craft (the named quality must actually appear), low when cheap; keep what reviewers praised. Verify each fix on ' + DEV + ' at the relevant viewports, reduced motion and sketch mode; read the screenshots. npx tsc --noEmit passes. Report changes, what you saw, and anything not fixed (why).',
])

const rounds = []
for (let round = 1; round <= MAX_ROUNDS; round++) {
  phase('Refine')
  const cap = await agent(capturePrompt(round), { label: 'capture:r' + round, phase: 'Refine', schema: CAPTURE, model: 'sonnet' })
  if (!cap) break
  const reviews = (await parallel(LENSES.map((l) => () => agent(reviewPrompt(l, cap, round), { label: 'review:' + l.key + ':r' + round, phase: 'Refine', schema: FINDINGS, model: l.model })))).filter(Boolean)
  const plan = await agent(triagePrompt(reviews, round), { label: 'triage:r' + round, phase: 'Refine', schema: PLAN, model: 'sonnet' })
  if (!plan) break
  rounds.push({ round, verdicts: reviews.map((r) => ({ lens: r.lens.slice(0, 30), verdict: r.verdict, findings: r.findings.length })), high: plan.highCount, medium: plan.mediumCount, stop: plan.stop, rationale: plan.rationale })
  log('Round ' + round + ': ' + reviews.map((r) => r.lens.split(' ')[0] + '=' + r.verdict).join(', ') + ' | high=' + plan.highCount + ' medium=' + plan.mediumCount)
  if (plan.stop && plan.highCount === 0) break
  const work = plan.workstreams.filter((w) => w.fixes && w.fixes.length)
  const fixed = await parallel(work.map((w) => () => agent(fixPrompt(w, round), withModel({ label: 'fix:' + w.area + ':r' + round, phase: 'Refine', schema: RESULT }, AREA_MODEL[w.area]))))
  const leftovers = fixed.filter(Boolean).flatMap((r) => r.openIssues.map((i) => r.area + ': ' + i))
  integ = await agent(integratePrompt('after refinement round ' + round, leftovers), { label: 'integrate:r' + round, phase: 'Refine', schema: INTEG, model: 'sonnet' })
  rounds[rounds.length - 1].integration = integ ? { buildOk: integ.buildOk, remaining: integ.remainingProblems } : null
}

// ================= Finish =================
phase('Finish')
const finish = await agent([
  STACK, VERIFY,
  'ROLE: release engineer. Final checks and documentation.',
  '1. GitHub Pages build: cd ' + ROOT + ' && npm run build:pages. Serve strictly under the base path (in Git Bash the env value must not be path-converted): MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/Portfolio PORT=4174 node scripts/serve.mjs (background). Capture http://localhost:4174/Portfolio/ and one case study at desktop and mobile, open the palette and toggle sketch mode there too; zero 404s/failed requests (fonts, chunks, textures, og.png, lazy chunks); check og:image/twitter:image on home and a case study point to https://prajwalps2603.github.io/Portfolio/og.png and the PNG is 1200x630 in the new look. Stop that server; run a normal npm run build again.',
  '2. README.md: update for the new creative layer (diagram engine and where it is used, the case-study journey, the stack map, the palette and its commands, sketch mode, sticker physics, the idea ticket) alongside what is already documented; keep it accurate to the code; measured numbers (initial JS gzip, lazy chunks).',
  '3. docs/DESIGN.md, docs/MOTION.md, docs/DEPLOY.md match the shipped implementation, including the new features, the diagram grammar and the sketch-mode rules.',
  '4. Remove stray temp files from the project root (never touch the PDFs, Chat.md, design/ or docs/handoff/).',
  'Return a summary with the measured numbers.',
].join('\n\n'), { label: 'finish', phase: 'Finish', schema: RESULT, model: 'sonnet' })

return {
  boosted: boosted.map((r, i) => (r ? { key: BOOSTERS[i].key, summary: r.summary.slice(0, 700), qaHooks: r.qaHooks, openIssues: r.openIssues } : { key: BOOSTERS[i].key, failed: true })),
  rounds,
  finalIntegration: integ,
  finish,
}
