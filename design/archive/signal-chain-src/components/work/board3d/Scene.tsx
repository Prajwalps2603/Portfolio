"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { gsap } from "@/lib/motion/gsap";
import { EASE, STAGGER } from "@/lib/motion/eases";
import { probeAt, probeRelease } from "@/components/cursor";
import { CHANNELS } from "@/lib/channels";
import { CHIP_D, CHIP_H, CHIP_W, COPPER_Y, TILT } from "./frame";
import { distToPolyline, pointAt, type Hop, type V2 } from "./layout";
import {
  MAX_CHIPS,
  MAX_WIRES,
  boardMaterial,
  buildBoardGeometry,
  buildCopperGeometry,
  buildProbeGeometry,
  copperMaterial,
  pulseMaterial,
} from "./materials";
import { atlasLayout, loadFonts, pageFonts, paintBoard } from "./texture";
import type { BoardModel } from "./model";

extend({ Group: THREE.Group, Mesh: THREE.Mesh, Points: THREE.Points });

/** A pointer event forwarded from the host element (queued until the scene is ready). */
export type ScenePointer = { kind: "move" | "leave" | "click"; x: number; y: number; pointerType: string; t: number };
export type SceneBridge = { handle: ((e: ScenePointer) => void) | null; queue: ScenePointer[] };

export type SceneProps = {
  model: BoardModel;
  /** Connections drawn at full strength (probed, previewed, or on the chosen stage). */
  lit: ReadonlySet<string>;
  /** Connection under each probe, channels 1-4 (pins with any preview applied). */
  probes: (string | null)[];
  ping: number[];
  stage: number;
  reduced: boolean;
  loops: boolean;
  host: HTMLDivElement;
  bridge: SceneBridge;
  tip: HTMLDivElement | null;
  badges: (HTMLElement | null)[];
  chip: string | null;
  onChip: (id: string | null, pinned: boolean) => void;
  onWire: (id: string | null) => void;
  onProbe: (id: string) => void;
  onStatus: (status: "seating" | "seated") => void;
  /** Changes with every lease of the shared canvas: the scene reports its first frame again. */
  frameKey: number;
  onFirstFrame: () => void;
};

const SPEED = 6; // request pulse, board units per second (constant: signals do not ease)
const DRAW = 9; // copper draw-in, units per second
const PULSE_EVERY = 7; // s between ambient request pulses (Signals on only)
const HIT_PX = 8; // pointer tolerance around a trace
const UP = new THREE.Vector3(0, Math.sin(TILT), -Math.cos(TILT));
const DIR = new THREE.Vector3(0, Math.cos(TILT), Math.sin(TILT));

type Pulse = { hops: { w: number; dir: 1 | -1; end: number }[]; i: number; s: number };
type ProbeState = { now: V2; to: V2 | null; lift: number; visible: boolean; wire: string | null };

