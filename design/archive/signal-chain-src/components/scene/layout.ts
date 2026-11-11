import { scope } from "@/lib/stores/stage";

/**
 * Scene geometry in CSS px, relative to the scene host (which covers the hero exactly).
 *
 * The hero owns the real layout cache (`scope.layout`, measured from its lane chips and the
 * name's cap height so the graticule lines up with the type). Until the hero has written it
 * (version 0), or if it ever writes nonsense, the scene derives the same picture itself: lane
 * centres from any `[data-lane]` elements in the hero, else the spec's proportions (lanes over
 * 56-88.5% of the height, 62-88% in portrait), and a margin-aligned graticule.
 */
export type SceneLayout = {
  width: number;
  height: number;
  /** CH1..CH4, Σ centre lines. */
  lanes: [number, number, number, number, number];
  laneSpacing: number;
  /** Graticule rect [x0, y0, x1, y1]. */
  rect: [number, number, number, number];
  divisions: [number, number];
  portrait: boolean;
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function isPortrait(width: number, height: number) {
  return width <= 860 || height > width * 1.05;
}

function cssPx(name: string, fallback: number) {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export function measureLayout(host: HTMLElement, width: number, height: number): SceneLayout {
  const portrait = isPortrait(width, height);
  const hero = scope.layout;

  if (hero.version > 0 && hero.laneSpacing > 4 && Math.abs(hero.width - width) < 2 && hero.rect[2] > hero.rect[0]) {
    return {
      width,
      height,
      lanes: [...hero.lanes],
      laneSpacing: hero.laneSpacing,
      rect: [...hero.rect],
      divisions: [...hero.divisions],
      portrait,
    };
  }

  // lanes: from the hero's DOM if it marks them, else proportional
  let lanes: SceneLayout["lanes"] | null = null;
  const marked = host.parentElement?.querySelectorAll<HTMLElement>("[data-lane]");
  if (marked && marked.length === 5) {
    const top = host.getBoundingClientRect().top;
    const ys = Array.from(marked, (el) => {
      const b = el.getBoundingClientRect();
      return b.top + b.height / 2 - top;
    });
    if (ys.every((y, i) => y > 0 && (i === 0 || y > ys[i - 1]))) lanes = ys as SceneLayout["lanes"];
  }
  if (!lanes) {
    const top = height * (portrait ? 0.62 : 0.56);
    const bottom = height * (1 - (portrait ? 0.12 : 0.115));
    const row = (bottom - top) / 5;
    lanes = [0, 1, 2, 3, 4].map((k) => top + (k + 0.5) * row) as SceneLayout["lanes"];
  }

  const bar = cssPx("--bar", portrait ? 52 : 56);
  const margin = clamp(width * 0.04, 16, 64);
  const y0 = bar + 1;
  const y1 = height - (portrait ? 58 : 46);
  let divisions: [number, number];
  let rect: SceneLayout["rect"];
  if (portrait) {
    // square-ish divisions: 4 columns, as many rows as fit
    const col = (width - margin * 2) / 4;
    const rows = Math.max(2, Math.floor((y1 - y0) / col));
    rect = [margin, y0, width - margin, y0 + rows * col];
    divisions = [4, rows];
  } else {
    const col = (width - margin * 2) / 10;
    const rows = Math.max(2, Math.floor((y1 - y0) / col));
    rect = [margin, y0, width - margin, y0 + rows * col];
    divisions = [10, rows];
  }

  return { width, height, lanes, laneSpacing: lanes[1] - lanes[0], rect, divisions, portrait };
}
