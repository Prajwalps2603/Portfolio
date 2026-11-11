import type { SectionId } from "@/lib/sections";

/**
 * Where the screens are, for the persistent scope layer behind the page.
 *
 * Every graphite section after the hero gets one channel, run as a faint trace along its top
 * edge as it scrolls in. A section can choose its own with `data-channel="1".."4" | "sigma"`;
 * otherwise the signal chain's order decides:
 *   signal  CH1 Interface  (his words: the surface a reader meets first)
 *   work    CH2 Services   (systems wired as built: request / response between parts)
 *   stack   CH3 Data       (the parts list, a staircase of components)
 *   contact Σ              (bone is Σ and "you": the chain ends with the reader)
 * Sheets (bone) carry records, not signals, and simply cover the layer.
 */

const DEFAULT_CHANNEL: Partial<Record<SectionId, number>> = { signal: 0, work: 1, stack: 2, contact: 4 };

export type ScreenEdge = {
  /** Section top, CSS px from the document top. */
  top: number;
  /** Channel index 0..3, 4 = Σ. */
  channel: number;
};

function channelOf(el: HTMLElement): number | null {
  const own = el.dataset.channel;
  if (own === "sigma") return 4;
  const n = own ? Number(own) : NaN;
  if (n >= 1 && n <= 4) return n - 1;
  return DEFAULT_CHANNEL[el.id as SectionId] ?? null;
}

/** Graphite sections of the page outside the hero, in document order. */
export function screenSections(hero: Element | null): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('#main [data-surface="screen"]')).filter(
    (el) => !(hero && hero.contains(el)) && el.closest("[data-surface]") === el,
  );
}

/** Measure each screen's top edge (document px) and channel. Call on resize, never per frame. */
export function measureEdges(hero: Element | null): ScreenEdge[] {
  const y = window.scrollY;
  const out: ScreenEdge[] = [];
  for (const el of screenSections(hero)) {
    const channel = channelOf(el);
    if (channel === null) continue;
    out.push({ top: el.getBoundingClientRect().top + y, channel });
  }
  return out;
}

/**
 * Ambient level: how loud the scope may run behind a stretch of the page.
 *
 * Behind dense copy and controls (the bench, the parts list) the parked traces and the page
 * graticule drop to QUIET_TRACE / QUIET_PAPER of their strength, alpha and amplitude both, so
 * running text keeps its contrast and the controls read as foreground. The section's own header
 * (its h2) and the page gutters keep the full signal: the zone starts under the heading and
 * stops at the section's content box, so the margins and the section padding stay live.
 *
 * A section opts in or out with `data-ambient="quiet" | "full"`; otherwise QUIET_DEFAULT
 * decides. Any other element inside #main can mark itself `data-ambient="quiet"` (its own box
 * becomes a zone). Zones are measured on resize, never per frame.
 */
export const QUIET_TRACE = 0.4;
export const QUIET_PAPER = 0.55;
/** Soft edge, CSS px, laid inside the zone so the gutters never dim. */
export const QUIET_FEATHER = 32;
/** The renderer's uniform array size. */
export const MAX_QUIET = 8;

const QUIET_DEFAULT: Partial<Record<SectionId, boolean>> = { work: true, stack: true, contact: true };

/** [x0, y0, x1, y1] in document CSS px. */
export type QuietZone = [number, number, number, number];

function headingBottom(section: HTMLElement): number | null {
  const h = section.querySelector<HTMLElement>("h2");
  if (!h) return null;
  const r = h.getBoundingClientRect();
  // a visually hidden heading (sr-only) leaves the whole content box quiet
  return r.height > 2 && r.width > 2 ? r.bottom : null;
}

export function measureQuiet(hero: Element | null): QuietZone[] {
  const sx = window.scrollX;
  const sy = window.scrollY;
  const out: QuietZone[] = [];
  for (const el of screenSections(hero)) {
    const mark = el.dataset.ambient;
    const quiet = mark ? mark === "quiet" : !!QUIET_DEFAULT[el.id as SectionId];
    if (!quiet) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const x0 = r.left + parseFloat(cs.paddingLeft);
    const x1 = r.right - parseFloat(cs.paddingRight);
    const head = headingBottom(el);
    // start just under the heading's baseline area: its descenders may sit in the soft edge
    const y0 = head !== null ? head - 8 : r.top + parseFloat(cs.paddingTop);
    const y1 = r.bottom - parseFloat(cs.paddingBottom);
    if (x1 - x0 > QUIET_FEATHER * 2 && y1 - y0 > QUIET_FEATHER * 2) out.push([x0 + sx, y0 + sy, x1 + sx, y1 + sy]);
  }
  document.querySelectorAll<HTMLElement>('#main [data-ambient="quiet"]:not([data-surface])').forEach((el) => {
    if (hero && hero.contains(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width > QUIET_FEATHER * 2 && r.height > QUIET_FEATHER * 2) out.push([r.left + sx, r.top + sy, r.right + sx, r.bottom + sy]);
  });
  return out;
}
