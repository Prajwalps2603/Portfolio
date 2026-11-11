# Sketch → Ship: creative direction (v2, replaces "Signal Chain")

**Status:** approved concept (Prajwal: "use your own idea"; accents: "combine and make it more creative"; no co-founder mention).
**Design reference:** his own studio site, Livora (https://prajwalps2603.github.io/Livora/). Screenshots are in `design/reference/livora/`. Use its *language* (warm paper, ink, highlighter accents, heavy grotesque headlines, handwritten notes, crisp product-UI mockups, pill buttons, soft shadows, playful objects). **Do not copy its sections**: no WhatsApp float, no orbit diagram, no lanyard ID badges, no sticky-note FAQ board, no handwritten logo intro, no "Meet the builders".

## 1. The idea

Prajwal is a **Full Stack Developer** (his current role, at Maruti Flex Traders LLP since Dec 2025). In his own words: *"I enjoy turning ideas into complete applications — from designing responsive frontend interfaces and developing backend APIs to integrating databases, implementing business logic, deploying applications, and continuously improving them."*

So the site is built from two layers that meet on every screen:

| Layer | Look | Carries |
|---|---|---|
| **Sketch** (the idea) | pencil-rough SVG strokes in ink at 70%, handwritten Caveat labels, highlighter swipes, sticky notes, doodled arrows | intent, notes, his voice |
| **Ship** (the software) | crisp UI: white cards, 1px hairlines, rounded panels, JetBrains Mono labels, real data from `src/content` | proof, real projects, facts |

**The signature move: "sketch → ship".** A rough wireframe draws itself, then *compiles* into the real interface. Sketch strokes tighten into crisp borders, handwritten labels swap to real text, panels fill in, and a tangerine **SHIPPED ✓** stamp lands. It is used at exactly two scales:
1. **The opening:** the whole hero is first drawn as a sketch and then ships into the real hero.
2. **The hero stage:** an app window cycles through his real projects, each one going from its sketch to its UI.

Case-study pages open with the same move for that one project. Nowhere else; elsewhere the two layers coexist statically (handwritten notes on crisp UI).

**First 10 seconds for a recruiter:** name, "Full Stack Developer", "I turn ideas into working software", and visibly real apps he shipped. Then: work, stack, experience, résumé and contact within one scroll or one click.

## 2. Visual language

### Palette ("combine and make it more creative")
Paper and ink are the materials; **three highlighters** are the accents. Each accent has one meaning and is used like a real highlighter: behind text, on stickies, as keycaps, on status dots. Never as gradients or glows.

| Token | Hex | Role |
|---|---|---|
| `paper` | `#F4F4EF` | page background (warm off-white) |
| `paper-2` | `#EAEAE3` | alternate section band, sunken wells |
| `card` | `#FBFBF8` | crisp UI cards ("ship" layer) |
| `ink` | `#0D0D0C` | text, ink sections, primary pill |
| `ink-2` | `#1A1A18` | raised surfaces on ink |
| `graphite` | `#55554F` | secondary text on paper (≥ 7:1) |
| `pencil` | `#8A8A82` | sketch strokes, dotted grid (decorative only) |
| `line` | `#DDDDD5` | hairlines on paper |
| `lime` | `#C8F53B` | **BUILD**: primary highlighter, main CTAs on ink, "building" states |
| `lime-deep` | `#557200` | lime-coloured text on paper (AA) |
| `blue` | `#3D5AFE` | **CODE**: links, focus rings, interaction, code-ish data |
| `blue-soft` | `#DDE3FF` | blue highlighter behind ink text |
| `tangerine` | `#FF6A2B` | **SHIPPED / LIVE / NOW**: stamps, live dots, "current" markers |
| `tangerine-deep` | `#B53C0A` | tangerine text on paper (AA) |
| `tangerine-soft` | `#FFE1D3` | tangerine highlighter behind ink text |

Contrast rules: body text is ink on paper (≈ 17:1). Coloured text uses the `-deep` variants on paper. On lime, blue-soft and tangerine-soft highlights, text is always ink. White text on `blue` is OK (≈ 6.9:1); white text on tangerine is not (use ink). On ink sections, text is paper or lime.

**Combination ideas (use them; this is the "more creative" part):**
- The "Things I build" sticky note has its four lines highlighted lime, blue-soft, tangerine-soft, lime.
- Capability rows flood with their own accent on hover.
- Keyboard keycaps are coloured by layer.
- Sticky notes come in the three colours.
- Highlighter swipes animate behind key words in headings: one accent per heading, rotating through the page.

### Type (Google Fonts via `next/font`, self-hosted)
| Role | Family | Use |
|---|---|---|
| Display | **Bricolage Grotesque** (opsz 12–96, wght 500–800) | headlines at 700–800, tight tracking (−0.04em at ≥ 64px), leading 0.92 |
| Text | **Inter** (400/500/600) | body 17–18px, UI text |
| Mono | **JetBrains Mono** (400/500) | small labels, metadata, code-ish data only (never body copy) |
| Hand | **Caveat** (500–700) | the sketch layer: notes, annotations, sticky notes |

Scale (fluid with `clamp`):
- hero name: up to ~9.5rem
- H2: 3–5rem
- H3: 1.6–2.2rem
- body: 1.0625–1.125rem
- labels: ≥ 11px (mono, uppercase only when short, tracking ≤ 0.12em)
- Caveat: ≥ 20px for legibility

### Surfaces, shape, depth
- Paper sections carry a faint dotted grid (the interactive background, §4).
- **Cards** ("ship" layer):
  - background `card`
  - radius 24–32px (big outer cards) and 12–16px (inner panels)
  - 1px `line` border plus a soft shadow (`0 24px 60px -32px rgba(13,13,12,.28)`, `0 2px 6px rgba(13,13,12,.04)`), Livora-like
- **Pills:** full radius. Primary is ink with paper text; secondary is outlined ink; on ink sections the primary is lime with ink text.
- **Ink sections:** radius 40px when inset as a "slab" inside the paper page (Livora style), or full-bleed.
- **Sketch strokes:** hand-rolled rough paths (slight wobble, double-stroke at corners, `stroke-linecap: round`), 1.5–2px, `pencil` or ink at 0.8 opacity. Build a tiny deterministic generator (seeded), not a library. One generator, used everywhere.

### Icons
Authored SVG, 1.5px stroke, round caps (arrow-up-right, arrow-right, copy, check, mail, github, linkedin, x, instagram, menu, close, external).

## 3. Page structure (home)

Order and ids:
1. `#top` hero
2. `#build` What I build
3. `#work` Selected work
4. `#stack` Stack
5. `#changelog` Experience
6. `#about` README, plus education and certifications
7. `#contact` Contact
8. footer

### Header (all pages)
- **Layout:** left, the wordmark "Prajwal M P" (Bricolage 700) plus a small tangerine live dot. Centre, the links Work · Stack · Experience · About · Contact (Inter 500, with a highlighter underline on hover and active). Right, a "Résumé ↗" outline pill and a "Let's talk" ink pill.
- **Sticky:** it sits on a translucent paper blur once scrolled.
- **Mobile:** wordmark and a menu button. A full-screen paper menu opens with big Bricolage links, each with its own highlighter swipe on tap. It traps focus, closes on Esc and locks scrolling.

### 01 Hero (`#top`, paper)
- **Left column:**
  - **h1: "Prajwal M P"**, giant Bricolage 800.
  - "Full Stack Developer" in Bricolage 700, with a lime highlighter swipe behind "Full Stack".
  - The statement (`profile.statement`) in Inter.
  - Pills: "See my work ↓" (ink), "Résumé ↗" (outline), and the email as a text link.
  - A small status line: ● (tangerine) "Now: Full Stack Developer at Maruti Flex Traders · Bengaluru · Open to new opportunities".
- **Right column, the stage:**
  - A crisp **app window**: card, top bar with three dots, a mono URL-ish title such as `resumai — editor`.
  - Its content is a mini-UI of one real project. The window cycles every ~6s through 4 projects (ResumAI, Drone Intelligence, Audify AI, BookMyVenue). Each one plays sketch → ship: ~0.9s draw, ~0.6s compile, SHIPPED ✓ stamp, then hold.
  - Below the window, a row of stage chips: `idea · sketch · ui · api · data · deploy · shipped`. The current stage is lit (blue dot), and finished stages get a tangerine check.
- **The sticky note:** a tilted (−3°) "Things I build:" note in Caveat, with four highlighted lines (Web apps · AI systems · APIs & data · Automation), wired to the window by a dashed, hand-drawn connector whose arrowhead lands on the window.
- **Interaction:**
  - Hovering the window reveals the **sketch underneath** inside a circular lens (~140px) following the pointer: "x-ray to the idea".
  - Clicking the window opens that project's case study.
  - The cycle pauses on hover, focus or off-screen, and with Motion off.
- **Mini-UI templates** (one component each, fed only by `src/content` data, no invented numbers):

  | Template | Used for | Shows |
  |---|---|---|
  | `editor` | ResumAI | a JD panel and an A4 preview panel |
  | `chat` | Drone Intelligence | a question, retrieved chunks and an answer with sources |
  | `phone` | Audify AI | a call list with a transcribing state |
  | `calendar` | BookMyVenue | a date grid with booked and free days, and an advance-paid ticket |
  | `scan` | Brain Tumor Detection | an upload, a CNN and a prediction |
  | `pipeline` | MCP Job Agent | discover → parse → tailor → log |

  Each template exists in both sketch and ship forms built from the **same element list**, so the compile is a per-element transform.

### 02 What I build (`#build`, paper)
- **Heading:** "What I build" with a blue highlighter swipe on "build". Sub-line from `profile.inHisWords`, shortened.
- **The six rows** come from `src/content/capabilities.ts` and use Livora's row language, made our own:
  - **Layout of each row:** a 2-digit mono index; the title (Bricolage 700, ~2rem); the subtitle (mono); the description; tag pills; a round arrow button.
  - **Hover or focus:** the row floods with its accent (lime / blue-soft / tangerine-soft, rotating). A small handwritten "proof:" note slides in listing the real projects or roles from `proof` (resolve ids to titles) as links.
  - **Touch:** tapping expands the row and shows the same proof.

### 03 Selected work (`#work`, `paper-2` band)
- **Desktop:** a two-column sticky layout. The left is an index of the 6 featured projects (number, title, category, year), and the active one is highlighted. The right is a **project stage**: a large tilting card (pointer tilt ±6°, perspective) showing that project's mini-UI (the same templates, ship state), its tagline, real metrics only if they exist (97% · 12,000+ · 1st place; 20 tests; 6 templates; 4 STT providers), the stack as pills, and pills for "Case study →", "Repository ↗" and "Live ↗" (only when it exists).
- **Scrolling** through the index swaps the stage with a short wipe and a re-compile.
- **Mobile:** stacked project cards with the same content and no tilt.
- **"Also shipped":** a compact list of the 9 archive projects (title, one-liner, stack, links) below the featured ones, in a crisp table-like card with a handwritten "more on GitHub →" note.

### 04 Stack (`#stack`, ink section): the one 3D element
- **Heading** (paper text): "My stack, under my fingers" (or similar honest line), with "stack" in lime. Sub-line: "Press a key (or type on your own keyboard) to see where I used it."
- **The keyboard (React Three Fiber, desktop, lazy):**
  - A 3D mechanical keyboard on an ink "desk": a 3/4 view and a gentle pointer tilt.
  - **Keycaps** are the technologies from `src/content/skills.ts`, about 40 keys grouped by layer: Interface = lime, Server & APIs = blue, Data = tangerine, AI = paper with a lime legend, Cloud & Delivery = graphite, Languages = paper. Legends are baked into one CanvasTexture atlas.
  - **Interaction:** hovering, clicking or **typing the first letter** on the real keyboard presses the matching key down (spring, 120ms down, 260ms up) and lights its edge in its accent.
  - **Panel:** a crisp side panel (card on ink) shows the tech name, its layer and where it was used (`usedIn` resolved to projects and roles, as links).
  - **Accessibility:** a real DOM list of the same skills (buttons) sits beside or under the canvas; it is the accessible and keyboard path, and it drives the same selection.
  - **Fallback:** phones, portrait tablets, reduced motion and no-WebGL get a **2D keyboard**, CSS keycaps in the same colours with the same interaction (tap). It must look designed, not like a fallback.
- **Performance:** `frameloop="demand"`, ≤ 60 keys as instanced meshes where possible, DPR clamp via `src/lib/gpu.ts`, pause when offscreen, dispose on unmount.

### 05 Experience (`#changelog`, paper): "Changelog"
- **Concept:** his career as a git history.
  - A vertical **main branch line** (ink, 2px) with commit nodes.
  - Internships are short **feature branches** (blue) that merge back into main; the current role is **HEAD** (tangerine tag "HEAD → main · current").
- **Commit cards** (crisp cards):
  - version tag (e.g. `v2.0`), role, company, location, dates, duration
  - highlights as bullets, stack pills
- **Margin notes:** one handwritten note per card at most (e.g. "first production users!" only if factually supported; otherwise use the role summary).
- **Order** (newest first):
  1. Full Stack Developer, Maruti Flex Traders LLP (Dec 2025 – Present, **HEAD**)
  2. Java Full Stack Developer Intern, Dyashin Technosoft (Feb–Oct 2025)
  3. Machine Learning Intern, Rooman Technologies (Sep 2024 – May 2025)
  4. Cloud & Cybersecurity Intern, Techbyheart (Oct–Nov 2023)
  5. `init`: BE, KVGCE (2021)
- **Award commit:** "1st Place — BE Final Year Project (2025)" sits on the main line as a tagged commit.
- **Motion:** the branch line draws as you scroll (stroke-dashoffset, scrubbed). Commits pop in on the line (scale 0.6 → 1, lock ease). This is the one authored moment.

### 06 About (`#about`, paper): "README.md"
- **The page:** a crisp "file" card styled like a rendered README: file tab `README.md`, H1 "Prajwal M P", the `profile.about` paragraphs, a "Currently learning" list (`profile.learning`) and a "Route" line (Koppa → Sullia → Bengaluru as fact chips).
- **Margin notes:** handwritten Caveat annotations sit in the margin with doodled arrows (2–3 max).
- **Education:** compact rows beside the README (KVGCE BE ECE 7.9 CGPA 2021–2025; PU 2019–2021 72%; SSLC 2019 75%).
- **Certifications as laptop stickers:** a "laptop lid" (ink rounded slab) with 4 die-cut stickers (Oracle Agentic AI, GitHub Foundations, Java Full Stack (Dyashin), 1st Place BE project), each in one of the three accents.
  - Hover or focus lifts the sticker's corner (peel, 3D-ish rotate) and shows "Verify ↗"; the link goes to the real credential.
  - The award has no link, so it shows "Awarded 2025".

### 07 Contact (`#contact`, ink slab) and footer
- **Headline:** "Let's build something." in big Bricolage, with "build" on a lime highlighter. Sub-line: "Have an idea, a role or a problem? I reply to every email."
- **The email:** big (Bricolage 700) and **hand-underlined** (a sketch stroke draws on hover). Clicking it opens mailto.
  - Beside it: "Copy" pill, which uses Motion `AnimatePresence` to swap to "Copied ✓" in tangerine.
- **Socials:** pills (GitHub, LinkedIn, X, Instagram) and a Résumé pill.
- **"Now" card:**
  - a live Bengaluru clock (IST, updates each minute)
  - "Full Stack Developer at Maruti Flex Traders"
  - "Open to new opportunities"
- **Footer:**
  - the name, a one-line credit in mono ("Designed & built by Prajwal M P · Next.js, GSAP, Three.js, Motion")
  - a back-to-top pill and the year
  - **no** "built with love" clichés

### `/work/[slug]/` case studies (paper)
- **Opening:** the hero is the project's mini-UI playing sketch → ship once. Beside it: title, tagline, category, year, real metrics, award, and links (repo / live).
- **Then:**
  1. The problem
  2. The approach
  3. **"How it works"**: the architecture from `projects.ts` (`architecture` layers plus `flow`), drawn as a hand-sketched diagram whose boxes compile into crisp nodes as they scroll in.
  4. Highlights
  5. Stack pills
  6. Next and previous project
- **Navigation:** home ↔ case study uses the page transition.

### 404
"This page never shipped." A sketch of a broken window, with links home and to work.

## 4. Interactive background (paper sections)
- **Grid:** a canvas dot grid (14–18px pitch, `pencil` at 35%) behind the content.
- **Pointer reaction:** dots within ~120px of the pointer grow slightly and darken toward ink, with a soft falloff and an eased follow (no trails).
- **Idle and fallbacks:** idle has very slow breathing. Touch devices get static dots. Reduced motion gets a static CSS radial-gradient grid.
- **Cost:** 2D canvas, DPR-clamped, paused offscreen. It must never reduce text legibility (it sits at ≤ 35% alpha).

## 5. Motion system
- **Eases:**

  | Ease | Use |
  |---|---|
  | `arrive` = expo.out | entrances |
  | `pen` = `cubic-bezier(.65,0,.35,1)` | strokes drawing, highlighter swipes |
  | `snap` = back.out(1.4) | only the SHIPPED stamp and sticker peel return |
  | `exit` = power2.in | always faster than entrances |

- **Durations:**

  | Kind | Duration |
  |---|---|
  | feedback | 120–180ms |
  | UI state | 200–320ms |
  | swipes | 500–700ms |
  | sketch draw | ≤ 900ms |
  | compile | ≤ 600ms |

- **One authored moment per section:**

  | Section | Moment |
  |---|---|
  | Opening + hero | sketch → ship |
  | What I build | row flood |
  | Work | stage re-compile |
  | Stack | key press |
  | Experience | branch line draw |
  | About | sticker peel |
  | Contact | hand-underline + copy swap |

  Everything else stays still or just fades in once (no identical fade-ups everywhere).
- **Highlighter swipes** on headings play once, when the heading is 70% in view (`scaleX` 0 → 1, origin left, `pen`, 600ms).
- **Tooling:** GSAP + ScrollTrigger for scroll and timelines; Lenis smooth scroll (existing `src/lib/motion/SmoothScroll.tsx`); Motion (`motion/react`) only for React state swaps (copy, menu, panel content).
- **Opening (≤ 2.6s):**
  1. The hero renders as sketch first: rough boxes for header, name, sticky note and window; a scribble where the name will be.
  2. At ~0.9s strokes tighten into the real elements, the name types in with a fast stagger and the highlighter swipes run.
  3. At ~2.0s the stamp lands on the window.
  4. Skippable by any input. Short version on repeat visits in the same session (`useIntroMode`). Instant with reduced motion.
  5. Content is never hidden if JS fails (hide states are set in JS).

## 6. Responsive
- **Breakpoints:** ≥ 1200 desktop, 900–1199 laptop or tablet landscape, 600–899 tablet portrait, < 600 phone.
- **Phone:**
  - hero stack order: name → role → statement → pills → status → stage window (smaller, no lens)
  - sticky note above the window, no connector
  - capability rows become accordions
  - work becomes stacked cards
  - keyboard becomes 2D
  - changelog line on the left edge
  - README stacks on top of education, with the sticker lid below
  - contact email wraps cleanly (break at "@"), and the copy pill is full-width
- **Touch:** targets ≥ 44px; no hover-only content (tap equivalents for every hover reveal).

## 7. Accessibility & performance
- **Reduced motion:** no opening animation, no cycling (static ship state), no lens, no tilt, no smooth scroll, no scrubbing, a 2D keyboard; state changes keep their colour and opacity feedback.
- **Semantics:** a real `h1` and logical headings; landmarks; a skip link; visible focus (2px blue ring, offset 3px); Esc closes overlays; canvases are `aria-hidden` with DOM equivalents; external links are announced.
- **Browser surfaces:** selection lime with ink text; caret blue; a thin, warm scrollbar.
- **Budgets:** the R3F keyboard chunk is lazy (only near `#stack`, desktop); fonts via `next/font` with fallback metrics; no layout shift; zero console errors.

## 8. Content rules
- **Facts:** all from `src/content/*` only. No invented metrics, clients, testimonials or numbers in mockups. Mini-UIs show real labels and real features; placeholder-looking data must be clearly illustrative (e.g. "Venue A") and never fake KPIs.
- **Current role:** **Full Stack Developer**, Maruti Flex Traders LLP, Dec 2025 – Present.
- **Livora:** a project (a studio website he built). **Never "co-founder".**
- **Private details:** no phone number; email is prajwalnair2603@gmail.com; the résumé link is `profile.resume.href`.
- **No electronics or hardware theme anywhere** (Prajwal rejected it). His ECE degree appears only as a fact in education.