export function Scene(props: SceneProps) {
  const { model, reduced } = props;
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const setFrameloop = useThree((s) => s.setFrameloop);
  const dpr = useThree((s) => s.viewport.dpr);

  const latest = useRef(props);
  latest.current = props;
  const group = useRef<THREE.Group>(null);
  const probeMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const pulsePoints = useRef<THREE.Points>(null);
  const seated = useRef(false);
  const visible = useRef(true);
  const firstFrame = useRef(-1);
  const tilt = useRef({ x: 0, y: 0 });

  // ------------------------------------------------------------------ GPU resources (per scene)
  const chipStates = useMemo(() => Array.from({ length: MAX_CHIPS + 1 }, (_, i) => new THREE.Vector4(0, 0, 0, i === MAX_CHIPS ? 1 : 0)), []);
  const wireStates = useMemo(() => Array.from({ length: MAX_WIRES }, () => new THREE.Vector4(0, 0, 0, 0)), []);
  const texCanvas = useMemo(() => document.createElement("canvas"), []);
  const texture = useRef<THREE.CanvasTexture | null>(null);
  /**
   * Size the GPU texture was allocated at. The texture's `image` IS `texCanvas`, so its width and
   * height always read the canvas's current size: comparing them can never detect a resize.
   * three.js allocates immutable storage on first upload, so a canvas that changed size must get
   * a new CanvasTexture, or the new paint lands inside the old allocation (the previous system's
   * header shows above a shifted board).
   */
  const textureSize = useRef<[number, number]>([0, 0]);
  const boardMat = useMemo(() => boardMaterial(new THREE.Texture(), chipStates), [chipStates]);
  const copperMat = useMemo(() => copperMaterial(wireStates), [wireStates]);
  const pulseMat = useMemo(() => pulseMaterial(1), []);
  const probeMat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true }), []);
  const probeGeos = useMemo(() => CHANNELS.slice(0, 4).map((c) => buildProbeGeometry(c.hex)), []);
  const pulseGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * 4), 3));
    g.setDrawRange(0, 0);
    return g;
  }, []);
  const copper = useMemo(() => {
    const line = new LineSegments2(undefined, copperMat);
    line.frustumCulled = false;
    line.renderOrder = 2;
    return line;
  }, [copperMat]);

  useEffect(
    () => () => {
      boardMat.dispose();
      copperMat.dispose();
      pulseMat.dispose();
      probeMat.dispose();
      probeGeos.forEach((g) => g.dispose());
      pulseGeo.dispose();
      copper.geometry.dispose();
      texture.current?.dispose();
      texture.current = null;
      textureSize.current = [0, 0];
      probeRelease();
    },
    [boardMat, copperMat, pulseMat, probeMat, probeGeos, pulseGeo, copper],
  );
  useEffect(() => {
    pulseMat.uniforms.uDpr.value = dpr;
  }, [dpr, pulseMat]);

  // ------------------------------------------------------------------ geometry (per system)
  const layout = useMemo(() => atlasLayout(model.frame, model.routed.chips.length), [model.frame, model.routed]);
  const boardGeo = useMemo(() => buildBoardGeometry(model.frame, model.routed, layout), [model.frame, model.routed, layout]);
  useEffect(() => () => boardGeo.dispose(), [boardGeo]);
  useLayoutEffect(() => {
    const old = copper.geometry;
    copper.geometry = buildCopperGeometry(
      model.routed,
      model.wires.map((w) => w.hex),
    );
    old.dispose();
    invalidate();
  }, [copper, model.routed, model.wires, invalidate]);

  // ------------------------------------------------------------------ camera: orthographic 3/4
  const unitsPerPx = Math.max(model.frame.width / size.width, model.frame.height / size.height);
  useLayoutEffect(() => {
    const k = unitsPerPx;
    camera.left = (-size.width * k) / 2;
    camera.right = (size.width * k) / 2;
    camera.top = (size.height * k) / 2;
    camera.bottom = (-size.height * k) / 2;
    const target = UP.clone().multiplyScalar(model.frame.centre);
    camera.position.copy(target).addScaledVector(DIR, 30);
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
    camera.near = 0.1;
    camera.far = 80;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, unitsPerPx, model.frame, invalidate]);

  // ------------------------------------------------------------------ silkscreen texture
  // Painted at screen resolution; repainted when the labels, the scale or the fonts change.
  const cssPerUnit = 1 / unitsPerPx;
  const scaleKey = Math.round(cssPerUnit * dpr * 8) / 8;
  useEffect(() => {
    let alive = true;
    const fonts = pageFonts();
    const paint = () => {
      if (!alive) return;
      paintBoard(
        texCanvas,
        {
          frame: model.frame,
          routed: model.routed,
          chips: model.chips,
          columns: model.columns,
          legend: model.legend,
          cssPerUnit: scaleKey / dpr,
          dpr,
          fonts,
        },
        layout,
      );
      let tex = texture.current;
      const [allocW, allocH] = textureSize.current;
      if (!tex || allocW !== texCanvas.width || allocH !== texCanvas.height) {
        tex?.dispose();
        tex = new THREE.CanvasTexture(texCanvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        texture.current = tex;
        textureSize.current = [texCanvas.width, texCanvas.height];
        boardMat.uniforms.uMap.value = tex;
      }
      tex.needsUpdate = true;
      invalidate();
    };
    const ready = document.fonts?.check?.(`600 12px ${fonts.display}`) && document.fonts.check(`500 11px ${fonts.mono}`);
    paint();
    if (!ready) loadFonts(fonts).then(paint);
    return () => {
      alive = false;
    };
  }, [model, layout, scaleKey, dpr, texCanvas, boardMat, invalidate]);

  // ------------------------------------------------------------------ pulses
  const pulses = useRef<Pulse[]>([]);
  const wireIndex = useMemo(() => new Map(model.wires.map((w, i) => [w.id, i])), [model.wires]);
  const chipIndex = useMemo(() => new Map(model.routed.chips.map((c, i) => [c.id, i])), [model.routed]);
  const flash = (chip: number) => {
    const s = chipStates[chip];
    if (!s) return;
    gsap.fromTo(s, { y: 1 }, { y: latest.current.chip === model.routed.chips[chip]?.id ? 0.55 : 0, duration: 0.55, ease: EASE.probe, overwrite: "auto", onUpdate: invalidate });
  };
  const send = (hops: Hop[]) => {
    if (latest.current.reduced || !hops.length || pulses.current.length >= 3) return;
    const list = hops
      .map((h) => {
        const w = wireIndex.get(h.id);
        if (w === undefined) return null;
        const r = model.routed.wires[w];
        return { w, dir: h.dir, end: chipIndex.get(h.dir > 0 ? r.to : r.from) ?? -1 };
      })
      .filter((h): h is Pulse["hops"][number] => !!h);
    if (!list.length) return;
    pulses.current.push({ hops: list, i: 0, s: 0 });
    invalidate();
  };
  const sendRef = useRef(send);
  sendRef.current = send;

  // ------------------------------------------------------------------ acquisition (per system)
  useLayoutEffect(() => {
    const n = Math.min(model.routed.chips.length, MAX_CHIPS);
    const p = latest.current;
    seated.current = false;
    pulses.current = [];
    probeMeshes.current.forEach((m) => m && (m.visible = false));
    probeState.current.forEach((s) => Object.assign(s, { to: null, visible: false, lift: 0, wire: null }));
    for (let i = 0; i < MAX_CHIPS; i++) chipStates[i].set(0, 0, chipStates[i].z, 0);
    const lengths = model.routed.wires.map((w) => w.poly.len);
    if (p.reduced) {
      for (let i = 0; i < n; i++) chipStates[i].w = 1;
      wireStates.forEach((w) => (w.w = 1e4));
      seated.current = true;
      syncProbes(true);
      p.onStatus("seated");
      invalidate();
      return;
    }
    p.onStatus("seating");
    wireStates.forEach((w) => (w.w = 0));
    const tl = gsap.timeline({ onUpdate: invalidate });
    for (let i = 0; i < n; i++) tl.to(chipStates[i], { w: 1, duration: 0.42, ease: EASE.lock }, 0.1 + i * STAGGER.chips);
    const t0 = 0.1 + n * STAGGER.chips;
    const longest = Math.max(0.1, ...lengths);
    lengths.forEach((len, i) => {
      if (i < MAX_WIRES) tl.fromTo(wireStates[i], { w: 0 }, { w: len, duration: len / DRAW, ease: EASE.none }, t0);
    });
    const t1 = t0 + longest / DRAW;
    tl.call(() => {
      wireStates.forEach((w) => (w.w = 1e4));
      seated.current = true;
      syncProbes(false, true);
    }, [], t1);
    tl.call(() => {
      latest.current.onStatus("seated");
      sendRef.current(model.hops);
    }, [], t1 + 0.6);
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.topo]);

  // ------------------------------------------------------------------ copper state: lit, idle, Σ
  useLayoutEffect(() => {
    model.wires.forEach((w, i) => {
      if (i >= MAX_WIRES) return;
      const s = wireStates[i];
      const lit = props.lit.has(w.id) ? 1 : 0;
      s.y = w.idle ? 0.35 : w.sigma ? 0.3 : 0;
      s.z = w.idle || w.sigma ? 1 : 0;
      if (reduced) s.x = lit;
      else gsap.to(s, { x: lit, duration: 0.2, ease: EASE.panel, overwrite: "auto", onUpdate: invalidate });
    });
    for (let i = model.wires.length; i < MAX_WIRES; i++) wireStates[i].set(0, 0, 0, 0);
    invalidate();
  }, [model.wires, props.lit, reduced, wireStates, invalidate]);

  // A what-if failure darkens the part that stops answering.
  useLayoutEffect(() => {
    model.chips.forEach((c, i) => {
      if (i >= MAX_CHIPS) return;
      const z = c.down ? 0.62 : 0;
      if (reduced) chipStates[i].z = z;
      else gsap.to(chipStates[i], { z, duration: 0.35, ease: EASE.panel, overwrite: "auto", onUpdate: invalidate });
    });
    invalidate();
  }, [model.chips, reduced, chipStates, invalidate]);

  // A new what-if sends a request down the path it now takes.
  const lastKey = useRef(model.key);
  useEffect(() => {
    if (lastKey.current === model.key) return;
    const sameSystem = lastKey.current.split(":")[0] === model.topo;
    lastKey.current = model.key;
    if (sameSystem && seated.current) send(model.hops);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.key]);

  // Choosing a stage of the request path sends a pulse along that stage.
  const lastStage = useRef(props.stage);
  useEffect(() => {
    if (lastStage.current === props.stage) return;
    lastStage.current = props.stage;
    const ids = model.stages[props.stage];
    if (ids && seated.current) send(ids.map((id) => ({ id, dir: 1 as const })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.stage]);

  // Ambient request pulse while the board is on screen and Signals are on.
  useEffect(() => {
    if (!props.loops) return;
    const id = setInterval(() => {
      if (visible.current && seated.current && !document.hidden) sendRef.current(model.hops);
    }, PULSE_EVERY * 1000);
    return () => clearInterval(id);
  }, [props.loops, model.hops]);

  // ------------------------------------------------------------------ probes
  const probeState = useRef<ProbeState[]>(Array.from({ length: 4 }, () => ({ now: [0, 0], to: null, lift: 0, visible: false, wire: null })));
  const orient = (ch: number, wire: string) => {
    const m = probeMeshes.current[ch];
    const w = model.routed.wireById.get(wire);
    if (m && w) m.rotation.y = -Math.atan2(w.clipDir[1], w.clipDir[0]);
  };
  function syncProbes(instant: boolean, drop = false) {
    if (!seated.current) return;
    const p = latest.current;
    p.probes.forEach((id, ch) => {
      const st = probeState.current[ch];
      const m = probeMeshes.current[ch];
      const w = id ? model.routed.wireById.get(id) : undefined;
      if (!m) return;
      if (!w || !id) {
        st.visible = false;
        st.wire = null;
        m.visible = false;
        return;
      }
      const to: V2 = [w.clip[0], w.clip[1]];
      const fresh = !st.visible;
      st.to = to;
      st.visible = true;
      m.visible = true;
      if (st.wire === id && !fresh) return;
      st.wire = id;
      orient(ch, id);
      if (instant || p.reduced) {
        st.now = to;
        st.lift = 0;
        invalidate();
        return;
      }
      if (fresh || drop) {
        // Clip on: drop from above with the lock ease.
        st.now = to;
        gsap.fromTo(st, { lift: 1.1 }, { lift: 0, duration: 0.42, ease: EASE.lock, delay: drop ? ch * STAGGER.chips : 0, overwrite: "auto", onUpdate: invalidate });
        return;
      }
      // Re-seat on another connection in 300 ms, lifting off and back down.
      const from: V2 = [st.now[0], st.now[1]];
      const o = { t: 0 };
      gsap.to(o, {
        t: 1,
        duration: 0.3,
        ease: EASE.probe,
        overwrite: "auto",
        onUpdate: () => {
          st.now = [from[0] + (to[0] - from[0]) * o.t, from[1] + (to[1] - from[1]) * o.t];
          st.lift = Math.sin(Math.PI * Math.min(1, o.t * 1.12)) * 0.3;
          invalidate();
        },
        onComplete: () => {
          st.lift = 0;
          invalidate();
        },
      });
    });
  }
  useLayoutEffect(() => {
    syncProbes(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.probes.join("|"), model.topo]);

  // Probing a connection that is already clipped replays its sweep: the clip twitches in place.
  const lastPing = useRef(props.ping.slice());
  useEffect(() => {
    props.ping.forEach((v, ch) => {
      if (v === lastPing.current[ch]) return;
      const st = probeState.current[ch];
      if (!st?.visible || props.reduced) return;
      gsap.fromTo(st, { lift: 0.18 }, { lift: 0, duration: 0.3, ease: EASE.lock, overwrite: "auto", onUpdate: invalidate });
    });
    lastPing.current = props.ping.slice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.ping.join("|")]);

  // ------------------------------------------------------------------ picking
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const v3 = useMemo(() => new THREE.Vector3(), []);
  const project = (x: number, y: number, z: number): [number, number] => {
    const g = group.current;
    v3.set(x, y, z);
    if (g) v3.applyMatrix4(g.matrixWorld);
    v3.project(camera);
    return [(v3.x * 0.5 + 0.5) * size.width, (-v3.y * 0.5 + 0.5) * size.height];
  };
  const chipRect = (i: number) => {
    const c = model.routed.chips[i];
    const y = CHIP_H + chipStates[i].x;
    const ps = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].map(([sx, sz]) => project(c.x + (sx * CHIP_W) / 2, y, c.z + (sz * CHIP_D) / 2));
    return {
      left: Math.min(...ps.map((q) => q[0])),
      right: Math.max(...ps.map((q) => q[0])),
      top: Math.min(...ps.map((q) => q[1])),
      bottom: Math.max(...ps.map((q) => q[1])),
    };
  };
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const inv = useMemo(() => new THREE.Matrix4(), []);
  const local = useMemo(() => new THREE.Ray(), []);
  const hit3 = useMemo(() => new THREE.Vector3(), []);
  const chipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -CHIP_H), []);
  type Hit = { chip: number } | { wire: number; seg: [number, number][] } | null;
  const pick = (x: number, y: number): Hit => {
    const g = group.current;
    if (!g) return null;
    g.updateMatrixWorld();
    ndc.set((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    local.copy(ray.ray).applyMatrix4(inv.copy(g.matrixWorld).invert());
    if (local.intersectPlane(chipPlane, hit3)) {
      const i = model.routed.chips.findIndex((c) => Math.abs(hit3.x - c.x) <= CHIP_W / 2 && Math.abs(hit3.z - c.z) <= CHIP_D / 2);
      if (i >= 0) return { chip: i };
    }
    let best: Hit = null;
    let bd = HIT_PX;
    for (let i = 0; i < model.routed.wires.length; i++) {
      if (model.wires[i]?.sigma) continue;
      const seg = model.routed.wires[i].poly.pts.map((q) => project(q[0], COPPER_Y, q[1]));
      const d = distToPolyline(seg, x, y);
      if (d < bd) {
        bd = d;
        best = { wire: i, seg };
      }
    }
    return best;
  };

  const hover = useRef<{ chip: number; wire: number; pinned: boolean }>({ chip: -1, wire: -1, pinned: false });
  const setChipLight = (i: number, on: boolean) => {
    const s = chipStates[i];
    if (!s) return;
    if (latest.current.reduced) {
      s.y = on ? 0.55 : 0;
      s.x = 0;
      invalidate();
      return;
    }
    gsap.to(s, { y: on ? 0.55 : 0, x: on ? 0.035 : 0, duration: on ? 0.2 : 0.14, ease: on ? EASE.probe : EASE.exit, overwrite: "auto", onUpdate: invalidate });
  };
  const hoverChip = (i: number, pinned: boolean) => {
    const h = hover.current;
    if (h.chip === i && h.pinned === pinned) return;
    if (h.chip >= 0 && h.chip !== i) setChipLight(h.chip, false);
    if (i >= 0 && h.chip !== i) setChipLight(i, true);
    h.chip = i;
    h.pinned = pinned;
    latest.current.onChip(i >= 0 ? model.routed.chips[i].id : null, pinned);
    invalidate();
  };
  const hoverWire = (i: number) => {
    const h = hover.current;
    if (h.wire === i) return;
    h.wire = i;
    latest.current.onWire(i >= 0 ? model.wires[i].id : null);
  };

  useEffect(() => {
    const host = props.host;
    const handle = (e: ScenePointer) => {
      const p = latest.current;
      const r = host.getBoundingClientRect();
      if (e.kind === "leave") {
        if (!p.reduced) {
          gsap.to(tilt.current, { x: 0, y: 0, duration: 0.6, ease: EASE.probe, overwrite: "auto", onUpdate: invalidate });
        }
        if (!hover.current.pinned) hoverChip(-1, false);
        hoverWire(-1);
        probeRelease();
        return;
      }
      const hit = pick(e.x, e.y);
      if (e.kind === "move") {
        if (e.pointerType === "mouse" && !p.reduced) {
          gsap.to(tilt.current, {
            x: (e.x / size.width) * 2 - 1,
            y: (e.y / size.height) * 2 - 1,
            duration: 0.6,
            ease: EASE.probe,
            overwrite: "auto",
            onUpdate: invalidate,
          });
        }
        if (e.pointerType !== "mouse") return;
        if (hit && "chip" in hit) {
          hoverWire(-1);
          hoverChip(hit.chip, hover.current.pinned && hover.current.chip === hit.chip);
          const cr = chipRect(hit.chip);
          probeAt({ left: r.left + cr.left, right: r.left + cr.right, top: r.top + cr.top, bottom: r.top + cr.bottom }, `Inspect ${p.model.chips[hit.chip]?.refdes ?? ""}`);
        } else if (hit && "wire" in hit) {
          if (!hover.current.pinned) hoverChip(-1, false);
          hoverWire(hit.wire);
          // Brackets on the run nearest the pointer, not around the whole wire.
          const near = nearestRun(hit.seg, e.x, e.y);
          probeAt(
            { left: r.left + near.left - 6, right: r.left + near.right + 6, top: r.top + near.top - 6, bottom: r.top + near.bottom + 6 },
            `Probe ${p.model.wires[hit.wire].conn.label}`,
          );
        } else {
          if (!hover.current.pinned) hoverChip(-1, false);
          hoverWire(-1);
          probeRelease();
        }
        return;
      }
      // click / tap
      if (hit && "wire" in hit) {
        hoverChip(-1, false);
        p.onProbe(p.model.wires[hit.wire].id);
      } else if (hit && "chip" in hit) {
        const again = hover.current.pinned && hover.current.chip === hit.chip;
        hoverChip(again ? -1 : hit.chip, !again);
      } else hoverChip(-1, false);
    };
    props.bridge.handle = handle;
    // Pending selection: picks made before the scene was ready are applied now.
    const queued = props.bridge.queue.splice(0);
    const move = queued.filter((q) => q.kind === "move").pop();
    if (move) handle(move);
    queued.filter((q) => q.kind === "click" && performance.now() - q.t < 2500).forEach(handle);
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && hover.current.pinned) hoverChip(-1, false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      if (props.bridge.handle === handle) props.bridge.handle = null;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.host, props.bridge, model, size.width, size.height, camera]);

  // ------------------------------------------------------------------ pause offscreen / hidden
  useEffect(() => {
    const apply = () => {
      const on = visible.current && !document.hidden;
      setFrameloop(on ? "demand" : "never");
      if (on) invalidate();
    };
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      apply();
    });
    io.observe(props.host);
    document.addEventListener("visibilitychange", apply);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", apply);
    };
  }, [props.host, setFrameloop, invalidate]);

  // ------------------------------------------------------------------ per frame
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const p = latest.current;
    g.rotation.set(p.reduced ? 0 : tilt.current.y * 0.035, p.reduced ? 0 : tilt.current.x * 0.07, 0);
    g.updateMatrixWorld();

    // probes
    probeState.current.forEach((st, ch) => {
      const m = probeMeshes.current[ch];
      if (!m) return;
      m.visible = st.visible;
      m.position.set(st.now[0], st.lift, st.now[1]);
    });

    // request pulses travel the copper at constant speed
    const pts = pulseGeo.getAttribute("position") as THREE.BufferAttribute;
    let live = 0;
    const dt = Math.min(0.05, delta);
    pulses.current = pulses.current.filter((pl) => {
      pl.s += SPEED * dt;
      let hop = pl.hops[pl.i];
      while (hop && pl.s >= model.routed.wires[hop.w].poly.len) {
        pl.s -= model.routed.wires[hop.w].poly.len;
        if (hop.end >= 0) flash(hop.end);
        pl.i += 1;
        hop = pl.hops[pl.i];
      }
      if (!hop || live >= 4) return false;
      const P = model.routed.wires[hop.w].poly;
      const at = pointAt(P, hop.dir > 0 ? pl.s : P.len - pl.s);
      pts.setXYZ(live, at[0], COPPER_Y + 0.02, at[1]);
      live += 1;
      return true;
    });
    pts.needsUpdate = true;
    pulseGeo.setDrawRange(0, live);
    if (live) state.invalidate();

    // DOM overlays, projected after updateMatrixWorld so they stay glued to the board.
    // Read the tooltip's box before writing any transform this frame (no layout thrash).
    const tip = p.tip && p.chip ? p.tip : null;
    const tw = tip ? tip.offsetWidth : 0;
    const th = tip ? tip.offsetHeight : 0;
    p.badges.forEach((b, ch) => {
      if (!b) return;
      const st = probeState.current[ch];
      if (!st.visible) {
        b.style.opacity = "0";
        return;
      }
      const [x, y] = project(st.now[0], 0.62 + st.lift, st.now[1]);
      b.style.opacity = "1";
      b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
    });
    if (tip && p.chip) {
      const i = chipIndex.get(p.chip);
      if (i !== undefined) {
        const cr = chipRect(i);
        const cx = Math.min(Math.max((cr.left + cr.right) / 2, tw / 2 + 4), size.width - tw / 2 - 4);
        const above = cr.top - th - 12 > -48;
        const y = above ? cr.top - th - 10 : cr.bottom + 10;
        tip.style.transform = `translate(${(cx - tw / 2).toFixed(1)}px, ${y.toFixed(1)}px)`;
      }
    }

    if (firstFrame.current !== p.frameKey) {
      firstFrame.current = p.frameKey;
      requestAnimationFrame(() => latest.current.onFirstFrame());
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={boardGeo} material={boardMat} dispose={null} />
      <primitive object={copper} dispose={null} />
      <points ref={pulsePoints} geometry={pulseGeo} material={pulseMat} frustumCulled={false} renderOrder={5} dispose={null} />
      {probeGeos.map((geo, i) => (
        <mesh
          key={CHANNELS[i].key}
          ref={(m: THREE.Mesh | null) => {
            probeMeshes.current[i] = m;
          }}
          geometry={geo}
          material={probeMat}
          visible={false}
          renderOrder={3}
          dispose={null}
        />
      ))}
    </group>
  );
}

/** Screen bbox of the run of a projected polyline that is nearest to (x, y). */
function nearestRun(pts: [number, number][], x: number, y: number) {
  let best = 0;
  let bd = Infinity;
  for (let k = 1; k < pts.length; k++) {
    const d = distToPolyline([pts[k - 1], pts[k]], x, y);
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  const a = pts[Math.max(0, best - 1)];
  const b = pts[best] ?? a;
  return { left: Math.min(a[0], b[0]), right: Math.max(a[0], b[0]), top: Math.min(a[1], b[1]), bottom: Math.max(a[1], b[1]) };
}
