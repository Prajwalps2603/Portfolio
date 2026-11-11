# Deploy: GitHub Pages under /Portfolio

The site ships as a static export (`output: "export"`, `trailingSlash: true`) to
`https://prajwalps2603.github.io/Portfolio/`. The base path comes from `NEXT_PUBLIC_BASE_PATH`
(`npm run build:pages` sets it to `/Portfolio`; `npm run build` builds for the root).

## Rules that keep the base path honest

- `next/link`, `router.push` and `router.prefetch` add the base path themselves: pass app paths
  (`/work/resumai/`, `/#work`). Helpers live in `src/lib/routes.ts`.
- A hard navigation (`location.assign`) goes through `withBasePath()` from `src/lib/routes.ts`.
- Any raw asset URL (img `src`, `fetch`, texture or font loaders, CSS `url()` built in TS) goes
  through `asset()` from `src/lib/asset.ts`. Today there are none: no `public/` folder, fonts are
  self-hosted by `next/font` and referenced relatively from the CSS (`url(../media/*.woff2)`),
  and the 3D keyboard's legends are drawn on a canvas at runtime.
- Path comparisons strip the base first: `normalizePath()` (routes.ts) and the inline boot script
  (`src/lib/motion/bootScript.ts`, receives the base path from the layout).

## Verification record (Sketch → Ship integration, 2026-11-06)

Build: `npx tsc --noEmit` clean; `npm run build` and `npm run build:pages` (Next 16.4.5,
Turbopack) compile cleanly and export `/`, `/_not-found`, `/icon.svg`, `/og.png` and the six
`/work/<slug>/` pages; `flatten-rsc` adds 7 flat RSC payloads.

**Static grep of the `/Portfolio` export.** Every `src` / `href` starting with `/` in
`out/index.html`, `out/work/*/index.html` and `out/404.html` starts with `/Portfolio/` (0
unprefixed). `og:image` = `https://prajwalps2603.github.io/Portfolio/og.png` and the canonical
URLs carry `/Portfolio/` (home and every case study). A root build points them at the bare
domain instead; only the Pages build is deployed.

| Check (headless Edge, WebGL on) | Result |
|---|---|
| `/Portfolio/` at 1440×900, wheel-scroll to the footer | no console errors or failed requests; the lazy 3D keyboard loads through the base path (2 canvases: background lens + keyboard) |
| `/Portfolio/work/audify-ai/` at 390×844 | renders, no console errors |
| `/Portfolio/og.png` | 200 `image/png`, 1200×630, the paper card (name, "Full Stack Developer", sketch → shipped window) |
| Root build on `:4173`: home, all six case studies, the 404 ("This page never shipped.") at 1440×900, 1280×800, 1194×834, 834×1194, 390×844, plus reduced motion | no console errors, no hydration warnings (also checked on `next dev`), no horizontal overflow |
| Page sheet: case study → next case study, home `#work` → case study, "All work" → `#work` | lands at the top (or on `#work` with that project pre-selected), focus on `#main` / the section, no errors |
| Opening (production, first visit) | timeline starts ~0.7s after navigation, stamp compiles at ~2.4s, `booted` at ~3.5s (inside the 4.2s failsafe) |

Home `scrollHeight`: **13,996 px** at 1440×900, **21,395 px** at 390×844 (Work 6.4k and
Experience 4.8k are the longest sections on phones).

Prefetches of `/work/<slug>/` that show as `net::ERR_ABORTED` in the browser log are the browser
cancelling prefetches when the page is torn down; the server answers them 200. The 404 page logs
one "Failed to load resource: 404" for itself, as GitHub Pages also serves it with status 404.

## Verification record (release check, 2026-11-10)

`npm run build:pages` compiled cleanly and exported `/`, `/_not-found`, `/icon.svg`, `/og.png`,
`/pull-request`, `/repos`, `/resume` and the six `/work/<slug>/` pages (`flatten-rsc`: 10 files).
Served strictly under the base path on `:4174`; `docs/handoff/tools/verify-release.mjs` passed:

| Check (headless Edge) | Result |
|---|---|
| Every `/Portfolio/_next/...` asset in the HTML of 7 pages (19-24 each) | all 200 |
| Links in the HTML | all under `/Portfolio` |
| `og:image` on every page | `https://prajwalps2603.github.io/Portfolio/og.png`; `og.png` serves (the card now ends in a lime check, no SHIPPED stamp) |
| 7 pages + the 404, desktop 1440x900 and phone 390x844, scrolled | no console errors, no failed requests, no sideways scroll; the 404 answers 404 |
| Palette (Ctrl+K), sketch mode, "Prajwal Times" link, the sudoku, the phone menu | all work through the base path (lazy chunks included) |

Also on the root build (`:4173`), every suite passed: `verify`, `verify-port`, `verify-stack`,
`verify-repos`, `verify-pr`, `verify-card`, `verify-times`, `verify-theme`, `verify-sketchbook`,
`verify-about`, `verify-contrast both` (4.5:1), `verify-stamps`, `verify-mobile`, `verify-puzzle`.

