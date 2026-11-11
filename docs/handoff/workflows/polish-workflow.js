export const meta = {
  name: 'portfolio-polish',
  description: 'Close the remaining gaps (3D bench board, bench pacing, Motion UI, leftovers), then refine in browser-verified review loops',
  phases: [
    { title: 'Build', detail: '4 parallel builders on disjoint files' },
    { title: 'Integrate', detail: 'production build and smoke test' },
    { title: 'Refine', detail: 'capture, 4-lens review, triage, parallel fixes, verify (looped)' },
    { title: 'Finish', detail: 'GitHub Pages build check and documentation' },
  ],
}

const A = args || {}
const DPATH = A.directionPath
const SKETCH = A.sketchDir
const NOTES = A.notes || ''
const MAX_ROUNDS = A.maxRounds || 3
if (!DPATH || !SKETCH) return { error: 'args.directionPath and args.sketchDir are required' }

const ROOT = 'C:/Users/Prajwal/Desktop/Portfolio'
const SP = 'C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad'
const DOSSIER = SP + '/dossier.md'
const SHOT = SP + '/tools/shot.mjs'
const DETECT = 'C:/Users/Prajwal/.claude/skills/impeccable/scripts/bin/windows-x64/impeccable.exe'
const DEV = 'http://localhost:3000'
const PREVIEW = 'http://localhost:4173'

const STACK = [
  'PROJECT: personal portfolio of Prajwal M P (current role: Full Stack Developer). Root: ' + ROOT,
  'STACK (installed, pinned): Next.js 16.4 App Router (Turbopack) + React 19.3 + TypeScript 5.9 (strict) + Tailwind CSS 4.3 (CSS-first config via @theme in src/app/globals.css, PostCSS plugin) + GSAP 3.15 (ScrollTrigger, SplitText, CustomEase are free and installed) + @gsap/react 2.1 + three 0.187 + @react-three/fiber 9.8 + @react-three/drei 10.7 + motion 14.9 (import from "motion/react") + lenis 1.3. Add a dependency only if truly necessary (npm i <pkg>@<exact version>), and say so in your result.',
  'DEPLOYMENT: static export (output: "export", trailingSlash: true) to GitHub Pages under basePath /Portfolio (NEXT_PUBLIC_BASE_PATH). Consequences: no server code, no API routes, no next/image optimisation, no runtime env secrets; every raw asset URL (img src, fetch, texture/font loaders, CSS url() in TS) must go through asset() from src/lib/asset.ts; next/link handles basePath itself. Dynamic routes need generateStaticParams.',
  'CONTENT: every fact comes from src/content/* (typed; import from "@/content"). Never hard-code facts in components; never invent metrics, clients, testimonials, dates or links. Provenance notes: ' + DOSSIER + ' . The current role MUST read "Full Stack Developer" (Maruti Flex Traders LLP, Dec 2025 - Present).',
  'EXISTING FOUNDATION (read before writing; reuse, do not duplicate): src/lib/motion/gsap.ts (import gsap, ScrollTrigger, SplitText, CustomEase, useGSAP ONLY from here), src/lib/motion/SmoothScroll.tsx (Lenis provider synced to GSAP ticker; useSmoothScroll() -> scrollTo/lock), src/lib/motion/media.ts (useReducedMotion, useFinePointer, useMediaQuery, prefersReducedMotion), src/lib/motion/pointer.ts (single shared pointer state + trackPointer()), src/lib/motion/useMagnetic.ts, src/lib/motion/useIntroMode.ts (full / short / none / pending), src/lib/hooks/useCopy.ts, src/lib/gpu.ts (getQualityTier, dprForTier, hasWebGL), src/lib/asset.ts.',
  'NEXT.JS 16 IS NEWER THAN YOUR TRAINING DATA (project AGENTS.md): before writing Next-specific code (routing, layouts, metadata, next/font, static export, generateStaticParams, async params, config), read the relevant guide in ' + ROOT + '/node_modules/next/dist/docs/ (01-app, 03-architecture) and heed deprecation notices. Leave AGENTS.md as is (next dev regenerates it).',
  'FACT CHECK: the sketch and spec contain project internals (model names, endpoints, counts such as indexed documents or tool counts, ports). Before any such detail ships, verify it in the public repository README: curl -s -H "Accept: application/vnd.github.raw" https://api.github.com/repos/Prajwalps2603/<repo>/readme . Unverifiable details are dropped, never guessed. Verified internals belong in src/content/projects.ts (owned by the work area) with a comment naming the source.',
  'NOTES (decisions made on Prajwal\'s behalf): ' + (NOTES || 'none'),
].join('\n')

