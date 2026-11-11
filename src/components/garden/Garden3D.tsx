"use client";

/**
 * THE GARDEN IN 3D (the /garden page, lazy: three.js loads only here). Prajwal's request: "it should
 * look like a forest, like a 3D movie". A sunlit clearing in a forest (pines and broadleaf trees,
 * fog, light shafts through the trees, wildflowers, fireflies and pollen glowing, a warm bloom), a
 * wooden shed with a lit window, a low fence, and in the middle a raised wooden bed: seven furrows
 * (Sunday at the back), one spot per day of the season. A day with contributions is a 3D plant by
 * GitHub's level (a seedling, a young plant, a chili plant, a marigold in flower), the busiest day a
 * tall sunflower, a day without a sown seed. The grass moves in the wind.
 *
 * THE TIME-LAPSE: the season grows week by week while the camera tracks along the bed (a dolly
 * shot), a mist of water falling over the growing week; then the camera glides back to the wide
 * view. ~6s, run by GardenScene's controls (pause, grow it again) and only while on screen; reduced
 * motion: grown and still, rendered once. Hover a plant (or use the arrow keys in GardenScene) for
 * its tag, placed over the plant. GardenScene shows the painted garden under this until it draws,
 * and keeps it if WebGL is not available.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { GardenDay, GardenSeason, GardenStats } from "@/content/garden";
import { dayLabel } from "@/content/garden";

type Props = {
  season: GardenSeason;
  stats: GardenStats;
  /** on screen, in a visible tab, not paused */
  playing: boolean;
  /** the time-lapse is to run (GardenScene's phase) */
  growing: boolean;
  /** bumped by "Grow it again" and by a new season */
  growToken: number;
  /** reduced motion: grown and still */
  still: boolean;
  shown: GardenDay | null;
  onHover: (d: GardenDay | null) => void;
  onGrown: () => void;
  onReady: () => void;
};

/* ---- the bed's grid --------------------------------------------------------------------- */
const SX = 0.42; // between weeks (x)
const SZ = 0.62; // between weekdays (z); Sunday at the back
const WEEKS = 53;
const cell = (c: number, r: number) =>
  new THREE.Vector3((c - (WEEKS - 1) / 2) * SX, 0.26, (r - 3) * SZ);
const BED = { w: WEEKS * SX + 0.7, d: 7 * SZ + 0.5, h: 0.26 };
const START = 0.35;
const STEP = 0.1;
const HEIGHTS: Record<number, number> = {
  0: 0.06,
  1: 0.14,
  2: 0.28,
  3: 0.48,
  4: 0.58,
};
const SUN_H = 1.55;

/* ---- small helpers ---------------------------------------------------------------------- */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
function noise2(x: number, y: number) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
function smoothNoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = noise2(xi, yi);
  const b = noise2(xi + 1, yi);
  const c = noise2(xi, yi + 1);
  const d = noise2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x: number, y: number) =>
  smoothNoise(x, y) * 0.6 +
  smoothNoise(x * 2.1, y * 2.1) * 0.3 +
  smoothNoise(x * 4.3, y * 4.3) * 0.1;

function colorize(g: THREE.BufferGeometry, hex: number, jitter = 0, seed = 1) {
  const r = rng(seed);
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const k = 1 + (r() - 0.5) * jitter;
    arr[i * 3] = c.r * k;
    arr[i * 3 + 1] = c.g * k;
    arr[i * 3 + 2] = c.b * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return g;
}
const strip = (g: THREE.BufferGeometry) => {
  const out = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(out.attributes))
    if (k !== "position" && k !== "normal" && k !== "color")
      out.deleteAttribute(k);
  return out;
};

