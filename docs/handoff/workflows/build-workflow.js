export const meta = {
  name: 'portfolio-build',
  description: 'Build the chosen creative direction into the Next.js portfolio, then refine it in browser-verified review loops',
  phases: [
    { title: 'Foundation', detail: 'design system, motion system, shell, cursor, transitions, navigation' },
    { title: 'Sections', detail: 'parallel section builds on disjoint files' },
    { title: 'Integrate', detail: 'compose, production build, smoke test' },
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

// ---------------- Foundation ----------------
phase('Foundation')
const foundation = await agent(common([
  'ROLE: lead creative developer. You set the design system and the motion system that six parallel section builders will follow, so precision and documentation matter more than anything.',
  ownership('foundation'),
  'BUILD:',
  '1. Fonts: the direction\'s exact families via next/font (google when available; for Fontshare or other free sources download the woff2 files into src/fonts/ and use next/font/local). Expose CSS variables. Only the weights you use.',
  '2. Design tokens in src/app/globals.css with Tailwind v4 @theme: colours (from the direction palette, named by role), font families, a fluid type scale, spacing rhythm, radii if any, easing curves as CSS custom properties, z-index layers. Theme browser surfaces (selection, caret, scrollbar, focus-visible ring, underline offsets). Grain/texture overlays if the direction specifies them (CSS/SVG, cheap).',
  '3. Motion system in src/lib/motion/: named CustomEase curves matching the sketch (eases.ts), a reusable split-text reveal primitive (e.g. <SplitReveal> using SplitText with mask lines, reduced-motion aware), a scroll-reveal helper, a parallax primitive (disabled for reduced motion), and the shared stage store src/lib/stores/stage.ts (tiny observable store using useSyncExternalStore) holding intro state (pending/playing/done), active section, scroll progress and anything the scene must react to.',
  '4. App shell: src/app/layout.tsx (fonts, metadata already present - keep it, SmoothScroll provider, skip link, header/navigation, cursor, page-transition provider, <main id="main">), src/app/page.tsx composing the home page in the direction\'s section order, and an on-brand src/app/not-found.tsx and src/app/icon.svg (monogram).',
  '5. Custom cursor (src/components/cursor/): desktop fine-pointer only, driven by src/lib/motion/pointer.ts, with a documented data-attribute contract (e.g. data-cursor="link|view|drag|hide|text" and data-cursor-label="...") that section builders use for hover states.',
  '6. Page transitions (src/components/transition/): a TransitionProvider + TransitionLink that plays the direction\'s exit/enter transition between routes (home <-> /work/[slug]/), respects basePath via next/link, handles back/forward, and is instant with reduced motion.',
  '7. Header/navigation (src/components/chrome/): name/monogram, section links that scroll smoothly via useSmoothScroll().scrollTo, a refined mobile menu (focus-trapped, Esc to close, body scroll lock), and anything global the direction specifies (e.g. availability indicator, local time).',
  '8. Authored SVG icon set (src/components/icons/): arrow, arrow-up-right (external), copy, check, mail, github, linkedin, x, instagram, menu, close - one consistent stroke.',
  '9. Section stubs so the page compiles before the builders start: src/components/intro/index.tsx, hero/index.tsx, scene/index.tsx, work/index.tsx, about/index.tsx, skills/index.tsx, contact/index.tsx, footer/index.tsx - each exporting the named component that page.tsx/layout.tsx import (render a minimal semantic placeholder section with the right id so anchors work). Also create src/app/work/[slug]/page.tsx with generateStaticParams over featured projects rendering a minimal page (the work builder will replace it). Decide where the background scene mounts (layout vs page) per the direction and wire the stub there.',
  '10. Documentation for the builders: docs/DESIGN.md (tokens, type roles with exact classes/vars, spacing rhythm, grid, colour roles and contrast pairs, z-index layers, component conventions, cursor contract, transition API, stage store API, section ids, do/don\'t list) and docs/MOTION.md (motion thesis, named eases and when to use each, duration table, the one authored moment per section from the direction spec, reduced-motion behaviour, ScrollTrigger conventions incl. cleanup and refresh, performance budget). Be concrete: builders will follow these literally.',
  'Then verify: npx tsc --noEmit passes, the dev server renders the shell at desktop and mobile with no console errors, the mobile menu opens/closes, the cursor reacts, and the type/colour system matches the sketch (compare with ' + SKETCH + '/shots/). Fix what you see.',
]), { label: 'foundation', phase: 'Foundation', schema: RESULT })
if (!foundation) return { error: 'foundation failed' }
log('Foundation done: ' + foundation.summary.slice(0, 200))

// ---------------- Sections (parallel) ----------------
phase('Sections')
const SECTIONS = [
  { area: 'intro-hero', task: 'Build the cinematic OPENING SEQUENCE and the HERO exactly as the direction specifies (openingSequence, heroTypography, signatureMoment), ported from the approved sketch. Use useIntroMode() (full on first visit per session, short on repeat, none with reduced motion), drive the stage store (intro playing/done) so the header, scene and hero choreograph together, lock scrolling during the intro via useSmoothScroll().lock and always release it, allow skip on click / key / wheel / touch, and guarantee a no-JS safety (the intro cover must never block content if JS fails). The hero must state who he is and what he does within 2 seconds of the intro ending: name, "Full Stack Developer", the positioning statement, and a primary call to action; the h1 is real text.' },
  { area: 'scene', task: 'Build the INTERACTIVE VISUAL BACKGROUND and the INTERACTIVE 3D ELEMENTS (interactiveBackground, threeD in the spec) with @react-three/fiber + drei (custom shaders where the sketch uses them), ported from the approved sketch and raised in quality. Read pointer state from src/lib/motion/pointer.ts, react to the stage store (intro progress, active section, scroll) and to scroll. Quality tiers + DPR clamp, pause offscreen/hidden, static frame with reduced motion, CSS/SVG fallback without WebGL, lazy-loaded so it never blocks first paint or LCP, disposed on unmount. The scene must support the content, never fight it for legibility.' },
  { area: 'work', task: 'Build the ANIMATED PROJECT SHOWCASE on the home page (projectShowcase in the spec) for the featured projects, an archive index for the remaining projects (title, one-liner, stack, real repo/live links), and the CASE-STUDY ROUTES src/app/work/[slug]/page.tsx (generateStaticParams over featured projects; static metadata per project) presenting summary, problem, approach, highlights, architecture/flow (visualised in the direction\'s language), stack, metrics only if real, award if any, real links, and next/previous project navigation using TransitionLink. Hover/cursor states via the data-cursor contract. Touch-friendly on mobile.' },
  { area: 'about', task: 'Build the CREATIVE ABOUT section (aboutSection in the spec) and the EXPERIENCE presentation (roles, with the current Full Stack Developer role at Maruti Flex clearly first), plus EDUCATION and CERTIFICATIONS/AWARDS with real credential links - in the direction\'s storytelling device (the route Koppa -> Sullia -> Bengaluru is factual and available in src/content/profile.ts). No alternating-dot timelines, no avatars; one authored moment, not a stack of identical reveals.' },
  { area: 'skills', task: 'Build the ANIMATED SKILLS AND TECHNOLOGY presentation (skillsPresentation in the spec) from src/content/skills.ts: grouped by layer, evidence-based (each skill links/points to the projects or roles where it was used via usedIn), no percentages, ratings, radar charts or logo clouds. Make the interaction meaningful (e.g. hovering/tapping a skill reveals where it was used) and accessible on touch and keyboard.' },
  { area: 'contact', task: 'Build the CONTACT section with refined transitions (contactSection in the spec) and the FOOTER: the real email as a large mailto call-to-action, copy-to-clipboard with clear animated feedback (useCopy), real social links, the résumé link from profile.resume, availability, location (a live Bengaluru local-time clock is welcome). Everything must work on a static site - no forms that post anywhere. Footer with name, socials, back-to-top (smooth via useSmoothScroll) and credits in the direction\'s voice.' },
]

const sectionResults = await parallel(SECTIONS.map((s) => () => agent(common([
  'ROLE: senior creative developer building one area of the site, in parallel with five other builders. Follow docs/DESIGN.md and docs/MOTION.md (written by the foundation lead) literally so the site reads as one hand.',
  'FOUNDATION SUMMARY: ' + foundation.summary,
  ownership(s.area),
  'YOUR AREA: ' + s.area + '. TASK: ' + s.task,
  'Replace the stub component(s) in your area with the real implementation, keeping the exported names/props page.tsx and layout.tsx import (check them).',
  'Verify in the browser at desktop (1440), tablet (834) and mobile (390), with reduced motion, and with hover/focus states; read the screenshots critically against the sketch and the spec; fix; repeat at least twice. npx tsc --noEmit must pass for your files.',
]), withModel({ label: 'build:' + s.area, phase: 'Sections', schema: RESULT }, AREA_MODEL[s.area]))))
log('Sections: ' + sectionResults.map((r, i) => SECTIONS[i].area + (r ? ' ok' : ' FAILED')).join(', '))

// ---------------- Integrate ----------------
phase('Integrate')
const integratePrompt = (when, issues) => common([
  'ROLE: integration engineer (' + when + '). You are the only agent running now. You may edit any file, but keep edits minimal and surgical in areas owned by others.',
  'OPEN ISSUES REPORTED BY BUILDERS:\n' + JSON.stringify(issues || [], null, 1),
  'DO: (1) npx tsc --noEmit and fix errors; (2) npm run build (static export) and fix failures; (3) make sure a static preview server is running: curl ' + PREVIEW + '/ ; if not, start it in the background: cd ' + ROOT + ' && node scripts/serve.mjs > ' + SP + '/preview.log 2>&1 &  (it serves ./out); (4) screenshot the production home page and one case-study page at desktop and mobile, plus reduced motion; read them; (5) resolve the open issues that are real; (6) check the page in the browser console for errors and hydration warnings and fix their causes.',
  'Return honestly: build/typecheck status, console errors seen, fixes made, remaining problems.',
])
const allIssues = sectionResults.filter(Boolean).flatMap((r) => r.openIssues.map((i) => r.area + ': ' + i)).concat(foundation.openIssues.map((i) => 'foundation: ' + i))
let integ = await agent(integratePrompt('after the parallel section build', allIssues), { label: 'integrate', phase: 'Integrate', schema: INTEG, model: 'sonnet' })
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
  'ROLE: creative director running triage for refinement round ' + round + ' of ' + MAX_ROUNDS + '. You edit nothing.',
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
for (let round = 1; round <= MAX_ROUNDS; round++) {
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
  '2. Write README.md: what the site is, stack, scripts (dev, build, build:pages, preview, typecheck), how to edit content (src/content/*), how to swap the résumé link, how deployment works (.github/workflows/deploy.yml -> GitHub Pages at /Portfolio, replacing the old site), accessibility and reduced-motion behaviour, performance notes, design docs (docs/DESIGN.md, docs/MOTION.md), credits. Keep it concise and accurate.',
  '3. Make sure docs/DESIGN.md and docs/MOTION.md describe the final implementation (update where builders diverged).',
  '4. Remove stray temporary files from the project root (never touch the résumé/cover-letter PDFs or design/directions).',
  'Return a summary.',
].join('\n\n'), { label: 'finish', phase: 'Finish', schema: RESULT, model: 'sonnet' })

return { foundation: foundation.summary, sections: sectionResults.filter(Boolean).map((r) => ({ area: r.area, summary: r.summary, openIssues: r.openIssues })), rounds, finalIntegration: integ, finish }
