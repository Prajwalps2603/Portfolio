"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion/media";
import { pointer, subscribePointer } from "@/lib/motion/pointer";
import { dprForTier, getQualityTier } from "@/lib/gpu";
import { onScopeWake, onScroll, scope, stage } from "@/lib/stores/stage";
import { measureLayout, type SceneLayout } from "./layout";
import { MAX_QUIET, QUIET_FEATHER, measureEdges, measureQuiet, screenSections, type QuietZone, type ScreenEdge } from "./pageMap";
import { createScopeRenderer, type FrameInput, type ScopeRenderer } from "./renderer";
import { sumWave, timeScale } from "./wave";

/**
 * The scope (lazy WebGL2 chunk): ONE fixed, viewport-sized canvas behind the whole home page.
 *
 * The picture is a function of scroll:
 *   - in the hero, the traces sit on the hero's lanes at full strength (gain 1), scrolled with the
 *     page so they stay under the lane chips;
 *   - as the hero leaves, the lanes ride up with it (still under their chips) until CH1 reaches
 *     its parking line just under the top bar; there the five lanes stop together and the hero
 *     slides off over them, while the gain falls to AMBIENT (12%), so the signal keeps running
 *     faintly behind every graphite section. Scrolling is the timebase out
 *     there: the parked channels roll with scroll distance, at four different rates;
 *   - below the hero the graticule continues as plain divisions (the page's graph paper);
 *   - each screen's channel (./pageMap) runs along its top edge, swept in left to right as the
 *     edge comes up the viewport;
 *   - behind dense copy and controls (./pageMap quiet zones: the bench, the parts list) the
 *     traces drop to ~40% in alpha and amplitude and the paper thins; headers and gutters keep
 *     the full ambient signal.
 * Bone sheets are opaque and simply cover the layer.
 *
 * Stage store contract:
 *   reads  scope.signal  (opening tweens, trigger, chip hover: written by intro/hero)
 *          scope.layout  (lane centres + graticule rect, hero coordinates; see ./layout.ts)
 *          pointer       (the shared tracker: a fallback probe while the hero writes none)
 *          stage.intro   (holds a blank screen until the opening starts, then the beam draws)
 *   writes stage.scene   ("webgl" after the first frame)
 *          scope.signal.roll / energy (integrated here: roll += speed * dt, energy decays)
 *          html[data-scope="webgl"] while a frame is on screen (screens go transparent, see ./index)
 *
 * Render discipline: demand-rendered, converge then stop. The loop runs on the GSAP ticker only
 * while something changes (opening, trigger, probe, scroll, resize); once the persistence buffer
 * settles it costs 0 draws until wakeScope(), the pointer, scroll or a resize wakes it. It stops
 * while no graphite screen is in view (IntersectionObserver) and on hidden tabs. The lowest
 * quality rung renders single frames on demand. Reduced motion never loads this chunk (see
 * ./SceneLoader); if the setting flips while it runs, frames turn static until the swap.
 */

const TAU_PERSIST = 0.075; // phosphor persistence, seconds
const SETTLE_FRAMES = 36; // frames of no change before the loop stops
const PROBE_FADE = 0.08; // probe cursor visibility time constant (~250ms to settle)
const AMBIENT = 0.12; // trace gain behind content, once the hero has left
const EDGE = 0.22; // absolute strength of a section's edge trace (tone-mapped, before the scene gain)
const PARK = 0.07; // parking line of CH1 below the top bar, fraction of the viewport height
const PAPER = 0.55; // page graticule strength below the hero (it sits behind running text)
/** Parked roll per scrolled px (screen widths): four rates, so the channels drift apart. */
const SCROLL_ROLL = [0.00011, -0.00008, 0.00006, 0.00014] as const;

type Probe = { x: number; y: number; inside: boolean; energy: number; vis: number; near: number };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** min(a, b) with a soft knee k wide, so the lanes ease onto their parking line. */
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
};