First-load JS (module scripts, gzip -9): `/` 15 files, 1000.7 KB raw / **307.1 KiB** (281.6 at the
Nov 6 release); `/work/[slug]` 245.4 KiB (236.1); `/resume` 221.5; `/repos` 235.3; `/pull-request`
222.2. CSS 37.5 KiB gzip (32.1). The growth is the features added since (theme, lite mode,
sketchbook, visiting card, newspaper, editor, PR page).

Not covered: Safari / iOS and Firefox (only Chromium/Edge runs here), and a real-device pass.

## Verification record (release check, 2026-11-06)

`npm run build:pages` (Next 16.4.5, Turbopack) compiled cleanly and exported `/`, `/_not-found`,
`/icon.svg`, `/og.png` and the six `/work/<slug>/` pages (`flatten-rsc`: 7 files). Served strictly
under the base path (`MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/Portfolio PORT=4174 node scripts/serve.mjs`).

| Check (headless Edge, WebGL on) | Result |
|---|---|
| `/Portfolio/` and `/Portfolio/work/resumai/`, desktop 1440x900 and mobile 390x844, wheel-scrolled | no console errors, no failed requests, no horizontal overflow; home scrollHeight 15,089 px (desktop) / 21,277 px (mobile) |
| Command palette (Ctrl+K) on `/Portfolio/` | opens, lists Go to / actions, terminal chips; lazy body chunk loaded through the base path |
| Sketch mode on a case study (desktop) and the home page (mobile) | wipe completes, the page is redrawn as the notebook sketch; no errors |
| Every `/Portfolio/_next/...` URL in the home and case-study HTML (22) | all 200 (fonts, CSS, chunks) |
| `og:image` and `twitter:image` on home and `/work/resumai/` | `https://prajwalps2603.github.io/Portfolio/og.png` (plus type, 1200 x 630, alt) |
| `out/og.png` | PNG, 1200 x 630, the paper card (name, "Full Stack Developer", sketch -> SHIPPED window) in the current look |

After the check the strict server was stopped and `npm run build` was run again, so `out/` holds
the root export (og URLs then point at the bare origin; only the Pages build is deployed).

### Bundle at release (first-load module scripts, gzip -9; the `noModule` polyfill is excluded)

| Route | First-load JS | CSS gzip | HTML gzip |
|---|---|---|---|
| `/` | 14 files, 874.8 KB raw / **281.6 KiB** | 32.1 KiB | 48.2 KiB |
| `/work/[slug]` | 12 files, 741.2 KB raw / **236.1 KiB** | 32.1 KiB | 23.0 KiB |
| `404` | 10 files, 655.2 KB raw / **209.5 KiB** | 32.1 KiB | 10.5 KiB |

Lazy chunks (gzip): 3D keyboard (three.js + R3F) **246.0 KiB**; architecture diagram engine
18.2; Motion feature set 17.1; command palette body 11.8; case-study journey 12.5 (case pages,
first load); stack map engine 6.1; Lenis 5.3; mobile menu panel 3.4; cursor 2.4; sketch wipe 1.2.
All JS in the export: 29 chunks, 2,151 KB raw / 652.2 KiB gzip (includes the 38.6 KiB noModule
polyfill, which modern browsers never fetch).

## Bundle (earlier integration snapshot; counts the noModule polyfill, see the release figures above)

Next 16 no longer prints "First Load JS" after `next build`. These figures sum the `<script>` and
stylesheet tags of each exported HTML file (raw / gzip level 9 / brotli; GitHub Pages serves
gzip).

| Route | First-load JS | CSS (raw / gzip) | HTML (raw / gzip) |
|---|---|---|---|
| `/` | 12 files, 1053.7 KB / **340.9 KB** / 297.5 KB | 126.8 KB / 22.8 KB | 306.6 KB / 38.8 KB |
| `/work/[slug]` | 11 files, 847.0 KB / **273.0 KB** / 238.1 KB | 126.8 KB / 22.8 KB | 111.5 KB / 19.2 KB |
| `404` | 10 files, 793.6 KB / **256.9 KB** / 223.9 KB | 126.8 KB / 22.8 KB | 55.7 KB / 10.4 KB |

- **The 3D keyboard** is one lazy chunk (Three.js + React Three Fiber + the keyboard):
  925.8 KB raw / **245.8 KB gzip**. No page references it in its script tags; the Stack section
  fetches it only on qualifying desktops (fine pointer, full motion, ≥ 1200px landscape, WebGL2,
  no Save-Data) when the section comes within ~900px.
- The largest first-load chunks are react-dom, GSAP (+ ScrollTrigger, CustomEase) with Lenis, the
  Next runtime, Motion, and one app chunk with every section and the content.
- All JS in the export: 18 chunks, 2002 KB raw / 594.7 KB gzip.

Reproduce: run `npm run build:pages`, serve `out/` under `/Portfolio`, then sum the sizes of the
`/_next/static/*.js` files each `out/**/index.html` references.

Windows / Git Bash: run the strict preview as
`MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/Portfolio PORT=4174 node scripts/serve.mjs`.
Without `MSYS_NO_PATHCONV=1`, Git Bash turns `/Portfolio` into a Windows path and everything
returns 404. Rebuild with `npm run build` afterwards if the root preview (`:4173`) should serve
the root export again.
