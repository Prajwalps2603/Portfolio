---
version: 1
slug: "src-components-stack-index-tsx"
primary_target: "src/components/stack/index.tsx"
related_targets: []
---

# Surface brief: home #stack ("My stack, all the way down")

Scope: one section of the home page (Experience mode, a portfolio). An extension inside the established Sketch → Ship world (docs/DESIGN.md, docs/MOTION.md); it replaces the 3D keyboard, which Prajwal rejected ("no need keyboard design ... make it more creative"). He delegated the concept.

Audience and job: recruiters and engineers scanning what Prajwal works with, and checking proof. Every tool must lead to where he used it (case studies, roles, repos) from `skillGroups[].skills[].usedIn`. No ratings, counts as scores, logos or invented facts.

Constraints: no gradients or glows; lime = build / selection, blue = focus, tangerine = shipped; tokens only; one authored moment; reduced motion = the finished picture; sketch mode = the pencil sketch; content readable without JS; touch targets 44px; phones 390px.

## Direction contract

THESIS: A stack is an iceberg. Users only see the interface, the tip; Prajwal builds what sits under the waterline. The section is a hand-drawn cross-section you dive through, layer by layer, ending on the languages at the seabed. It refuses the category default: a logo cloud, a grid of skill chips, a keyboard of keycaps.

OWN-WORLD: Paper above the waterline, the ink sea below it (full bleed, a hand-drawn wavy surface). One iceberg, drawn in pencil and then inked over: card-white tip with an ink outline, ink-2 body with fog outlines below water, faint pencil hatching left as construction lines. Tools are pill buttons (Inter), selected = lime. Caveat margin notes: "what users see" at the tip, "and everything I build under it" under the waterline, "it all runs on these" at the seabed (desktop). Each sea layer's slice is marked on the ice by a drawn seam, so the drawing reads as strata. Languages set huge in Bricolage on the seabed.

STORY: The visitor sees the tip and the Interface tools on paper, crosses the waterline, and each deeper layer (Server & APIs, Data, AI, Cloud & Delivery) sketches itself, gets inked and surfaces its tools. Tapping a tool opens a card right under it: where he used it, linked. The dive ends on Java, JavaScript, TypeScript, Python and SQL as the seabed: "the languages underneath it all".

FIRST VIEWPORT (of the section, 1440x900): heading "My stack, all the way down" (lime highlighter on "stack") and one lead line, left-aligned on paper. Below, the left third (the art column, clamp(15rem, 31vw, 28rem)) is the iceberg tip rising to a hand-drawn waterline that runs edge to edge; the rest is the Interface layer: h3, one-line description, seven tool pills, with a pencil leader from the heading to the ice. The ink sea starts under the waterline and the Server & APIs layer is entering at the bottom. Primary action: tap a tool.

FORM: an annotated cross-section diagram (the iceberg), local extension of the home surface, no concept roll. Signature interaction: the dive (per layer: pencil draw, then inked over, then the tools surface) plus tool -> inline evidence card (Esc closes, typing a letter jumps to a tool). seed: none. No concept roll ran: this is a local extension of the home surface, which new-work §3 ("Extend an existing surface") routes without concept-seed; the three concepts Prajwal was shown were a structured question, not a roll. The rule, quoted from the skill's reference/new-work.md §3: "Extend an existing surface: Inherit its world and composition. Resolve only the new purpose, content, hierarchy, states, interaction, and how the addition joins the surrounding experience. No concept tournament", and for surface rolls: "Never run the script for a local extension or a precisely specified narrow request; shape those directly."

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