const DIRECTION_BLOCK = [
  'CHOSEN CREATIVE DIRECTION: "Signal Chain". Prajwal delegated the choice; it was ranked top by three judges and the executive creative director. Its full spec is the contract - READ IT FIRST: ' + DPATH + ' (concept, sections, palette, typography, opening, hero, background, 3D, cursor, skills, about, contact, transitions, responsive, reduced motion, performance).',
  'APPROVED LIVE SKETCH: ' + SKETCH + '/index.html (+ any sketch.js / sketch.css there; screenshots in ' + SKETCH + '/shots/). It is the visual and motion reference: port its typography, palette, composition, easing curves, shaders and motion ideas faithfully into production React/TypeScript components, then raise the craft. Do not drift to a different look.',
].join('\n\n')

const CRAFT = [
  'CRAFT FLOOR (checked on the built result):',
  '- Contrast: body text >= 4.5:1, large text >= 3:1. Secondary text on coloured surfaces is tinted from that surface, never flat grey.',
  '- Type: fluid sizes with clamp(); body >= 16px with a 45-75ch measure; tracking floor -0.04em; text-wrap: balance on headings; obvious role scale; run the real copy at every breakpoint and fix overflow. Hero signature type may exceed normal display sizes only where the direction commits to it.',
  '- Motion: each section gets at most one authored moment, and never the same fade-up on every section. Arrivals use exponential ease-out (e.g. cubic-bezier(0.16,1,0.3,1) / expo.out); exits are faster than entrances; no bounce/elastic by reflex. Reach beyond opacity/transform where it carries meaning: clip-path, mask, blur, shader uniforms.',
  '- Progressive enhancement: content is visible if JavaScript fails or is slow - set hidden initial states from JS (gsap.set inside useGSAP), not in static CSS; never leave text at opacity 0 without a guaranteed animation.',
  '- Theme the browser surfaces from the palette: ::selection, caret-color, scrollbar, :focus-visible ring, link underline offset/thickness, tabular-nums for dates and data.',
  '- Refuse (rewrite if you catch yourself): eyebrow/kicker labels above headings; section numbers like 01/02/03 unless the sequence carries real information; gradient text; glass/blur as decoration; coloured side-stripe borders; same-size icon+heading+text card grids; the hero-metric template; emoji or unicode glyphs as icons (use authored SVG icons in one consistent stroke); monospace as a costume (mono only for code, data, measurement); system fonts as the display face; skill percentage bars/ratings; placeholder links or controls that do nothing.',
  '- States: hover, focus-visible, active, disabled where relevant; every control works.',
  '- Legibility floor: functional text (links, buttons, nav, labels, meta rows, captions, timecodes, annotations) is never below 11px at any breakpoint (non-interactive legal smallprint >= 10px); letter-spacing above 0.05em only on short uppercase labels, never on body or running text; no thick coloured border on one side of a card/panel (side-tab accent).',
  '- The approved sketch is the reference for look and motion, NOT for craft-floor violations: where the sketch breaks this floor (micro-labels under 11px, wide-tracked text, side-tab borders, etc.) the floor wins - keep the character, fix the defect.',
  '- Mechanical check before you finish: run the design detector on the files you touched - "' + DETECT + '" detect --json <your files or folders> - and fix every real finding; if you believe one is a false positive, say why in openIssues instead of ignoring it.',
].join('\n')

const A11Y = [
  'ACCESSIBILITY, MOTION & PERFORMANCE RULES:',
  '- prefers-reduced-motion: no intro (or an instant, non-spatial version), Lenis off (SmoothScroll already handles it), no parallax/scrub/pinning that moves content, no continuous loops (WebGL renders a static frame), keep opacity/colour feedback for state changes.',
  '- WebGL: lazy-load the canvas (next/dynamic with ssr:false), clamp DPR with dprForTier(getQualityTier()), pause rendering when the tab is hidden or the canvas is offscreen, provide a CSS/SVG fallback when hasWebGL() is false, dispose geometries/materials/textures on unmount.',
  '- Keyboard & semantics: skip link; header/nav/main/footer landmarks; exactly one h1 per page; logical heading order; every interactive element reachable and visibly focused; Esc closes overlays; decorative canvases aria-hidden; external links rel="noopener noreferrer" and target="_blank" with an accessible hint.',
  '- Touch: no custom cursor on coarse pointers; tap targets >= 44px; anything revealed on hover is also reachable on touch.',
  '- No layout shift: fonts via next/font (self-hosted, display swap, fallback metrics); reserve space for media and canvases.',
  '- GSAP in React: always useGSAP() with a scope ref (automatic cleanup), or gsap.context in effects; kill ScrollTriggers on unmount; ScrollTrigger.refresh() after fonts load / layout changes; React StrictMode double-mounts in dev, so effects must be idempotent.',
].join('\n')