/** A soft round sprite texture (for the sun's glow, fireflies, the light shafts' falloff). */
function glowTexture(
  inner = "rgba(255,255,255,1)",
  outer = "rgba(255,255,255,0)",
) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, inner);
  gr.addColorStop(1, outer);
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function shaftTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, "rgba(255,240,200,0.0)");
  gr.addColorStop(0.25, "rgba(255,236,190,0.55)");
  gr.addColorStop(1, "rgba(255,236,190,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 256);
  const side = g.createLinearGradient(0, 0, 64, 0);
  side.addColorStop(0, "rgba(0,0,0,1)");
  side.addColorStop(0.5, "rgba(0,0,0,0)");
  side.addColorStop(1, "rgba(0,0,0,1)");
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = side;
  g.fillRect(0, 0, 64, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---- the forest's trees ----------------------------------------------------------------- */
function pineGeometry() {
  const trunk = colorize(
    new THREE.CylinderGeometry(0.12, 0.22, 1.6, 7).translate(0, 0.8, 0),
    0x5b3d26,
    0.15,
    2,
  );
  const tiers = [
    [1.5, 2.4, 2.0],
    [1.15, 2.0, 3.1],
    [0.8, 1.6, 4.0],
    [0.45, 1.1, 4.7],
  ].map(([r, h, y], i) =>
    colorize(
      new THREE.ConeGeometry(r, h, 14, 3).translate(0, y, 0),
      [0x2f5a2c, 0x356530, 0x3c6e33, 0x447a38][i],
      0.18,
      10 + i,
    ),
  );
  return mergeGeometries([trunk, ...tiers].map(strip))!;
}
function broadleafGeometry(seed: number) {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [
    colorize(
      new THREE.CylinderGeometry(0.16, 0.26, 2.4, 7).translate(0, 1.2, 0),
      0x5e4630,
      0.15,
      seed,
    ),
  ];
  for (let k = 0; k < 7; k++) {
    const g = new THREE.IcosahedronGeometry(0.85 + r() * 0.5, 3);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const n = 1 + (fbm(v.x * 2 + k, v.z * 2 + seed) - 0.5) * 0.35;
      v.multiplyScalar(n);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    g.translate((r() - 0.5) * 1.8, 2.6 + r() * 1.6, (r() - 0.5) * 1.8);
    parts.push(
      colorize(
        g,
        [0x3f7a2e, 0x4c8a34, 0x5a9a3a, 0x356a28][k % 4],
        0.2,
        seed + k,
      ),
    );
  }
  return mergeGeometries(parts.map(strip))!;
}

/* ---- the plants ------------------------------------------------------------------------- */
type Mats = {
  leaf: THREE.Material;
  leafDark: THREE.Material;
  stem: THREE.Material;
  chili: THREE.Material;
  marigold: THREE.Material;
  marigoldDeep: THREE.Material;
  petal: THREE.Material;
  seedHead: THREE.Material;
};
const LEAF = new THREE.SphereGeometry(1, 10, 6);
const STEM = new THREE.CylinderGeometry(1, 1, 1, 6);

function leaf(
  m: THREE.Material,
  len: number,
  w: number,
  yaw: number,
  pitch: number,
  y: number,
) {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(LEAF, m);
  mesh.scale.set(len / 2, w * 0.12, w / 2);
  mesh.position.x = len / 2;
  mesh.castShadow = true;
  g.add(mesh);
  g.position.y = y;
  g.rotation.set(0, yaw, pitch);
  return g;
}
function stem(m: THREE.Material, h: number, r = 0.012) {
  const s = new THREE.Mesh(STEM, m);
  s.scale.set(r, h, r);
  s.position.y = h / 2;
  s.castShadow = true;
  return s;
}

function plantFor(d: GardenDay, prize: boolean, mats: Mats): THREE.Group {
  const r = rng(hash(d.date));
  const g = new THREE.Group();
  if (prize) {
    g.add(stem(mats.stem, SUN_H, 0.03));
    for (let k = 0; k < 6; k++)
      g.add(
        leaf(
          mats.leaf,
          0.32 - k * 0.03,
          0.22,
          r() * Math.PI * 2,
          -0.35 + r() * 0.3,
          0.3 + k * 0.2,
        ),
      );
    const head = new THREE.Group();
    head.position.y = SUN_H;
    head.rotation.x = -0.35;
    head.rotation.y = 0.3;
    const disk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.05, 20),
      mats.seedHead,
    );
    disk.rotation.x = Math.PI / 2;
    head.add(disk);
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const p = new THREE.Mesh(LEAF, mats.petal);
      p.scale.set(0.1, 0.012, 0.035);
      p.position.set(Math.cos(a) * 0.23, Math.sin(a) * 0.23, 0.01 * (k % 2));
      p.rotation.z = a;
      head.add(p);
    }
    head.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    g.add(head);
    return g;
  }
  const level = Math.max(1, Math.min(4, d.level || 1));
  if (level === 1) {
    g.add(stem(mats.stem, 0.09));
    g.add(leaf(mats.leaf, 0.07, 0.05, 0, 0.3, 0.09));
    g.add(leaf(mats.leaf, 0.07, 0.05, Math.PI, 0.3, 0.09));
    return g;
  }
  if (level === 2) {
    g.add(stem(mats.stem, 0.24));
    for (let k = 0; k < 6; k++)
      g.add(
        leaf(
          k < 2 ? mats.leafDark : mats.leaf,
          0.12 - k * 0.008,
          0.07,
          k * 2.4 + r(),
          0.25 + r() * 0.3,
          0.05 + k * 0.035,
        ),
      );
    return g;
  }
  // a bushy crown: chili (3) or marigold (4)
  g.add(stem(mats.stem, level === 3 ? 0.36 : 0.44, 0.016));
  const n = level === 3 ? 22 : 26;
  for (let k = 0; k < n; k++)
    g.add(
      leaf(
        k < n / 3 ? mats.leafDark : mats.leaf,
        0.11 + r() * 0.05,
        0.06,
        r() * Math.PI * 2,
        -0.2 + r() * 0.8,
        0.08 + r() * (level === 3 ? 0.3 : 0.36),
      ),
    );
  if (level === 3) {
    for (let k = 0; k < 6; k++) {
      const c = new THREE.Mesh(LEAF, mats.chili);
      c.scale.set(0.016, 0.06, 0.016);
      const a = r() * Math.PI * 2;
      c.position.set(Math.cos(a) * 0.1, 0.2 + r() * 0.12, Math.sin(a) * 0.1);
      c.rotation.z = (r() - 0.5) * 0.6;
      c.castShadow = true;
      g.add(c);
    }
  } else {
    for (let k = 0; k < 5; k++) {
      const fl = new THREE.Group();
      const a = r() * Math.PI * 2;
      fl.position.set(
        Math.cos(a) * 0.12 * (k ? 1 : 0),
        0.44 + r() * 0.12,
        Math.sin(a) * 0.12 * (k ? 1 : 0),
      );
      const outer = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.07, 1),
        mats.marigoldDeep,
      );
      outer.scale.y = 0.75;
      const inner = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.055, 1),
        mats.marigold,
      );
      inner.position.y = 0.018;
      inner.scale.y = 0.8;
      fl.add(outer, inner);
      fl.traverse((o) => ((o as THREE.Mesh).castShadow = true));
      g.add(fl);
    }
  }
  return g;
}

