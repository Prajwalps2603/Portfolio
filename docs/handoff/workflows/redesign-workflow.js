export const meta = {
  name: 'portfolio-redesign-sketch-to-ship',
  description: 'Redesign the portfolio from scratch as "Sketch to Ship" (Livora-inspired), anchor-first, then refine in browser-verified loops',
  phases: [
    { title: 'Anchor', detail: 'foundation + hero signature moment, critiqued and refined before anything else' },
    { title: 'Sections', detail: '6 parallel section builders on disjoint files' },
    { title: 'Integrate', detail: 'production build and smoke test' },
    { title: 'Refine', detail: 'capture, 4-lens review, triage, parallel fixes (looped)' },
    { title: 'Finish', detail: 'GitHub Pages check, OG card, docs' },
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
  'This is a REDESIGN FROM SCRATCH. Prajwal rejected the previous "Signal Chain" design (an electronics/oscilloscope theme: "I am a software developer, both are mismatch, and the design is too bad, make it creative"). Its code is archived in design/archive/signal-chain-src - never reuse its look, palette, fonts, vocabulary (channels, scope, probes, traces, graticule, TRIG\'D, datasheets) or any electronics/hardware metaphor. Generic behaviour may be reused (smooth scroll, focus traps, copy-to-clipboard, page-transition mechanics), the visual layer is new.',
  'STACK (installed, pinned): Next.js 16.4 App Router (Turbopack) + React 19.3 + TypeScript 5.9 strict + Tailwind CSS 4.3 (CSS-first @theme in src/app/globals.css) + GSAP 3.15 (ScrollTrigger, SplitText, CustomEase free) + @gsap/react 2.1 + three 0.187 + @react-three/fiber 9.8 + motion 14.9 (import from "motion/react") + lenis 1.3. @react-three/drei was removed; three/examples/jsm (e.g. RoundedBoxGeometry) is available. Add a dependency only if truly necessary (npm i <pkg>@<exact version>) and say so.',
  'NEXT.JS 16 IS NEWER THAN YOUR TRAINING DATA (AGENTS.md): read the relevant guide in ' + ROOT + '/node_modules/next/dist/docs/ before writing Next-specific code (routing, metadata, next/font, static export, route handlers, async params) and heed deprecations. Leave AGENTS.md alone.',
  'DEPLOYMENT: static export (output "export", trailingSlash) to GitHub Pages under basePath /Portfolio. No server code, no API routes (only force-static GET route handlers), no next/image optimisation; raw asset URLs go through asset() in src/lib/asset.ts; next/link handles basePath. metadataBase is the bare origin (site.origin); share-card paths come from src/lib/og.ts ogImages().',
  'CONTENT: every fact comes from src/content/* (typed; import from "@/content"): profile (name, title, statement, tagline, about, learning, route, socials, resume), experience, projects (featured + archive, architecture, flow, links), capabilities ("What I build"), skills (usedIn evidence), education, certifications. Never hard-code facts; never invent metrics, clients, testimonials or KPIs (mock UIs use real labels/features; illustrative data must look illustrative). Livora is a project he built - NEVER call him co-founder. No phone number. Email prajwalnair2603@gmail.com. The current role must read "Full Stack Developer".',
  'REUSABLE UTILITIES (read before writing; refactor if needed): src/lib/motion/gsap.ts (import gsap/ScrollTrigger/SplitText/CustomEase/useGSAP only from here), src/lib/motion/SmoothScroll.tsx (Lenis + ScrollTrigger + app-wide anchor handling), src/lib/motion/media.ts, src/lib/motion/pointer.ts, src/lib/motion/useMagnetic.ts, src/lib/motion/useIntroMode.ts (+ its boot helpers), src/lib/hooks/useCopy.ts, src/lib/gpu.ts, src/lib/asset.ts, src/lib/routes.ts, src/lib/og.ts. Signal-Chain-specific modules (e.g. src/lib/channels.ts, scope stores, channel eases) are to be removed or rewritten by the foundation lead.',
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
  hero: 'src/components/intro/**, src/components/hero/**, src/components/sketch/**, src/components/miniui/**',
  build: 'src/components/build/**',
  work: 'src/components/work/**, src/app/work/**, src/content/projects.ts',
  stack: 'src/components/stack/**',
  changelog: 'src/components/changelog/**',
  about: 'src/components/about/**',
  contact: 'src/components/contact/**, src/components/footer/**',
}
const AREA_MODEL = { foundation: undefined, hero: undefined, work: undefined, stack: undefined, build: 'sonnet', changelog: 'sonnet', about: 'sonnet', contact: 'sonnet' }
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

// ================= Anchor: foundation -> hero -> independent critique -> refine =================
phase('Anchor')
const foundation = await agent(common([
  'ROLE: lead creative developer and design-system owner. You set the design system, the sketch system and the shell that every other builder will follow literally. The previous design was rejected - this must look and feel like a premium, creative studio portfolio in the Livora family.',
  ownership(['foundation']) + ' (You may also DELETE the old Signal Chain components under src/components/** that you are not reusing - they are archived. Leave src/components/<area>/ folders of other areas as stubs only.)',
  'BUILD:',
  '1. Clean slate: remove the old Signal Chain components and concept-specific lib modules (archived in design/archive/signal-chain-src). Keep and reuse generic utilities listed above.',
  '2. Fonts via next/font/google: Bricolage Grotesque (variable, opsz + wght 500-800), Inter (400/500/600), JetBrains Mono (400/500), Caveat (500-700). CSS variables, only used weights.',
  '3. Tokens in src/app/globals.css (@theme): the full palette from the spec (named by role, incl. soft/deep variants), font families, a fluid type scale (display/h2/h3/lead/body/small/label/hand), radii (pill, card 28px, panel 14px), the two Livora-like shadows, easing CSS vars (arrive, pen, snap, exit), z-layers. Theme browser surfaces. Paper dot-grid utility.',
  '4. Motion system in src/lib/motion/: named eases (arrive/pen/snap/exit as GSAP CustomEase + CSS vars), a HighlighterSwipe primitive (once-in-view scaleX swipe behind words, colour prop lime|blue|tangerine), a split-text arrival helper, reduced-motion handling, intro mode (full/short/none) reusing useIntroMode.',
  '5. The sketch system in src/components/sketch/ (shared, used by hero, work and case studies - you create the primitives, the hero agent extends them): a seeded rough-path generator (wobbly rect/line/arrow/circle/underline/scribble, double-stroke corners), <SketchRect>, <SketchLine>, <SketchArrow>, <Scribble>, <HandNote> (Caveat), <StickyNote color tilt>, and a draw-on animation helper (stroke-dashoffset with the pen ease). Deterministic (no Math.random at render - seed from props) so SSR and client match.',
  '6. UI primitives in src/components/ui/: Pill (primary ink / outline / lime-on-ink, magnetic optional), Card, Section (paper | paper-2 | ink, id, spacing), Label (mono), Tag, IconButton, ExternalLink (rel/target/hint), SkipLink, AppWindow frame (three dots + mono title + body) for mini-UIs.',
  '7. Interactive background (src/components/background/): the paper dot-grid canvas from spec section 4 (pointer-reactive dots, idle breathing, static on touch/reduced motion, paused offscreen).',
  '8. Shell: src/app/layout.tsx (fonts, SmoothScroll, transitions, skip link, header, cursor, <main id="main">, footer slot), header + mobile menu (src/components/chrome) per the spec, a custom cursor (src/components/cursor: small ink dot + ring; ring fills with the hovered element\'s accent; label mode "View" / "Press" / "Copy" via data-cursor + data-cursor-label; fine pointers only), page transitions (src/components/transition: a paper sheet with a hand-drawn edge wiping across, instant with reduced motion), authored icons (src/components/icons).',
  '9. src/app/page.tsx composing: Intro (hero area), Hero, BuildSection, Work, Stack, Changelog, About, Contact in this order with the ids from the spec; create minimal stub components for each area folder (src/components/{intro,hero,build,work,stack,changelog,about,contact,footer}/index.tsx) exporting the names you import, rendering a semantic placeholder section with the right id. Also a stub src/app/work/[slug]/page.tsx (generateStaticParams over featuredProjects, async params) - the work builder replaces it. 404 page per the spec ("This page never shipped.").',
  '10. Share card: redesign src/lib/ogCard.tsx + src/app/og.png/route.tsx in the new look (paper, ink "PRAJWAL M P" in Bricolage, "Full Stack Developer", three highlighter swipes, a small sketch-to-ship motif). ImageResponse needs TTF: download Latin subsets of Bricolage Grotesque 800 and Inter 600 from the Google Fonts CSS2 API (curl without a browser UA returns truetype URLs; use &text= with A-Z a-z 0-9 and punctuation) into src/fonts/og/, read with fs at build. Remove the old Archivo OG fonts.',
  '11. docs/DESIGN.md and docs/MOTION.md rewritten for the new system: tokens and when to use each accent, type roles with exact classes, spacing, components and their props, sketch system API, cursor contract, transitions, section ids, the one authored moment per section, durations, reduced motion, perf budget, do/don\'t. Builders follow these literally - be concrete.',
  'Verify: npx tsc --noEmit passes; dev server renders the shell + stubs at desktop and mobile with no console errors; header, mobile menu, cursor, background and a sample HighlighterSwipe/StickyNote/SketchRect look premium (put a temporary showcase only inside a stub, not shipped). Compare your screenshots to the Livora references for polish level.',
]), { label: 'anchor:foundation', phase: 'Anchor', schema: RESULT })
if (!foundation) return { error: 'foundation failed' }
log('Foundation: ' + foundation.summary.slice(0, 220))

const heroPrompt = (extra) => common([
  'ROLE: senior creative developer building the SIGNATURE of the whole site: the opening sequence and the hero with the sketch -> ship stage. This is the anchor every other section will be judged against.',
  'FOUNDATION SUMMARY: ' + foundation.summary,
  ownership(['hero']),
  'Read docs/DESIGN.md, docs/MOTION.md and src/components/sketch/* first; extend the sketch primitives as needed (you own them now).',
  'BUILD (spec sections 1, 3 "01 Hero", 5 "Opening"):',
  '1. Mini-UI templates in src/components/miniui/: editor (ResumAI), chat (Drone Intelligence), phone (Audify AI), calendar (BookMyVenue), scan (Brain Tumor Detection), pipeline (MCP Job Agent). Each template is ONE element list rendered in two states - "sketch" (SketchRect/HandNote/Scribble at matching positions) and "ship" (crisp UI inside AppWindow) - with a compile() transition between them (strokes tighten into borders, labels swap, panels fill, then a tangerine SHIPPED stamp with snap ease). Real labels/features from src/content only. Export a <MiniUI project state="sketch|ship|auto"> API that the work builder and case studies will reuse (document it in a header comment).',
  '2. The hero exactly as specified: h1 name, role line with lime swipe on "Full Stack", statement, pills, status line, the stage window cycling 4 projects every ~6s with stage chips, the tilted "Things I build" sticky note with four multi-colour highlighted lines and the dashed hand-drawn connector into the window, the hover lens revealing the sketch underneath, click -> case study (/work/<slug>/ via next/link or the transition link), pause on hover/focus/offscreen/reduced motion.',
  '3. The opening (<= 2.6s, skippable, short on repeat, none with reduced motion): the whole hero is first a sketch, then ships into the real hero; the stamp lands on the window at the end. No-JS safety: content never hidden if JS fails.',
  '4. Responsive per spec section 6 (phone order, smaller window, no lens, no connector).',
  'Verify: intro filmstrip (--frames 0,300,700,1100,1600,2100,2700,4000), hero at desktop/laptop/tablet/mobile, hover lens (--hover-selector on the window), a full cycle filmstrip of the stage (--wait 4000 --frames ...), reduced motion. Read every PNG critically against the Livora references and the spec. Iterate until it is genuinely striking and polished. npx tsc --noEmit passes; detector clean on your files.',
].concat(extra || []))

let hero = await agent(heroPrompt(), { label: 'anchor:hero', phase: 'Anchor', schema: RESULT })
if (!hero) return { error: 'hero failed', foundation: foundation.summary }

const heroReview = await agent([
  STACK, DIRECTION_BLOCK, CRAFT, VERIFY,
  'ROLE: independent design director (Awwwards juror) reviewing ONLY the anchor: foundation look + opening + hero. You edit nothing. Prajwal rejected the previous design as "too bad" - be demanding: would this make a recruiter and a design director stop and say "wow, and he is clearly a software developer"?',
  'Take your own captures from ' + DEV + ' into ' + SHOTS + '/anchor-review: intro filmstrip, hero desktop 1440x900 and 1280x800, tablet, mobile, hover lens, a stage cycle filmstrip, reduced motion. Compare against the Livora references in ' + LIVORA + ' and the spec. Read the source to understand the motion.',
  'Builder notes: ' + hero.summary.slice(0, 1500),
  'Return verdict, first impression and specific fixes (area foundation or hero), ordered by impact, plus what must be kept.',
].join('\n\n'), { label: 'anchor:hero-review', phase: 'Anchor', schema: HERO_REVIEW, model: 'fable' })

if (heroReview && heroReview.fixes.length) {
  log('Hero review: ' + heroReview.verdict + ' - ' + heroReview.fixes.length + ' fixes')
  hero = (await agent(heroPrompt([
    'REVIEW TO APPLY (from an independent design director):\n' + JSON.stringify(heroReview, null, 1),
    'You may edit BOTH the foundation and hero areas for this pass (no other agent is running). Apply every high and medium fix with craft; keep what the reviewer praised; re-verify everything.',
  ]), { label: 'anchor:hero-refine', phase: 'Anchor', schema: RESULT })) || hero
}

// ================= Sections (parallel) =================
phase('Sections')
const SECTIONS = [
  { area: 'build', task: 'Build "02 What I build" (#build) exactly per the spec from src/content/capabilities.ts: Livora-style numbered rows made our own; hover/focus floods the row with its rotating accent (lime / blue-soft / tangerine-soft) and slides in a handwritten "proof:" note resolving `proof` ids to real projects/roles (links to /work/<slug>/ for featured projects, repo/live for archive, #changelog for roles); touch = accordion. Heading with a blue HighlighterSwipe on "build".' },
  { area: 'work', task: 'Build "03 Selected work" (#work) and the case studies. Home: desktop sticky two-column (index of the 6 featured projects + a tilting project stage using <MiniUI state="ship"> from src/components/miniui, tagline, real metrics only, stack pills, Case study / Repository / Live pills), scrolling the index swaps the stage with a wipe + re-compile; mobile stacked cards. "Also shipped" list of the 9 archive projects with a handwritten "more on GitHub" note (real GitHub link). Case studies src/app/work/[slug]/page.tsx (generateStaticParams over featured projects, async params, metadata with ogImages() and canonical URL): hero with <MiniUI> playing sketch->ship once, problem, approach, "How it works" architecture/flow drawn as a hand-sketched diagram that compiles into crisp nodes on scroll, highlights, stack, next/previous with the page transition. Need a MiniUI change? openIssues (hero area owns it).' },
  { area: 'stack', task: 'Build "04 Stack" (#stack, ink section) with the ONE 3D element: the React Three Fiber mechanical keyboard per the spec (keycaps = technologies from src/content/skills.ts coloured by layer, legends baked into one CanvasTexture atlas, instanced/merged geometry where possible, 3/4 view, gentle pointer tilt, press on hover/click/typing the first letter on the real keyboard, a crisp side panel resolving usedIn to projects/roles as links). Lazy (next/dynamic ssr:false, only near #stack, desktop/large landscape with fine pointer + WebGL2 + deviceMemory > 2); DOM list of the same skills is the accessible/keyboard path and drives the same selection; a designed 2D CSS keyboard for phones/portrait tablets/reduced motion/no WebGL. frameloop demand, DPR clamp, pause offscreen, dispose. Report the lazy chunk gzip size.' },
  { area: 'changelog', task: 'Build "05 Experience" (#changelog) as the "Changelog" git history per the spec: main branch line (draws on scroll, scrubbed), internships as blue feature branches merging back, the current role as HEAD with a tangerine "HEAD -> main · current" tag, commit cards (version tag, role, company, location, dates, duration, highlights, stack pills), the award as a tagged commit, `init` = BE KVGCE 2021. One handwritten margin note max per card, factual only. Mobile: line on the left edge.' },
  { area: 'about', task: 'Build "06 About" (#about) per the spec: the README.md file card (profile.about, currently learning, route chips Koppa -> Sullia -> Bengaluru), 2-3 handwritten margin annotations with doodled arrows, compact education rows, and the certifications as die-cut laptop stickers on an ink "lid" (three accents; hover/focus peels a corner and shows "Verify ↗" linking the real credential; the BE award shows "Awarded 2025" without a link). Touch: tap toggles the peel; links remain reachable.' },
  { area: 'contact', task: 'Build "07 Contact" (#contact, ink slab) and the footer per the spec: "Let\'s build something." with a lime swipe on "build", the big email with a hand-drawn underline that draws on hover and a mailto, a Copy pill using Motion AnimatePresence to swap to "Copied ✓" (tangerine; reduced-motion = fade), social pills, a Résumé pill (profile.resume.href), the "Now" card (live Bengaluru IST clock updating each minute, current role, open to new opportunities). Footer: name, one-line mono credit, back-to-top, year. Email must wrap cleanly on phones.' },
]
const sectionResults = await parallel(SECTIONS.map((s) => () => agent(common([
  'ROLE: senior creative developer building one section, in parallel with five others. Follow docs/DESIGN.md and docs/MOTION.md literally and match the anchor (hero) - the site must read as one hand.',
  'FOUNDATION: ' + foundation.summary.slice(0, 1500),
  'HERO/ANCHOR: ' + hero.summary.slice(0, 1500),
  ownership([s.area]),
  'TASK: ' + s.task,
  'Replace the stub in your area keeping the exported names page.tsx imports. Verify at desktop 1440, laptop 1280, tablet 834, mobile 390, reduced motion, hover/focus states; read screenshots critically against the hero and the Livora references; iterate at least twice. npx tsc --noEmit passes; detector clean on your files.',
]), withModel({ label: 'build:' + s.area, phase: 'Sections', schema: RESULT }, AREA_MODEL[s.area]))))
log('Sections: ' + sectionResults.map((r, i) => SECTIONS[i].area + (r ? ' ok' : ' FAILED')).join(', '))

// ================= Integrate =================
phase('Integrate')
const integratePrompt = (when, issues) => common([
  'ROLE: integration engineer (' + when + '). You are the only agent running. You may edit any file; keep edits surgical in areas owned by others.',
  'OPEN ISSUES:\n' + JSON.stringify(issues || [], null, 1),
  'DO: (1) npx tsc --noEmit, fix; (2) npm run build, fix; (3) ensure a static preview at ' + PREVIEW + ' (cd ' + ROOT + ' && node scripts/serve.mjs > ' + SP + '/preview.log 2>&1 & if not answering); (4) screenshot production home (desktop scroll steps:12 --wheel, mobile steps:14) and one case study (desktop, mobile) and reduced motion; read them; (5) resolve real open issues; (6) zero console errors/hydration warnings. Report home scrollHeight at 1440x900 and 390x844.',
])
const allIssues = sectionResults.filter(Boolean).flatMap((r) => r.openIssues.map((i) => r.area + ': ' + i)).concat(hero.openIssues.map((i) => 'hero: ' + i), foundation.openIssues.map((i) => 'foundation: ' + i))
let integ = await agent(integratePrompt('after the section build', allIssues), { label: 'integrate', phase: 'Integrate', schema: INTEG, model: 'sonnet' })
log('Integration: build ' + (integ && integ.buildOk ? 'OK' : 'FAILED'))

// ================= Refine =================
const LENSES = [
  { key: 'craft', model: 'fable', lens: 'Awwwards Site-of-the-Day juror and studio design director. First-viewport memory test, typography, composition and spacing rhythm, colour (are the three accents combined creatively yet tastefully?), the sketch->ship signature, coherence with the spec and the Livora reference polish, browser-surface theming, craft-floor refusals. Prajwal rejected the last design as "too bad": would a top studio ship this today?' },
  { key: 'motion', model: 'sonnet', lens: 'Motion director. Opening pacing (filmstrip), hero stage cycle, the one authored moment per section (or the same fade-up everywhere?), easing/timing in code, page transitions, cursor/hover feel, 3D keyboard feel, reduced-motion path. Every animation must have a purpose.' },
  { key: 'qa', model: 'sonnet', lens: 'Frontend QA, accessibility and performance engineer. Console/hydration errors, overflow at every viewport, keyboard path and focus (--keys), semantics/headings, computed contrast, dead/placeholder links, alts, JS payload incl. lazy 3D chunk, WebGL hygiene, CLS/font loading, detector findings.' },
  { key: 'hiring', model: 'haiku', lens: 'Engineering manager/recruiter reviewing 50 portfolios a week. In 10 seconds: is it clear he is a Full Stack Developer (current role correct) who ships real software? Projects, stack, experience, résumé and contact findable fast on desktop AND mobile? Copy clear and truthful to src/content? Does it feel creative AND credible - and clearly software, not electronics?' },
]
const capturePrompt = (round) => [
  STACK, VERIFY,
  'ROLE: capture engineer for review round ' + round + '. Evidence pack of the PRODUCTION build; edit nothing.',
  'STEPS: (1) cd ' + ROOT + ' && npm run build; (2) preview at ' + PREVIEW + '; (3) capture into ' + SHOTS + '/r' + round + '/ : intro filmstrip desktop (--frames 0,300,700,1100,1600,2100,2700,4000); hero stage cycle filmstrip (--wait 3000 --frames 3000,4500,6000,7500,9000,10500); home desktop scroll (--wait 4500 --scroll steps:14 --wheel --settle 1400); hovers (--hover-selector on the hero window, a capability row, a project stage, a keycap or skill, a sticker); laptop 1280x800 steps:10; tablet 834x1194 steps:12; mobile 390x844 steps:16; mobile menu open (--click); keyboard focus (--keys "Tab,Tab,Tab"); reduced motion full page desktop+mobile; one case study desktop+mobile; the 404; (4) detector on the page at 1440x900 and 390x844; (5) JS payload (initial script tags of out/index.html, gzip) + the lazy 3D chunk; (6) internal link check of out/**/*.html; (7) overflow + LOGS per capture. Open several PNGs to confirm validity. Return every screenshot path with what it shows.',
].join('\n\n')
const reviewPrompt = (l, cap, round) => common([
  'ROLE: independent reviewer, lens = ' + l.lens,
  'Review round ' + round + '. Edit NOTHING. Open the PNGs, read relevant source, take extra captures against ' + PREVIEW + ' if needed (save under ' + SHOTS + '/r' + round + '/' + l.key + '/).',
  'EVIDENCE (JSON):\n' + JSON.stringify(cap, null, 1),
  'Return verdict (ship/fix/rebuild) and findings ordered by impact: severity (high = broken, inaccessible, untruthful, or clearly below the anchor/Livora bar), owning area (' + Object.keys(AREAS).map((k) => k + ' = ' + AREAS[k]).join(' | ') + '), evidence (screenshot/file:line), specific fix. Also what to keep.',
])
const triagePrompt = (reviews, round) => [
  'ROLE: creative director running triage for refinement round ' + round + ' of ' + MAX_ROUNDS + '. Edit nothing.',
  DIRECTION_BLOCK,
  'REVIEWS (JSON):\n' + JSON.stringify(reviews, null, 1),
  'Merge duplicates, resolve conflicts (purpose, accessibility and performance win over spectacle), drop findings contradicting the spec, group into one workstream per owning area (' + Object.keys(AREAS).join(', ') + '), order by impact, max ~8 fixes per workstream. stop=true only if no high findings remain and mediums are cosmetic' + (round < 2 ? ' (round 1: stop must be false unless flawless)' : '') + '.',
].join('\n\n')
const fixPrompt = (w, round) => common([
  'ROLE: senior creative developer applying refinement round ' + round + ' fixes for one area, in parallel with other areas.',
  ownership([w.area]),
  'FIXES:\n' + JSON.stringify(w.fixes, null, 1),
  'Apply every high and medium fix with craft (the named quality must actually appear), low when cheap; keep what reviewers praised. Verify each fix on ' + DEV + ' at the relevant viewports and reduced motion; read the screenshots. npx tsc --noEmit passes. Report changes, what you saw, and anything not fixed (why).',
])

const rounds = []
for (let round = 1; round <= MAX_ROUNDS; round++) {
  phase('Refine')
  const cap = await agent(capturePrompt(round), { label: 'capture:r' + round, phase: 'Refine', schema: CAPTURE, model: 'haiku', effort: 'low' })
  if (!cap) break
  const reviews = (await parallel(LENSES.map((l) => () => agent(reviewPrompt(l, cap, round), { label: 'review:' + l.key + ':r' + round, phase: 'Refine', schema: FINDINGS, model: l.model })))).filter(Boolean)
  const plan = await agent(triagePrompt(reviews, round), { label: 'triage:r' + round, phase: 'Refine', schema: PLAN, model: 'sonnet' })
  if (!plan) break
  rounds.push({ round, verdicts: reviews.map((r) => ({ lens: r.lens.slice(0, 30), verdict: r.verdict, findings: r.findings.length })), high: plan.highCount, medium: plan.mediumCount, stop: plan.stop, rationale: plan.rationale })
  log('Round ' + round + ': ' + reviews.map((r) => r.lens.split(' ')[0] + '=' + r.verdict).join(', ') + ' | high=' + plan.highCount + ' medium=' + plan.mediumCount)
  if (plan.stop && plan.highCount === 0 && round >= 2) break
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
  '1. GitHub Pages build: cd ' + ROOT + ' && npm run build:pages. Serve strictly under the base path (in Git Bash the env value must not be path-converted): MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/Portfolio PORT=4174 node scripts/serve.mjs (background). Capture http://localhost:4174/Portfolio/ and one case study at desktop and mobile; zero 404s/failed requests (fonts, chunks, textures, og.png); check og:image/twitter:image on home and a case study point to https://prajwalps2603.github.io/Portfolio/og.png and the PNG is 1200x630 in the new look. Stop that server; run a normal npm run build again.',
  '2. README.md: rewrite for the new design (what it is: Sketch -> Ship concept in Livora\'s design family; stack and where each library is used; scripts; editing content incl. capabilities.ts; résumé link; deployment; accessibility/reduced motion; performance with measured numbers; docs; credits). Remove every Signal Chain reference except a one-line note that it is archived in design/archive.',
  '3. docs/DESIGN.md, docs/MOTION.md, docs/DEPLOY.md match the shipped implementation.',
  '4. Remove stray temp files from the project root (never touch the PDFs, Chat.md, design/ or docs/handoff/).',
  'Return a summary with the measured numbers.',
].join('\n\n'), { label: 'finish', phase: 'Finish', schema: RESULT, model: 'sonnet' })

return {
  foundation: foundation.summary,
  hero: hero.summary,
  heroReview: heroReview ? { verdict: heroReview.verdict, firstImpression: heroReview.firstImpression, fixes: heroReview.fixes.length } : null,
  sections: sectionResults.filter(Boolean).map((r) => ({ area: r.area, summary: r.summary.slice(0, 600), openIssues: r.openIssues })),
  rounds,
  finalIntegration: integ,
  finish,
}