const VERIFY = [
  'BROWSER VERIFICATION (mandatory - look at your own work):',
  '- A Next dev server is already running at ' + DEV + ' (hot reload). If it does not answer (curl -s -o /dev/null -w "%{http_code}" ' + DEV + '/), start one in the background: cd ' + ROOT + ' && npx next dev -p 3000 > ' + SP + '/dev.log 2>&1 &  and wait for it.',
  '- Screenshot tool (headless Edge, WebGL works): node "' + SHOT + '" --url <url> --out <dir> --name <prefix> [--viewport desktop|laptop|tablet|tablet-landscape|mobile|WxH] [--wait ms] [--frames 0,500,...] [--scroll y1,y2 | --scroll steps:N] [--wheel] [--settle ms] [--full] [--reduced-motion] [--hover x,y] [--hover-selector css] [--click css] [--keys "Tab,Tab"] [--eval js] [--selector css]. It prints SAVED paths, METRICS (scrollHeight, canvases, horizontalOverflow) and LOGS (console errors, page errors, failed requests, HTTP >= 400). View PNGs with the Read tool. Use --wheel for scroll captures (Lenis).',
  '- Repeat visits: the intro plays fully once per browser session; every tool run is a fresh session, so expect it each time (use --wait 5000+ to get past it, or --frames to film it).',
  '- Dev compiles on demand: after edits, warm the route first (curl -s ' + DEV + '/ > /dev/null; for a case study curl the /work/<slug>/ URL) - a cold Turbopack compile of three/R3F can take 10-20 s, and screenshots taken during compilation are blank or show the error overlay. If a capture shows a Next error overlay, read it: it may be caused by another builder editing in parallel - wait 30 s and retry before assuming it is yours.',
  '- Type-check with: cd ' + ROOT + ' && npx tsc --noEmit . Do NOT run "next build" during parallel phases (the integrator owns production builds).',
  '- Save your screenshots under ' + SP + '/shots/build/<your-area>/ .',
].join('\n')

const AREAS = {
  foundation: 'src/app/layout.tsx, src/app/page.tsx, src/app/globals.css, src/app/not-found.tsx, src/app/icon.svg, src/lib/**, src/components/chrome/**, src/components/cursor/**, src/components/transition/**, src/components/icons/**, src/components/ui/**, src/fonts/**, docs/**, next.config.ts',
  'intro-hero': 'src/components/intro/**, src/components/hero/**',
  scene: 'src/components/scene/**',
  work: 'src/components/work/**, src/app/work/**, src/content/projects.ts',
  about: 'src/components/about/**, src/components/experience/**, src/components/credentials/**',
  skills: 'src/components/skills/**',
  contact: 'src/components/contact/**, src/components/footer/**',
}

// Model routing: strongest model (inherited) for the hardest visual work; faster models elsewhere.
const AREA_MODEL = { 'intro-hero': undefined, scene: undefined, foundation: undefined, work: 'sonnet', about: 'sonnet', skills: 'sonnet', contact: 'sonnet' }
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
    buildOk: { type: 'boolean' },
    typecheckOk: { type: 'boolean' },
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
    consoleAndNetwork: { type: 'string' },
    detector: { type: 'string', description: 'impeccable detector findings summary (desktop + mobile)' },
    bundle: { type: 'string', description: 'JS payload: total and largest chunks; first-load estimate' },
    links: { type: 'string', description: 'internal link check result and list of external links found' },
    overflow: { type: 'string', description: 'horizontal overflow per viewport' },
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
      title: { type: 'string' },
      evidence: { type: 'string', description: 'screenshot path and/or file:line' },
      fix: { type: 'string', description: 'specific, actionable change' },
    }, required: ['severity', 'area', 'title', 'evidence', 'fix'] } },
    keep: { type: 'array', items: { type: 'string' }, description: 'what is excellent and must not be diluted' },
  },
  required: ['lens', 'verdict', 'findings', 'keep'],
}

