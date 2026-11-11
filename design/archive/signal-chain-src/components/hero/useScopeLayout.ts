"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "@/lib/motion/gsap";
import { scope, wakeScope } from "@/lib/stores/stage";

/**
 * Measures the hero once per layout change and writes `scope.layout` for the WebGL scene
 * (the scene never reads computed styles per frame). Ported from the sketch's layoutHero():
 *
 * - lanes: the centre line of each lane row (CH1..CH4, then Σ), from the DOM;
 * - rect / divisions: the graticule is drawn FROM the name. One division = the name's cap
 *   height, with the baseline on a division line (landscape, 10 columns). In portrait the
 *   graticule is 4 columns and rows are 1/10 of the free height, still phased to the baseline.
 *
 * `onLayout` lets the hero place things that hang off the lanes (the trigger handle).
 */

let capRatio = 0.705; // Archivo 800 cap height / em, refined by measureCap()

function measureCap(family: string) {
  try {
    const c = document.createElement("canvas").getContext("2d");
    if (!c) return;
    c.font = `800 200px ${family}`;
    const m = c.measureText("H");
    if (m.actualBoundingBoxAscent > 100 && m.actualBoundingBoxAscent < 170) capRatio = m.actualBoundingBoxAscent / 200;
  } catch {
    /* keep the default */
  }
}

export function useScopeLayout(
  heroRef: RefObject<HTMLElement | null>,
  onLayout?: () => void,
) {
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const name = hero.querySelector<HTMLElement>("[data-hero-name]");
    const baseline = hero.querySelector<HTMLElement>("[data-baseline]");
    const copy = hero.querySelector<HTMLElement>("[data-hero-copy]");
    const lanes = Array.from(hero.querySelectorAll<HTMLElement>("[data-lane]"));
    if (!name || !baseline || lanes.length !== 5) return;

    const measure = () => {
      const r = hero.getBoundingClientRect();
      if (r.width === 0) return;
      const L = scope.layout;
      L.width = r.width;
      L.height = r.height;
      const ys = lanes.map((el) => {
        const b = el.getBoundingClientRect();
        return b.top + b.height / 2 - r.top;
      });
      L.lanes = [ys[0], ys[1], ys[2], ys[3], ys[4]];
      L.laneSpacing = ys[1] - ys[0];

      const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--bar")) || 56;
      const m = Math.min(64, Math.max(16, r.width * 0.04));
      // The copy may be mid-parallax: measure the name where it sits at rest.
      const drift = copy ? Number(gsap.getProperty(copy, "y")) || 0 : 0;
      const fs = parseFloat(getComputedStyle(name).fontSize);
      const base = baseline.getBoundingClientRect().top - r.top - drift;
      const capH = fs * capRatio;
      const portrait = r.width <= 860 || r.height > r.width * 1.05;
      const top0 = bar + 1;
      const bot0 = r.height - (portrait ? 58 : 46);
      if (!portrait) {
        const capTop = base - capH;
        let k0 = Math.ceil((top0 - capTop) / capH);
        let k1 = Math.floor((bot0 - capTop) / capH);
        // An even row count puts the centre axis on a division line. Prefer dropping the bottom
        // row (the name stays inside the top division, as in the sketch) unless that would leave
        // the Σ trace hanging below the graticule; then push the top row down instead.
        if ((k1 - k0) % 2) {
          const sigma = L.lanes[4];
          if (capTop + (k1 - 1) * capH >= sigma - L.laneSpacing * 0.35) k1 -= 1;
          else k0 += 1;
        }
        L.rect = [m, capTop + k0 * capH, r.width - m, capTop + k1 * capH];
        L.divisions = [10, Math.max(2, k1 - k0)];
      } else {
        const d = (bot0 - top0) / 10;
        const off = (((base - top0) % d) + d) % d;
        const rows = Math.floor((bot0 - top0 - off) / d);
        L.rect = [m, top0 + off, r.width - m, top0 + off + rows * d];
        L.divisions = [4, rows];
      }
      L.version += 1;
      onLayout?.();
      wakeScope();
    };

    measureCap(getComputedStyle(name).fontFamily);
    measure();

    let t = 0;
    const queue = () => {
      window.clearTimeout(t);
      t = window.setTimeout(measure, 140);
    };
    const ro = new ResizeObserver(queue);
    ro.observe(hero);
    let alive = true;
    document.fonts?.ready
      .then(() => {
        if (!alive) return;
        measureCap(getComputedStyle(name).fontFamily);
        measure();
      })
      .catch(() => {});
    return () => {
      alive = false;
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, [heroRef, onLayout]);
}