export default function Garden3D({
  season,
  stats,
  playing,
  growing,
  growToken,
  still,
  shown,
  onHover,
  onGrown,
  onReady,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  // the latest props, for the render loop
  const live = useRef({
    playing,
    growing,
    still,
    shown,
    onHover,
    onGrown,
    onReady,
    season,
    stats,
  });
  live.current = {
    playing,
    growing,
    still,
    shown,
    onHover,
    onGrown,
    onReady,
    season,
    stats,
  };
  const api = useRef<{
    plant: (s: GardenSeason, st: GardenStats) => void;
    restart: () => void;
    kick: () => void;
  } | null>(null);

  useEffect(() => {
    const box = host.current;
    if (!box) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }
    // phones get a lighter forest: fewer blades, a smaller shadow map, fewer pixels
    const small = window.innerWidth < 700;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, small ? 1.25 : 1.6),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    box.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const fogColor = new THREE.Color(0xd9e2cf);
    scene.fog = new THREE.Fog(fogColor, 22, 95);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);

    /* sky dome */
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(300, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color(0x3d78d6) },
          mid: { value: new THREE.Color(0x9cc6ef) },
          low: { value: new THREE.Color(0xf6e3bd) },
        },
        vertexShader:
          "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader:
          "uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP; void main(){ float h = vP.y; vec3 c = mix(low, mid, smoothstep(-0.02, 0.18, h)); c = mix(c, top, smoothstep(0.18, 0.75, h)); gl_FragColor = vec4(c, 1.0); }",
      }),
    );
    scene.add(sky);

    /* the sun, its glow, the light */
    const sunDir = new THREE.Vector3(-0.55, 0.42, -0.72).normalize();
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture("rgba(255,250,225,1)", "rgba(255,226,160,0)"),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    glow.position.copy(sunDir).multiplyScalar(220);
    glow.scale.setScalar(110);
    scene.add(glow);
    const sun = new THREE.DirectionalLight(0xffe0b0, 2.6);
    sun.position.copy(sunDir).multiplyScalar(40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 90;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x4a6a2c, 1.1));

    /* the ground: a clearing, rising into wooded hills */
    const groundGeo = new THREE.PlaneGeometry(220, 220, 140, 140).rotateX(
      -Math.PI / 2,
    );
    {
      const pos = groundGeo.attributes.position;
      const col = new Float32Array(pos.count * 3);
      const c1 = new THREE.Color(0x5f8f34);
      const c2 = new THREE.Color(0x86ad48);
      const c3 = new THREE.Color(0x45702a);
      const tmp = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const d = Math.hypot(x * 0.8, z);
        const rise = Math.max(0, d - 20) * 0.08;
        const y =
          (fbm(x * 0.05, z * 0.05) - 0.5) * 1.2 * Math.min(1, d / 18) +
          rise * rise * 0.6;
        pos.setY(i, y);
        const n = fbm(x * 0.3, z * 0.3);
        tmp
          .copy(c1)
          .lerp(c2, n)
          .lerp(c3, Math.min(1, Math.max(0, (d - 14) / 30)));
        col.set([tmp.r, tmp.g, tmp.b], i * 3);
      }
      groundGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      groundGeo.computeVertexNormals();
    }
    const ground = new THREE.Mesh(
      groundGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }),
    );
    ground.receiveShadow = true;
    scene.add(ground);
    const heightAt = (x: number, z: number) => {
      const d = Math.hypot(x * 0.8, z);
      const rise = Math.max(0, d - 20) * 0.08;
      return (
        (fbm(x * 0.05, z * 0.05) - 0.5) * 1.2 * Math.min(1, d / 18) +
        rise * rise * 0.6
      );
    };

    /* the forest */
    const r = rng(7);
    const treeMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
    });
    const leafMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
    });
    const pineGeo = pineGeometry();
    const broadGeo = [
      broadleafGeometry(3),
      broadleafGeometry(11),
      broadleafGeometry(19),
    ];
    const spots: { x: number; z: number; s: number }[] = [];
    for (let k = 0; k < 900 && spots.length < 330; k++) {
      const a = r() * Math.PI * 2;
      const d = 17 + Math.pow(r(), 0.7) * 55;
      const x = Math.cos(a) * d * 1.25;
      const z = Math.sin(a) * d;
      if (z > 6 && Math.abs(x) < 26) continue; // keep the view open toward the camera
      if (spots.some((p) => Math.hypot(p.x - x, p.z - z) < 2.4)) continue;
      spots.push({ x, z, s: 0.85 + r() * 0.9 });
    }
    // a few big trees framing the view at the sides
    spots.push(
      { x: -21, z: 8, s: 1.9 },
      { x: 22, z: 6, s: 2.1 },
      { x: -25, z: 2, s: 1.6 },
    );
    const pines = spots.filter((_, i) => i % 2 === 0);
    const broads = spots.filter((_, i) => i % 2 === 1);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const placeTrees = (
      geo: THREE.BufferGeometry,
      list: typeof spots,
      mat: THREE.Material,
    ) => {
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((p, i) => {
        q.setFromAxisAngle(up, r() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(p.x, heightAt(p.x, p.z) - 0.1, p.z),
          q,
          new THREE.Vector3(p.s, p.s * (0.9 + r() * 0.3), p.s),
        );
        mesh.setMatrixAt(i, m4);
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };
    placeTrees(pineGeo, pines, treeMat);
    broadGeo.forEach((g, k) =>
      placeTrees(
        g,
        broads.filter((_, i) => i % 3 === k),
        leafMat,
      ),
    );

    /* grass: thousands of blades in the wind */
    const time = { value: 0 };
    const bladeGeo = new THREE.PlaneGeometry(0.07, 0.42, 1, 4).translate(
      0,
      0.21,
      0,
    );
    {
      const pos = bladeGeo.attributes.position;
      const col = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const t = pos.getY(i) / 0.42;
        pos.setX(i, pos.getX(i) * (1 - t * 0.92));
        const k = 0.35 + t * 0.85;
        col.set([k, k, k], i * 3);
      }
      bladeGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    }
    const grassMat = new THREE.MeshLambertMaterial({
      side: THREE.DoubleSide,
      vertexColors: true,
    });
    grassMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = time;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvec4 wpG = instanceMatrix * vec4(0.0,0.0,0.0,1.0);\nfloat hG = position.y / 0.42;\ntransformed.x += sin(uTime * 1.7 + wpG.x * 0.6 + wpG.z * 0.4) * 0.09 * hG * hG;\ntransformed.z += cos(uTime * 1.3 + wpG.x * 0.4) * 0.05 * hG * hG;",
        );
    };
    const BLADES = small ? 12000 : 28000;
    const grass = new THREE.InstancedMesh(bladeGeo, grassMat, BLADES);
    const gc = new THREE.Color();
    let gi = 0;
    for (let k = 0; k < BLADES * 3 && gi < BLADES; k++) {
      const x = (r() - 0.5) * 52;
      const z = (r() - 0.5) * 34 - 2;
      if (Math.abs(x) < BED.w / 2 + 0.5 && Math.abs(z) < BED.d / 2 + 0.5)
        continue;
      if (z > 3.4 && z < 5.2 && Math.abs(x) < BED.w / 2) continue; // the path
      q.setFromAxisAngle(up, r() * Math.PI);
      const s = 0.7 + r() * 0.8;
      m4.compose(
        new THREE.Vector3(x, heightAt(x, z), z),
        q,
        new THREE.Vector3(s, s * (0.8 + r() * 0.7), s),
      );
      grass.setMatrixAt(gi, m4);
      grass.setColorAt(
        gi,
        gc.setHSL(0.24 + r() * 0.06, 0.55 + r() * 0.2, 0.28 + r() * 0.18),
      );
      gi++;
    }
    grass.count = gi;
    grass.receiveShadow = true;
    scene.add(grass);

    /* wildflowers in the grass */
    const flowers = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.05, 0),
      new THREE.MeshStandardMaterial({ roughness: 0.6 }),
      700,
    );
    const fcols = [0xffffff, 0xffd84a, 0xc78bff, 0xff8fb3, 0x7fb2ff];
    let fi = 0;
    for (let k = 0; k < 3000 && fi < 700; k++) {
      const x = (r() - 0.5) * 50;
      const z = (r() - 0.5) * 32 - 2;
      if (Math.abs(x) < BED.w / 2 + 0.8 && Math.abs(z) < BED.d / 2 + 0.8)
        continue;
      if (z > 3.4 && z < 5.2 && Math.abs(x) < BED.w / 2) continue;
      m4.compose(
        new THREE.Vector3(x, heightAt(x, z) + 0.3 + r() * 0.15, z),
        q.identity(),
        new THREE.Vector3(1, 0.7, 1),
      );
      flowers.setMatrixAt(fi, m4);
      flowers.setColorAt(fi, gc.setHex(fcols[Math.floor(r() * fcols.length)]));
      fi++;
    }
    flowers.count = fi;
    scene.add(flowers);

    /* the raised bed: a plank frame, soil, seven furrows, a path of stones in front */
    const wood = new THREE.MeshStandardMaterial({
      color: 0x8a5a36,
      roughness: 0.85,
    });
    const woodDark = new THREE.MeshStandardMaterial({
      color: 0x5c3a22,
      roughness: 0.9,
    });
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x4b2e1c,
      roughness: 1,
    });
    const ridgeMat = new THREE.MeshStandardMaterial({
      color: 0x6a4329,
      roughness: 1,
    });
    const bed = new THREE.Group();
    const plank = (w: number, d: number, x: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, BED.h + 0.06, d), wood);
      m.position.set(x, (BED.h + 0.06) / 2, z);
      m.castShadow = m.receiveShadow = true;
      bed.add(m);
    };
    plank(BED.w + 0.2, 0.1, 0, BED.d / 2 + 0.05);
    plank(BED.w + 0.2, 0.1, 0, -BED.d / 2 - 0.05);
    plank(0.1, BED.d, BED.w / 2 + 0.05, 0);
    plank(0.1, BED.d, -BED.w / 2 - 0.05, 0);
    const soil = new THREE.Mesh(
      new THREE.BoxGeometry(BED.w, BED.h, BED.d),
      soilMat,
    );
    soil.position.y = BED.h / 2 - 0.01;
    soil.receiveShadow = true;
    bed.add(soil);
    for (let row = 0; row < 7; row++) {
      const ridge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, BED.w - 0.3, 12),
        ridgeMat,
      );
      ridge.rotation.z = Math.PI / 2;
      ridge.scale.set(1, 1, 0.75);
      ridge.position.set(0, BED.h - 0.06, (row - 3) * SZ);
      ridge.receiveShadow = true;
      bed.add(ridge);
    }
    // corner posts
    for (const [x, z] of [
      [BED.w / 2 + 0.05, BED.d / 2 + 0.05],
      [-BED.w / 2 - 0.05, BED.d / 2 + 0.05],
      [BED.w / 2 + 0.05, -BED.d / 2 - 0.05],
      [-BED.w / 2 - 0.05, -BED.d / 2 - 0.05],
    ]) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, BED.h + 0.18, 0.16),
        woodDark,
      );
      p.position.set(x, (BED.h + 0.18) / 2, z);
      p.castShadow = true;
      bed.add(p);
    }
    scene.add(bed);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xb9b2a4,
      roughness: 0.95,
    });
    const stoneGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.08, 9);
    for (let x = -BED.w / 2 + 0.5; x < BED.w / 2; x += 1.15 + r() * 0.25) {
      const st = new THREE.Mesh(stoneGeo, stoneMat);
      st.position.set(x, heightAt(x, 4.3) + 0.03, 4.3 + (r() - 0.5) * 0.3);
      st.scale.set(1 + r() * 0.3, 1, 0.8 + r() * 0.3);
      st.rotation.y = r() * Math.PI;
      st.receiveShadow = true;
      scene.add(st);
    }

    /* the shed, its lit window; a low fence */
    {
      const shed = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 2.4, 2.6),
        new THREE.MeshStandardMaterial({ color: 0x8c6a48, roughness: 0.9 }),
      );
      body.position.y = 1.2;
      body.castShadow = body.receiveShadow = true;
      shed.add(body);
      const roofShape = new THREE.Shape();
      roofShape.moveTo(-2, 0);
      roofShape.lineTo(2, 0);
      roofShape.lineTo(0, 1.3);
      roofShape.closePath();
      const roof = new THREE.Mesh(
        new THREE.ExtrudeGeometry(roofShape, {
          depth: 3.0,
          bevelEnabled: false,
        }),
        new THREE.MeshStandardMaterial({ color: 0xb85a34, roughness: 0.8 }),
      );
      roof.position.set(0, 2.4, -1.5);
      roof.castShadow = true;
      shed.add(roof);
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1.8, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x5a3e28 }),
      );
      door.position.set(-0.7, 0.9, 1.31);
      shed.add(door);
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.7),
        new THREE.MeshStandardMaterial({
          color: 0xffd28a,
          emissive: 0xffb84d,
          emissiveIntensity: 1.6,
        }),
      );
      win.position.set(0.8, 1.45, 1.31);
      shed.add(win);
      shed.position.set(-15.5, heightAt(-15.5, -4.5), -4.5);
      shed.rotation.y = 0.5;
      scene.add(shed);
      const fenceMat = new THREE.MeshStandardMaterial({
        color: 0x9c7a52,
        roughness: 0.9,
      });
      const fx = BED.w / 2 + 1.6;
      const fz = BED.d / 2 + 1.4;
      for (let x = -fx; x <= fx + 0.01; x += 1.6) {
        for (const z of [-fz]) {
          const p = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.9, 0.1),
            fenceMat,
          );
          p.position.set(x, heightAt(x, z) + 0.45, z);
          p.castShadow = true;
          scene.add(p);
        }
      }
      for (const y of [0.35, 0.7]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(fx * 2, 0.06, 0.05),
          fenceMat,
        );
        rail.position.set(0, y, -fz);
        rail.castShadow = true;
        scene.add(rail);
      }
    }

    /* light shafts through the trees, fireflies and pollen */
    const shaftMat = new THREE.MeshBasicMaterial({
      map: shaftTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.35,
      side: THREE.DoubleSide,
      fog: false,
    });
    for (const [x, z, rot] of [
      [-9, -14, 0.3],
      [-3, -16, 0.25],
      [6, -15, 0.35],
      [13, -12, 0.3],
    ]) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 22), shaftMat);
      s.position.set(x, 9, z);
      s.rotation.set(0, 0, rot);
      scene.add(s);
    }
    const MOTES = 260;
    const moteGeo = new THREE.BufferGeometry();
    const mp = new Float32Array(MOTES * 3);
    const mbase = new Float32Array(MOTES * 4);
    for (let i = 0; i < MOTES; i++) {
      const x = (r() - 0.5) * 34;
      const z = (r() - 0.5) * 20 - 2;
      mbase.set([x, 0.3 + r() * 3.5, z, r() * Math.PI * 2], i * 4);
      mp.set([x, mbase[i * 4 + 1], z], i * 3);
    }
    moteGeo.setAttribute("position", new THREE.BufferAttribute(mp, 3));
    const motes = new THREE.Points(
      moteGeo,
      new THREE.PointsMaterial({
        size: 0.09,
        map: glowTexture("rgba(255,244,200,1)", "rgba(255,230,150,0)"),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: 0xfff2c0,
      }),
    );
    scene.add(motes);

    /* the water mist over the growing week */
    const MIST = 160;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(MIST * 3);
    const mistSeed = new Float32Array(MIST * 3);
    for (let i = 0; i < MIST; i++) mistSeed.set([r() - 0.5, r(), r()], i * 3);
    mistGeo.setAttribute("position", new THREE.BufferAttribute(mistPos, 3));
    const mist = new THREE.Points(
      mistGeo,
      new THREE.PointsMaterial({
        size: 0.06,
        map: glowTexture("rgba(220,240,255,1)", "rgba(200,230,255,0)"),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: 0xd8efff,
      }),
    );
    mist.visible = false;
    scene.add(mist);

    /* the plants of the season */
    const mats: Mats = {
      leaf: new THREE.MeshStandardMaterial({ color: 0x5fa83a, roughness: 0.6 }),
      leafDark: new THREE.MeshStandardMaterial({
        color: 0x3c7d2a,
        roughness: 0.7,
      }),
      stem: new THREE.MeshStandardMaterial({ color: 0x4f8a2e, roughness: 0.7 }),
      chili: new THREE.MeshStandardMaterial({
        color: 0xd8261a,
        roughness: 0.35,
      }),
      marigold: new THREE.MeshStandardMaterial({
        color: 0xffb21c,
        roughness: 0.55,
        emissive: 0x6a3000,
        emissiveIntensity: 0.25,
      }),
      marigoldDeep: new THREE.MeshStandardMaterial({
        color: 0xf07a0a,
        roughness: 0.6,
      }),
      petal: new THREE.MeshStandardMaterial({
        color: 0xffcc22,
        roughness: 0.5,
        emissive: 0x5a3a00,
        emissiveIntensity: 0.25,
      }),
      seedHead: new THREE.MeshStandardMaterial({
        color: 0x4a2a10,
        roughness: 0.9,
      }),
    };
    const garden = new THREE.Group();
    scene.add(garden);
    const seedMesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.03, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0xc9a67c, roughness: 0.9 }),
      400,
    );
    seedMesh.count = 0;
    scene.add(seedMesh);
    let plants: {
      g: THREE.Group;
      d: GardenDay;
      col: number;
      h: number;
      hit: THREE.Mesh;
    }[] = [];
    let weeks = 53;
    let byCell = new Map<string, GardenDay>();
    const hitGeo = new THREE.BoxGeometry(1, 1, 1);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    const plant = (s: GardenSeason, st: GardenStats) => {
      for (const p of plants) garden.remove(p.g, p.hit);
      plants = [];
      byCell = new Map(s.days.map((d) => [`${d.week}:${d.weekday}`, d]));
      weeks = Math.max(1, s.weeks);
      let n = 0;
      for (const d of s.days) {
        const pos = cell(d.week, d.weekday);
        if (d.future) continue;
        if (d.count === 0) {
          if (n < 400) {
            m4.compose(
              pos.clone().setY(BED.h + 0.06),
              q.identity(),
              new THREE.Vector3(1, 0.6, 1),
            );
            seedMesh.setMatrixAt(n++, m4);
          }
          continue;
        }
        const prize = d.count === st.busiest?.count;
        const g = plantFor(d, prize, mats);
        g.position.copy(pos).setY(BED.h + 0.02);
        g.rotation.y = rng(hash(d.date))() * Math.PI * 2;
        const h = prize
          ? SUN_H + 0.3
          : HEIGHTS[Math.max(1, Math.min(4, d.level || 1))];
        const hit = new THREE.Mesh(hitGeo, hitMat);
        hit.scale.set(SX * 0.95, h, SZ * 0.8);
        hit.position.copy(pos).setY(BED.h + h / 2);
        hit.userData.day = d;
        garden.add(g, hit);
        plants.push({ g, d, col: d.week, h, hit });
      }
      seedMesh.count = n;
      seedMesh.instanceMatrix.needsUpdate = true;
    };

    /* the camera: a wide view, and the dolly along the bed */
    // a diagonal down the bed: the recent weeks nearest, the year receding into the forest
    const wide = {
      pos: new THREE.Vector3(16.2, 6.2, 11.6),
      look: new THREE.Vector3(-2.2, 0.2, -1.6),
    };
    // phones: from the bed's recent end, looking along it
    const narrowWide = {
      pos: new THREE.Vector3(18.5, 7.6, 7.6),
      look: new THREE.Vector3(1.5, 0.1, -0.6),
    };
    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();
    let narrow = false;
    const setWide = (k = 1) => {
      const w = narrow ? narrowWide : wide;
      camPos.lerp(w.pos, k);
      camLook.lerp(w.look, k);
    };

    /* post: bloom for the light */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(256, 256),
      0.32,
      0.55,
      0.88,
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const resize = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / h;
      narrow = w / h < 1.1;
      camera.fov = narrow ? 50 : 38;
      camera.updateProjectionMatrix();
      if (!growingNow) {
        setWide(1);
        camera.position.copy(camPos);
        camera.lookAt(camLook);
      }
      renderOnce();
    };

    /* growth */
    let growT = 99;
    let growingNow = false;
    let glideBack = 1;
    const endT = () => START + (weeks - 1) * STEP + 0.6;
    const applyGrowth = () => {
      let grown = 0;
      for (const p of plants) {
        const t = Math.max(
          0,
          Math.min(1, (growT - (START + p.col * STEP)) / 0.55),
        );
        const e = 1 - Math.pow(1 - t, 4);
        p.g.scale.setScalar(Math.max(0.0001, e));
        p.g.visible = t > 0;
        if (t >= 1) grown++;
      }
      // for the checks (docs/handoff/tools/verify-garden.mjs)
      box.dataset.plants = String(plants.length);
      box.dataset.grown = String(grown);
    };

    const tagPos = new THREE.Vector3();
    const placeTag = () => {
      const el = tagRef.current;
      const d = live.current.shown;
      if (!el) return;
      if (!d) {
        el.style.opacity = "0";
        return;
      }
      const p = plants.find((x) => x.d.date === d.date);
      tagPos
        .copy(cell(d.week, d.weekday))
        .setY(BED.h + (p ? p.h * p.g.scale.y : 0.08) + 0.05);
      tagPos.project(camera);
      el.style.left = `${((tagPos.x + 1) / 2) * 100}%`;
      el.style.top = `${((1 - tagPos.y) / 2) * 100}%`;
      el.style.opacity = "1";
      const lines = el.querySelectorAll("p");
      if (lines[0])
        lines[0].textContent = d.future
          ? "Not grown yet"
          : d.count
            ? `${d.count} contribution${d.count === 1 ? "" : "s"}`
            : "Sown, nothing came up";
      if (lines[1]) lines[1].textContent = dayLabel(d.date);
    };

    let raf = 0;
    let last = performance.now();
    let first = true;
    const frame = () => {
      raf = 0;
      const now = performance.now();
      // real time (up to 0.2s a frame), so a slow device still finishes the time-lapse on time
      const dt = Math.min(0.2, (now - last) / 1000);
      last = now;
      const L = live.current;
      const moving = L.playing && !L.still;
      if (moving) {
        time.value += dt;
        // motes drift
        const arr = moteGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < MOTES; i++) {
          const ph = mbase[i * 4 + 3];
          arr[i * 3] = mbase[i * 4] + Math.sin(time.value * 0.4 + ph) * 0.6;
          arr[i * 3 + 1] =
            mbase[i * 4 + 1] + Math.sin(time.value * 0.7 + ph * 2) * 0.35;
          arr[i * 3 + 2] =
            mbase[i * 4 + 2] + Math.cos(time.value * 0.3 + ph) * 0.5;
        }
        moteGeo.attributes.position.needsUpdate = true;
        for (const p of plants)
          p.g.rotation.z = Math.sin(time.value * 1.4 + p.col) * 0.035;
      }
      if (growingNow && moving) {
        growT += dt;
        applyGrowth();
        const front = Math.min(weeks - 1, Math.max(0, (growT - START) / STEP));
        const fx = (front - (WEEKS - 1) / 2) * SX;
        // the dolly: low and close, tracking the growing week
        const target = new THREE.Vector3(fx + 1.2, 2.6, 7.2);
        camPos.lerp(target, 0.06);
        camLook.lerp(new THREE.Vector3(fx - 1.4, 0.35, -0.4), 0.08);
        // water mist falling over the week
        mist.visible = true;
        const ma = mistGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < MIST; i++) {
          const ph = (time.value * 0.9 + mistSeed[i * 3 + 1]) % 1;
          ma[i * 3] = fx + mistSeed[i * 3] * 0.8;
          ma[i * 3 + 1] = 1.6 - ph * 1.4;
          ma[i * 3 + 2] = (mistSeed[i * 3 + 2] - 0.5) * BED.d;
        }
        mistGeo.attributes.position.needsUpdate = true;
        if (growT > endT()) {
          growingNow = false;
          glideBack = 0;
          mist.visible = false;
          L.onGrown();
        }
      } else if (glideBack < 1 && moving) {
        glideBack = Math.min(1, glideBack + dt / 2.2);
        setWide(0.05);
      }
      camera.position.copy(camPos);
      camera.lookAt(camLook);
      composer.render();
      placeTag();
      if (first) {
        first = false;
        L.onReady();
      }
      if (moving) raf = requestAnimationFrame(frame);
    };
    const renderOnce = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      last = performance.now();
      renderOnce();
    };

    const restart = () => {
      const L = live.current;
      if (L.still) {
        growT = 99;
        growingNow = false;
        applyGrowth();
        setWide(1);
        renderOnce();
        return;
      }
      growT = 0;
      growingNow = true;
      glideBack = 1;
      applyGrowth();
      kick();
    };

    api.current = { plant, restart, kick };
    plant(live.current.season, live.current.stats);
    setWide(1);
    growT = live.current.still ? 99 : 0;
    growingNow = false;
    applyGrowth();
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    resize();

    /* hover: a plant, else the spot under the pointer */
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const onMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects(
        plants.map((p) => p.hit),
        false,
      );
      if (hits[0]) {
        live.current.onHover(hits[0].object.userData.day as GardenDay);
      } else {
        const hs = ray.intersectObject(soil, false);
        if (hs[0]) {
          const lp = hs[0].point;
          const c = Math.round(lp.x / SX + (WEEKS - 1) / 2);
          const rr = Math.round(lp.z / SZ + 3);
          live.current.onHover(byCell.get(`${c}:${rr}`) ?? null);
        } else live.current.onHover(null);
      }
      renderOnce();
    };
    const onLeave = () => {
      live.current.onHover(null);
      renderOnce();
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerleave", onLeave);

    return () => {
      api.current = null;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerleave", onLeave);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  // a new season: replant
  useEffect(() => {
    api.current?.plant(season, stats);
    api.current?.restart();
  }, [season, stats]);
  // grow it again / start
  useEffect(() => {
    if (growing) api.current?.restart();
  }, [growToken, growing]);
  // play / pause, the tag
  useEffect(() => {
    api.current?.kick();
  }, [playing, shown, still]);

  return (
    <div className="absolute inset-0">
      <div ref={host} data-qa="garden3d" className="absolute inset-0" />
      <div
        ref={tagRef}
        aria-hidden="true"
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full opacity-0 transition-opacity duration-150"
      >
        <div className="relative rounded-[8px] border border-graphite bg-card px-3 pt-2 pb-1.5 text-center whitespace-nowrap">
          <span className="absolute top-1.5 left-1.5 size-1.5 rounded-full border border-graphite" />
          <p className="type-ui font-semibold" />
          <p className="type-mono text-graphite" />
        </div>
        <span className="mx-auto block h-2 w-px bg-graphite" />
      </div>
    </div>
  );
}
