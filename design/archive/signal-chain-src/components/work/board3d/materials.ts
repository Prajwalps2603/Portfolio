import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { PALETTE } from "@/lib/channels";
import { BOARD_W, CHIP_D, CHIP_H, CHIP_W, COPPER_Y, SLAB, type Frame } from "./frame";
import type { Routed } from "./layout";
import type { AtlasLayout } from "./texture";

/**
 * GPU side of the bench board. Everything that changes at runtime (a chip seating or lighting,
 * a probe on a connection, a what-if) is a uniform: geometry is built once per system.
 */

/** Uniform array sizes are fixed so one shader program serves every system. */
export const MAX_CHIPS = 16;
export const MAX_WIRES = 16;
const BOARD_INDEX = MAX_CHIPS;

const lin = (hex: string) => new THREE.Color(hex);

// ------------------------------------------------------------------ board + chips (one mesh)

export type ChipState = THREE.Vector4; // x lift, y light, z down (a what-if failure), w seated (0..1)

/**
 * The slab and every chip package, merged into one geometry and drawn in one call. Top faces
 * sample the silkscreen texture (the board area, or the chip's atlas cell); sides are shaded
 * from the normal. Per-chip state lives in `uS[i]`.
 */
export function buildBoardGeometry(frame: Frame, routed: Routed, atlas: AtlasLayout): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const prep = (g: THREE.BufferGeometry, idx: number, cx: number, cy: number, cz: number, uvOf: (x: number, z: number) => [number, number]) => {
    const pos = g.getAttribute("position");
    const nrm = g.getAttribute("normal");
    const n = pos.count;
    const uv = new Float32Array(n * 2);
    const top = new Float32Array(n);
    const id = new Float32Array(n);
    const ctr = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      const isTop = nrm.getY(k) > 0.9;
      const [uu, vv] = isTop ? uvOf(pos.getX(k), pos.getZ(k)) : [0, 0];
      uv[k * 2] = uu;
      uv[k * 2 + 1] = vv;
      top[k] = isTop ? 1 : 0;
      id[k] = idx;
      ctr[k * 3] = cx;
      ctr[k * 3 + 1] = cy;
      ctr[k * 3 + 2] = cz;
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g.setAttribute("aTop", new THREE.BufferAttribute(top, 1));
    g.setAttribute("aIdx", new THREE.BufferAttribute(id, 1));
    g.setAttribute("aCenter", new THREE.BufferAttribute(ctr, 3));
    return g;
  };
  const uvBoard = (x: number, z: number): [number, number] => [(x + BOARD_W / 2) / atlas.unitsW, 1 - (z + frame.depth / 2) / atlas.unitsH];
  const slab = new RoundedBoxGeometry(BOARD_W, SLAB, frame.depth, 2, 0.03);
  slab.translate(0, -SLAB / 2, 0);
  parts.push(prep(slab, BOARD_INDEX, 0, -SLAB / 2, 0, uvBoard));
  routed.chips.forEach((c, i) => {
    if (i >= MAX_CHIPS) return;
    const g = new RoundedBoxGeometry(CHIP_W, CHIP_H, CHIP_D, 1, 0.022);
    g.translate(c.x, CHIP_H / 2 + 0.002, c.z);
    const cell = atlas.cells[i];
    parts.push(
      prep(g, i, c.x, CHIP_H / 2, c.z, (x, z) => [
        (cell.x + Math.min(CHIP_W, Math.max(0, x - (c.x - CHIP_W / 2)))) / atlas.unitsW,
        1 - (cell.z + Math.min(CHIP_D, Math.max(0, z - (c.z - CHIP_D / 2)))) / atlas.unitsH,
      ]),
    );
  });
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  if (!merged) throw new Error("board geometry did not merge");
  return merged;
}