const PLAN = {
  type: 'object',
  properties: {
    stop: { type: 'boolean', description: 'true only if nothing high remains and the remaining items are cosmetic' },
    rationale: { type: 'string' },
    highCount: { type: 'number' },
    mediumCount: { type: 'number' },
    workstreams: { type: 'array', items: { type: 'object', properties: {
      area: { type: 'string', enum: Object.keys(AREAS) },
      fixes: { type: 'array', items: { type: 'object', properties: {
        severity: { type: 'string', enum: ['high', 'medium', 'low'] },
        title: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' },
      }, required: ['severity', 'title', 'evidence', 'fix'] } },
    }, required: ['area', 'fixes'] } },
    keep: { type: 'array', items: { type: 'string' } },
  },
  required: ['stop', 'rationale', 'highCount', 'mediumCount', 'workstreams', 'keep'],
}

const common = (extra) => [STACK, DIRECTION_BLOCK, CRAFT, A11Y, VERIFY].concat(extra || []).join('\n\n')
const ownership = (area) => 'FILE OWNERSHIP: you may create/edit ONLY: ' + AREAS[area] + ' . Other agents are editing other areas in parallel. If you need a change elsewhere, do not make it - list it in openIssues with the exact change needed.'

// ---------------- Build: the remaining gaps, in parallel on disjoint files ----------------
const START = A.startRound || 3
const R2 = SP + '/r2-state.json'
const OWN = {
  board3d: 'src/components/work/board3d/** (new folder), src/components/work/Board.tsx, src/components/work/BoardGraph.tsx',
  bench: 'src/components/work/** EXCEPT board3d/**, Board.tsx and BoardGraph.tsx; plus src/app/work/** and src/content/projects.ts',
  heroChrome: AREAS['intro-hero'] + ', ' + AREAS.scene + ', ' + AREAS.foundation,
  sections: AREAS.about + ', ' + AREAS.skills + ', ' + AREAS.contact + ', src/content/education.ts',
}
const own = (k) => 'FILE OWNERSHIP: you may create/edit ONLY: ' + OWN[k] + ' . Three other agents edit other files in parallel. Need a change elsewhere? Do not make it; put the exact change in openIssues.'
const STATE = 'CONTEXT: the site is built and refined twice already (it is good: keep what the reviewers praised). Round-2 triage, per-area fix results and the remaining open issues are in ' + R2 + ' - read it. Current production captures: ' + SP + '/shots/final-check/ .'