export default function ScopeCanvas({ onFail }: { onFail: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const root = document.documentElement;
    const hero = host.closest("[data-scene]")?.parentElement ?? null;

    // The fixed layer lives at the end of <body> (z below all content), so it can sit behind
    // every section, not only the hero. A fresh canvas per mount: StrictMode remounts and context
    // loss never reuse a dead context.
    const layer = document.createElement("div");
    layer.className = "scope-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.dataset.scopeLayer = "webgl";
    const canvas = document.createElement("canvas");
    canvas.style.visibility = "hidden";
    layer.appendChild(canvas);
    document.body.appendChild(layer);

    let renderer: ScopeRenderer | null = null;
    try {
      renderer = createScopeRenderer(canvas);
    } catch {
      renderer = null;
    }
    if (!renderer) {
      layer.remove();
      onFail();
      return;
    }

    const cleanups: Array<() => void> = [];
    const S = scope.signal;

    const tier = getQualityTier();
    const dprMax = dprForTier(tier)[1];
    let quality: 0 | 1 | 2 = tier === "low" ? 1 : 0;
    let L: SceneLayout | null = null;
    let vw = 0;
    let vh = 0;
    let dpr = 1;
    let segments = 720;
    let docTop = 0;
    let docLeft = 0;
    let layoutVersion = -1;
    let edges: ScreenEdge[] = [];
    let edgesVersion = 0;
    let zones: QuietZone[] = [];
    const quiet = new Float32Array(MAX_QUIET * 4);
    let bar = 56;

    let visible = true;
    let ticking = false;
    let staticRaf = 0;
    let last = 0;
    let idle = 0;
    let drawn = false;
    let lost = false;
    let lastY = window.scrollY;
    let moved = 0; // css px the page moved since the last frame
    const amb = [0, 0, 0, 0]; // parked roll, driven by scroll distance
    const roll = [0, 0, 0, 0];
    const frameTimes: number[] = [];
    const probe: Probe = { x: -9999, y: -9999, inside: false, energy: 0, vis: 0, near: -1 };
    const snapshot = new Float64Array(48);

    const isStatic = () => prefersReducedMotion() || quality === 2;
    const probeAllowed = () => hasFinePointer() && !prefersReducedMotion() && stage.get().intro === "done";
    /** The opening has not started yet: keep the screen dark so the beam can power it on. */
    const holding = () => root.classList.contains("booting") && stage.get().intro === "pending";

    const measure = () => {
      if (!renderer) return;
      const r = host.getBoundingClientRect();
      vw = layer.clientWidth;
      vh = layer.clientHeight;
      if (r.width < 2 || r.height < 2 || vw < 2 || vh < 2) return;
      L = measureLayout(host, r.width, r.height);
      layoutVersion = scope.layout.version;
      docTop = r.top + window.scrollY;
      docLeft = r.left + window.scrollX;
      edges = measureEdges(hero);
      zones = measureQuiet(hero);
      edgesVersion++;
      bar = parseFloat(getComputedStyle(root).getPropertyValue("--bar")) || 56;
      dpr = quality >= 1 ? 1 : Math.min(window.devicePixelRatio || 1, dprMax);
      segments = (L.portrait ? 360 : 720) >> (quality >= 1 ? 1 : 0);
      renderer.resize(vw * dpr, vh * dpr, segments);
      drawn = false;
    };

    const build = (time: number, dt: number, still: boolean): FrameInput | null => {
      if (!L) return null;
      const hold = holding();
      const y = window.scrollY;
      const o = y - docTop; // how far the hero has scrolled up (css px)
      const ox = docLeft - window.scrollX;
      const leave = smooth(0.1, 0.85, o / L.height); // 0 in the hero, 1 once it has gone
      const gain = 1 - (1 - AMBIENT) * leave;

      // lanes: ride up with the hero, then park together (soft knee) and stay
      const sp = L.laneSpacing;
      const lift = L.lanes[0] - (bar + vh * PARK); // hero scroll at which CH1 parks
      const ride = smin(o, Math.max(lift, 0), sp);
      const lanes = L.lanes.map((ly) => (ly - ride) * dpr);
      for (let c = 0; c < 4; c++) roll[c] = S.roll[c] + amb[c] * leave;

      const ampScale = 1 - 0.4 * leave;
      const amp = sp * 0.3 * ampScale * dpr;
      const rawY = (L.height * 0.5 - o) * dpr;
      const xs = timeScale(L.width);
      // persistence follows the picture: moving with the page, the trail is dropped (no smear)
      const decay = still ? 0 : Math.exp(-dt / TAU_PERSIST) * Math.exp(-moved / 4);
      const reveal = hold ? 0 : S.reveal;
      const grat = hold ? 0 : S.grat;
      const headY = rawY - sumWave(reveal * xs, roll) * amp * 2.4;
      // The hero writes the probe to the bus (position, ripple energy, visibility). The scene's
      // own pointer probe is only the fallback for when nothing writes it, so it never doubles.
      const heroProbe = S.probeX > -9000 || S.probeVis > 0;
      const local = !heroProbe && probe.inside && probe.vis > 0.001;
      const px = (heroProbe ? S.probeX : probe.x) + ox;
      const py = (heroProbe ? S.probeY : probe.y) - o;
      const hover = S.hover >= 0 ? S.hover : local ? probe.near : -1;
      const energy = still ? 0 : Math.min(1, S.energy + (heroProbe ? 0 : probe.energy));
      const probeVis = still ? 0 : heroProbe ? S.probeVis : probe.vis;
      const trigY = (L.lanes[4] - o - S.trigLvl * sp * 0.3) * dpr;

      // the section edge coming up the viewport (at most one: screens are a viewport apart)
      let edge: [number, number, number, number] = [0, 0, 0, 0];
      if (!hold) {
        for (const e of edges) {
          const ey = e.top - y;
          if (ey <= bar || ey >= vh) continue;
          const t = clamp((vh - ey) / (vh * 0.45), 0, 1);
          const sweep = 1 - Math.pow(1 - t, 3);
          const strength = EDGE * smooth(bar, bar + 96, ey);
          edge = [(ey + 14) * dpr, sweep, strength / Math.max(gain, 0.05), e.channel];
          break;
        }
      }

      // quiet zones in view, viewport device px
      let quietN = 0;
      for (const z of zones) {
        if (quietN >= MAX_QUIET) break;
        const zy0 = z[1] - y;
        const zy1 = z[3] - y;
        if (zy1 < -QUIET_FEATHER || zy0 > vh + QUIET_FEATHER) continue;
        const k = quietN * 4;
        quiet[k] = (z[0] - window.scrollX) * dpr;
        quiet[k + 1] = zy0 * dpr;
        quiet[k + 2] = (z[2] - window.scrollX) * dpr;
        quiet[k + 3] = zy1 * dpr;
        quietN++;
      }

      return {
        time,
        split: S.split,
        noise: S.noise,
        roll,
        reveal,
        lanes: lanes.slice(0, 4),
        sumY: lanes[4],
        rawY,
        amp,
        probe: [px * dpr, py * dpr, energy],
        hover,
        sigma: 5.5 * dpr,
        core: 0.85 * dpr,
        halo: 0.16,
        xs,
        // energy per segment, normalised so the steady state is the same at any frame rate
        energy: (vw * dpr / segments) * 1.25 * (1 - decay),
        decay,
        grat,
        gratX: grat >= 1 && reveal >= 1 ? 1e6 : reveal * vw * dpr + 60 * dpr,
        head: [reveal * vw * dpr, headY, hold ? 0 : S.head],
        probeVis,
        dpr,
        rect: [(L.rect[0] + ox) * dpr, (L.rect[1] - o) * dpr, (L.rect[2] + ox) * dpr, (L.rect[3] - o) * dpr],
        div: L.divisions,
        trigY,
        trigVis: S.trigVis,
        gain,
        edge,
        edgeAmp: (L.portrait ? 3.5 : 4.5) * dpr,
        // the page graticule picks up under the hero's own (behind the status row too, once leaving)
        ambTop: (L.rect[3] - o) * dpr,
        ambGrat: PAPER * smooth(0.04, 0.4, leave),
        quiet,
        quietN,
        quietF: QUIET_FEATHER * dpr,
      };
    };

    const present = () => {
      if (drawn) return;
      drawn = true;
      canvas.style.visibility = "visible";
      root.dataset.scope = "webgl";
      stage.set({ scene: "webgl" });
    };

    /** Did anything the picture depends on change since the last frame? */
    const changed = () => {
      const v = [
        S.reveal, S.grat, S.split, S.noise, S.head, S.hover, S.probeVis, S.trigLvl, S.trigVis,
        S.roll[0], S.roll[1], S.roll[2], S.roll[3], S.speed[0], S.speed[1], S.speed[2], S.speed[3],
        S.probeX, S.probeY, probe.x, probe.y, probe.near, holding() ? 1 : 0, scope.layout.version, quality,
        window.scrollY, window.scrollX, vw, vh, edgesVersion, amb[0], amb[1], amb[2], amb[3],
      ];
      let diff = false;
      for (let i = 0; i < v.length; i++) {
        if (snapshot[i] !== v[i]) {
          diff = true;
          snapshot[i] = v[i];
        }
      }
      return diff;
    };

    const stop = () => {
      if (ticking) gsap.ticker.remove(tick);
      ticking = false;
    };

    const renderStatic = () => {
      staticRaf = 0;
      if (!renderer || lost || !visible || document.hidden) return;
      if (scope.layout.version !== layoutVersion) measure();
      const f = build(performance.now() / 1000, 0, true);
      if (!f) return;
      renderer.frame(f);
      moved = 0;
      present();
    };

    const adapt = (ms: number) => {
      if (quality >= 2 || ms > 120 || ms <= 0 || stage.get().intro !== "done") return;
      frameTimes.push(ms);
      if (frameTimes.length < 90) return;
      const median = frameTimes.slice().sort((a, b) => a - b)[45];
      frameTimes.length = 0;
      if (quality === 0 && median > 20) {
        quality = 1;
        measure();
      } else if (quality === 1 && median > 24) {
        quality = 2;
        S.energy = 0;
        probe.energy = 0;
        stop();
        renderStatic();
      }
    };

    function tick() {
      if (!renderer || lost || !visible || document.hidden) {
        stop();
        return;
      }
      const now = performance.now();
      const raw = now - last;
      last = now;
      const dt = clamp(raw / 1000, 1 / 240, 0.05);

      if (scope.layout.version !== layoutVersion) measure();

      // integrate the signal: free-running channels roll, ripple energy decays as e^(-2.6t)
      for (let c = 0; c < 4; c++) S.roll[c] += S.speed[c] * dt;
      S.energy *= Math.exp(-dt * 2.6);
      probe.energy *= Math.exp(-dt * 2.6);
      if (S.energy < 1e-4) S.energy = 0;
      if (probe.energy < 1e-4) probe.energy = 0;

      const target = probe.inside && probeAllowed() ? (probe.near >= 0 ? 1 : 0.35) : 0;
      probe.vis += (target - probe.vis) * (1 - Math.exp(-dt / PROBE_FADE));
      if (Math.abs(target - probe.vis) < 0.002) probe.vis = target;

      const f = build(now / 1000, dt, false);
      moved = 0;
      if (f) {
        renderer.frame(f);
        present();
      }
      adapt(raw);

      const busy =
        changed() ||
        S.energy > 1e-3 ||
        probe.energy > 1e-3 ||
        probe.vis !== target ||
        S.speed.some((v) => v !== 0);
      idle = busy ? 0 : idle + 1;
      if (idle >= SETTLE_FRAMES) stop();
    }

    const wake = () => {
      idle = 0;
      if (!renderer || lost || !L || !visible || document.hidden) return;
      if (isStatic()) {
        stop();
        if (!staticRaf) staticRaf = requestAnimationFrame(renderStatic);
        return;
      }
      if (!ticking) {
        last = performance.now();
        ticking = true;
        gsap.ticker.add(tick);
      }
    };

    // -------------------------------------------------------------- inputs that wake the scope
    cleanups.push(onScopeWake(wake));
    cleanups.push(stage.subscribe(wake));

    // probe: the shared pointer, fine pointers only, after the opening (hero coordinates)
    cleanups.push(
      subscribePointer(
        (p) => {
          if (!L || p.type !== "mouse") return;
          const x = p.x - (docLeft - window.scrollX);
          const y = p.y - (docTop - window.scrollY);
          const inside = x >= 0 && y >= 0 && x <= L.width && y <= L.height && probeAllowed();
          if (!inside && !probe.inside) return;
          if (inside) {
            const dx = x - probe.x;
            const dy = y - probe.y;
            if (probe.inside && quality < 2 && Math.abs(dx) < 400) {
              probe.energy = Math.min(1, probe.energy + Math.hypot(dx, dy) * 0.0035);
            }
            probe.x = x;
            probe.y = y;
            let near = -1;
            L.lanes.forEach((ly, k) => {
              if (Math.abs(y - ly) < L!.laneSpacing * 0.5) near = k;
            });
            probe.near = near;
          } else {
            probe.near = -1;
          }
          probe.inside = inside;
          wake();
        },
        () => {
          if (!probe.inside) return;
          probe.inside = false;
          probe.near = -1;
          wake();
        },
      ),
    );

    // scroll: the picture is a function of it. Parked channels roll with distance (not time).
    cleanups.push(
      onScroll((s) => {
        if (!L) return;
        const dy = s.y - lastY;
        lastY = s.y;
        moved += Math.abs(dy);
        if (!prefersReducedMotion()) for (let c = 0; c < 4; c++) amb[c] += dy * SCROLL_ROLL[c];
        if (probe.inside) {
          const y = pointer.y - (docTop - s.y);
          if (y > L.height || y < 0) {
            probe.inside = false;
            probe.near = -1;
          }
        }
        if (visible) wake();
      }),
    );

    // offscreen: render only while some graphite screen (hero included) is in view
    const inView = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) inView.add(e.target);
        else inView.delete(e.target);
      }
      visible = inView.size > 0;
      if (visible) wake();
      else stop();
    });
    io.observe(hero ?? host);
    screenSections(hero).forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    const onVisibility = () => (document.hidden ? stop() : wake());
    document.addEventListener("visibilitychange", onVisibility);
    cleanups.push(() => document.removeEventListener("visibilitychange", onVisibility));

    // size: the hero box, the viewport layer, and the page (sections move when content loads)
    const ro = new ResizeObserver(() => {
      measure();
      wake();
    });
    ro.observe(host);
    ro.observe(layer);
    const main = document.getElementById("main");
    if (main) ro.observe(main);
    cleanups.push(() => ro.disconnect());
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      measure();
      wake();
    });
    cleanups.push(() => {
      alive = false;
    });

    // the reduced-motion toggle and the opening flip between the loop and static frames
    // (html classes also carry Lenis' per-scroll state, so only react when rm/booting flip)
    let flags = "";
    const onFlags = () => {
      const next = `${prefersReducedMotion()}|${root.classList.contains("booting")}`;
      if (next === flags) return;
      flags = next;
      wake();
    };
    onFlags();
    const htmlObserver = new MutationObserver(onFlags);
    htmlObserver.observe(root, { attributes: true, attributeFilter: ["class"] });
    cleanups.push(() => htmlObserver.disconnect());

    // GPU context loss: stop, hand the page back to its own graphite, rebuild on restore
    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      stop();
      canvas.style.visibility = "hidden";
      if (root.dataset.scope === "webgl") delete root.dataset.scope;
    };
    const onRestored = () => {
      try {
        renderer = createScopeRenderer(canvas);
      } catch {
        renderer = null;
      }
      lost = false;
      if (renderer) {
        measure();
        wake();
      }
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    cleanups.push(() => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    });

    measure();
    wake();

    return () => {
      stop();
      if (staticRaf) cancelAnimationFrame(staticRaf);
      cleanups.forEach((fn) => fn());
      const gl = renderer?.gl;
      renderer?.dispose();
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      renderer = null;
      if (root.dataset.scope === "webgl") delete root.dataset.scope;
      layer.remove();
    };
  }, [onFail]);

  // the hero box: the frame the layout cache and the probe are measured in
  return <div ref={hostRef} aria-hidden="true" className="absolute inset-0" />;
}