export function boardMaterial(map: THREE.Texture, states: ChipState[]): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uS: { value: states },
      uChipSide: { value: lin(PALETTE.bezel).multiplyScalar(0.62) },
      uSlabSide: { value: lin(PALETTE.graphite).multiplyScalar(0.7) },
      uLight: { value: lin(PALETTE.bone) },
    },
    vertexShader: /* glsl */ `
      attribute float aIdx;
      attribute float aTop;
      attribute vec3 aCenter;
      uniform vec4 uS[${MAX_CHIPS + 1}];
      varying vec2 vUv;
      varying float vTop;
      varying float vShade;
      varying float vBoard;
      varying vec4 vState;
      void main() {
        int i = int(aIdx + 0.5);
        vec4 s = uS[i];
        // Seat: grow from the centre and drop from above with the lock ease (driven by s.w).
        vec3 p = aCenter + (position - aCenter) * max(s.w, 0.0001);
        p.y += s.x + (1.0 - s.w) * 0.6;
        vec3 n = normalize(normal);
        vShade = 0.55 + 0.3 * clamp(n.z, 0.0, 1.0) + 0.12 * abs(n.x) + 0.35 * clamp(n.y, 0.0, 1.0);
        vUv = uv;
        vTop = aTop;
        vBoard = step(${BOARD_INDEX}.5, aIdx);
        vState = s;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uChipSide;
      uniform vec3 uSlabSide;
      uniform vec3 uLight;
      varying vec2 vUv;
      varying float vTop;
      varying float vShade;
      varying float vBoard;
      varying vec4 vState;
      void main() {
        vec3 col = vTop > 0.5 ? texture2D(uMap, vUv).rgb : mix(uChipSide, uSlabSide, vBoard) * vShade;
        col *= 1.0 - 0.55 * vState.z;
        col += uLight * vState.y * 0.12 * (0.35 + 0.65 * vTop);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
}

// ------------------------------------------------------------------ copper (one line batch)

export type WireState = THREE.Vector4; // x lit (0..1), y extra dim, z dashed, w drawn length

/**
 * Every connection in one LineSegments2 batch: constant pixel width, round caps, one draw call.
 * A custom per-segment attribute carries (wire index, distance at start, distance at end) so the
 * shader can draw a wire in at constant speed, dash it, light it and widen it from `uWire[i]`.
 */
export function buildCopperGeometry(routed: Routed, colors: string[]): LineSegmentsGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const seg: number[] = [];
  routed.wires.forEach((w, i) => {
    if (i >= MAX_WIRES) return;
    const c = lin(colors[i] ?? PALETTE.bone);
    const { pts, cum } = w.poly;
    for (let k = 1; k < pts.length; k++) {
      pos.push(pts[k - 1][0], COPPER_Y, pts[k - 1][1], pts[k][0], COPPER_Y, pts[k][1]);
      col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      seg.push(i, cum[k - 1], cum[k]);
    }
  });
  if (!pos.length) {
    pos.push(0, -1, 0, 0, -1, 0);
    col.push(0, 0, 0, 0, 0, 0);
    seg.push(0, 0, 0);
  }
  const g = new LineSegmentsGeometry();
  g.setPositions(pos);
  g.setColors(col);
  g.setAttribute("instanceSeg", new THREE.InstancedBufferAttribute(new Float32Array(seg), 3));
  return g;
}

export function copperMaterial(states: WireState[]): LineMaterial {
  const m = new LineMaterial({ linewidth: 1.6, vertexColors: true, worldUnits: false });
  m.uniforms.uWire = { value: states };
  m.uniforms.uBoard = { value: lin(PALETTE.graphite) };
  m.uniforms.uDim = { value: 0.4 };
  m.uniforms.uBoost = { value: 0.62 };
  m.uniforms.uDash = { value: new THREE.Vector2(0.075, 0.06) };
  const decl = /* glsl */ `
    uniform vec4 uWire[${MAX_WIRES}];
    uniform float uBoost;
    attribute vec3 instanceSeg;
    varying vec4 vWire;
    varying float vDist;
  `;
  m.vertexShader = m.vertexShader
    .replace("attribute vec3 instanceColorEnd;", `attribute vec3 instanceColorEnd;\n${decl}`)
    .replace(/void main\(\) \{/, "void main() {\n vWire = uWire[int(instanceSeg.x + 0.5)];\n vDist = (position.y < 0.5) ? instanceSeg.y : instanceSeg.z;")
    .replace("offset *= linewidth;", "offset *= linewidth * (1.0 + uBoost * vWire.x);");
  m.fragmentShader = m.fragmentShader
    .replace(
      "uniform float linewidth;",
      "uniform float linewidth;\nuniform vec3 uBoard;\nuniform float uDim;\nuniform vec2 uDash;\nvarying vec4 vWire;\nvarying float vDist;",
    )
    .replace(
      "float alpha = opacity;",
      "float alpha = opacity;\n if (vDist > vWire.w) discard;\n if (vWire.z > 0.5 && mod(vDist, uDash.x + uDash.y) > uDash.x) discard;",
    )
    .replace(
      "#include <color_fragment>",
      "#include <color_fragment>\n diffuseColor.rgb = mix(uBoard, diffuseColor.rgb, mix(uDim, 1.0, vWire.x) * (1.0 - vWire.y));",
    );
  if (!m.vertexShader.includes("uBoost * vWire.x") || !m.fragmentShader.includes("vWire.w")) throw new Error("copper shader patch failed");
  return m;
}

// ------------------------------------------------------------------ request pulse

export function pulseMaterial(dpr: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uSize: { value: 7 }, uDpr: { value: dpr }, uColor: { value: lin(PALETTE.bone) } },
    vertexShader: /* glsl */ `
      uniform float uSize;
      uniform float uDpr;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * uDpr;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = 1.0 - smoothstep(0.72, 1.0, d);
        if (a <= 0.0) discard;
        gl_FragColor = vec4(uColor, a);
        #include <colorspace_fragment>
      }
    `,
  });
}

// ------------------------------------------------------------------ probe hooks

const LIGHT = new THREE.Vector3(-0.45, 0.85, 0.35).normalize();

/** Bake flat colour and a fixed key light into vertex colours (no lights in the scene). */
function paint(g: THREE.BufferGeometry, hex: string): THREE.BufferGeometry {
  const geo = g.index ? g.toNonIndexed() : g;
  if (geo !== g) g.dispose();
  geo.deleteAttribute("uv");
  const base = lin(hex);
  const nrm = geo.getAttribute("normal");
  const n = nrm.count;
  const colors = new Float32Array(n * 3);
  const v = new THREE.Vector3();
  for (let k = 0; k < n; k++) {
    v.fromBufferAttribute(nrm, k);
    const shade = 0.5 + 0.55 * Math.max(0, v.dot(LIGHT));
    colors[k * 3] = base.r * shade;
    colors[k * 3 + 1] = base.g * shade;
    colors[k * 3 + 2] = base.b * shade;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

/**
 * A scope probe clipped on a trace, in its channel colour: a sprung grabber body with a darker
 * collar, and a tube-curve hook (bone, like a bare tip) that reaches down to the copper. The
 * hook curls in the probe's local z, which the scene turns to face across the trace.
 */
export function buildProbeGeometry(hex: string): THREE.BufferGeometry {
  const dark = "#" + lin(hex).lerp(lin(PALETTE.graphite), 0.55).getHexString();
  const body = new THREE.CylinderGeometry(0.068, 0.078, 0.3, 14, 1);
  body.translate(0, 0.33, 0);
  const cap = new THREE.SphereGeometry(0.068, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  cap.translate(0, 0.48, 0);
  const collar = new THREE.CylinderGeometry(0.088, 0.088, 0.05, 14, 1);
  collar.translate(0, 0.17, 0);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.16, 0),
    new THREE.Vector3(0, 0.08, 0.03),
    new THREE.Vector3(0, 0.03, 0.035),
    new THREE.Vector3(0, COPPER_Y + 0.004, 0),
  ]);
  const hook = new THREE.TubeGeometry(curve, 10, 0.013, 6, false);
  const parts = [paint(body, hex), paint(cap, hex), paint(collar, dark), paint(hook, PALETTE.bone)];
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  if (!merged) throw new Error("probe geometry did not merge");
  return merged;
}