phase('Build')
const BUILDERS = [
  { key: 'board3d', model: undefined, task: [
    'Build the ONE interactive 3D element the brief requires (required experience 6) and the spec promises: the BENCH BOARD in React Three Fiber, exactly as the spec field "threeD" in the direction file describes. Today only the SVG board ships everywhere; the SVG stays as the fallback.',
    'Read src/components/work/Board.tsx, BoardGraph.tsx, Probes.tsx, Scope.tsx, Bench.tsx and the systems data in src/content/projects.ts first. The 3D board must render from the SAME system data and share the SAME probe/selection state as the SVG board (one source of truth), so probing a connection in 3D drives the existing scope readout exactly like the SVG does.',
    'Keep the exported component and props contract of Board.tsx unchanged (Bench.tsx, owned by another agent, uses it): Board decides internally whether to render the 3D board or the SVG board.',
    'When 3D: desktop/large-tablet landscape with a fine pointer, WebGL2 available, deviceMemory > 2, no Save-Data. Phones and portrait tablets keep the SVG. Reduced motion: static 3D board (no tilt, no pulses, instant probe swaps) or SVG if simpler. Lazy: next/dynamic(ssr:false) imported when Systems is within ~1.2 viewports; never on the critical path; prefetch on idle after LCP.',
    'Look: a graphite FR4 board with bone silkscreen; chips as low rounded boxes in the five channel columns with channel-colour outlines; labels baked into one CanvasTexture per system (redrawn on system change, never per frame) with crisp DOM labels for the active chip; connections as one merged constant-pixel-width line batch (three/examples Line2/LineSegments2); probe hooks in channel colours; orthographic 3/4 camera (~35deg tilt) with damped pointer tilt +/-4deg; a bone request pulse travelling the copper at constant speed. Match the palette tokens exactly (read them from src/app/globals.css).',
    'Interaction: hover/tap a connection to probe it (same state as SVG), hover/tap a chip for its role and tech; the keyboard path stays on the existing DOM controls (the canvas is aria-hidden; nothing becomes mouse-only).',
    'Performance: frameloop="demand" (invalidate on interaction/pulse), <= 30 draw calls, < 5k triangles, DPR clamp via dprForTier, pause when offscreen/hidden, dispose on unmount, pending-selection queue for picks made before the scene is ready. Prefer plain three + @react-three/fiber; use @react-three/drei only for something it does much better. Report the gzip size of the new lazy chunk.',
    'Also fix in your files: "Board and scope lack board physicality" (the SVG board should read as a physical board too: restrained FR4 edge, silkscreen, mounting holes) and "Tapping a default-pinned connection un-probes it" if that logic lives in your files.',
    'Verify on the dev server at 1440x900 and 1280x800 (3D on), 834x1194 and 390x844 (SVG), and reduced motion: screenshots of the board idle, with a connection probed (use --hover-selector / --click), and while switching systems; zero console errors.',
  ] },
  { key: 'bench', model: undefined, task: [
    'Fix the one remaining HIGH finding: Bench pacing. The home page is ~14.5k px tall on desktop (target <= 12,000 px at 1440x900) and ~19.4k px on mobile (target <= 18,000 px at 390x844), almost all from the Systems/Bench section. Cut each entry to the shape the direction intends (read the spec sections "02 Systems: the bench" and "projectShowcase"): the home entry shows the essentials (name, one-line purpose, 3-4 key facts, the board/scope via Board, the what-if, links); the full spec table, request-path detail and long copy move to the datasheet /work/[slug] page (nothing true is lost - it moves). Measure scrollHeight with the screenshot tool METRICS before and after, at both viewports, and hit the targets.',
    'Use the Motion library (import { LazyMotion, domAnimation, m, AnimatePresence } from "motion/react") where the spec assigns it: probe readout swaps and what-if state changes (short, purposeful, reduced-motion aware). Keep GSAP for scroll choreography.',
    'Also fix in your files (see the work workstream in ' + R2 + '): request-path steps read as plain text (make them a legible step sequence in the instrument language); figure caption set as 12px mono running text (use the body/small role for running text); "Repository opened 2026" metadata is unsourced (use only verifiable facts from src/content/projects.ts or drop it); the Archive (Also built) reveal should use a clip-path wipe instead of the generic y+fade; the datasheet layout must read well with the moved content.',
    'Do not change Board.tsx/BoardGraph.tsx (another agent is adding the 3D board there) - treat <Board> as a black box with its current props.',
  ] },
  { key: 'heroChrome', model: 'sonnet', task: [
    'Fix these remaining items (details in ' + R2 + '): (1) on phones the open lane panel collides with the Sigma chip and the NOW row - nothing may overlap at 390x844 and 360x780; (2) the trigger handle is hard to discover at rest - make its affordance visible without adding an eyebrow or tooltip clutter (e.g. a quiet handle state, a one-time hint after the intro, an honest label); (3) phone lane pitch is tight and the chips cover the traces - give the traces room; (4) the ECE-to-Full-Stack line repeats the role as a 12px caption strip - make it read as intended information at >= 11px without repeating the role verbatim; (5) the page-transition reveal leg uses inOut - use the documented arrival ease; (6) focus-visible parity for the cursor brackets.',
    'OG/social image: add a static Open Graph image so links to the site render a card (layout.tsx declares summary_large_image but there is none). Check node_modules/next/dist/docs for how opengraph-image / metadata images work with output: "export" in Next 16; produce a 1200x630 image in the Signal Chain look (name, Full Stack Developer, the five traces) - either an opengraph-image route statically rendered at build time, or a committed PNG in public/ referenced from metadata with the correct absolute URL (site.url). Verify the built out/ contains it and the meta tags point to it.',
    'Background traces behind dense copy were addressed in round 2 with data-ambient="quiet"; re-check the Statement, Stack and Connect sections and finish the job if any copy still has traces behind it.',
  ] },
  { key: 'sections', model: 'sonnet', task: [
    'Fix these remaining items (details in ' + R2 + '): (1) Contact: the copy-address feedback should use Motion (AnimatePresence from "motion/react") for a crisp, purposeful state swap (reduced-motion aware); check the social rows too - in a capture the LinkedIn row label box looked shifted relative to its row on hover; make hover states aligned and consistent across rows. (2) The History sheet reintroduces retired patterns (see the r2 triage) - remove them while keeping the revision-history idea. (3) SSLC shows a ten-year range as the credential date: set the SSLC period in src/content/education.ts to the completion year 2019 and remove any component-level mapping. (4) Education uses a generic y-plus-fade that flashes after the intro - give it its own small authored reveal consistent with docs/MOTION.md. (5) Skills: Livora has no action in the stack detail panel - give it its live-site link (from the projects data) and verify it renders.',
  ] },
]

