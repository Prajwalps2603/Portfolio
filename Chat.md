<!-- HANDOFF:START -->
# HANDOFF: read this first

**Project:** Prajwal M P's creative motion portfolio (Next.js 16 static site for GitHub Pages)
**Folder:** `D:\Portfolio` (moved from `C:\Users\Prajwal\Desktop\Portfolio` on 2026-11-07 because drive C: was full; the copy on C: was deleted)
**Last updated:** 2026-11-07, ~11:00 IST (the stack and the certifications were redesigned at Prajwal's request, the stack now with waves, a diver and a submarine; see §0)
**Why this file exists:** the first Claude account hit its weekly limit (resets Nov 8, 00:30 IST), so work continues on another account or session. This section is the source of truth for status. The full original conversation is below it, under "Full conversation transcript".

> **Starting a new Claude session?** Paste this:
> *"The project is in D:\Portfolio (moved off drive C: on Nov 7). Read the HANDOFF section at the top of Chat.md, starting with §0. The 'Sketch → Ship' site and its creative layer (architecture diagrams, request journeys, stack map, sketch mode, terminal palette, the stack iceberg with its diver and submarine, the pinned-up certificates, idea ticket) are built, reviewed and verified. On Nov 7 Prajwal rejected the 3D keyboard and the throwable stickers; both were replaced (see §0). If the servers aren't running, start them there with npm run dev and npm run preview. Next: Prajwal's feedback, his content answers (§2.2), and the deploy (§2.1) only with his explicit OK. Never re-run redesign-fast.js or creative-boost.js from scratch, never go back to the electronics theme, and check every visual change in a real browser with docs/handoff/tools/shot.mjs."*

---

## 0. CURRENT STATE (2026-11-07 ~16:00 IST): SKETCH → SHIP + CREATIVE LAYER BUILT AND VERIFIED; STACK AND CERTIFICATIONS REDESIGNED, CAREER CARDS ILLUSTRATED, "ALSO SHIPPED" IS A CONTAINER PORT, ABOUT REDESIGNED (README, ROAD TRIP, VAULT; NOV 7); PROJECT IN `D:\Portfolio`. This overrides §1–§2 and §4.

**Update, Nov 10 (newest): the newspaper's sudoku is playable.** His ask (screenshot of the Puzzle corner): "I should be able to solve that". `times/TimesBits.tsx` `Puzzle`: tap or Tab to an open square, then the 1-4 pad (or keys 1-4, Backspace/Delete/0, arrows that skip the givens); repeats turn tangerine with a status line; a full correct grid goes lime ("Solved!", "Play again"); "Solve it" (backtracking, "N tries") and "Clear" stay. ARIA grid with rows and a roving tabindex; the box lines were partly blue (each empty square's border took its blue digit colour) and are ink now. `verify-puzzle.mjs` solves it by tap (phone) and by keys (desktop). The taller puzzle first broke `verify-times`' "no empty space at the foot of a column" rule (the comic column ended 99px short at 1440): the pad became a column beside the grid, the status lines got short (one line), and the bottom row is three columns only from 1200px (1.75fr / 0.85fr / 1fr; below that the comic runs across, its strip capped at 36rem); feet now 42 / 0 / 0px.

**Update, Nov 10 (later): phones.** His asks: "fix the mobile view", then "fix" / "fix it" with five phone screenshots of the newspaper (`/resume`), off centre. Causes and fixes: (1) the paper's 0.35deg tilt on a ~6000px phone-length paper moved its top ~20px left (onto the screen edge) and its bottom ~20px right, and drew a tile seam: the tilt is now `md:` (900px+). (2) The fold line across the paper's middle landed on "Machine Learning Intern" like a strikethrough on phones: `max-md:hidden`. (3) 600-790px: the bottom row's sudoku (fixed 9.5rem) overflowed its narrow third column and the page scrolled 7px sideways: three columns from 1200px (it was 900px until the playable puzzle grew), comic full width above the ad + puzzle from 600px, the sudoku `w-full max-w-[9.5rem]`. (4) The header's action row ran off the right edge at 320-375px and 400-430px (only 390-399 fitted): Menu is icon-only below 480px, below 400px the palette button leaves the row (new "Open the terminal" in the phone menu, `data-qa="menu-terminal"`) and the gap is 6px, below 360px the wordmark is 19px; all buttons stay 44px. A full audit (every page at 330/390px, scrolled, overflow + screenshots) found nothing else: the stack labels, career drawings and README only looked empty mid-reveal. New `verify-mobile.mjs` checks all of it.

**Update, Nov 10 (later): the project pictures show their concepts; SHIPPED only on the ship.** His three asks (screenshots): (1) "my project was drone intelligence was the main concept, but in image nothing is there": `miniui/templates/chat.tsx` redrawn: a sample question about a flight, the answer (it restates DGCA's Drone Rules, 2021), the retrieval step (`Retrieve top 5 · ChromaDB`) over the passages it read (a column that wraps, so only whole lines show and the sketch twin skips the clipped ones), the source chip; beside it an airspace check: a drawn map with a quadcopter in the green zone beside an airport's red and yellow zones, the verdict pill, a legend. (2) "in audify the main content was transcription but you are showing only the audio": `phone.tsx` redrawn: the phone's screen is the transcript (title "Transcript", Speaker 1 / Speaker 2 bubbles with timestamps, the last line typing, a small player above), beside it the speech-to-text providers (the picked one checked), the flow at "Transcribe · step 4 of 5" and the call's summary as a row in a Google Sheet. The old "live" chip was wrong (it transcribes recordings after the call): it is "2 speakers" now. Sample values: `miniui/data.ts` `SAMPLE` (drone question/answer/chunks/source/verdict/limit, transcript, summary) + `namesIn()`. Both pictures shed parts as the window narrows (448/416/400/384px, listed at the top of each file); checked at 320, 384, 400, 440, 560 and 700px, light and dark, ship and sketch (`miniui-lab.mjs`), and on the real pages (case study, phone card, hero). (3) "remove that shipped, why are you using that everywhere, remove everywhere except in ship": the stamp is gone from the project pictures (MiniUI `stamp` now defaults to false), the stack map's deploy node, the case-study journey (board and rail; its effect and refs removed), the architecture window (its timing removed), the sketch toggle (its timeline and the `data-stamping` CSS removed), the palette's hire run (now a done line "ready to send"), the newspaper comic (a lime check) and the social card `og.png` (a lime check). Kept: the port ship's stamp, the idea ticket's "Drafted" stamp, the hero's "shipped" stage chip, "Also shipped", "MV SHIPPED". `verify-stamps.mjs` (every page, desktop and mobile, scrolled through) finds SHIPPED only in the port. DESIGN.md, MOTION.md and README updated.

**Update, Nov 10 (later): the ship floats.** His ask (screenshot of a container landing on MV SHIPPED): the ship should move when the crane drops a container, "because the container has weight and it is in water". `work/port/scene.ts` now exposes `float` (hull at the waterline + pivot), `ropes` (mooring endpoints), `surfaceAt`, ripple-able `seaPath`/`swellPath`, and `stateAt` returns `i`/`q`. `PortScene.tsx`: the ship is one group (`refs.ship`) moved by a spring model (`floatStep`: waves, landing/lift kicks, load sink and trim), boxes aboard ride with it, the spreader follows the deck while at the ship, the stamp wrapper and mooring lines move with it, ripples after each landing. Measured: 4-5px dips per landing, settles in ~2s, +0.5ms/frame on his GPU (A/B). `verify-port.mjs` gained `float` checks (moves, dips per landing >= 0.06 container heights, boxes ride, still in reduced/sketch); every verify script passes.

**Update, Nov 10 (latest): the sketchbook.** His ask (with a screenshot of the sketch-mode pencil cursor): "in sketch mode I should be able to draw anywhere, like a book". Built `components/sketchbook/{index,SketchbookImpl}` (mounted in the layout; the impl loads only when sketch mode is on): press-and-drag drawing on any non-interactive spot (links, controls, header, dialogs, the hero note excluded; clicks still work), pencil / pen / marker / eraser / hand, undo-redo (buttons + Ctrl+Z / Ctrl+Y), undoable clear, strokes pinned to their page block (main's children + footer) and the centre line, saved per page and layout in localStorage; touch draws only with a pencil picked (`html.sk-drawing` touch-action none). New `verify-sketchbook.mjs` (all ok: desktop drawing, no text selection, click passes, marker, eraser, undo/redo, clear+undo, reload in place, pinned while scrolling, sketch off/on, per-page, phone finger draw vs scroll, cursors). Every other verify script passes. Home 306.5 KiB.

**Update, Nov 10 (newest): light and dark mode.** His ask: "I need light mode and dark mode". Built: `src/lib/stores/theme.ts` (getTheme / setTheme / toggleTheme / useTheme / followSystem; view-transition crossfade), `components/chrome/ThemeToggle.tsx` (header, left of the pencil, phones too), boot script sets `data-theme="dark"` before first paint from localStorage "pmp:theme" or the OS; palette "Turn dark mode on/off"; globals.css "DARK MODE" (dark tokens, ink slabs as raised dark panels with light values inside, dark text on lime/tangerine incl. `data-flood="lime"` on open build rows and lit stack-map nodes, deep blue fills, cursor/lens/scrim adjustments; sketch mode and `.times-paper` unchanged). He reported unreadable text on the lime "What I build" flood mid-build: fixed (text without its own colour inherited the page's light ink). New tools: `verify-contrast.mjs` (every text vs the colour painted behind it, both themes, 6 pages, MIN=4.5 env) and `verify-theme.mjs`; both all ok, plus every other verify script. Home 306.3 KiB.

**Update, Nov 9 (newest): lite mode for his lag.** He said the site lags. Measured on his GPU (GeForce GT 610 via Edge headless D3D11, `docs/handoff/tools/perf-scroll.mjs`; headless frame timing does not show GPU composite cost, so the decision used the known per-frame GPU costs plus load TBT, which is low: home ~170 ms). Built `src/lib/perf.ts` + boot-script detection (WebGL renderer regex for weak/software GPUs, or <=2 cores; cached in localStorage "pmp:lite") -> `html.lite`: no Lenis (native scroll), no custom cursor, no paper lens canvas; `PerfWatch` (layout) switches other machines to lite under ~40 fps while scrolling; palette "Turn lite mode on/off" (sets "pmp:lite:by-hand"). For everyone: no header backdrop blur (bg-paper/97). Also his asks: no blue focus ring on text fields (lime border instead), lime caret (lime on ink, lime-deep on paper). Note: headless test browsers use SwiftShader, so they run in lite mode now; all verify scripts pass in it. Checked: typecheck, build, verify-times / card / pr / repos / about / verify.mjs.

**Update, Nov 9 (latest): The Prajwal Times, the newsletter, the glitch fixed.** (1) The scroll glitch in the Certifications container was his old GPU (GeForce GT 610, Edge) drawing the closed vault's 3D layers: the closed vault is now flat (no 3D while shut and still; 3D only while opening/open/closing), and the visiting card is flat at rest (3D only during the flip, Web Animations). `slab-clip` stays. (2) Hero: a "Newsletter" pill (his LinkedIn newsletter AI & Software Insights, `profile.newsletter`, subscribe URL ...newsletter-follow?entityUrn=7473321654379499520); the three hero pills are a little narrower at lg+ so they share a row; palette "Subscribe to my newsletter". (3) Header: Résumé -> "Prajwal Times" (/resume; "Times" below 1440px), phone menu too; palette "The Prajwal Times (résumé)". (4) `/resume`: the résumé as an old newspaper (see DESIGN.md): Livora lead (his main project; never call him its co-founder), real screenshots of Livora/BookMyVenue/Buddy in `public/times`, HRMS / SRMS / Support Ticket System as "Also built" briefs (`profile.alsoBuilt`, names only: ask him for details; he dropped "wedding card generation"), `profile.openTo` ("Ready to work anywhere in the world, in any software development role", his words; the WANTED ad says it in ad voice), Indian edition, clean cream paper (no dots), columns balanced (no empty space), print one A4. (5) The README Preview/Code switch kept its text on hover. Checked: typecheck, build, new `verify-times.mjs` (all ok, incl. one-page print and no empty column ends), `verify-card`, `verify-pr`, `verify-repos`, `verify-about`, `verify.mjs`, detector []. /resume 219.2 KiB; home 305.2 KiB.

**Update, Nov 9 (newest): the visiting card, and a scroll glitch.** He asked for new non-GitHub ideas, got eight mockups (Desktop\Portfolio ideas), picked "take my card", then placed it himself: the card at the top of the contact section's right column beside the heading, tilted (-9deg), the old "Now" card (clock) back at the bottom; no hover motion; a bright lime underline under the name; "make the QR more creative". Built: `src/components/card/{VisitingCard,CardPopup,contact}.tsx|ts`; `scripts/card-qr.mjs` (runs in `npm run build`; `qrcode` 1.5.4 added as an exact dev dependency) writes `src/content/cardQr.ts` (level Q, round dots r=0.48, rounded eyes, a 7x7 hole for the "PM" mark); the back is a taped QR tile. Flip / Save contact (.vcf, no phone) / Share. He also asked for the card "when I close the tab": browsers allow no custom popup on close, so `CardPopup` is exit intent (mouse only, after 6s, pointer leaves through the top, once per visit; mounted in `app/layout.tsx`); palette "Take my card" and "Save my contact". `useIstClock` moved to `src/lib/hooks/useIstClock.ts`. Then he reported a glitch while scrolling in the Certifications & awards container (a stale copy of the slab's edge, Edge): not reproducible headless; fixed with `slab-clip` (isolation + a rounded clip-path, off in sketch) on the ink slabs; awaiting his confirmation. Checked: typecheck, build, new `verify-card.mjs` (all ok, decodes the QR with jsQR, added to the tools folder), `verify-pr`, `verify-repos`, `verify-about`, `verify.mjs`, detector [] on the card files. Home 304.7 KiB first-load JS.

**Update, Nov 9 (latest): contact as a pull request.** From a new ideas list he picked "contact as a pull request"; I showed a mockup (an HTML page screenshotted; the files are on his Desktop: `pr-desktop.png`, `pr-phone.png`, `pr-mockup.html`), then he asked for "a button called create a pull request" under "Ship it" that "opens the pull request page". Built: `/pull-request` (`routes.pullRequest`, `src/app/pull-request`, `components/pullrequest/{index,PullRequestForm}`; also in the palette, not in the header), the contact section's outline pill "Create a pull request" under the idea ticket (the ticket stays). The PR form: compare bar (branch from the title), title (required), description Write / Preview (template), Reviewers, Labels (Full-time / Freelance / Collab), Milestone, "Create pull request" -> `mailto:` (subject `[PR][labels] title`, body + Labels + When), ▾ draft / Copy as text. The mail opens through a clicked `mailto:` link so tests can catch it. Fixed on the way: the /repos page description still said "3D library". Checked: typecheck, production build, new `verify-pr.mjs` (all ok), `verify-repos.mjs`, `verify.mjs`, detector (left: Inter flagged as common, it is the site's body face; the description box counted as a card in a card, it is the GitHub-style field from the approved mockup). /pull-request 214.4 KiB.

**Update, Nov 9 (after the editor): full width, no inner scroll, and Run.** His asks, in order: "no need that scrolling, extend the height, use max width"; "in the left panel I need a run play icon: when I click it, the terminal runs like npm run dev and opens my live page like a browser; typing run, npm run dev, npm start should do the same"; "cd <name> changes the directory and running then runs that application". Done: the window breaks out to the full width (page gutter, max 1920px; the title stays in the column) and grows with its content (no `overflow` panes; opening a file far down scrolls the page to the tabs; commands keep the prompt on screen). Run: a lime play button last in the activity bar (Run and debug view on wide screens; on a phone it just runs), `npm run dev` / `npm start` / `yarn dev` / `pnpm dev` / `bun dev` / `run [repo]`, `cd <repo>` / `cd ..` / `pwd`, `stop` / Ctrl+C. A run prints a short dev-server start (~1.5s; instant when reduced) and opens a browser tab in the editor (reload, address bar, desktop / phone width, New tab, the live page in an iframe). `scripts/garden-data.mjs` now records `live` per repo: its website field or GitHub Pages address, kept only if it answers 200 at build time (6 live; LifeSync and College-Website have Pages on but 404). Not deployed: the terminal says so and the browser shows "isn't deployed" with the live ones to run; nothing marked running. From the workspace README the play runs Portfolio (his live page). Checked: typecheck, detector [] (files, live page 1440 and 390), production build, `verify-repos.mjs` (adds width, no inner scroll, cd + npm run dev, frame loads, Ctrl+C, play, not deployed, tab in view, phone play), `verify.mjs`. /repos 227.5 KiB.

**Update, Nov 9 (newest): "Repos" is a code editor.** He removed the 3D library ("no need of this kind animation"), asked for different ideas, and picked "code editor explorer" with "no animation like the garden and library, make it more creative". `/repos` is now `components/repos/RepoEditor.tsx` + `editorData.ts` (pure data: the tree, each file's source as tokens, the git log, `findRepo`): an editor window in the site's ink with an activity bar (Explorer / Search / Timeline), the workspace tree (language folders -> repo folders -> README.md + repo.json), tabs (max 6, closable), breadcrumbs, README source beside its rendered preview (Preview / Source switch below 1280px), repo.json highlighted with a minimap, a click-to-place cursor whose line carries a blame-style note (created / pushed dates) and an Ln/Col in the status bar, a git-log Timeline (a commit per repo on its creation day), and a terminal (help, ls, open/cat with Tab completion, git log, neofetch, whoami, clear, history). Below 768px the side bar is a drawer. No motion beyond a chevron. Every word from the GitHub data. `RepoLibrary.tsx` (plain list) and `Library3D.tsx` stay unmounted; three.js stays in package.json only for the unmounted 3D files. Sketch: added a rule turning `text-blue-soft` on ink into blue-deep. Checked: typecheck, detector ([] on the files and on the live page at 1440 and 390, after raising the dim text from ash to fog), production build, `verify-repos.mjs` (rewritten for the editor: all ok), `verify.mjs` (ok). /repos first-load JS 224.0 KiB; home 298.7 KiB.

**Update, Nov 9 (latest): the garden is gone; "Repos" is a 3D library.** After the painted garden ("still not good, I need it to look like a forest, like a 3D movie") I built a three.js forest garden; then he said "no need garden, use any new design for the repo". Now: `/repos` ("Repos" in the header nav, the phone menu and the palette; `routes.repos`), `src/components/repos/{index,RepoLibrary,Library3D,books}`: every public repo (22) as a book in a 3D study (three.js 0.187.0, added as a dependency, lazy on this page only): bookcase, ladder, window light shaft with dust, pendant lamp, desk; books in their language's colour, thickness from the repo's size (`size` added to the data), name on spine and cover, brass language plaques, red ribbons on the case-study repos. Glide-in camera; hover tags; click or the card catalogue pulls a book out (cover turned to you) and the open book shows the GitHub description, dates, GitHub and case-study links; Esc puts it back; pause control for the dust. Flat CSS shelf without WebGL / in sketch mode. `/garden` route removed; the garden's components (painted + 3D forest) stay unmounted in `components/garden`. `scripts/garden-data.mjs` now fetches the repos and the calendar independently (GitHub's calendar was answering 504). Checked: typecheck, detector, production build, `verify-repos.mjs` (new: desktop, phone, reduced, sketch, nav at 1440 / 1024 / 900), `verify.mjs`; 0 errors. /repos first-load JS 257.8 KiB (three.js 139.9 KiB loads after); home 298.0 KiB.

**Update, Nov 9 (later): the garden is painted.** His verdict on the first, flat drawing: "it's not good, make it more creative, it should look like a real garden, not like cartoon ... like anime". The scene is now `garden/PaintedGarden.tsx` + `paintArt.ts`: an anime-style painted afternoon (gradients, glow, soil grain, soft blur, its own palette `PAINT`: the one documented exception to the site's "no gradients, tokens only", DESIGN.md "The garden"). Sky with towering cumulus and sun rays, the Ghats in haze, palms, a mango tree framing the top left, a plank shed with a terracotta roof and warm window, a bamboo fence with a flowering creeper, red-brown soil in deep perspective (rowY/rowScale in gardenArt changed for both drawings), plants as seedlings / young plants / chili plants / marigolds / the sunflower with soft shadows, butterflies, flagstones, blurred near grass, pollen, a warm light and vignette. The cartoon gardener is replaced by a traveling sprinkler that rolls along the path watering the growing week; after the time-lapse a breeze (sway, wings, pollen, 30fps) runs under the play gate with the pause control; "Grow it again" is its own button (`data-qa=garden-replay`). Drawn in three stacked SVG layers so the breeze repaints only the middle one. Sketch mode keeps the flat drawing in pencil. Checked: typecheck, detector `[]`, build (GitHub answered 504 once: the snapshot fallback worked), `verify-garden.mjs` all modes (hover on the sunflower: "9 contributions, Fri 25 Sep 2026"), `verify.mjs`; 0 errors. /garden first-load JS 272.8 KiB, HTML 72.3 KiB.

**Update, Nov 9: a new page, the garden ("Garden" in the header).** He picked the GitHub garden from my idea list ("in navbar let's add one more tab called Garden ... it will open a new page"; "make it more creative, it should look like a real garden"). Built `/garden` (`src/app/garden/page.tsx`, `src/components/garden/{index,GardenScene,gardenArt,SeedShelf}.tsx|ts`): his real public contribution calendar as a garden (a shed, fence, mynahs, scarecrow, wheelbarrow, furrows of red earth; a plant per day with contributions by GitHub's level, seeds for days without, the busiest day a prize sunflower, the longest streak stepping stones; a time-lapse with a gardener watering, ~6s, Pause / Play / Grow it again; hover or arrow keys for a plant's tag; seasons Last 12 months / 2026 / 2025 / 2024; four garden signs), then a seed shelf of 22 public repos (language as a plant, GitHub description, GitHub + case-study links). Data: `scripts/garden-data.mjs` reads github.com/users/Prajwalps2603/contributions (and per year) and the REST repo list at build time into `src/content/garden.json`; `npm run build` / `build:pages` run it first (so each GitHub Actions deploy replants it; offline it keeps the snapshot); `npm run garden` runs it alone. His numbers today: 87 public contributions on 21 days in the last 12 months (22 in 2025, 2 in 2024); tell him private contributions only count if "Include private contributions" is on in his GitHub profile. Garden link added to the header nav (fits from 900px), the phone menu and the Ctrl K palette. Checked: typecheck, detector `[]`, production build, `verify-garden.mjs` (new: film, hover / keys / pause, seasons, nav at 1440 / 1280 / 1024 / 900, reduced, sketch, phone), `verify.mjs`; 0 console errors. /garden first-load JS 264.3 KiB; home 298.1 KiB.

**Update, ~16:20 (Nov 7): "i need first design": the road map is back.** "The road so far" renders the first design again (`RoadMap.tsx` + `roadArt.ts`: the hand-drawn map, the bus driving Koppa -> Sullia -> Bengaluru once, the three punched tickets; click to drive again), as he asked after the road trip. The road trip (`RoadTrip.tsx` + `tripArt.ts`) is kept, not mounted (switch noted at its top); `verify-readme.mjs` checks the map again; `verify-road.mjs` exits early while the trip is not mounted. Home first-load JS 298.0 KiB. Docs and memory updated. The vault is unchanged (locked until opened, kept across refreshes).

**Update, ~16:00 (Nov 7): certifications became a vault (his interaction), the road map became a road trip.** (Supersedes the passport and the road map below.)
- **Certifications & awards** went through two more rounds: the passport ("change the design") became night **summits** (a climber planting a flag on four peaks), rejected with "think new diffrnet". Now **a vault** (`src/components/about/Vault.tsx`, drawing in `vaultArt.ts`; `Passport.tsx`, `Summits.tsx`, `summitArt.ts` deleted): on the ink slab one strongroom wall; a round lime door (rivets, eight bolts that cross into the frame's receivers when locked, a combination dial, a spoked wheel, a PMP plate, hinges; its thickness from 9 CSS 3D layers) in front of the strongroom (deposit-box walls in one-point perspective, a lamp), and the wall's deposit boxes: rows of small numbered ones and one big box per credential (its little steel door, the credential inside as an object: a framed certificate, a hexagonal badge, a rolled diploma, a trophy; title, issuer · year and Verify on the box face).
- **His spec, built as said:** "by default all the vault will be locked; when I click and rotate the main big locker, one by one the certificate lockers will open". Locked by default; a click / tap / Enter on the door (a real button, "Unlock the vault") spins the dial, turns the wheel, pulls the bolts, swings the door open (-72 degrees) and lights the strongroom; then the boxes open one by one (on phones each as it comes on screen). A mouse or pen can turn the wheel by hand (past 200 degrees it gives; sooner, it springs back). A second click locks everything again. A lime note under the door says what to do; the wheel gives one small turn as a hint. Reduced motion, sketch mode and no JS: open, no button.
- **His follow-up:** "when I refresh all the lockers opened suddenly, it's locking ... it should be locked until I open ... if I open and refresh it should be opened". Fixed: the state is kept in localStorage `pmp:vault` (`VAULT_KEY` in `src/lib/motion/bootScript.ts`); the boot script turns it into `html[data-vault="open"]` before the first paint, and `globals.css` ("THE VAULT, LOCKED FROM THE FIRST PAINT") draws it locked until the component removes `[data-vault-boot]`, so a refresh never shows the other state. Verified: the door's angle sampled from the first moment of each load shows only 0 (never opened, or locked again) or only -72 (left open).
- **The road so far** ("make it more creative", his screenshot boxing the map and the tickets): now **a road trip** (`RoadTrip.tsx`, drawing in `tripArt.ts`; `RoadMap.tsx`, `roadArt.ts` deleted): a window onto a side-on journey over a 1920-wide world in four parallax layers; a Karnataka bus (luggage roped on the roof, passengers, turning wheels, exhaust) drives Koppa (morning: Malnad hills, areca palms, the school, a shelter and milestone) -> the Ghats (noon: waterfall, hairpins, a GHAT SECTION board, monkeys on the black-and-white parapet) -> Sullia (afternoon: coconut palms, the KVG college) -> the highway (golden hour: pylons) -> Bengaluru (night: the metro on its viaduct, autos, streetlamps, the office tower's lit windows, moon and stars). ~12.5s on a clock when it comes on screen, with Pause / Play / Drive it again and the play gate. Under it **a signpost**: three arrow boards on a pole holding the facts (schooling and grades; the degree, CGPA and the 1st place; the current role) that light as the bus reaches each stop, and a mynah that hops to that board.
- **Kept on his request ("keep the first design in mind ... when I say 'use 1st design', use that (in readme)"):** the first road design (the hand-drawn map, the bus, the punched tickets) is back in `src/components/about/RoadMap.tsx` + `roadArt.ts`, not mounted (recovered from the session transcript and line-checked against the final version; mounted once on the dev server: renders, 0 errors). "use 1st design" = render `<RoadMap />` instead of `<RoadTrip />` in `about/index.tsx` and point `verify-readme.mjs` back at `[data-qa=roadmap]` (note at the top of RoadMap.tsx).
- **Checked:** typecheck, detector `[]`, production build; `verify-about.mjs` (vault: locked by default, click / drag / Enter, relock, persistence + no flash, reduced, sketch), `verify-road.mjs` (new: the trip on desktop and phone, pause / play / drive again, reduced, sketch), `verify-readme.mjs` (README + the road trip), `verify.mjs` whole site; 0 console errors. Home first-load JS 304.1 KiB (HTML 68.5 KiB). Docs: DESIGN.md §8.1, MOTION.md §4/§10, README, the About surface brief (`.impeccable/surfaces/`).

**Update, ~14:40 (Nov 7): About redesigned (his screenshots: "can you make this more creative", then the certifications: "make it more creative, new design, think creatively"), and a fix.**
- **README** (`src/components/about/Readme.tsx`): a file viewer with "Preview | Code" tabs (the markdown source generated from `profile`, line numbers), an "Open to new opportunities" badge, "Currently learning" as open branches. First view: the source shows, then a pencil line sweeps down and renders it.
- **The road so far** (`RoadMap.tsx`, art in `roadArt.ts`; replaces the Education list and the README's Route row): a hand-drawn map (sea, coast, Western Ghats hills and trees, rivers, plateau, Bengaluru skyline, compass, a passing container ship) with the road Koppa -> Sullia -> Bengaluru; a tangerine bus drives it once on its own (~4.3s, click to drive again), the road inking in behind it, and punches the stop's bus ticket (1 Schooling: SSLC 75%, PU 72%; 2 BE ECE at KVGCE, 7.9 CGPA, 1st place; 3 Full Stack Developer, now). The "ECE degree" note points at ticket 2.
- **Certifications & awards** (`Passport.tsx`; `Certificates.tsx` deleted): a passport on the ink slab; the cover (lime PASSPORT, compass emblem, chip mark) swings open on its spine to the holder's page (monogram, holder, occupation, base, route, stamp count, signature, machine-readable lines); the visa page gets four rubber-ink stamps thumping down (Oracle round blue, GitHub framed ink, Dyashin tangerine octagon, the award a lime rosette), each with its facts and a Verify link.
- **Fix ("fix", the BookMyVenue case study):** the "Live demo" button's dot sat in the label with no gap; it is now the pill's `iconBefore` (`casestudy/CaseHero.tsx`).
- **Checked:** typecheck, detector `[]`, build; `verify-readme.mjs` (new) and `verify-about.mjs` (rewritten for the passport) on desktop, phone, tablet, reduced motion, sketch mode, 0 errors; `verify.mjs` whole site 0 errors. Home first-load JS 295.0 KiB, HTML 67.2 KiB (the map art and stamps are inline SVG).

**Update, ~13:20 (Nov 7): the port, second round (his feedback by screenshot).**
- "without scrolling also the container moving animation should work": the crane now runs on a **clock** (`PortScene.tsx`): it loads the 9 containers onto the ship one by one (2.4s each), the SHIPPED stamp lands only while the ship is full (the earlier version left it up on a half-loaded ship), then it unloads and starts again (~48s a round). It runs only on screen and in a visible tab (`usePlayGate`), and a **round pause button** (top right of the drawing, outside the aria-hidden box) stops it (WCAG 2.2.2).
- "this design is not good" (the dark open-container panel): replaced by a **bill of lading** on a clipboard (the tabpanel) beside the **container itself** in one-point perspective (`port/container.ts`, `port/OpenContainer.tsx`): corrugated walls, planked floor, doors swung to 115 degrees, painted like the chosen container. Choosing another: the doors swing shut, the papers and paint switch, the doors swing open, the cargo settles.
- "in container all the stocks good will be there (stocks means used techs)": the box is **packed**: the stack as stencilled wooden crates in the front row (in perspective) and cartons stacked behind toward the ceiling (seeded per project). On phones the stack also shows as crates under the drawing.
- "the crane and ship design is too bad": **redrawn in detail** (`port/scene.ts`): a lime ship-to-shore crane (tapered box legs on bogies, bracing, a zig-zag stairway, a box-girder boom with a rail, A-frame with an aviation light and double stays, machinery house on the backreach, festoon loops, floodlights, a trolley with the operator in his cab, headblock and spreader) and a real container ship (dark hull, raked bow, forecastle with foremast and anchor, Plimsoll and draft marks, tangerine boot-top, hatch covers, accommodation block, bridge with window band and wings, radar mast, funnel, a tangerine free-fall lifeboat) in blue water, with a faint skyline and clouds.
- **Checked:** typecheck, detector `[]`, build; `verify-port.mjs` all modes (moves without scrolling, pause holds, stamp only when full, tabs, a click on a container, ArrowRight, reduced motion and sketch still, 0 errors); no-JS check; `verify.mjs` whole site 0 errors. Home first-load JS 288.9 KiB; the port drawing is an 8.2 KiB lazy chunk.

**Update, ~12:35 (Nov 7): "Also shipped" (the end of Work) is now a container port.**
- **Why:** Prajwal: "redesign this container ... like a port and a crane and having the container (it should look like a container) ... the crane taking the container, lifting it and moving ... the containers are the GitHub repos; when I open the container, there you think what we can do ... make it more creative".
- **What:** `src/components/work/AlsoShipped.tsx` (now a client component) + `src/components/work/port/`: `model.ts` (each archive project is a container: number 01-09, paint cycle, LIVE placard, owner code `PMPU` + year/number + its real ISO 6346 check digit), `scene.ts` (pure geometry: quay, yard of 3 stacks of 3 with faint background stacks, a ship-to-shore gantry crane, the MV SHIPPED with a tangerine boot-top; `stateAt(p)` = the crane's work as a function of p), `PortScene.tsx` (lazy SVG; the scroll drives p, eased; the sea rolls with the scroll; when the last container is aboard the SHIPPED stamp lands and the funnel puffs). Under the drawing: the manifest (a tablist of the 9 containers) and the open container (the tabpanel on ink: code, title, line, summary, the stack as cargo crates, Source on GitHub / Live site) whose doors (in the container's paint) swing shut and open again when you choose another. A click on a container in the drawing selects it. Reduced motion: the loaded ship, stamped, no swings. Sketch mode: pencil. No JS: the drawing and tabs hidden, all 9 containers listed open.
- **Checked:** typecheck, detector (`[]`), build; `docs/handoff/tools/verify-port.mjs` (new; desktop, laptop, tablet, phone, reduced motion, sketch: the crane frames, the stamp, tabs, a click on a container, ArrowRight, 0 errors); a no-JS check; `verify.mjs` whole site 0 errors. Home first-load JS 285.7 KiB (282.8 before); the port drawing is a 5.4 KiB lazy chunk.
- **Next:** Prajwal's reaction; then the content answers (§2.2) and the deploy OK (§2.1).

**Update, ~12:05 (Nov 7): every card in "Career, as a changelog" now has an animated drawing beside it.**
- **Why:** Prajwal marked the empty space in the cards (screenshots with red boxes): "use any kind of animation diagram design, or any creative animation, make it more creative", then "add medal something like that" (the 1st-place card) and "add college diagram" (the init card).
- **What:** each card has a panel beside its text from 1200px (under the summary below that): a sketchbook inset (paper with its dots). Roles get a figure of their own work (`src/components/changelog/RoleFigure.tsx`, pure geometry in `figures.ts`, lazy): Techbyheart, users reach EC2 through network security on AWS, EC2 uses RDS and S3, a bug is knocked back at the shield ("blocked") and a scan ticks each resource; Rooman, a notebook-style run (eda, preprocess, train, evaluate, tune) beside a chart that lands the data, strikes the outliers, fits a line, shows its errors and tunes a curve to "model"; Dyashin, a pull request reviewed and merged into main, then a request down React, REST, Spring Boot, Hibernate, SQL, MySQL and back; Maruti Flex, Google Sheets (Apps Script) and MongoDB (REST API) feeding a React / Next.js app on a laptop and a phone that goes live. Only facts from his highlights and stack; no numbers. The award has a lime "1st" medal on a ribbon (`Medal.tsx`) that swings in like a pendulum, then a glint; the degree has the college (`College.tsx`): its front drawn and inked, 2021 → 2025 filling in lime, a graduation cap tossed up from the 2025 mark with a dotted flight path. Each plays once when it arrives (under 5s, no loop); a click replays it, swings the medal or tosses the cap again. Reduced motion: finished and still. Sketch mode: pencil.
- **Layout change:** role cards are now text on the left (title, summary, highlights, stack) and the figure on the right; on phones the highlights still fold behind "Details", the figure stays visible above it.
- **Checked:** typecheck, the design detector (`[]`) and the build pass; `docs/handoff/tools/verify-changelog.mjs` (new) at 1440, 1280, 834, 390, 360, reduced motion, sketch mode and a filmstrip of each panel playing: all six panels play and rest, no label leaves its panel, 0 console errors; `verify.mjs` (whole site) 0 errors. Home first-load JS 282.8 KiB gzip (279.8 before: the medal, the college and the panels); the role figures are a 9.2 KiB lazy chunk. Phone home height ~21.9k px at 390 wide (20.3k before; the panels add ~260px per card).
- **Next:** Prajwal's reaction; then the content answers (§2.2) and the deploy OK (§2.1).

**Update, ~11:00 (Nov 7): Prajwal reviewed the site section by section; two sections were redesigned and grew new pieces.**
- **Stack (`#stack`), now "My stack, all the way down".** He rejected the 3D keyboard ("no need keyboard design ... make it more creative"), so it is gone, with three.js and R3F. The section is an iceberg cross-section (`src/components/stack/`: `Dive.tsx`, lazy `IcebergArt.tsx`, pure `iceberg.ts`, `Evidence.tsx`). Interface is the tip above a hand-drawn waterline on paper; Server & APIs, Data, AI and Cloud & Delivery sit in the ink sea beside their slice of the submerged ice (seams between slices, a leader from each heading); the languages are the seabed in huge type. Each slice draws in pencil, is inked over and fills as its row arrives, then its tools surface. Every tool opens a card under its layer with where it was used; Esc closes; type-ahead works while focus is inside.
  - Then he asked for more and got: **realistic waves** (a rolling swell with whitecaps and a distant swell, moving with the scroll); **a diver** (`Diver.tsx`, rig in `diverRig.ts`: vest, tank, hose, mask, gloves, fins) who stands ready on a ledge at the tip's right foot, giant-strides into the sea clear of the ice, pitches head down and follows the scroll down the ice with his torch on it (eased, kicking, bubbles), swims up head first when you scroll up, and stands upright on the seabed with the torch on the languages (after Prajwal's feedback: "not smooth", "hit the mountain", "should turn and dive up", "straight at the bottom"); **a research submarine** (`Submarine.tsx`) cruising the gap between Data and AI, its lights coming on with one flicker. All scroll-driven, no loops; reduced motion and sketch mode park them.
- **Certifications & awards (About).** He rejected the throwable stickers ("its not looking good, make it more creative design"). Now: **certificates pinned to a line and stamped** (`src/components/about/Certificates.tsx`): paper certificates (double rule, paper corners) on neutral pegs along a hand-drawn line across the ink slab, each stamped CERTIFIED or 1ST PLACE as it swings in, with a Verify link to the real credential; they sway with the scroll's speed and settle; on phones the line scrolls sideways.
- **Checked:** typecheck, the design detector and the build pass; headless Edge at 1440, 834 and 390 plus reduced motion and sketch mode, 0 console errors (`docs/handoff/tools/verify.mjs`, `verify-stack.mjs`, `verify-about.mjs`, `verify-diver.mjs`). Home first-load JS 279.8 KiB gzip (281.6 before); the drawing, with the diver, the sub and the waves, is an 8.6 KiB lazy chunk.
- **Reviews:** the design toolkit's independent finish reviewer checked both against their contracts (`.impeccable/surfaces/`). Stack: 2 rounds, fixes applied (focus-scoped type-ahead for WCAG 2.1.4, ink backing for row text on tablets, an elbowed leader, strata seams, notes). Certificates: 1 round, fixes applied (no eyebrow label, neutral pegs, certificate paper, a lift that reads on ink, the line tied at the slab's edges). Left open on purpose: a PRODUCT.md (needs Prajwal's answers) and per-row ticks below 900px. The diver, submarine and waves were added after the reviews, at his request, and verified in the browser.
- **Next:** Prajwal's reaction to all of it; then the content answers (§2.2) and the deploy OK (§2.1).

**Update, ~09:15 (Nov 7): the project now lives in `D:\Portfolio`.** Drive C: was down to 0.5 GB free, so Prajwal asked to move the whole folder to drive D:.
- **How:** the portfolio's own dev and preview servers were stopped, the folder was copied with robocopy, and the copy was checked file by file before the original was deleted: 15,908 files and 472.7 MB, every size equal, and all 482 files outside `node_modules` byte-identical (SHA-256). The `.next` build cache (668 MB) was not copied; `next dev` and `next build` recreate it. C: went from 0.52 GB to 1.66 GB free.
- **Checked on D: afterwards:** `npm run typecheck` and `npm run build` pass; the dev server (:3000) and production preview (:4173) run from `D:\Portfolio`; `docs/handoff/tools/verify2.mjs` passes (keycaps, cursor, phone journey 6/6, 0 errors).
- **Path fixes:** the `verify*.mjs` scripts imported `playwright-core` from an absolute `C:` path; they now import it normally. `verify*.mjs` and `shot.mjs` keep their screenshots and the headless browser's temp profile in `docs/handoff/tools/.out/` (git-ignored; see `local-tmp.mjs`), so QA runs no longer fill drive C:.
- **Claude memory:** copied to the new project's memory folder (`~/.claude/projects/d--Portfolio/memory/`).
- **Left over:** Windows kept the now-empty `C:\Users\Prajwal\Desktop\Portfolio` folder because VS Code had it open; delete it after reopening VS Code on `D:\Portfolio`. `docs/handoff/workflows/*.js` and the transcript below still name the old path; they are historical records.

**Update, ~00:15 (Nov 7):** the creative-boost run finished (43 agents, 0 errors, ~5 h). Everything in "The creative-boost workflow" below is built, went through 2 review rounds, and was verified in a real browser afterwards (results below). **Nothing is running.** Next steps: Prajwal looks at http://localhost:3000 (dev) or http://localhost:4173 (production preview), answers the content questions in §2.2, and says yes or no to the deploy (§2.1).

**What the creative layer is** (details: README "The creative layer", docs/DESIGN.md §8.1, docs/MOTION.md §12):
- **Work, Interface | Architecture switch:** every featured project flips from its app window to a living architecture diagram (`src/components/diagram/`): it is drawn as a pencil sketch, compiles into crisp layer cards, then lime/blue/tangerine packets run its real `flow`. Hover/focus/tap a part for a handwritten note; pause control; SHIPPED stamp. Phones: a quiet switch per card.
- **Case studies, request journey:** "How it works" is a scroll-driven journey: a lane board (Interface/API/Intelligence/Data/Infra) where one request travels step by step and comes back ("Back to you"). Notes in `src/content/journeys.ts` (not in the `@/content` barrel on purpose). Phones: a vertical rail.
- **What I build, live stack map:** an animated map; hovering a capability row lights only its path.
- **Sketch mode:** the header pencil turns the whole site back into its sketch (Caveat, graph paper, pencil outlines, diagrams and mini-UIs in their sketch state) with a View Transition lens wipe; off again plays SHIPPED. Session-only. Store: `src/lib/stores/sketchMode.ts`.
- **Terminal palette:** Ctrl/⌘K or "/": Go to, actions ("Show how my projects are built"), and commands `whoami`, `ls projects`, `git log --oneline`, `cat stack.txt`, `npm run hire-prajwal` (build log, then an "Open email" pill), `help`, `clear`, a `sudo` joke.
- **About, throwable stickers** (hand-written physics; reduced motion = plain drag; sketch mode = fixed), **Contact, idea ticket** (idea → sticky note → "ISSUE #001" ticket → prefilled mailto; nothing stored or sent), **hero note** draggable with a live wire, **3D keycaps** with short/hyphenated legends.

**Measured (production export, gzip, `noModule` polyfill excluded):** first-load JS `/` 281.6 KiB (about 300 before the boost counted the same way, so lighter despite all the new features; target was 260), case study 236.1 KiB, CSS 32.1 KiB. Lazy: 3D keyboard 246 KiB, diagram engine ~18 KiB, journey 12.5 KiB, palette body 11.8 KiB, stack map ~6 KiB, sketch wipe 1.2 KiB. Home height: 15,089 px desktop, ~21.3k px at 390 wide (six stacked project cards; "Also shipped" and changelog details fold on phones).

**Final verification (after the run, by the main session):**
Production export, headless Edge (scripts: `docs/handoff/tools/verify*.mjs`; `BASE` picks the server, and screenshots go to `docs/handoff/tools/.out/` unless `OUT` is set); **0 console errors, 0 page errors, 0 failed requests in every run**:
- **Desktop 1440×900:** hero; stack map hover lights one path; Work → Architecture compiles (state `ship`, journeys 1) and node hover shows its note; switching project on the Architecture side recompiles; 3D keyboard renders; a sticker throws and Tidy up appears; the idea ticket turns into "ISSUE #001" with a prefilled mailto; Ctrl+K palette and `npm run hire-prajwal` end with the SHIPPED stamp and a focused "Open email" pill; sketch mode on (whole site hand-drawn, diagram in its sketch state) and back off.
- **Case study (drone-intelligence) desktop:** the journey runs live from step 1 to the "Back to you" card (reached 6/6).
- **Phone 390×844:** hero; per-card Architecture switch draws the full diagram; a vertical swipe over a sticker scrolls the page (sticker unmoved) while a sideways drag moves it; menu jumps to Contact, About and Work each land exactly on the section; sketch mode; case-study rail journey reaches 6/6. Home height 21,084 px.
- **Reduced motion (desktop):** the diagram is shown finished with the numbered flow as text and no running packets; a sticker drags 1:1 and stays where dropped; Tidy up resets; arrow keys nudge 24 px.
- **Tablet 834×1194 and laptop 1280×800:** layouts and the stage's Architecture view fit.
- **Keycaps @2x:** Boot-/strap, Supa-/base, Hiber-/nate, Play-/wright on two lines at the large size; the rest unchanged.
- **Cursor:** after clicking the Architecture tab the custom cursor hides (mode `hidden`), so the label stays clean.
- **`/Portfolio` (build:pages):** home, case studies, og.png, icon.svg 200; all 22 referenced `/_next` assets 200; no unprefixed asset URLs; canonical and og:image under `/Portfolio/`; unknown path → 404 page; palette, sketch wipe, diagram and 3D chunks load on demand with 0 errors. `out/` was then rebuilt at the root for `npm run preview`.
- The "doubled pencil in the header" that the integrator saw in sketch mode is the custom cursor (a pencil in sketch mode) resting on the toggle after the click, not a duplicated icon.

**Fixed by the main session after the run (Nov 6, ~23:15):**
1. Stickers drag in reduced motion again (1:1, no throw/spin/glide; nudge and Tidy up move in one step): `about/Stickers.tsx` (`draggable` vs `physics`).
2. Long single-word keycap legends (Bootstrap, Supabase, Playwright, Hibernate, Firebase, Postgres, Tailwind) break over two lines with a hyphen whenever the whole word would print below ~11 px (instead of shrinking to ~9 px): `keyboard3d/legends.ts` (`BREAKS`, `COMFORT = 0.215`, soft hyphens).
3. The checked Interface/Architecture tab asks for the native cursor, and the custom cursor now re-reads the element under a still pointer after every click, so the blue ring no longer sits on the label: `work/ViewSwitch.tsx`, `cursor/CursorImpl.tsx`.
4. Without Lenis (phones, reduced motion), the ScrollTrigger refresh after a page-height change waits until the scroll settles, so a smooth menu/anchor jump on a phone is no longer cut short: `lib/motion/SmoothScroll.tsx`.

**Disk:** drive C: was 100% full during the run (an agent hit ENOSPC once; every file was checked afterwards, none truncated). ~640 MB of old session screenshots were cleared, and on Nov 7 the project moved to drive D: (see the update above). **67 leftover headless-browser profiles (~736 MB) in `%TEMP%\playwright_chromiumdev_profile-*` on C: are still there**: the auto-mode permission check blocked deleting them, so Prajwal must run it or approve it. Keep builds, screenshots and temp files on D:.


**Update, ~17:45:** Prajwal checked the built Sketch → Ship site on localhost and said: "current design I liked it ... if you have more creative ideas add them, make it amazing ... more creative animation designs like animated diagrams, projects, something crazy". So the direction is **confirmed**: add bold features in the same visual language, and don't restyle what exists. See "The creative-boost workflow" below.

Prajwal **rejected the finished "Signal Chain" design**: "the theme is based on electronics but I'm a software developer, both are mismatch, and the design is too bad, make it creative". He asked for a **redesign from scratch**, using his own studio site **Livora** (https://prajwalps2603.github.io/Livora/) as the design reference ("not completely copy"), with content from his résumé and current portfolio.

### His answers
- **Concept:** "use your own idea". The concept is **"Sketch → Ship"**.
- **Accent colour:** "combine and make more creative". The palette is paper `#F4F4EF` and ink `#0D0D0C`, with three highlighter accents: lime `#C8F53B` (build), electric blue `#3D5AFE` (code/interaction) and tangerine `#FF6A2B` (shipped/live).
- **Livora:** "no need to add that co-founder". Livora stays a project he built; **never call him co-founder.**

### Where things are
| What | Where |
|---|---|
| The new spec (the contract) | `design/directions/sketch-to-ship/DIRECTION.md` |
| Livora reference screenshots | `design/reference/livora/` |
| Old-portfolio screenshots | `design/reference/old-portfolio/` |
| The Signal Chain code and docs, archived | `design/archive/signal-chain-src/`, `design/archive/signal-chain-docs/` |
| New content: the six "What I build" items from his old site | `src/content/capabilities.ts` |
| New content: his old hero line | `profile.tagline` |
| Rewritten About copy, now leading with software | `src/content/profile.ts` |

### The redesign workflow
- **Run:** `wf_425a63a8-227`, the faster parallel version. **Script:** `docs/handoff/workflows/redesign-fast.js`; the live copy is in the old session scratchpad. The first, sequential run (`wf_82bd938f-41b`) was stopped after 3 minutes and replaced.
- **Stages:**
  1. Foundation: the design system plus contract stubs (the MiniUI API and keyboard state).
  2. Ten builders in parallel: miniui, hero, build, work, casestudy, stack, stack3d, changelog, about, contact.
  3. Integration.
  4. Up to 2 review rounds; round 2 is skipped if round 1 leaves no serious issues.
  5. Finish.
- **If it stopped,** resume with Workflow `{scriptPath: <the script>, resumeFromRunId: "wf_425a63a8-227", args: {maxRounds: 2}}`. If the scratchpad is gone, use the copy in `docs/handoff/workflows/` and repoint its `SP` and `SHOTS` constants.
- **When it finishes:** verify in the browser yourself, update this handoff, then deploy only with Prajwal's OK.
- **Outcome:** the foundation, all 10 builders and the integration step finished (build OK, tsc OK, zero console errors; home 21,395 px tall at 390 wide, first-load JS 340.9 KB gzip). The run was **deliberately stopped at ~17:50**, before its review round, because Prajwal asked for more features first. **Never re-run or resume `redesign-fast.js`:** its foundation step deletes components.

### The creative-boost workflow (finished ~23:03, Nov 6)
- **Run:** `wf_b65fcf38-6d8`, launched ~17:55. **Script:** `docs/handoff/workflows/creative-boost.js`; the live copy is in the session scratchpad.
- **Args:** `{maxRounds: 2, priorRemaining: [3 leftover issues from the last integration]}`.
- **Stage 1, Boost:** 9 features built in parallel, each agent owning its own folders.
  1. **diagram-work:** a new `src/components/diagram/` engine, plus an "Interface | Architecture" toggle on the Work stage, with animated architecture diagrams and packets running along each project's `flow`.
  2. **casestudy-journey:** a scroll-driven request journey in "How it works". This agent also checks every project's `approach`, `problem` and `flow` against its GitHub README (it owns `src/content/**`).
  3. **build-map:** a live stack map in "What I build" that lights up the path of the hovered capability.
  4. **sketchmode:** a whole-site sketch mode (header pencil toggle, View Transition wipe, `html[data-sketch]` CSS; MiniUIs show their sketch state).
  5. **palette:** a Ctrl/⌘K command palette and mini-terminal (`whoami`, `ls projects`, `git log --oneline`, `npm run hire-prajwal`, and more).
  6. **about-physics:** stickers you can throw.
  7. **contact-ticket:** "What should we build?", which turns into a sticky note, then a ticket card, then opens a mailto.
  8. **hero-play:** a draggable sticky note with a live connector.
  9. **keyboard-legends:** readable labels on the 3D keycaps.
- **Shared contracts,** created by hand before launch:
  - `src/lib/stores/sketchMode.ts` (`useSketchMode`, `getSketchMode`, `subscribeSketchMode`; sets `html[data-sketch]`)
  - `src/components/palette/index.tsx` (`CommandPalette` is mounted in `layout.tsx`; `PaletteTrigger` is in `Header.tsx`; `openPalette()`)
- **Later stages:**
  - **Integration:** make the parallel features fit together. Split the JS (target ≤ 260 KB gzip at first load). Shorten the mobile home: on phones, "Also shipped" shows 4 rows plus "Show all", and changelog details collapse.
  - **Review:** up to 2 rounds of capture, then 4 lenses (craft = Fable, motion, QA, hiring), then triage and fixes.
  - **Finish:** the `/Portfolio` Pages build check, then README and docs.
- **Outcome:** finished ~23:03. Integration build OK. Review round 1: 1 high, 7 medium; round 2: 1 high (stickers trapped vertical swipes on phones), 6 medium; all fixed. Final integration: build OK, tsc OK, 0 console errors. Finish: `/Portfolio` Pages build checked (all asset URLs 200, og.png OK), docs updated. Per-agent results: the run's `journal.jsonl` in the old session's transcript folder.

---

## 1. Status (of the previous Signal Chain build: SUPERSEDED by §0)

**The site is complete and verified. All 11 required experiences in the brief are built, including the interactive 3D element.** It has not been deployed yet: deploying replaces the live site and needs Prajwal's OK (§2.1).

Verified 2026-11-06:
- **Build:** `npx tsc --noEmit` passes; `npm run build` and `npm run build:pages` succeed.
- **Pages build** served under `/Portfolio`: zero 404s or console errors on home and case studies at desktop and mobile.
- **3D bench board:**
  - renders at 1440×900 and 1280×800
  - phones and portrait tablets get the SVG board
  - reduced motion gives a static board
  - switching between the six systems is clean
- **Page heights:** home is **11,761 px** desktop (target ≤ 12,000) and **17,607 px** mobile (target ≤ 18,000).
- **Hydration:** no errors in 8 dev-mode loads, including reduced motion.
- **Share card:** `https://prajwalps2603.github.io/Portfolio/og.png` (1200×630, served as image/png) on home and every datasheet page.
- **Design detector:** no findings on touched source files. Rendered-page findings are known false positives, documented in docs/DESIGN.md.

## 2. Remaining work

### 2.1 Deploy (needs Prajwal's go-ahead; it publishes publicly and replaces the old site)
This folder is **not a git repo yet**. The target is GitHub repo `Prajwalps2603/Portfolio`, branch `main`. `.github/workflows/deploy.yml` builds with `NEXT_PUBLIC_BASE_PATH=/Portfolio` and deploys to https://prajwalps2603.github.io/Portfolio/.

Steps once he says yes:
1. `git init`, set the remote to `https://github.com/Prajwalps2603/Portfolio.git`, and fetch.
2. Decide with him: replace `main`'s history with this project (force push), or add a commit on top. The repo currently holds the old Next 14 site.
3. Commit everything except what `.gitignore` excludes (`node_modules`, `out`, `.next`). Ask before committing `Chat.md` (it contains the full conversation) and the two résumé/cover-letter PDFs.
4. Push, then in the repo's Settings → Pages, source must be "GitHub Actions".
5. Check the live site and `og.png` once the action finishes.

### 2.2 Things only Prajwal can do
- **Update the résumé.** The PDF and the Google Drive copy still say "Frontend Developer" for the current job. Keep the same Drive link (use Manage versions) so the site's Résumé buttons stay valid.
- **Say how Livora should be described.** Is it his own studio, a client project or a concept? The site currently says neutrally "a studio website he built".
- **Review the About copy** in `src/content/profile.ts`. It was written from his résumé and cover letter in his voice.
- **Confirm the ResumAI detail.** Its README's tech stack says the OpenAI API, but its project map calls backend/services "OpenAI & PDF generation stubs". The site says documents are generated "through the OpenAI API". If it is still stubbed, reword `approach` in `src/content/projects.ts` and step 3 in `src/content/journeys.ts`.
- **Audify's four stages.** Its README lists them in two different orders. The site follows the five-step flow ("discover and match" first); fixing the README is his call.
- **ResumAI "Vector PDF export".** Listed under Infrastructure, so the diagram's last hop runs top to bottom. If it is browser print-to-PDF, it belongs under Interface (shorter journey).
- **Free more disk space on C:** the leftover test-browser folders (`%TEMP%\playwright_chromiumdev_profile-*`, 58, ~709 MB) were deleted on 2026-11-10 with his OK (C: then had 4.1 GB free). Still optional: the empty `C:\Users\Prajwal\Desktop\Portfolio` folder once VS Code is reopened on `D:\Portfolio`.
- **Optionally share LinkedIn extras** (recommendations, featured posts). LinkedIn blocks automated reading, so paste them if wanted.
- **Approve the deploy** (§2.1).

### 2.3 Optional polish (not blocking)
- **Initial JS** is 281.6 KiB gzip on `/` (target 260). What is left is mostly React + Next (~133 KB), GSAP + ScrollTrigger (~49 KB) and app code; going further means deferring hydration of below-the-fold sections.
- **Mobile home length** is ~21.9k px at 390 wide (Work 5.8k with six stacked cards; Changelog ~5.3k since each card got its drawing on Nov 7). Shortening it further changes section designs; ask Prajwal first.
- **Phone chat mini-UI** (Drone Intelligence card): the SHIPPED stamp overlaps the draft answer's placeholder lines on purpose (rubber stamp over a draft); the alternative covered the source chips.
- **No-JS phones:** the stacked work cards show empty dotted window sheets (mini-UIs mount near the viewport); all text and links are still there.
- **Content model:** the diagram route table lives in `src/components/diagram/projects.ts`; it could move into `src/content/projects.ts` as a `route` per flow step.
- **Detector notes** (known false positives / by design): `.hl` bands on ink slabs, the sketch-mode notebook grid, the idea ticket's tape clip-path.

---

## 3. Decisions already made (don't re-ask)

| Topic | Decision |
|---|---|
| Current role | **Full Stack Developer**, Maruti Flex Traders LLP, Dec 2025 – Present (Prajwal's correction; his résumé is outdated) |
| Headline title | "Full Stack Developer", not "Java Full Stack Developer" |
| Phone number | Not shown anywhere (his old site didn't show it either) |
| Email | prajwalnair2603@gmail.com, shown with mailto and a copy button |
| Résumé link | Google Drive: https://drive.google.com/file/d/1Q2PdoT5zwjvTVzYTgNlgHAexpmRiYH3k/view |
| Creative direction | **Sketch → Ship** (Livora-inspired; Prajwal liked it). Signal Chain was rejected on Nov 6. Add features in this language; don't restyle. |
| Featured projects (6) | Drone Intelligence, Brain Tumor Detection (1st place), ResumAI, Audify AI, BookMyVenue (live), MCP Job Agent |
| Other projects | Listed under "Also built": MarkVault, LifeSync AI, Smart Ambulance (IoT), Buddy (live), Livora (live), Campus Connect, Accident Detection, Sudoku Solver, CloudScape |
| Live demos linked | Only verified ones: BookMyVenue, Buddy, Livora (College-Website and LifeSync returned 404) |
| Facts policy | Only facts from the résumé, cover letter, GitHub READMEs and the old portfolio's data. Bench internals were checked against READMEs. Nothing invented. |
| Hosting | Static export, GitHub Pages, basePath `/Portfolio`, replacing the old Next 14 portfolio |
| Share card | A `src/app/og.png/route.tsx` route, not the `opengraph-image` convention (that exports an extensionless file served as octet-stream). `metadataBase` is the bare origin. |
| Working style | Prajwal prefers autonomous runs with loops and few check-ins. Decide and keep going, and say what you chose. |
| Design hook | The impeccable design hook ignores `design/directions/**` (Prajwal OK'd it); it still checks `src/` |

## 4. The creative direction: Signal Chain

**Concept:** he trained as an Electronics & Communication engineer, so the site is an **oscilloscope that "locks onto" a full stack developer**. One noisy signal snaps into four clean channels plus their sum:
- CH1 Interface (amber)
- CH2 Services (teal)
- CH3 Data (green)
- CH4 Intelligence (blue)
- Σ Shipped system (bone)

**Look:**
- **Two materials:** graphite screens (#0E0F0D) and bone record sheets (#ECE8DF).
- **Colour is functional only:** each channel colour encodes a layer.
- **Type:** Archivo (the name is wide, weight 800) and Martian Mono (data only).

**Page order:**
1. **00 Source:** opening plus hero (2D WebGL2 scope).
2. **01 Signal:** his own words, with each phrase tagged by channel.
3. **02 Systems:** the bench, six systems on a sticky panel. Each has a **3D board** on desktop or an SVG board elsewhere, a four-channel scope, probes and a "what if" toggle, plus "Also built".
4. **03 Stack:** skills, each tied to where it was used.
5. **04 History:** a "revision history" on a bone sheet, plus education and certifications with Verify links.
6. **05 Connect:** a big email, a copy button, socials.
7. **Footer:** Motion and Signals toggles.

**Case-study pages:** `/work/[slug]/` "datasheets".

**Opening ("THE LOCK", ~3 s):** the trigger catches (AUTO becomes TRIG'D), the signal splits into five lanes, and the name resolves by sample-and-hold. Skippable by any input, short on repeat visits, off with reduced motion.

**Full spec:** `design/directions/signal-chain/DIRECTION.json`. **Approved sketch:** `design/directions/signal-chain/index.html`. **Why it was chosen:** `design/directions/SELECTION.json`.

**Other concepts explored** (judge totals out of 30):

| Concept | Total |
|---|---|
| Signal Chain | 23 |
| Schematic | 23 |
| Cross-Section | 21 |
| Through-Line | 20 |
| Exploded View | 12.5 |

## 5. What's done (detail)

### Research and content
- **Sources read:** résumé and cover-letter PDFs (including embedded links), 25 public GitHub repos with READMEs, and the old portfolio's data (which mirrors LinkedIn).
- **Content model:** typed files in `src/content/`.
- **Provenance notes:** `docs/handoff/content-dossier.md`.

### Foundation
- next/font, Tailwind 4 tokens, themed browser surfaces.
- The motion system in `src/lib/motion/`: GSAP plus named eases, SplitReveal, Lenis synced to ScrollTrigger, the boot/intro modes, and the Motion and Signals preferences.
- Stage store, header with section nav and TRIG'D status, mobile menu, probe cursor, page-transition curtain, SVG icons, 404 page.

### Sections
All of them: intro and hero, statement, the bench (3D and SVG boards, scope, probes, what-ifs), Also built, datasheets, stack, history, education and certifications, contact, footer.

### Quality loops
- **Round 1:** 6 high and 14 medium findings, fixed.
- **Round 2:** 1 high and 9 medium, fixed.
- **Polish pass:**
  - Bench pacing brought within the page-height targets.
  - Motion (`motion/react`) for what-if, probe and copy state swaps.
  - Request path rebuilt as a step sequence.
  - "Also built" is a clip-path wipe plus a native `<details>` parts table.
  - Phone lane layout fixed; trigger hint added.
  - Social rows aligned; SSLC date is 2019; Education has its own reveal.

### Finished on the second account (2026-11-06)
1. Fixed the TypeScript error in the 3D board.
2. **Fixed a 3D texture bug.** The silkscreen canvas is shared between systems; when its size changed (e.g. Drone → Brain Tumor), the old GPU texture was reused, so the previous board's header showed above a shifted board. The texture is now recreated when the canvas size changes (`textureSize` ref in `board3d/Scene.tsx`).
3. Verified the 3D board at four viewports and with reduced motion; the lazy chunk is about 203 KB gzip, desktop only.
4. Could not reproduce the earlier "jump to bottom" ScrollTrigger error or the hydration warning, in either dev or production.
5. **Share card:**
   - real `og.png` route
   - in Archivo (TTF subsets in `src/fonts/og/`)
   - on datasheet pages too, with large-image Twitter cards
   - `/Portfolio` applied exactly once
6. Footer credit now names Three.js and Motion. Removed the unused `@react-three/drei`.
7. README.md, docs/MOTION.md and docs/DEPLOY.md updated to match what ships.
8. Copied the QA tools, workflow scripts, dossier and review history into `docs/handoff/`.

## 6. How to run and check

Run these in `D:\Portfolio`:

```bash
npm install
npm run dev            # http://localhost:3000
npm run typecheck
npm run build          # static export to ./out (root base path)
npm run preview        # serves ./out at http://localhost:4173
npm run build:pages    # same with basePath /Portfolio (what GitHub Pages deploys)
# Strict Pages preview in Git Bash (MSYS_NO_PATHCONV=1 is required or every request returns 404):
MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/Portfolio PORT=4174 node scripts/serve.mjs   # open http://localhost:4174/Portfolio/
```

**Visual QA tools** in `docs/handoff/tools/` (run `npm install` there once; they use headless Microsoft Edge, and WebGL works; screenshots and the browser's temp profile go to `docs/handoff/tools/.out/` on D:):

| Tool | What it does |
|---|---|
| `shot.mjs` | Screenshots and filmstrips. `--viewport desktop|laptop|tablet|mobile|WxH`, `--frames 0,500,...`, `--scroll steps:N --wheel`, `--reduced-motion`, `--full`, `--hover-selector`, `--click`, `--keys`. Prints METRICS and LOGS (console errors and failed requests). |
| `measure.mjs <url> [WxH]` | Section offsets, page height, which board canvases exist |
| `bench-cycle.mjs <url> <outDir> [WxH] [1,2,3]` | Clicks through the bench systems and screenshots the panel |
| `bench-dom.mjs`, `board-zoom.mjs` | Board DOM layers, and a 2× crop of the board edge |
| `repro-jump.mjs <url> [WxH] [--rm]` | Jumps to the page bottom and back, then reports page errors |
| `verify.mjs [desktop,case,mobile,reduced,tablet,laptop]` | The whole site on the production export (`npm run preview`): every creative feature, 0-error check |
| `verify-stack.mjs`, `verify-diver.mjs` | The stack iceberg: the dive, cards, type-ahead, Esc; the diver's jump and descent, the submarine's lights, the waves |
| `verify-about.mjs [desktop,mobile,tablet,relock,drag,keys,persist,reduced,sketch,film]` | The vault: locked until opened (a click, a tap, the wheel dragged by hand, Enter), the boxes opening one by one, relocking, the state kept across a refresh with no flash (door angles sampled while loading), the three Verify hosts, reduced motion and sketch mode open with no button, a filmstrip |
| `verify-readme.mjs [desktop,mobile,reduced,sketch]` | About's README (the render sweep, Preview / Code) and the road trip setting off beside it |
| `verify-port.mjs float` | (added to the port check) the ship floats: it moves in the water, each container set down pushes it down (>= 0.06 container heights), the containers aboard ride with it, and it does not move in reduced motion or sketch mode; exits 1 on a failure |
| `verify-release.mjs` (after `npm run build:pages` + the strict server on :4174; then `npm run build` again for :4173) | the release check of the GitHub Pages build under `/Portfolio`: every `_next` asset 200, links under `/Portfolio`, og:image absolute, 7 pages + 404 on desktop and phone with no errors / failed requests / sideways scroll, palette, sketch mode, puzzle and phone menu through the base path; exits 1 on a failure (passed 2026-11-10; record in DEPLOY.md) |
| `verify-puzzle.mjs` | the newspaper's sudoku by hand: on a phone tap a square and the pad (a repeat turns tangerine and is called out, the full grid is solved, "Play again" resets); on a desktop keys only (one tab stop, 1-4, arrows skip givens, Backspace); "Solve it" still backtracks; screenshots in `.out/puzzle/`; exits 1 on a failure |
| `verify-mobile.mjs` | phones: the header's actions fit with even margins at 320-600px (home, /resume), the newspaper is straight and centred top to bottom with no fold line at 330-430px, the phone menu's "Open the terminal" opens the palette, no page scrolls sideways at 330px; exits 1 on a failure |
| `verify-stamps.mjs` | every page (home, two case studies, /resume, /repos, /pull-request) on desktop and mobile, scrolled through: lists each stamp and any SHIPPED text; exits 1 if SHIPPED shows anywhere but the port's ship |
| `miniui-lab.mjs` (dev server :3000; env `WIDTHS=320,384,440,560,700`, `PROJECTS=a,b`, `THEME=dark`) | the dev-only mini-UI lab: each project picture sketch beside ship at each width, one screenshot per width in `.out/mui/` |
| `verify-sketchbook.mjs [desktop,mobile,cursor]` | The sketchbook in sketch mode: a drag draws (no text selected), a click leaves no mark and buttons still work, marker, eraser, undo/redo (buttons, Ctrl+Z/Y), clear + undo, kept across a reload in place, pinned while scrolling, hidden with sketch mode off, a drawing per page, phone: a swipe scrolls with the hand, a finger draws with the pencil; the eraser cursor; the native pencil cursor in lite mode; 0 errors |
| `verify-theme.mjs` | Light/dark: the header switch (desktop, phone), remembered, dark at first paint on reload, follows the OS until chosen (and a choice beats it), the palette command, sketch stays paper in dark, the newspaper keeps its paper, 0 errors |
| `verify-contrast.mjs [dark|light|both] [paths]` | Every visible text against the colour actually painted behind it (decorative layers and the highlighter band included), after opening the first What I build row; lists anything under MIN (env, default 3; use MIN=4.5 for body text) |
| `perf-scroll.mjs [path] [variant]` | Scrolls a page on this machine's real GPU (Edge headless, D3D11) with the mouse wheel and prints frame times, with each suspect switched off in turn (header blur, cursor, paper canvas, blend modes). Run with `MSYS_NO_PATHCONV=1` in Git Bash. Headless frames do not show composite cost: use it for main-thread regressions |
| `verify-times.mjs [desktop,header,print,mobile,reduced,sketch]` | The Prajwal Times: the header's "Prajwal Times" ("Times" below 1440, the header fits, no Résumé) opens /resume; masthead, today's date, Indian edition, the ticker, Livora lead, four roles, certs, nine briefs (incl. HRMS, SRMS, Support Ticket System), three photos load, the newsletter link, the WANTED copy, tear a tab (copies the email), the puzzle solves, no empty space at any column's foot, print = 1 A4 page, phone (menu link), reduced, sketch (WANTED legible); 0 errors |
| `verify-card.mjs [desktop,popup,palette,mobile,reduced,sketch]` | The visiting card: front facts, the Now card below it with the live time, the tilt (and no hover motion), Flip, the QR decodes (flat and as shown, with jsQR), Save contact's .vcf (no TEL), Share's copy fallback; the exit-intent popup (not early, once per visit, focus, Tab trap, Esc and focus return); the palette's Take my card / Save my contact; no popup on touch; reduced; sketch; 0 errors |
| `verify-pr.mjs [desktop,mobile,reduced,sketch]` | Contact as a pull request: the contact section's button opens /pull-request; an empty title refused; the branch follows the title; labels toggle; milestone; Preview; the mailto (to, subject with labels, body with description, labels, milestone); draft; Escape closes the ▾; Copy as text; Back to contact; no sideways scroll; 0 errors. Exits 1 on any failure |
| `verify-repos.mjs [desktop,mobile,reduced,sketch,nav]` | The /repos code editor: full width, nothing scrolls inside; the workspace README first; Explorer folders -> README (tab, breadcrumbs, source + preview, links) and repo.json (minimap); the cursor and its note; closing a tab; Search; Timeline; the terminal (help, ls, open with Tab, neofetch, git log, an unknown command, history, clear, prompt on screen); Run (cd Livora + npm run dev opens its live page and it loads, Ctrl+C, npm start, the play button from the workspace runs Portfolio, a repo not deployed says so, the open tab in sight); phone (drawer in place of the editor, preview only, Source switch, play shows the browser); reduced; sketch; the header's Repos link; 0 errors. Needs the network (it loads the live pages). Exits 1 on any failure |
| `verify-garden.mjs [desktop,mobile,keys,seasons,nav,reduced,sketch]` (the garden, now unmounted; kept in case it comes back) | The /garden page: a film of the time-lapse, the plants grown and the gardener's walk, Pause / Play / Grow it again, a plant's tag on hover and with the arrow keys, the four seasons and their signs, the seed shelf, the header's Garden link at 1440 / 1280 / 1024 / 900 (fits, aria-current), reduced motion, sketch mode, 0 errors |
| `verify-road.mjs [desktop,mobile,pause,reduced,sketch]` | The road trip: a film of the drive (camera, day into night), the signpost's boards lighting and the mynah's hops, Pause / Play / Drive it again, reduced motion and sketch mode at the final state |
| `verify-port.mjs [desktop,laptop,tablet,mobile,reduced,sketch]` | "Also shipped" as a port: the crane moving with no scrolling, the pause control, the stamp only while the ship is full (desktop waits for a full load), the yard tabs, a click on a container, ArrowRight, the opened container shots (open, shut mid-swap), 0 errors |
| `verify-changelog.mjs [desktop,laptop,tablet,mobile,small,reduced,sketch,film]` | The career cards' panels: each figure, the medal and the college play and rest, no label outside its panel, 0 errors; `film` saves a filmstrip of each playing. `measure-changelog.mjs` measures and shoots the cards |

**Design detector:** `C:\Users\Prajwal\.claude\skills\impeccable\scripts\bin\windows-x64\impeccable.exe detect --json <files | url> [--viewport 390x844]`

**AGENTS.md rule:** Next.js 16 is newer than model training data. Read `node_modules/next/dist/docs/` before writing Next-specific code.

## 7. Process history

| When (IST) | What |
|---|---|
| Nov 5, 10:53 | Brief received. Research: résumé, cover letter, GitHub, old site; LinkedIn blocked. Tooling set up. |
| Nov 5, 11:05 – 13:45 | Creative-directions workflow: 35 verified references, 5 directors, 3 judges, 3 finalists |
| Nov 5, ~13:55 | Prajwal delegated the choice; **Signal Chain** picked. Build workflow launched (model mix: Opus, Sonnet, Haiku, Fable). Paused at 14:22 at his request. |
| Nov 6, morning – 12:20 | Build completed: 36 agents, foundation, 6 sections, 2 review rounds, release check |
| Nov 6, 12:29 – 13:19 | Polish workflow; 3 of 4 builders finished, then the **weekly account limit** hit |
| Nov 6, 14:20 – 15:00 | Second account: handoff written, 3D board finished and fixed, share card, release check, docs. **Site complete; awaiting deploy approval.** |
| Nov 6, 15:20 – 17:50 | Signal Chain rejected; Sketch → Ship redesign built by `wf_425a63a8-227` (foundation, 10 builders, integration). Prajwal liked it. |
| Nov 6, 17:55 – 23:03 | Creative boost `wf_b65fcf38-6d8`: 9 features, integration, 2 review rounds, finish (43 agents). |
| Nov 6, 23:05 – Nov 7, 00:15 | Main session: disk cleanup, 4 fixes, browser verification at 4 sizes + reduced motion + sketch mode, `/Portfolio` build, handoff. |
| Nov 7, ~09:00 – 09:15 | Project moved to `D:\Portfolio` (C: was full): copy verified file by file, original deleted; typecheck, build, servers and a browser check OK from D:. |
| Nov 7, ~09:20 – 11:00 | Stack redesigned as the iceberg (3D keyboard and three.js removed), then waves, a diver and a submarine at his request; certifications redesigned as pinned, stamped certificates (stickers removed); 3 finish reviews, fixes applied. |

`docs/handoff/workflows/` holds the build and polish workflow scripts. They reference the old session's temp scratchpad and the old `C:\Users\Prajwal\Desktop\Portfolio` path for `shot.mjs` and the dossier; repoint those to `D:\Portfolio\docs\handoff\` if you reuse them. `docs/handoff/review-round2-state.json` holds the round-2 triage and fixes.

## 8. Live progress log (newest last)
- 2026-11-06 ~14:30: handoff written; started on the remaining work.
- 2026-11-06 ~14:35: build green (TypeScript narrowing fix in `board3d/Scene.tsx`).
- 2026-11-06 ~14:38: 3D board verified; texture-reallocation bug found and fixed (Brain Tumor board showed a doubled header).
- 2026-11-06 ~14:45: known bugs re-tested, none reproducible; dev-mode hydration clean.
- 2026-11-06 ~14:50: footer credit fixed; drei removed; `/Portfolio` release check clean; share card moved to an `og.png` route with Archivo lettering, on all pages.
- 2026-11-06 ~15:00: README and docs updated. **Remaining: deploy (needs approval), Prajwal's to-dos, optional polish.**
- 2026-11-06 ~15:20: **Prajwal rejected Signal Chain** (electronics theme, "design too bad"). He asked for a Livora-inspired redesign from scratch using his résumé and old portfolio.
- 2026-11-06 ~15:45: studied Livora and the old site in the browser. Asked him 3 questions (answers in §0). Archived the Signal Chain code, added `capabilities.ts`, wrote the Sketch → Ship spec, and launched redesign workflow `wf_82bd938f-41b`.
- 2026-11-06 ~15:15: Prajwal asked for speed. Replaced it with the parallel run `wf_425a63a8-227`: 10 builders at once after the foundation, with an early stop after review round 1 if nothing serious remains.
- 2026-11-06 ~16:09: foundation done (tokens, sketch system, motion library, shell, contract stubs, OG card). ~17:09: all 10 builders done. ~17:48: integration done (20 fixes; build, tsc and console all clean).
- 2026-11-06 ~17:45: Prajwal checked it on localhost: "current design I liked it". He asked for more: animated diagrams, projects, "something crazy".
- 2026-11-06 ~17:50: stopped `wf_425a63a8-227` before its review round. Created the sketch-mode and palette contracts, and launched the creative-boost run `wf_b65fcf38-6d8` (9 features in parallel, then integration, review rounds and finish).
- 2026-11-06 ~23:03: creative boost finished: 43 agents, 0 errors; final build, tsc and console clean; `/Portfolio` build checked; docs updated.
- 2026-11-06 ~23:05: drive C: found 100% full (78 MB free). Cleared ~640 MB of old session screenshots and scratch builds; deleting the orphaned `%TEMP%` browser profiles was blocked by the permission check (left for Prajwal). No source file was truncated.
- 2026-11-06 ~23:20: fixed sticker drag in reduced motion, long keycap legends, the cursor ring over the checked view tab (plus a cursor re-read after clicks), and the phone scroll refresh; docs updated; tsc and build green.
- 2026-11-07 ~00:10: browser verification done (see §0); `/Portfolio` build re-checked; handoff and memory updated. **Waiting for Prajwal: feedback, content answers (§2.2), deploy OK (§2.1).**
- 2026-11-07 ~09:15: Prajwal: "use drive D, move the portfolio full folder to drive D". Moved to `D:\Portfolio` (copy verified, original deleted; C: 0.52 → 1.66 GB free); `.next` rebuilt on D:; typecheck, build, dev/preview servers and `verify2.mjs` OK from D:; QA tools now keep screenshots and browser temp files in `docs/handoff/tools/.out/`. **Still waiting for Prajwal: feedback, content answers (§2.2), deploy OK (§2.1).**
- 2026-11-07 ~11:00: Prajwal rejected the 3D keyboard and the throwable stickers. Built the stack iceberg ("My stack, all the way down") and the pinned, stamped certificates; then, at his request, realistic waves, a diver and a lit submarine in the iceberg. Reviews applied; typecheck, detector, build and browser checks green, 0 errors. **Waiting for Prajwal: his reaction, the content answers (§2.2), deploy OK (§2.1).**
- 2026-11-07 ~11:45: diver reworked from Prajwal's feedback (smooth, clear of the ice, a professional giant-stride entry, a detailed figure, swims up head first, stands on the seabed); the award card's year no longer wraps alone. Checks green, 0 errors.
- 2026-11-07 ~12:05: Career cards illustrated from Prajwal's screenshots: a figure of each role's work (cloud, ML, Java full stack, ops), a swinging medal on the 1st-place card, the college with a tossed cap on the init card. Docs (DESIGN §8.1, MOTION §4/§9/§10, README) updated; checks green, 0 errors.
- 2026-11-07 ~12:35: "Also shipped" redesigned as a container port from Prajwal's brief: a ship-to-shore crane loads the 9 project containers onto the MV SHIPPED as you scroll (SHIPPED stamp at the end), a manifest of tabs opens any container (doors swing, stack as cargo, source/live links). Docs (DESIGN §8.1, MOTION §4/§9/§10, README) updated; checks green, 0 errors.
- 2026-11-07 ~13:20: the port, second round: the crane runs on a clock with a pause button (stamp only while full); the opened container is now a bill of lading beside the container in perspective, packed with the stack as crates; the crane and ship redrawn in detail. Checks green, 0 errors.
- 2026-11-07 ~14:40: About redesigned: the README file viewer (renders from its source), "The road so far" (a map with a bus and punched tickets, replacing the Education list), the credentials as stamps in a passport (replacing the certificates on a line); the case study's Live demo dot spacing fixed. Checks green, 0 errors.
- 2026-11-07 ~16:00: certifications: passport -> summits (rejected: "think new diffrnet") -> a vault, locked until he opens it (his spec), the boxes opening one by one, the state kept across refreshes with no flash; "The road so far": map + tickets -> a road trip through the years with a signpost and a mynah. Docs and memory updated; checks green, 0 errors. **Waiting for Prajwal: his reaction, the content answers (§2.2), deploy OK (§2.1).**
<!-- HANDOFF:END -->

---

# Full conversation transcript (exported by Prajwal)

# Project: Premium Creative Motion Portfolio

Act as a world-class creative developer, senior motion designer, UI/UX designer and frontend architect.

Your task is to create an award-winning, professional portfolio website with exceptional visual storytelling and high-quality motion design.

## Creative direction

Create a visually distinctive, premium digital experience inspired by award-winning creative development studios and experimental interactive portfolios.

The website should feel:
- Cinematic
- Modern
- Experimental
- Sophisticated
- Minimal yet visually rich
- Highly interactive

Avoid generic AI-generated portfolio templates and conventional developer portfolio layouts.

## Technology

- Next.js
- React
- TypeScript
- GSAP and ScrollTrigger
- Three.js / React Three Fiber
- Motion
- Tailwind CSS

## Required experiences

1. Cinematic opening sequence.
2. Distinctive animated hero typography.
3. Interactive visual background.
4. Smooth scroll-based storytelling.
5. Animated project showcases.
6. Interactive 3D elements.
7. Premium hover and cursor interactions.
8. Animated skills and technology presentation.
9. Creative about section.
10. Contact section with refined transitions.
11. Responsive mobile and tablet experiences.

## Animation quality

Every animation must have a purpose.

Use:
- Carefully timed easing.
- Smooth interpolation.
- Layered motion.
- Staggered typography.
- Parallax where appropriate.
- Scroll-triggered timelines.
- Fluid page transitions.

Avoid excessive animation, distracting effects and unnecessary 3D elements.

## Development rules

1. First analyse the complete project requirements.
2. Establish the creative direction before implementation.
3. Build reusable components and animation systems.
4. Keep animations modular and maintainable.
5. Respect accessibility and reduced-motion preferences.
6. Optimize rendering and loading performance.
7. Test on desktop, tablet and mobile.
8. Never use placeholder interactions that appear functional but do nothing.

## Working approach

Work in structured phases.

Do not attempt to generate the entire website in one step.

First present three different creative directions with visual references, layout concepts and animation ideas.

Wait for the selected direction before implementing the complete experience.

After implementation, inspect the actual browser rendering, identify visual weaknesses and refine them until the result feels like a professional creative studio portfolio.
use all kind of agents and all kind of stack anything u want 
run in loop for refinement 
u can use GSAP + scroll tigger , three.js, motion anythigfn u need 
iam giving full acess 

for my data i have uploaded resuem and cover letter 
one tjhing i need to chnage : my current position is Full Stack Developer current
Show more
10:53 AM
I'll start by looking at what's in the workspace — your resume and cover letter — and checking the toolchain.



Bash List workspace files
IN
cd "/c/Users/Prajwal/Desktop/Portfolio" && ls -la && echo "---" && find . -maxdepth 3 -not -path "*/node_modules*" -not -path "*/.git/*" | head -100

OUT
total 364
drwxr-xr-x 1 Prajwal 197121      0 Nov  5 10:47 .
drwxr-xr-x 1 Prajwal 197121      0 Nov  5 10:47 ..
-rw-r--r-- 1 Prajwal 197121 121778 Sep 11 15:04 Prajwal_MP_Cover_Letter.pdf
-rw-r--r-- 1 Prajwal 197121 238071 Sep  3 11:06 Prajwal_M_P -- Java_Full_Stack.pdf
---
.
./Prajwal_MP_Cover_Letter.pdf
./Prajwal_M_P -- Java_Full_Stack.pdf
Bash Check node, npm, git, browsers
IN
node --version 2>&1; npm --version 2>&1; npx --version 2>&1; git --version 2>&1; pnpm --version 2>&1; python --version 2>&1; where chrome msedge 2>&1; ls "/c/Program Files (x86)/Microsoft/Edge/Application/" 2>&1 | head; ls "/c/Program Files/Google/Chrome/Application/" 2>&1 | head

OUT
v24.13.1
11.8.0
11.8.0
git version 2.52.0.windows.1
/usr/bin/bash: line 2: pnpm: command not found
Python 3.10.10
INFO: Could not find files for the given pattern(s).
156.0.4314.58
AppxSignature.p7x
PlatformExperiencesHelper
SetupMetrics
msedge.VisualElementsManifest.xml
msedge.exe
msedge_proxy.exe
pwahelper.exe
ls: cannot access '/c/Program Files/Google/Chrome/Application/': No such file or directory
10:53 AM
Node 24, npm, git and Edge are available — Edge will let me screenshot the site later. Now reading your resume and cover letter.



Read C:\Users\Prajwal\Desktop\Portfolio\Prajwal_M_P -- Java_Full_Stack.pdf, C:\Users\Prajwal\Desktop\Portfolio\Prajwal_MP_Cover_Letter.pdf
10:55 AM
I have the full picture of your background. Next I'll pull the real hyperlinks embedded in the PDFs (project repos, credentials) so the site never ships dead links, and check network access.



Bash Check which PDF libraries are installed
IN
cd "/c/Users/Prajwal/Desktop/Portfolio" && python -c "import importlib; [print(m, bool(importlib.util.find_spec(m))) for m in ['fitz','pypdf','PyPDF2','pdfminer','pdfplumber']]" 2>&1

OUT
Exit code 1
Traceback (most recent call last):
  File "<string>", line 1, in <module>
  File "<string>", line 1, in <listcomp>
AttributeError: module 'importlib' has no attribute 'util'
Bash Check network access to GitHub and npm
IN
curl -s -o /dev/null -w "github api: %{http_code}\n" https://api.github.com/users/Prajwalps2603 ; curl -s -o /dev/null -w "old portfolio: %{http_code}\n" https://prajwalps2603.github.io/Portfolio/ ; curl -s -o /dev/null -w "npm registry: %{http_code}\n" https://registry.npmjs.org/gsap

OUT
github api: 200
old portfolio: 200
npm registry: 200
Bash Check which PDF libraries are installed
IN
cd "/c/Users/Prajwal/Desktop/Portfolio" && python -c "
import importlib.util as u
for m in ['fitz','pypdf','PyPDF2','pdfminer','pdfplumber']: print(m, bool(u.find_spec(m)))
" 2>&1

OUT
fitz True
pypdf False
PyPDF2 False
pdfminer True
pdfplumber True
Bash Fetch public GitHub profile and repo list
IN
curl -s "https://api.github.com/users/Prajwalps2603" | head -40; echo "=== REPOS ==="; curl -s "https://api.github.com/users/Prajwalps2603/repos?per_page=100&sort=updated" | python -c "
import json,sys
d=json.load(sys.stdin)
for r in d: print(r['name'],'|',r.get('language'),'|',r.get('description'),'|',r.get('homepage'),'|',r['html_url'],'|',r['updated_at'],'| fork' if r['fork'] else '')
"

OUT
{
  "login": "Prajwalps2603",
  "id": 175115678,
  "node_id": "U_kgDOCnANng",
  "avatar_url": "https://avatars.githubusercontent.com/u/175115678?v=4",
  "gravatar_id": "",
  "url": "https://api.github.com/users/Prajwalps2603",
  "html_url": "https://github.com/Prajwalps2603",
  "followers_url": "https://api.github.com/users/Prajwalps2603/followers",
  "following_url": "https://api.github.com/users/Prajwalps2603/following{/other_user}",
  "gists_url": "https://api.github.com/users/Prajwalps2603/gists{/gist_id}",
  "starred_url": "https://api.github.com/users/Prajwalps2603/starred{/owner}{/repo}",
  "subscriptions_url": "https://api.github.com/users/Prajwalps2603/subscriptions",
  "organizations_url": "https://api.github.com/users/Prajwalps2603/orgs",
  "repos_url": "https://api.github.com/users/Prajwalps2603/repos",
  "events_url": "https://api.github.com/users/Prajwalps2603/events{/privacy}",
  "received_events_url": "https://api.github.com/users/Prajwalps2603/received_events",
  "type": "User",
  "user_view_type": "public",
  "site_admin": false,
  "name": "Prajwal M P",
  "company": null,
  "blog": "",
  "location": null,
  "email": null,
  "hireable": null,
  "bio": "💻 Java Full Stack Developer | React | Spring Boot | AI/ML Enthusiast | GitHub Foundation Certified | Building scalable web applications & intelligent solutions",
  "twitter_username": null,
  "public_repos": 25,
  "public_gists": 0,
  "followers": 4,
  "following": 0,
  "created_at": "2024-07-09T11:07:16Z",
  "updated_at": "2026-11-05T03:35:27Z"
}
=== REPOS ===
Buddy | HTML | None | None | https://github.com/Prajwalps2603/Buddy | 2026-10-26T16:33:50Z 
BookMyVenue | JavaScript | None | None | https://github.com/Prajwalps2603/BookMyVenue | 2026-10-25T09:18:26Z 
Livora | JavaScript | Company Website | None | https://github.com/Prajwalps2603/Livora | 2026-10-12T17:44:07Z 
prajwalps2603.github.io | HTML | None | None | https://github.com/Prajwalps2603/prajwalps2603.github.io | 2026-10-11T15:48:13Z 
Custom-MCP-Server | TypeScript | None | None | https://github.com/Prajwalps2603/Custom-MCP-Server | 2026-09-29T19:12:01Z 
LifeVault-AI | TypeScript | None | None | https://github.com/Prajwalps2603/LifeVault-AI | 2026-09-27T15:43:37Z 
AI-Resume-Builder | TypeScript | Next-Gen AI Resume & ATS Intelligence Platform — Reverse-engineers job descriptions, maximizes ATS pass rates (98%+), and outputs synchronized resumes, tailored cover letters, and recruiter pitches in seconds. Built with Next.js 14, TypeScript, Tailwind CSS, & FastAPI. | None | https://github.com/Prajwalps2603/AI-Resume-Builder | 2026-09-25T16:20:02Z 
Audify-AI | TypeScript | Audify AI is an AI-powered Android app for telecallers that discovers and organizes call recordings, converts conversations into multilingual transcripts, and stores call data securely. Built with React Native, TypeScript, Node.js, Google Drive, Google Sheets, and Speech-to-Text, it makes customer conversations searchable and easy to manage. |  | https://github.com/Prajwalps2603/Audify-AI | 2026-09-25T15:55:09Z 
Prajwalps2603 | None | None | None | https://github.com/Prajwalps2603/Prajwalps2603 | 2026-09-25T15:37:08Z 
LifeSync | TypeScript | None | None | https://github.com/Prajwalps2603/LifeSync | 2026-09-24T04:36:03Z 
College-Website | TypeScript | College website developed using Next.js, TypeScript, and Tailwind CSS for an interactive and modern user experience. | None | https://github.com/Prajwalps2603/College-Website | 2026-09-24T04:25:47Z 
Portfolio | TypeScript | Personal portfolio website showcasing my skills, projects, and experience as a software developer. Built to highlight my work in Java Full Stack development, AI, and Python-based projects with a clean, responsive UI. This portfolio reflects my learning journey, technical growth, and passion for building real-world applications.  | None | https://github.com/Prajwalps2603/Portfolio | 2026-09-06T10:01:09Z 
react | None | The library for web and native user interfaces. | https://react.dev | https://github.com/Prajwalps2603/react | 2026-06-09T20:38:45Z | fork
code-review-graph | None | Local knowledge graph for Claude Code. Builds a persistent map of your codebase so Claude reads only what matters — 6.8× fewer tokens on reviews and up to 49× on daily coding tasks. | https://code-review-graph.com | https://github.com/Prajwalps2603/code-review-graph | 2026-04-10T06:22:05Z | fork
MarkVault-Smart-BooKMark-App | TypeScript | A modern, full-stack bookmark manager built with Next.js, Supabase, and Tailwind CSS. Features include analytics, reminders, import/export, AI summarization, collaborative folders, custom tags, archiving, and quick search. | None | https://github.com/Prajwalps2603/MarkVault-Smart-BooKMark-App | 2026-02-14T11:40:07Z 
Drone-Intelligence-System | JavaScript | Drone Intelligence System is a full-stack AI-powered platform that acts as a comprehensive drone knowledge hub, integrating RAG-based document intelligence, real-time analytics, and an interactive dashboard using modern web technologies. | None | https://github.com/Prajwalps2603/Drone-Intelligence-System | 2026-02-11T16:57:54Z 
Valentine | CSS | None | None | https://github.com/Prajwalps2603/Valentine | 2026-02-06T09:49:27Z 
Human_Brain_Tumor_Detection | Jupyter Notebook | Deep learning–based Brain Tumour Detection system using CNN to classify MRI images as tumour or non-tumour. Trained on 12,000+ MRI scans with ~97% accuracy. Includes data preprocessing, augmentation, and a Flask-based web interface for MRI upload and real-time prediction. |  | https://github.com/Prajwalps2603/Human_Brain_Tumor_Detection | 2026-02-01T10:31:57Z 
Sudoku-Solver-DSA | CSS | A web-based application built using core Data Structures and Algorithms (DSA) concepts. The project demonstrates practical implementation of searching, sorting, and data management techniques to improve efficiency and performance. It bridges theoretical DSA knowledge with real-world web development through an interactive user interface. | None | https://github.com/Prajwalps2603/Sudoku-Solver-DSA | 2026-01-18T10:38:00Z 
Campus_Connect | JavaScript | None | None | https://github.com/Prajwalps2603/Campus_Connect | 2026-01-15T09:07:04Z 
prajwale | None | None | None | https://github.com/Prajwalps2603/prajwale | 2026-01-15T08:54:18Z 
MysticLoginPage | CSS | Login Page using HTML and CSS | None | https://github.com/Prajwalps2603/MysticLoginPage | 2026-01-15T08:54:16Z 
smart-ambulance-traffic-clearance | TypeScript | None | None | https://github.com/Prajwalps2603/smart-ambulance-traffic-clearance | 2026-01-15T08:54:12Z 
AWS-Web-Hosting | HTML | None | None | https://github.com/Prajwalps2603/AWS-Web-Hosting | 2026-01-15T08:54:04Z 
Vechile-Accident-System | Jupyter Notebook | None | None | https://github.com/Prajwalps2603/Vechile-Accident-System | 2026-01-15T08:54:03Z
Your GitHub holds more work than the resume shows, including AI Resume Builder, Audify AI, MarkVault and a custom MCP server. I'm pulling the PDF links and READMEs of the strongest repos next so the project details are accurate.
Bash Extract hyperlinks embedded in the PDFs
IN
cd "/c/Users/Prajwal/Desktop/Portfolio" && python -c "
import fitz
for f in ['Prajwal_M_P -- Java_Full_Stack.pdf','Prajwal_MP_Cover_Letter.pdf']:
    d=fitz.open(f); print('==',f)
    for i,p in enumerate(d):
        for l in p.get_links():
            if l.get('uri'):
                r=l['from']; txt=p.get_textbox(r).strip().replace('\n',' ')
                print(i+1,'|',txt[:70],'|',l['uri'])
"

OUT
== Prajwal_M_P -- Java_Full_Stack.pdf
1 | prajwalnair2603@gmail.com | mailto:prajwalnair2603@gmail.com
1 | linkedin.com/in/prajwal-m-p-190131246 | https://www.linkedin.com/in/prajwal-m-p-190131246
1 | https://prajwalps2603.github.io/Portfolio/ | https://prajwalps2603.github.io/Portfolio/
2 | Projects  Human Brain Tumor Detection using Deep Learning & Web Develo | https://github.com/Prajwalps2603/Human_Brain_Tumor_Detection.git
2 | healthcare-focused use cases.  Drone Intelligence System � AI-Powered  | https://github.com/Prajwalps2603/Drone-Intelligence-System.git
2 | | Credential | https://www.credly.com/badges/a810b47b-11af-4dad-88f9-7ea37720f30d/linked_in_profile
2 | | Credential | https://catalog-education.oracle.com/ords/certview/sharebadge?id=9AAAC1F3B6368ADE76D13A16495BA0C0748267A7AC0DFD9677FB8A639833CC61
2 | | Credential  | Credential | https://drive.google.com/file/d/1jAL0CwQWRCJq0UhWTULsLI8yptZkW8EW/view?usp=sharing
== Prajwal_MP_Cover_Letter.pdf
Bash Fetch READMEs of key GitHub repos
IN
for r in AI-Resume-Builder Audify-AI MarkVault-Smart-BooKMark-App Drone-Intelligence-System Human_Brain_Tumor_Detection Custom-MCP-Server LifeVault-AI Livora BookMyVenue smart-ambulance-traffic-clearance Prajwalps2603; do echo "################ $r"; curl -s -H "Accept: application/vnd.github.raw" "https://api.github.com/repos/Prajwalps2603/$r/readme" | head -c 2500; echo; done

OUT
################ AI-Resume-Builder
# ResumAI — AI Resume Intelligence & ATS Optimization Platform

> Next-generation AI resume studio that reverse-engineers job descriptions, maximizes ATS pass rates (98%+), and outputs synchronized resumes, tailored cover letters, and recruiter pitches in seconds.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- 🎯 **ATS Optimization & Diagnostic Engine:** Reverse-engineers real Applicant Tracking Systems (Workday, Taleo, Greenhouse) to detect keyword gaps and formatting flaws.
- ⚡ **1-Click Multi-Company Tailoring:** Customizes technical tone and metrics for companies like Google, Stripe, Microsoft, Amazon, and high-growth startups.
- 📑 **6 Curated ATS-Safe Templates:** High-fidelity layouts including *Tech Titan (FAANG Standard)*, *Executive Onyx*, *Silicon Gradient*, *Harvard Classic*, *Creative Portfolio*, and *Cloud Architect*.
- 🛠️ **Live Split-Screen Studio:** Real-time A4 resume preview with customizable accent colors and instant keyword match indicators.
- 📬 **Synchronized Career Documents:** Generates matching ATS resumes, tailored cover letters, and direct recruiter cold emails / LinkedIn pitches simultaneously.
- 📊 **Recruiter 6-Second Glance Simulation:** Visual eye-tracking heatmap breakdown illustrating key anchors recruiters notice within the first 6 seconds.
- 🔒 **Encrypted Career Vault:** Store master work experience, skills cloud, and credentials once for instant re-use across all applications.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend:** FastAPI, Python, PostgreSQL, JWT Authentication, OpenAI API
- **Exporting:** Pixel-perfect printable vector PDF generation

---

## 🚀 Quick Start (Lo
################ Audify-AI
# Audify AI

<div align="center">

```
    _   _   _ ____  ___ _____   __   __     _    ___ 
   / \ | | | ||  _ \|_ _||  ___| \ \ / /   / \  |_ _|
  / _ \| | | || | | || | | |_     \ V /   / _ \  | | 
 / ___ \| |_| || |_| || | |  _|    | |   / ___ \ | | 
/_/   \_\\___/ |____/|___|_|       |_|  /_/   \_\___|
```

### Record • Transcribe • Organize • Automate

[![React Native](https://img.shields.io/badge/React%20Native-0.87.1-blue.svg)](https://reactnative.dev/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933.svg)](https://nodejs.org/)
[![Android](https://img.shields.io/badge/Platform-Android%2024+-3DDC84.svg)](https://www.android.com/)
[![HTTPS](https://img.shields.io/badge/HTTPS-Let's%20Encrypt-00C853.svg)](https://letsencrypt.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Audify AI** is an intelligent, privacy-first mobile companion for authorized telecallers, sales reps, and customer success agents. It automatically detects phone call recordings on Android, links call metadata, backs up audio to Google Drive, generates AI-powered speech-to-text transcriptions with speaker diarization, and syncs organized summaries directly into Google Sheets CRM tables — all backed by a hardened **HTTPS Express backend** with Let's Encrypt auto-renewal.

</div>

---

## 🚀 Key Features

- 🎙️ **Automated Recording Discovery**: Real-time media scanner discovers audio recordings across Android internal storage and custom directories via SAF (Storage Access Framework).
- 🔗 **Call Metadata Matching**: Correlates device call logs (duration, timestamp, incoming/outgoing/missed status, contact name) with audio files using fuzzy time window matching.
- ☁️ **Google Drive Backup**: Uploads recordings directly to a secure, organized user Drive folder (`Audify AI Recordings`) with duplicate checks.
- 🗣️ **Multi-Provider AI Transcription**: Pluggable Speech-to-Text supporting **Google Cloud Speech-to-Text v2**, **OpenAI Whisper**, **Deepgram Nova-2**, and **AssemblyAI** with diarization and confidence scores.
- 📊 **Google Sheets CRM Sync**: Real-time export of structured call summaries, sentiment, duration, audio links, and transcripts into automated Google Sheets spreadsheets.
- ⚡ *
################ MarkVault-Smart-BooKMark-App
# Smart Bookmark App

## Overview
A modern, full-stack bookmark manager built with Next.js, Supabase, and Tailwind CSS. Features include analytics, reminders, import/export, AI summarization, collaborative folders, custom tags, archiving, and quick search.

---

## Architecture Diagram

```
+-------------------+      +-------------------+      +-------------------+
|   Next.js Frontend|<---->|   Supabase Backend|<---->|   PostgreSQL DB   |
+-------------------+      +-------------------+      +-------------------+
        |                        |                        |
        |  Auth, Realtime, CRUD  |  RLS, Triggers, Pub    |
        |----------------------->|----------------------->|
        |                        |                        |
        |  REST/Realtime/GraphQL |                        |
        |<-----------------------|                        |
```

---

## Technology Stack
- **Frontend:** Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- **Backend:** Supabase (Auth, Realtime, PostgreSQL, RLS)
- **UI:** Tailwind CSS, Framer Motion, Lucide React, Sonner, date-fns
- **AI:** Summarization via OpenAI API (example endpoint)

---

## Setup & Connection

### 1. Supabase
- Created project at [supabase.io](https://supabase.io)
- Enabled Google OAuth for authentication
- Created tables: `folders`, `bookmarks`, `reminders`, `bookmark_archive`
- Enabled RLS (Row Level Security) for user data isolation
- Enabled Realtime for `bookmarks` and `folders` tables
- Set up triggers for `updated_at` and analytics

### 2. Next.js
- Scaffolded with `npx create-next-app@latest` (16.1.6)
- Added Tailwind CSS v4, Framer Motion, Lucide React, Sonner, date-fns
- Connected to Supabase using environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Implemented singleton Supabase client for browser

### 3. Features Implemented
- **Analytics:** Visit count, last accessed, tag stats
- **Reminders:** Set, notify, display reminders
- **Import/Export:** CSV/JSON, browser file import
- **AI Summarize:** Button, modal, API integration
- **Collaborative Folders:** Share, invite, display
- **Custom Tags & Suggestions:** Color picker, tag suggestions
- **Archiving:** Archive/unarchive bookmarks
- **Quick Search & Shortcuts:** Fuzzy search, Ctrl+K modal

---

## Detailed Process

### Database Schema
- Designed schema in `supabase/schema.sql`:
  - `folders`: supports sharing, color, icon
  - `bookmarks`: analytics, reminders, archiving, 
################ Drone-Intelligence-System
# 🚁 Drone Intelligence System — India Knowledge Hub

<div align="center">

![Drone Intelligence](https://img.shields.io/badge/Drone-Intelligence-6366f1?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-FF6F00?style=for-the-badge)

**A full-stack AI-powered platform for drone regulations, analytics, ROI calculations, and intelligent insights — built specifically for the Indian drone ecosystem.**

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Architecture Diagram](#-architecture-diagram)
- [System Workflow](#-system-workflow)
- [Tech Stack & Libraries](#-tech-stack--libraries)
- [Project Structure](#-project-structure)
- [Backend — FastAPI](#-backend--fastapi)
- [Frontend — React Dashboard](#-frontend--react-dashboard)
- [RAG Pipeline](#-rag-pipeline-retrieval-augmented-generation)
- [WebSocket — Real-Time Updates](#-websocket--real-time-updates)
- [MCP Server — Claude Desktop Integration](#-mcp-server--claude-desktop-integration)
- [Data Layer](#-data-layer)
- [API Endpoints Reference](#-api-endpoints-reference)
- [How Everything Connects](#-how-everything-connects)
- [Docker Deployment](#-docker-deployment)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)

---

## 🔭 Overview

**Drone Intelligence System** is a comprehensive full-stack application that serves as India's premier drone knowledge hub. It combines:

- **AI-Powered Chat** — Ask questions about Indian drone rules, use cases, and technical specs using a RAG (Retrieval-Augmented Generation) pipeline backed by Google Gemini AI and a ChromaDB vector database
- **Drone Database** — Browse and search a database of drones with technical specifications
- **Compliance Checker** — Verify if a drone flight is compliant with Indian DGCA regulations
- **Flight Time Calculator** — Estimate flight duration and range based on battery, weight, and weather
- **ROI Calculator** — Calculate return on investment for drone operations with break-even
################ Human_Brain_Tumor_Detection
# 🧠 Human Brain Tumour Detection using Deep Learning

This project focuses on detecting brain tumours from MRI images using Deep Learning techniques and deploying the model through a web-based application.

## 📌 Project Overview
Human Brain Tumour Detection is a healthcare-focused AI project that uses a Convolutional Neural Network (CNN) to classify MRI images as tumour or non-tumour. The system provides accurate predictions through an easy-to-use web interface.

## 🚀 Features
- MRI image upload and prediction
- CNN-based deep learning model
- High accuracy and optimized performance
- Web-based interface for real-time results
- End-to-end AI model deployment

## 🧠 Model Details
- Algorithm: Convolutional Neural Network (CNN)
- Dataset: 12,000+ MRI images
- Accuracy: ~97%
- Techniques used:
  - Data preprocessing
  - Image augmentation
  - Hyperparameter tuning

## 🛠️ Tech Stack
- **Programming Language:** Python
- **Deep Learning:** TensorFlow, Keras
- **Backend:** Flask
- **Frontend:** HTML, CSS, JavaScript
- **Tools:** VS Code, Git, GitHub

## ⚙️ How It Works
1. User uploads an MRI image
2. Image is preprocessed and resized
3. CNN model analyzes the image
4. System predicts presence of brain tumour
5. Result is displayed on the web interface

## ▶️ How to Run the Project
```bash
# Clone the repository
git clone https://github.com/your-username/your-repo-name.git

# Navigate to project directory
cd your-repo-name

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py



################ Custom-MCP-Server
# Custom MCP Server & Auto Job Application Agent

An end-to-end intelligent job application and automation system integrating the Model Context Protocol (MCP), Playwright browser automation, Google Sheets / Drive sync, Overleaf LaTeX compilation, and intelligent resume tailoring.

## 🚀 Key Components

1. **LinkedIn MCP Integration**: Custom Model Context Protocol server for querying LinkedIn jobs, scraping job details, and extracting requirements.
2. **Auto Job Application Agent (`AUTO-JOB-AGENT`)**:
   - **Job Discovery & Matching**: Technical JD parsing, skill overlap evaluation, and hard eligibility gating.
   - **Dynamic Resume Tailoring**: Generates targeted LaTeX resumes matching candidate profiles to JD requirements and compiles via Overleaf/pdflatex.
   - **Google Sheets & Drive Integration**: Real-time bidirectional tracking of jobs, application records, resume versions, and audit logs.
   - **Multi-Portal Form Automation**: Intelligent form detection, question mapping from profile repositories, resume attachment, and safe review-only pre-submission validation.
   - **Candidate Authentication Detection**: Graceful handling and audit logging of ATS login/SSO walls (`CANDIDATE_AUTH_REQUIRED`).

## 📁 Repository Structure

```text
Custom MCP Server/
├── AUTO-JOB-AGENT/
│   ├── agent/                 # Core orchestrator and execution agents
│   ├── Application_Questions/ # Question banks (Personal, Education, Work Auth, Experience)
│   ├── Applications/          # Application records and audit logs
│   ├── config/                # Service configurations & credentials templates
│   ├── Data_Resume/           # Candidate profile data and resume templates
│   ├── integrations/          # Google Sheets, Drive, LinkedIn, Overleaf integrations
│   ├── mcp-servers/           # Model Context Protocol server implementations
│   ├── scripts/               # Audit, test, and verification automation scripts
│   ├── src/                   # Core TypeScript pipeline implementations
│   ├── tools/                 # Browser, file, and API tools
│   ├── types/                 # TypeScript interfaces and schema definitions
│   └── SETUP.md               # Detailed setup and environment configuration
├── .gitignore                 # Root gitignore protecting credentials and secrets
└── README.md                  # Project overview and documentation
```

################ LifeVault-AI
# LifeVault

> **Your life. Organized.**
>
> You enter it once. LifeVault remembers it for you.

---

## What is LifeVault?

LifeVault is a personal life organization and memory system for Android and iOS. It helps you store, understand, and act on your most important personal information — documents, receipts, expenses, payments, vehicles, assets, warranties, insurance, and more.

Unlike a document storage app, LifeVault **understands** your information, creates smart reminders, provides AI-powered search, and puts you back in control of the details that matter.

Your data lives in your own Google Drive and Google Sheets — LifeVault never stores your files on third-party servers.

---

## Screenshots

> Phase 1 — UI Foundation (Demo Data)

| Splash | Login | Today |
|--------|-------|-------|
| *Coming* | *Coming* | *Coming* |

| Vault | Money | Profile |
|-------|-------|---------|
| *Coming* | *Coming* | *Coming* |

---

## Features (Phase 1 — UI Foundation)

- ✅ Premium white/light design system
- ✅ LifeVault logomark and branding
- ✅ Splash screen with animation
- ✅ Login screen (mock — Phase 1 only)
- ✅ Today dashboard with spending, alerts, and recent items
- ✅ Vault screen with categories and search
- ✅ Money screen with expenses, payments, and analytics
- ✅ Profile screen with settings
- ✅ Add menu (bottom sheet with 8 add options)
- ✅ AI assistant (mock responses — Phase 1)
- ✅ Reminders screen
- ✅ Vehicles screen with status pills
- ✅ Assets screen
- ✅ Bottom navigation with FAB
- ✅ Mock data (clearly separated)
- ✅ Complete TypeScript type system

---

## Architecture

```
LifeVault/
├── mobile/                  React Native app (Android + iOS)
│   ├── android/             Android native project
│   ├── ios/                 iOS native project
│   ├── src/
│   │   ├── components/      Reusable UI components
│   │   ├── screens/         All application screens
│   │   │   ├── Splash/
│   │   │   ├── Login/
│   │   │   ├── Today/
│   │   │   ├── Vault/
│   │   │   ├── Money/
│   │   │   ├── Profile/
│   │   │   ├── AI/
│   │   │   ├── AddMenu/
│   │   │   ├── Reminders/
│   │   │   ├── Vehicles/
│   │   │   └── Assets/
│   │   ├── navigation/      Navigation and tab bar
│   │   ├── theme/           Design 
################ Livora
<p align="center">
  <img src=".github/livora-banner.svg" alt="LIVORA — From problem to working software." width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-0D0D0C?style=for-the-badge&logo=react&logoColor=C8F53B" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-0D0D0C?style=for-the-badge&logo=vite&logoColor=C8F53B" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Framer_Motion-13-0D0D0C?style=for-the-badge&logo=framer&logoColor=C8F53B" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/License-Proprietary-C8F53B?style=for-the-badge&labelColor=0D0D0C" alt="Proprietary License" />
</p>

<p align="center">
  <b>The website for LIVORA</b>, a studio that builds custom web apps, Android apps,<br/>
  internal business software and digital brand experiences.
</p>

---

## ✦ The idea

Most businesses run on a patchwork of spreadsheets, WhatsApp threads and tools that almost fit.
LIVORA builds the software that actually fits — and this site is meant to *show* that, not just say it.

The hero doesn't sit still: a mock business system **builds itself in front of you**, stage by stage —
architecture → database → API → frontend → dashboard → mobile → cloud → production — then loops.
Every section after that follows the same rule: **motion that explains something.**

## ✦ What's inside

| Section | What it does |
|---|---|
| **Intro** | The handwritten LIVORA logo writes itself stroke by stroke, then lifts away |
| **Hero** | A live "system assembling itself" dashboard with customers, branches, approvals and reports |
| **Orbit & Connected Systems** | How scattered tools collapse into one integrated LIVORA system |
| **Automation** | A live feed of the system reacting to events: low stock → draft PO → approval → supplier → monthly report |
| **Services** | Web, Android, internal apps, marketing, social, ATS resumes, brand design, academic projects |
| **Before / After** | A side-by-side comparison of the old way vs. the custom-built way |
| **Why LIVORA** | Four cards with live mini-screens: workflow fit, modular grid, scaling chart, connected tools |
| **Process** | A self-running project timeline: phase rail, "in progress" card, deliverables lighting up |
| **Try Before You Commit** | Prototype → staging build on desktop and phone → sign-off |
| **Portfolio** | A project index beside a 3D-tilting stage with an animated scene for each project |
| **Techno
################ BookMyVenue
<div align="center">

<img src="src/assets/BMV.png" alt="BookMyVenue logo" width="120" />

# BookMyVenue

### 💍 Find it. 📅 Lock the date. 🎉 Celebrate.

**A full-stack venue booking platform for weddings, parties, corporate events and birthdays across India.**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-D63AFF?logo=jsonwebtokens&logoColor=white)
![Tests](https://img.shields.io/badge/tests-20%20passing-2e9e5e)
[![Live demo](https://img.shields.io/badge/demo-live%20now-C9952A?logo=githubpages&logoColor=white)](https://prajwalps2603.github.io/BookMyVenue/)

<a href="https://prajwalps2603.github.io/BookMyVenue/"><img src="https://img.shields.io/badge/%F0%9F%8C%90%20OPEN%20THE%20LIVE%20SITE-8B1A2E?style=for-the-badge" alt="Open the live site" /></a>

**https://prajwalps2603.github.io/BookMyVenue/**

*No install, no sign-up: tap **⚡ Continue with Demo Account** and start booking.*

</div>

---

## ✨ The idea

Planning an event usually means a dozen phone calls, a spreadsheet, and the fear that someone else grabbed your date.
**BookMyVenue** puts it all in one place: browse venues, see exactly which dates are free, pay an advance,
and get a ticket, with the server making sure **no two people can ever book the same day**.

## 🌐 Live demo vs. full version

👉 **Live demo: https://prajwalps2603.github.io/BookMyVenue/**

| | **Live demo** (GitHub Pages) | **Full version** (`npm run dev`) |
|---|---|---|
| Backend | A mini API that runs **in your browser** | Real Express server + JWT + bcrypt |
| Data | Saved in *your* browser only, private to you | Saved in `server/data/db.json`, shared by everyone |
| Why | GitHub Pages can only host static files | What you'd deploy for real use |

Every feature works in both. The live demo is rebuilt automatically from `main` by GitHub Actions on every push.

## 🚀 Quick start

```bash
git clone https://github.com/Prajwalps2603/BookMyVenue.git
cd BookMyVenue
npm install
npm run dev        # API on :5000 + web app on :5173, started together
```

Prefer not to install anything? Use the [live site](https://prajwalps2603.github.io/BookMyVenue/). Otherwise open **http://localhost:5173** and click **⚡ Continue with Demo Account** on the sign-in page.

| Who         | How
################ smart-ambulance-traffic-clearance
# Smart Ambulance Traffic Clearance System (Prototype)

A full-stack prototype to demonstrate:
- Ambulance mission orchestration
- Real-time lane clearance alerts via roadside Smart Poles (MQTT)
- Traffic light preemption along ambulance route
- Control Center via logs and Socket.IO events
- Mobile App (Flutter) to start a mission and stream live location

This prototype is built to be locally runnable and IoT-friendly with minimal setup.

## Architecture

- Mobile App (Flutter)
  - Start mission by entering destination (hospital)
  - Streams ambulance GPS location to backend
- Backend (Node.js, Express, Socket.IO, MQTT)
  - Manages missions (start, live updates, completion)
  - Computes naive ETA or calls Google Directions (optional)
  - Publishes alerts for Smart Poles (MQTT)
  - Publishes traffic light commands (MQTT)
  - Emits real-time events to Control Center (Socket.IO)
- IoT Firmware (ESP32, Arduino framework)
  - Smart Pole: listens for alert topics and plays audio + shows LED direction
  - Traffic Light: listens for traffic commands and changes LED states via relays or pins
- Infra (Docker)
  - Eclipse Mosquitto for MQTT broker
  - Backend service

## MQTT Topics (Prototype)

- Alerts to smart poles
  - `alerts/all`
  - Payload example:
    ```json
    {
      "type": "AMBULANCE_ALERT",
      "missionId": "abc-123",
      "etaSeconds": 240,
      "distanceMeters": 1500,
      "direction": "STRAIGHT",
      "message": "Ambulance approaching, clear one lane",
      "timestamp": 1710000000
    }
    ```

- Traffic light commands
  - `traffic/all/command`
  - Payload example:
    ```json
    {
      "type": "SET_PHASE",
      "missionId": "abc-123",
      "phase": "AMBULANCE_PREEMPTION",
      "durationSeconds": 60,
      "timestamp": 1710000000
    }
    ```

## Quick Start

1) Prerequisites
- Docker and Docker Compose
- Node.js 20+ (if running backend without Docker)
- Flutter 3.x (for mobile app)
- An ESP32 board (optional for firmware test) or use Serial Monitor for logs

2) Start Infra (MQTT + Backend)
- Copy `apps/backend/.env.example` to `apps/backend/.env` and review
- Run:
  ```bash
  docker compose -f infra/docker-compose.yml up --build
  ```
- Backend will be available at `http://localhost:8080`
- Socket.IO endpoint: `ws://localhost:8080`

3) Test Backend
- Start a mission:
  ```bash
  curl -X POST http://localhost:8080/api/v1/missions/start \
    -H "Content-Type: application/json" \
    -d '{
      "vehicleId":"AMB-001",
      "origin":{
################ Prajwalps2603
<div align="center">
<img src="https://raw.githubusercontent.com/devSouvik/devSouvik/master/gif3.gif" width="400"/>
</div>
<h1 align="center">Hi 👋, I'm Prajwal M P</h1>
<h3 align="center">A Passionate FullStack Developer from INDIA</h3>
<br

# 💫 About Me:
Hi, I'm Prajwal M P 👋<br>Java Full Stack Developer | MERN Stack Developer | DevOps & Cloud Enthusiast | AI Application Developer<br><br>I'm a Full Stack Developer focused on building practical, scalable, and real-world applications across the Java Full Stack, MERN Stack, AI, Cloud, and DevOps ecosystems.<br><br>I enjoy turning ideas into complete applications — from designing responsive frontend interfaces and developing backend APIs to integrating databases, implementing business logic, deploying applications, and continuously improving them.<br><br>My development journey includes hands-on experience with Java, Spring, React, Next.js, JavaScript, MongoDB, MySQL, PostgreSQL, REST APIs, Python, AI/RAG applications, Docker, Git/GitHub, and AWS.


## 🌐 Socials:
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/prajwal-m-p-190131246/)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/prajwal_shobha/)
[![X](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/PrajwalNair2603)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Prajwalps2603)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:prajwalnair2603@gmail.com)

# 💻 Tech Stack:
![C++](https://img.shields.io/badge/c++-%2300599C.svg?style=for-the-badge&logo=c%2B%2B&logoColor=white) ![C](https://img.shields.io/badge/c-%2300599C.svg?style=for-the-badge&logo=c&logoColor=white) ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white) ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![PowerShell](https://img.shields.io/badge/PowerShell-%235391FE.svg?style=for-the-badge&logo
Live BookMyVenue demo and Credly badge links are confirmed for the portfolio. Next I'll check how the current site is built and deployed so the new one can replace it at the same URL.
Bash Inspect existing Portfolio repo structure
IN
curl -s "https://api.github.com/repos/Prajwalps2603/Portfolio/contents/" | python -c "
import json,sys
for f in json.load(sys.stdin): print(f['type'], f['path'])
"; echo "=== package.json"; curl -s -H "Accept: application/vnd.github.raw" "https://api.github.com/repos/Prajwalps2603/Portfolio/contents/package.json" | head -60; echo "=== workflows"; curl -s "https://api.github.com/repos/Prajwalps2603/Portfolio/contents/.github/workflows" | python -c "
import json,sys
d=json.load(sys.stdin)
print([f['path'] for f in d] if isinstance(d,list) else d)
"

OUT
dir .github
file .gitignore
file README.md
dir app
dir components
dir data
file next.config.mjs
file package-lock.json
file package.json
file postcss.config.mjs
dir public
dir scripts
file tailwind.config.ts
file tsconfig.json
=== package.json
{
  "name": "prajwal-portfolio",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "predev": "node scripts/clean.js",
    "dev": "next dev",
    "clean": "node scripts/clean.js",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "framer-motion": "^11.18.2",
    "lucide-react": "^0.475.0",
    "next": "14.2.24",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.17.19",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3"
  }
}
=== workflows
['.github/workflows/deploy.yml']
Bash Fetch the live existing portfolio HTML
IN
curl -s https://prajwalps2603.github.io/Portfolio/ | head -c 3000; echo; echo "=== tel/phone mentions in built site:"; curl -s https://prajwalps2603.github.io/Portfolio/ | grep -o -i "8618176469\|tel:[^\"]*" | head

OUT
<!DOCTYPE html><html lang="en" class="dark scroll-smooth"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5"/><link rel="stylesheet" href="/Portfolio/_next/static/css/c0a25d32b368e4a8.css" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" href="/Portfolio/_next/static/chunks/webpack-286dbcf975c18cc8.js"/><script src="/Portfolio/_next/static/chunks/fd9d1056-6922f449a204c2cc.js" async=""></script><script src="/Portfolio/_next/static/chunks/117-42fc3316906f3603.js" async=""></script><script src="/Portfolio/_next/static/chunks/main-app-064ac55087f8ad6a.js" async=""></script><script src="/Portfolio/_next/static/chunks/521-c9d07babe2be263b.js" async=""></script><script src="/Portfolio/_next/static/chunks/285-4180f819800d0d08.js" async=""></script><script src="/Portfolio/_next/static/chunks/app/page-f0cad0ee4e817e63.js" async=""></script><script src="/Portfolio/_next/static/chunks/app/layout-154facb6a6c8bcac.js" async=""></script><script src="/Portfolio/_next/static/chunks/app/error-1bddb2cacc65ff77.js" async=""></script><script src="/Portfolio/_next/static/chunks/972-6e3fab445c034059.js" async=""></script><script src="/Portfolio/_next/static/chunks/app/not-found-1fc905e207f4de3d.js" async=""></script><title>Prajwal M P | Java Full Stack Developer</title><meta name="description" content="Personal developer portfolio of Prajwal M P — Java Full Stack Developer based in Bengaluru, India. Building scalable web applications, Spring Boot enterprise systems, and AI-powered products."/><meta name="author" content="Prajwal M P"/><meta name="keywords" content="Prajwal M P,Java Full Stack Developer,Spring Boot Developer,Next.js Developer,React Developer,Bengaluru Software Engineer,AI Developer,CNN Brain Tumor Detection,Drone Intelligence System"/><meta name="creator" content="Prajwal M P"/><meta property="og:title" content="Prajwal M P | Java Full Stack &amp; AI Developer"/><meta property="og:description" content="Full Stack Developer building scalable web applications, Spring Boot microservices, and AI-powered systems."/><meta property="og:url" content="https://prajwalps2603.github.io/Portfolio/"/><meta property="og:site_name" content="Prajwal M P Portfolio"/><meta property="og:locale" content="en_US"/><meta property="og:image" content="https://prajwalps2603.github.io/Portfolio/og-image.png"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="Prajwal M P — Java Full Stack &amp; AI Developer Portfolio"/><meta property="og:type" content="website"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="Prajwal M P | Java Full Stack &amp; AI Developer"/><meta name="twitter:description" content="Full Stack Developer building scalable web applications, Spring Boot microservices, and AI-powered systems."/><meta name="twitter:image" content="https://prajwalps2
=== tel/phone mentions in built site:
The current site is a Next.js static export on GitHub Pages under /Portfolio/, and I'm keeping the phone number off it. I'm checking its deploy config and public assets next so the new build fits in.
Bash Read existing deploy config and asset list
IN
echo "=== next.config.mjs"; curl -s -H "Accept: application/vnd.github.raw" "https://api.github.com/repos/Prajwalps2603/Portfolio/contents/next.config.mjs"; echo; echo "=== deploy.yml"; curl -s -H "Accept: application/vnd.github.raw" "https://api.github.com/repos/Prajwalps2603/Portfolio/contents/.github/workflows/deploy.yml"; echo; echo "=== public/"; curl -s "https://api.github.com/repos/Prajwalps2603/Portfolio/contents/public" | python -c "
import json,sys
for f in json.load(sys.stdin): print(f['type'], f['path'], f.get('size'))
"; echo "=== data/"; curl -s "https://api.github.com/repos/Prajwalps2603/Portfolio/contents/data" | python -c "
import json,sys
for f in json.load(sys.stdin): print(f['type'], f['path'], f.get('size'))
"

OUT
=== next.config.mjs
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

=== deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Setup Pages
        uses: actions/configure-pages@v5
        with:
          static_site_generator: next

      - name: Install dependencies
        run: npm ci

      - name: Build Static Export
        env:
          NEXT_PUBLIC_BASE_PATH: /Portfolio
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

=== public/
file public/.nojekyll 34
dir public/images 0
file public/og-image.png 669781
file public/resume.pdf 714
=== data/
file data/certifications.ts 2602
file data/education.ts 1684
file data/experience.ts 5977
file data/profile.ts 2058
file data/projects.ts 6505
file data/skills.ts 4400
search my githuib linkden more detaisl u might get
10:56 AM
On it — I'll dig through your GitHub thoroughly (your old portfolio's data files are a goldmine of curated details) and try LinkedIn too.



Bash Fetch old portfolio's curated data files
IN
for f in profile experience projects certifications skills education; do echo "################ data/$f.ts"; curl -s -H "Accept: application/vnd.github.raw" "https://api.github.com/repos/Prajwalps2603/Portfolio/contents/data/$f.ts"; echo; done

OUT
################ data/profile.ts
export interface Profile {
  name: string;
  title: string;
  tagline: string;
  bio: string[];
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  instagram: string;
  whatsapp: string;
  portfolioUrl: string;
  resumeUrl: string;
  status: {
    available: boolean;
    currentFocus: string[];
    ratings: {
      frontend: string;
      backend: string;
      database: string;
      ai: string;
    };
  };
}

export const profileData: Profile = {
  name: "Prajwal M P",
  title: "Java Full Stack Developer",
  tagline: "I build scalable web applications, AI-powered systems, and digital products.",
  bio: [
    "Full Stack Developer with hands-on experience building end-to-end production applications using JavaScript, React, Next.js, MongoDB, and REST APIs.",
    "Experienced across modern frontend architecture, backend business logic, database integration, testing, deployment, and automation workflows.",
    "Possesses a strong engineering foundation in Java 21, Spring Boot, PostgreSQL, and AI application engineering (CNNs, RAG pipelines, Gemini AI), with an unwavering focus on clean, maintainable, and scalable solutions."
  ],
  email: "prajwalnair2603@gmail.com",
  phone: "+91 8618176469",
  location: "Bengaluru, Karnataka, India",
  linkedin: "https://www.linkedin.com/in/prajwal-m-p-190131246",
  github: "https://github.com/Prajwalps2603",
  instagram: "https://www.instagram.com/prajwal_shobha?stkn=ZTRqbTR3MDB5YW8y",
  whatsapp: "https://wa.me/918618176469?text=Hi%20Prajwal,%20I%20saw%20your%20portfolio%20and%20would%20like%20to%20connect!",
  portfolioUrl: "https://prajwalps2603.github.io/Portfolio/",
  resumeUrl: "https://drive.google.com/file/d/1Q2PdoT5zwjvTVzYTgNlgHAexpmRiYH3k/view?usp=sharing",
  status: {
    available: true,
    currentFocus: ["Full Stack Development", "AI-Powered Systems", "Spring Boot & Cloud"],
    ratings: {
      frontend: "PRODUCTION READY",
      backend: "ENTERPRISE GRADE",
      database: "OPTIMIZED",
      ai: "RAG & DEEP LEARNING"
    }
  }
};

################ data/experience.ts
export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location?: string;
  period: string;
  type: "Full-Time" | "Internship" | "Training";
  current?: boolean;
  description: string;
  highlights: string[];
  skills: string[];
}

export const experienceData: ExperienceItem[] = [
  {
    id: "maruti-flex",
    role: "Frontend Developer",
    company: "Maruti Flex Traders LLP",
    period: "December 2025 – Present",
    type: "Full-Time",
    current: true,
    description: "Developing and maintaining end-to-end production applications powering TVS showroom and Maruti Flex commercial operations.",
    highlights: [
      "Engineered end-to-end production applications for TVS showroom & Maruti Flex operations using JavaScript, React/Next.js, Google Apps Script, Google Sheets, and MongoDB.",
      "Built high-performance, responsive user interfaces and seamlessly integrated client-side components with backend microservices, REST APIs, and live data workflows.",
      "Architected backend business logic and operational automation scripts using Google Apps Script, drastically reducing manual processing overhead."
    ],
    skills: ["React", "Next.js", "JavaScript", "MongoDB", "Google Apps Script", "REST APIs", "Google Sheets API", "Automation"]
  },
  {
    id: "dyashin-technosoft",
    role: "Java Full Stack Developer Intern",
    company: "Dyashin Technosoft",
    location: "Bengaluru, Karnataka, India · On-site",
    period: "Feb 2025 – Oct 2025 · 9 mos",
    type: "Internship",
    description: "Developed and maintained full-stack web applications using Java, Spring Boot, React, and MySQL. Built RESTful APIs and integrated frontend applications with backend services.",
    highlights: [
      "Developed and maintained full-stack web applications using Java, Spring Boot, React, and MySQL.",
      "Built high-performance RESTful APIs and integrated frontend applications seamlessly with backend microservices.",
      "Collaborated in an Agile development environment utilizing Git version control, pull requests, and peer code reviews."
    ],
    skills: ["Java Full Stack", "Spring Boot", "React", "MySQL", "REST APIs", "Git", "Front-End Development"]
  },
  {
    id: "rooman-technologies",
    role: "Machine Learning Intern",
    company: "Rooman Technologies",
    location: "Dakshina Kannada, Karnataka, India · Hybrid",
    period: "Sep 2024 – May 2025 · 9 mos",
    type: "Internship",
    description: "Completed a Machine Learning Internship with hands-on exposure to AI and ML concepts, data analysis, and model development. Worked with Python and machine learning libraries to build and evaluate predictive models.",
    highlights: [
      "Completed a Machine Learning Internship with hands-on exposure to AI and ML concepts, data analysis, and model development.",
      "Worked with Python and machine learning libraries to build, evaluate, and fine-tune predictive models.",
      "Performed exploratory data analysis (EDA), data preprocessing, and model evaluation metrics."
    ],
    skills: ["Machine Learning", "Python", "Data Analysis", "Model Development", "AI Systems", "Predictive Modeling"]
  },
  {
    id: "tbh-cloud-cybersecurity",
    role: "Cloud and Cybersecurity Intern",
    company: "TBH (Techbyheart)",
    location: "Sullia, Karnataka, India · On-site",
    period: "Oct 2023 – Nov 2023 · 2 mos",
    type: "Internship",
    description: "Participated in an educational internship focused on Cloud Computing and Cybersecurity, gaining hands-on exposure to AWS services and security concepts.",
    highlights: [
      "Participated in an educational internship focused on Cloud Computing and Cybersecurity, gaining hands-on exposure to AWS services and security concepts.",
      "Configured and managed AWS cloud infrastructure including Amazon Elastic Compute Cloud (EC2) instances.",
      "Studied core cybersecurity principles, perimeter defenses, secure transport layers, and cloud access controls."
    ],
    skills: ["Amazon Web Services (AWS)", "Amazon EC2", "Cybersecurity", "Cloud Computing", "Network Security", "Security Concepts"]
  }
];

export interface JourneyMilestone {
  year: string;
  title: string;
  category: string;
  description: string;
}

export const journeyData: JourneyMilestone[] = [
  {
    year: "2021",
    title: "Engineering Journey Commenced",
    category: "Foundation",
    description: "Enrolled in BE in Electronics & Communication Engineering at KVGCE Sullia, building strong fundamentals in software, signals, and computing systems."
  },
  {
    year: "2023",
    title: "Cloud & Cybersecurity Internship",
    category: "Specialization",
    description: "Completed intensive educational internship at TBH (Techbyheart), gaining hands-on exposure to AWS cloud architecture and cybersecurity defense."
  },
  {
    year: "2024 – 2025",
    title: "Machine Learning Internship",
    category: "AI & ML",
    description: "Completed a 9-month Machine Learning internship at Rooman Technologies, building predictive models, data pipelines, and AI systems."
  },
  {
    year: "2025",
    title: "Java Full Stack Developer Internship & BE 1st Place",
    category: "Professional Milestone",
    description: "Completed a rigorous 9-month Java Full Stack internship at Dyashin Technosoft; won 1st Place for Final Year Project (Human Brain Tumor Detection CNN)."
  },
  {
    year: "2025 – Present",
    title: "Production Frontend Developer",
    category: "Current Role",
    description: "Frontend Developer at Maruti Flex Traders LLP, engineering real-world production web systems, business automations, and MongoDB data workflows."
  },
  {
    year: "2026",
    title: "Agentic AI & Advanced Full Stack",
    category: "Continuing Expansion",
    description: "Earned Oracle Agentic AI Certified Foundations Associate; architecting next-generation enterprise RAG platforms and intelligent applications."
  }
];

################ data/projects.ts
export interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  featured: boolean;
  accuracyOrMetric?: string;
  summary: string;
  problem: string;
  solution: string;
  architecture: string[];
  keyFeatures: string[];
  contributions: string[];
  technologies: string[];
  githubUrl: string;
  demoUrl?: string;
  demoLabel?: string;
  award?: string;
  imageUrl?: string;
}

export const projectsData: Project[] = [
  {
    id: "brain-tumor-detection",
    title: "Human Brain Tumor Detection using Deep Learning & Web Development",
    subtitle: "Medical imaging classification powered by Convolutional Neural Networks and full-stack web integration",
    category: "AI / Deep Learning & Web",
    featured: true,
    accuracyOrMetric: "97% Prediction Accuracy",
    award: "1st Place — BE Final Year Project (2025)",
    summary: "A medical deep learning system that analyzes MRI scans to detect and classify human brain tumors with 97% accuracy, integrated into an intuitive web interface for healthcare-oriented workflow assistance.",
    problem: "Manual identification and classification of brain tumors from MRI scans requires intensive radiology expertise and time. Clinicians benefit from rapid, high-accuracy decision-support tools to streamline initial screening and prioritize critical scans.",
    solution: "Trained a robust Convolutional Neural Network (CNN) architecture across an extensive dataset of 12,000+ MRI images, achieving a 97% validation accuracy. Paired the deep learning engine with a Flask REST backend and responsive React frontend allowing instant scan upload, validation, and real-time visualization of classification inference.",
    architecture: [
      "Convolutional Neural Network (CNN) with customized convolution, pooling, and dropout layers",
      "Image augmentation, normalization, and pre-processing pipeline for diverse scan resolutions",
      "Flask REST API microservice serving low-latency inference endpoints",
      "Interactive React interface with drag-and-drop MRI upload and visual diagnosis report generation"
    ],
    keyFeatures: [
      "97% classification accuracy across benign, malignant, and healthy tissue categories",
      "Trained on a comprehensive dataset of 12,000+ curated brain MRI scans",
      "Instant real-time classification results upon MRI file upload",
      "End-to-end decoupled architecture connecting React UI to Python/Flask ML runtime",
      "Comprehensive evaluation workflows measuring precision, recall, and loss convergence"
    ],
    contributions: [
      "Built and tuned the CNN model using TensorFlow and Keras",
      "Engineered image preprocessing and data augmentation pipelines to prevent overfitting",
      "Constructed the Flask inference server and integrated RESTful endpoints with the frontend",
      "Designed the responsive React client for seamless user scan submissions"
    ],
    technologies: ["Python", "TensorFlow", "Keras", "Flask", "React", "OpenCV", "NumPy"],
    githubUrl: "https://github.com/Prajwalps2603/Human_Brain_Tumor_Detection.git",
    demoUrl: "https://github.com/Prajwalps2603/Human_Brain_Tumor_Detection#readme",
    demoLabel: "Architecture & Demo",
    imageUrl: "/images/projects/brain-tumor-detection.jpg"
  },
  {
    id: "drone-intelligence-system",
    title: "Drone Intelligence System — AI-Powered Knowledge Platform",
    subtitle: "Enterprise RAG platform for Indian drone regulations, compliance checking, and operational telemetry",
    category: "AI / Full Stack & RAG",
    featured: true,
    accuracyOrMetric: "Gemini AI + Vector RAG Engine",
    summary: "An enterprise-grade, full-stack drone platform providing real-time Indian drone regulation intelligence, RAG-powered document question-answering, regulatory compliance verification, and operational flight-time/ROI analytics.",
    problem: "Navigating complex and evolving Indian drone aviation regulations (DGCA guidelines, airspace zones, pilot licensing, and flight permissions) is tedious and error-prone for commercial drone operators, logistics teams, and agricultural drone pilots.",
    solution: "Engineered an intelligent Retrieval-Augmented Generation (RAG) platform combining Google Gemini AI with ChromaDB and Sentence Transformers. Features automated vector indexing for official policy documentation, live semantic search, automated compliance verification, and mission planning calculators.",
    architecture: [
      "Retrieval-Augmented Generation (RAG) engine using Sentence Transformers for dense text embeddings",
      "ChromaDB persistent vector store for high-speed similarity search across regulation documents",
      "Google Gemini AI orchestration delivering accurate, context-grounded legal and technical guidance",
      "FastAPI asynchronous backend with WebSocket support for real-time streaming dialogue",
      "Dockerized deployment pipeline ensuring deterministic runtime environments"
    ],
    keyFeatures: [
      "Context-grounded RAG chatbot answering nuanced queries on Indian drone airspace & DGCA rules",
      "Document upload and vector indexing pipeline enabling custom knowledge base expansion",
      "Interactive Drone Compliance Checker validating flight authorization requirements",
      "Aviation Flight-Time Calculator factoring payload, battery capacity, and atmospheric metrics",
      "Commercial Drone ROI Calculator helping operations teams model capital expenditure versus efficiency",
      "Real-time WebSocket streaming for interactive AI responses"
    ],
    contributions: [
      "Designed and implemented the full-stack system architecture using React.js and FastAPI",
      "Constructed the vector indexing and retrieval pipeline with ChromaDB and Sentence Transformers",
      "Integrated Google Gemini AI for zero-hallucination, document-grounded policy explanations",
      "Implemented RESTful endpoints for flight-time calculations, compliance criteria, and ROI metrics",
      "Containerized microservices using Docker for standardized multi-environment deployment"
    ],
    technologies: ["React.js", "FastAPI", "Python", "ChromaDB", "Google Gemini AI", "Sentence Transformers", "Docker", "WebSockets"],
    githubUrl: "https://github.com/Prajwalps2603/Drone-Intelligence-System.git",
    demoUrl: "https://github.com/Prajwalps2603/Drone-Intelligence-System#readme",
    demoLabel: "Live RAG Telemetry",
    imageUrl: "/images/projects/drone-intelligence.jpg"
  }
];

################ data/certifications.ts
export interface Certification {
  id: string;
  title: string;
  issuer: string;
  year: string;
  credentialUrl?: string;
  badgeText: string;
  category: "Certification" | "Award";
  description: string;
  skills: string[];
}

export const certificationsData: Certification[] = [
  {
    id: "oracle-agentic-ai",
    title: "Oracle Certified Foundations Associate — Agentic AI",
    issuer: "Oracle University",
    year: "2026",
    credentialUrl: "https://catalog-education.oracle.com/ords/certview/sharebadge?id=9AAAC1F3B6368ADE76D13A16495BA0C0748267A7AC0DFD9677FB8A639833CC61",
    badgeText: "Oracle Verified",
    category: "Certification",
    description: "Official Oracle credentials demonstrating foundational mastery of Agentic AI, autonomous reasoning architectures, LLM orchestration, and intelligent system workflows.",
    skills: ["Agentic AI", "Autonomous Agents", "LLM Workflows", "Oracle Cloud"]
  },
  {
    id: "github-foundations",
    title: "GitHub Foundations Certificate",
    issuer: "GitHub / Credly",
    year: "2025",
    credentialUrl: "https://www.credly.com/badges/a810b47b-11af-4dad-88f9-7ea37720f30d/linked_in_profile",
    badgeText: "Credly Verified",
    category: "Certification",
    description: "Validated proficiency in Git version control, collaborative development, GitHub workflows, repository governance, CI/CD actions, and project management.",
    skills: ["Git", "GitHub", "GitHub Actions", "CI/CD", "Collaboration"]
  },
  {
    id: "dyashin-java-fullstack",
    title: "Java Full Stack Development Professional",
    issuer: "Dyashin TechnoSoft Pvt Ltd",
    year: "October 2025",
    credentialUrl: "https://drive.google.com/file/d/1jAL0CwQWRCJq0UhWTULsLI8yptZkW8EW/view?usp=sharing",
    badgeText: "Industry Verified",
    category: "Certification",
    description: "Extensive certification awarded upon successful completion of 9-month professional internship spanning Core Java 21, Spring Boot, Hibernate, REST APIs, and database engineering.",
    skills: ["Core Java", "Spring Boot", "Hibernate", "PostgreSQL", "REST APIs"]
  },
  {
    id: "be-final-year-1st-place",
    title: "1st Place — BE Final Year Project Award",
    issuer: "KVG College of Engineering",
    year: "2025",
    badgeText: "1st Place Winner",
    category: "Award",
    description: "Awarded First Place among engineering cohort for developing the end-to-end Human Brain Tumor Detection system combining CNN deep learning (97% accuracy) and web deployment.",
    skills: ["Convolutional Neural Networks", "TensorFlow", "React", "Flask", "Healthcare AI"]
  }
];

################ data/skills.ts
export interface SkillCategory {
  category: string;
  description: string;
  skills: {
    name: string;
    level?: string;
    badge?: string;
  }[];
}

export const skillsData: SkillCategory[] = [
  {
    category: "Languages",
    description: "Core programming and markup languages used for frontend, backend, and scripting.",
    skills: [
      { name: "Java 21", badge: "Primary" },
      { name: "JavaScript", badge: "Production" },
      { name: "Python (Basics)", badge: "AI & Scripting" },
      { name: "SQL", badge: "Query & Schemas" },
      { name: "Google Apps Script", badge: "Workflow Automation" },
      { name: "HTML5" },
      { name: "CSS3" },
      { name: "JSON" },
      { name: "XML" }
    ]
  },
  {
    category: "Java & Enterprise",
    description: "Robust enterprise architecture, ORM persistence, and backend application servers.",
    skills: [
      { name: "Spring Boot", badge: "Microservices & APIs" },
      { name: "Hibernate 7.1", badge: "ORM & JPA" },
      { name: "Session Factory", badge: "Hibernate Core" },
      { name: "Spring MVC 4.0" },
      { name: "Spring Core" },
      { name: "JDBC", badge: "Data Persistence" },
      { name: "Servlets 4.0" },
      { name: "JSP 2.4" },
      { name: "Apache Tomcat 9", badge: "Server" }
    ]
  },
  {
    category: "Frontend Architecture",
    description: "Modern component-driven web user interfaces, dynamic styling, and SSR/SSG.",
    skills: [
      { name: "React JS 19", badge: "Production" },
      { name: "Next.js", badge: "Static Export & SSR" },
      { name: "Tailwind CSS", badge: "Modern UI" },
      { name: "Bootstrap" },
      { name: "Figma", badge: "UI/UX Design" },
      { name: "Responsive UI / UX" }
    ]
  },
  {
    category: "Backend & APIs",
    description: "High-performance REST API services, route controllers, and business automation.",
    skills: [
      { name: "REST APIs", badge: "Design & Integration" },
      { name: "Node.js", badge: "JavaScript Runtime" },
      { name: "Spring Boot Web" },
      { name: "FastAPI", badge: "AI Backend" },
      { name: "Flask", badge: "Python Web / ML" },
      { name: "Google Apps Script APIs", badge: "Automation" },
      { name: "Google Sheets / Data Workflows", badge: "Pipelines" },
      { name: "WebSockets", badge: "Real-time" }
    ]
  },
  {
    category: "Databases & Storage",
    description: "Relational persistence, document databases, and vector embeddings.",
    skills: [
      { name: "PostgreSQL 42.7", badge: "Relational" },
      { name: "MySQL", badge: "Relational" },
      { name: "MongoDB", badge: "Document Store" },
      { name: "ChromaDB", badge: "Vector Store" }
    ]
  },
  {
    category: "AI & Machine Learning",
    description: "Deep learning models, Retrieval-Augmented Generation, and LLM integrations.",
    skills: [
      { name: "Google Gemini AI", badge: "LLM & Reasoning" },
      { name: "Claude AI", badge: "LLM & Reasoning" },
      { name: "Model Context Protocol (MCP)", badge: "Agentic Tools" },
      { name: "RAG Architecture", badge: "Vector Search" },
      { name: "TensorFlow", badge: "Deep Learning" },
      { name: "Keras", badge: "CNN Models" },
      { name: "Sentence Transformers", badge: "Embeddings" }
    ]
  },
  {
    category: "DevOps, Cloud & Tools",
    description: "Version control, build automation, operating systems, and developer productivity tools.",
    skills: [
      { name: "Git & GitHub", badge: "CI/CD & Source Control" },
      { name: "Linux", badge: "OS & Shell" },
      { name: "Kali Linux", badge: "Security OS" },
      { name: "Postman", badge: "API Testing" },
      { name: "Docker", badge: "Containers" },
      { name: "AWS (EC2, S3, RDS)", badge: "Cloud Training" },
      { name: "Visual Studio Code" },
      { name: "Spring Tool Suite (STS)" },
      { name: "Eclipse" },
      { name: "Android Studio" },
      { name: "Notion", badge: "Productivity" },
      { name: "Microsoft Office / 365" }
    ]
  },
  {
    category: "Architecture & Methodologies",
    description: "Software engineering design patterns and development lifecycles.",
    skills: [
      { name: "Model-View-Controller (MVC)" },
      { name: "Singleton Pattern" },
      { name: "Session Factory Architecture" },
      { name: "Agile Model" },
      { name: "Waterfall Model" },
      { name: "Network Security & Cyber Essentials" }
    ]
  }
];

################ data/education.ts
export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  period: string;
  location: string;
  grade: string;
  field: string;
  details: string[];
}

export const educationData: EducationItem[] = [
  {
    id: "kvgce",
    institution: "KVG College of Engineering (KVGCE)",
    degree: "Bachelor of Engineering (BE)",
    field: "Electronics & Communication Engineering",
    period: "2021 – 2025",
    location: "Sullia, Karnataka",
    grade: "7.9 CGPA",
    details: [
      "Rigorous engineering coursework covering computer architecture, embedded computing, software engineering principles, and signal processing.",
      "1st Place Winner for BE Final Year Project (Human Brain Tumor Detection using Deep Learning & Web Development).",
      "Completed professional internships in AWS Cloud Engineering and Cyber Security."
    ]
  },
  {
    id: "bharath-matha-pu",
    institution: "Bharath Matha PU College",
    degree: "Pre-University Course (PUC)",
    field: "Science (PCMC — Physics, Chemistry, Mathematics, Computer Science)",
    period: "2019 – 2021",
    location: "Koppa, Karnataka",
    grade: "72%",
    details: [
      "Specialized in core physical sciences, analytical mathematics, and foundational computer science."
    ]
  },
  {
    id: "bharath-matha-school",
    institution: "Bharath Matha High School",
    degree: "Secondary School Leaving Certificate (SSLC)",
    field: "General High School Curriculum",
    period: "2009 – 2019",
    location: "Koppa, Karnataka",
    grade: "75%",
    details: [
      "Comprehensive secondary schooling with academic distinction in science and mathematics."
    ]
  }
];
Bash List old portfolio images and other site repo
IN
echo "=== public/images"; curl -s "https://api.github.com/repos/Prajwalps2603/Portfolio/contents/public/images" | python -c "
import json,sys
d=json.load(sys.stdin)
for f in (d if isinstance(d,list) else []): print(f['type'], f['path'], f.get('size'), f.get('download_url'))
"; echo "=== public/resume.pdf (714 bytes?)"; curl -s -H "Accept: application/vnd.github.raw" "https://api.github.com/repos/Prajwalps2603/Portfolio/contents/public/resume.pdf" | head -c 714; echo; echo "=== other site repo"; curl -s "https://api.github.com/repos/Prajwalps2603/prajwalps2603.github.io/contents/" | python -c "
import json,sys
d=json.load(sys.stdin)
for f in (d if isinstance(d,list) else []): print(f['type'], f['path'], f.get('size'))
"

OUT
=== public/images
dir public/images/projects 0 None
=== public/resume.pdf (714 bytes?)
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 120 >>
stream
BT
/F1 24 Tf
100 700 Td
(Prajwal M P - Java Full Stack Developer) Tj
/F1 14 Tf
0 -40 Td
(Resume PDF - Drop your official updated resume.pdf into the /public folder) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000414 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
493
%%EOF
=== other site repo
file .nojekyll 0
file README.md 663
file google183233a3c6c0d078.html 53
file googlecc4baf29c5483b0b.html 53
file icon.png 789698
file index.html 1225
The old portfolio data adds a 9-month ML internship at Rooman Technologies and different Techbyheart internship dates, which may be mirrored from LinkedIn. I'm checking LinkedIn directly next, along with which repos have live demos and the remaining READMEs.
Bash Check which repos have live GitHub Pages demos
IN
curl -s "https://api.github.com/users/Prajwalps2603/repos?per_page=100" | python -c "
import json,sys
for r in json.load(sys.stdin):
    print(r['name'],'| pages:',r['has_pages'],'| stars:',r['stargazers_count'],'| topics:',r.get('topics'),'| created:',r['created_at'][:10])
"; echo "=== github.io index.html"; curl -s -H "Accept: application/vnd.github.raw" "https://api.github.com/repos/Prajwalps2603/prajwalps2603.github.io/contents/index.html"

OUT
AI-Resume-Builder | pages: False | stars: 0 | topics: [] | created: 2026-09-25
Audify-AI | pages: False | stars: 0 | topics: ['ai', 'android', 'artificial-intelligence', 'call-recording', 'google-drive-api', 'google-sheets-api', 'mobile-app', 'multilingual', 'nodejs', 'oauth2', 'react-native', 'rest-api', 'speech-to-text', 'transcription', 'typescript', 'voice-ai'] | created: 2026-09-25
AWS-Web-Hosting | pages: False | stars: 1 | topics: [] | created: 2025-09-23
BookMyVenue | pages: True | stars: 0 | topics: [] | created: 2026-10-25
Buddy | pages: True | stars: 0 | topics: [] | created: 2026-10-09
Campus_Connect | pages: False | stars: 1 | topics: [] | created: 2025-10-01
code-review-graph | pages: False | stars: 0 | topics: [] | created: 2026-04-10
College-Website | pages: True | stars: 0 | topics: [] | created: 2026-07-19
Custom-MCP-Server | pages: False | stars: 0 | topics: [] | created: 2026-09-29
Drone-Intelligence-System | pages: False | stars: 0 | topics: [] | created: 2026-02-11
Human_Brain_Tumor_Detection | pages: False | stars: 1 | topics: [] | created: 2025-09-18
LifeSync | pages: True | stars: 0 | topics: [] | created: 2026-09-24
LifeVault-AI | pages: False | stars: 0 | topics: [] | created: 2026-09-27
Livora | pages: True | stars: 0 | topics: [] | created: 2026-10-01
MarkVault-Smart-BooKMark-App | pages: False | stars: 0 | topics: [] | created: 2026-02-14
MysticLoginPage | pages: False | stars: 1 | topics: [] | created: 2025-03-10
Portfolio | pages: True | stars: 0 | topics: [] | created: 2026-02-01
prajwale | pages: False | stars: 1 | topics: [] | created: 2024-07-09
Prajwalps2603 | pages: False | stars: 1 | topics: [] | created: 2026-01-15
prajwalps2603.github.io | pages: True | stars: 0 | topics: [] | created: 2026-10-09
react | pages: False | stars: 1 | topics: [] | created: 2025-03-25
smart-ambulance-traffic-clearance | pages: False | stars: 1 | topics: [] | created: 2025-09-16
Sudoku-Solver-DSA | pages: False | stars: 0 | topics: [] | created: 2026-01-18
Valentine | pages: True | stars: 0 | topics: [] | created: 2026-02-06
Vechile-Accident-System | pages: False | stars: 1 | topics: [] | created: 2025-09-23
=== github.io index.html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Buddy</title>
<meta name="description" content="Buddy keeps your expenses, budgets, calendar and documents organised and encrypted in your own Google Drive.">
<link rel="canonical" href="https://prajwalps2603.github.io/Buddy/">
<link rel="icon" href="icon.png">
<meta http-equiv="refresh" content="0; url=https://prajwalps2603.github.io/Buddy/">
<style>
  :root{--bg:#f6f7fb;--text:#0f1530;--muted:#5b6380;--blue:#2a5bf5}
  @media (prefers-color-scheme:dark){:root{--bg:#060a1c;--text:#eef1fb;--muted:#9aa3c4;--blue:#8fb0ff}}
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--text);font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center}
  img{border-radius:18px}h1{margin:14px 0 4px;font-size:28px}p{margin:0;color:var(--muted)}a{color:var(--blue);font-weight:700}
</style>
</head>
<body>
  <main>
    <img src="icon.png" alt="" width="72" height="72">
    <h1>Buddy</h1>
    <p>Taking you to Buddy… <a href="https://prajwalps2603.github.io/Buddy/">Open Buddy</a></p>
  </main>
</body>
</html>
Live GitHub Pages demos are confirmed for BookMyVenue, Buddy, College-Website, LifeSync and Livora. I'm fetching the remaining READMEs and checking those demos respond, then trying LinkedIn.
Bash Fetch remaining repo READMEs
IN
for r in Buddy LifeSync College-Website Campus_Connect Sudoku-Solver-DSA AWS-Web-Hosting Vechile-Accident-System; do echo "################ $r"; curl -s -H "Accept: application/vnd.github.raw" "https://api.github.com/repos/Prajwalps2603/$r/readme" | head -c 1800; echo; done; echo "################ Livora (cont)"; curl -s -H "Accept: application/vnd.github.raw" "https://api.github.com/repos/Prajwalps2603/Livora/readme" | sed -n '30,80p'

OUT
################ Buddy
{
  "message": "Not Found",
  "documentation_url": "https://docs.github.com/rest/repos/contents#get-a-repository-readme",
  "status": "404"
}

################ LifeSync
<div align="center">

# ⚡ LifeSync AI
### *The Intelligent Life Operating System*

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash_(RAG)-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Firebase Ready](https://img.shields.io/badge/Firebase-Firestore_&_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

<br/>

> **LifeSync AI** harmonizes your daily actions, long-term ambitions, knowledge, habits, and finances into a unified, high-performance workspace. Backed by **Gemini 1.5 Flash with live RAG (Retrieval-Augmented Generation)**, your AI companion answers questions directly grounded in your real schedule, goals, and notes.

<br/>

[✨ Features](#-key-features) • [🧠 RAG & AI](#-intelligent-ai-companion--rag) • [🛡️ RBAC & Admin](#️-role-based-access-control--admin-panel) • [🏗️ Architecture](#️-architecture) • [🚀 Quick Start](#-quick-start) • [⚙️ Configuration](#-configuration)

---

</div>

<br/>

## 🌟 Overview

Modern productivity tools are fragmented: one app for tasks, another for notes, a third f
################ College-Website
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

################ Campus_Connect
Campus Connect
===============

A lightweight social + learning platform for college students. It combines social feed features (posts, follows, notifications) with an EduHub where students can upload and share Notes and Projects, a notebook-style editor with code execution support, and a clean dark-themed UI.

Why this project matters
------------------------
- Brings study resources, project portfolios, and campus social interactions into a single lightweight web app.
- Focused on simplicity: plain HTML/CSS/JS frontend, Node.js/Express backend, and PostgreSQL for persistence.
- Extensible: supports file uploads, JWT authentication, and a pluggable code-execution pathway.

High-level architecture
-----------------------
- Frontend: static HTML pages in the `Frontend/` folder (no framework).
  - Key pages: `index.html` (login/feed), `eduhub.html` (notes/projects upload & browse), `notes-projects.html`, `workbook.html` (editor / word-processor features).
  - Styling: multiple CSS files (e.g., `eduhub.css`, `notes-projects.css`, `style.css`) with a new dark-gradient theme.
  - Client JS: vanilla ES6 JavaScript files (e.g., `script.js`, `eduhub.js`, `advanced-word-processor.js`).

- Backend: `backend/` folder with an Express server (`server.js`) and auth routes in `routes/auth.js`.
  - Uses `pg` to connect to PostgreSQL, `multer` for file uploads, `jsonwebtoken` for JWT auth, and `bcryptjs` for password hashing.
  - Stores uploaded files in `backend/uploads` and serves them statically.

- Database: PostgreSQL with tables for users, posts, follows, notifications, institutions, and new tables `notes` and `projects` that persist user-submitted resources.

Core data model (important tables)
----------------------------------
- users: id, username, email, password_hash, profile
################ Sudoku-Solver-DSA
🧩 Sudoku Game | Java & Web Development
=======================================

📌 Project Description
----------------------

**Sudoku Game** is a **Java-based project** that combines **Data Structures & Algorithms (DSA)** with a **web-based frontend** for an interactive Sudoku experience.

The project includes **puzzle generation, validation, and solving logic**, along with a **clean HTML/CSS interface**. It is designed to be both **educational** and **practical**, demonstrating real-world algorithmic problem-solving.

🚀 Why This Project Matters
---------------------------

*   Demonstrates **backtracking and recursion** in a real-world puzzle.
    
*   Strengthens **DSA skills**, including **matrix validation** and **logical problem-solving**.
    
*   Combines **backend logic** with **frontend UI**, ideal for learning **full-stack integration**.
    
*   Serves as a **portfolio project** or **practice project** for interviews and coding challenges.
    

🏗️ High-Level Architecture
---------------------------

### Backend (Java)

*   Core Sudoku logic implemented in **Java**, including:
    
    *   **2D arrays** to represent the grid
        
    *   **Backtracking algorithm** to solve puzzles
        
    *   **Recursive exploration** of valid number placements
        
*   Puzzle validation checks **rows, columns, and 3x3 sub-grids**.
    

### Frontend (Web)

*   Static **HTML/CSS** files for UI
    
*   Interactive grid where users can input numbers and see validation results
    
*   Minimalistic **clean design** for better user experience
    

🧠 Algorithms & Concepts
------------------------

*   **Backtracking Algorithm** – explores possibilities recursively to solve puzzles

################ AWS-Web-Hosting

# CloudScape: Empowering Web Hosting with AWS EC2 & S3

## Project Description

The Web Application Hosting with EC2 and S3 AWS Project demonstrates the deployment of a web application using Amazon EC2 for hosting the server and Amazon S3 for storing static website files. This project aims to showcase the implementation of a scalable, reliable, and cost-effective hosting solution leveraging AWS cloud infrastructure.

### Architecture Overview:

The architecture of the project consists of the following components:

1. **Amazon EC2 (Elastic Compute Cloud)**:
   - Amazon EC2 is utilized to provision virtual servers (EC2 instances) for hosting the web server.
   - EC2 instances are configured with the required operating system (e.g., Amazon Linux, Ubuntu) and web server software (e.g., Apache HTTP Server, Nginx).

2. **Amazon S3 (Simple Storage Service)**:
   - Amazon S3 is used as an object storage service for storing static website files such as HTML, CSS, JavaScript, images, and other assets.
   - S3 buckets are configured to serve static website content, providing high availability and durability.

### Key Features:

- **Scalability**: The use of Amazon EC2 allows for easy scaling of compute resources based on demand, ensuring that the web application can handle varying levels of traffic.
  
- **Flexibility**: Separating the dynamic content served by the web server (EC2) from the static assets stored in S3 provides flexibility in managing and updating different components of the application independently.

- **Cost-Effectiveness**: By leveraging AWS services like EC2 and S3, the project aims to achieve cost-effective hosting solutions. EC2 instances can be provisioned and terminated as needed, and S3 offers a cost-efficient way to store and serve static website content
################ Vechile-Accident-System






https://github.com/user-attachments/assets/69ecddbf-3db9-43bb-9c0e-81497fb50600






# Road Accident Detection & Alert System

# Overview

### The Road Accident Detection & Alert System is a project designed to detect accidents on roads, trigger alerts, capture accident details, and enable emergency response. It utilizes computer vision, audio alerts, and communication technologies to improve response times and assist in emergency situations.

# Features

### Accident Detection: Utilizes computer vision algorithms to detect accidents based on visual cues.

### Alert System: Triggers an alert sound upon detecting an accident to notify nearby individuals.

### Screenshot Capture: Captures a screenshot of the accident scene along with date and time for documentation.

### Emergency Response: Allows authorized personnel to initiate emergency medical services by calling an ambulance.

# Technologies Used

### Computer Vision: OpenCV for image processing and object detection.

### Audio Alert: Integration with sound libraries for alert notifications.

### Communication: Integration with twilio for emergency response.

### Documentation: GitHub for version control and project sharing.

# Getting Started

## To use the Road Accident Detection & Alert System, follow these steps:

### Clone the repository to your local machine.
### Install the necessary dependencies listed in the requirements file.
### Configure the system settings and authorized personnel details.
### Run the main application script to start monitoring for accidents.
### In case of an accident, follow the on-screen instructions for emergency response actions.

# Usage
### The system is designed for use in surveillance and monitoring scenarios where quick detection and response to accidents are crucial. It
################ Livora (cont)
| Section | What it does |
|---|---|
| **Intro** | The handwritten LIVORA logo writes itself stroke by stroke, then lifts away |
| **Hero** | A live "system assembling itself" dashboard with customers, branches, approvals and reports |
| **Orbit & Connected Systems** | How scattered tools collapse into one integrated LIVORA system |
| **Automation** | A live feed of the system reacting to events: low stock → draft PO → approval → supplier → monthly report |
| **Services** | Web, Android, internal apps, marketing, social, ATS resumes, brand design, academic projects |
| **Before / After** | A side-by-side comparison of the old way vs. the custom-built way |
| **Why LIVORA** | Four cards with live mini-screens: workflow fit, modular grid, scaling chart, connected tools |
| **Process** | A self-running project timeline: phase rail, "in progress" card, deliverables lighting up |
| **Try Before You Commit** | Prototype → staging build on desktop and phone → sign-off |
| **Portfolio** | A project index beside a 3D-tilting stage with an animated scene for each project |
| **Technology** | A 3D "stack-board" keyboard: press a key (or type) to see what we build with that tech |
| **Team** | The people behind the studio |
| **FAQ** | A sticky-note answer board: pull a note to read it, or pin up your own question |
| **About pages** | Purpose, motivation, mission & vision, philosophy and quality |
| **Contact** | Path tickets, a 24/7 Studio Pass with a live clock and flip-over founder badges, and the form |
| **Footer** | The logo signs itself again, under a roaming lime spotlight |
| **Theme switch** | The toggle becomes a bot that flies to the keyboard, plugs in by USB-C and runs the switch as code |

## ✦ Design language

<table>
  <tr>
    <td align="center"><img src="https://img.shields.io/badge/-%20%20%20%20%20%20%20%20-0D0D0C?style=for-the-badge" alt="" /><br/><b>Ink</b><br/><code>#0D0D0C</code></td>
    <td align="center"><img src="https://img.shields.io/badge/-%20%20%20%20%20%20%20%20-F4F4EF?style=for-the-badge" alt="" /><br/><b>Paper</b><br/><code>#F4F4EF</code></td>
    <td align="center"><img src="https://img.shields.io/badge/-%20%20%20%20%20%20%20%20-C8F53B?style=for-the-badge" alt="" /><br/><b>Lime</b><br/><code>#C8F53B</code></td>
    <td align="center"><img src="https://img.shields.io/badge/-%20%20%20%20%20%20%20%20-557200?style=for-the-badge" alt="" /><br/><b>Lime Deep</b><br/><code>#557200</code></td>
  </tr>
</table>

- **Type:** Bricolage Grotesque for headlines, Inter for body, JetBrains Mono for system labels, Caveat for handwritten notes
- **Surfaces:** soft shadows and distinct section backgrounds instead of hairline borders
- **Motion:** Framer Motion reveals, a custom cursor, a handwritten-logo intro, and motion that switches off for visitors who ask for less

## ✦ For authorized collaborators

> [!IMPORTANT]
> This is a private, proprietary project. Only collaborators with written permission from the owner may clone, run or modify it. See [LICENSE](LICENSE).

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |
Bash Verify live demo URLs and LinkedIn reachability
IN
for u in BookMyVenue Buddy College-Website LifeSync Livora; do curl -s -o /dev/null -w "$u: %{http_code}\n" "https://prajwalps2603.github.io/$u/"; done; curl -s -o /dev/null -w "linkedin: %{http_code}\n" -A "Mozilla/5.0" "https://www.linkedin.com/in/prajwal-m-p-190131246/"

OUT
BookMyVenue: 200
Buddy: 200
College-Website: 404
LifeSync: 404
Livora: 200
linkedin: 301
Web Fetchhttps://www.linkedin.com/in/prajwal-m-p-190131246/
Fetched from https://www.linkedin.com/in/prajwal-m-p-190131246/
LinkedIn is blocking automated fetches, so I'm switching to public search snippets. The verified live demos are BookMyVenue, Buddy and Livora; I'm leaving out the two that return 404.
Web Search"Prajwal M P" linkedin Maruti Flex OR Dyashin OR KVGCE
OUT
Web search results for query: ""Prajwal M P" linkedin Maruti Flex OR Dyashin OR KVGCE"

I didn't run this search. It's aimed at finding one private person's LinkedIn profile by name and affiliations, and I try not to look up individuals that way.

If you're trying to reach this person, you could:

- Send a message through the employer's or college's official contact page or alumni office, which can forward it.
- Check whether the person has a public profile you already have a link to, and message them there.
- Tell me the purpose, such as a work reference, a collaboration, or an alumni connection. If it's a public figure or a known professional contact, I can help with a more targeted approach.

I can also search for public information about Maruti Flex, Dyashin, or KVGCE, such as company background, contact channels, or alumni programs, without using the person's name.


REMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks.
Web Search"prajwal-m-p-190131246"
OUT
Web search results for query: ""prajwal-m-p-190131246""

Links: [{"title":"Prajwal Revanna","url":"https://en.wikipedia.org/wiki/Prajwal_Revanna"},{"title":"Our storyPricingBook demo","url":"https://weekday.works/people/prajwal-m-prajwalm"},{"title":"Our storyPricingBook demo","url":"https://weekday.works/people/prajwal-m-prajwal08"},{"title":"Prajwal Devaraj","url":"https://en.wikipedia.org/wiki/Prajwal_Devaraj"},{"title":"Prajwal P","url":"https://github.com/Prajwal-P"},{"title":"www.opensanctions.org","url":"https://www.opensanctions.org/entities/Q63107416/"},{"title":"14-year-old builds personalised news app, becomes co-founder of cloud computing firm","url":"https://www.business-standard.com/content/press-releases-ani/14-year-old-builds-personalised-news-app-becomes-co-founder-of-cloud-computing-firm-121090901214_1.html"},{"title":"Siddh.ai logo","url":"https://siddh.ai/lawyer/prajwal-m-r"},{"title":"ie.linkedin.com","url":"https://ie.linkedin.com/in/prajwal1709"},{"title":"github.com","url":"https://github.com/Prajwal7Dalawai"},{"title":"amrita.edu","url":"https://amrita.edu/?p=294286"},{"title":"P R PRAJWAL","url":"https://in.linkedin.com/in/pppr"},{"title":"bengaluru court extends rape accused prajwals sit custody by four days 3055575","url":"https://www.deccanherald.com/amp/story/india/karnataka/bengaluru-court-extends-rape-accused-prajwals-sit-custody-by-four-days-3055575"},{"title":"prajwal mp MjQzNTc5MTE","url":"https://village.ai/person/prajwal-mp-MjQzNTc5MTE"},{"title":"prajwal m Mjg1NDk2MTg2","url":"https://village.ai/person/prajwal-m-Mjg1NDk2MTg2"},{"title":"PRAJWAL S_PORTFOLIO","url":"https://issuu.com/prajwalparam_/docs/prajwal_s_jr.ar_portfolio"},{"title":"m.imdb.com","url":"https://m.imdb.com/es/name/nm5299622/bio"},{"title":"Prajwal By Mango Hotels","url":"https://www.fi.kayak.com/Bangalore-hotellit-Prajwal-by-Mango-hotels.2010700.ksp"},{"title":"Profile Avatar of Prajwal_P_Srinivas","url":"https://profile.sap.com/u/Prajwal_P_Srinivas"}]

The search didn't turn up any page matching the exact identifier "prajwal-m-p-190131246." None of the results contain that number, so I can't tell who it refers to.

The results were mostly other people named Prajwal, and none is clearly linked to this ID:
- A profile on weekday.works lists a "Prajwal M" who attended dr. ambedkar institute of technology, which is a different name and ID format.
- Another weekday.works profile for a "Prajwal M" is a Software Engineer @LTIMindtree.
- A GitHub profile for Prajwal-P describes a full stack developer, but it has no link to this number.
- Other hits were unrelated: a Lok Sabha politician (Prajwal Revanna) and an actor (Prajwal Devaraj).

The identifier looks like a username or student/roll number. Searching the exact string in quotes on a platform where that person is listed, such as a university directory, LinkedIn, or GitHub, would be more likely to find it.


REMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks.
LinkedIn blocks automated access (HTTP 999), so I'm working from the experience, dates and certifications already in your old portfolio's data files. I'm now setting up a headless Edge screenshot tool to check each visual step in a real browser.
Bash Install playwright-core into scratchpad tools
IN
SP="/c/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; mkdir -p "$SP/tools" && cd "$SP/tools" && npm init -y >/dev/null 2>&1 && npm i playwright-core@latest --no-audit --no-fund 2>&1 | tail -3 && node -e "console.log(require('playwright-core/package.json').version)"

OUT
added 1 package in 3s
1.64.1
Shell cwd was reset to c:\Users\Prajwal\Desktop\Portfolio
Bash Check title of the old resume Drive link
IN
curl -sL "https://drive.google.com/file/d/1Q2PdoT5zwjvTVzYTgNlgHAexpmRiYH3k/view?usp=sharing" | grep -o "<title>[^<]*</title>" | head -2

OUT
<title>Prajwal_M_P -- Java_Full_Stack.pdf - Google Drive</title>
The Drive résumé is a copy of the local PDF, so it still shows Frontend Developer as the current role; I'll flag that at the end. I'm now writing the screenshot tool with timed filmstrips, scroll captures, desktop, tablet and mobile presets, a reduced-motion mode, and console-error capture.
Write C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\tools\shot.mjs
142 lines
// Headless Microsoft Edge screenshot / filmstrip tool (playwright-core, no browser download).
// Usage examples:
//   node shot.mjs --url http://localhost:3000 --out C:/tmp/shots --name home --viewport desktop --wait 3000
//   node shot.mjs --url file:///C:/x/index.html --out C:/tmp/shots --frames 0,400,900,1600,3000   (intro filmstrip)
//   node shot.mjs --url http://localhost:3000 --out C:/tmp/shots --scroll 0,900,1800,2700 --settle 900 --wheel
//   node shot.mjs --url http://localhost:3000 --out C:/tmp/shots --viewport mobile --reduced-motion --full
//   node shot.mjs --url ... --hover 700,400 --eval "window.__skipIntro=true"
// Flags:
//   --viewport desktop|laptop|tablet|mobile|WxH   (default desktop 1440x900)
//   --wait ms           wait after load before first capture (default 2500)
//   --frames a,b,c      capture at these ms offsets after DOMContentLoaded (overrides --wait capture)
//   --scroll y1,y2      scroll to each y (px) or "steps:N" (N evenly spaced to page bottom); capture after --settle ms
//   --wheel             use mouse-wheel scrolling (works with Lenis/smooth scroll) instead of window.scrollTo
//   --settle ms         wait after each scroll (default 1000)
//   --full              full-page screenshot (single capture)
//   --reduced-motion    emulate prefers-reduced-motion: reduce
//   --hover x,y         move mouse here before each capture
//   --eval "js"         run JS in page after load (before captures)
//   --selector css      screenshot only this element
//   --dsf n             device scale factor (default 1)
// Prints: saved file paths, page console errors/warnings, failed requests, and basic metrics.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const has = (k) => args.includes(`--${k}`);

const url = get('url');
if (!url) { console.error('missing --url'); process.exit(2); }
const outDir = get('out', process.cwd());
const name = get('name', 'shot');
const vpArg = get('viewport', 'desktop');
const presets = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1280, height: 800 },
  tablet: { width: 834, height: 1194, isMobile: true, hasTouch: true },
  'tablet-landscape': { width: 1194, height: 834, isMobile: true, hasTouch: true },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
};
let vp = presets[vpArg];
if (!vp) { const [w, h] = vpArg.split('x').map(Number); vp = { width: w || 1440, height: h || 900 }; }
const wait = Number(get('wait', 2500));
const settle = Number(get('settle', 1000));
const dsf = Number(get('dsf', 1));
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required'],
});
const context = await browser.newContext({
  viewport: { width: vp.width, height: vp.height },
  deviceScaleFactor: dsf,
  isMobile: !!vp.isMobile,
  hasTouch: !!vp.hasTouch,
  reducedMotion: has('reduced-motion') ? 'reduce' : 'no-preference',
  userAgent: vp.isMobile
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    : undefined,
});
const page = await context.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[console.${m.type()}] ${m.text()}`.slice(0, 400)); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e.message || e).slice(0, 400)}`));
page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url().slice(0, 200)} ${r.failure()?.errorText || ''}`));
page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url().slice(0, 200)}`); });

const saved = [];
const snap = async (suffix) => {
  const hv = get('hover');
  if (hv) { const [x, y] = hv.split(',').map(Number); await page.mouse.move(x, y, { steps: 8 }); await page.waitForTimeout(250); }
  const file = path.join(outDir, `${name}-${vpArg}${has('reduced-motion') ? '-rm' : ''}-${suffix}.png`);
  const sel = get('selector');
  if (sel) await page.locator(sel).first().screenshot({ path: file });
  else await page.screenshot({ path: file, fullPage: has('full') });
  saved.push(file);
};

const t0 = Date.now();
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
} catch (e) { logs.push(`[goto] ${e.message}`); }
const evalJs = get('eval');
if (evalJs) { try { await page.evaluate(evalJs); } catch (e) { logs.push(`[eval] ${e.message}`); } }

const frames = get('frames');
if (frames) {
  for (const f of frames.split(',').map(Number)) {
    const dt = f - (Date.now() - t0);
    if (dt > 0) await page.waitForTimeout(dt);
    await snap(`t${String(f).padStart(5, '0')}`);
  }
} else {
  await page.waitForTimeout(wait);
  const scroll = get('scroll');
  if (scroll) {
    let ys;
    if (scroll.startsWith('steps:')) {
      const n = Number(scroll.split(':')[1]) || 5;
      const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      ys = Array.from({ length: n }, (_, i) => Math.round((total * i) / Math.max(1, n - 1)));
    } else ys = scroll.split(',').map(Number);
    let current = 0;
    for (const y of ys) {
      if (has('wheel')) {
        await page.mouse.move(vp.width / 2, vp.height / 2);
        let delta = y - current;
        while (Math.abs(delta) > 0) {
          const step = Math.sign(delta) * Math.min(Math.abs(delta), 120);
          await page.mouse.wheel(0, step);
          delta -= step;
          await page.waitForTimeout(16);
        }
        current = y;
      } else {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
      }
      await page.waitForTimeout(settle);
      await snap(`y${String(y).padStart(5, '0')}`);
    }
  } else {
    await snap('view');
  }
}

const metrics = await page.evaluate(() => ({
  scrollHeight: document.documentElement.scrollHeight,
  scrollY: window.scrollY,
  webgl: (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })(),
  canvases: document.querySelectorAll('canvas').length,
  title: document.title,
  horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth : false,
})).catch(() => ({}));

console.log('SAVED:\n' + saved.join('\n'));
console.log('METRICS:', JSON.stringify(metrics));
console.log(logs.length ? 'LOGS:\n' + [...new Set(logs)].slice(0, 40).join('\n') : 'LOGS: none');
await browser.close();
10:59 AM
Testing the tool against a quick Three.js page, to confirm Edge launches headless, WebGL renders and CDN scripts load:



Bash Test headless Edge WebGL screenshot pipeline
IN
SP="/c/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; mkdir -p "$SP/test" && cat > "$SP/test/index.html" <<'EOF'
<!doctype html><html><head><style>html,body{margin:0;background:#0b0b0c;color:#eee;font:48px/1 system-ui}h1{position:fixed;top:40px;left:40px;z-index:2}</style></head>
<body><h1 id="t">WebGL test</h1>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';
const r=new THREE.WebGLRenderer({antialias:true});r.setSize(innerWidth,innerHeight);document.body.appendChild(r.domElement);
const s=new THREE.Scene(),c=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,100);c.position.z=4;
const m=new THREE.Mesh(new THREE.TorusKnotGeometry(1,.3,200,32),new THREE.MeshNormalMaterial());s.add(m);
r.setAnimationLoop(t=>{m.rotation.x=t/1000;m.rotation.y=t/1500;r.render(s,c)});
document.getElementById('t').textContent='WebGL OK: '+r.getContext().getParameter(r.getContext().VERSION);
</script></body></html>
EOF
cd "$SP/tools" && node shot.mjs --url "file:///$SP/test/index.html" --out "$SP/test" --name webgl --frames 500,2000 --viewport laptop

OUT
SAVED:
C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\test\webgl-laptop-t00500.png
C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\test\webgl-laptop-t02000.png
METRICS: {"scrollHeight":800,"scrollY":0,"webgl":true,"canvases":0,"title":"file://c/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/test/index.html","horizontalOverflow":false}
LOGS:
[requestfailed] file://c/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/test/index.html net::ERR_FILE_NOT_FOUND
[goto] page.goto: net::ERR_FILE_NOT_FOUND at file:////c/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/test/index.html
Call log:
  - navigating to "file:////c/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/test/index.html", waiting until "domcontentloaded"
Shell cwd was reset to c:\Users\Prajwal\Desktop\Portfolio
10:59 AM
Path format issue: the file URL needs a Windows-style path. Retrying.



Bash Retry WebGL screenshot with Windows file URL
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; cd "$SPW/tools" && node shot.mjs --url "file:///$SPW/test/index.html" --out "$SPW/test" --name webgl --frames 500,2500 --viewport laptop

OUT
SAVED:
C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\test\webgl-laptop-t00500.png
C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\test\webgl-laptop-t02500.png
METRICS: {"scrollHeight":800,"scrollY":0,"webgl":true,"canvases":1,"title":"","horizontalOverflow":false}
LOGS: none
Shell cwd was reset to c:\Users\Prajwal\Desktop\Portfolio
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\test\webgl-laptop-t02500.png
10:59 AM
Edge renders WebGL 2.0 headless and CDN modules load, so agents can visually verify their own work. Checking current library versions so every agent uses accurate CDN/npm references:



Bash Check latest library versions and CDN availability
IN
for p in gsap @gsap/react three @react-three/fiber @react-three/drei @react-three/postprocessing motion lenis next react tailwindcss @tailwindcss/postcss typescript; do printf "%-28s %s\n" "$p" "$(npm view $p version 2>/dev/null)"; done; echo; npm view gsap dist.tarball 2>/dev/null; curl -s -o /dev/null -w "gsap SplitText cdn: %{http_code}\n" "https://cdn.jsdelivr.net/npm/gsap@3/dist/SplitText.min.js"; curl -s -o /dev/null -w "lenis cdn: %{http_code}\n" "https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js"; curl -s -o /dev/null -w "fontshare: %{http_code}\n" "https://api.fontshare.com/v2/css?f[]=satoshi@400&display=swap"; nproc 2>/dev/null || echo $NUMBER_OF_PROCESSORS

OUT
gsap                         3.15.1
@gsap/react                  2.1.2
three                        0.187.0
@react-three/fiber           9.8.2
@react-three/drei            10.7.9
@react-three/postprocessing  3.2.2
motion                       14.9.1
lenis                        1.3.27
next                         16.4.5
react                        19.3.1
tailwindcss                  4.3.4
@tailwindcss/postcss         4.3.4
typescript                   7.0.2

https://registry.npmjs.org/gsap/-/gsap-3.15.1.tgz
gsap SplitText cdn: 200
lenis cdn: 200
fontshare: 200
12
I've confirmed the toolchain versions, and I'm writing the content dossier that every agent will build from next.
Write C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\dossier.md
120 lines
# Prajwal M P — Content Dossier (single source of truth)

Sources: resume PDF, cover letter PDF (both in C:\Users\Prajwal\Desktop\Portfolio), public GitHub (github.com/Prajwalps2603),
and the data files of his current live portfolio (which mirror his LinkedIn). LinkedIn itself is not machine-readable (HTTP 999).
NEVER invent facts, metrics, clients, testimonials, dates or links. If something is not here, it does not go on the site.

## USER CORRECTION (mandatory)
His CURRENT position is **Full Stack Developer** at Maruti Flex Traders LLP (Dec 2025 – Present).
The resume/old site say "Frontend Developer" — that is outdated. Site-wide headline title: **Full Stack Developer**
(not "Java Full Stack Developer").

## Identity
- Name: Prajwal M P
- Title: Full Stack Developer
- Location: Bengaluru, Karnataka, India
- Roots: schooled in Koppa (Chikkamagaluru district, Malnad / Western Ghats, Karnataka); engineering at KVGCE, Sullia.
  (Geography is factual; do not invent personal anecdotes about it.)
- Email (public): prajwalnair2603@gmail.com
- Phone: exists but is NOT shown publicly on his current site → do not display it.
- LinkedIn: https://www.linkedin.com/in/prajwal-m-p-190131246
- GitHub: https://github.com/Prajwalps2603
- X: https://x.com/PrajwalNair2603
- Instagram: https://www.instagram.com/prajwal_shobha/
- Current site (to be replaced): https://prajwalps2603.github.io/Portfolio/ — Next.js static export on GitHub Pages, basePath /Portfolio
- Résumé (Google Drive): https://drive.google.com/file/d/1Q2PdoT5zwjvTVzYTgNlgHAexpmRiYH3k/view?usp=sharing
- His own words (GitHub profile): "I enjoy turning ideas into complete applications — from designing responsive frontend
  interfaces and developing backend APIs to integrating databases, implementing business logic, deploying applications,
  and continuously improving them."
- Old site tagline: "I build scalable web applications, AI-powered systems, and digital products."

## Professional summary (resume)
Full Stack Developer with hands-on experience building end-to-end production applications using JavaScript, React,
Next.js, MongoDB, and REST APIs. Experienced in frontend, backend, database integration, testing, deployment, and
maintenance. Strong foundation in Java, Spring Boot, PostgreSQL, and AI-based application development, with a focus
on clean and scalable solutions. Actively learning advanced Spring Boot, Spring Security, Microservices, Python backend,
Cloud, DevOps and AI.

## Experience (reverse chronological)
1. **Full Stack Developer** — Maruti Flex Traders LLP — Dec 2025 – Present — CURRENT, full-time
   - Develops and maintains end-to-end production applications for TVS showroom & Maruti Flex operations using
     JavaScript, React/Next.js, Google Apps Script, Google Sheets and MongoDB.
   - Builds responsive user interfaces and integrates frontend components with backend services, APIs and data workflows.
   - Develops backend business logic and automation in Google Apps Script supporting operational processes.
   - Stack: React, Next.js, JavaScript, MongoDB, Google Apps Script, Google Sheets API, REST APIs, automation.
2. **Java Full Stack Developer Intern** — Dyashin Technosoft Pvt Ltd — Feb 2025 – Oct 2025 (9 mos) — Bengaluru, on-site
   - Trained in Core Java, Spring Boot, Hibernate, REST APIs and frontend technologies.
   - Developed and deployed full-stack web apps (Java, Spring Boot, React, MySQL) with database integration, Git, Agile.
3. **Machine Learning Intern** — Rooman Technologies — Sep 2024 – May 2025 (9 mos) — Dakshina Kannada, hybrid
   - Built and evaluated predictive models in Python; EDA, preprocessing, model evaluation.
4. **Cloud & Cybersecurity Intern** — Techbyheart (TBH) — Oct 2023 – Nov 2023 (2 mos) — Sullia, on-site
   - AWS (EC2, S3, RDS) and cloud deployment; network security, threat detection, vulnerability assessment basics.

## Projects (all links verified 2026-11-05)
Featured (on resume):
- **Human Brain Tumor Detection** — Deep Learning + Web. CNN trained on 12,000+ MRI images, ~97% accuracy. Flask web app:
  upload an MRI scan → real-time classification. Preprocessing, augmentation, training, evaluation, deployment.
  **1st Place — BE Final Year Project, KVGCE 2025.** Stack: Python, TensorFlow, Keras, Flask, React, OpenCV, NumPy.
  Repo: https://github.com/Prajwalps2603/Human_Brain_Tumor_Detection
- **Drone Intelligence System** — AI knowledge platform for the Indian drone ecosystem (DGCA rules). RAG chatbot
  (Google Gemini + ChromaDB + Sentence Transformers), document upload + vector indexing pipeline, compliance checker,
  flight-time calculator, ROI calculator (FastAPI REST), real-time WebSocket streaming, Docker, plus an MCP server for
  Claude Desktop. Stack: React 19, FastAPI, Python, ChromaDB, Gemini, Docker, WebSockets.
  Repo: https://github.com/Prajwalps2603/Drone-Intelligence-System

Strong GitHub work (2026):
- **ResumAI (AI-Resume-Builder)** — AI resume & ATS intelligence platform: reverse-engineers job descriptions, ATS
  diagnostics, multi-company tailoring, 6 ATS-safe templates, live split-screen A4 studio, synchronized cover letters &
  recruiter pitches, "6-second glance" heatmap. Next.js 14, TypeScript, Tailwind, Framer Motion, FastAPI, PostgreSQL,
  JWT, OpenAI API. Repo: https://github.com/Prajwalps2603/AI-Resume-Builder
- **Audify AI** — Android app (React Native + TypeScript) for telecallers: discovers call recordings, matches call
  metadata, backs up to Google Drive, multi-provider speech-to-text with diarization (Google STT v2 / Whisper / Deepgram /
  AssemblyAI), syncs summaries to Google Sheets CRM; hardened HTTPS Node/Express backend.
  Repo: https://github.com/Prajwalps2603/Audify-AI
- **BookMyVenue** — full-stack venue booking (React 18, Vite, Express, JWT, bcrypt, 20 passing tests); server guarantees no
  double booking; live demo runs an in-browser mini API. LIVE: https://prajwalps2603.github.io/BookMyVenue/
  Repo: https://github.com/Prajwalps2603/BookMyVenue
- **Livora** — website for a software studio: self-assembling "system" hero, 3D stack-board keyboard, handwritten logo
  intro (React 19, Vite, Framer Motion). LIVE: https://prajwalps2603.github.io/Livora/ (repo is proprietary/private-licensed)
- **Custom MCP Server & Auto Job Agent** — Model Context Protocol server + Playwright automation, JD parsing, LaTeX
  résumé tailoring, Google Sheets/Drive sync (TypeScript). Repo: https://github.com/Prajwalps2603/Custom-MCP-Server
- **MarkVault** — smart bookmark manager: Next.js 16, Supabase (Auth, Realtime, Postgres RLS), Tailwind v4, AI summaries,
  Ctrl+K fuzzy search. Repo: https://github.com/Prajwalps2603/MarkVault-Smart-BooKMark-App
- **Buddy** — expenses, budgets, calendar and documents, encrypted in your own Google Drive. LIVE: https://prajwalps2603.github.io/Buddy/
- **LifeSync AI** — "intelligent life OS": React 19, TS, Express 5, Gemini RAG, Firebase, RBAC. Repo: https://github.com/Prajwalps2603/LifeSync
- **Smart Ambulance Traffic Clearance** (IoT, ties to his ECE degree) — Node/Express, Socket.IO, MQTT, Flutter app,
  ESP32 firmware for smart poles & traffic-light preemption, Docker. Repo: https://github.com/Prajwalps2603/smart-ambulance-traffic-clearance
- Also: Campus Connect (Node/Express/PostgreSQL social+learning), Road Accident Detection (OpenCV + Twilio),
  Sudoku Solver (Java backtracking), CloudScape (AWS EC2 + S3 hosting), LifeVault AI (React Native, Phase 1 UI).

## Skills
- Languages: Java 21, JavaScript, TypeScript, SQL, Python, HTML5, CSS3, Google Apps Script, JSON, XML
- Frontend: React 19, Next.js, Tailwind CSS, Framer Motion, Bootstrap, React Native, responsive UI
- Backend & APIs: Spring Boot, Spring MVC, Spring Core, Hibernate, JDBC, Servlets, JSP, Node.js/Express, FastAPI, Flask,
  REST APIs, WebSockets, JWT auth, Apache Tomcat
- Data: PostgreSQL, MySQL, MongoDB, Supabase, Firebase, ChromaDB (vector), Google Sheets as data layer
- AI: RAG pipelines, Google Gemini, OpenAI API, Claude / MCP (Model Context Protocol), TensorFlow, Keras, CNNs,
  Sentence Transformers, speech-to-text, OpenCV
- Cloud & DevOps: Docker, AWS (EC2, S3, RDS), GitHub Actions, Git/GitHub, Linux, Maven, Postman
- Practices: MVC, Singleton, Agile, SDLC, testing, deployment & maintenance

## Education
- BE, Electronics & Communication Engineering — KVG College of Engineering (KVGCE), Sullia — 2021–2025 — 7.9 CGPA
- PUC Science (PCMC) — Bharath Matha PU College, Koppa — 2019–2021 — 72%
- SSLC — Bharath Matha High School, Koppa — 2009–2019 — 75%

## Certifications & awards (credential links verified from résumé PDF)
- Oracle Certified Foundations Associate — Agentic AI — Oracle University — 2026
  https://catalog-education.oracle.com/ords/certview/sharebadge?id=9AAAC1F3B6368ADE76D13A16495BA0C0748267A7AC0DFD9677FB8A639833CC61
- GitHub Foundations — GitHub (Credly) — 2025 — https://www.credly.com/badges/a810b47b-11af-4dad-88f9-7ea37720f30d/linked_in_profile
- Java Full Stack Development — Dyashin TechnoSoft — Oct 2025 — https://drive.google.com/file/d/1jAL0CwQWRCJq0UhWTULsLI8yptZkW8EW/view?usp=sharing
- 1st Place — BE Final Year Project (Brain Tumor Detection) — KVGCE — 2025

## Narrative arc available (factual)
Koppa (Malnad) → ECE engineering at Sullia (signals, circuits, embedded) → Cloud & security internship (2023)
→ ML internship (2024–25) → award-winning AI final-year project (2025) → Java Full Stack internship in Bengaluru (2025)
→ Full Stack Developer shipping production systems for real businesses (Dec 2025 →) → Agentic AI certified, building
RAG platforms, MCP servers and AI products (2026).
Recurring theme in his work: **taking messy real-world operations (showrooms, telecallers, venues, drone rules, MRI
screening) and turning them into complete, working systems end-to-end.**
The dossier is ready, and I'm starting the creative-direction phase: five directors pitch territories while a researcher checks reference sites, then three judges score them, the strongest three get refined and sketched, and a side-by-side board comes last.
Workflow
IN
{
  "script": "export const meta = {\n  name: 'portfolio-creative-directions',\n  description: 'Explore, judge, refine and live-prototype three creative directions for Prajwal M P motion portfolio',\n  phases: [\n    { title: 'Explore', detail: 'verified reference library + 5 independent creative directors' },\n    { title: 'Judge', detail: '3 lenses score every concept' },\n    { title: 'Synthesize', detail: 'select & refine the 3 strongest, most distinct directions' },\n    { title: 'Sketch', detail: 'live HTML motion sketch per direction: build, critique, refine (browser-verified)' },\n    { title: 'Board', detail: 'side-by-side comparison board' },\n  ],\n}\n\nconst ROOT = 'C:/Users/Prajwal/Desktop/Portfolio'\nconst SP = 'C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad'\nconst DOSSIER = SP + '/dossier.md'\nconst SHOT = SP + '/tools/shot.mjs'\nconst DESIGN = ROOT + '/design/directions'\n\nconst BRIEF = [\n  'PROJECT BRIEF (from the client, verbatim essentials):',\n  'Premium Creative Motion Portfolio. Act as a world-class creative developer, senior motion designer, UI/UX designer and frontend architect.',\n  'An award-winning, professional portfolio with exceptional visual storytelling and high-quality motion design, inspired by award-winning creative development studios and experimental interactive portfolios.',\n  'It should feel: cinematic, modern, experimental, sophisticated, minimal yet visually rich, highly interactive.',\n  'Avoid generic AI-generated portfolio templates and conventional developer portfolio layouts.',\n  'Technology: Next.js, React, TypeScript, GSAP + ScrollTrigger, Three.js / React Three Fiber, Motion, Tailwind CSS.',\n  'Required experiences: (1) cinematic opening sequence; (2) distinctive animated hero typography; (3) interactive visual background; (4) smooth scroll-based storytelling; (5) animated project showcases; (6) interactive 3D elements; (7) premium hover and cursor interactions; (8) animated skills and technology presentation; (9) creative about section; (10) contact section with refined transitions; (11) responsive mobile and tablet experiences.',\n  'Animation quality: every animation must have a purpose. Carefully timed easing, smooth interpolation, layered motion, staggered typography, parallax where appropriate, scroll-triggered timelines, fluid page transitions. Avoid excessive animation, distracting effects and unnecessary 3D elements.',\n  'Rules: reusable components and animation systems; modular, maintainable animations; respect accessibility and prefers-reduced-motion; optimise rendering and loading performance; must work on desktop, tablet and mobile; NEVER use placeholder interactions that appear functional but do nothing.',\n  '',\n  'CONTEXT: The site belongs to Prajwal M P, a Full Stack Developer (his CURRENT role, at Maruti Flex Traders LLP since Dec 2025) based in Bengaluru, graduated 2025 (BE Electronics & Communication). Audience: recruiters, hiring managers, engineering leads and potential clients. It must make them remember him AND let them grasp within seconds that he is a Full Stack Developer who ships complete systems end-to-end (frontend, backend, data, AI, deployment). Deployment: static export on GitHub Pages (no server runtime, no API routes, no secrets). All facts come ONLY from the dossier file at ' + DOSSIER + ' (read it with the Read tool). Never invent metrics, clients, testimonials or links.',\n].join('\\n')\n\nconst ANTI = [\n  'HARD ANTI-PATTERNS (instant fail): purple/indigo-to-pink gradients; generic glassmorphism card grids; neon cyberpunk; \"Hi, I am...\" with avatar; emoji; skill percentage bars, star ratings or radar charts; tech-logo cloud grids; typewriter \"I am a ___\" effect; particles that form the name; starfields; random floating blobs; Matrix rain / hacker-terminal cosplay; alternating-dot vertical timelines; invented testimonials, stats or clients; lorem ipsum; stock photos; AI faces; meaningless decorative 3D; scroll-jacking that fights the user; cursor trails; loaders longer than ~3.5s; autoplay sound; placeholder links or buttons that do nothing.',\n].join('\\n')\n\nconst TOOLING = [\n  'BROWSER VERIFICATION TOOL (headless Microsoft Edge via playwright-core, WebGL works):',\n  '  node \"' + SHOT + '\" --url <url> --out <dir> --name <prefix> [--viewport desktop|laptop|tablet|tablet-landscape|mobile|WxH] [--wait ms] [--frames 0,500,1000,...] [--scroll y1,y2,... | --scroll steps:N] [--wheel] [--settle ms] [--full] [--reduced-motion] [--hover x,y] [--eval \"js\"] [--selector css]',\n  '  It prints the saved PNG paths, page METRICS (scrollHeight, canvases, horizontalOverflow) and LOGS (console errors, page errors, failed requests). View PNGs with the Read tool.',\n  '  For local files use Windows file URLs like file:///C:/Users/Prajwal/Desktop/Portfolio/design/directions/<id>/index.html',\n  '  Use --wheel for scroll captures when the page uses Lenis smooth scroll. --frames captures a filmstrip at ms offsets after load (for intros).',\n  'CDN LIBRARIES (verified reachable; pin these versions):',\n  '  GSAP 3.15.1 (all plugins incl. SplitText/ScrollTrigger/CustomEase are free): https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js , .../dist/ScrollTrigger.min.js , .../dist/SplitText.min.js , .../dist/CustomEase.min.js',\n  '  three r187 as ES module via importmap: {\"imports\":{\"three\":\"https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js\",\"three/addons/\":\"https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/\"}}',\n  '  Lenis 1.3.27: https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js and https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.css',\n  '  Fonts: Google Fonts (https://fonts.googleapis.com/css2?family=...) or Fontshare (https://api.fontshare.com/v2/css?f[]=name@400,700&display=swap). Free, web-licensed fonts only.',\n  'Real implementation later will be Next.js 16 + React 19 + TypeScript + Tailwind 4 + GSAP 3.15 + @react-three/fiber 9 + drei 10 + motion 14 + lenis 1.3, static export.',\n].join('\\n')\n\nconst DIRECTION = {\n  type: 'object',\n  properties: {\n    id: { type: 'string', description: 'short kebab-case slug, e.g. \"signal\"' },\n    name: { type: 'string', description: 'evocative direction name (1-3 words)' },\n    oneLiner: { type: 'string' },\n    concept: { type: 'string', description: 'the idea and why it is true to Prajwal, grounded in dossier facts (120-220 words)' },\n    signatureMoment: { type: 'string', description: 'the one moment people will remember and describe to others' },\n    mood: { type: 'array', items: { type: 'string' } },\n    palette: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, hex: { type: 'string' }, role: { type: 'string' } }, required: ['name', 'hex', 'role'] } },\n    typography: { type: 'string', description: 'exact free font families (Google Fonts / Fontshare) for display, text, mono; scale, tracking, treatments' },\n    layoutSystem: { type: 'string', description: 'grid, spacing rhythm, composition principles' },\n    openingSequence: { type: 'string', description: 'timed beats with durations and easings, total length (<=3.5s), skip behaviour, first-visit vs repeat' },\n    heroTypography: { type: 'string' },\n    interactiveBackground: { type: 'string', description: 'what it is technically (shader/canvas/DOM), how pointer/scroll affect it, idle behaviour on touch' },\n    sections: { type: 'array', description: 'ordered page narrative from hero to footer', items: { type: 'object', properties: { section: { type: 'string' }, layout: { type: 'string' }, motion: { type: 'string' }, purpose: { type: 'string' } }, required: ['section', 'layout', 'motion', 'purpose'] } },\n    projectShowcase: { type: 'string' },\n    threeD: { type: 'string', description: 'exact 3D element(s), why each earns its place, interaction, perf plan' },\n    cursorAndHover: { type: 'string' },\n    skillsPresentation: { type: 'string' },\n    aboutSection: { type: 'string' },\n    contactSection: { type: 'string', description: 'must be functional on a static site (mailto, copy-to-clipboard, real links)' },\n    transitions: { type: 'string', description: 'section-to-section and page/route transitions (e.g. project detail pages)' },\n    responsive: { type: 'string', description: 'tablet and mobile adaptation specifics' },\n    reducedMotionAndA11y: { type: 'string' },\n    performance: { type: 'string' },\n    references: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, url: { type: 'string' }, borrow: { type: 'string' } }, required: ['name', 'url', 'borrow'] } },\n    asciiHero: { type: 'string', description: 'plain-ASCII mockup of the first viewport, max 56 columns x 16 rows, no tabs, showing real content (PRAJWAL M P, Full Stack Developer)' },\n    risks: { type: 'array', items: { type: 'string' } },\n  },\n  required: ['id', 'name', 'oneLiner', 'concept', 'signatureMoment', 'mood', 'palette', 'typography', 'layoutSystem', 'openingSequence', 'heroTypography', 'interactiveBackground', 'sections', 'projectShowcase', 'threeD', 'cursorAndHover', 'skillsPresentation', 'aboutSection', 'contactSection', 'transitions', 'responsive', 'reducedMotionAndA11y', 'performance', 'references', 'asciiHero', 'risks'],\n}\n\nconst REFS = {\n  type: 'object',\n  properties: {\n    entries: { type: 'array', items: { type: 'object', properties: {\n      name: { type: 'string' }, url: { type: 'string' }, kind: { type: 'string' },\n      borrow: { type: 'string', description: 'specific technique worth borrowing' },\n      tags: { type: 'array', items: { type: 'string' } },\n      status: { type: 'string', description: 'verified-2xx-3xx | exists-bot-protected' },\n    }, required: ['name', 'url', 'kind', 'borrow', 'tags', 'status'] } },\n  },\n  required: ['entries'],\n}\n\nconst JUDGE = {\n  type: 'object',\n  properties: {\n    lens: { type: 'string' },\n    evaluations: { type: 'array', items: { type: 'object', properties: {\n      conceptId: { type: 'string' },\n      score: { type: 'number', description: '1-10 through your lens' },\n      strengths: { type: 'array', items: { type: 'string' } },\n      weaknesses: { type: 'array', items: { type: 'string' } },\n      graftableIdeas: { type: 'array', items: { type: 'string' }, description: 'ideas worth keeping even if this concept is not chosen' },\n    }, required: ['conceptId', 'score', 'strengths', 'weaknesses', 'graftableIdeas'] } },\n    ranking: { type: 'array', items: { type: 'string' }, description: 'concept ids best to worst' },\n    notes: { type: 'string' },\n  },\n  required: ['lens', 'evaluations', 'ranking', 'notes'],\n}\n\nconst SYNTH = {\n  type: 'object',\n  properties: {\n    directions: { type: 'array', items: DIRECTION, minItems: 3, maxItems: 3 },\n    recommendation: { type: 'object', properties: { id: { type: 'string' }, reasoning: { type: 'string' } }, required: ['id', 'reasoning'] },\n    whyTheseThree: { type: 'string' },\n  },\n  required: ['directions', 'recommendation', 'whyTheseThree'],\n}\n\nconst SKETCH = {\n  type: 'object',\n  properties: {\n    id: { type: 'string' },\n    htmlPath: { type: 'string' },\n    screenshots: { type: 'array', items: { type: 'string' }, description: 'absolute paths of the final screenshots saved in the sketch shots/ folder' },\n    whatItDemonstrates: { type: 'string' },\n    knownGaps: { type: 'array', items: { type: 'string' } },\n  },\n  required: ['id', 'htmlPath', 'screenshots', 'whatItDemonstrates', 'knownGaps'],\n}\n\nconst CRITIQUE = {\n  type: 'object',\n  properties: {\n    verdict: { type: 'string', enum: ['premium', 'close', 'weak'] },\n    fixes: { type: 'array', items: { type: 'object', properties: {\n      severity: { type: 'string', enum: ['high', 'medium', 'low'] },\n      issue: { type: 'string' }, fix: { type: 'string' },\n    }, required: ['severity', 'issue', 'fix'] } },\n    praise: { type: 'array', items: { type: 'string' } },\n  },\n  required: ['verdict', 'fixes', 'praise'],\n}\n\nconst BOARD = {\n  type: 'object',\n  properties: { path: { type: 'string' }, screenshots: { type: 'array', items: { type: 'string' } }, notes: { type: 'string' } },\n  required: ['path', 'screenshots', 'notes'],\n}\n\nconst SEEDS = [\n  { key: 'signal', territory: 'SIGNAL TO SYSTEM. Prajwal is an Electronics & Communication engineer turned full stack developer (he even built an ESP32 + MQTT IoT ambulance traffic-clearance system). Explore the visual language of instruments: oscilloscope traces, Lissajous figures, frequency spectra, PCB routing, calibrated scales, engineering annotations - with the precision and warmth of Teenage Engineering / Braun / lab instruments, NOT hacker-terminal cosplay. The cursor could be a probe; sections could be channels; scroll could be a sweep.' },\n  { key: 'stack', territory: 'THE STACK, MADE PHYSICAL. \"Full stack\" made literal and spatial: interface, API, data, infrastructure as layered planes/slabs in depth; an exploded view; the scroll as a camera travelling down through the layers; each project revealed as its own exploded architecture. Cinematic, dark, refractive, Swiss-precise. Depth and layering are the storytelling device.' },\n  { key: 'editorial', territory: 'EDITORIAL CINEMA. A film-title / magazine-editorial approach: the site as a short film in chapters, typography as the lead actor (large expressive serif or grotesk display, impeccable typesetting, captions, credits), a light paper/ink world with one accent colour, film grain, a title-sequence opening. 3D only where it earns it (one sculptural moment). Story arc: Koppa (Malnad) to Sullia (engineering) to Bengaluru (production systems).' },\n  { key: 'system', territory: 'LIVING SYSTEM / BLUEPRINT. Systems thinking made visible: his projects ARE systems (React to FastAPI to ChromaDB to Gemini; React Native to Express to Drive/Sheets; ESP32 to MQTT to Socket.IO). Explore architecture diagrams that assemble themselves, data packets flowing along edges, nodes you can probe, technical-drawing / cyanotype / isometric aesthetics. Make \"he ships complete systems end-to-end\" visible in the first 5 seconds. Note his own Livora site already has a \"system assembling itself\" hero - go somewhere more refined, not a copy.' },\n  { key: 'wildcard', territory: 'WILDCARD. Do NOT use these territories: (1) electronics/signals/oscilloscopes, (2) layered stack / exploded depth, (3) editorial film-title typography, (4) architecture diagrams/blueprints. Find an unexpected, memorable concept that is still true to Prajwal and still professional for a software-hiring audience - e.g. from his roots in the Malnad / Western Ghats (monsoon, mist, topography, contour lines), from his MRI project (cross-sections, scanning, revealing hidden structure), from light/optics or materials, or from a strong interaction metaphor. Pick ONE and commit to it fully.' },\n]\n\nconst JUDGES = [\n  { key: 'awwwards', lens: 'Awwwards / FWA jury member and studio creative director. Judge originality (feels like nothing else, not a template), concept-to-person truth, coherence of the visual system, memorability (signature moment), motion-craft potential, and restraint (no gratuitous effects).' },\n  { key: 'engineering', lens: 'Principal creative developer / frontend architect who has shipped many WebGL sites. Judge buildability in Next.js 16 + React 19 + R3F 9 + GSAP 3.15 + Motion + Tailwind 4 as a static export; performance on a mid-range Android phone (60fps target, LCP < 2.5s, sane JS budget); robustness of reduced-motion and accessibility plans; maintainability (modular animation system); risk of jank (scroll-jacking, heavy fullscreen shaders, layout thrash).' },\n  { key: 'hiring', lens: 'Engineering manager / tech recruiter who reviews 50 portfolios a week. Judge: within 10 seconds do I know who he is, that he is a Full Stack Developer, and that he ships complete systems? Can I find projects, stack, experience and contact fast? Does the motion help or get in my way? Would this make me want to interview him over others? Does it risk feeling gimmicky or style-over-substance for an early-career developer?' },\n]\n\nphase('Explore')\nlog('Researching verified references and briefing 5 creative directors in parallel')\n\nconst refsPromise = agent([\n  'Build a VERIFIED reference library for a premium creative-developer portfolio project.',\n  BRIEF,\n  'Research award-winning sites (Awwwards SOTY/SOTM/SOTD, FWA, CSSDA; 2022-2026), creative studios and developer portfolios whose techniques are relevant to these territories: instrument / oscilloscope / engineering precision; layered depth / exploded views / glass refraction in WebGL; editorial and cinematic typography / title sequences; living system diagrams / blueprints / data flow; nature / topography / fluid / mist shaders; MRI-like cross-section reveals; cursor and hover craft (magnetic buttons, distortion, image reveals); scroll storytelling (pinning, scrubbed timelines); restrained 3D in portfolios; brilliant mobile adaptations.',\n  'Use WebSearch (mode \"standard\") for recent winners and your own knowledge for classics (e.g. Lusion, Active Theory, Locomotive, Obys, Cuberto, Immersive Garden, Resn, 14islands, Basement Studio, darkroom.engineering, Bruno Simon, Robin Noguier, Dennis Snellenberg, Aristide Benoist, Igloo Inc, Teenage Engineering, Codrops demos).',\n  'For EVERY entry verify the URL resolves with: curl -sIL -A \"Mozilla/5.0\" -o /dev/null -w \"%{http_code}\" <url>  (accept final 2xx/3xx as verified-2xx-3xx; 403/429/503 bot protection as exists-bot-protected). Drop anything 404 or DNS-failing. Aim for 25-35 entries with specific, technique-level \"borrow\" notes (not generic praise).',\n].join('\\n\\n'), { label: 'reference-library', phase: 'Explore', schema: REFS })\n\nconst directorsPromise = parallel(SEEDS.map((s) => () => agent([\n  'You are one of five independent creative directors pitching a direction for a personal portfolio. Work alone; be bold but buildable.',\n  BRIEF,\n  ANTI,\n  'YOUR TERRITORY: ' + s.territory,\n  'Develop the strongest possible version of this territory. If, while developing it, you find a sharper angle inside it, take it.',\n  'Requirements for your pitch:',\n  '- Read the dossier first (' + DOSSIER + '). Root the concept in TRUE facts about Prajwal. Use his real projects and real roles in the section plan.',\n  '- Answer every one of the 11 required experiences SPECIFICALLY: what moves, how, for how long, with which easing curve, triggered by what, and WHY (its purpose). No vague phrases like \"smooth animations\".',\n  '- The 3D must earn its place: describe the exact object/scene, interaction, and how it degrades on mobile and with reduced motion.',\n  '- Fonts: exact free families from Google Fonts or Fontshare only. Palette: hex values; body text must pass WCAG AA contrast on its background.',\n  '- The contact section must be fully functional on a static site (mailto, copy-email with feedback, real social links). No fake forms.',\n  '- Include page/route transitions (e.g. into project case-study pages) and a mobile/tablet plan (no hover, touch, lower GPU).',\n  '- Performance plan with concrete budgets (DPR clamp, lazy-loaded 3D, shader cost, JS size targets).',\n  '- References: 3-6 REAL existing sites/studios/projects with URL and the specific technique to borrow. Only cite things you are confident exist; verify with curl -sIL -A \"Mozilla/5.0\" -o /dev/null -w \"%{http_code}\" <url> if unsure.',\n  '- asciiHero: plain ASCII, max 56 columns x 16 rows, depicting the first viewport composition with real content.',\n  '- Use id \"' + s.key + '\" unless you rename the territory, in which case use a short kebab-case slug of your new name.',\n  TOOLING,\n].join('\\n\\n'), { label: 'director:' + s.key, phase: 'Explore', schema: DIRECTION })))\n\nconst [refs, conceptsRaw] = await Promise.all([refsPromise, directorsPromise])\nconst concepts = (conceptsRaw || []).filter(Boolean)\nlog(concepts.length + ' concepts: ' + concepts.map((c) => c.name + ' (' + c.id + ')').join(' | ') + '; ' + ((refs && refs.entries) ? refs.entries.length : 0) + ' verified references')\nif (concepts.length < 3) return { error: 'too few concepts', concepts, refs }\n\nphase('Judge')\nconst conceptsJson = JSON.stringify(concepts, null, 1)\nconst judgments = (await parallel(JUDGES.map((j) => () => agent([\n  'You are judging competing creative directions for a personal portfolio. Your lens: ' + j.lens,\n  BRIEF,\n  ANTI,\n  'Read the dossier at ' + DOSSIER + ' to check that each concept is truthful to the person.',\n  'Evaluate EVERY concept below through your lens. Be candid and specific; scores must discriminate (use the full 1-10 range). For each, list strengths, weaknesses and graftable ideas (ideas worth keeping even if the concept loses). Then rank them.',\n  'CONCEPTS (JSON):\\n' + conceptsJson,\n].join('\\n\\n'), { label: 'judge:' + j.key, phase: 'Judge', schema: JUDGE })))).filter(Boolean)\n\nconst tally = {}\nfor (const jd of judgments) for (const ev of jd.evaluations) tally[ev.conceptId] = (tally[ev.conceptId] || 0) + ev.score\nlog('Judge totals: ' + Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + '=' + v).join(', '))\n\nphase('Synthesize')\nconst synth = await agent([\n  'You are the executive creative director. Five directors pitched concepts; three judges scored them; a researcher built a verified reference library.',\n  BRIEF,\n  ANTI,\n  'Read the dossier at ' + DOSSIER + '.',\n  'TASK: choose the 3 concepts that together give Prajwal a GENUINE choice - each excellent on its own AND clearly different from the other two. Vary at least: light vs dark world, 3D intensity (one can be WebGL-forward, one restrained), typographic voice, and the storytelling device. Weigh the judge scores, but distinctiveness between the three matters too.',\n  'For each chosen direction produce the refined FINAL version: fix the weaknesses judges raised, graft the best graftable ideas from non-chosen concepts where they truly fit, sharpen the signature moment, make all 11 required experiences specific and purposeful, keep it buildable as a static Next.js export, ensure fonts are free (Google Fonts / Fontshare) and text colours pass WCAG AA. Prefer references from the verified library (keep a director reference only if it is real). asciiHero must be plain ASCII, max 56 columns x 16 rows, no tabs.',\n  'Keep ids short kebab-case and unique. Then recommend the one you would pitch first, with reasoning - without weakening the other two.',\n  'CONCEPTS (JSON):\\n' + conceptsJson,\n  'JUDGE REPORTS (JSON):\\n' + JSON.stringify(judgments, null, 1),\n  'VERIFIED REFERENCE LIBRARY (JSON):\\n' + JSON.stringify(refs ? refs.entries : [], null, 1),\n].join('\\n\\n'), { label: 'synthesize', phase: 'Synthesize', schema: SYNTH })\nif (!synth) return { error: 'synthesis failed', concepts, judgments, refs }\nlog('Final three: ' + synth.directions.map((d) => d.name + ' (' + d.id + ')').join(' | ') + ' - recommended: ' + synth.recommendation.id)\n\nphase('Sketch')\nconst sketchUrl = (id) => 'file:///' + DESIGN + '/' + id + '/index.html'\nconst shotsDir = (id) => SP + '/shots/' + id\n\nconst buildPrompt = (d) => [\n  'You are a senior creative developer building a LIVE MOTION SKETCH for one creative direction of Prajwal M P\\'s portfolio. Prajwal will open three such sketches in his browser and choose one direction for the full build, so this must look and feel like the real thing at award-winning quality.',\n  BRIEF,\n  ANTI,\n  'DIRECTION SPEC (JSON):\\n' + JSON.stringify(d, null, 1),\n  'Facts: read ' + DOSSIER + ' and use only real content (name, the title \"Full Stack Developer\", real projects, real email).',\n  'BUILD: ' + DESIGN + '/' + d.id + '/index.html (plus optional sketch.js / sketch.css in that folder; create the folder). Static files, no build step, opened via ' + sketchUrl(d.id) + '. Libraries via CDN only (see tooling). Keep it self-contained; no external images (generate visuals with CSS/canvas/WebGL/SVG).',\n  'SCOPE, in priority order:',\n  '1. The opening sequence exactly as specified (<=3.5s total), skippable by click/keypress/wheel; it always plays on load in the sketch.',\n  '2. The hero: the distinctive animated typography + the interactive background reacting to the pointer (with gentle idle motion for touch devices).',\n  '3. Custom cursor (desktop only) and at least one premium hover interaction (e.g. magnetic CTA, project hover reveal).',\n  '4. One scroll-storytelling beat using GSAP ScrollTrigger with Lenis smooth scroll: the transition from hero into a \"Selected work\" moment featuring ONE real project (Drone Intelligence System or Human Brain Tumor Detection - whichever suits the direction) laid out as the spec describes, plus a glimpse of how skills OR experience are presented in this direction.',\n  '5. A closing contact strip with the real email as a working mailto: link (and copy-to-clipboard with visible feedback if the spec calls for it).',\n  'The page should be roughly 3-5 viewports tall. Real text for the name and headings must exist in the DOM (canvas is decoration, aria-hidden).',\n  'QUALITY BAR: typography craft (clamp() sizes, tracking, leading, optical alignment), restrained palette, deliberate composition and negative space, eased and layered motion with purpose, no layout shift, 60fps (clamp WebGL DPR to <=1.5, pause rendering when offscreen/hidden), zero console errors.',\n  'ACCESSIBILITY: semantic landmarks, focus-visible styles, sufficient contrast; with prefers-reduced-motion: skip the intro, render a static background frame, no parallax/scrub, all content visible immediately.',\n  'MOBILE: must look intentional at 390x844 and 834x1194: no custom cursor, touch-friendly targets, reduced GPU load, no horizontal overflow.',\n  TOOLING,\n  'MANDATORY BROWSER VERIFICATION LOOP (save working shots to ' + shotsDir(d.id) + '):',\n  '  a) Intro filmstrip: --frames 0,400,900,1500,2300,3300,4500 (desktop)',\n  '  b) Desktop scroll: --wait 4500 --scroll steps:5 --wheel --settle 1300',\n  '  c) Hover state: --wait 4500 --hover <x,y of your CTA or project>',\n  '  d) Mobile: --viewport mobile --wait 4500 --scroll steps:4 --wheel --settle 1300 ; and tablet once',\n  '  e) Reduced motion: --reduced-motion --wait 1500 --full',\n  'Read every PNG and judge it like an Awwwards juror: composition, hierarchy, type sizes, contrast, empty or broken areas, elements that never animate in, overflow, and the LOGS output. Fix and re-verify. Do at least 2 complete verify-and-fix rounds, more if anything still looks unfinished.',\n  'FINALLY copy the best 5-7 screenshots into ' + DESIGN + '/' + d.id + '/shots/ named like 01-intro.png, 02-hero.png, 03-hover.png, 04-scroll-work.png, 05-scroll-skills.png, 06-mobile.png, 07-reduced-motion.png, and return their absolute paths.',\n].join('\\n\\n')\n\nconst critiquePrompt = (d, built, round) => [\n  'You are an independent Awwwards juror AND senior creative developer reviewing a live motion sketch (review round ' + round + '). Do NOT edit any files.',\n  'The sketch: ' + built.htmlPath + ' (open as ' + sketchUrl(d.id) + '). Builder notes: ' + built.whatItDemonstrates + ' Known gaps: ' + JSON.stringify(built.knownGaps),\n  'DIRECTION SPEC (JSON):\\n' + JSON.stringify(d, null, 1),\n  BRIEF,\n  ANTI,\n  TOOLING,\n  'Take YOUR OWN screenshots into ' + shotsDir(d.id) + '/review' + round + ' : intro filmstrip (--frames 0,400,900,1500,2300,3300,4500), desktop scroll (--wait 4500 --scroll steps:5 --wheel --settle 1300), a hover on the main CTA/project, mobile 390x844 scroll, tablet 834x1194, reduced motion (--reduced-motion --full). Read the source to understand the motion system.',\n  'Judge against the spec and a premium studio bar. What matters most to someone choosing between directions: the first impression, typography craft, motion choreography and easing, background/3D quality, coherence with the spec, mobile quality, and anything broken (console errors, overflow, invisible or overlapping content, jank, contrast failures, unreadable text).',\n  'Verdict: \"premium\" only if you would be proud to show it to a client as-is. Return specific, actionable fixes (what, where in which file, how), ordered by impact, plus what is already excellent and must be preserved.',\n].join('\\n\\n')\n\nconst fixPrompt = (d, built, c, round) => [\n  'You are the senior creative developer who owns this live motion sketch. An independent reviewer returned fixes (round ' + round + '). Apply them with craft.',\n  'Sketch: ' + built.htmlPath + ' (open as ' + sketchUrl(d.id) + ').',\n  'REVIEW (JSON):\\n' + JSON.stringify(c, null, 1),\n  'DIRECTION SPEC (JSON):\\n' + JSON.stringify(d, null, 1),\n  BRIEF,\n  ANTI,\n  TOOLING,\n  'Fix every high and medium item; fix low items when cheap. Preserve what the reviewer praised. Facts only from ' + DOSSIER + '.',\n  'Re-verify in the browser after your changes (intro filmstrip, desktop scroll with --wheel, hover, mobile, tablet, reduced motion) and keep iterating until the result is genuinely premium and error-free.',\n  'Then REPLACE the screenshots in ' + DESIGN + '/' + d.id + '/shots/ with fresh ones (same naming scheme) and return their absolute paths.',\n].join('\\n\\n')\n\nconst sketches = await pipeline(\n  synth.directions,\n  (d) => agent(buildPrompt(d), { label: 'build:' + d.id, phase: 'Sketch', schema: SKETCH }),\n  async (built, d) => {\n    if (!built) return null\n    let current = built\n    const reviews = []\n    for (let round = 1; round <= 2; round++) {\n      const c = await agent(critiquePrompt(d, current, round), { label: 'critique:' + d.id + ':r' + round, phase: 'Sketch', schema: CRITIQUE })\n      if (!c) break\n      reviews.push({ round, verdict: c.verdict, high: c.fixes.filter((f) => f.severity === 'high').length, total: c.fixes.length })\n      const highs = c.fixes.filter((f) => f.severity === 'high').length\n      if (c.verdict === 'premium' && highs === 0 && round > 1) break\n      const r = await agent(fixPrompt(d, current, c, round), { label: 'refine:' + d.id + ':r' + round, phase: 'Sketch', schema: SKETCH })\n      if (r) current = r\n      if (c.verdict === 'premium' && highs === 0) break\n    }\n    log(d.id + ' reviews: ' + JSON.stringify(reviews))\n    return { ...current, reviews }\n  },\n)\n\nphase('Board')\nconst okSketches = sketches.filter(Boolean)\nconst board = await agent([\n  'Build an elegant, neutral COMPARISON BOARD page that lets Prajwal choose between three creative directions for his portfolio.',\n  'Write it to ' + DESIGN + '/index.html (single file; fonts may come from Google Fonts / Fontshare). Open it as file:///' + DESIGN + '/index.html .',\n  'For each direction show: name, one-liner, concept paragraph, signature moment, palette swatches with hex codes, a live type specimen using its actual fonts, a compact list of how it answers the 11 required experiences (opening, hero type, background, scroll story, projects, 3D, cursor/hover, skills, about, contact, mobile), key risks, references as real links, 2-3 screenshots from its shots/ folder (relative paths like ./<id>/shots/02-hero.png), and a prominent \"Open live sketch\" link to ./<id>/index.html . Mark the recommended direction with a subtle \"Recommended\" tag and show the recommendation reasoning.',\n  'The board must not favour one direction stylistically (neutral, refined, readable; light-neutral background), must be responsive (desktop: three columns or a tabbed/stacked comparison; mobile: stacked), and must have zero dead links: check every relative screenshot path exists on disk.',\n  'Verify with the browser tool at desktop (full page) and mobile; Read the screenshots; fix issues.',\n  TOOLING,\n  'DIRECTIONS (JSON):\\n' + JSON.stringify(synth.directions, null, 1),\n  'RECOMMENDATION: ' + JSON.stringify(synth.recommendation) + '\\nWHY THESE THREE: ' + synth.whyTheseThree,\n  'SKETCH RESULTS (JSON):\\n' + JSON.stringify(okSketches, null, 1),\n].join('\\n\\n'), { label: 'board', phase: 'Board', schema: BOARD })\n\nreturn {\n  directions: synth.directions,\n  recommendation: synth.recommendation,\n  whyTheseThree: synth.whyTheseThree,\n  sketches: okSketches,\n  board,\n  judgeTotals: tally,\n  judgeRankings: judgments.map((j) => ({ lens: j.lens.slice(0, 40), ranking: j.ranking, notes: j.notes })),\n  allConcepts: concepts.map((c) => ({ id: c.id, name: c.name, oneLiner: c.oneLiner })),\n  referenceCount: refs && refs.entries ? refs.entries.length : 0,\n}\n"
}
OUT
Workflow launched in background. Task ID: wp4u8q3ub
Summary: Explore, judge, refine and live-prototype three creative directions for Prajwal M P motion portfolio
Transcript dir: C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\1ea4c338-95b1-421e-9894-caa3190369b6\subagents\workflows\wf_5a31129b-5ab
Script file: C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\1ea4c338-95b1-421e-9894-caa3190369b6\workflows\scripts\portfolio-creative-directions-wf_5a31129b-5ab.js
(Edit this file with Write/Edit and re-invoke Workflow with {scriptPath: "C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\1ea4c338-95b1-421e-9894-caa3190369b6\workflows\scripts\portfolio-creative-directions-wf_5a31129b-5ab.js"} to iterate without resending the script.)
Run ID: wf_5a31129b-5ab
To resume after editing the script: Workflow({scriptPath: "C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\1ea4c338-95b1-421e-9894-caa3190369b6\workflows\scripts\portfolio-creative-directions-wf_5a31129b-5ab.js", resumeFromRunId: "wf_5a31129b-5ab"}) — completed agents return cached results (cached results may themselves be empty — inspect journal.jsonl before assuming there is something to recover).

You will be notified when it completes. Use /workflows to watch live progress.
A background direction workflow is running and will notify me when it's done. Meanwhile I'm setting up the Next.js 16 static-export project and checking whether TypeScript 7 is compatible with Next yet.
Bash Check peer dependency compatibility
IN
echo "next peer:"; npm view next@16.4.5 peerDependencies --json; echo "next engines:"; npm view next@16.4.5 engines --json; echo "TS versions (5.x/6.x latest):"; npm view typescript versions --json | python -c "
import json,sys
v=json.load(sys.stdin)
for major in ('5.','6.','7.'):
  s=[x for x in v if x.startswith(major) and '-' not in x]
  print(major, s[-3:] if s else None)
"; echo "r3f peer:"; npm view @react-three/fiber@9.8.2 peerDependencies --json; echo "drei peer:"; npm view @react-three/drei@10.7.9 peerDependencies --json; echo "@gsap/react peer:"; npm view @gsap/react@2.1.2 peerDependencies --json; echo "motion peer:"; npm view motion@14.9.1 peerDependencies --json; echo "@types/three:"; npm view @types/three version

OUT
next peer:
{
  "sass": "^1.3.0",
  "react": "^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0",
  "react-dom": "^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0",
  "@playwright/test": "^1.51.1",
  "@opentelemetry/api": "^1.1.0",
  "babel-plugin-react-compiler": "*"
}
next engines:
{
  "node": ">=20.9.0"
}
TS versions (5.x/6.x latest):
5. ['5.8.3', '5.9.2', '5.9.3']
6. ['6.0.2', '6.0.3']
7. ['7.0.2']
r3f peer:
{
  "expo": ">=43.0",
  "react": ">=19 <19.4",
  "three": ">=0.156",
  "expo-gl": ">=11.0",
  "react-dom": ">=19 <19.4",
  "expo-asset": ">=8.4",
  "react-native": ">=0.78",
  "expo-file-system": ">=11.0"
}
drei peer:
{
  "react": "^19",
  "three": ">=0.159",
  "react-dom": "^19",
  "@react-three/fiber": "^9.0.0"
}
@gsap/react peer:
{
  "gsap": "^3.12.5",
  "react": ">=17"
}
motion peer:
{
  "react": "^18.0.0 || ^19.0.0",
  "remix": "^3.1.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
@types/three:
0.187.0
Everything checks out with React 19.3 and R3F 9, so I'm pinning TypeScript 5.9.3 since TypeScript 7 changes the compiler API Next uses. Next I'll write the project manifest and config.
Write C:\Users\Prajwal\Desktop\Portfolio\package.json
40 lines
{
  "name": "prajwal-portfolio",
  "version": "2.0.0",
  "private": true,
  "description": "Prajwal M P — Full Stack Developer. Creative motion portfolio built with Next.js, GSAP, React Three Fiber and Motion.",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:pages": "cross-env NEXT_PUBLIC_BASE_PATH=/Portfolio next build",
    "preview": "node scripts/serve.mjs",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@gsap/react": "2.1.2",
    "@react-three/drei": "10.7.9",
    "@react-three/fiber": "9.8.2",
    "gsap": "3.15.1",
    "lenis": "1.3.27",
    "motion": "14.9.1",
    "next": "16.4.5",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "three": "0.187.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.3.4",
    "@types/node": "^22.10.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@types/three": "0.187.0",
    "cross-env": "^7.0.3",
    "postcss": "^8.5.0",
    "tailwindcss": "4.3.4",
    "typescript": "5.9.3"
  },
  "engines": {
    "node": ">=20.9.0"
  }
}
Write C:\Users\Prajwal\Desktop\Portfolio\next.config.ts
21 lines
import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages.
 * - Local dev / preview: no base path.
 * - GitHub Pages project site (https://prajwalps2603.github.io/Portfolio/):
 *   build with NEXT_PUBLIC_BASE_PATH=/Portfolio (see `npm run build:pages` and .github/workflows/deploy.yml).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
Write C:\Users\Prajwal\Desktop\Portfolio\tsconfig.json
23 lines
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "noUncheckedIndexedAccess": false,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "src/**/*.glsl.d.ts"],
  "exclude": ["node_modules", "design", "out"]
}
Write C:\Users\Prajwal\Desktop\Portfolio\postcss.config.mjs
8 lines
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
Write C:\Users\Prajwal\Desktop\Portfolio\.gitignore
21 lines
# dependencies
/node_modules

# next.js
/.next/
/out/
next-env.d.ts
*.tsbuildinfo

# logs & os
npm-debug.log*
.DS_Store
Thumbs.db

# env
.env*
!.env.example

# local design screenshots (sketch folders themselves are kept)
/design/**/review*/
11:06 AM
Installing dependencies in the background while I write the typed content model:



Bash Install project dependencies
IN
cd "/c/Users/Prajwal/Desktop/Portfolio" && npm install --no-audit --no-fund 2>&1 | tail -15

OUT
Command running in background with ID: blmfard8r. Output is being written to: C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\tasks\blmfard8r.output. You will be notified when it completes — do not poll that file or sleep while waiting. Read the file only if the user asks for progress, or if you need a line it prints before you can go on, such as a server's ready line or port.
Session cwd remains C:\Users\Prajwal\Desktop\Portfolio; directory changes made by the backgrounded command do not apply to subsequent commands.
The content model is next: every fact will trace back to your resume, cover letter, GitHub READMEs or old portfolio data, with skills linked to the projects that prove them.
Write C:\Users\Prajwal\Desktop\Portfolio\src\content\types.ts
116 lines
/**
 * Content model for the portfolio.
 * Every fact in /src/content comes from Prajwal's résumé, cover letter, public GitHub READMEs,
 * or the data files of his previous portfolio. Do not add unverifiable claims.
 */

export type ExternalLink = {
  label: string;
  href: string;
};

export type Social = ExternalLink & {
  handle: string;
  kind: "github" | "linkedin" | "x" | "instagram" | "email";
};

export type Profile = {
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  location: string;
  email: string;
  /** One-sentence positioning statement. */
  statement: string;
  /** Longer professional summary (résumé). */
  summary: string;
  /** His own words (GitHub profile README). */
  inHisWords: string;
  /** Short paragraphs for an About section. */
  about: string[];
  /** The factual journey: places that shaped him. */
  route: { place: string; region: string; chapter: string; years: string }[];
  currentFocus: string[];
  learning: string[];
  availability: string;
  socials: Social[];
  resume: ExternalLink;
};

export type ExperienceItem = {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string; // "2025-12"
  end: string | null; // null = present
  periodLabel: string;
  durationLabel?: string;
  type: "Full-time" | "Internship";
  current: boolean;
  summary: string;
  highlights: string[];
  stack: string[];
};

export type ArchitectureLayer = {
  /** Layer of the system, top (user) to bottom (infrastructure). */
  layer: "Interface" | "API" | "Intelligence" | "Data" | "Infrastructure";
  items: string[];
  note?: string;
};

export type Project = {
  id: string;
  title: string;
  shortTitle: string;
  /** Approximate year (from résumé or repository history). */
  year: string;
  category: string;
  featured: boolean;
  tagline: string;
  summary: string;
  problem?: string;
  approach?: string;
  highlights: string[];
  /** Only real, verifiable numbers. */
  metrics: { value: string; label: string }[];
  award?: string;
  stack: string[];
  architecture: ArchitectureLayer[];
  /** Data/request flow through the system, in order. */
  flow?: string[];
  links: { repo?: string; live?: string };
};

export type SkillGroup = {
  id: string;
  label: string;
  /** Maps to a layer of the stack, useful for layered/system visualisations. */
  layer: "Interface" | "API" | "Intelligence" | "Data" | "Infrastructure" | "Languages" | "Practice";
  description: string;
  skills: { name: string; usedIn: string[] }[];
};

export type EducationItem = {
  id: string;
  institution: string;
  qualification: string;
  field: string;
  location: string;
  period: string;
  grade: string;
  note?: string;
};

export type Certification = {
  id: string;
  title: string;
  issuer: string;
  year: string;
  kind: "Certification" | "Award";
  href?: string;
  note?: string;
};
Write C:\Users\Prajwal\Desktop\Portfolio\src\content\profile.ts
41 lines
import type { Profile } from "./types";

export const profile: Profile = {
  name: "Prajwal M P",
  firstName: "Prajwal",
  lastName: "M P",
  // Current role (Maruti Flex Traders LLP, Dec 2025 – present).
  title: "Full Stack Developer",
  location: "Bengaluru, India",
  email: "prajwalnair2603@gmail.com",
  statement:
    "I build complete systems end-to-end — interfaces, APIs, data and AI — and ship them to production.",
  summary:
    "Full Stack Developer with hands-on experience building end-to-end production applications using JavaScript, React, Next.js, MongoDB and REST APIs. Experienced across frontend, backend, database integration, testing, deployment and maintenance, with a strong foundation in Java, Spring Boot, PostgreSQL and AI-based application development — focused on clean, scalable solutions.",
  inHisWords:
    "I enjoy turning ideas into complete applications — from designing responsive frontend interfaces and developing backend APIs to integrating databases, implementing business logic, deploying applications, and continuously improving them.",
  about: [
    "I trained as an Electronics & Communication engineer — signals, circuits, embedded systems — and found that what I loved most was making things that work end-to-end.",
    "Today I'm a Full Stack Developer at Maruti Flex Traders, building the production software behind TVS showroom and Maruti Flex operations: React and Next.js interfaces, Google Apps Script automation, MongoDB and Google Sheets data workflows.",
    "Outside work I build AI products — RAG platforms on Gemini and ChromaDB, an MCP server, speech-to-text pipelines — and my final-year brain-tumour detection model (97% accuracy) took first place at KVGCE.",
  ],
  route: [
    { place: "Koppa", region: "Malnad, Karnataka", chapter: "Schooling", years: "2009 – 2021" },
    { place: "Sullia", region: "Dakshina Kannada", chapter: "BE, Electronics & Communication", years: "2021 – 2025" },
    { place: "Bengaluru", region: "Karnataka", chapter: "Full Stack Developer", years: "2025 – now" },
  ],
  currentFocus: ["Full stack development", "AI-powered systems", "Spring Boot & cloud"],
  learning: ["Spring Security", "Microservices", "Python backends", "Cloud & DevOps", "Agentic AI"],
  availability: "Open to new opportunities",
  socials: [
    { kind: "github", label: "GitHub", handle: "Prajwalps2603", href: "https://github.com/Prajwalps2603" },
    { kind: "linkedin", label: "LinkedIn", handle: "prajwal-m-p", href: "https://www.linkedin.com/in/prajwal-m-p-190131246" },
    { kind: "x", label: "X", handle: "@PrajwalNair2603", href: "https://x.com/PrajwalNair2603" },
    { kind: "instagram", label: "Instagram", handle: "prajwal_shobha", href: "https://www.instagram.com/prajwal_shobha/" },
  ],
  resume: {
    label: "Résumé",
    href: "https://drive.google.com/file/d/1Q2PdoT5zwjvTVzYTgNlgHAexpmRiYH3k/view?usp=sharing",
  },
};
Write C:\Users\Prajwal\Desktop\Portfolio\src\content\experience.ts
82 lines
import type { ExperienceItem } from "./types";

export const experience: ExperienceItem[] = [
  {
    id: "maruti-flex",
    role: "Full Stack Developer",
    company: "Maruti Flex Traders LLP",
    location: "Karnataka, India",
    start: "2025-12",
    end: null,
    periodLabel: "Dec 2025 — Present",
    type: "Full-time",
    current: true,
    summary:
      "Building and maintaining the end-to-end production applications that run TVS showroom and Maruti Flex operations.",
    highlights: [
      "Develop and maintain end-to-end production applications for TVS showroom & Maruti Flex operations using JavaScript, React/Next.js, Google Apps Script, Google Sheets and MongoDB.",
      "Build responsive user interfaces and integrate them with backend services, APIs and data-management workflows.",
      "Write backend business logic and automation in Google Apps Script that supports day-to-day operational processes.",
    ],
    stack: ["React", "Next.js", "JavaScript", "MongoDB", "Google Apps Script", "Google Sheets", "REST APIs"],
  },
  {
    id: "dyashin",
    role: "Java Full Stack Developer Intern",
    company: "Dyashin Technosoft Pvt Ltd",
    location: "Bengaluru · On-site",
    start: "2025-02",
    end: "2025-10",
    periodLabel: "Feb 2025 — Oct 2025",
    durationLabel: "9 months",
    type: "Internship",
    current: false,
    summary:
      "Trained in Core Java, Spring Boot, Hibernate, REST APIs and frontend technologies; built and deployed full-stack web applications.",
    highlights: [
      "Developed and deployed full-stack web applications with Java, Spring Boot, React and MySQL.",
      "Built RESTful APIs and integrated frontend applications with backend services.",
      "Worked in an Agile team with Git version control, pull requests and code reviews.",
    ],
    stack: ["Java", "Spring Boot", "Hibernate", "React", "MySQL", "REST APIs", "Git"],
  },
  {
    id: "rooman",
    role: "Machine Learning Intern",
    company: "Rooman Technologies",
    location: "Dakshina Kannada · Hybrid",
    start: "2024-09",
    end: "2025-05",
    periodLabel: "Sep 2024 — May 2025",
    durationLabel: "9 months",
    type: "Internship",
    current: false,
    summary:
      "Hands-on machine learning: data analysis, preprocessing and building and evaluating predictive models in Python.",
    highlights: [
      "Built, evaluated and tuned predictive models with Python ML libraries.",
      "Performed exploratory data analysis, preprocessing and model evaluation.",
    ],
    stack: ["Python", "Machine Learning", "Data Analysis"],
  },
  {
    id: "techbyheart",
    role: "Cloud & Cybersecurity Intern",
    company: "Techbyheart (TBH)",
    location: "Sullia · On-site",
    start: "2023-10",
    end: "2023-11",
    periodLabel: "Oct 2023 — Nov 2023",
    durationLabel: "2 months",
    type: "Internship",
    current: false,
    summary:
      "AWS cloud training (EC2, S3, RDS, deployment) and cybersecurity fundamentals — network security, threat detection and vulnerability assessment.",
    highlights: [
      "Provisioned and managed AWS infrastructure including EC2 instances, S3 and RDS.",
      "Studied network security, threat detection and vulnerability assessment.",
    ],
    stack: ["AWS EC2", "S3", "RDS", "Network Security"],
  },
];
11:07 AM
Small correction: no source gives a location for Maruti Flex, so I'm making that field optional rather than guessing.



Edit C:\Users\Prajwal\Desktop\Portfolio\src\content\types.ts
Modified
Edit C:\Users\Prajwal\Desktop\Portfolio\src\content\experience.ts
Removed 1 line
Write C:\Users\Prajwal\Desktop\Portfolio\src\content\projects.ts
364 lines
import type { Project } from "./types";

/**
 * Projects, ordered by showcase priority.
 * `featured` projects get full case-study treatment; the rest appear in the archive index.
 * Years are approximate (résumé / repository history). Links verified 2026-11-05.
 */
export const projects: Project[] = [
  {
    id: "drone-intelligence",
    title: "Drone Intelligence System",
    shortTitle: "Drone Intelligence",
    year: "2026",
    category: "AI platform · Full stack",
    featured: true,
    tagline: "A RAG-powered knowledge hub for India's drone ecosystem.",
    summary:
      "A full-stack AI platform for Indian drone regulations, analytics and operational insight — ask questions of DGCA rules in plain language, check flight compliance, and model flight time and ROI.",
    problem:
      "Indian drone regulations (DGCA rules, airspace zones, permissions) are scattered across documents, making it slow and error-prone for operators to know what is allowed.",
    approach:
      "A retrieval-augmented generation pipeline grounds Gemini's answers in indexed regulation documents, while FastAPI services power the compliance checker and mission calculators.",
    highlights: [
      "RAG chatbot built on Google Gemini, ChromaDB and Sentence Transformers for grounded question answering.",
      "Document upload and vector-indexing pipeline so users can add their own knowledge sources.",
      "Drone compliance checker, flight-time calculator and ROI calculator exposed as FastAPI REST endpoints.",
      "Real-time WebSocket streaming, Docker deployment, and an MCP server for Claude Desktop integration.",
    ],
    metrics: [],
    stack: ["React 19", "FastAPI", "Python", "ChromaDB", "Gemini", "Sentence Transformers", "WebSockets", "Docker"],
    architecture: [
      { layer: "Interface", items: ["React 19 dashboard", "Chat", "Calculators"] },
      { layer: "API", items: ["FastAPI REST", "WebSockets", "MCP server"] },
      { layer: "Intelligence", items: ["Gemini", "Sentence Transformers", "RAG pipeline"] },
      { layer: "Data", items: ["ChromaDB vectors", "Document index"] },
      { layer: "Infrastructure", items: ["Docker"] },
    ],
    flow: ["Question", "Embed", "Retrieve from ChromaDB", "Ground Gemini", "Stream answer"],
    links: { repo: "https://github.com/Prajwalps2603/Drone-Intelligence-System" },
  },
  {
    id: "brain-tumor-detection",
    title: "Human Brain Tumor Detection",
    shortTitle: "Brain Tumor Detection",
    year: "2025",
    category: "Deep learning · Web",
    featured: true,
    tagline: "A CNN that reads MRI scans — first place, final-year project.",
    summary:
      "A deep-learning system that classifies brain MRI scans as tumour or non-tumour, served through a web app where a user uploads a scan and gets a real-time prediction.",
    problem:
      "Screening MRI scans for tumours takes specialist time; a fast first-pass classifier can help prioritise scans.",
    approach:
      "A convolutional neural network trained on 12,000+ MRI images with preprocessing and augmentation, deployed behind a Flask inference API with a web upload interface.",
    highlights: [
      "Convolutional Neural Network trained on 12,000+ MRI images, reaching ~97% prediction accuracy.",
      "Image preprocessing and augmentation pipeline, training, evaluation and deployment workflow.",
      "Flask web application: upload an MRI scan and receive the classification in real time.",
      "Frontend and backend integrated end-to-end for medical image analysis.",
    ],
    metrics: [
      { value: "97%", label: "prediction accuracy" },
      { value: "12,000+", label: "MRI images" },
      { value: "1st", label: "place, BE final year" },
    ],
    award: "1st Place — BE Final Year Project, KVGCE 2025",
    stack: ["Python", "TensorFlow", "Keras", "Flask", "React", "OpenCV", "NumPy"],
    architecture: [
      { layer: "Interface", items: ["Scan upload UI"] },
      { layer: "API", items: ["Flask inference API"] },
      { layer: "Intelligence", items: ["CNN (TensorFlow / Keras)", "Preprocessing & augmentation"] },
      { layer: "Data", items: ["12,000+ MRI images"] },
    ],
    flow: ["Upload scan", "Preprocess & resize", "CNN inference", "Prediction"],
    links: { repo: "https://github.com/Prajwalps2603/Human_Brain_Tumor_Detection" },
  },
  {
    id: "resumai",
    title: "ResumAI — AI Resume Builder",
    shortTitle: "ResumAI",
    year: "2026",
    category: "AI product · Full stack",
    featured: true,
    tagline: "Resume intelligence that reverse-engineers the job description.",
    summary:
      "An AI resume studio that analyses job descriptions, diagnoses ATS issues and generates a tailored résumé, cover letter and recruiter pitch together — with a live split-screen A4 editor.",
    highlights: [
      "ATS diagnostic engine that detects keyword gaps and formatting flaws against a target job description.",
      "Live split-screen studio with real-time A4 preview and six ATS-safe templates.",
      "Generates synchronized résumé, cover letter and recruiter outreach from one profile.",
      "\"6-second glance\" heatmap simulating what recruiters notice first; printable vector PDF export.",
    ],
    metrics: [{ value: "6", label: "ATS-safe templates" }],
    stack: ["Next.js 14", "TypeScript", "Tailwind CSS", "Framer Motion", "FastAPI", "PostgreSQL", "JWT", "OpenAI API"],
    architecture: [
      { layer: "Interface", items: ["Next.js App Router", "Split-screen A4 studio"] },
      { layer: "API", items: ["FastAPI", "JWT auth"] },
      { layer: "Intelligence", items: ["OpenAI API", "ATS diagnostics"] },
      { layer: "Data", items: ["PostgreSQL", "Career vault"] },
    ],
    flow: ["Paste JD", "Diagnose gaps", "Tailor", "Export PDF"],
    links: { repo: "https://github.com/Prajwalps2603/AI-Resume-Builder" },
  },
  {
    id: "audify-ai",
    title: "Audify AI",
    shortTitle: "Audify AI",
    year: "2026",
    category: "Mobile · Voice AI",
    featured: true,
    tagline: "Record, transcribe, organise — call intelligence for telecallers.",
    summary:
      "An Android app for telecallers that discovers call recordings, matches them to call logs, backs them up to Google Drive, transcribes them with speaker diarization and syncs summaries into Google Sheets.",
    highlights: [
      "Discovers recordings on-device and matches them to call metadata with fuzzy time-window matching.",
      "Pluggable speech-to-text: Google Cloud STT v2, OpenAI Whisper, Deepgram and AssemblyAI, with diarization.",
      "Backs up audio to Google Drive and syncs structured call summaries to Google Sheets.",
      "Hardened HTTPS Node.js / Express backend.",
    ],
    metrics: [{ value: "4", label: "speech-to-text providers" }],
    stack: ["React Native", "TypeScript", "Node.js", "Express", "Google Drive API", "Google Sheets API", "OAuth 2.0", "Speech-to-Text"],
    architecture: [
      { layer: "Interface", items: ["React Native (Android)"] },
      { layer: "API", items: ["Node.js / Express (HTTPS)", "OAuth 2.0"] },
      { layer: "Intelligence", items: ["Multi-provider speech-to-text", "Diarization"] },
      { layer: "Data", items: ["Google Drive", "Google Sheets CRM"] },
    ],
    flow: ["Discover recording", "Match call log", "Back up to Drive", "Transcribe", "Sync to Sheets"],
    links: { repo: "https://github.com/Prajwalps2603/Audify-AI" },
  },
  {
    id: "bookmyvenue",
    title: "BookMyVenue",
    shortTitle: "BookMyVenue",
    year: "2026",
    category: "Full stack · Live",
    featured: true,
    tagline: "Find it. Lock the date. Celebrate.",
    summary:
      "A full-stack venue booking platform for weddings, parties and corporate events — browse venues, see free dates, pay an advance and get a ticket, with the server guaranteeing no two people can book the same day.",
    highlights: [
      "Server-side guarantee against double-booking a venue date.",
      "JWT authentication with bcrypt password hashing.",
      "Live demo runs a mini API in the browser so every feature works on static hosting.",
      "20 passing tests; deployed automatically with GitHub Actions.",
    ],
    metrics: [{ value: "20", label: "passing tests" }],
    stack: ["React 18", "Vite", "Express", "JWT", "bcrypt", "GitHub Actions"],
    architecture: [
      { layer: "Interface", items: ["React 18 + Vite"] },
      { layer: "API", items: ["Express", "JWT auth"] },
      { layer: "Data", items: ["JSON datastore"] },
      { layer: "Infrastructure", items: ["GitHub Actions", "GitHub Pages"] },
    ],
    flow: ["Browse venues", "Check dates", "Pay advance", "Get ticket"],
    links: {
      repo: "https://github.com/Prajwalps2603/BookMyVenue",
      live: "https://prajwalps2603.github.io/BookMyVenue/",
    },
  },
  {
    id: "mcp-job-agent",
    title: "Custom MCP Server & Auto Job Agent",
    shortTitle: "MCP Job Agent",
    year: "2026",
    category: "Agentic AI · Automation",
    featured: true,
    tagline: "A Model Context Protocol server that powers an end-to-end job-application agent.",
    summary:
      "An automation system built on the Model Context Protocol: it discovers and parses job descriptions, gates eligibility, tailors LaTeX résumés, fills application forms with Playwright, and tracks everything in Google Sheets and Drive.",
    highlights: [
      "Custom MCP server for querying jobs and extracting requirements.",
      "Job-description parsing, skill-overlap scoring and hard eligibility gating.",
      "Generates tailored LaTeX résumés compiled via Overleaf / pdflatex.",
      "Playwright form automation with review-only pre-submission validation and full audit logs in Google Sheets.",
    ],
    metrics: [],
    stack: ["TypeScript", "Model Context Protocol", "Playwright", "Google Sheets API", "Google Drive API", "LaTeX"],
    architecture: [
      { layer: "Interface", items: ["Claude / MCP client"] },
      { layer: "API", items: ["Custom MCP server"] },
      { layer: "Intelligence", items: ["JD parsing", "Résumé tailoring"] },
      { layer: "Data", items: ["Google Sheets", "Google Drive"] },
      { layer: "Infrastructure", items: ["Playwright automation"] },
    ],
    flow: ["Discover job", "Parse & gate", "Tailor résumé", "Prepare application", "Log"],
    links: { repo: "https://github.com/Prajwalps2603/Custom-MCP-Server" },
  },

  // ——— Archive ———
  {
    id: "markvault",
    title: "MarkVault",
    shortTitle: "MarkVault",
    year: "2026",
    category: "Full stack · Realtime",
    featured: false,
    tagline: "A smart bookmark manager with realtime sync and AI summaries.",
    summary:
      "Full-stack bookmark manager with Supabase auth, realtime sync and row-level security, AI summaries, reminders, collaborative folders, tags and Ctrl+K fuzzy search.",
    highlights: [],
    metrics: [],
    stack: ["Next.js 16", "Supabase", "PostgreSQL", "Tailwind CSS v4", "Framer Motion", "OpenAI API"],
    architecture: [
      { layer: "Interface", items: ["Next.js 16"] },
      { layer: "API", items: ["Supabase Auth & Realtime"] },
      { layer: "Data", items: ["PostgreSQL + RLS"] },
    ],
    links: { repo: "https://github.com/Prajwalps2603/MarkVault-Smart-BooKMark-App" },
  },
  {
    id: "lifesync",
    title: "LifeSync AI",
    shortTitle: "LifeSync AI",
    year: "2026",
    category: "AI · Productivity",
    featured: false,
    tagline: "An intelligent life operating system with Gemini-powered RAG.",
    summary:
      "Tasks, goals, notes, habits and finances in one workspace, with an AI companion grounded in your own data via Gemini RAG, plus role-based access control.",
    highlights: [],
    metrics: [],
    stack: ["React 19", "TypeScript", "Vite", "Express 5", "Gemini", "Firebase"],
    architecture: [
      { layer: "Interface", items: ["React 19"] },
      { layer: "API", items: ["Express 5", "RBAC"] },
      { layer: "Intelligence", items: ["Gemini RAG"] },
      { layer: "Data", items: ["Firebase"] },
    ],
    links: { repo: "https://github.com/Prajwalps2603/LifeSync" },
  },
  {
    id: "smart-ambulance",
    title: "Smart Ambulance Traffic Clearance",
    shortTitle: "Smart Ambulance",
    year: "2025",
    category: "IoT · Realtime",
    featured: false,
    tagline: "Clearing the road ahead of an ambulance with MQTT, ESP32s and live tracking.",
    summary:
      "IoT prototype: a mobile app streams ambulance location to a Node.js backend that publishes MQTT alerts to roadside smart poles and pre-empts traffic lights on the route, with a live Socket.IO control centre.",
    highlights: [],
    metrics: [],
    stack: ["Node.js", "Express", "Socket.IO", "MQTT", "ESP32", "Flutter", "Docker"],
    architecture: [
      { layer: "Interface", items: ["Flutter app", "Control centre"] },
      { layer: "API", items: ["Express", "Socket.IO"] },
      { layer: "Data", items: ["MQTT topics"] },
      { layer: "Infrastructure", items: ["ESP32 firmware", "Mosquitto", "Docker"] },
    ],
    links: { repo: "https://github.com/Prajwalps2603/smart-ambulance-traffic-clearance" },
  },
  {
    id: "buddy",
    title: "Buddy",
    shortTitle: "Buddy",
    year: "2026",
    category: "Web app · Live",
    featured: false,
    tagline: "Expenses, budgets, calendar and documents — encrypted in your own Google Drive.",
    summary:
      "A personal organiser that keeps expenses, budgets, calendar and documents organised and encrypted in the user's own Google Drive.",
    highlights: [],
    metrics: [],
    stack: ["JavaScript", "Google Drive API"],
    architecture: [
      { layer: "Interface", items: ["Web app"] },
      { layer: "Data", items: ["User's Google Drive (encrypted)"] },
    ],
    links: { live: "https://prajwalps2603.github.io/Buddy/", repo: "https://github.com/Prajwalps2603/Buddy" },
  },
  {
    id: "livora",
    title: "Livora",
    shortTitle: "Livora",
    year: "2026",
    category: "Web · Motion",
    featured: false,
    tagline: "A studio website where the software builds itself in front of you.",
    summary:
      "Website for LIVORA, a studio building custom web apps, Android apps and internal business software — with a self-assembling system hero, a 3D tech keyboard and motion that explains something.",
    highlights: [],
    metrics: [],
    stack: ["React 19", "Vite", "Framer Motion"],
    architecture: [{ layer: "Interface", items: ["React 19 + Vite", "Framer Motion"] }],
    links: { live: "https://prajwalps2603.github.io/Livora/" },
  },
  {
    id: "campus-connect",
    title: "Campus Connect",
    shortTitle: "Campus Connect",
    year: "2025",
    category: "Full stack · Social",
    featured: false,
    tagline: "A social and learning platform for college students.",
    summary:
      "Social feed, follows and notifications plus an EduHub for sharing notes and projects, with JWT auth, file uploads and PostgreSQL persistence.",
    highlights: [],
    metrics: [],
    stack: ["JavaScript", "Node.js", "Express", "PostgreSQL", "JWT"],
    architecture: [
      { layer: "Interface", items: ["HTML / CSS / JS"] },
      { layer: "API", items: ["Express", "JWT"] },
      { layer: "Data", items: ["PostgreSQL"] },
    ],
    links: { repo: "https://github.com/Prajwalps2603/Campus_Connect" },
  },
  {
    id: "accident-detection",
    title: "Road Accident Detection & Alert",
    shortTitle: "Accident Detection",
    year: "2025",
    category: "Computer vision",
    featured: false,
    tagline: "Computer vision that detects road accidents and triggers an emergency response.",
    summary:
      "Detects accidents from video with OpenCV, sounds an alert, captures a timestamped screenshot of the scene and lets authorised personnel call an ambulance via Twilio.",
    highlights: [],
    metrics: [],
    stack: ["Python", "OpenCV", "Twilio"],
    architecture: [
      { layer: "Intelligence", items: ["OpenCV detection"] },
      { layer: "API", items: ["Twilio"] },
    ],
    links: { repo: "https://github.com/Prajwalps2603/Vechile-Accident-System" },
  },
  {
    id: "sudoku-solver",
    title: "Sudoku Solver",
    shortTitle: "Sudoku Solver",
    year: "2026",
    category: "Java · Algorithms",
    featured: false,
    tagline: "Backtracking and recursion, made playable.",
    summary: "Java Sudoku generation, validation and backtracking solver with an interactive web grid.",
    highlights: [],
    metrics: [],
    stack: ["Java", "Backtracking", "HTML", "CSS"],
    architecture: [
      { layer: "Interface", items: ["Web grid"] },
      { layer: "Intelligence", items: ["Backtracking solver (Java)"] },
    ],
    links: { repo: "https://github.com/Prajwalps2603/Sudoku-Solver-DSA" },
  },
  {
    id: "cloudscape",
    title: "CloudScape — AWS Web Hosting",
    shortTitle: "CloudScape",
    year: "2025",
    category: "Cloud",
    featured: false,
    tagline: "Web hosting on AWS with EC2 and S3.",
    summary: "Deploys a web application with Amazon EC2 for the server and Amazon S3 for static assets.",
    highlights: [],
    metrics: [],
    stack: ["AWS EC2", "Amazon S3"],
    architecture: [{ layer: "Infrastructure", items: ["EC2", "S3"] }],
    links: { repo: "https://github.com/Prajwalps2603/AWS-Web-Hosting" },
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const archiveProjects = projects.filter((p) => !p.featured);
Background command "Install project dependencies" completed (exit code 0)
Bash Check install output and installed versions
IN
cat "C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/tasks/blmfard8r.output"; cd /c/Users/Prajwal/Desktop/Portfolio && ls node_modules | wc -l && node -e "for (const p of ['next','react','three','gsap','@react-three/fiber','@react-three/drei','motion','lenis','tailwindcss','typescript']) console.log(p, require(p+'/package.json').version)"

OUT
Exit code 1

added 117 packages in 1m

[exited with code 0]
92
next 16.4.5
react 19.3.1
node:internal/modules/cjs/loader:686
      throw e;
      ^

Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './package.json' is not defined by "exports" in C:\Users\Prajwal\Desktop\Portfolio\node_modules\three\package.json
    at exportsNotFound (node:internal/modules/esm/resolve:314:10)
    at packageExportsResolve (node:internal/modules/esm/resolve:662:9)
    at resolveExports (node:internal/modules/cjs/loader:679:36)
    at Module._findPath (node:internal/modules/cjs/loader:746:31)
    at Module._resolveFilename (node:internal/modules/cjs/loader:1433:27)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1059:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1064:22)
    at Module._load (node:internal/modules/cjs/loader:1234:25)
    at TracingChannel.traceSync (node:diagnostics_channel:328:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:245:24) {
  code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'
}

Node.js v24.13.1
11:09 AM
Dependencies installed (117 packages; the error was only my version-check script tripping on Three's exports map). Continuing with skills, education, certifications and site metadata:



Write C:\Users\Prajwal\Desktop\Portfolio\src\content\skills.ts
110 lines
import type { SkillGroup } from "./types";

/**
 * Skills grouped by layer of the stack. `usedIn` points at project ids or experience ids
 * so every skill can be shown with evidence instead of self-ratings.
 */
export const skillGroups: SkillGroup[] = [
  {
    id: "interface",
    label: "Interface",
    layer: "Interface",
    description: "Responsive, component-driven interfaces for web and mobile.",
    skills: [
      { name: "React 19", usedIn: ["maruti-flex", "drone-intelligence", "lifesync", "livora"] },
      { name: "Next.js", usedIn: ["maruti-flex", "resumai", "markvault"] },
      { name: "TypeScript", usedIn: ["resumai", "audify-ai", "mcp-job-agent", "markvault"] },
      { name: "Tailwind CSS", usedIn: ["resumai", "markvault"] },
      { name: "Framer Motion", usedIn: ["resumai", "markvault", "livora"] },
      { name: "React Native", usedIn: ["audify-ai"] },
      { name: "HTML5 & CSS3", usedIn: ["campus-connect", "sudoku-solver"] },
      { name: "Bootstrap", usedIn: [] },
    ],
  },
  {
    id: "api",
    label: "Server & APIs",
    layer: "API",
    description: "Business logic, REST APIs, realtime channels and automation.",
    skills: [
      { name: "Spring Boot", usedIn: ["dyashin"] },
      { name: "Hibernate & JDBC", usedIn: ["dyashin"] },
      { name: "Node.js & Express", usedIn: ["audify-ai", "bookmyvenue", "smart-ambulance", "campus-connect"] },
      { name: "FastAPI", usedIn: ["drone-intelligence", "resumai"] },
      { name: "Flask", usedIn: ["brain-tumor-detection"] },
      { name: "REST APIs", usedIn: ["maruti-flex", "dyashin", "drone-intelligence"] },
      { name: "WebSockets & Socket.IO", usedIn: ["drone-intelligence", "smart-ambulance"] },
      { name: "Google Apps Script", usedIn: ["maruti-flex"] },
      { name: "JWT & OAuth 2.0", usedIn: ["bookmyvenue", "resumai", "audify-ai"] },
    ],
  },
  {
    id: "data",
    label: "Data",
    layer: "Data",
    description: "Relational, document and vector stores — and spreadsheets as real-world data layers.",
    skills: [
      { name: "PostgreSQL", usedIn: ["resumai", "markvault", "campus-connect"] },
      { name: "MySQL", usedIn: ["dyashin"] },
      { name: "MongoDB", usedIn: ["maruti-flex"] },
      { name: "Supabase", usedIn: ["markvault"] },
      { name: "Firebase", usedIn: ["lifesync"] },
      { name: "ChromaDB", usedIn: ["drone-intelligence"] },
      { name: "Google Sheets & Drive", usedIn: ["maruti-flex", "audify-ai", "mcp-job-agent"] },
    ],
  },
  {
    id: "intelligence",
    label: "AI",
    layer: "Intelligence",
    description: "Retrieval-augmented generation, LLM integration, agents and deep learning.",
    skills: [
      { name: "RAG pipelines", usedIn: ["drone-intelligence", "lifesync"] },
      { name: "Google Gemini", usedIn: ["drone-intelligence", "lifesync"] },
      { name: "OpenAI API", usedIn: ["resumai", "markvault"] },
      { name: "Model Context Protocol", usedIn: ["mcp-job-agent", "drone-intelligence"] },
      { name: "TensorFlow & Keras", usedIn: ["brain-tumor-detection"] },
      { name: "CNNs & computer vision", usedIn: ["brain-tumor-detection", "accident-detection"] },
      { name: "Sentence Transformers", usedIn: ["drone-intelligence"] },
      { name: "Speech-to-text", usedIn: ["audify-ai"] },
    ],
  },
  {
    id: "infrastructure",
    label: "Cloud & Delivery",
    layer: "Infrastructure",
    description: "Shipping and running software: containers, cloud, CI and tooling.",
    skills: [
      { name: "Docker", usedIn: ["drone-intelligence", "smart-ambulance"] },
      { name: "AWS — EC2, S3, RDS", usedIn: ["techbyheart", "cloudscape"] },
      { name: "GitHub Actions", usedIn: ["bookmyvenue"] },
      { name: "Git & GitHub", usedIn: ["dyashin"] },
      { name: "Linux", usedIn: [] },
      { name: "Maven", usedIn: ["dyashin"] },
      { name: "Postman", usedIn: [] },
      { name: "Playwright", usedIn: ["mcp-job-agent"] },
    ],
  },
  {
    id: "languages",
    label: "Languages",
    layer: "Languages",
    description: "The languages underneath it all.",
    skills: [
      { name: "Java 21", usedIn: ["dyashin", "sudoku-solver"] },
      { name: "JavaScript", usedIn: ["maruti-flex", "bookmyvenue"] },
      { name: "TypeScript", usedIn: ["resumai", "audify-ai"] },
      { name: "Python", usedIn: ["drone-intelligence", "brain-tumor-detection", "rooman"] },
      { name: "SQL", usedIn: ["dyashin", "resumai"] },
    ],
  },
];

/** Practices & ways of working (no self-ratings). */
export const practices = [
  "End-to-end ownership: UI → API → data → deployment",
  "Agile delivery with Git, pull requests and code review",
  "MVC and clean, modular architecture",
  "Testing, deployment and long-term maintenance",
];
Write C:\Users\Prajwal\Desktop\Portfolio\src\content\education.ts
68 lines
import type { Certification, EducationItem } from "./types";

export const education: EducationItem[] = [
  {
    id: "kvgce",
    institution: "KVG College of Engineering",
    qualification: "Bachelor of Engineering",
    field: "Electronics & Communication Engineering",
    location: "Sullia, Karnataka",
    period: "2021 — 2025",
    grade: "7.9 CGPA",
    note: "1st Place — BE Final Year Project (Brain Tumor Detection)",
  },
  {
    id: "bharath-matha-pu",
    institution: "Bharath Matha PU College",
    qualification: "Pre-University (Science)",
    field: "Physics, Chemistry, Mathematics, Computer Science",
    location: "Koppa, Karnataka",
    period: "2019 — 2021",
    grade: "72%",
  },
  {
    id: "bharath-matha-school",
    institution: "Bharath Matha High School",
    qualification: "SSLC (Class X)",
    field: "Secondary school",
    location: "Koppa, Karnataka",
    period: "2009 — 2019",
    grade: "75%",
  },
];

export const certifications: Certification[] = [
  {
    id: "oracle-agentic-ai",
    title: "Oracle Certified Foundations Associate — Agentic AI",
    issuer: "Oracle University",
    year: "2026",
    kind: "Certification",
    href: "https://catalog-education.oracle.com/ords/certview/sharebadge?id=9AAAC1F3B6368ADE76D13A16495BA0C0748267A7AC0DFD9677FB8A639833CC61",
  },
  {
    id: "github-foundations",
    title: "GitHub Foundations",
    issuer: "GitHub · Credly",
    year: "2025",
    kind: "Certification",
    href: "https://www.credly.com/badges/a810b47b-11af-4dad-88f9-7ea37720f30d/linked_in_profile",
  },
  {
    id: "dyashin-java-full-stack",
    title: "Java Full Stack Development",
    issuer: "Dyashin TechnoSoft",
    year: "2025",
    kind: "Certification",
    href: "https://drive.google.com/file/d/1jAL0CwQWRCJq0UhWTULsLI8yptZkW8EW/view?usp=sharing",
  },
  {
    id: "be-first-place",
    title: "1st Place — BE Final Year Project",
    issuer: "KVG College of Engineering",
    year: "2025",
    kind: "Award",
    note: "Human Brain Tumor Detection using Deep Learning",
  },
];
Write C:\Users\Prajwal\Desktop\Portfolio\src\content\index.ts
26 lines
export * from "./types";
export { profile } from "./profile";
export { experience } from "./experience";
export { projects, featuredProjects, archiveProjects } from "./projects";
export { skillGroups, practices } from "./skills";
export { education, certifications } from "./education";

export const site = {
  url: "https://prajwalps2603.github.io/Portfolio/",
  title: "Prajwal M P — Full Stack Developer",
  description:
    "Prajwal M P is a Full Stack Developer in Bengaluru building complete systems end-to-end — React and Next.js interfaces, Spring Boot, Node and FastAPI services, data, AI and deployment.",
  keywords: [
    "Prajwal M P",
    "Full Stack Developer",
    "Bengaluru",
    "React",
    "Next.js",
    "Spring Boot",
    "Java",
    "FastAPI",
    "RAG",
    "AI developer",
  ],
} as const;
I'm removing the duplicate TypeScript entry, then adding the motion setup: GSAP plugin registration, a Lenis smooth-scroll provider tied to ScrollTrigger, and reduced-motion and pointer hooks.
Edit C:\Users\Prajwal\Desktop\Portfolio\src\content\skills.ts
Removed 1 line
Edit C:\Users\Prajwal\Desktop\Portfolio\src\content\skills.ts
Modified
Write C:\Users\Prajwal\Desktop\Portfolio\src\lib\motion\gsap.ts
19 lines
"use client";

/**
 * Single place where GSAP plugins are registered. Import GSAP from here, never from "gsap" directly,
 * so plugins are always registered exactly once on the client.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  gsap.defaults({ ease: "power3.out", duration: 0.9 });
}

export { gsap, ScrollTrigger, SplitText, CustomEase, useGSAP };
Write C:\Users\Prajwal\Desktop\Portfolio\src\lib\motion\media.ts
38 lines
"use client";

import { useSyncExternalStore } from "react";

function subscribeTo(query: string) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

/**
 * SSR-safe media query hook. `serverValue` is what the server render (and first client render) assumes.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    subscribeTo(query),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** True when the user asked the OS for less motion. */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", false);
}

/** True on devices with a precise pointer that can hover (desktop mouse / trackpad). */
export function useFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)", false);
}

/** Non-hook check for use inside effects and animation code. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
Write C:\Users\Prajwal\Desktop\Portfolio\src\lib\motion\SmoothScroll.tsx
91 lines
"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { useReducedMotion } from "./media";

type ScrollTarget = string | number | HTMLElement;
type ScrollApi = {
  /** Smoothly scroll to a selector, element or y-offset (falls back to native scrolling with reduced motion). */
  scrollTo: (target: ScrollTarget, options?: { offset?: number; immediate?: boolean; duration?: number }) => void;
  /** Temporarily lock scrolling (e.g. during the intro or an open overlay). */
  lock: (locked: boolean) => void;
  lenis: Lenis | null;
};

const ScrollContext = createContext<ScrollApi | null>(null);

/**
 * Lenis smooth scrolling driven by GSAP's ticker so ScrollTrigger and Lenis share one clock.
 * Disabled entirely when the user prefers reduced motion (native scrolling is used instead).
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lockedRef = useRef(false);

  useEffect(() => {
    if (reduced) {
      setLenis(null);
      return;
    }
    const instance = new Lenis({
      autoRaf: false,
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);
    if (lockedRef.current) instance.stop();
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

  const api = useMemo<ScrollApi>(
    () => ({
      lenis,
      scrollTo(target, options = {}) {
        if (lenis) {
          lenis.scrollTo(target, {
            offset: options.offset ?? 0,
            immediate: options.immediate,
            duration: options.duration ?? 1.4,
            easing: (t: number) => 1 - Math.pow(1 - t, 4),
          });
          return;
        }
        const el =
          typeof target === "string" ? document.querySelector<HTMLElement>(target) : typeof target === "number" ? null : target;
        const top = typeof target === "number" ? target : el ? el.getBoundingClientRect().top + window.scrollY : 0;
        window.scrollTo({ top: top + (options.offset ?? 0), behavior: "auto" });
      },
      lock(locked) {
        lockedRef.current = locked;
        if (lenis) {
          if (locked) lenis.stop();
          else lenis.start();
        }
        document.documentElement.style.overflow = locked ? "hidden" : "";
      },
    }),
    [lenis],
  );

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}

export function useSmoothScroll(): ScrollApi {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error("useSmoothScroll must be used inside <SmoothScroll>");
  return ctx;
}
11:10 AM
Now a minimal app shell: just enough to prove the static export builds end to end. The real design goes in after you choose a direction.



Write C:\Users\Prajwal\Desktop\Portfolio\src\app\layout.tsx
41 lines
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { site, profile } from "@/content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  keywords: [...site.keywords],
  authors: [{ name: profile.name, url: site.url }],
  creator: profile.name,
  openGraph: {
    type: "website",
    url: site.url,
    title: site.title,
    description: site.description,
    siteName: profile.name,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    creator: "@PrajwalNair2603",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
Write C:\Users\Prajwal\Desktop\Portfolio\src\app\globals.css
20 lines
@import "tailwindcss";

/* Design tokens are defined per creative direction once it is selected. */
@theme {
  --color-ink: #111111;
  --color-paper: #f4f2ee;
}

html {
  -webkit-text-size-adjust: 100%;
  text-rendering: optimizeLegibility;
}

body {
  background: var(--color-paper);
  color: var(--color-ink);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
Write C:\Users\Prajwal\Desktop\Portfolio\src\app\page.tsx
17 lines
import { profile, featuredProjects } from "@/content";

/** Temporary shell — replaced by the selected creative direction. */
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-5xl font-semibold tracking-tight">{profile.name}</h1>
      <p className="mt-2 text-xl">{profile.title}</p>
      <ul className="mt-10 space-y-2">
        {featuredProjects.map((p) => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
    </main>
  );
}
Write C:\Users\Prajwal\Desktop\Portfolio\scripts\serve.mjs
54 lines
// Minimal static server for the exported site in ./out (used by `npm run preview`).
// Honors NEXT_PUBLIC_BASE_PATH so a GitHub Pages build (/Portfolio) can be previewed locally too.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("out");
const port = Number(process.env.PORT || 4173);
const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".ktx2": "image/ktx2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

if (!fs.existsSync(root)) {
  console.error("No ./out folder. Run `npm run build` first.");
  process.exit(1);
}

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (base && urlPath.startsWith(base)) urlPath = urlPath.slice(base.length) || "/";
    let file = path.join(root, urlPath);
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) file = path.join(root, "404.html");
    const status = file.endsWith("404.html") && !urlPath.includes("404") ? 404 : 200;
    res.writeHead(status, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`Serving ./out at http://localhost:${port}${base || ""}/`));
Write C:\Users\Prajwal\Desktop\Portfolio\.github\workflows\deploy.yml
57 lines
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Install dependencies
        run: npm ci

      - name: Build static export
        env:
          # Project site lives at https://prajwalps2603.github.io/Portfolio/
          NEXT_PUBLIC_BASE_PATH: /Portfolio
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
11:10 AM
Now verifying the foundation: type-check and a full static-export build.



Bash Type-check and build the static export
IN
sed -i 's|, "src/\*\*/\*.glsl.d.ts"||' tsconfig.json && grep -n '"include"' tsconfig.json && npx tsc --noEmit 2>&1 | head -20; echo "tsc exit: ${PIPESTATUS[0]}"; npx next build 2>&1 | tail -25

OUT
20:  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
tsc exit: 0
▲ Next.js 16.4.5 (Turbopack)
✓ Running next.config.ts took 62ms

  Creating an optimized production build ...
✓ Compiled successfully in 2.8s
  Running TypeScript ...
  Finished TypeScript in 2.5s ...
  Collecting page data using 4 workers ...
  Generating static pages using 4 workers (0/3) ...
✓ Generating static pages using 4 workers (3/3) in 834ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
└ ○ /_not-found


○  (Static)  prerendered as static content
[This command modified 1 file you've previously read: tsconfig.json. Call Read before editing.]
The foundation builds cleanly as a static export with no type errors. Next I'll add reusable interaction hooks that the direction agents can share.
Write C:\Users\Prajwal\Desktop\Portfolio\src\lib\motion\pointer.ts
63 lines
"use client";

/**
 * One shared, allocation-free pointer tracker for the whole page.
 * The custom cursor, magnetic elements and the WebGL background all read from the same state,
 * so there is exactly one pointermove listener and every consumer stays in sync.
 */
export type PointerState = {
  /** Viewport pixels. */
  x: number;
  y: number;
  /** Normalised device coords, -1..1 (y up), handy for shaders/3D. */
  nx: number;
  ny: number;
  /** Smoothed velocity in px/frame. */
  vx: number;
  vy: number;
  /** True once the pointer has moved at least once (hide cursor until then). */
  active: boolean;
  /** Pointer currently pressed. */
  down: boolean;
};

export const pointer: PointerState = { x: 0, y: 0, nx: 0, ny: 0, vx: 0, vy: 0, active: false, down: false };

let refCount = 0;
let lastX = 0;
let lastY = 0;

function onMove(e: PointerEvent) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1);
  pointer.vx = pointer.vx * 0.8 + (e.clientX - lastX) * 0.2;
  pointer.vy = pointer.vy * 0.8 + (e.clientY - lastY) * 0.2;
  lastX = e.clientX;
  lastY = e.clientY;
  pointer.active = true;
}
const onDown = () => (pointer.down = true);
const onUp = () => (pointer.down = false);
const onLeave = () => (pointer.active = false);

/** Start tracking (ref-counted). Returns a stop function — call from an effect. */
export function trackPointer(): () => void {
  if (typeof window === "undefined") return () => {};
  if (refCount++ === 0) {
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
  }
  return () => {
    if (--refCount === 0) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    }
  };
}
Write C:\Users\Prajwal\Desktop\Portfolio\src\lib\motion\useMagnetic.ts
57 lines
"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "./gsap";
import { prefersReducedMotion } from "./media";

type MagneticOptions = {
  /** How far (0..1 of the distance to the pointer) the element follows. */
  strength?: number;
  /** Optional inner element (e.g. the label) that moves further for a layered, parallax feel. */
  innerRef?: RefObject<HTMLElement | null>;
  innerStrength?: number;
};

/**
 * Magnetic hover: the element eases toward the pointer while hovered and springs back on leave.
 * No-ops on touch devices and with reduced motion.
 */
export function useMagnetic<T extends HTMLElement>(ref: RefObject<T | null>, options: MagneticOptions = {}) {
  const { strength = 0.35, innerRef, innerStrength = 0.6 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || prefersReducedMotion()) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
    const inner = innerRef?.current ?? null;
    const ixTo = inner ? gsap.quickTo(inner, "x", { duration: 0.6, ease: "power3.out" }) : null;
    const iyTo = inner ? gsap.quickTo(inner, "y", { duration: 0.6, ease: "power3.out" }) : null;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * strength);
      yTo(dy * strength);
      ixTo?.(dx * strength * innerStrength);
      iyTo?.(dy * strength * innerStrength);
    };
    const leave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)" });
      if (inner) gsap.to(inner, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)" });
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(el);
      if (inner) gsap.killTweensOf(inner);
    };
  }, [ref, innerRef, strength, innerStrength]);
}
Write C:\Users\Prajwal\Desktop\Portfolio\src\lib\hooks\useCopy.ts
58 lines
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Copy text to the clipboard with a transient "copied" state for UI feedback.
 * Falls back to a hidden textarea + execCommand where the async Clipboard API is unavailable.
 */
export function useCopy(resetAfterMs = 2200) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(
    async (text: string) => {
      let ok = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          ok = true;
        }
      } catch {
        ok = false;
      }
      if (!ok) {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          ok = document.execCommand("copy");
          ta.remove();
        } catch {
          ok = false;
        }
      }
      setCopied(ok);
      setFailed(!ok);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setCopied(false);
        setFailed(false);
      }, resetAfterMs);
      return ok;
    },
    [resetAfterMs],
  );

  return { copy, copied, failed };
}
Write C:\Users\Prajwal\Desktop\Portfolio\src\lib\gpu.ts
39 lines
"use client";

/**
 * Cheap, synchronous device-capability heuristic used to pick a rendering quality tier for WebGL.
 * (Avoids shipping a GPU benchmark library; good enough to protect low-end phones.)
 */
export type QualityTier = "low" | "medium" | "high";

export function getQualityTier(): QualityTier {
  if (typeof window === "undefined") return "medium";
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return "low";
  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory || 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  if (cores <= 4 || memory <= 2) return "low";
  if (coarse || small) return "medium";
  return "high";
}

/** Device pixel ratio clamp per tier — the single biggest lever on fragment-shader cost. */
export function dprForTier(tier: QualityTier): [number, number] {
  if (tier === "low") return [1, 1];
  if (tier === "medium") return [1, 1.5];
  return [1, 1.75];
}

/** True if WebGL is available at all (some locked-down browsers disable it). */
export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
Write C:\Users\Prajwal\Desktop\Portfolio\src\lib\asset.ts
9 lines
/**
 * Prefix a public asset path with the deployment base path (e.g. /Portfolio on GitHub Pages).
 * next/link and next/image handle basePath automatically; raw <img>, fetch() and texture loaders do not.
 */
export function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
11:11 AM
One more piece, the intro gate: the full opening plays on a visitor's first view in a session, a short version on repeat visits, and none with reduced motion. Then a type-check.



Write C:\Users\Prajwal\Desktop\Portfolio\src\lib\motion\useIntroMode.ts
35 lines
"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./media";

const KEY = "pmp:intro-seen";

export type IntroMode = "pending" | "full" | "short" | "none";

/**
 * Decides how the opening sequence plays:
 * - "full"  on the first visit of a browser session,
 * - "short" on repeat visits in the same session (don't make people sit through it twice),
 * - "none"  when the user prefers reduced motion.
 * "pending" is the server/first-render state — render the intro cover so content never flashes.
 */
export function useIntroMode(): IntroMode {
  const [mode, setMode] = useState<IntroMode>("pending");
  useEffect(() => {
    if (prefersReducedMotion()) {
      setMode("none");
      return;
    }
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
      sessionStorage.setItem(KEY, "1");
    } catch {
      // storage unavailable (privacy mode) — treat as first visit
    }
    setMode(seen ? "short" : "full");
  }, []);
  return mode;
}
Bash Type-check the new utilities
IN
npx tsc --noEmit 2>&1 | head -20; echo "tsc exit: ${PIPESTATUS[0]}"

OUT
tsc exit: 0
Type-checking on the foundation is clean, so I'm looking into the "impeccable" design skill whose hook scans my writes, to see whether its quality checks could help the refinement loop.
Bash Locate the impeccable skill files
IN
find /c/Users/Prajwal/.claude -iname "SKILL.md" -path "*impeccable*" 2>/dev/null | head -5; find /c/Users/Prajwal/.claude -maxdepth 6 -type d -iname "*impeccable*" 2>/dev/null | head -10

OUT
/c/Users/Prajwal/.claude/skills/impeccable/SKILL.md
/c/Users/Prajwal/.claude/skills/impeccable
Bash List impeccable skill contents
IN
cd /c/Users/Prajwal/.claude/skills/impeccable && ls -la && wc -l SKILL.md && find . -type f | head -60

OUT
total 32
drwxr-xr-x 1 Prajwal 197121     0 Oct 19 09:11 .
drwxr-xr-x 1 Prajwal 197121     0 Oct 30 09:15 ..
-rw-r--r-- 1 Prajwal 197121 12510 Oct 19 09:11 SKILL.md
drwxr-xr-x 1 Prajwal 197121     0 Oct 19 09:11 reference
drwxr-xr-x 1 Prajwal 197121     0 Oct 19 09:11 scripts
87 SKILL.md
./reference/adapt.md
./reference/adapt.native.md
./reference/android.md
./reference/animate.md
./reference/audit.md
./reference/audit.native.md
./reference/bolder.md
./reference/clarify.md
./reference/colorize.md
./reference/component-review.md
./reference/craft-floor.md
./reference/craft.md
./reference/critique.md
./reference/degraded/asset-producer.md
./reference/degraded/documenter.md
./reference/degraded/finish-reviewer.md
./reference/degraded/manual-edit-applier.md
./reference/delight.md
./reference/distill.md
./reference/doctor.md
./reference/document.md
./reference/extract.md
./reference/generate.md
./reference/harden.md
./reference/hooks.md
./reference/init.md
./reference/ios.md
./reference/layout.md
./reference/live-setup.md
./reference/live.md
./reference/mode-operate.md
./reference/mode-persuade.md
./reference/mode-read.md
./reference/new-work.md
./reference/onboard.md
./reference/operate.md
./reference/optimize.md
./reference/overdrive.md
./reference/polish.md
./reference/quieter.md
./reference/region-map.md
./reference/routing.md
./reference/shape.md
./reference/typeset.md
./reference/visualize.md
./scripts/bin/windows-x64/impeccable.exe
./scripts/command-metadata.json
./scripts/data/font-index-failures.json
./scripts/data/font-index.json
./scripts/impeccable
./scripts/impeccable.cmd
./scripts/live-browser-dom.js
./scripts/live-browser-ignores.js
./scripts/live-browser-session.js
./scripts/live-browser.js
./scripts/modern-screenshot.umd.js
./scripts/VERSION
./SKILL.md
Shell cwd was reset to c:\Users\Prajwal\Desktop\Portfolio
Read C:\Users\Prajwal\.claude\skills\impeccable\SKILL.md
11:12 AM
The skill has a "craft floor" reference — its quality bar and absolute bans. That's useful input for the build agents; reading it and the motion references:



Bash Check sizes of key impeccable references
IN
cd /c/Users/Prajwal/.claude/skills/impeccable/reference && wc -l craft-floor.md animate.md overdrive.md new-work.md typeset.md polish.md critique.md degraded/finish-reviewer.md

OUT
    44 craft-floor.md
    89 animate.md
   127 overdrive.md
   154 new-work.md
    80 typeset.md
   105 polish.md
   809 critique.md
    37 degraded/finish-reviewer.md
  1445 total
Shell cwd was reset to c:\Users\Prajwal\Desktop\Portfolio
Read C:\Users\Prajwal\.claude\skills\impeccable\reference\craft-floor.md
Read C:\Users\Prajwal\.claude\skills\impeccable\reference\animate.md
Read C:\Users\Prajwal\.claude\skills\impeccable\reference\overdrive.md
The skill's quality bar will go into the build agents' briefs, and I may reuse its finish-reviewer for the refinement loop.
Read C:\Users\Prajwal\.claude\skills\impeccable\reference\degraded\finish-reviewer.md, C:\Users\Prajwal\.claude\skills\impeccable\reference\typeset.md
The finish-reviewer is tied to the skill's comp pipeline, so I'm writing my own review lenses and testing whether its detector CLI runs here as a mechanical check.
Bash Test the impeccable design detector CLI
IN
timeout 60 /c/Users/Prajwal/.claude/skills/impeccable/scripts/bin/windows-x64/impeccable.exe detect --help 2>&1 | head -30

OUT
Usage: impeccable detect [options] [file-or-dir-or-url...]

Scan files or URLs for UI anti-patterns and design quality issues.

Options:
  --json              Output results as JSON
  --quiet             In text mode, only print the final findings count
  --scope <name>      Only report rules in the given design domain
                      (type, layout). Comma-separated.
  --viewport <WxH>    Browser viewport for URL scans (default 1280x800),
                      e.g. --viewport 390x844 for a mobile-width pass
  --no-config         Do not apply project config, detector ignores, inline
                      ignore comments, or DESIGN.md
  --no-inline-ignores Do not honor in-file impeccable-disable* ignore comments
  --no-design-system  Do not load local DESIGN.md / .impeccable/design.json context
  --no-advisory       Suppress advisory findings entirely (e.g. em-dash overuse)
  --no-consent-hiding URL scans: keep known consent managers' banners
                      (OneTrust, Cookiebot, ...) on the page instead of hiding
                      them before the scan
  --no-overlay-hiding URL scans: keep product tours (driver.js) and
                      preloaders still covering the page instead of hiding
                      them before the scan
  --help              Show this help message

Advisory findings:
  Some rules are advisory: detected and listed in a separate section, but never
  counted as failures and never changing the exit code. They stay out of the
  failure count so they never block automation. --no-advisory hides them.

Output streams:
11:14 AM
The detector works and can scan rendered pages at mobile widths, so it goes into the QA lens. One config tweak so dev-mode screenshots don't include Next's dev badge:



Edit C:\Users\Prajwal\Desktop\Portfolio\next.config.ts
Added 2 lines
The detector can gate the QA lens, so next I'm checking whether next build runs while next dev is live, since Next 16 keeps their output folders separate.
Bash Test concurrent next dev and next build
IN
(npx next dev -p 3000 > /c/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/dev.log 2>&1 &) ; for i in $(seq 1 40); do code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null); [ "$code" = "200" ] && break; sleep 1; done; echo "dev status: $code after ${i}s"; npx next build 2>&1 | tail -6; echo "dev still up: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)"; ls -d .next/dev 2>/dev/null && echo "separate dev dir OK"

OUT
dev status: 200 after 1s
┌ ○ /
└ ○ /_not-found


○  (Static)  prerendered as static content

dev still up: 200
.next/dev
separate dev dir OK
Dev and build now run side by side, with the dev server on port 3000 for the build agents. I'm extending the screenshot tool with selector-based hover, click and keypress actions so reviewers can capture hover states, open menus and focus rings.
Edit C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\tools\shot.mjs
Added 14 lines
Edit C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\tools\shot.mjs
Added 12 lines
Edit C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\tools\shot.mjs
Added 1 line
Edit C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\tools\shot.mjs
Added 3 lines
11:15 AM
Those edits are backward-compatible, but the workflow agents use this tool live, so I'm testing it immediately against the dev server:



Bash Validate updated screenshot tool
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; cd "$SPW/tools" && node --check shot.mjs && echo "syntax OK" && node shot.mjs --url http://localhost:3000/ --out "$SPW/test" --name devcheck --viewport mobile --wait 800 --hover-selector "h1" --keys "Tab" 2>&1 | tail -5

OUT
syntax OK
SAVED:
C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\test\devcheck-mobile-view.png
METRICS: {"scrollHeight":844,"scrollY":0,"webgl":true,"canvases":0,"title":"Prajwal M P — Full Stack Developer","horizontalOverflow":false}
LOGS:
[console.error] Failed to load resource: the server responded with a status of 404 (Not Found)
Shell cwd was reset to C:\Users\Prajwal\Desktop\Portfolio
The tool now accepts the new options, and I'm drafting the build-and-refine workflow so it can take your chosen direction as input.
Write C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js
295 lines
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
const D = A.direction
const SKETCH = A.sketchDir
const NOTES = A.notes || ''
const MAX_ROUNDS = A.maxRounds || 3
if (!D || !SKETCH) return { error: 'args.direction and args.sketchDir are required' }

const ROOT = 'C:/Users/Prajwal/Desktop/Portfolio'
const SP = 'C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad'
const DOSSIER = SP + '/dossier.md'
const SHOT = SP + '/tools/shot.mjs'
const DETECT = 'C:/Users/Prajwal/.claude/skills/impeccable/scripts/bin/windows-x64/impeccable.exe'
const DEV = 'http://localhost:3000'
const PREVIEW = 'http://localhost:4173'
const DJSON = JSON.stringify(D, null, 1)

const STACK = [
  'PROJECT: personal portfolio of Prajwal M P (current role: Full Stack Developer). Root: ' + ROOT,
  'STACK (installed, pinned): Next.js 16.4 App Router (Turbopack) + React 19.3 + TypeScript 5.9 (strict) + Tailwind CSS 4.3 (CSS-first config via @theme in src/app/globals.css, PostCSS plugin) + GSAP 3.15 (ScrollTrigger, SplitText, CustomEase are free and installed) + @gsap/react 2.1 + three 0.187 + @react-three/fiber 9.8 + @react-three/drei 10.7 + motion 14.9 (import from "motion/react") + lenis 1.3. Add a dependency only if truly necessary (npm i <pkg>@<exact version>), and say so in your result.',
  'DEPLOYMENT: static export (output: "export", trailingSlash: true) to GitHub Pages under basePath /Portfolio (NEXT_PUBLIC_BASE_PATH). Consequences: no server code, no API routes, no next/image optimisation, no runtime env secrets; every raw asset URL (img src, fetch, texture/font loaders, CSS url() in TS) must go through asset() from src/lib/asset.ts; next/link handles basePath itself. Dynamic routes need generateStaticParams.',
  'CONTENT: every fact comes from src/content/* (typed; import from "@/content"). Never hard-code facts in components; never invent metrics, clients, testimonials, dates or links. Provenance notes: ' + DOSSIER + ' . The current role MUST read "Full Stack Developer" (Maruti Flex Traders LLP, Dec 2025 - Present).',
  'EXISTING FOUNDATION (read before writing; reuse, do not duplicate): src/lib/motion/gsap.ts (import gsap, ScrollTrigger, SplitText, CustomEase, useGSAP ONLY from here), src/lib/motion/SmoothScroll.tsx (Lenis provider synced to GSAP ticker; useSmoothScroll() -> scrollTo/lock), src/lib/motion/media.ts (useReducedMotion, useFinePointer, useMediaQuery, prefersReducedMotion), src/lib/motion/pointer.ts (single shared pointer state + trackPointer()), src/lib/motion/useMagnetic.ts, src/lib/motion/useIntroMode.ts (full / short / none / pending), src/lib/hooks/useCopy.ts, src/lib/gpu.ts (getQualityTier, dprForTier, hasWebGL), src/lib/asset.ts.',
  'NOTES FROM PRAJWAL (decisions he made): ' + (NOTES || 'none'),
].join('\n')

const DIRECTION_BLOCK = [
  'CHOSEN CREATIVE DIRECTION (approved by Prajwal; this is the contract):\n' + DJSON,
  'APPROVED LIVE SKETCH: ' + SKETCH + '/index.html (+ any sketch.js / sketch.css there; screenshots in ' + SKETCH + '/shots/). It is the visual and motion reference Prajwal approved: port its typography, palette, composition, easing curves, shaders and motion ideas faithfully into production React/TypeScript components, then raise the craft. Do not drift to a different look.',
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
  '- Type-check with: cd ' + ROOT + ' && npx tsc --noEmit . Do NOT run "next build" during parallel phases (the integrator owns production builds).',
  '- Save your screenshots under ' + SP + '/shots/build/<your-area>/ .',
].join('\n')

const AREAS = {
  foundation: 'src/app/layout.tsx, src/app/page.tsx, src/app/globals.css, src/app/not-found.tsx, src/app/icon.svg, src/lib/**, src/components/chrome/**, src/components/cursor/**, src/components/transition/**, src/components/icons/**, src/components/ui/**, src/fonts/**, docs/**, next.config.ts',
  'intro-hero': 'src/components/intro/**, src/components/hero/**',
  scene: 'src/components/scene/**',
  work: 'src/components/work/**, src/app/work/**',
  about: 'src/components/about/**, src/components/experience/**, src/components/credentials/**',
  skills: 'src/components/skills/**',
  contact: 'src/components/contact/**, src/components/footer/**',
}

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
]), { label: 'build:' + s.area, phase: 'Sections', schema: RESULT })))
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
let integ = await agent(integratePrompt('after the parallel section build', allIssues), { label: 'integrate', phase: 'Integrate', schema: INTEG })
log('Integration: build ' + (integ && integ.buildOk ? 'OK' : 'FAILED') + '; remaining: ' + (integ ? integ.remainingProblems.length : '?'))

// ---------------- Refine loop ----------------
const LENSES = [
  { key: 'craft', lens: 'Awwwards Site-of-the-Day juror and studio design director. Judge the first-viewport memory test, typography craft, composition/grid/spacing rhythm, colour and contrast, the signature moment, coherence with the approved direction and sketch, browser-surface theming, and craft-floor refusals. Would a top studio ship this today?' },
  { key: 'motion', lens: 'Motion director. Judge the intro pacing (filmstrip), hero type animation, scroll choreography (is there one authored moment per section or the same fade-up everywhere?), easing and timing (read the GSAP/motion code), page transitions, cursor and hover feel, how the 3D/background integrates with content, and the reduced-motion path. Every animation must have a purpose.' },
  { key: 'qa', lens: 'Frontend QA, accessibility and performance engineer. Judge console/hydration errors, horizontal overflow at every viewport, keyboard path and focus visibility (use --keys to tab), semantics and heading outline, contrast of real computed colours, dead/placeholder links, image alts, JS payload, WebGL hygiene (DPR clamp, pause offscreen, dispose, fallback), font loading/CLS, and the detector findings. Severity high = broken or inaccessible.' },
  { key: 'hiring', lens: 'Engineering manager and tech recruiter who reviews 50 portfolios a week. Within 10 seconds: is it clear he is a Full Stack Developer (current role correct) who ships complete systems? Can you find projects, stack, experience, résumé and contact fast on desktop AND mobile? Is the copy in his own clear language, truthful to src/content, free of filler? Does motion help or get in the way? Would you interview him?' },
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
  const cap = await agent(capturePrompt(round), { label: 'capture:r' + round, phase: 'Refine', schema: CAPTURE })
  if (!cap) { log('capture failed in round ' + round); break }
  const reviews = (await parallel(LENSES.map((l) => () => agent(reviewPrompt(l, cap, round), { label: 'review:' + l.key + ':r' + round, phase: 'Refine', schema: FINDINGS })))).filter(Boolean)
  const verdicts = reviews.map((r) => r.lens.split(' ')[0] + '=' + r.verdict)
  const plan = await agent(triagePrompt(reviews, round), { label: 'triage:r' + round, phase: 'Refine', schema: PLAN })
  if (!plan) { log('triage failed in round ' + round); break }
  rounds.push({ round, verdicts: reviews.map((r) => ({ lens: r.lens.slice(0, 30), verdict: r.verdict, findings: r.findings.length })), high: plan.highCount, medium: plan.mediumCount, stop: plan.stop, rationale: plan.rationale })
  log('Round ' + round + ': ' + verdicts.join(', ') + ' | high=' + plan.highCount + ' medium=' + plan.mediumCount + ' stop=' + plan.stop)
  if (plan.stop && plan.highCount === 0 && round >= 2) break
  const work = plan.workstreams.filter((w) => w.fixes && w.fixes.length)
  const fixed = await parallel(work.map((w) => () => agent(fixPrompt(w, round), { label: 'fix:' + w.area + ':r' + round, phase: 'Refine', schema: RESULT })))
  const leftovers = fixed.filter(Boolean).flatMap((r) => r.openIssues.map((i) => r.area + ': ' + i))
  integ = await agent(integratePrompt('after refinement round ' + round, leftovers), { label: 'integrate:r' + round, phase: 'Refine', schema: INTEG })
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
].join('\n\n'), { label: 'finish', phase: 'Finish', schema: RESULT })

return { foundation: foundation.summary, sections: sectionResults.filter(Boolean).map((r) => ({ area: r.area, summary: r.summary, openIssues: r.openIssues })), rounds, finalIntegration: integ, finish }
11:18 AM
Research is done, the foundation builds, and the creative-direction workflow is running in the background. When it finishes I'll put three directions in front of you; nothing gets built until you pick one.

What I found on GitHub (25 public repos):

Projects your resume doesn't mention:
ResumAI, an AI resume and ATS platform
Audify AI, a voice-AI Android app for telecallers
Custom MCP Server, an auto job-application agent
BookMyVenue, with a working live demo
MarkVault, LifeSync AI and Buddy
Livora (live site)
Smart Ambulance, an ESP32/MQTT IoT project
Live demos: I checked each one. BookMyVenue, Buddy and Livora load; College-Website and LifeSync return 404, so I won't link those.
From your old portfolio's data files, which look copied from LinkedIn:
a 9-month Machine Learning internship at Rooman Technologies (Sep 2024 – May 2025)
exact dates for the Techbyheart internship
your X and Instagram handles
LinkedIn blocks automated access, and web search turned up nothing tied to your profile. If LinkedIn has anything else worth including (recommendations, featured posts, volunteering), paste it here or drop your LinkedIn data export into the folder.

Decisions I've applied:

Current role: "Full Stack Developer" at Maruti Flex Traders LLP (Dec 2025 – Present) everywhere, and the site headline is "Full Stack Developer". Your resume PDF and the Google Drive copy linked from your old site still say "Frontend Developer", so update that file and keep the same link.
Phone number: left off the public site, same as your current portfolio.
Hosting: same as now, a static export to GitHub Pages at /Portfolio/, with a deploy workflow ready.
Already in place:

Next.js 16 + React 19 + TypeScript + Tailwind 4 + GSAP + React Three Fiber + Motion + Lenis, installed and building cleanly.
A typed content model in src/content/. Every fact comes from your documents or GitHub, and each skill is linked to the projects that prove it (no skill percentage bars).
Shared motion pieces: smooth scrolling synced with ScrollTrigger, reduced-motion handling, magnetic hover, an intro that plays in full only on a visitor's first view, and graphics quality that steps down on weaker devices.
A headless Edge screenshot tool, so every build step gets checked in a real browser, including WebGL.
Running now: five independent creative directors are each pitching a different idea. Three judges score them (an Awwwards juror, a WebGL engineer, a hiring manager), and the best three become live HTML motion sketches that go through build → critique → fix loops. They'll be in design/directions/ along with a side-by-side comparison page. This takes a while.

After you choose, the build workflow is already drafted: a foundation pass, then six section builders in parallel, then up to three rounds of screenshot reviews and fixes.



run it
11:25 AM
I'll check where the direction workflow has got to before doing anything else.



Bash Check direction workflow progress
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_5a31129b-5ab"; ls "$J" 2>/dev/null | head -50; echo "---"; [ -f "$J/journal.jsonl" ] && wc -l "$J/journal.jsonl" && python -c "
import json,sys
for line in open(r'$J/journal.jsonl', encoding='utf-8'):
    try: e=json.loads(line)
    except: continue
    keys=list(e.keys())
    lab=e.get('label') or e.get('opts',{}).get('label') if isinstance(e.get('opts'),dict) else e.get('label')
    print(e.get('type') or e.get('kind') or '?', '|', lab, '|', str(e.get('status') or '')[:20], '|', ','.join(keys)[:120])
" | tail -40; ls -la "C:/Users/Prajwal/Desktop/Portfolio/design/directions" 2>/dev/null

OUT
agent-a05bd52c8c5c8d6d3.jsonl
agent-a05bd52c8c5c8d6d3.meta.json
agent-a063646dafb9f44b8.jsonl
agent-a063646dafb9f44b8.meta.json
agent-a2705dffac2d84e40.jsonl
agent-a2705dffac2d84e40.meta.json
agent-a4cdbf21322d49085.jsonl
agent-a4cdbf21322d49085.meta.json
agent-a6ce43dac264d8229.jsonl
agent-a6ce43dac264d8229.meta.json
agent-a72834954d1f30b11.jsonl
agent-a72834954d1f30b11.meta.json
journal.jsonl
---
7 C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_5a31129b-5ab/journal.jsonl
launched | None |  | type
started | reference-library |  | type,key,agentId,label,phase
started | director:signal |  | type,key,agentId,label,phase
started | director:stack |  | type,key,agentId,label,phase
started | director:editorial |  | type,key,agentId,label,phase
started | director:system |  | type,key,agentId,label,phase
started | director:wildcard |  | type,key,agentId,label,phase
total 0
drwxr-xr-x 1 Prajwal 197121 0 Nov  5 11:23 .
drwxr-xr-x 1 Prajwal 197121 0 Nov  5 11:23 ..
drwxr-xr-x 1 Prajwal 197121 0 Nov  5 11:23 signal-chain
The direction workflow is still in its first phase, so there's nothing to choose yet. Before I run hands-off, could you confirm whether "run it" means building without waiting for you?
Question
Answered · 1 question
The creative-direction workflow is still running: 5 directors are pitching concepts, then come judging, 3 live motion sketches and a comparison board. When it finishes, should I choose the direction myself and go straight into the full build, or show you the three first?
You pick, build straight through
When the sketches finish, I take the top-ranked direction (3 judges + executive creative director), launch the full build and the screenshot review/fix loops without stopping. The other two sketches stay in design/directions/ for comparison.
Show me the three first
I present the three directions (live sketches, comparison board, layout previews) and wait for your pick before building. If you're away when they're ready, the build waits for you.
Skip sketches, build sooner
As soon as the three directions are written and ranked (before the sketch phase), I stop that workflow and start building the top one. Roughly 30+ minutes faster, but the build has no approved live prototype anchoring its look.
You chose hands-off, so once the sketches finish I'll pick the top-ranked direction and go straight into the build and refinement loops. I'm saving that preference and the key project facts for future sessions.
Write C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\memory\prefers-autonomous-runs.md
13 lines
---
name: prefers-autonomous-runs
description: Prajwal wants long autonomous multi-agent runs; when asked whether to wait for his pick or proceed, he chose "you pick, build straight through"
metadata:
  type: feedback
---

Prajwal prefers that I make creative/technical calls myself and keep going rather than pausing for his approval. On the portfolio project he said "use all kind of agents… run in loop for refinement… I'm giving full access", then "run it", and when asked who picks the creative direction he chose "You pick, build straight through".

**Why:** He wants finished, refined results, not checkpoints; waiting on him stalls long background runs.

**How to apply:** Default to deciding and proceeding (state the choice and how to redirect). Reserve questions for things only he can know (facts about himself, accounts, publishing). Use multi-agent workflows with review/fix loops for substantial work. Related: [[portfolio-project-facts]]
Write C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\memory\portfolio-project-facts.md
16 lines
---
name: portfolio-project-facts
description: Non-obvious facts for Prajwal's portfolio rebuild — current role correction, outdated résumé, privacy and deployment constraints
metadata:
  type: project
---

- His CURRENT role is **Full Stack Developer** at Maruti Flex Traders LLP (Dec 2025 – present). His résumé PDF and the Google Drive résumé still say "Frontend Developer" — outdated; he asked (2026-11-05) that the portfolio say Full Stack Developer. Remind him to update the Drive file (same link).
- Phone number is deliberately NOT shown publicly (his old site omitted it too).
- Deploys as a Next.js static export to GitHub Pages at https://prajwalps2603.github.io/Portfolio/ (basePath /Portfolio), replacing his older Next 14 portfolio (repo Prajwalps2603/Portfolio).
- LinkedIn cannot be fetched automatically (HTTP 999); his old portfolio's data files mirror LinkedIn and were used instead. Extra LinkedIn details only if he pastes them.
- Livora (prajwalps2603.github.io/Livora) relationship to him is unknown (own studio vs. client) — described neutrally until he says.

**Why:** These were decided/discovered in conversation, not derivable from the code.
**How to apply:** Keep the title, privacy and deploy target consistent in any future edits. Related: [[prefers-autonomous-runs]]
Write C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\memory\MEMORY.md
3 lines
- [Prefers autonomous runs](prefers-autonomous-runs.md) — decide and keep going; he chose "you pick, build straight through"
- [Portfolio project facts](portfolio-project-facts.md) — current role = Full Stack Developer (résumé outdated), no public phone, GitHub Pages /Portfolio
Saved the build workflow draft. I'm adding a note for agents to warm the page before taking screenshots, since the first cold compile of Three.js and R3F can take 10–20 seconds and would otherwise yield blank frames.
Edit C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js
Added 1 line
11:27 AM
Got it — I'll choose the direction and build straight through without stopping.

The direction workflow is still in its first phase: five creative directors pitching, plus the reference research. After that come judging, the three live sketches and the comparison board.

When it finishes, I'll take the top-ranked direction and immediately launch the build:

A foundation pass sets the design system, motion system, cursor, page transitions and navigation.
Six builders work in parallel: intro and hero, the 3D background scene, work and case-study pages, about and experience, skills, and contact.
Up to three refinement rounds follow, each with a full production capture across desktop, laptop, tablet, mobile and reduced motion. Four reviewers (visual craft, motion, accessibility/performance, hiring manager) report issues, and the fixes are made in parallel.
A final check confirms the GitHub Pages /Portfolio build, and I write the README.
The two directions I don't pick will stay in design/directions/ if you want to compare them later. For now, http://localhost:3000 only shows the placeholder page.



how long it will take
11:31 AM
I'll check actual progress and how long each stage has taken so far, so the estimate isn't a guess.



Bash Check workflow timing and progress
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_5a31129b-5ab"; python -c "
import json
for line in open(r'$J/journal.jsonl', encoding='utf-8'):
    try: e=json.loads(line)
    except: continue
    print(e.get('type'), '|', e.get('label'), '|', e.get('ts') or e.get('time') or e.get('timestamp') or '', '|', [k for k in e.keys()][:8])
"; echo "--- agent files (size, last modified):"; ls -la --time-style=+%H:%M:%S "$J"/*.jsonl | awk '{print \$6, \$5, \$7}'; echo "now: $(date +%H:%M:%S)"; echo "--- meta labels:"; for f in "$J"/*.meta.json; do python -c "import json,sys; d=json.load(open(sys.argv[1])); print(d.get('label') or d.get('description') or d)" "$f" 2>/dev/null | head -c 150; echo; done; ls -la --time-style=+%H:%M:%S "C:/Users/Prajwal/Desktop/Portfolio/design/directions/"*/ 2>/dev/null | head -20

OUT
launched | None |  | ['type']
started | reference-library |  | ['type', 'key', 'agentId', 'label', 'phase']
started | director:signal |  | ['type', 'key', 'agentId', 'label', 'phase']
started | director:stack |  | ['type', 'key', 'agentId', 'label', 'phase']
started | director:editorial |  | ['type', 'key', 'agentId', 'label', 'phase']
started | director:system |  | ['type', 'key', 'agentId', 'label', 'phase']
started | director:wildcard |  | ['type', 'key', 'agentId', 'label', 'phase']
--- agent files (size, last modified):
awk: cmd. line:1: {print \$6, \$5, \$7}
awk: cmd. line:1:        ^ backslash not last character on line
now: 11:31:34
--- meta labels:
director:wildcard

director:signal

director:stack

director:editorial

reference-library

director:system

C:/Users/Prajwal/Desktop/Portfolio/design/directions/cross-section/:
total 672
drwxr-xr-x 1 Prajwal 197121      0 11:31:29 .
drwxr-xr-x 1 Prajwal 197121      0 11:28:43 ..
drwxr-xr-x 1 Prajwal 197121      0 11:31:29 assets
-rw-r--r-- 1 Prajwal 197121 682358 11:31:29 terrain.js

C:/Users/Prajwal/Desktop/Portfolio/design/directions/schematic/:
total 4
drwxr-xr-x 1 Prajwal 197121 0 11:27:41 .
drwxr-xr-x 1 Prajwal 197121 0 11:28:43 ..

C:/Users/Prajwal/Desktop/Portfolio/design/directions/signal-chain/:
total 108
drwxr-xr-x 1 Prajwal 197121      0 11:30:06 .
drwxr-xr-x 1 Prajwal 197121      0 11:28:43 ..
-rw-r--r-- 1 Prajwal 197121 103219 11:30:40 index.html
11:31 AM
Let me pin down when the workflow actually started, so the elapsed time is exact:



Bash Get workflow start time and agent activity
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_5a31129b-5ab"; for f in "$J"/journal.jsonl "$J"/*.jsonl; do printf "%s  %s KB  %s\n" "$(stat -c %w "$f" 2>/dev/null | cut -c12-19)" "$(( $(stat -c %s "$f") / 1024 ))" "$(basename "$f")"; done | sort | uniq; echo "now: $(date +%H:%M:%S)"

OUT
11:05:25  1 KB  journal.jsonl
11:05:25  1105 KB  agent-a063646dafb9f44b8.jsonl
11:05:25  1450 KB  agent-a6ce43dac264d8229.jsonl
11:05:27  1752 KB  agent-a05bd52c8c5c8d6d3.jsonl
11:05:27  19467 KB  agent-a4cdbf21322d49085.jsonl
11:05:27  3816 KB  agent-a72834954d1f30b11.jsonl
11:05:27  8629 KB  agent-a2705dffac2d84e40.jsonl
now: 11:31:50
11:32 AM
Plan on about 7–10 hours in total, which should mean a finished site this evening (it's 11:32 now).

Stage	Est. time	Status
Creative directions: 5 pitches, judging, 3 live sketches, comparison board	~1.5–2.5 h total	Started 11:05. Still pitching after 26 minutes, because the directors are building rough prototypes. Ready around 12:45–13:45.
Foundation: design system, motion, cursor, transitions, navigation	~1 h	Starts as soon as I pick the direction
Six sections built in parallel	~1–1.5 h	
Integration and first production build	~0.5 h	
Refinement loops: capture, 4 reviewers, fixes	~1.5–2 h per round	Up to 3 rounds. It stops after round 2 if no serious issues remain.
GitHub Pages build check and README	~0.5 h	
These are estimates. Agent run times vary, and the refinement rounds are where most of the range comes from.

If you want it sooner, say "two rounds" and I'll cap refinement at two, which saves about 1.5–2 hours. I'll update you when the direction is picked and the build starts, and again when it's done. You can watch live progress anytime with /workflows.



11:32 AM
The design hook flagged problems in design/directions/signal-chain/. That's a rough prototype a director agent is still writing inside the running workflow, not the site itself, so I won't edit it mid-run or mute the warnings. The real risk is these patterns getting copied into the actual build, so I'm adding them to the build's quality rules:



Edit C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js
Added 3 lines
11:32 AM
Running a quick syntax check on the updated build script:



Bash Syntax-check the build workflow script
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; (echo "(async () => {"; sed 's/^export const meta/const meta/' "$SPW/build-workflow.js"; echo "})"; ) > "$SPW/_check.js" && node --check "$SPW/_check.js" && echo "build-workflow.js: syntax OK"; rm -f "$SPW/_check.js"

OUT
build-workflow.js: syntax OK
11:32 AM
I left those design-hook warnings unfixed and unmuted. They're in an early pitch prototype that a director agent is still writing inside the running workflow, and editing it now would collide with that agent. The warnings were: text smaller than 11px, wide letter-spacing on running text, and thick colored borders down one side of cards.

The real risk was the build copying those flaws from a sketch into your site, so I added three rules to the build workflow:

Minimum text size: buttons, links, labels and captions never drop below 11px.
Spacing and borders: wide letter-spacing only on short uppercase labels, and no one-sided card borders.
Rules beat the sketch: where a sketch breaks a rule, the rule wins. Every builder also runs the design detector on the files it changed before finishing.
The script still passes a syntax check. The timeline I gave you is unchanged.



is it Done
11:55 AM
I'll check the workflow's current state.



Bash Check direction workflow status
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_5a31129b-5ab"; echo "now: $(date +%H:%M:%S)  (started 11:05:25)"; python -c "
import json
for line in open(r'$J/journal.jsonl', encoding='utf-8'):
    try: e=json.loads(line)
    except: continue
    t=e.get('type'); lab=e.get('label') or ''
    extra=''
    if t not in ('started','launched'): extra=str({k:(str(v)[:80]) for k,v in e.items() if k not in ('type','label','result','value')})
    print(t,'|',lab,'|',extra[:160])
"; echo "--- design/directions:"; ls -la --time-style=+%H:%M "C:/Users/Prajwal/Desktop/Portfolio/design/directions/" 2>/dev/null

OUT
now: 11:55:12  (started 11:05:25)
launched |  | 
started | reference-library | 
started | director:signal | 
started | director:stack | 
started | director:editorial | 
started | director:system | 
started | director:wildcard | 
result |  | {'key': 'v2:79f1686923c2f5a91bc2da2fe9e321ee5ea8b35a61d78362df41f9877d6ae2eb', 'agentId': 'a6ce43dac264d8229', 'remoteControlDeviceReport': 'False', 'toolsUsed'
result |  | {'key': 'v2:230869d1c68930241054086a25e138bdc77a6c8b24690f1a6bb9db72177b1337', 'agentId': 'a2705dffac2d84e40', 'remoteControlDeviceReport': 'False', 'toolsUsed'
result |  | {'key': 'v2:db79fd52e62df6f942bd44d01831e0a5e7725628c6871a1fb72e2417424901f9', 'agentId': 'a4cdbf21322d49085', 'remoteControlDeviceReport': 'False', 'toolsUsed'
result |  | {'key': 'v2:bca844e3c6b000f013d3101ca70afb8cc490e21dc3c67cfc6a446d0812b636d2', 'agentId': 'a063646dafb9f44b8', 'remoteControlDeviceReport': 'False', 'toolsUsed'
--- design/directions:
total 8
drwxr-xr-x 1 Prajwal 197121 0 11:34 .
drwxr-xr-x 1 Prajwal 197121 0 11:23 ..
drwxr-xr-x 1 Prajwal 197121 0 11:52 cross-section
drwxr-xr-x 1 Prajwal 197121 0 11:34 schematic
drwxr-xr-x 1 Prajwal 197121 0 11:32 signal-chain
drwxr-xr-x 1 Prajwal 197121 0 11:39 through-line
11:55 AM
Not done yet: the first of the two workflows has been running for 50 minutes, and 4 of its 6 first-stage agents have finished. Here's what the finished directors pitched:



Bash Read completed director concepts
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_5a31129b-5ab"; python -c "
import json
for line in open(r'$J/journal.jsonl', encoding='utf-8'):
    try: e=json.loads(line)
    except: continue
    if e.get('type')!='result': continue
    r=e.get('result', e.get('value'))
    if isinstance(r,str):
        try: r=json.loads(r)
        except: pass
    if isinstance(r,dict) and 'entries' in r:
        print('REFERENCE LIBRARY:', len(r['entries']), 'verified references'); continue
    if isinstance(r,dict):
        print('-', r.get('id'), '|', r.get('name'), '|', (r.get('oneLiner') or '')[:200])
        print('    signature:', (r.get('signatureMoment') or '')[:260])
    else:
        print('?', str(r)[:200])
"

OUT
REFERENCE LIBRARY: 35 verified references
- exploded-view | Exploded View | His stack as a physical object: five glass layers standing on a copper-traced circuit board. The first scroll takes them apart, and every project is cut out of them as a vertical slice through all the
    signature: The first scroll takes the hero apart. The solid glass monolith separates along a dashed assembly axis into INTERFACE / API / AI / DATA / INFRA. Four language "bolts" (TypeScript/JavaScript, Java 21, Python, SQL) lift out of the corners. Callouts route out at 
- through-line | Through-Line | A short film in five chapters, set in paper and ink, where one laterite-red line runs from Prajwal's name through every layer he ships (interface, logic, data, AI, deployment) and across the real West
    signature: The Threading (Ch.02, The Stack). Five paper plates (01 Interface, 02 Logic, 03 Data, 04 Intelligence, 05 Delivery) hang exploded in a soft-shadowed paper studio. Pick a project and a red thread needles down through the stack in 1.4s (power2.inOut). It ties a 
- signal-chain | Signal Chain | His site is an oscilloscope that locks onto a full stack developer. One noisy signal snaps into five clean channels (interface, services, data, AI, delivery), and every system he has shipped is drawn 
    signature: THE LOCK. A dark graticule with one noisy, untriggered trace rolling across it while the status reads AUTO. Then the trigger catches. AUTO flips to TRIG'D, the noise collapses with a 2% overshoot, and the single messy signal splits into five clean, colour-code
11:55 AM
Not yet. We're still in the first stage of the direction workflow, and the build hasn't started because it needs the chosen direction.

Progress (started 11:05, now 11:55):

✅ Reference library: 35 award-winning sites, each link checked to load
✅ Exploded View: your stack as five glass layers on a circuit board. The first scroll pulls them apart, and each project is shown as a slice through all five.
✅ Through-Line: a short film in five chapters on paper and ink. One red line runs from your name through every layer you ship and across your journey from Koppa to Bengaluru.
✅ Signal Chain: the site as an oscilloscope. A noisy signal locks into five clean channels (interface, services, data, AI, delivery).
⏳ Two more directors still working: one on a cross-section idea, one on a technical-schematic idea.
Updated estimate: this is running slower than I first said, because the directors are building rough prototypes.

Judging, picking the top three, live sketches and the comparison board: ready around 13:45–14:15.
Then the full build and up to three refinement rounds: finished site around 19:00–22:30 tonight.
You don't need to do anything. I'll tell you which direction I picked when the build starts, and again when it's finished.



11:55 AM
No action needed on these warnings. They're in pitch prototypes that agents in the running workflow are still writing. signal-chain has already dropped from 33 flagged issues to 5 as its agent iterates.

I'm not editing those files mid-run, and I'm not muting the hook, since its feedback is likely what's helping those agents fix things. The sketch phase has its own critique-and-fix loops, and the real site goes through the stricter rules and detector checks I added earlier.



is it Done
12:30 PM
Checking where it is now.



Bash Check direction workflow progress
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_5a31129b-5ab"; echo "now: $(date +%H:%M:%S)  (started 11:05:25)"; python -c "
import json
started={}; done=set()
for line in open(r'$J/journal.jsonl', encoding='utf-8'):
    try: e=json.loads(line)
    except: continue
    t=e.get('type')
    if t=='started': started[e.get('agentId')]=e.get('label')
    elif t=='result': done.add(e.get('agentId'))
for a,l in started.items(): print('DONE   ' if a in done else 'RUNNING', l)
"; for f in "$J"/*.meta.json; do :; done; ls "$J" | grep -c meta.json | xargs echo "agents launched so far:"

OUT
now: 12:30:28  (started 11:05:25)
DONE    reference-library
DONE    director:signal
DONE    director:stack
DONE    director:editorial
DONE    director:system
DONE    director:wildcard
DONE    judge:awwwards
DONE    judge:engineering
DONE    judge:hiring
RUNNING synthesize
agents launched so far: 10
12:30 PM
Explore and judging are both finished, and the agent that picks and refines the final three directions is running now. Pulling the judges' scores:



Bash Summarize judge scores per concept
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_5a31129b-5ab"; python -c "
import json
names={}; tot={}; per={}
for line in open(r'$J/journal.jsonl', encoding='utf-8'):
    try: e=json.loads(line)
    except: continue
    if e.get('type')!='result': continue
    r=e.get('result', e.get('value'))
    if isinstance(r,str):
        try: r=json.loads(r)
        except: continue
    if not isinstance(r,dict): continue
    if 'name' in r and 'id' in r: names[r['id']]=(r['name'], r.get('oneLiner','')[:150])
    if 'evaluations' in r:
        lens=r.get('lens','')[:28]
        for ev in r['evaluations']:
            tot[ev['conceptId']]=tot.get(ev['conceptId'],0)+ev['score']
            per.setdefault(ev['conceptId'],[]).append(f\"{lens.split()[0]}={ev['score']}\")
        print('RANKING', lens, '->', r.get('ranking'))
print()
for cid,s in sorted(tot.items(), key=lambda x:-x[1]):
    n=names.get(cid,(cid,''))
    print(f'{s:>5}  {n[0]:<16} ({cid})  {per[cid]}')
    print('       ', n[1])
"

OUT
RANKING Awwwards / FWA jury member a -> ['cross-section', 'signal-chain', 'through-line', 'schematic', 'exploded-view']
RANKING Engineering manager / tech r -> ['schematic', 'signal-chain', 'through-line', 'cross-section', 'exploded-view']
RANKING Principal creative developer -> ['schematic', 'signal-chain', 'cross-section', 'through-line', 'exploded-view']

   23  Signal Chain     (signal-chain)  ['Awwwards=7', 'Engineering=8', 'Principal=8']
        His site is an oscilloscope that locks onto a full stack developer. One noisy signal snaps into five clean channels (interface, services, data, AI, de
 23.0  Schematic        (schematic)  ['Awwwards=6', 'Engineering=8.5', 'Principal=8.5']
        Prajwal's systems drawn the way an ECE engineer draws circuits: his job title is the dimension line spanning the system end to end, and on scroll the 
   21  Cross-Section    (cross-section)  ['Awwwards=8', 'Engineering=6', 'Principal=7']
        A portfolio with one instrument, a vermilion laser section line. It cuts through Prajwal's name, through every system he has shipped and through the r
 20.0  Through-Line     (through-line)  ['Awwwards=6.5', 'Engineering=7.5', 'Principal=6']
        A short film in five chapters, set in paper and ink, where one laterite-red line runs from Prajwal's name through every layer he ships (interface, log
 12.5  Exploded View    (exploded-view)  ['Awwwards=4', 'Engineering=4.5', 'Principal=4']
        His stack as a physical object: five glass layers standing on a copper-traced circuit board. The first scroll takes them apart, and every project is c
12:30 PM
Not yet, but it's moving: picking the final three directions is under way, and then the live sketches get built.

Judges' scores (out of 10 from each judge):

Direction	Awwwards juror	Hiring manager	Engineer	Total
Signal Chain: the site as an oscilloscope; a noisy signal locks into five clean channels (interface, services, data, AI, delivery)	7	8	8	23
Schematic: your systems drawn the way an electronics engineer draws circuits, with your job title as the dimension line spanning the whole system	6	8.5	8.5	23
Cross-Section: one red-orange laser line cuts through your name and through every system you've shipped	8	6	7	21
Through-Line: a short film in chapters on paper and ink	6.5	7.5	6	20
Exploded View: glass layers on a circuit board	4	4.5	4	12.5
Three of the five ideas grew out of your Electronics & Communication background, and those three are the leaders. The final pick also weighs how different the three are from each other, so the top three scores aren't guaranteed to be the three chosen.

Timeline:

Picking the final three: now
Live sketches, critiques and the comparison board: until about 14:00–14:30
Then I pick one and start the full build. Finished site this evening, around 19:30–22:30.


Background workflow "portfolio-creative-directions" (run wf_5a31129b-5ab) didn't finish before the previous session ended
is it done
1:51 PM
The direction workflow stopped when the previous session ended. Finished steps are saved, so I'll check how far it got and resume from there.



Bash Check stopped workflow state and dev server
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_5a31129b-5ab"; echo "now: $(date +%H:%M:%S)"; python -c "
import json
started={}; done=set()
for line in open(r'$J/journal.jsonl', encoding='utf-8'):
    try: e=json.loads(line)
    except: continue
    t=e.get('type')
    if t=='started': started[e.get('agentId')]=e.get('label')
    elif t=='result': done.add(e.get('agentId'))
for a,l in started.items(): print('DONE   ' if a in done else 'UNFINISHED', l)
"; echo "--- dirs:"; ls -la --time-style=+%H:%M "c:/Users/Prajwal/Desktop/Portfolio/design/directions/"; for d in c:/Users/Prajwal/Desktop/Portfolio/design/directions/*/; do echo "$d: $(ls $d | tr '\n' ' ')"; done; echo "dev: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/)"

OUT
now: 13:51:20
DONE    reference-library
DONE    director:signal
DONE    director:stack
DONE    director:editorial
DONE    director:system
DONE    director:wildcard
DONE    judge:awwwards
DONE    judge:engineering
DONE    judge:hiring
DONE    synthesize
UNFINISHED build:signal-chain
UNFINISHED build:cross-section
UNFINISHED build:through-line
--- dirs:
total 16
drwxr-xr-x 1 Prajwal 197121 0 11:34 .
drwxr-xr-x 1 Prajwal 197121 0 11:23 ..
drwxr-xr-x 1 Prajwal 197121 0 13:32 cross-section
drwxr-xr-x 1 Prajwal 197121 0 11:34 schematic
drwxr-xr-x 1 Prajwal 197121 0 13:45 signal-chain
drwxr-xr-x 1 Prajwal 197121 0 13:34 through-line
c:/Users/Prajwal/Desktop/Portfolio/design/directions/cross-section/: assets index.html sketch.css sketch.js terrain.js 
c:/Users/Prajwal/Desktop/Portfolio/design/directions/schematic/: index.html 
c:/Users/Prajwal/Desktop/Portfolio/design/directions/signal-chain/: index.html sketch.css sketch.js work-smart-ambulance.html 
c:/Users/Prajwal/Desktop/Portfolio/design/directions/through-line/: _prototype-v1 data.js index.html shots sketch.css sketch.js stack.js 
dev: 000
Judging and the final-three pick are done: Signal Chain, Cross-Section and Through-Line. The interruption cut off the live sketches, so I'm reading the creative director's recommendation next.
Bash Extract synthesis recommendation
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_5a31129b-5ab"; SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; python -c "
import json
for line in open(r'$J/journal.jsonl', encoding='utf-8'):
    try: e=json.loads(line)
    except: continue
    if e.get('type')!='result': continue
    r=e.get('result', e.get('value'))
    if isinstance(r,str):
        try: r=json.loads(r)
        except: continue
    if isinstance(r,dict) and 'directions' in r:
        json.dump(r, open(r'$SPW/synth.json','w',encoding='utf-8'), indent=1, ensure_ascii=False)
        print('RECOMMENDED:', r['recommendation']['id']); print(r['recommendation']['reasoning']); print(); print('WHY THESE THREE:', r['whyTheseThree'][:900]); print()
        for d in r['directions']:
            print('==', d['id'], '|', d['name'], '|', d['oneLiner']); print('   palette:', [(p['name'],p['hex']) for p in d['palette']]); print('   type:', d['typography'][:300]); print()
"

OUT
RECOMMENDED: signal-chain
Pitch Signal Chain first. It is the only concept no judge ranked below second (7, 8 and 8), and it carries the strongest person-truth: the instrument he was trained on becomes the story of what he does now, so the moment people remember (noise locking into a full stack) is also the fastest read of his role. This refinement removes its two real weaknesses. First, the tech-count fingerprints are replaced by the bench: real architectures from his repositories that engineering leads can probe and stress with one honest what-if. That is Schematic's evidence, which two judges scored highest, grafted where it fits naturally, because a probe needs a scope. Second, the palette and the metaphor stack are disciplined: no orange, no PCB stackup, no test-point dots, plain-language navigation. It also has the most complete prototype (two static routes, working transitions, an LCP-safe intro, failsafes and a real motion toggle), so it is the lowest-risk path to an award-level build; validate it first with a 5-second recruiter test of the hero. Hold Cross-Section for a client who wants the most original, jury-facing piece: it was the Awwwards judge's first choice, it never needs a layer stack, and its sectioned name is the most iconic single image of the three. Hold Through-Line for a client who wants the warmest, calmest read and a human story: its threading is the most readable per-system proof in the set. Both are complete, buildable and stronger after these refinements.

WHY THESE THREE: Exploded View was set aside: lowest scores, an echo of his own Livora hero, and a career-as-layers mapping that misfiled his current role. Schematic was the hardest cut. Two judges ranked it first, but it shared Signal Chain's world (dark and technical), type system (Archivo Expanded + Martian Mono) and vocabulary (BOM, J1, revisions), so keeping both would have given Prajwal two versions of the same answer. Its best ideas survive where they fit: per-system wiring drawn from his repositories with probes and one honest what-if (Signal Chain's bench, Cross-Section's interiors and case pages), constant-speed signals, a Signals pause toggle, zero-idle rendering and one data file behind diagrams and skills.

The three now differ on every axis the brief asked for:
- World: phosphor screens on graphite with bone record sheets / a plaster surface over a dark interior, whose hero is literally hal

== signal-chain | Signal Chain | His site is an oscilloscope that locks onto a full stack developer: one noisy signal snaps into four clean layers and their sum, and every system he has shipped sits on the bench, wired as built, for you to probe.
   palette: [('Graphite (screen)', '#0E0F0D'), ('Bezel', '#171815'), ('Graticule', '#2B2D28'), ('Bone', '#ECE8DF'), ('Muted on dark', '#A29E93'), ('Dim on dark', '#85827A'), ('CH1 Interface amber', '#F2B53D'), ('CH2 Services teal', '#4EC1BC'), ('CH3 Data green', '#93CF63'), ('CH4 Intelligence blue', '#7FA8F5'), ('Ink', '#141512'), ('Muted on bone', '#57544C'), ('Rule on bone', '#CFCABE'), ('CH1 ink on bone', '#8A5F00'), ('CH2 ink on bone', '#0F6E6A'), ('CH3 ink on bone', '#386F17'), ('CH4 ink on bone', '#2F5DB8')]
   type: Display: Archivo (Google Fonts, OFL; variable wdth 62-125, wght 100-900; Latin woff2 about 90KB).
- Name: wdth 125, weight 800, uppercase, -0.035em, line-height 0.86, clamp(54px,10.2vw,170px); cap height sized to exactly one graticule division.
- H2: wdth 112 / 700, -0.03em, line-height 0.95, clamp(

== cross-section | Cross-Section | One instrument, a blue metrology laser, cuts through his name, through every system he has shipped and through the real ground he comes from, to show what is inside: solid all the way through.
   palette: [('Plaster', '#E7E8E4'), ('Plaster Deep', '#DCDDD8'), ('Ink', '#121311'), ('Graphite', '#4A4B47'), ('Stone', '#62635C'), ('Contour', '#C9CAC4'), ('Index Rule', '#ADAEA7'), ('Laser Blue', '#1D4ED8'), ('Interior', '#101214'), ('Bone', '#E8E9E4'), ('Ash', '#9A9B95'), ('Laser Azure', '#5C96FF')]
   type: Display and text: Mona Sans (Google Fonts, OFL; GitHub's open-source variable grotesk, wdth 75-125, wght 200-900), used at normal width: a dense, solid voice whose thick strokes make readable cross-sections, and a quiet nod to where all his work lives. Width stays at 100 so it never echoes an expand

== through-line | Through-Line | A short film on warm paper in which one red thread runs from Prajwal's name through every layer each system really uses, knotting where it is built and passing empty where it is not.
   palette: [('Bond Paper', '#EFE8DA'), ('Ink', '#141210'), ('Graphite', '#5B554D'), ('Laterite', '#B5341A'), ('Plate', '#F4EFE6'), ('Still', '#E5DED0'), ('Hairline', '#CFC6B5'), ('Projection', '#141210'), ('Safelight', '#E0522E'), ('Ash', '#B9B2A6')]
   type: Display: Sofia Sans Extra Condensed (Google Fonts, OFL; variable wght 1-1000), chosen over the prototype's Archivo wdth 62 so that this direction shares no type family with Signal Chain. Its long J descender is the one glyph that drops through the thread line.
- Name: 900, uppercase, fitted edge to
Signal Chain is my pick: it ties for the top judge score and no judge ranked it below second. Since I'm choosing for you, I'll skip finishing the other two sketches and the comparison board, and restart the dev server to check the Signal Chain sketch.
Bash Restart dev server and screenshot Signal Chain sketch
IN
(npx next dev -p 3000 > /c/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/dev.log 2>&1 &); SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; cd "$SPW/tools" && node shot.mjs --url "file:///C:/Users/Prajwal/Desktop/Portfolio/design/directions/signal-chain/index.html" --out "$SPW/shots/pick" --name sc --frames 600,1600,3000,5000 2>&1 | tail -4; node shot.mjs --url "file:///C:/Users/Prajwal/Desktop/Portfolio/design/directions/signal-chain/index.html" --out "$SPW/shots/pick" --name sc --wait 5000 --scroll steps:5 --wheel --settle 1300 2>&1 | tail -4; node shot.mjs --url "file:///C:/Users/Prajwal/Desktop/Portfolio/design/directions/signal-chain/index.html" --out "$SPW/shots/pick" --name sc --viewport mobile --wait 5000 2>&1 | tail -3; echo "dev: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/)"

OUT
LOGS:
[console.warning] GSAP target .parts tbody tr not found. https://gsap.com
[console.warning] GSAP target  not found. https://gsap.com
[console.warning] Element not found: .parts
LOGS:
[console.warning] GSAP target .parts tbody tr not found. https://gsap.com
[console.warning] GSAP target  not found. https://gsap.com
[console.warning] Element not found: .parts
[console.warning] GSAP target .parts tbody tr not found. https://gsap.com
[console.warning] GSAP target  not found. https://gsap.com
[console.warning] Element not found: .parts
dev: 200
Shell cwd was reset to C:\Users\Prajwal\Desktop\Portfolio
Bash List sketch screenshots
IN
ls "C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/shots/pick/"

OUT
sc-desktop-t00600.png
sc-desktop-t01600.png
sc-desktop-t03000.png
sc-desktop-t05000.png
sc-desktop-y00000.png
sc-desktop-y01353.png
sc-desktop-y02706.png
sc-desktop-y04059.png
sc-desktop-y05412.png
sc-mobile-view.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\pick\sc-desktop-t01600.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\pick\sc-desktop-t05000.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\pick\sc-desktop-y01353.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\pick\sc-desktop-y02706.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\pick\sc-mobile-view.png
The Signal Chain sketch works as the build's anchor, though it has flaws to fix: a stray "1234" label, a small label above the hero, section numbers like "02" that the quality rules ban, and bench details to check against your repos. I'm saving the chosen spec into the project and adapting the build workflow next.
Bash Save chosen direction spec; check Next docs
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; python -c "
import json
s=json.load(open(r'$SPW/synth.json',encoding='utf-8'))
d=[x for x in s['directions'] if x['id']=='signal-chain'][0]
json.dump(d, open(r'C:/Users/Prajwal/Desktop/Portfolio/design/directions/signal-chain/DIRECTION.json','w',encoding='utf-8'), indent=1, ensure_ascii=False)
json.dump({'recommendation':s['recommendation'],'whyTheseThree':s['whyTheseThree'],'directions':[{'id':x['id'],'name':x['name'],'oneLiner':x['oneLiner']} for x in s['directions']]}, open(r'C:/Users/Prajwal/Desktop/Portfolio/design/directions/SELECTION.json','w',encoding='utf-8'), indent=1, ensure_ascii=False)
print(len(json.dumps(d)),'bytes; sections:',[x['section'] for x in d['sections']])
"; ls /c/Users/Prajwal/Desktop/Portfolio/node_modules/next/dist/docs/ | head; cat /c/Users/Prajwal/Desktop/Portfolio/AGENTS.md | head -5; ls /c/Users/Prajwal/Desktop/Portfolio/

OUT
41501 bytes; sections: ['00 Source: hero and opening', '01 Signal: the job in his words', '02 Systems: the bench', '02.b Also built', '03 Stack: channel setup', '04 History: where the signal came from', '05 Connect', 'Footer', '/work/[slug]: datasheets']
01-app
02-pages
03-architecture
04-community
index.md
<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.
AGENTS.md
Prajwal_MP_Cover_Letter.pdf
Prajwal_M_P -- Java_Full_Stack.pdf
design
next-env.d.ts
next.config.ts
node_modules
out
package-lock.json
package.json
postcss.config.mjs
scripts
src
tsconfig.json
tsconfig.tsbuildinfo
1:53 PM
Now updating the build workflow to read the spec from disk and add the Next 16 docs and fact-checking rules:



Bash Patch build workflow to read spec from file
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; python - "$SPW/build-workflow.js" <<'EOF'
import sys,re
p=sys.argv[1]; s=open(p,encoding='utf-8').read()
def rep(old,new):
    global s
    assert old in s, old[:60]
    s=s.replace(old,new,1)
rep("const D = A.direction\n","const DPATH = A.directionPath\n")
rep("if (!D || !SKETCH) return { error: 'args.direction and args.sketchDir are required' }","if (!DPATH || !SKETCH) return { error: 'args.directionPath and args.sketchDir are required' }")
rep("const DJSON = JSON.stringify(D, null, 1)\n","")
rep("  'CHOSEN CREATIVE DIRECTION (approved by Prajwal; this is the contract):\\n' + DJSON,",
    "  'CHOSEN CREATIVE DIRECTION: \"Signal Chain\" (Prajwal delegated the choice; it was ranked top by the judges and the executive creative director). Its full spec is the contract - READ IT FIRST: ' + DPATH + ' (sections, palette, typography, motion, 3D, responsive, a11y, performance).',")
rep("  'NOTES FROM PRAJWAL (decisions he made): ' + (NOTES || 'none'),",
    "  'NEXT.JS 16 IS NEWER THAN YOUR TRAINING DATA (project AGENTS.md): before writing Next-specific code (routing, metadata, fonts, static export, generateStaticParams, params as Promise, config), read the relevant guide in ' + ROOT + '/node_modules/next/dist/docs/ (01-app, 03-architecture) and heed deprecation notices.',\n  'FACT CHECK: the sketch and spec contain project internals (e.g. model names, endpoints, counts like indexed documents, tool counts). Before any such detail ships, verify it in the public repository README via: curl -s -H \"Accept: application/vnd.github.raw\" https://api.github.com/repos/Prajwalps2603/<repo>/readme . Unverifiable details are dropped, never guessed. Verified internals belong in src/content/projects.ts (owned by the work area), with a comment naming the source.',\n  'NOTES (decisions made on Prajwal\\'s behalf): ' + (NOTES || 'none'),")
rep("  work: 'src/components/work/**, src/app/work/**',","  work: 'src/components/work/**, src/app/work/**, src/content/projects.ts',")
open(p,'w',encoding='utf-8').write(s)
print('patched; DJSON refs left:', s.count('DJSON'), '| D refs:', len(re.findall(r'\bD\b', s)))
EOF
grep -n "JSON.stringify(d\|DJSON\| D)" "$SPW/build-workflow.js" | head; (echo "(async () => {"; sed 's/^export const meta/const meta/' "$SPW/build-workflow.js"; echo "})"; ) > "$SPW/_check.js" && node --check "$SPW/_check.js" && echo "syntax OK"; rm -f "$SPW/_check.js"

OUT
Traceback (most recent call last):
  File "<stdin>", line 10, in <module>
  File "<stdin>", line 5, in rep
AssertionError:   'CHOSEN CREATIVE DIRECTION (approved by Prajwal; this is t
27:const DJSON = JSON.stringify(D, null, 1)
39:  'CHOSEN CREATIVE DIRECTION (approved by Prajwal; this is the contract):\n' + DJSON,
syntax OK
1:53 PM
The fourth replacement didn't match, so nothing was written (the script only writes at the end). Checking the exact text of that line:



Bash Show exact bytes of direction block lines
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; sed -n '36,42p' "$SPW/build-workflow.js" | cat -A | cut -c1-140

OUT
].join('\n')$
$
const DIRECTION_BLOCK = [$
  'CHOSEN CREATIVE DIRECTION (approved by Prajwal; this is the contract):\n' + DJSON,$
  'APPROVED LIVE SKETCH: ' + SKETCH + '/index.html (+ any sketch.js / sketch.css there; screenshots in ' + SKETCH + '/shots/). It is the vis
].join('\n\n')$
$
1:53 PM
The text matches by eye, so this is likely an escaping quirk between the shell and Python. Switching to direct edits instead:



Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js
Edit C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js
Modified
Edit C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js
Removed 1 line
Edit C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js
Added 2 lines
Edit C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js
Modified
1:54 PM
Checking nothing else still references the old variable, then running the syntax check:



Bash Verify script references and syntax
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; grep -n "DJSON\|\bD\b" "$SPW/build-workflow.js" | grep -v "DPATH\|DOSSIER\|DETECT\|DEV\b\|DIRECTION" | head; (echo "(async () => {"; sed 's/^export const meta/const meta/' "$SPW/build-workflow.js"; echo "})"; ) > "$SPW/_check.js" && node --check "$SPW/_check.js" && echo "syntax OK"; rm -f "$SPW/_check.js"

OUT
syntax OK
1:54 PM
Clean. Launching the build with Signal Chain as the direction:



Workflow
IN
{
  "scriptPath": "C:\\Users\\Prajwal\\AppData\\Local\\Temp\\claude\\c63fa3b175684c35\\1ea4c338-95b1-421e-9894-caa3190369b6\\scratchpad\\build-workflow.js",
  "args": {
    "directionPath": "C:/Users/Prajwal/Desktop/Portfolio/design/directions/signal-chain/DIRECTION.json",
    "sketchDir": "C:/Users/Prajwal/Desktop/Portfolio/design/directions/signal-chain",
    "maxRounds": 3,
    "notes": "SECTION OWNERSHIP vs the spec's section plan: '00 Source: hero and opening' -> intro-hero; '01 Signal: the job in his words' -> about; '02 Systems: the bench', '02.b Also built' and '/work/[slug]: datasheets' -> work; '03 Stack: channel setup' -> skills; '04 History: where the signal came from' (experience, education, certifications) -> about; '05 Connect' and 'Footer' -> contact; the background graticule / live traces / WebGL layer -> scene; header, channel navigation, cursor, TRIG'D status, motion toggle, page transitions -> foundation. KNOWN SKETCH DEFECTS TO NOT CARRY OVER: a stray '1234' debug label overlapping the bench header; an eyebrow line above the name ('ELECTRONICS & COMMUNICATION ENGINEER -> FULL STACK DEVELOPER') which the craft floor bans as an eyebrow - keep the idea (ECE -> Full Stack) but integrate it into the composition differently; section numbers like '02 WORK' are allowed only if they act as real channel/sequence information in this world; GSAP warnings about missing '.parts' targets; some bench internals that must be fact-checked against READMEs. DECISIONS: featured projects are the six marked featured in src/content/projects.ts (Drone Intelligence, Brain Tumor Detection, ResumAI, Audify AI, BookMyVenue, MCP Job Agent); others go in 'Also built'. Livora is described neutrally (a studio website he built) - do not claim he founded it. No phone number anywhere. Resume link = profile.resume (Google Drive). Email = prajwalnair2603@gmail.com."
  }
}
OUT
Workflow launched in background. Task ID: wxtt2dl19
Summary: Build the chosen creative direction into the Next.js portfolio, then refine it in browser-verified review loops
Transcript dir: C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\1ea4c338-95b1-421e-9894-caa3190369b6\subagents\workflows\wf_7b4c63a2-f5d
Script file: C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js
(Edit this file with Write/Edit and re-invoke Workflow with {scriptPath: "C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js"} to iterate without resending the script.)
Run ID: wf_7b4c63a2-f5d
To resume after editing the script: Workflow({scriptPath: "C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js", resumeFromRunId: "wf_7b4c63a2-f5d"}) — completed agents return cached results (cached results may themselves be empty — inspect journal.jsonl before assuming there is something to recover).

You will be notified when it completes. Use /workflows to watch live progress.
1:54 PM
Not done yet. The build started a moment ago (about 14:00).

What happened: the previous Claude Code session ended at about 13:45, and that stopped the direction workflow partway through building the sketches. All the judging and selection work had already finished and was saved.

The pick: I chose Signal Chain, as you asked me to. It tied for the top judge score, no judge ranked it below second, and the creative director recommended it. Its hero is an oscilloscope: a noisy signal "locks" into five colour-coded channels (interface, services, data, AI, delivery) under "PRAJWAL M P / Full Stack Developer". Further down is a "bench" where each of your systems is drawn as you built it, and visitors can probe the connections between parts. You can open the sketch now at design/directions/signal-chain/index.html.

I skipped finishing the other two sketches and the comparison board, since you'd delegated the choice. That saved about 1.5 hours.

Now running:

Foundation: design system, motion system, cursor, page transitions, navigation.
Six sections built in parallel.
Integration and a production build.
Up to three rounds of screenshot review and fixes.
A final GitHub Pages check and the README.
The build will fix the sketch's known flaws (a stray "1234" debug label, banned label and number patterns, a few warnings), and it checks every project detail against your GitHub READMEs.

Estimate: done around 19:00–21:00. Keep VS Code and this Claude Code session open — if the session ends, the build stops again. Finished steps are saved, though, so I can resume it rather than restart.



1:54 PM
These warnings are again about the design sketches, but the situation has changed: those files are now a frozen archive, not shipped and no longer edited by any agent. The build has its own rule that text size and spacing rules beat the sketch, so repeated warnings on the archive are just noise. I'll scope the hook away from design/directions/ and keep it on the real site. Checking the hook's ignore syntax first:



Bash Read impeccable hook ignore syntax
IN
grep -n -i -A4 "ignore-file\|ignore-value\|ignore-rule" /c/Users/Prajwal/.claude/skills/impeccable/reference/hooks.md | head -60

OUT
32:| `ignore-rule <id>` | Append `<id>` to `detector.ignoreRules`; for `overused-font`, requires `--all-values`. Suppresses the rule across the whole project. |
33:| `ignore-file <glob>` | Append `<glob>` to `detector.ignoreFiles`. Suppresses **every** rule for matching files. |
34:| `ignore-value <id> <value> [--shared] [--reason "..."]` | Append a rule/value suppression to shared `.impeccable/config.json`. |
35:| `ignore-value <id> <value> --local [--reason "..."]` | Append a private rule/value suppression to `.impeccable/config.local.json`. |
36:| `ignore-value <id> "*" --file <glob> [--file <glob>...]` | Turn one rule off in matching files only, leaving it active everywhere else. Repeat `--file`, or use `--file=<glob>` / `--files=<glob>`. A bare `"*"` with no `--file` is refused: use `ignore-rule <id>` if you really mean project-wide. |
37-| `reset` | Delete the project config, dedup cache, and Cursor pending queue, and remove the hook's entries from every provider manifest `on` installs, the committed Copilot file included (a team-shared `settings.json` that `on` never writes is never touched). |
38-
39-## Flow
40-
--
50:5. If `<action>` is `ignore-value`, `ignore-file`, or `ignore-rule`, just print the script output. The default scope is shared `.impeccable/config.json`; add `--local` only when the user explicitly asks for a private exception.
51-6. If `<action>` is `status`, just print the script output. Do not add commentary unless the user asked a follow-up question.
52-
53-## Triage findings
54-
--
61:Self-serve stops at `ignore-value`. `ignore-file` and `ignore-rule` silence too much to add on your own judgment; ask the user first.
62-
63-Prefer the narrowest exception:
64-
65:- If the finding line shows an `ignore-value <rule> <value>` pair, pass it to `impeccable hooks ignore-value` with your `--reason`. This writes shared `.impeccable/config.json` by default.
66:- For value-specific findings such as `overused-font` and `bounce-easing`, use `ignore-value` for the specific value. Do not use `ignore-rule overused-font` for a specific font.
67:- If the finding has no value-specific command, such as `side-tab`, scope that one rule to the file: `ignore-value <id> "*" --file <path>`. Run `npx impeccable detect <path>` first to see what actually fires there.
68:- Reach for `ignore-file <path>` only when the whole file is out of scope for design review: a fixture, a generated artifact, a deliberate slop demo. It silences every rule for that file permanently, including rules that have not been written yet. A real UI surface with one noisy rule wants the file-scoped value ignore above.
69:- Use `ignore-rule <id>` only when the user asks to suppress that whole rule across the project. For broad overused-font suppression, use `ignore-rule overused-font --all-values` only when the user asks to ignore overused fonts generally.
70-- Prefer config ignores (the commands above) by default; they keep suppressions in one reviewable place. Reach for an inline comment only when the waiver must travel with a single file that leaves the repo (a generated/exported standalone document, an emailed HTML file). The supported marker is `impeccable-disable <rule>` (whole file) or `impeccable-disable-line` / `impeccable-disable-next-line` (one line), in any comment syntax, with an optional reason after `:` or `--`. The detector honors it by default; `--no-inline-ignores` or `--no-config` bypasses it.
71-
72-Example value-specific exception:
73-
--
75:.claude/skills/impeccable/scripts/impeccable hooks ignore-value overused-font Inter --shared --reason "User confirmed Inter is intentional"
76-```
77-
78-Example self-served exception, with the evidence named:
79-
--
81:.claude/skills/impeccable/scripts/impeccable hooks ignore-value bounce-easing bounce-ball --shared --reason "Agent: literal ball-bounce animation, bounce easing is the subject"
82-```
83-
84-Example whole-rule font exception:
85-
--
87:.claude/skills/impeccable/scripts/impeccable hooks ignore-rule overused-font --all-values --reason "User asked to ignore overused fonts generally"
88-```
89-
90-Example one-rule-in-one-file exception, for a file that is still worth reviewing
91-for everything else:
--
94:.claude/skills/impeccable/scripts/impeccable hooks ignore-value design-system-font-size "*" --file "src/overlay/widget.js" --reason "Injected widget builds its own type scale; DESIGN.md's ramp describes the site"
95-```
96-
97-Example whole-file exception, for a file that is out of scope entirely:
98-
--
100:.claude/skills/impeccable/scripts/impeccable hooks ignore-file "src/legacy/Card.tsx"
101-```
102-
103-## Constraints
104-
1:54 PM
I'll hold off on the mute. The skill's own policy says whole-file ignores need your OK, so I've left the warnings in place. They're all in the archived sketches under design/directions/, which never ship. The real site is built under stricter rules: text is never below 11px, and those rules win wherever a sketch breaks them.

Want me to mute the design hook for design/directions/ so these sketch warnings stop appearing?



do as u like
2:17 PM
You've OK'd it, so I'm muting the design hook for the sketch archive only. The real site keeps being checked.



Bash Ignore design sketch folder in design hook
IN
/c/Users/Prajwal/.claude/skills/impeccable/scripts/bin/windows-x64/impeccable.exe hooks ignore-file "design/directions/**" 2>&1 | tail -5; echo "---"; cat .impeccable/config.json 2>/dev/null | head -30

OUT
Added "design/directions/**" to shared detector.ignoreFiles (.impeccable\config.json). Current: design/directions/**
---
{
  "detector": {
    "ignoreRules": [],
    "ignoreFiles": [
      "design/directions/**"
    ],
    "ignoreValues": []
  }
}
2:17 PM
The design hook no longer checks design/directions/ (the archived sketches), so those warnings won't show up again. Everything under src/, the actual site, is still checked. The setting is in .impeccable/config.json if you ever want to undo it.

The build is moving: the foundation agent has already written the Signal Chain design tokens, the smooth-scroll and pointer code, and the intro timing. When it finishes, the six section builders start in parallel. Still on track for roughly 19:00–21:00.



when it will bw done
Bash Check build workflow progress
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_7b4c63a2-f5d"; echo "now: $(date +%H:%M:%S)"; stat -c '%w' "$J/journal.jsonl" | cut -c12-19 | xargs echo "started:"; python -c "
import json
started={}; done=set()
for line in open(r'$J/journal.jsonl', encoding='utf-8'):
    try: e=json.loads(line)
    except: continue
    t=e.get('type')
    if t=='started': started[e.get('agentId')]=e.get('label')
    elif t=='result': done.add(e.get('agentId'))
for a,l in started.items(): print('DONE   ' if a in done else 'RUNNING', l)
"

OUT
now: 14:18:18
started: 13:54:33
RUNNING foundation
2:18 PM
It's on the first stage. The foundation agent started at 13:54 and has been working for 24 minutes; nothing has finished yet. My estimate:

Stage	Expected done by
Foundation: design system, motion, cursor, transitions, navigation	~14:45–15:00
Six sections built in parallel	~16:00–16:30
Integration and first production build	~16:30–17:00
Refinement rounds (~1.5–2 h each, 2–3 rounds)	~20:00–22:00
GitHub Pages check and README	+30 min
Most likely finish: about 20:00–22:00 tonight. That's a bit later than I said earlier. Each refinement round runs a full production build, four reviewers, and fixes made in parallel, and that's where most of the time goes.

If you want it sooner, say "two rounds" and I'll cap refinement at two, which should land around 19:00–20:00. Keep this session open until it's done.



make it fast use diffrent models to build it
2:19 PM
I'll speed it up two ways:

Mix models by job. Keep the strongest model on the hardest visual work (intro/hero and the WebGL scene). Use faster models elsewhere: Sonnet for most section builds, fixes and integration, Haiku for the mechanical screenshot runs. The visual-craft review goes to a third model (Fable), so its judgment is independent of the builders'.
Cap refinement at 2 rounds.
The foundation agent is mid-run, and stopping it now would throw away its work. So I'll edit the script, wait for the foundation to finish, then restart the workflow. The finished foundation result is saved and gets reused automatically. Loading the tools for that:



2:19 PM
Now the edits. They only touch agents that run after the foundation, so the foundation's saved result still gets reused:



Bash Back up script and locate agent calls
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; cp "$SPW/build-workflow.js" "$SPW/build-workflow.v1.js"; grep -n "{ area: '\|label: 'build:'\|label: 'integrate'\|label: 'capture:r'\|label: 'review:'\|label: 'triage:r'\|label: 'fix:'\|label: 'integrate:r'\|label: 'finish'\|{ key: '" "$SPW/build-workflow.js" | cut -c1-150

OUT
191:  { area: 'intro-hero', task: 'Build the cinematic OPENING SEQUENCE and the HERO exactly as the direction specifies (openingSequence, heroTypograp
192:  { area: 'scene', task: 'Build the INTERACTIVE VISUAL BACKGROUND and the INTERACTIVE 3D ELEMENTS (interactiveBackground, threeD in the spec) with
193:  { area: 'work', task: 'Build the ANIMATED PROJECT SHOWCASE on the home page (projectShowcase in the spec) for the featured projects, an archive 
194:  { area: 'about', task: 'Build the CREATIVE ABOUT section (aboutSection in the spec) and the EXPERIENCE presentation (roles, with the current Ful
195:  { area: 'skills', task: 'Build the ANIMATED SKILLS AND TECHNOLOGY presentation (skillsPresentation in the spec) from src/content/skills.ts: grou
196:  { area: 'contact', task: 'Build the CONTACT section with refined transitions (contactSection in the spec) and the FOOTER: the real email as a la
206:]), { label: 'build:' + s.area, phase: 'Sections', schema: RESULT })))
218:let integ = await agent(integratePrompt('after the parallel section build', allIssues), { label: 'integrate', phase: 'Integrate', schema: INTEG })
223:  { key: 'craft', lens: 'Awwwards Site-of-the-Day juror and studio design director. Judge the first-viewport memory test, typography craft, compos
224:  { key: 'motion', lens: 'Motion director. Judge the intro pacing (filmstrip), hero type animation, scroll choreography (is there one authored mom
225:  { key: 'qa', lens: 'Frontend QA, accessibility and performance engineer. Judge console/hydration errors, horizontal overflow at every viewport, 
226:  { key: 'hiring', lens: 'Engineering manager and tech recruiter who reviews 50 portfolios a week. Within 10 seconds: is it clear he is a Full Sta
270:  const cap = await agent(capturePrompt(round), { label: 'capture:r' + round, phase: 'Refine', schema: CAPTURE })
272:  const reviews = (await parallel(LENSES.map((l) => () => agent(reviewPrompt(l, cap, round), { label: 'review:' + l.key + ':r' + round, phase: 'Re
274:  const plan = await agent(triagePrompt(reviews, round), { label: 'triage:r' + round, phase: 'Refine', schema: PLAN })
280:  const fixed = await parallel(work.map((w) => () => agent(fixPrompt(w, round), { label: 'fix:' + w.area + ':r' + round, phase: 'Refine', schema: 
282:  integ = await agent(integratePrompt('after refinement round ' + round, leftovers), { label: 'integrate:r' + round, phase: 'Refine', schema: INTE
297:].join('\n\n'), { label: 'finish', phase: 'Finish', schema: RESULT })
Bash Add model routing to later agents
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; F="$SPW/build-workflow.js"; python - "$F" <<'PYEOF'
import sys
p=sys.argv[1]; s=open(p,encoding='utf-8').read()
def rep(old,new,count=1):
    global s
    n=s.count(old)
    assert n==count, (old[:70], n)
    s=s.replace(old,new)
# model routing table (inserted after AREAS definition)
rep("const RESULT = {", "// Model routing: strongest model (inherited) for the hardest visual work; faster models elsewhere.\nconst AREA_MODEL = { 'intro-hero': undefined, scene: undefined, foundation: undefined, work: 'sonnet', about: 'sonnet', skills: 'sonnet', contact: 'sonnet' }\nconst withModel = (opts, model) => (model ? Object.assign(opts, { model }) : opts)\n\nconst RESULT = {")
rep("]), { label: 'build:' + s.area, phase: 'Sections', schema: RESULT })))", "]), withModel({ label: 'build:' + s.area, phase: 'Sections', schema: RESULT }, AREA_MODEL[s.area]))))")
rep("{ label: 'integrate', phase: 'Integrate', schema: INTEG })", "{ label: 'integrate', phase: 'Integrate', schema: INTEG, model: 'sonnet' })")
rep("{ key: 'craft', lens:", "{ key: 'craft', model: 'fable', lens:")
rep("{ key: 'motion', lens:", "{ key: 'motion', model: 'sonnet', lens:")
rep("{ key: 'qa', lens:", "{ key: 'qa', model: 'sonnet', lens:")
rep("{ key: 'hiring', lens:", "{ key: 'hiring', model: 'haiku', lens:")
rep("{ label: 'capture:r' + round, phase: 'Refine', schema: CAPTURE })", "{ label: 'capture:r' + round, phase: 'Refine', schema: CAPTURE, model: 'haiku', effort: 'low' })")
rep("{ label: 'review:' + l.key + ':r' + round, phase: 'Refine', schema: FINDINGS })", "{ label: 'review:' + l.key + ':r' + round, phase: 'Refine', schema: FINDINGS, model: l.model })")
rep("{ label: 'triage:r' + round, phase: 'Refine', schema: PLAN })", "{ label: 'triage:r' + round, phase: 'Refine', schema: PLAN, model: 'sonnet' })")
rep("{ label: 'fix:' + w.area + ':r' + round, phase: 'Refine', schema: RESULT })", "withModel({ label: 'fix:' + w.area + ':r' + round, phase: 'Refine', schema: RESULT }, AREA_MODEL[w.area])")
rep("{ label: 'integrate:r' + round, phase: 'Refine', schema: INTEG })", "{ label: 'integrate:r' + round, phase: 'Refine', schema: INTEG, model: 'sonnet' })")
rep("{ label: 'finish', phase: 'Finish', schema: RESULT })", "{ label: 'finish', phase: 'Finish', schema: RESULT, model: 'sonnet' })")
open(p,'w',encoding='utf-8').write(s); print('patched')
PYEOF
(echo "(async () => {"; sed 's/^export const meta/const meta/' "$F"; echo "})"; ) > "$SPW/_c.js" && node --check "$SPW/_c.js" && echo "syntax OK"; rm -f "$SPW/_c.js"; diff <(sed -n '/^const STACK/,/^const AREAS/p' "$SPW/build-workflow.v1.js") <(sed -n '/^const STACK/,/^const AREAS/p' "$F") && echo "shared prompt blocks unchanged (foundation cache safe)"; diff <(sed -n "/^phase('Foundation')/,/^if (!foundation)/p" "$SPW/build-workflow.v1.js") <(sed -n "/^phase('Foundation')/,/^if (!foundation)/p" "$F") && echo "foundation call unchanged"

OUT
patched
C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\_c.js:285
  const fixed = await parallel(work.map((w) => () => agent(fixPrompt(w, round), withModel({ label: 'fix:' + w.area + ':r' + round, phase: 'Refine', schema: RESULT }, AREA_MODEL[w.area])))
                                                                                                                                                                                          ^

SyntaxError: missing ) after argument list
    at wrapSafe (node:internal/modules/cjs/loader:1735:18)
    at checkSyntax (node:internal/main/check_syntax:76:3)

Node.js v24.13.1
shared prompt blocks unchanged (foundation cache safe)
foundation call unchanged
2:19 PM
One bracket is unbalanced on the fixer line. Fixing it:



Bash Compare fixer line before and after
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; F="$SPW/build-workflow.js"; grep -n "const fixed = " "$F"; grep -n "const fixed = " "$SPW/build-workflow.v1.js"

OUT
284:  const fixed = await parallel(work.map((w) => () => agent(fixPrompt(w, round), withModel({ label: 'fix:' + w.area + ':r' + round, phase: 'Refine', schema: RESULT }, AREA_MODEL[w.area])))
280:  const fixed = await parallel(work.map((w) => () => agent(fixPrompt(w, round), { label: 'fix:' + w.area + ':r' + round, phase: 'Refine', schema: RESULT })))
2:19 PM
My replacement swallowed the closing parenthesis of the agent(...) call. Adding it back:



Bash Fix paren and re-check syntax
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; F="$SPW/build-workflow.js"; sed -i "284s/AREA_MODEL\[w.area\])))\$/AREA_MODEL[w.area]))))/" "$F"; sed -n '284p' "$F" | cut -c100-; (echo "(async () => {"; sed 's/^export const meta/const meta/' "$F"; echo "})"; ) > "$SPW/_c.js" && node --check "$SPW/_c.js" && echo "syntax OK"; rm -f "$SPW/_c.js"; grep -c "model" "$F"

OUT
'fix:' + w.area + ':r' + round, phase: 'Refine', schema: RESULT }, AREA_MODEL[w.area]))))
syntax OK
13
[This command modified 1 file you've previously read: ..\..\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js. Call Read before editing.]
2:20 PM
Syntax is clean. Now a background watcher that fires the moment the foundation agent finishes, so I can switch the workflow over without wasting its work:



Bash Wait for foundation agent to finish
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_7b4c63a2-f5d/journal.jsonl"; until [ "$(grep -c '"type":"result"' "$J")" -ge 1 ] || grep -q '"label":"build:' "$J"; do sleep 5; done; date +%H:%M:%S; grep -o '"type":"[a-z]*"[^}]\{0,80\}' "$J" | tail -4

OUT
Command running in background with ID: bfeaz392k. Output is being written to: C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\tasks\bfeaz392k.output. You will be notified when it completes — do not poll that file or sleep while waiting. Read the file only if the user asks for progress, or if you need a line it prints before you can go on, such as a server's ready line or port.
2:20 PM
Making sure that pattern actually matches the journal's format, so the watcher doesn't wait forever:



Bash Verify journal format for grep
IN
head -c 400 "C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_7b4c63a2-f5d/journal.jsonl"; echo; grep -c '"type":"result"' "C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_5a31129b-5ab/journal.jsonl"

OUT
{"type":"launched"}
{"type":"started","key":"v2:40ea8222bd58eb387493ebaafb2ff10de741e651fff517530bc33e7865865359","agentId":"a55849c1bd094fd64","label":"foundation","phase":"Foundation"}

10
2:20 PM
The watcher pattern is confirmed, so the switch to faster models will happen automatically.

Model split:

Work	Model
Foundation (running now), intro/hero, WebGL scene, and fixes to those two	Opus (strongest)
Work/projects, about/experience, skills and contact sections; their fixes; integration, triage, final checks	Sonnet (faster)
Screenshot runs, recruiter-eye review	Haiku (fastest)
Visual-craft review	Fable, a different model from the builders, so its judgment is independent
Refinement is capped at 2 rounds instead of 3.

The foundation agent is about 35 minutes into a roughly 45–60 minute job. When it finishes, the watcher alerts me, and I stop and restart the workflow with these settings. The finished foundation is reused from its saved result, so nothing is redone.

New estimate: done around 18:00–19:00, about 2 hours sooner than before.



do as u like
2:21 PM
Thanks. Nothing needs your input right now. The watcher is waiting for the foundation agent, which was about 35–40 minutes into its run. When it finishes, I'll restart the workflow with the model split and two refinement rounds, reusing the foundation work. I'll update you when the section builders start and again when the site is ready, around 18:00–19:00.



pause when i will say run on that time u start to continue
2:21 PM
Pausing now. First checking whether the foundation agent has finished, because that decides what can be reused when you say "run":



Bash Check foundation status before pausing
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_7b4c63a2-f5d/journal.jsonl"; date +%H:%M:%S; grep -o '"type":"[a-z]*"[^}]\{0,40\}"label":"[^"]*"' "$J"; grep -c '"type":"result"' "$J"

OUT
14:21:49
0
Bash Show build journal entries
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_7b4c63a2-f5d/journal.jsonl"; cat "$J" | cut -c1-200

OUT
{"type":"launched"}
{"type":"started","key":"v2:40ea8222bd58eb387493ebaafb2ff10de741e651fff517530bc33e7865865359","agentId":"a55849c1bd094fd64","label":"foundation","phase":"Foundation"}
The foundation agent is about 27 minutes in and hasn't finished, but its files are already on disk, so a restart will pick up from them. I'm stopping the build and the watcher now.
TaskStop
IN
{
  "task_id": "wxtt2dl19"
}
OUT
{"message":"Successfully stopped task: wxtt2dl19 (Build the chosen creative direction into the Next.js portfolio, then refine it in browser-verified review loops)","task_id":"wxtt2dl19","task_type":"local_workflow","command":"Build the chosen creative direction into the Next.js portfolio, then refine it in browser-verified review loops"}
TaskStop
IN
{
  "task_id": "bfeaz392k"
}
OUT
{"message":"Successfully stopped task: bfeaz392k (J=\"C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_7b4c63a2-f5d/journal.jsonl\"; until [ \"$(grep -c '\"type\":\"result\"' \"$J\")\" -ge 1 ] || grep -q '\"label\":\"build:' \"$J\"; do sleep 5; done; date +%H:%M:%S; grep -o '\"type\":\"[a-z]*\"[^}]\\{0,80\\}' \"$J\" | tail -4)","task_id":"bfeaz392k","task_type":"local_bash","command":"J=\"C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_7b4c63a2-f5d/journal.jsonl\"; until [ \"$(grep -c '\"type\":\"result\"' \"$J\")\" -ge 1 ] || grep -q '\"label\":\"build:' \"$J\"; do sleep 5; done; date +%H:%M:%S; grep -o '\"type\":\"[a-z]*\"[^}]\\{0,80\\}' \"$J\" | tail -4"}
2:22 PM
Both are stopped. Saving the resume details to memory, so I can continue even if this session closes before you say "run":



Write C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\memory\portfolio-build-paused.md
16 lines
---
name: portfolio-build-paused
description: Portfolio build workflow is PAUSED at the user's request (2026-11-05 ~14:22) — resume only when he says "run"; how to resume
metadata:
  type: project
---

Prajwal asked to pause the portfolio build on 2026-11-05 at ~14:22 and to continue only when he says "run".

State at pause:
- Creative direction chosen: **Signal Chain** (spec: design/directions/signal-chain/DIRECTION.json; sketch: design/directions/signal-chain/index.html).
- Build workflow run id `wf_7b4c63a2-f5d` was stopped during the Foundation agent (~27 min in, not finished; its partial files are on disk in src/: globals.css tokens, layout, fonts, motion libs, chrome/cursor/transition stubs).
- Script: C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js (already patched with model routing: Opus for foundation/intro-hero/scene, Sonnet for other sections/integrate/triage/fixes/finish, Haiku for capture + hiring review, Fable for craft review).

**How to apply:** on "run", restart the dev server (npx next dev -p 3000) and relaunch Workflow with scriptPath above + resumeFromRunId wf_7b4c63a2-f5d and args {directionPath, sketchDir, notes (unchanged), maxRounds: 2}. The foundation agent re-runs (not cached) but finds its files on disk. Related: [[prefers-autonomous-runs]], [[portfolio-project-facts]]
Edit C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\memory\MEMORY.md
Added 1 line
2:22 PM
The build is paused, and nothing will run until you say "run".

Where it stopped: the foundation agent had been working for about 27 minutes on the Signal Chain design system, layout, fonts and motion setup. It wasn't finished, but everything it wrote is saved in the project.

When you say "run":

I resume the same workflow. The foundation agent starts again but builds on the files already on disk, so it should take about 15–30 minutes instead of 50.
Then the six sections build in parallel, followed by 2 refinement rounds and the final checks. The faster model mix is already set up.
It should take roughly 3.5–4.5 hours from when you say "run".
I saved the resume details to memory, so this works even if you close VS Code or this session in the meantime. The dev server on port 3000 is still running; it uses almost nothing while idle.



Idle 19h 14m. The prompt cache has likely expired, so your next message will re-cache about 376k tokens.
start , continuer where u left
Bash Restart dev server, confirm script exists
IN
(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q 200 || (npx next dev -p 3000 > /c/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/dev.log 2>&1 &)); sleep 8; echo "dev: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/)"; ls /c/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/build-workflow.js

OUT
dev: 200
/c/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/build-workflow.js
Workflow
IN
{
  "scriptPath": "C:\\Users\\Prajwal\\AppData\\Local\\Temp\\claude\\c63fa3b175684c35\\1ea4c338-95b1-421e-9894-caa3190369b6\\scratchpad\\build-workflow.js",
  "resumeFromRunId": "wf_7b4c63a2-f5d",
  "args": {
    "directionPath": "C:/Users/Prajwal/Desktop/Portfolio/design/directions/signal-chain/DIRECTION.json",
    "sketchDir": "C:/Users/Prajwal/Desktop/Portfolio/design/directions/signal-chain",
    "maxRounds": 2,
    "notes": "SECTION OWNERSHIP vs the spec's section plan: '00 Source: hero and opening' -> intro-hero; '01 Signal: the job in his words' -> about; '02 Systems: the bench', '02.b Also built' and '/work/[slug]: datasheets' -> work; '03 Stack: channel setup' -> skills; '04 History: where the signal came from' (experience, education, certifications) -> about; '05 Connect' and 'Footer' -> contact; the background graticule / live traces / WebGL layer -> scene; header, channel navigation, cursor, TRIG'D status, motion toggle, page transitions -> foundation. KNOWN SKETCH DEFECTS TO NOT CARRY OVER: a stray '1234' debug label overlapping the bench header; an eyebrow line above the name ('ELECTRONICS & COMMUNICATION ENGINEER -> FULL STACK DEVELOPER') which the craft floor bans as an eyebrow - keep the idea (ECE -> Full Stack) but integrate it into the composition differently; section numbers like '02 WORK' are allowed only if they act as real channel/sequence information in this world; GSAP warnings about missing '.parts' targets; some bench internals that must be fact-checked against READMEs. DECISIONS: featured projects are the six marked featured in src/content/projects.ts (Drone Intelligence, Brain Tumor Detection, ResumAI, Audify AI, BookMyVenue, MCP Job Agent); others go in 'Also built'. Livora is described neutrally (a studio website he built) - do not claim he founded it. No phone number anywhere. Resume link = profile.resume (Google Drive). Email = prajwalnair2603@gmail.com."
  }
}
OUT
Workflow launched in background. Task ID: watwba9jv
Summary: Build the chosen creative direction into the Next.js portfolio, then refine it in browser-verified review loops
Transcript dir: C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\1ea4c338-95b1-421e-9894-caa3190369b6\subagents\workflows\wf_7b4c63a2-f5d
Script file: C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js
(Edit this file with Write/Edit and re-invoke Workflow with {scriptPath: "C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js"} to iterate without resending the script.)
Run ID: wf_7b4c63a2-f5d
To resume after editing the script: Workflow({scriptPath: "C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\build-workflow.js", resumeFromRunId: "wf_7b4c63a2-f5d"}) — completed agents return cached results (cached results may themselves be empty — inspect journal.jsonl before assuming there is something to recover).

You will be notified when it completes. Use /workflows to watch live progress.
Edit C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\memory\MEMORY.md
Modified
10:17 AM
The build is running again from where it paused, with the Signal Chain direction, the faster model mix and 2 refinement rounds. I restarted the dev server on port 3000.

The foundation step runs again, but its files from yesterday are already in the project, so it should go quicker this time. After that, six section builders work in parallel, then come 2 rounds of screenshot review and fixes, and finally the GitHub Pages check and README.

It should take about 3.5–4.5 hours. I'll let you know when it's done. Keep this session open; if it closes, I can resume the same way.



check it is done
Bash Check build progress
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_7b4c63a2-f5d/journal.jsonl"; date +%H:%M; python -c "
import json
s={};d=set()
for l in open(r'$J',encoding='utf-8'):
    e=json.loads(l)
    if e.get('type')=='started': s[e['agentId']]=e.get('label')
    elif e.get('type')=='result': d.add(e.get('agentId'))
for a,l in s.items(): print('DONE ' if a in d else 'RUN  ', l)
"

OUT
11:05
RUN   foundation
DONE  foundation
DONE  build:intro-hero
DONE  build:scene
DONE  build:work
DONE  build:about
DONE  build:skills
DONE  build:contact
DONE  integrate
DONE  capture:r1
RUN   review:craft:r1
DONE  review:motion:r1
DONE  review:hiring:r1
DONE  review:qa:r1
11:05 AM
Not done yet, but most of the build is finished. It's now in the first refinement round.

✅ Foundation: design system, motion, cursor, page transitions, navigation.
✅ All six sections: intro and hero, the oscilloscope/WebGL scene, work and case-study pages, about and experience, skills, contact.
✅ First production build passed.
✅ Round 1 screenshots across desktop, tablet, mobile and reduced motion.
✅ Three of four reviews done: motion, QA/accessibility and recruiter.
⏳ Visual-craft review still running.
After that: round 1 fixes, round 2 (screenshots, reviews and fixes again), then the GitHub Pages check and README.
Estimated finish: about 2–2.5 hours from now (around 13:00–13:30). You can already look at the work in progress at http://localhost:3000, but expect it to change during the fix rounds.



check it is done
Bash Check build progress
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_7b4c63a2-f5d/journal.jsonl"; date +%H:%M; python -c "
import json
s={};d=set()
for l in open(r'$J',encoding='utf-8'):
    e=json.loads(l)
    if e.get('type')=='started': s[e['agentId']]=e.get('label')
    elif e.get('type')=='result': d.add(e.get('agentId'))
for a,l in list(s.items())[13:]: print('DONE ' if a in d else 'RUN  ', l)
"

OUT
12:03
DONE  review:qa:r1
DONE  triage:r1
DONE  fix:work:r1
DONE  fix:foundation:r1
DONE  fix:scene:r1
DONE  fix:intro-hero:r1
DONE  fix:about:r1
DONE  fix:skills:r1
DONE  fix:contact:r1
DONE  integrate:r1
DONE  capture:r2
DONE  review:craft:r2
DONE  review:motion:r2
DONE  review:hiring:r2
DONE  review:qa:r2
DONE  triage:r2
RUN   fix:work:r2
RUN   fix:intro-hero:r2
RUN   fix:scene:r2
RUN   fix:foundation:r2
DONE  fix:about:r2
DONE  fix:skills:r2
12:03 PM
Not done yet, but it's close: the final round of fixes is running now.

✅ Round 1 is complete: four reviews, fixes in all seven areas, and a clean production build.
✅ Round 2 screenshots and all four reviews are done.
⏳ Round 2 fixes: about and skills are finished. Work/projects, intro and hero, the WebGL scene and site-wide polish are still in progress.
Still to come: one last production build and the GitHub Pages check plus README.
Estimated finish: about 45–75 minutes from now (around 12:50–13:15). I'll be notified the moment it completes. When it does, I'll check the result in the browser myself and send you the final summary with screenshots.



12:23 PM
The build workflow finished: 36 agents, no errors, about 2 hours. Before telling you it's done, I'll read the full result and check the site in a real browser myself.



Bash Read workflow rounds, integration and finish results
IN
python -c "
import json,re
raw=open(r'C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/tasks/watwba9jv.output',encoding='utf-8').read()
i=raw.find('{'); 
try:
    r=json.loads(raw[i:raw.rfind('}')+1])
except Exception as e:
    print('parse fail',e); print(raw[:3000]); raise SystemExit
print('ROUNDS:'); print(json.dumps(r.get('rounds'),indent=1)[:5000])
print(); print('FINAL INTEGRATION:'); print(json.dumps(r.get('finalIntegration'),indent=1)[:3000])
print(); print('FINISH:'); print(json.dumps(r.get('finish'),indent=1)[:3500])
"

OUT
ROUNDS:
null

FINAL INTEGRATION:
null

FINISH:
null
Bash Inspect raw workflow output format
IN
F="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/tasks/watwba9jv.output"; wc -c "$F"; head -c 600 "$F"; echo; echo ...; python -c "
raw=open(r'$F',encoding='utf-8').read()
for k in ['\"rounds\"','\"finalIntegration\"','\"finish\"']:
    print(k, raw.find(k))
"

OUT
92699 C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/tasks/watwba9jv.output
{
  "summary": "Build the chosen creative direction into the Next.js portfolio, then refine it in browser-verified review loops",
  "agentCount": 36,
  "logs": [
    "Foundation done: I picked up where the last session stopped. Most of the foundation was already built and type-checks: fonts (Archivo and Martian Mono through next/font), the tokens in globals.css (palette by role, te",
    "Sections: intro-hero ok, scene ok, work ok, about ok, skills ok, contact ok",
    "Integration: build OK; remaining: 9",
    "Round 1: Awwwards=fix, Motion=fix, Frontend=fix, Engineering=fix | high=6 medium=1
...
"rounds" 26277
"finalIntegration" 31932
"finish" 35669
Bash Parse workflow result JSON
IN
python -c "
import json
r=json.load(open(r'C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/tasks/watwba9jv.output',encoding='utf-8'))
print('\n'.join(r['logs']))
res=r.get('result') or r.get('returnValue') or {}
if isinstance(res,str): res=json.loads(res)
print(list(r.keys()))
print('ROUNDS:', json.dumps(res.get('rounds'),indent=1)[:4500])
print('FINAL INTEGRATION:', json.dumps(res.get('finalIntegration'),indent=1)[:2500])
print('FINISH:', json.dumps(res.get('finish'),indent=1)[:3500])
"

OUT
Foundation done: I picked up where the last session stopped. Most of the foundation was already built and type-checks: fonts (Archivo and Martian Mono through next/font), the tokens in globals.css (palette by role, te
Sections: intro-hero ok, scene ok, work ok, about ok, skills ok, contact ok
Integration: build OK; remaining: 9
Round 1: Awwwards=fix, Motion=fix, Frontend=fix, Engineering=fix | high=6 medium=14 stop=false
Round 2: Awwwards=fix, Motion=fix, Frontend=fix, Engineering=fix | high=1 medium=9 stop=false
['summary', 'agentCount', 'logs', 'result', 'workflowProgress', 'totalTokens', 'totalToolCalls']
ROUNDS: [
 {
  "round": 1,
  "verdicts": [
   {
    "lens": "Awwwards SOTD juror / studio d",
    "verdict": "fix",
    "findings": 11
   },
   {
    "lens": "Motion director",
    "verdict": "fix",
    "findings": 9
   },
   {
    "lens": "Frontend QA, accessibility and",
    "verdict": "fix",
    "findings": 10
   },
   {
    "lens": "Engineering manager and tech r",
    "verdict": "fix",
    "findings": 11
   }
  ],
  "high": 6,
  "medium": 14,
  "stop": false,
  "rationale": "Round 1: the work bench is a flat chip list rather than the spec'd instrument. The scope vanishes after the hero. The footer names three.js, which does not ship. The project facts are not README-verified. The contrast hits are only partly traced. The medium items (11px floor, chip semantics, flat reveal pacing, intro skip, CTA states, transition length) are real. Decisions: purpose, accessibility and performance win over extra motion, so motion additions are limited to meaningful ones (the history trace, the scope continuity at low cost, the bench scope). The R3F board is not required; an SVG instrument on shared data is acceptable. Decorative-only items and false positives are deferred or recorded.",
  "integration": {
   "buildOk": true,
   "remaining": [
    "Unconfirmed: the one-off React #185 in the reduced-motion capture. If it recurs, the likely suspects are the reduced-motion scene or the SVG fallback path.",
    "I read only 3 of the 5 production screenshots (home desktop, case study mobile, home reduced-motion full). The home desktop and case-study mobile captures look correct. The reduced-motion --full capture is tiled and repeats the hero, which looks like a stitching artifact from the fixed scene layer, not a page defect. I did not read home mobile or case-study desktop, so I am relying on their clean logs.",
    "The case-study mobile page shows the label 'Repository opened 2026', while the work owner's issue says the year comes from the GitHub repo creation year. Prajwal should confirm that this is a repo date and not a build date.",
    "Not changed (need Prajwal or the owners): confirm that ResumAI's OpenAI integration is real and not stubbed; the 3D board was not built (SVG scope only); the datasheet to home transition takes about 1.0s on software GL.",
    "Not done: the scene's requested --z-backdrop token in globals.css (the workaround works), and the docs/MOTION.md intro duration (about 2.5s).",
    "Not run: the impeccable detector. Foundation recorded its false positives in docs/DESIGN.md section 13.",
    "Not rechecked in the browser: the skills chip 44px coarse-pointer state."
   ]
  }
 },
 {
  "round": 2,
  "verdicts": [
   {
    "lens": "Awwwards SOTD juror / studio d",
    "verdict": "fix",
    "findings": 11
   },
   {
    "lens": "Motion director",
    "verdict": "fix",
    "findings": 6
   },
   {
    "lens": "Frontend QA, accessibility and",
    "verdict": "fix",
    "findings": 7
   },
   {
    "lens": "Engineering manager and tech r",
    "verdict": "fix",
    "findings": 8
   }
  ],
  "high": 1,
  "medium": 9,
  "stop": false,
  "rationale": "One high-severity finding remains: bench pacing makes the page about 3x the approved sketch, and phones are worse. Several medium items are real and fixable inside their areas: the mobile lane panel collision, the /Portfolio build check, the nav marker on case pages, background traces behind text, and an undiscoverable trigger. The \"Skip intro\" cue is not a fix. Skip-on-gesture already exists, and the intro is about 2.5s, so the \"5s\" claim is overstated. The intro timing tweak is kept small. The 1.0:1 button and 1.3:1 lane-label detector flags are false positives and are logged as such. Retired-pattern items (the route tiles and the node-and-rail timeline) and the board physicality are kept at medium or low. Fixes that need edits outside an area are folded into the area that owns the file.",
  "integration": {
   "buildOk": true,
   "remaining": [
    "Page height is over target. Desktop home is 14.5k px against the 11-12k target, and mobile is 19.4k against under 18k. Both come from the Bench layout, and I did not change it.",
    "Open issues I did not resolve: the OG image is missing (twitter:card is summary_large_image but there is no og:image or twitter:image); Archive.tsx still uses useScrollReveal instead of a clip-path wipe; the SSLC period still needs mapping in Education.tsx instead of in the content file.",
    "Not checked in a browser: the Education reveal i
FINAL INTEGRATION: {
 "buildOk": true,
 "typecheckOk": true,
 "consoleErrors": [
  "None on the production home page or /work/resumai/, at desktop, mobile or reduced motion (LOGS: none).",
  "The home-page scroll run logs six [requestfailed] ERR_ABORTED entries for /work/<slug>/. These are link prefetches cancelled when the page scrolls or the capture ends, and they are harmless.",
  "No hydration warnings and no Next error overlay in any capture."
 ],
 "fixesMade": [
  "Bench.tsx: added data-system={p.id} to each entry <li>. TransitionProvider can now land the return trip from a case study on that system.",
  "Header.tsx, RecordNav.tsx, MobileMenu.tsx: on /work/* pages the WORK nav item is now the active one. It gets aria-current=\"page\", and the Header sets the stage's active section to \"work\". Confirmed in the case-study screenshot, where WORK reads as current. I did not do the second part of the report, placing RecordNav's scroll-window marker at the WORK tick on non-home routes.",
  "scripts/serve.mjs: with a base path set, requests outside that base now get the 404 page with status 404, so a missing /Portfolio prefix can no longer be hidden. I did not restart or test the running preview server on port 4173, so this change is not exercised.",
  "Rebuilt after the edits: npm run build passes and 7 files were flattened. Typecheck is clean.",
  "Screenshots of the production build were read for the home page (desktop, mobile, reduced motion) and the ResumAI case study (desktop, mobile). The hero shows the correct name, role and trace layout, and the datasheet renders correctly."
 ],
 "remainingProblems": [
  "Page height is over target. Desktop home is 14.5k px against the 11-12k target, and mobile is 19.4k against under 18k. Both come from the Bench layout, and I did not change it.",
  "Open issues I did not resolve: the OG image is missing (twitter:card is summary_large_image but there is no og:image or twitter:image); Archive.tsx still uses useScrollReveal instead of a clip-path wipe; the SSLC period still needs mapping in Education.tsx instead of in the content file.",
  "Not checked in a browser: the Education reveal in motion, the mobile and tablet layouts of the new Route and revision rows, and the Livora Site link in the Skills panel.",
  "I did not run the impeccable design detector, and I did not film the 40 ms and 50 ms intro frames.",
  "The previously reported '1 Issue' dev badge and hydration error did not show up in the production captures. I believe they
FINISH: {
 "area": "release-engineering",
 "summary": "The GitHub Pages build works, README.md is written, the docs now match the code, and the stray root file is gone. The Pages build needed no code changes. `npm run build:pages` compiled cleanly and exported 10 pages. I served it at /Portfolio on port 4174 and captured the home page and /work/resumai/ at desktop and mobile. There were zero 404s or failed requests, no horizontal overflow, and the WebGL canvas was up on home. Clicking a work link on the home page landed on /Portfolio/work/drone-intelligence/. A grep of `src` found no unprefixed raw asset URLs. I stopped the preview server afterwards and re-ran `npm run build`, so `out/` is a root-path build again. README.md covers what the site is, stack, scripts, editing content, swapping the r\u00e9sum\u00e9 link, deployment, accessibility and reduced motion, performance, docs and credits. The stack section says that `three`, `@react-three/fiber`, `@react-three/drei` and `motion` are in package.json but unused. I did not remove them, since you said to add dependencies only when needed and removing them touches the lockfile. docs/MOTION.md and docs/DESIGN.md described a 3D bench board and a 180 KB JS budget, neither of which matches what shipped. I corrected both: the bench is SVG/DOM and the only WebGL is the raw WebGL2 hero scope. The budget text now gives the measured sizes, about 281 KB gzip on `/` and 260 KB on `/work/[slug]`. docs/DEPLOY.md was already accurate and I left it alone. The only stray file in the project root was `tsconfig.tsbuildinfo`, which I deleted. It is gitignored and regenerates. The r\u00e9sum\u00e9 and cover-letter PDFs and `design/` are untouched.",
 "filesChanged": [
  "C:/Users/Prajwal/Desktop/Portfolio/README.md",
  "C:/Users/Prajwal/Desktop/Portfolio/docs/MOTION.md",
  "C:/Users/Prajwal/Desktop/Portfolio/docs/DESIGN.md"
 ],
 "verification": "Served the /Portfolio export with scripts/serve.mjs under NEXT_PUBLIC_BASE_PATH=/Portfolio. The home page and /work/resumai/ at desktop and mobile each reported LOGS: none, with correct titles. Home scrollHeight was 14506 on desktop and 19404 on mobile, with no horizontal overflow. The desktop home screenshot shows the hero: PRAJWAL M P, \"Full Stack Developer\", the four-channel scope plus the sum trace, and the NOW footer line reading \"Full Stack Developer, Maruti Flex Traders LLP, Dec 2025 - Present\". A scripted click on a work link navigated to the Drone Intelligence datasheet with no log errors. I only looked at the one desktop home screenshot in full; the case-study and mobile captures were checked through their logs and metrics.",
 "screenshots": [
  "C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/shots/build/release/home-desktop-desktop-view.png",
  "C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/shots/build/release/case-desktop-desktop-view.png",
  "C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/shots/build/release/home-mobile-mobile-view.png",
  "C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/shots/build/release/case-mobile-mobile-view.png"
 ],
 "openIssues": [
  "`three`, `@react-three/fiber`, `@react-three/drei` and `motion` are unused dependencies. They are harmless (not in the bundle) but could be uninstalled.",
  "Firs
Before reporting done, I found that the hero is raw 2D WebGL even though the brief asked for Three.js/R3F, so I'm checking the spec and capturing the production build to confirm. The page is also about 14.5k px against an 11–12k target, with nine medium issues and the OG image still outstanding.
Bash Read spec 3D plan and list built components
IN
python -c "
import json
d=json.load(open('design/directions/signal-chain/DIRECTION.json',encoding='utf-8'))
print('THREE-D:', d['threeD'][:2500]); print(); print('INTERACTIVE BG:', d['interactiveBackground'][:1200]); print(); print('PROJECT SHOWCASE:', d['projectShowcase'][:1500])
"; echo; ls src/components/*/ | head -80; grep -rl "@react-three\|from \"three\"\|from 'three'\|motion/react" src | head

OUT
Traceback (most recent call last):
  File "<string>", line 4, in <module>
  File "C:\Program Files\Python310\lib\encodings\cp1252.py", line 19, in encode
    return codecs.charmap_encode(input,self.errors,encoding_table)[0]
UnicodeEncodeError: 'charmap' codec can't encode character '\u03a3' in position 554: character maps to <undefined>
THREE-D: 
src/components/about/:
History.tsx
Route.tsx
Statement.tsx
index.tsx

src/components/chrome/:
Header.tsx
MobileMenu.tsx
RecordNav.tsx
TrigIndicator.tsx
index.ts

src/components/contact/:
index.tsx

src/components/credentials/:
Certifications.tsx
Education.tsx

src/components/cursor/:
Cursor.tsx
index.ts
probe.ts

src/components/experience/:
RevisionHistory.tsx

src/components/footer/:
index.tsx

src/components/hero/:
Hero.tsx
Lanes.tsx
TriggerHandle.tsx
hero.module.css
index.tsx
useScopeLayout.ts

src/components/icons/:
index.tsx

src/components/intro/:
index.tsx
timeline.ts

src/components/scene/:
SceneLoader.tsx
ScopeCanvas.tsx
ScopeFallback.tsx
StaticScope.tsx
index.tsx
layout.ts
pageMap.ts
renderer.ts
shaders.ts
wave.ts

src/components/skills/:
Readout.tsx
evidence.ts
index.tsx

src/components/transition/:
TransitionLink.tsx
TransitionProvider.tsx
index.ts
usePageArrival.ts

src/components/ui/:
ChannelMark.tsx
ExternalLink.tsx
InlineScript.tsx
Led.tsx
Ruler.tsx
Section.tsx
SkipLink.tsx
index.ts

src/components/work/:
Bash Read spec 3D plan (utf-8) and work components
IN
PYTHONIOENCODING=utf-8 python -c "
import json
d=json.load(open('design/directions/signal-chain/DIRECTION.json',encoding='utf-8'))
print('THREE-D:', d['threeD'][:2600]); print(); print('PROJECT SHOWCASE:', d['projectShowcase'][:1400])
"; echo; ls src/components/work/; echo; grep -rln "@react-three\|from \"three\"\|motion/react" src | head

OUT
THREE-D: Exactly one 3D element: the Bench board, a single-layer circuit board generated per system from data/systems.ts. There is no layer stack anywhere in this direction: the prototype's five-layer PCB stackup is retired because the judges noted four concepts converged on exploded stacks, and Through-Line owns that image.
Build: an R3F chunk (next/dynamic, ssr:false) imported when Systems is within 1.2 viewports and prefetched on idle after LCP on desktop. A graphite FR4 board with bone silkscreen; chips are low rounded boxes in five columns (CH1-CH4 + Σ) with channel-colour outlines; labels are baked into one CanvasTexture per system (redrawn once per acquisition, never per frame); connections are one merged Line2 batch with constant pixel width; four probe hooks are tube curves with clips in the channel colours. An orthographic 3/4 camera (35° tilt) with damped pointer tilt of ±4° (600ms); DOM labels for the active chip are projected after updateMatrixWorld, so they stay crisp, selectable and translatable.
Why it earns its place: it is the real architecture from his repository, and clipping a probe onto a connection completes the instrument metaphor: you measure his work instead of reading claims about it.
Interaction: hover or tap a connection to probe it (the clip re-seats in 300ms and the scope shows that connection on CH1); hover or tap a chip for its role and technology; the what-if control re-routes the path; a bone request pulse travels the copper at constant speed, because signals don't ease. Motion (LazyMotion) handles the React-state UI around it: probe readout swaps, what-if states, copy feedback.
Performance: frameloop='demand'; ≤30 draw calls and under 5k triangles; DPR clamp 1.75 desktop / 1.25 tablet; probe and what-if changes only update uniforms; a pending-selection queue applies picks made before the scene is ready (a race already fixed in the prototype).
Degradation: phones and portrait tablets get the SVG board; no WebGL2, deviceMemory ≤2 or Save-Data → SVG; reduced motion → a static board, instant probe swaps and no pulses.
The hero stays 2D on purpose: a scope is a 2D instrument.

PROJECT SHOWCASE: 'The bench'. One typed file, data/systems.ts, drives everything: blocks {label, tech, layer}, connections {from, to, protocol, label, source URL}, one what-if, facts and links. It renders the 3D board, the mobile SVG board, the datasheet block diagram, the chips and the BOM, so nothing can drift.
Boards, in order (facts from the dossier; README-only details carry their source URL and need Prajwal's sign-off):
- RUN: Maruti Flex Traders LLP, Dec 2025 → present (private). React/Next.js interfaces → REST APIs → Google Apps Script business logic and automation → Google Sheets API and MongoDB → in production. Dossier-level only, no screenshots, plus an 'Ask me about this work →' mailto.
- ACQ 01 Drone Intelligence System. React 19 dashboard ⇄ FastAPI (POST /api/chat/message); a /ws/kpi WebSocket pushing KPI updates every 3-8s (simulated mission data, per the README); local all-MiniLM-L6-v2 embeddings → ChromaDB top-5 → Gemini 2.0 Flash → cited answer; an MCP server over stdio exposing calculate_flight_time, calculate_roi, check_compliance and select_drone to Claude Desktop; Docker Compose + Nginx. What-if: 'Gemini unavailable' lights the README's fallback, an answer built from the retrieved context.
- ACQ 02 Smart Ambulance Traffic Clearance (prototype; the ECE showcase). Flutter app streams GPS → Express + Socket.IO (missions, naive ETA) → Eclipse Mosquitto → ESP32 smart pole (audi

Archive.tsx
Bench.tsx
Board.tsx
BoardGraph.tsx
Datasheet.tsx
Diagram.tsx
Flow.tsx
Probes.tsx
Scope.tsx
index.tsx
layers.ts
system.ts
traffic.ts
The 3D Bench board was the one required element, and the build shipped only the SVG fallback everywhere, so that's the gap to close. I'm capturing the production build at desktop and mobile before planning the fix.
Bash Serve production build and capture screenshots
IN
ls out/index.html >/dev/null && (curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/ | grep -q 200 || (node scripts/serve.mjs > /c/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/preview.log 2>&1 &)); sleep 2; echo "preview: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:4173/)"; SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; O="$SPW/shots/final-check"; cd "$SPW/tools" && node shot.mjs --url http://localhost:4173/ --out "$O" --name home --frames 300,1200,2200,3600 2>&1 | tail -2; node shot.mjs --url http://localhost:4173/ --out "$O" --name home --wait 4500 --scroll steps:12 --wheel --settle 1300 2>&1 | tail -3; node shot.mjs --url http://localhost:4173/ --out "$O" --name home --viewport mobile --wait 4500 --scroll steps:8 --wheel --settle 1200 2>&1 | tail -3

OUT
preview: 200
METRICS: {"scrollHeight":14506,"scrollY":0,"webgl":true,"canvases":1,"title":"Prajwal M P — Full Stack Developer","horizontalOverflow":false}
LOGS: none
[requestfailed] http://localhost:4173/work/audify-ai/ net::ERR_ABORTED
[requestfailed] http://localhost:4173/work/bookmyvenue/ net::ERR_ABORTED
[requestfailed] http://localhost:4173/work/mcp-job-agent/ net::ERR_ABORTED
[requestfailed] http://localhost:4173/work/audify-ai/ net::ERR_ABORTED
[requestfailed] http://localhost:4173/work/bookmyvenue/ net::ERR_ABORTED
[requestfailed] http://localhost:4173/work/mcp-job-agent/ net::ERR_ABORTED
Shell cwd was reset to C:\Users\Prajwal\Desktop\Portfolio
Bash List final-check screenshots
IN
ls "C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad/shots/final-check/"

OUT
home-desktop-t00300.png
home-desktop-t01200.png
home-desktop-t02200.png
home-desktop-t03600.png
home-desktop-y00000.png
home-desktop-y01237.png
home-desktop-y02474.png
home-desktop-y03711.png
home-desktop-y04948.png
home-desktop-y06185.png
home-desktop-y07421.png
home-desktop-y08658.png
home-desktop-y09895.png
home-desktop-y11132.png
home-desktop-y12369.png
home-desktop-y13606.png
home-mobile-y00000.png
home-mobile-y02651.png
home-mobile-y05303.png
home-mobile-y07954.png
home-mobile-y10606.png
home-mobile-y13257.png
home-mobile-y15909.png
home-mobile-y18560.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\final-check\home-desktop-t03600.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\final-check\home-desktop-y01237.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\final-check\home-desktop-y02474.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\final-check\home-desktop-y03711.png
The hero and bench look strong, with a sticky panel that switches per project, but every project runs longer than a full screen, so the section drags. I'm checking the rest of the page and mobile next.
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\final-check\home-desktop-y09895.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\final-check\home-desktop-y11132.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\final-check\home-desktop-y12369.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\final-check\home-desktop-y13606.png
The rest of the page looks coherent, with a LinkedIn label box that seems shifted, likely a hover-state capture issue I'll recheck. Moving on to mobile next.
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\final-check\home-mobile-y00000.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\final-check\home-mobile-y05303.png
Read C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\shots\final-check\home-mobile-y10606.png
Mobile looks solid, but the site still misses the brief: the 3D element is absent, the projects section runs too long, motion is unused, and several round-2 issues remain. I'm pulling round 2's exact unresolved list from the journal before the next build-and-refine pass.
Bash Extract round-2 triage, fixes and open issues
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_7b4c63a2-f5d/journal.jsonl"; SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; PYTHONIOENCODING=utf-8 python -c "
import json
lab={}; res={}
for l in open(r'$J',encoding='utf-8'):
    e=json.loads(l)
    if e.get('type')=='started': lab[e['agentId']]=e.get('label')
    elif e.get('type')=='result': res[lab.get(e['agentId'])]=e.get('result', e.get('value'))
t=res['triage:r2']
if isinstance(t,str): t=json.loads(t)
out={'triage_r2':t}
for k in [x for x in res if x and x.startswith('fix:') and x.endswith(':r2')]:
    r=res[k]; r=json.loads(r) if isinstance(r,str) else r
    out[k]={'summary':r['summary'][:1500],'openIssues':r['openIssues']}
ir=res['integrate:r2']; ir=json.loads(ir) if isinstance(ir,str) else ir
out['integrate_r2']=ir
json.dump(out, open(r'$SPW/r2-state.json','w',encoding='utf-8'), indent=1, ensure_ascii=False)
print('keep:', t.get('keep')); print()
for w in t['workstreams']:
    print('==',w['area'])
    for f in w['fixes']: print('  -',f['severity'],'|',f['title'][:150])
print(); 
for k,v in out.items():
    if k.startswith('fix:'): print(k,'OPEN:',[i[:160] for i in v['openIssues']])
"

OUT
keep: ['THE LOCK intro sequence and the five-lane split', 'Hero typography and composition (Archivo wdth 125/800 wordmark on the graticule)', 'Trigger drag and the probe system', 'README-verified truthfulness of the bench and datasheets', 'Two-material system (graphite screens and bone sheets)', 'Browser-surface and tokens discipline', 'Progressive enhancement, reduced-motion static path and WebGL hygiene', 'Contact section and the 404', 'Record-view nav', 'Scrubbed Statement and RevisionHistory moments']

== work
  - high | Bench pacing: cut entries to the direction's shape
  - medium | Board and scope lack board physicality
  - medium | Tapping a default-pinned connection un-probes it
  - medium | Request-path steps read as plain text
  - low | Datasheet metadata 'Repository opened 2026' is unsourced
  - low | Figure caption is set in 12px mono as running text
  - low | Case-study nav marker shows the wrong section
== intro-hero
  - medium | Open lane panel collides with the Sigma chip and NOW row on phones
  - medium | The trigger handle is hard to discover at rest
  - low | Name-resolve noise window at 700ms
  - low | Phone lane pitch is tight and the chips cover the traces
  - low | ECE-to-Full-Stack line repeats the role as a 12px caption strip
== scene
  - medium | Background traces run through dense copy and controls
== foundation
  - medium | GitHub Pages /Portfolio build never verified
  - low | Page-transition reveal leg uses inOut
  - low | Focus-visible parity for the cursor brackets
  - low | Record bundle size and log reviewed false positives
== about
  - low | History sheet reintroduces retired patterns
  - low | SSLC row shows a ten-year range as the credential date
  - low | Education and Archive reveals use one generic y-plus-fade and flash after the intro
== skills
  - low | Livora has no action in the stack detail panel

fix:skills:r2 OPEN: ['Not verified in the browser: the Livora Site link was not seen rendered in the panel. Confirm it shows once a skill linked to Livora is selected.', 'Cosmetic: the new nested ternary in evidence.ts is indented unevenly. It does not affect behaviour.']
fix:about:r2 OPEN: ["Archive (src/components/work/Archive.tsx, work area): not changed, outside my ownership. Needed: replace useScrollReveal on 'tbody tr' with a clip-path wipe on ", "Optional content cleanup (src/content/education.ts, not mine): set the SSLC period to '2019' so the component-level mapping in Education.tsx can be removed.", 'Not verified: the Education lock-ease reveal was not filmed in motion, and the mobile/tablet layouts of the new Route and the revision rows (nodes removed) were']
fix:scene:r2 OPEN: ['Datasheet body: the scope is mounted only on the home page (src/app/page.tsx), so /work/[slug] pages have no traces to dim and no change was needed there. If th', 'Optional, for other areas: any dense block in another screen section (for example a contact form, if one is added) can opt in with data-ambient="quiet" on its w', 'The section scroll offsets in the fix evidence (y06898, y13796) no longer match because other agents changed the page height during the run. Verification used t', "One capture briefly showed a parse error in src/components/work/Bench.tsx, owned by the work area. It was another agent's edit in progress and the retry was cle"]
fix:intro-hero:r2 OPEN: ['Where the Σ trace runs exactly on it, the level line is mostly hidden: the line marks the trigger level, which sits on the trace at rest. It reads clearly in th', 'I could not film the 40ms and 50ms coarse sampling frames in headless Edge. A main-thread stall while WebGL starts up makes GSAP jump past them, and these step ', "One capture showed a React hydration-mismatch console error and the dev '1 Issue' badge, and another hit a page.tsx compile 404 that made a click time out. Neit"]
fix:foundation:r2 OPEN: ['WORK AREA (needed to finish the returnFrom re-acquire): in src/components/work/Bench.tsx, add `data-system={p.id}` to the `<li>` in the `projects.map` around li', 'SCRIPTS (outside my ownership): scripts/serve.mjs (`npm run preview`) also serves unprefixed paths when NEXT_PUBLIC_BASE_PATH is set, so it can hide a missing /', 'OG image: layout.tsx declares `twitter.card: "summary_large_image"` but there is no og:image or twitter:image (no opengraph-image route). The base path itself i', 'Integrator: my `npm run build:pages` left out/ as a /Portfolio-base build. Rebuild out/ before any root-base check. The dev server was not affected, because pro', 'Measurement caveat: the 0.7 s / 1.7 s home-to-datasheet timings come from headless Edge with software GL and screenshot overhead. They show the curtain has fini']
fix:work:r2 OPEN: ['Case-study nav marker (fix 7, not done): the marker and WORK highlight live in src/components/chrome/Header.tsx and RecordNav.tsx, which I do not own. Header.ts', 'Mobile scrollHeight is still about 19.4-20.6k against the under-18k target. The home board (about 700px) plus the scope (about 280px) per entry dominate, and no', 'Desktop is about 14.5k against the 11-12k target. The sticky-panel layout needs about 44svh per entry, and the other sections are outside my ownership.', 'Request path and connections are in a per-entry disclosure beside the sticky board, not in the panel itself. A 900px viewport cannot hold the board, scope, pins', 'Home sections hydrate lazily: a click before the Work section has scrolled into view does nothing in the screenshot tool. This is existing behaviour, but any QA', "A dev-overlay badge showed '2 Issues' once, in a mobile screenshot taken right after my forced scroll and click. I could not find a console error or failed requ"]
I'm running the final pass as a workflow: four parallel builders on separate files, integration, up to two review rounds, then a GitHub Pages check and README update.
Bash Locate script sections for reuse
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; grep -n "^// ----\|^phase(\|^const integratePrompt\|^let integ\|^const allIssues\|^for (let round\|^const rounds\|^return \|maxRounds\|MAX_ROUNDS" "$SPW/build-workflow.js"; sed -n "/^\/\/ ---------------- Finish/,\$p" "$SPW/build-workflow.js"

OUT
17:const MAX_ROUNDS = A.maxRounds || 3
171:// ---------------- Foundation ----------------
172:phase('Foundation')
192:// ---------------- Sections (parallel) ----------------
193:phase('Sections')
213:// ---------------- Integrate ----------------
214:phase('Integrate')
215:const integratePrompt = (when, issues) => common([
221:const allIssues = sectionResults.filter(Boolean).flatMap((r) => r.openIssues.map((i) => r.area + ': ' + i)).concat(foundation.openIssues.map((i) => 'foundation: ' + i))
222:let integ = await agent(integratePrompt('after the parallel section build', allIssues), { label: 'integrate', phase: 'Integrate', schema: INTEG, model: 'sonnet' })
225:// ---------------- Refine loop ----------------
257:  'ROLE: creative director running triage for refinement round ' + round + ' of ' + MAX_ROUNDS + '. You edit nothing.',
271:const rounds = []
272:for (let round = 1; round <= MAX_ROUNDS; round++) {
290:// ---------------- Finish ----------------
291:phase('Finish')
303:return { foundation: foundation.summary, sections: sectionResults.filter(Boolean).map((r) => ({ area: r.area, summary: r.summary, openIssues: r.openIssues })), rounds, finalIntegration: integ, finish }
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
12:27 PM
Writing the polish workflow. It reuses the shared prompt blocks, rules, review lenses and loop from the build script, with a new parallel build phase at the front:



Bash Assemble and syntax-check the polish workflow
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; cat > "$SPW/polish-middle.js" <<'EOF'
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
    'Keep Board.tsx\'s exported component and props contract unchanged (Bench.tsx, owned by another agent, uses it): Board decides internally whether to render the 3D board or the SVG board.',
    'When 3D: desktop/large-tablet landscape with a fine pointer, WebGL2 available, deviceMemory > 2, no Save-Data. Phones and portrait tablets keep the SVG. Reduced motion: static 3D board (no tilt, no pulses, instant probe swaps) or SVG if simpler. Lazy: next/dynamic(ssr:false) imported when Systems is within ~1.2 viewports; never on the critical path; prefetch on idle after LCP.',
    'Look: a graphite FR4 board with bone silkscreen; chips as low rounded boxes in the five channel columns with channel-colour outlines; labels baked into one CanvasTexture per system (redrawn on system change, never per frame) with crisp DOM labels for the active chip; connections as one merged constant-pixel-width line batch (three/examples Line2/LineSegments2); probe hooks in channel colours; orthographic 3/4 camera (~35deg tilt) with damped pointer tilt +/-4deg; a bone request pulse travelling the copper at constant speed. Match the palette tokens exactly (read them from src/app/globals.css).',
    'Interaction: hover/tap a connection to probe it (same state as SVG), hover/tap a chip for its role and tech, keyboard path stays on the existing DOM controls (the canvas is aria-hidden; nothing becomes mouse-only).',
    'Performance: frameloop="demand" (invalidate on interaction/pulse), <= 30 draw calls, < 5k triangles, DPR clamp via dprForTier, pause when offscreen/hidden, dispose on unmount, pending-selection queue for picks made before the scene is ready. Prefer plain three + @react-three/fiber; use @react-three/drei only for something it does much better. Report the gzip size of the new lazy chunk.',
    'Also fix in your files: "Board and scope lack board physicality" (SVG board should read as a physical board too: subtle FR4 texture/edge, silkscreen, mounting holes - restrained) and "Tapping a default-pinned connection un-probes it" if that logic lives in your files.',
    'Verify on the dev server at 1440x900 and 1280x800 (3D on), 834x1194 and 390x844 (SVG), and reduced motion: screenshots of the board idle, with a connection probed (use --hover-selector / --click), and while switching systems; zero console errors.',
  ] },
  { key: 'bench', model: undefined, task: [
    'Fix the one remaining HIGH finding: Bench pacing. The home page is ~14.5k px tall on desktop (target <= 12,000 px at 1440x900) and ~19.4k px on mobile (target <= 18,000 px at 390x844), almost all from the Systems/Bench section. Cut each entry to the direction\'s shape (read the spec\'s section "02 Systems: the bench" and "projectShowcase"): the home entry shows the essentials (name, one-line purpose, 3-4 key facts, the board/scope via Board, the what-if, links); the full spec table, request path detail and long copy move to the datasheet /work/[slug] page (nothing true is lost - it moves). Measure scrollHeight with the screenshot tool METRICS before and after, at both viewports, and hit the targets.',
    'Use the Motion library (import { LazyMotion, domAnimation, m, AnimatePresence } from "motion/react") where the spec assigns it: probe readout swaps and what-if state changes (short, purposeful, reduced-motion aware via useReducedMotion from motion/react or our media hook). Keep GSAP for scroll choreography.',
    'Also fix in your files (see ' + R2 + ' work workstream): request-path steps read as plain text (make them a legible step sequence in the instrument language); figure caption set as 12px mono running text (use the body/small role for running text); "Repository opened 2026" metadata is unsourced (use only verifiable facts from src/content/projects.ts or drop it); Archive (Also built) reveal should use a clip-path wipe instead of the generic y+fade; the case-study (datasheet) layout must still read well with the moved content.',
    'Do not change Board.tsx/BoardGraph.tsx (another agent is adding the 3D board there) - treat <Board> as a black box with its current props.',
  ] },
  { key: 'heroChrome', model: 'sonnet', task: [
    'Fix these remaining items (details in ' + R2 + '): (1) on phones the open lane panel collides with the Sigma chip and the NOW row - fix layout so nothing overlaps at 390x844 and 360x780; (2) the trigger handle is hard to discover at rest - make its affordance visible without adding an eyebrow or a tooltip-wall (e.g. a quiet TRIG level marker/handle state, a one-time hint pulse after the intro, honest label); (3) phone lane pitch is tight and the chips cover the traces - give the traces room; (4) the ECE-to-Full-Stack line repeats the role as a 12px caption strip - make it read as intended information at >= 11px without repeating the role verbatim; (5) page-transition reveal leg uses inOut - use the documented arrival ease; (6) focus-visible parity for the cursor brackets.',
    'OG/social image: add a static Open Graph image so links to the site render a card (layout.tsx declares summary_large_image but there is none). Check node_modules/next/dist/docs for how opengraph-image / metadata images work with output: "export" in Next 16; produce a 1200x630 image in the Signal Chain look (name, Full Stack Developer, the five traces) - either an opengraph-image route that statically renders at build time, or a committed PNG in public/ referenced from metadata with the basePath-correct absolute URL (site.url). Verify the built out/ contains it and the meta tags point to it.',
    'Background traces running through dense copy were addressed in round 2 with data-ambient="quiet"; re-check the Statement, Stack and Connect sections and finish the job if any copy still has traces behind it.',
  ] },
  { key: 'sections', model: 'sonnet', task: [
    'Fix these remaining items (details in ' + R2 + '): (1) Contact: the copy-address feedback should use Motion (AnimatePresence from "motion/react") for a crisp, purposeful state swap (reduced-motion aware); also check the social rows - in a capture the LinkedIn row label box looked shifted relative to its row on hover; make hover states aligned and consistent across rows. (2) History sheet reintroduces retired patterns (see the r2 triage) - remove them while keeping the revision-history idea. (3) SSLC shows a ten-year range as the credential date: set the SSLC period in src/content/education.ts to the completion year 2019 and remove any component-level mapping. (4) Education and Archive-style reveals use one generic y-plus-fade and flash after the intro - give Education its own small authored reveal consistent with docs/MOTION.md (Archive belongs to another agent). (5) Skills: Livora has no action in the stack detail panel - give it its live-site link (profile/projects data) and verify it renders.',
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

EOF
python - "$SPW" <<'PYEOF'
import sys
sp=sys.argv[1]
src=open(sp+'/build-workflow.js',encoding='utf-8').read()
mid=open(sp+'/polish-middle.js',encoding='utf-8').read()
head=src[:src.index('// ---------------- Foundation ----------------')]
tail=src[src.index('// ---------------- Refine loop ----------------'):]
head=head.replace("""  name: 'portfolio-build',
  description: 'Build the chosen creative direction into the Next.js portfolio, then refine it in browser-verified review loops',
  phases: [
    { title: 'Foundation', detail: 'design system, motion system, shell, cursor, transitions, navigation' },
    { title: 'Sections', detail: 'parallel section builds on disjoint files' },
    { title: 'Integrate', detail: 'compose, production build, smoke test' },""","""  name: 'portfolio-polish',
  description: 'Close the remaining gaps (3D bench board, bench pacing, Motion UI, leftovers), then refine in browser-verified review loops',
  phases: [
    { title: 'Build', detail: '4 parallel builders on disjoint files' },
    { title: 'Integrate', detail: 'production build and smoke test' },""",1)
assert "portfolio-polish" in head
tail=tail.replace("for (let round = 1; round <= MAX_ROUNDS; round++) {","for (let round = START; round < START + MAX_ROUNDS; round++) {",1)
tail=tail.replace("' of ' + MAX_ROUNDS + '. You edit nothing.'","' (final allowed round: ' + (START + MAX_ROUNDS - 1) + '). You edit nothing.'",1)
tail=tail.replace("'2. Write README.md:","'2. Update README.md (it exists - keep it accurate): the 3D bench board now ships (React Three Fiber, desktop only, lazy) and Motion is used for UI state; remove any dependency that is truly unused after checking imports (npm uninstall), and say what is used where. Also cover:",1)
tail=tail.replace("return { foundation: foundation.summary, sections: sectionResults.filter(Boolean).map((r) => ({ area: r.area, summary: r.summary, openIssues: r.openIssues })), rounds, finalIntegration: integ, finish }","return { built: built.filter(Boolean).map((r) => ({ area: r.area, summary: r.summary, openIssues: r.openIssues })), rounds, finalIntegration: integ, finish }",1)
assert 'START + MAX_ROUNDS' in tail and 'built.filter' in tail
open(sp+'/polish-workflow.js','w',encoding='utf-8').write(head+mid+tail)
print('written')
PYEOF
(echo "(async () => {"; sed 's/^export const meta/const meta/' "$SPW/polish-workflow.js"; echo "})"; ) > "$SPW/_c.js" && node --check "$SPW/_c.js" && echo "syntax OK"; rm -f "$SPW/_c.js"; grep -n "foundation\.\|sectionResults" "$SPW/polish-workflow.js" | head

OUT
Exit code 2
/usr/bin/bash: -c: line 38: unexpected EOF while looking for matching `''
12:28 PM
The shell choked on the quoting inside the heredoc. I'll write the middle section with the file tool instead and assemble it separately:



Write C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\polish-middle.js
62 lines
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

Write C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\assemble.py
40 lines
import sys

sp = sys.argv[1]
src = open(sp + '/build-workflow.js', encoding='utf-8').read()
mid = open(sp + '/polish-middle.js', encoding='utf-8').read()
head = src[:src.index('// ---------------- Foundation ----------------')]
tail = src[src.index('// ---------------- Refine loop ----------------'):]

old_meta = """  name: 'portfolio-build',
  description: 'Build the chosen creative direction into the Next.js portfolio, then refine it in browser-verified review loops',
  phases: [
    { title: 'Foundation', detail: 'design system, motion system, shell, cursor, transitions, navigation' },
    { title: 'Sections', detail: 'parallel section builds on disjoint files' },
    { title: 'Integrate', detail: 'compose, production build, smoke test' },"""
new_meta = """  name: 'portfolio-polish',
  description: 'Close the remaining gaps (3D bench board, bench pacing, Motion UI, leftovers), then refine in browser-verified review loops',
  phases: [
    { title: 'Build', detail: '4 parallel builders on disjoint files' },
    { title: 'Integrate', detail: 'production build and smoke test' },"""
assert old_meta in head
head = head.replace(old_meta, new_meta, 1)


def rep(s, old, new):
    assert old in s, old[:80]
    return s.replace(old, new, 1)


tail = rep(tail, "for (let round = 1; round <= MAX_ROUNDS; round++) {",
           "for (let round = START; round < START + MAX_ROUNDS; round++) {")
tail = rep(tail, "' of ' + MAX_ROUNDS + '. You edit nothing.'",
           "' (final allowed round: ' + (START + MAX_ROUNDS - 1) + '). You edit nothing.'")
tail = rep(tail, "'2. Write README.md:",
           "'2. Update README.md (it exists - keep it accurate): the 3D bench board now ships (React Three Fiber, desktop only, lazy) and Motion is used for UI state; remove any dependency that is truly unused after checking imports (npm uninstall), and say what is used where. Also cover:")
tail = rep(tail,
           "return { foundation: foundation.summary, sections: sectionResults.filter(Boolean).map((r) => ({ area: r.area, summary: r.summary, openIssues: r.openIssues })), rounds, finalIntegration: integ, finish }",
           "return { built: built.filter(Boolean).map((r) => ({ area: r.area, summary: r.summary, openIssues: r.openIssues })), rounds, finalIntegration: integ, finish }")
open(sp + '/polish-workflow.js', 'w', encoding='utf-8').write(head + mid + tail)
print('written')
Bash Assemble polish workflow and check syntax
IN
SPW="C:/Users/Prajwal/AppData/Local/Temp/claude/c63fa3b175684c35/1ea4c338-95b1-421e-9894-caa3190369b6/scratchpad"; python "$SPW/assemble.py" "$SPW" && (echo "(async () => {"; sed 's/^export const meta/const meta/' "$SPW/polish-workflow.js"; echo "})"; ) > "$SPW/_c.js" && node --check "$SPW/_c.js" && echo "syntax OK"; rm -f "$SPW/_c.js"; grep -n "foundation\.\|sectionResults\|phase('" "$SPW/polish-workflow.js" | head

OUT
written
syntax OK
182:phase('Build')
220:phase('Integrate')
279:  phase('Refine')
297:phase('Finish')
12:29 PM
The script assembles cleanly with no leftover references. The dev server is up. Launching the polish pass:



Workflow
IN
{
  "scriptPath": "C:\\Users\\Prajwal\\AppData\\Local\\Temp\\claude\\c63fa3b175684c35\\1ea4c338-95b1-421e-9894-caa3190369b6\\scratchpad\\polish-workflow.js",
  "args": {
    "directionPath": "C:/Users/Prajwal/Desktop/Portfolio/design/directions/signal-chain/DIRECTION.json",
    "sketchDir": "C:/Users/Prajwal/Desktop/Portfolio/design/directions/signal-chain",
    "maxRounds": 2,
    "startRound": 3,
    "notes": "Prajwal delegated all decisions. Featured projects: the six marked featured in src/content/projects.ts. Livora is described neutrally (a studio website he built) - never claim he founded it. No phone number anywhere. Resume link = profile.resume (Google Drive). Email = prajwalnair2603@gmail.com. The current role is Full Stack Developer at Maruti Flex Traders LLP (Dec 2025 - Present)."
  }
}
OUT
Workflow launched in background. Task ID: w5g3g0stx
Summary: Close the remaining gaps (3D bench board, bench pacing, Motion UI, leftovers), then refine in browser-verified review loops
Transcript dir: C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\1ea4c338-95b1-421e-9894-caa3190369b6\subagents\workflows\wf_c7643559-a4d
Script file: C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\polish-workflow.js
(Edit this file with Write/Edit and re-invoke Workflow with {scriptPath: "C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\polish-workflow.js"} to iterate without resending the script.)
Run ID: wf_c7643559-a4d
To resume after editing the script: Workflow({scriptPath: "C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\polish-workflow.js", resumeFromRunId: "wf_c7643559-a4d"}) — completed agents return cached results (cached results may themselves be empty — inspect journal.jsonl before assuming there is something to recover).

You will be notified when it completes. Use /workflows to watch live progress.
Write C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\memory\portfolio-build-paused.md
13 lines
---
name: portfolio-build-paused
description: Portfolio build status and how to resume the workflows if a session ends mid-run (Signal Chain direction)
metadata:
  type: project
---

Status (2026-11-06): the main build workflow `wf_7b4c63a2-f5d` COMPLETED (site built, 2 refinement rounds). A follow-up polish workflow `wf_c7643559-a4d` was launched ~12:45 to close gaps found on verification: the brief's required interactive 3D element (R3F Bench board, desktop only) was missing, the Bench section made the home page too long (14.5k px desktop / 19.4k mobile; targets ≤12k / ≤18k), Motion was unused, plus leftovers (OG image, phone lane collision, trigger discoverability, SSLC date, Livora link).

Scripts live in the session scratchpad: C:\Users\Prajwal\AppData\Local\Temp\claude\c63fa3b175684c35\1ea4c338-95b1-421e-9894-caa3190369b6\scratchpad\ (polish-workflow.js, build-workflow.js, r2-state.json).

**How to apply:** if a session ends mid-run, restart the dev server (npx next dev -p 3000) and relaunch Workflow with scriptPath polish-workflow.js + resumeFromRunId wf_c7643559-a4d and the same args (directionPath design/directions/signal-chain/DIRECTION.json, sketchDir design/directions/signal-chain, maxRounds 2, startRound 3, notes unchanged). After it completes, verify in the browser yourself before telling Prajwal it's done. Related: [[prefers-autonomous-runs]], [[portfolio-project-facts]]
Edit C:\Users\Prajwal\.claude\projects\c--Users-Prajwal-Desktop-Portfolio\memory\MEMORY.md
Modified
12:29 PM
The main build finished, but I'm not calling it done yet. When I checked it against your brief, I found real gaps, so I've started one more targeted pass.

What's working now (production build, desktop and mobile, no console errors):

Hero: the oscilloscope opening plays, then PRAJWAL M P / Full Stack Developer appears with five live signal channels. Visitors can drag the trigger handle to break the "lock" on the signal.
Statement: your own words, with each phrase tagged by layer.
Projects: each project's architecture, checked against its GitHub README, is drawn as a board beside a scope showing the traffic between parts. A "what if" toggle shows what happens when, for example, Gemini is unavailable. Each project also has its own case-study page.
Stack: each skill links to the projects and roles where you used it, with no percentage bars.
Experience: a "Revision history" on a light paper background, with Full Stack Developer marked as current.
Certifications: each has a working Verify link.
Contact: a large email address, a copy button, and your social links.
Mobile: works cleanly, with no overflow.
GitHub Pages: the /Portfolio build was verified, and the README is written.
What's still missing:

No interactive 3D element. Your brief requires one, and the chosen direction specified a React Three Fiber circuit board for each project. Partway through, the build swapped in a flat SVG version instead.
The projects section is too long: about 14,500 px tall on desktop against a target of about 12,000 px, and about 19,400 px on mobile.
Smaller issues:
The Motion library isn't used anywhere yet.
There's no image for link previews when the site is shared.
On phones, the hero's channel panel overlaps another element.
The trigger handle is hard to notice.
The school-leaving (SSLC) entry shows a ten-year range instead of 2019.
Livora is missing its live-site link.
Now running: four builders working in parallel:

the 3D board, on the strongest model
shortening the projects section and adding Motion, on the strongest model
hero and header fixes plus the share image, on a faster model
about, skills and contact fixes, on a faster model
After that come up to two more review-and-fix rounds and a final GitHub Pages check. I'll check the result in the browser myself before I tell you it's done.

Estimate: about 2–3 hours. You can look at the current version anytime at http://localhost:3000.



check it is done
Bash Check polish workflow progress
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_c7643559-a4d/journal.jsonl"; date +%H:%M; stat -c '%w' "$J" | cut -c12-16 | xargs echo "started:"; python -c "
import json
s={};d=set()
for l in open(r'$J',encoding='utf-8'):
    e=json.loads(l)
    if e.get('type')=='started': s[e['agentId']]=e.get('label')
    elif e.get('type')=='result': d.add(e.get('agentId'))
for a,l in s.items(): print('DONE ' if a in d else 'RUN  ', l)
"

OUT
12:41
started: 12:29
RUN   build:board3d
DONE  build:heroChrome
RUN   build:bench
RUN   build:sections
12:41 PM
Not done yet: the final pass started at 12:29, so it's only 12 minutes in. One of the four builders has already finished; checking what it did:



Bash Read finished heroChrome builder result
IN
J="C:/Users/Prajwal/.claude/projects/c--Users-Prajwal-Desktop-Portfolio/1ea4c338-95b1-421e-9894-caa3190369b6/subagents/workflows/wf_c7643559-a4d/journal.jsonl"; PYTHONIOENCODING=utf-8 python -c "
import json
for l in open(r'$J',encoding='utf-8'):
    e=json.loads(l)
    if e.get('type')=='result':
        r=e.get('result', e.get('value')); r=json.loads(r) if isinstance(r,str) else r
        print('AREA:', r.get('area')); print(r.get('summary','')[:1800]); print('OPEN:', [i[:200] for i in r.get('openIssues',[])])
"

OUT
AREA: intro-hero
Most of the six items were already in the code from the earlier pass. I confirmed those in the browser and fixed what was left.

Already in place, now checked:
- (1) The lane panels open upward for lanes 4 and 5, and the lane list rises above the NOW row when a lane is open. No overlap at 390x844 or 360x780.
- (2) The trigger handle has a dashed level line and a one-time nudge 1.2s after lock.
- (4) The bottom strip reads "FROM Electronics & Communication Engineering" at 12px and no longer repeats the role.
- (5) The page-transition reveal leg already uses EASE.out.
- (6) Cursor brackets already have a focus-visible mode.

Changed:
- (3) On phones the lane block now starts at 55% and ends at 11% (it was 52% and 10%), in `src/components/hero/Lanes.tsx`. At 360x780 the first trace used to run through the Résumé and Email buttons. It now clears them. The chips are 44px mark-only squares.
- OG image: added `src/lib/ogCard.tsx` and `src/app/opengraph-image.tsx` / `twitter-image.tsx` (`force-static`, 1200x630 PNG). The card is a graphite graticule with the name, "Full Stack Developer" and the five channel traces. In the dev server `/opengraph-image` returns a PNG and the page head has the matching og:image and twitter:image tags. The card uses the default OG font, so the name is regular weight, not Archivo 800.
- Ambient traces: Stack was already quiet. The Statement sits on a bone sheet, so no traces are behind it. Connect was the gap, so I added `contact: true` to `QUIET_DEFAULT` in `src/components/scene/pageMap.ts`. The traces now drop behind the buttons and link rows, while the big email line keeps the full signal.

`npx tsc --noEmit` passes. The design detector returned `[]` on the touched files. No dependencies were added.
OPEN: ['Integrator: run `build:pages` and check that out/ contains opengraph-image.png (or an extensionless opengraph-image route, depending on Next 16 export output) and twitter-image. Also check that the og', "While I was capturing, `RevisionHistory.tsx` (the about/experience agent's file) threw a dev overlay error: line 83 `gsap.to(trace, { scrollTrigger ... })` gave 'Cannot read properties of undefined (r", 'The OG card uses the ImageResponse default font because no font file is embedded, so the name is regular weight, not Archivo 800. To get the real face, embed an Archivo TTF in the image route; it is n', 'The `PROBE: ...` cursor readout can sit over the NOW row when the Sigma chip is focused on a fine pointer at 390 and 360. On real touch the cursor is hidden, so I left it.']
12:42 PM
Not done yet. The final pass started at 12:29 (it's 12:41 now) and is still in its first stage: four builders working in parallel.

Builder	Status
Hero, header and share image	✅ Done
3D Bench board (React Three Fiber)	⏳ Running, the biggest job
Shortening the projects section, adding Motion	⏳ Running
About, skills and contact fixes	⏳ Running (the school-leaving date already reads 2019)
The finished builder did this:

Added a share image: links to your site now show a card with your name, "Full Stack Developer" and the five signal traces.
On phones, the hero's signal traces no longer cut across the Résumé and Email buttons.
Toned down the background traces behind the contact buttons and links.
Confirmed the other hero fixes were already in place: no panel overlap on small phones, a visible hint on the trigger handle, and a bottom line that no longer repeats your job title.
Next: integration and a production build, then up to two review-and-fix rounds, then the final GitHub Pages check. I'll also look at it in the browser myself.

Estimated finish: about 14:45–15:15, depending mostly on how long the 3D board takes.



1:19 PM
You've hit your weekly limit · resets Nov 8, 12:30am (Asia/Kolkata)