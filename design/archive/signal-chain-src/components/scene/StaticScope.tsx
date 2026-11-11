"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { onScopeWake, onScroll, scope, stage } from "@/lib/stores/stage";
import { measureLayout, type SceneLayout } from "./layout";
import { MAX_QUIET, QUIET_FEATHER, QUIET_PAPER, measureQuiet, type QuietZone } from "./pageMap";
import { ScopeFallback } from "./ScopeFallback";

/**
 * The scope without a render loop: reduced motion, Save-Data / low-memory devices, and no WebGL2.
 * The hero gets the locked picture as one static SVG (same wave model and layout as the shader);
 * the rest of the page gets the persistent graticule as a fixed CSS layer behind the screens.
 * Nothing here ever animates: the SVG redraws only when the layout or the probed lane changes.
 *
 * Ambient level (./pageMap): behind dense copy and controls the paper thins to QUIET_PAPER, the
 * same level the WebGL graticule uses, through graphite veils inside the fixed layer. They are
 * placed with a transform as the page scrolls (position only, no animation).
 */
export default function StaticScope() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<SceneLayout | null>(null);
  const [hover, setHover] = useState(-1);
  const [body, setBody] = useState<HTMLElement | null>(null);
  const [zones, setZones] = useState<QuietZone[]>([]);
  const paperRef = useRef<HTMLDivElement>(null);
  const placeRef = useRef<(() => void) | null>(null);

  // veils mount after the zones are set: place them once they exist
  useEffect(() => {
    placeRef.current?.();
  }, [zones, body]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setBody(document.body);
    stage.set({ scene: "fallback" });
    document.documentElement.dataset.scope = "static";

    const measure = () => {
      const r = host.getBoundingClientRect();
      if (r.width > 1 && r.height > 1) setLayout(measureLayout(host, r.width, r.height));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    measure();
    let version = scope.layout.version;
    const offWake = onScopeWake(() => {
      setHover(scope.signal.hover);
      if (scope.layout.version !== version) {
        version = scope.layout.version;
        measure();
      }
    });

    // quiet zones: measured with the page, re-placed on scroll
    const hero = host.closest("[data-scene]")?.parentElement ?? null;
    let measured: QuietZone[] = [];
    const place = () => {
      const paper = paperRef.current;
      if (!paper) return;
      const p = paper.getBoundingClientRect();
      const half = QUIET_FEATHER / 2;
      Array.from(paper.children).forEach((el, i) => {
        const z = measured[i];
        if (!z) return;
        const v = el as HTMLElement;
        v.style.width = `${z[2] - z[0] + QUIET_FEATHER}px`;
        v.style.height = `${z[3] - z[1] + QUIET_FEATHER}px`;
        v.style.transform = `translate3d(${z[0] - window.scrollX - p.left - half}px, ${z[1] - window.scrollY - p.top - half}px, 0)`;
      });
    };
    const remeasure = () => {
      measured = measureQuiet(hero).slice(0, MAX_QUIET);
      setZones(measured);
      place();
    };
    const pageRo = new ResizeObserver(remeasure);
    const main = document.getElementById("main");
    if (main) pageRo.observe(main);
    remeasure();
    const offScroll = onScroll(place);
    placeRef.current = place;

    return () => {
      ro.disconnect();
      pageRo.disconnect();
      offScroll();
      placeRef.current = null;
      offWake();
      if (document.documentElement.dataset.scope === "static") delete document.documentElement.dataset.scope;
    };
  }, []);

  return (
    <>
      <div ref={hostRef} aria-hidden="true" className="absolute inset-0 overflow-hidden">
        {layout ? <ScopeFallback layout={layout} hover={hover} /> : null}
      </div>
      {body
        ? createPortal(
            <div ref={paperRef} aria-hidden="true" data-scope-layer="static" className="scope-layer scope-paper">
              {zones.map((z) => (
                <div key={`${z[0]}:${z[1]}`} className="scope-veil" style={{ opacity: 1 - QUIET_PAPER }} />
              ))}
            </div>,
            body,
          )
        : null}
    </>
  );
}