const built = await parallel(BUILDERS.map((b) => () => agent(common([
  'ROLE: senior creative developer finishing one part of an almost-finished award-level portfolio, in parallel with three other agents.',
  STATE,
  own(b.key),
  'TASK:\n' + b.task.join('\n'),
  'Follow docs/DESIGN.md and docs/MOTION.md. Verify everything you change in the browser (dev server) at the relevant viewports and with reduced motion, and read the screenshots critically. npx tsc --noEmit must pass. Run the design detector on the files you touched.',
]), withModel({ label: 'build:' + b.key, phase: 'Build', schema: RESULT }, b.model))))
log('Build: ' + built.map((r, i) => BUILDERS[i].key + (r ? ' ok' : ' FAILED')).join(', '))

phase('Integrate')
const integratePrompt = (when, issues) => common([
  'ROLE: integration engineer (' + when + '). You are the only agent running now. You may edit any file, but keep edits minimal and surgical in areas owned by others.',
  'OPEN ISSUES REPORTED BY BUILDERS:\n' + JSON.stringify(issues || [], null, 1),
  'DO: (1) npx tsc --noEmit and fix errors; (2) npm run build (static export) and fix failures; (3) make sure a static preview server is running: curl ' + PREVIEW + '/ ; if not, start it in the background: cd ' + ROOT + ' && node scripts/serve.mjs > ' + SP + '/preview.log 2>&1 &  (it serves ./out); (4) screenshot the production home page and one case-study page at desktop and mobile, plus reduced motion; read them; confirm the 3D bench board renders on desktop and the SVG board on mobile, and report home scrollHeight at 1440x900 and 390x844; (5) resolve the open issues that are real; (6) check the console for errors and hydration warnings and fix their causes.',
  'Return honestly: build/typecheck status, console errors seen, fixes made, remaining problems.',
])
const allIssues = built.filter(Boolean).flatMap((r) => r.openIssues.map((i) => r.area + ': ' + i))
let integ = await agent(integratePrompt('after the polish build', allIssues), { label: 'integrate', phase: 'Integrate', schema: INTEG })
log('Integration: build ' + (integ && integ.buildOk ? 'OK' : 'FAILED') + '; remaining: ' + (integ ? integ.remainingProblems.length : '?'))

// ---------------- Refine loop ----------------
const LENSES = [
  { key: 'craft', model: 'fable', lens: 'Awwwards Site-of-the-Day juror and studio design director. Judge the first-viewport memory test, typography craft, composition/grid/spacing rhythm, colour and contrast, the signature moment, coherence with the approved direction and sketch, browser-surface theming, and craft-floor refusals. Would a top studio ship this today?' },
  { key: 'motion', model: 'sonnet', lens: 'Motion director. Judge the intro pacing (filmstrip), hero type animation, scroll choreography (is there one authored moment per section or the same fade-up everywhere?), easing and timing (read the GSAP/motion code), page transitions, cursor and hover feel, how the 3D/background integrates with content, and the reduced-motion path. Every animation must have a purpose.' },
  { key: 'qa', model: 'sonnet', lens: 'Frontend QA, accessibility and performance engineer. Judge console/hydration errors, horizontal overflow at every viewport, keyboard path and focus visibility (use --keys to tab), semantics and heading outline, contrast of real computed colours, dead/placeholder links, image alts, JS payload, WebGL hygiene (DPR clamp, pause offscreen, dispose, fallback), font loading/CLS, and the detector findings. Severity high = broken or inaccessible.' },
  { key: 'hiring', model: 'haiku', lens: 'Engineering manager and tech recruiter who reviews 50 portfolios a week. Within 10 seconds: is it clear he is a Full Stack Developer (current role correct) who ships complete systems? Can you find projects, stack, experience, résumé and contact fast on desktop AND mobile? Is the copy in his own clear language, truthful to src/content, free of filler? Does motion help or get in the way? Would you interview him?' },
]

