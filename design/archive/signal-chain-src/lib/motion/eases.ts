/**
 * Named motion vocabulary for Signal Chain. Pure data (no GSAP import) so it is safe anywhere.
 * The curves are registered as GSAP CustomEases in ./gsap.ts and mirrored as CSS custom
 * properties in globals.css (--ease-beam, --ease-panel, --ease-wipe, --ease-lock, --ease-expo).
 *
 * Use the NAME, never a raw curve: gsap.to(el, { ease: EASE.lock }) or className="ease-panel".
 */

/** SVG path data for each CustomEase (taken verbatim from the approved sketch). */
export const CURVES = {
  /** Symmetric sweep: the beam crossing the screen, trace draw-ins, single-line wipes. */
  beam: "M0,0 C0.65,0 0.35,1 1,1",
  /** The trigger catching: fast, 2% overshoot, settle. Locking, seating, re-acquiring. */
  lock: "M0,0 C0.14,0.62 0.2,1.04 0.34,1.02 0.5,0.99 0.64,1 1,1",
  /** UI chrome: rows, chips, menus, staggered arrivals of small parts. */
  panel: "M0,0 C0.2,0.8 0.2,1 1,1",
  /** Large clip-path wipes: the page curtain, screen-to-sheet expansion. */
  wipe: "M0,0 C0.7,0 0.2,1 1,1",
} as const;

export type CurveName = keyof typeof CURVES;

/** Every ease the site uses. If it is not here, you do not need it. */
export const EASE = {
  beam: "beam",
  lock: "lock",
  panel: "panel",
  wipe: "wipe",
  /** General arrival (exponential ease-out). Headings, masked lines, sheet sections. */
  out: "expo.out",
  /** Probe brackets, tooltips, magnetic follow: quick and direct. */
  probe: "power3.out",
  /** Exits: accelerate away. Always shorter than the matching entrance. */
  exit: "power2.in",
  /** Symmetric moves that start and end at rest (rare; the route curtain no longer uses it). */
  inOut: "power3.inOut",
  /** Constant speed: signals do not ease (pulses along copper, message dashes, scrub). */
  none: "none",
} as const;

/** Durations in seconds (GSAP units). CSS mirrors the UI ones as --dur-*. */
export const DUR = {
  tap: 0.12,
  hover: 0.2,
  invert: 0.22,
  probe: 0.22,
  exit: 0.3,
  chip: 0.32,
  surface: 0.35,
  /** Route curtain, OUT: the bench panel expanding to the viewport (screen -> sheet). */
  curtainExpand: 0.26,
  /** Route curtain, OUT: the bone sheet / graphite screen wiping across behind the beam. */
  curtainWipe: 0.24,
  /** Route curtain, IN: the graphite curtain wiping off home (expo out, input already live). */
  curtainLift: 0.45,
  /** Route curtain, OUT (sheet -> screen): graphite wipes in behind the beam, expo out, ~60% of curtainLift. */
  curtainReturn: 0.27,
  /** Reduced-motion route crossfade, out and in (opacity only, no movement). */
  curtainFade: 0.15,
  panel: 0.5,
  rise: 0.55,
  wipe: 0.6,
  beamWipe: 0.7,
  heading: 0.9,
  beam: 0.9,
  traceDraw: 1.0,
  /** One sample-and-hold step on the hero name. */
  sampleStep: 0.17,
  /** One sample-and-hold step on a datasheet title. */
  sheetStep: 0.11,
} as const;

/** Stagger steps in seconds. */
export const STAGGER = {
  chrome: 0.035,
  rows: 0.05,
  bom: 0.04,
  history: 0.07,
  sheet: 0.06,
  chips: 0.06,
  lines: 0.08,
} as const;

/** Sample-and-hold slice spacings (px), coarse to fine, then solid. */
export const SAMPLE_STEPS = [24, 12, 6, 3] as const;
