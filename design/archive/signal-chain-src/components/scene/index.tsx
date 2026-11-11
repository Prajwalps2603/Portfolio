import { QUIET_FEATHER } from "./pageMap";
import { SceneLoader } from "./SceneLoader";

/**
 * The scope: one persistent instrument screen behind the whole home page. Mounted by
 * src/app/page.tsx inside the hero wrapper (`relative isolate`); this box covers the hero exactly
 * and is the coordinate frame of the hero's layout cache. It is aria-hidden and never takes
 * input: the hero owns the controls and the scene reads them through the stage store.
 *
 * Layers:
 * 1. a CSS graticule over the hero, server-rendered: what you see without JavaScript and before
 *    the lazy chunk arrives. Hidden while the opening plays (the beam draws the graticule in).
 * 2. the scope (lazy), one of:
 *    - WebGL2: a single fixed, viewport-sized canvas behind the page (z below content). In the
 *      hero it draws the full-strength traces aligned to the lane chips; as the hero leaves, the
 *      lanes park in a dim band (about 12% gain) and live on behind every graphite section, the
 *      graticule continues down the page, and each screen's channel runs along its top edge.
 *    - static: reduced motion, Save-Data / low memory, or no WebGL2. The locked picture as SVG in
 *      the hero, plus a fixed CSS graticule behind the screens. Nothing loops.
 *
 * While a scope layer is live (html[data-scope]), graphite screens drop their own background so
 * the layer shows through; bone sheets stay opaque and cover it (records, not signals). Without
 * JavaScript nothing changes: sections keep their graphite and the hero keeps its CSS graticule.
 */
const SCOPE_CSS = `
html[data-scope] #main > div:has(> [data-scene]),
html[data-scope] #main section[data-surface="screen"] { background-color: transparent; }
html[data-scope="webgl"] [data-scene-grat] { visibility: hidden; }
.scope-layer { position: fixed; inset: 0; z-index: calc(var(--z-scene) - 1); pointer-events: none; }
.scope-layer > canvas { display: block; width: 100%; height: 100%; }
.scope-paper { inset: calc(var(--bar) + 1px) var(--margin) 0; container-type: size; opacity: 0.8; overflow: hidden; }
.scope-veil {
  position: absolute; top: 0; left: 0; background: var(--color-graphite); will-change: transform;
  --f: ${QUIET_FEATHER}px;
  mask-image: linear-gradient(90deg, transparent, #000 var(--f), #000 calc(100% - var(--f)), transparent),
    linear-gradient(180deg, transparent, #000 var(--f), #000 calc(100% - var(--f)), transparent);
  mask-composite: intersect;
}
.scope-paper::before {
  content: ""; position: absolute; inset: 0;
  border-right: 1px solid var(--color-graticule);
  background-image:
    linear-gradient(var(--color-graticule) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-graticule) 1px, transparent 1px);
  background-size: calc(100cqw / var(--divisions)) calc(100cqw / var(--divisions));
}
`;

export function Scene() {
  return (
    <div data-scene="" aria-hidden="true" className="pointer-events-none absolute inset-0 z-(--z-scene) overflow-hidden">
      <style>{SCOPE_CSS}</style>
      <div data-scene-grat="" className="graticule absolute inset-x-(--margin) top-[calc(var(--bar)+1px)] bottom-12 opacity-80 booting:invisible" />
      <SceneLoader />
    </div>
  );
}