const capturePrompt = (round) => [
  STACK,
  VERIFY,
  'ROLE: capture engineer for review round ' + round + '. Produce a complete, valid evidence pack of the PRODUCTION build for four reviewers. Do not edit source files.',
  'STEPS: (1) cd ' + ROOT + ' && npm run build (report failure output verbatim if it fails); (2) ensure the static preview server answers at ' + PREVIEW + ' (start node scripts/serve.mjs in the background if needed); (3) capture into ' + SP + '/shots/r' + round + '/ :',
  '   a. intro filmstrip desktop: --frames 0,300,700,1200,1800,2600,3500,5000',
  '   b. home desktop scroll: --wait 5500 --scroll steps:12 --wheel --settle 1400',
  '   c. hover states: --wait 5500 with --hover-selector on the primary hero CTA, on the first project item, and on a skill item (inspect the DOM/source to pick selectors)',
  '   d. laptop 1280x800 scroll steps:8; tablet 834x1194 scroll steps:10; mobile 390x844 scroll steps:14 (all --wheel --settle 1300 --wait 5500)',
  '   e. mobile menu open (--click on the menu button) and keyboard focus (--keys "Tab,Tab,Tab" desktop)',
  '   f. reduced motion full page desktop and mobile (--reduced-motion --full --wait 1500)',
  '   g. first case-study page desktop scroll steps:6 and mobile scroll steps:8; and the 404 page',
  '(4) run the design detector on the rendered page: "' + DETECT + '" detect --json ' + PREVIEW + '/ --viewport 1440x900 and again with --viewport 390x844 (summarise findings); (5) JS payload: total size of out/_next/static/chunks/*.js and the 5 largest files; (6) internal link check: every href/src starting with / in out/**/*.html resolves to a file in out/; list external links; (7) note horizontalOverflow and LOGS from every capture.',
  'Open a few of the PNGs to confirm they are valid (not blank, intro not covering everything in scroll captures). Return every screenshot path with a short description of what it shows.',
].join('\n\n')

const reviewPrompt = (l, cap, round) => common([
  'ROLE: independent reviewer, lens = ' + l.lens,
  'This is review round ' + round + '. You edit NOTHING. Review the evidence pack below (open the PNGs with Read), read the relevant source files, and take extra targeted screenshots against ' + PREVIEW + ' if you need them (save under ' + SP + '/shots/r' + round + '/' + l.key + '/).',
  'EVIDENCE PACK (JSON):\n' + JSON.stringify(cap, null, 1),
  'Return a verdict (ship / fix / rebuild) and findings ordered by impact. Each finding: severity (high = broken, inaccessible, untruthful, or clearly below the approved sketch; medium = noticeably weakens quality; low = polish), the owning area (' + Object.keys(AREAS).map((k) => k + ' = ' + AREAS[k]).join(' | ') + '), evidence (screenshot path and/or file:line), and a specific fix. Also list what is excellent and must be kept. Be demanding: compare against the best studio portfolios, not against effort.',
])

const triagePrompt = (reviews, round) => [
  'ROLE: creative director running triage for refinement round ' + round + ' (final allowed round: ' + (START + MAX_ROUNDS - 1) + '). You edit nothing.',
  DIRECTION_BLOCK,
  'REVIEWS (JSON):\n' + JSON.stringify(reviews, null, 1),
  'Merge duplicate findings across lenses, resolve conflicts between lenses (e.g. motion wants more, QA wants less: decide in favour of purpose, accessibility and performance), drop findings that contradict the approved direction, and group the rest into workstreams by owning area (one workstream per area; each workstream is edited by one agent in parallel, so a fix must live inside its area: ' + Object.keys(AREAS).map((k) => k + ' = ' + AREAS[k]).join(' | ') + '). Order fixes by impact. Defer low-value polish if a workstream is overloaded (max ~8 fixes per workstream).',
  'Set stop=true only if no high-severity findings remain AND the remaining medium items are cosmetic' + (round < 2 ? ' (this is round 1: stop must be false unless the site is genuinely flawless)' : '') + '.',
].join('\n\n')

const fixPrompt = (w, round) => common([
  'ROLE: senior creative developer applying refinement round ' + round + ' fixes for one area, in parallel with other areas.',
  ownership(w.area),
  'FIXES (ordered by impact):\n' + JSON.stringify(w.fixes, null, 1),
  'Apply every high and medium fix with craft (not mechanically: the quality the finding names must actually appear). Apply low fixes when cheap. Do not regress what reviewers said to keep. Verify each fix in the browser against the dev server ' + DEV + ' at the relevant viewports (and reduced motion where relevant) and look at the screenshots. npx tsc --noEmit must pass. Report what you changed, what you saw, and anything you could not fix (with why).',
])

const rounds = []
for (let round = START; round < START + MAX_ROUNDS; round++) {
  phase('Refine')
  const cap = await agent(capturePrompt(round), { label: 'capture:r' + round, phase: 'Refine', schema: CAPTURE, model: 'haiku', effort: 'low' })
  if (!cap) { log('capture failed in round ' + round); break }
  const reviews = (await parallel(LENSES.map((l) => () => agent(reviewPrompt(l, cap, round), { label: 'review:' + l.key + ':r' + round, phase: 'Refine', schema: FINDINGS, model: l.model })))).filter(Boolean)
  const verdicts = reviews.map((r) => r.lens.split(' ')[0] + '=' + r.verdict)
  const plan = await agent(triagePrompt(reviews, round), { label: 'triage:r' + round, phase: 'Refine', schema: PLAN, model: 'sonnet' })
  if (!plan) { log('triage failed in round ' + round); break }
  rounds.push({ round, verdicts: reviews.map((r) => ({ lens: r.lens.slice(0, 30), verdict: r.verdict, findings: r.findings.length })), high: plan.highCount, medium: plan.mediumCount, stop: plan.stop, rationale: plan.rationale })
  log('Round ' + round + ': ' + verdicts.join(', ') + ' | high=' + plan.highCount + ' medium=' + plan.mediumCount + ' stop=' + plan.stop)
  if (plan.stop && plan.highCount === 0 && round >= 2) break
  const work = plan.workstreams.filter((w) => w.fixes && w.fixes.length)
  const fixed = await parallel(work.map((w) => () => agent(fixPrompt(w, round), withModel({ label: 'fix:' + w.area + ':r' + round, phase: 'Refine', schema: RESULT }, AREA_MODEL[w.area]))))
  const leftovers = fixed.filter(Boolean).flatMap((r) => r.openIssues.map((i) => r.area + ': ' + i))
  integ = await agent(integratePrompt('after refinement round ' + round, leftovers), { label: 'integrate:r' + round, phase: 'Refine', schema: INTEG, model: 'sonnet' })
  rounds[rounds.length - 1].integration = integ ? { buildOk: integ.buildOk, remaining: integ.remainingProblems } : null
}

// ---------------- Finish ----------------
phase('Finish')
const finish = await agent([
  STACK,
  VERIFY,
  'ROLE: release engineer. Final checks and documentation.',
  '1. GitHub Pages build: cd ' + ROOT + ' && npm run build:pages (basePath /Portfolio). Serve it: set NEXT_PUBLIC_BASE_PATH=/Portfolio and PORT=4174 for node scripts/serve.mjs (background), then capture http://localhost:4174/Portfolio/ and one case study at desktop and mobile; confirm zero 404s/failed requests in LOGS (fonts, chunks, textures, icons) and that navigation between pages works. Fix any basePath problems (raw asset URLs must use asset()). Stop that server afterwards. Finally run a normal npm run build again so out/ matches local preview.',
  '2. Update README.md (it exists - keep it accurate): the 3D bench board now ships (React Three Fiber, desktop only, lazy) and Motion is used for UI state; remove any dependency that is truly unused after checking imports (npm uninstall), and say what is used where. Also cover: what the site is, stack, scripts (dev, build, build:pages, preview, typecheck), how to edit content (src/content/*), how to swap the résumé link, how deployment works (.github/workflows/deploy.yml -> GitHub Pages at /Portfolio, replacing the old site), accessibility and reduced-motion behaviour, performance notes, design docs (docs/DESIGN.md, docs/MOTION.md), credits. Keep it concise and accurate.',
  '3. Make sure docs/DESIGN.md and docs/MOTION.md describe the final implementation (update where builders diverged).',
  '4. Remove stray temporary files from the project root (never touch the résumé/cover-letter PDFs or design/directions).',
  'Return a summary.',
].join('\n\n'), { label: 'finish', phase: 'Finish', schema: RESULT, model: 'sonnet' })

return { built: built.filter(Boolean).map((r) => ({ area: r.area, summary: r.summary, openIssues: r.openIssues })), rounds, finalIntegration: integ, finish }
