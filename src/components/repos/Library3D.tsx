"use client";

/**
 * THE REPO LIBRARY IN 3D (the /repos page; three.js loads only here). A warm wooden study: a tall
 * bookcase in three bays, a library ladder leaning on it, a window on the left throwing a shaft of
 * light full of drifting dust, a pendant lamp, a desk with a banker's lamp and an open book in the
 * foreground. Each public repository is a book on the middle bay's shelves, bound in its language's
 * colour, its name on the spine, a brass plaque where each language starts, a red ribbon on the ones
 * with a case study; the other shelves hold plain books.
 *
 * THE MOMENT: the camera glides in along the shelves (~3.5s). Hover a book: it slides out and its
 * name shows. Click (or choose it in the card catalogue): it comes off the shelf, turning its front
 * cover to you, and the camera leans in; RepoLibrary shows its details. The dust drifts while the
 * page is on screen and not paused; reduced motion: no glide, no drift, rendered on demand.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { Book } from "./books";

type Props = {
  books: Book[];
  selected: number | null;
  hovered: number | null;
  onHover: (i: number | null) => void;
  onSelect: (i: number | null) => void;
  playing: boolean;
  still: boolean;
  onReady: () => void;
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

const SHELF_Y = [0.1, 0.58, 1.06, 1.54, 2.02];
const BAYS: [number, number][] = [
  [-3.18, -1.13],
  [-1.03, 1.03],
  [1.13, 3.18],
];
const DEPTH = 0.22;
const BOOK_Z = -0.14;

function canvasTexture(
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D) => void,
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const displayFont = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue("--font-display")
    .trim() || "Georgia, serif";

function spineTexture(b: Book) {
  return canvasTexture(96, 512, (g) => {
    g.fillStyle = b.cloth;
    g.fillRect(0, 0, 96, 512);
    // cloth weave and worn edges
    for (let y = 0; y < 512; y += 3) {
      g.fillStyle = `rgba(0,0,0,${0.03 + (y % 9 === 0 ? 0.03 : 0)})`;
      g.fillRect(0, y, 96, 1);
    }
    const edge = g.createLinearGradient(0, 0, 96, 0);
    edge.addColorStop(0, "rgba(0,0,0,0.35)");
    edge.addColorStop(0.18, "rgba(0,0,0,0)");
    edge.addColorStop(0.5, "rgba(255,255,255,0.08)");
    edge.addColorStop(0.82, "rgba(0,0,0,0)");
    edge.addColorStop(1, "rgba(0,0,0,0.35)");
    g.fillStyle = edge;
    g.fillRect(0, 0, 96, 512);
    // gilt bands
    g.fillStyle = "#d8b25a";
    for (const y of [30, 40, 472, 482]) g.fillRect(8, y, 80, 3);
    // the title, top to bottom
    g.save();
    g.translate(48, 256);
    g.rotate(Math.PI / 2);
    g.fillStyle = b.ink;
    let size = 40;
    g.font = `700 ${size}px ${displayFont()}`;
    while (g.measureText(b.title).width > 380 && size > 18) {
      size -= 2;
      g.font = `700 ${size}px ${displayFont()}`;
    }
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(b.title, 0, 2);
    g.restore();
    // the year at the foot
    g.fillStyle = "#d8b25a";
    g.font = `600 18px ${displayFont()}`;
    g.textAlign = "center";
    g.fillText(b.repo.created.slice(0, 4), 48, 462);
  });
}
function coverTexture(b: Book) {
  return canvasTexture(320, 400, (g) => {
    g.fillStyle = b.cloth;
    g.fillRect(0, 0, 320, 400);
    g.strokeStyle = "#d8b25a";
    g.lineWidth = 4;
    g.strokeRect(18, 18, 284, 364);
    g.lineWidth = 1.5;
    g.strokeRect(28, 28, 264, 344);
    g.fillStyle = b.ink;
    g.textAlign = "center";
    let size = 36;
    g.font = `800 ${size}px ${displayFont()}`;
    const words = b.title.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (g.measureText(t).width > 230 && line) {
        lines.push(line);
        line = w;
      } else line = t;
    }
    lines.push(line);
    if (lines.length > 4) size = 28;
    g.font = `800 ${size}px ${displayFont()}`;
    lines.forEach((l, k) =>
      g.fillText(l, 160, 150 + (k - (lines.length - 1) / 2) * (size * 1.15)),
    );
    g.fillStyle = "#d8b25a";
    g.font = `600 18px ${displayFont()}`;
    g.fillText(`${b.language} · ${b.repo.created.slice(0, 4)}`, 160, 340);
  });
}
function woodTexture() {
  return canvasTexture(512, 512, (g) => {
    const r = rng(5);
    for (let k = 0; k < 8; k++) {
      const base = 70 + r() * 25;
      g.fillStyle = `rgb(${base + 20},${base - 10},${base - 40})`;
      g.fillRect(0, k * 64, 512, 64);
      for (let l = 0; l < 26; l++) {
        g.strokeStyle = `rgba(30,15,5,${0.08 + r() * 0.12})`;
        g.beginPath();
        const y = k * 64 + r() * 64;
        g.moveTo(0, y);
        g.bezierCurveTo(
          170,
          y + (r() - 0.5) * 8,
          340,
          y + (r() - 0.5) * 8,
          512,
          y + (r() - 0.5) * 6,
        );
        g.stroke();
      }
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.fillRect(0, k * 64, 512, 2);
      g.fillRect(r() * 512, k * 64, 2, 64);
    }
  });
}
function glowTexture(inner: string, outer: string) {
  return canvasTexture(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, inner);
    gr.addColorStop(1, outer);
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });
}
function shaftTexture() {
  return canvasTexture(64, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "rgba(255,232,180,0.7)");
    gr.addColorStop(1, "rgba(255,232,180,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 256);
    g.globalCompositeOperation = "destination-out";
    const side = g.createLinearGradient(0, 0, 64, 0);
    side.addColorStop(0, "rgba(0,0,0,1)");
    side.addColorStop(0.5, "rgba(0,0,0,0)");
    side.addColorStop(1, "rgba(0,0,0,1)");
    g.fillStyle = side;
    g.fillRect(0, 0, 64, 256);
  });
}
function plaqueTexture(text: string) {
  return canvasTexture(256, 64, (g) => {
    g.fillStyle = "#b8923f";
    g.fillRect(0, 0, 256, 64);
    g.strokeStyle = "#6e5420";
    g.lineWidth = 4;
    g.strokeRect(4, 4, 248, 56);
    g.fillStyle = "#3a2a10";
    g.font = `700 30px ${displayFont()}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 128, 34);
  });
}

export default function Library3D({
  books,
  selected,
  hovered,
  onHover,
  onSelect,
  playing,
  still,
  onReady,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const live = useRef({
    selected,
    hovered,
    playing,
    still,
    onHover,
    onSelect,
    onReady,
  });
  live.current = {
    selected,
    hovered,
    playing,
    still,
    onHover,
    onSelect,
    onReady,
  };
  const kickRef = useRef<() => void>(() => {});

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
    const small = window.innerWidth < 700;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, small ? 1.3 : 1.7),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    Object.assign(renderer.domElement.style, {
      display: "block",
      width: "100%",
      height: "100%",
    });
    box.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a120c);
    scene.fog = new THREE.Fog(0x241810, 7, 18);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 60);

    /* light: the window (left), the pendant, a warm fill */
    scene.add(new THREE.HemisphereLight(0xffe6c4, 0x2a1a10, 0.8));
    const win = new THREE.DirectionalLight(0xfff0d0, 2.4);
    win.position.set(-6, 5, 3);
    win.castShadow = true;
    win.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    Object.assign(win.shadow.camera, {
      left: -5,
      right: 5,
      top: 4,
      bottom: -2,
      near: 1,
      far: 20,
    });
    win.shadow.bias = -0.0005;
    win.shadow.normalBias = 0.02;
    scene.add(win);
    const pendant = new THREE.PointLight(0xffb866, 14, 8, 2);
    pendant.position.set(0.9, 2.55, 1.5);
    scene.add(pendant);

    /* the room: floor, walls, the window */
    const wood = woodTexture();
    wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
    wood.repeat.set(3, 3);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 10),
      new THREE.MeshStandardMaterial({
        map: wood,
        roughness: 0.6,
        color: 0xb08860,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x3f3226,
      roughness: 0.95,
    });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), wallMat);
    back.position.set(0, 2.5, -0.4);
    back.receiveShadow = true;
    scene.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), wallMat);
    left.position.set(-4.2, 2.5, 3);
    left.rotation.y = Math.PI / 2;
    scene.add(left);
    const pane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.9),
      new THREE.MeshBasicMaterial({ color: 0xfff4dc }),
    );
    pane.position.set(-4.18, 2.0, 1.6);
    pane.rotation.y = Math.PI / 2;
    scene.add(pane);
    const mull = new THREE.MeshStandardMaterial({ color: 0x2a1c12 });
    for (const [w, h, y, z] of [
      [0.06, 1.9, 2.0, 1.6],
      [1.6, 0.06, 2.0, 1.6],
    ]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, h, w), mull);
      m.position.set(-4.16, y, z);
      scene.add(m);
    }

    /* the bookcase */
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x6b4126,
      roughness: 0.7,
      map: wood,
    });
    const caseDark = new THREE.MeshStandardMaterial({
      color: 0x2e1a0e,
      roughness: 0.9,
    });
    const add = (
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
      cast = true,
    ) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = cast;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    };
    add(new THREE.BoxGeometry(6.6, 2.6, 0.04), caseDark, 0, 1.3, -0.34, false);
    for (const x of [-3.28, -1.08, 1.08, 3.28])
      add(new THREE.BoxGeometry(0.08, 2.62, 0.36), caseMat, x, 1.31, -0.17);
    for (const y of [...SHELF_Y, 2.5])
      add(new THREE.BoxGeometry(6.6, 0.04, 0.36), caseMat, 0, y - 0.02, -0.17);
    add(new THREE.BoxGeometry(6.8, 0.16, 0.42), caseMat, 0, 2.66, -0.16);
    add(new THREE.BoxGeometry(6.7, 0.1, 0.4), caseDark, 0, 0.05, -0.15);

    /* the books: the repos on the middle bay, plain books elsewhere */
    const paper = new THREE.MeshStandardMaterial({
      color: 0xefe3c8,
      roughness: 0.9,
    });
    const bookMeshes: {
      mesh: THREE.Group;
      b: Book;
      home: THREE.Vector3;
      out: number;
      turn: number;
    }[] = [];
    const rowsFor = [SHELF_Y[2], SHELF_Y[3], SHELF_Y[1], SHELF_Y[4]];
    let row = 0;
    let x = BAYS[1][0] + 0.04;
    let lastLang = "";
    const plaques: THREE.Mesh[] = [];
    for (const b of books) {
      if (b.language !== lastLang) {
        if (lastLang) x += 0.07;
        lastLang = b.language;
      }
      if (x + b.thickness > BAYS[1][1] - 0.04) {
        row++;
        x = BAYS[1][0] + 0.04;
      }
      const y0 = rowsFor[Math.min(row, rowsFor.length - 1)];
      if (
        !plaques.length ||
        plaques[plaques.length - 1].userData.lang !== b.language ||
        plaques[plaques.length - 1].userData.row !== row
      ) {
        const pl = new THREE.Mesh(
          new THREE.PlaneGeometry(0.2, 0.05),
          new THREE.MeshStandardMaterial({
            map: plaqueTexture(b.language),
            roughness: 0.4,
            metalness: 0.5,
          }),
        );
        pl.position.set(x + 0.1, y0 - 0.02, 0.012);
        pl.userData = { lang: b.language, row };
        scene.add(pl);
        plaques.push(pl);
      }
      const cloth = new THREE.MeshStandardMaterial({
        color: b.clothDark,
        roughness: 0.85,
      });
      const mats = [
        new THREE.MeshStandardMaterial({
          map: coverTexture(b),
          roughness: 0.8,
        }), // +x: the front cover
        cloth, // -x
        paper, // +y
        paper, // -y
        new THREE.MeshStandardMaterial({
          map: spineTexture(b),
          roughness: 0.75,
        }), // +z: the spine
        paper, // -z
      ];
      const g = new THREE.Group();
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(b.thickness, b.height, DEPTH),
        mats,
      );
      m.castShadow = m.receiveShadow = true;
      m.userData.i = b.i;
      g.add(m);
      if (b.caseStudy) {
        // the case-study ribbon, sticking out of the top of the pages
        const ribbon = new THREE.Mesh(
          new THREE.BoxGeometry(0.012, 0.05, 0.004),
          new THREE.MeshStandardMaterial({ color: 0xc0262d, roughness: 0.5 }),
        );
        ribbon.position.set(
          b.thickness * 0.15,
          b.height / 2 + 0.022,
          DEPTH / 2 - 0.03,
        );
        ribbon.rotation.z = 0.12;
        g.add(ribbon);
      }
      const home = new THREE.Vector3(
        x + b.thickness / 2,
        y0 + b.height / 2,
        BOOK_Z,
      );
      g.position.copy(home);
      scene.add(g);
      bookMeshes.push({ mesh: g, b, home, out: 0, turn: 0 });
      x += b.thickness + 0.004;
    }
    // plain books everywhere else (some leaning, some lying in stacks)
    {
      const r = rng(9);
      const plainGeo = new THREE.BoxGeometry(1, 1, 1);
      const plainMat = new THREE.MeshStandardMaterial({ roughness: 0.85 });
      const cols = [
        0x5a1f1c, 0x1f2f4a, 0x3d4a24, 0x4a3524, 0x2b2b2b, 0x6b4a2a, 0x2d3b3a,
        0x5b4a3a,
      ];
      const plain = new THREE.InstancedMesh(plainGeo, plainMat, 900);
      const mx = new THREE.Matrix4();
      const qq = new THREE.Quaternion();
      const col = new THREE.Color();
      let n = 0;
      SHELF_Y.forEach((y, si) => {
        BAYS.forEach(([a, b], bi) => {
          const used = bi === 1 ? rowsFor.slice(0, row + 1).includes(y) : false;
          let xx = a + 0.03;
          const stop = used ? (rowsFor.indexOf(y) === row ? x + 0.12 : b) : a;
          if (used && rowsFor.indexOf(y) === row) xx = x + 0.12;
          else if (used) return;
          void stop;
          while (xx < b - 0.05 && n < 900) {
            if (r() < 0.08) {
              // a stack lying flat
              const w = 0.18 + r() * 0.08;
              let yy = y;
              for (let k = 0; k < 2 + Math.floor(r() * 4); k++) {
                const t = 0.03 + r() * 0.03;
                mx.compose(
                  new THREE.Vector3(xx + w / 2, yy + t / 2, BOOK_Z),
                  qq.setFromAxisAngle(
                    new THREE.Vector3(0, 1, 0),
                    (r() - 0.5) * 0.2,
                  ),
                  new THREE.Vector3(w, t, DEPTH * (0.9 + r() * 0.1)),
                );
                plain.setMatrixAt(n, mx);
                plain.setColorAt(
                  n++,
                  col.setHex(cols[Math.floor(r() * cols.length)]),
                );
                yy += t;
              }
              xx += w + 0.02;
              continue;
            }
            if (r() < 0.05) {
              xx += 0.1 + r() * 0.12; // a gap
              continue;
            }
            const t = 0.025 + r() * 0.045;
            const h = 0.2 + r() * 0.12 + (si === 0 ? 0.08 : 0);
            const lean = r() < 0.06 ? 0.18 : 0;
            mx.compose(
              new THREE.Vector3(xx + t / 2 + lean * h * 0.5, y + h / 2, BOOK_Z),
              qq.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -lean),
              new THREE.Vector3(t, h, DEPTH * (0.85 + r() * 0.15)),
            );
            plain.setMatrixAt(n, mx);
            plain.setColorAt(
              n++,
              col
                .setHex(cols[Math.floor(r() * cols.length)])
                .multiplyScalar(0.8 + r() * 0.4),
            );
            xx += t + 0.003 + lean * h * 0.6;
          }
        });
      });
      plain.count = n;
      plain.castShadow = plain.receiveShadow = true;
      scene.add(plain);
    }

    /* the ladder, the pendant lamp, the desk in front */
    {
      const lm = new THREE.MeshStandardMaterial({
        color: 0x7a4c2c,
        roughness: 0.6,
      });
      const ladder = new THREE.Group();
      for (const dx of [-0.22, 0.22]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.9, 0.05), lm);
        rail.position.set(dx, 1.45, 0);
        rail.castShadow = true;
        ladder.add(rail);
      }
      for (let k = 0; k < 9; k++) {
        const rung = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.44, 8),
          lm,
        );
        rung.rotation.z = Math.PI / 2;
        rung.position.set(0, 0.25 + k * 0.3, 0);
        rung.castShadow = true;
        ladder.add(rung);
      }
      ladder.position.set(2.15, 0, 0.5);
      ladder.rotation.x = -0.17;
      scene.add(ladder);

      const cord = add(
        new THREE.CylinderGeometry(0.006, 0.006, 1.2, 6),
        new THREE.MeshStandardMaterial({ color: 0x111111 }),
        0.9,
        3.2,
        1.5,
        false,
      );
      void cord;
      const shade = add(
        new THREE.ConeGeometry(0.22, 0.2, 20, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0x1f3a2a,
          side: THREE.DoubleSide,
          roughness: 0.4,
          metalness: 0.4,
        }),
        0.9,
        2.62,
        1.5,
        false,
      );
      void shade;
      add(
        new THREE.SphereGeometry(0.06, 16, 10),
        new THREE.MeshStandardMaterial({
          color: 0xffe2a8,
          emissive: 0xffc070,
          emissiveIntensity: 4,
        }),
        0.9,
        2.53,
        1.5,
        false,
      );

      const deskMat = new THREE.MeshStandardMaterial({
        color: 0x8a5a36,
        roughness: 0.45,
        map: wood,
      });
      add(new THREE.BoxGeometry(2.2, 0.06, 0.8), deskMat, -0.95, 0.78, 2.15);
      const lampBase = add(
        new THREE.CylinderGeometry(0.08, 0.1, 0.03, 16),
        new THREE.MeshStandardMaterial({
          color: 0xb8923f,
          metalness: 0.7,
          roughness: 0.3,
        }),
        -1.65,
        0.825,
        2.05,
      );
      void lampBase;
      add(
        new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8),
        new THREE.MeshStandardMaterial({
          color: 0xb8923f,
          metalness: 0.7,
          roughness: 0.3,
        }),
        -1.65,
        0.99,
        2.05,
      );
      const greenShade = add(
        new THREE.CylinderGeometry(0.06, 0.16, 0.12, 20, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0x1e6b3a,
          emissive: 0x0e3a1c,
          emissiveIntensity: 0.6,
          side: THREE.DoubleSide,
          roughness: 0.3,
        }),
        -1.65,
        1.16,
        2.05,
        false,
      );
      greenShade.rotation.x = 0.2;
      add(
        new THREE.SphereGeometry(0.035, 12, 8),
        new THREE.MeshStandardMaterial({
          color: 0xfff0c8,
          emissive: 0xffd28a,
          emissiveIntensity: 3,
        }),
        -1.65,
        1.11,
        2.07,
        false,
      );
      const deskLight = new THREE.PointLight(0xffd08a, 1.1, 2.2, 2);
      deskLight.position.set(-1.65, 1.05, 2.07);
      scene.add(deskLight);
      // an open book on the desk
      const pageMat = new THREE.MeshStandardMaterial({
        color: 0xd9ccb0,
        roughness: 0.95,
      });
      for (const s of [-1, 1]) {
        const p = add(
          new THREE.BoxGeometry(0.24, 0.012, 0.32),
          pageMat,
          -0.75 + s * 0.12,
          0.82,
          2.1,
        );
        p.rotation.z = s * 0.08;
      }
    }

    /* the light shaft from the window, the dust in it */
    const shaft = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 6),
      new THREE.MeshBasicMaterial({
        map: shaftTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.32,
        side: THREE.DoubleSide,
      }),
    );
    shaft.position.set(-2.6, 1.5, 1.4);
    shaft.rotation.set(0, Math.PI / 2.6, 0.75);
    scene.add(shaft);
    const DUST = 220;
    const dustGeo = new THREE.BufferGeometry();
    const dp = new Float32Array(DUST * 3);
    const dseed = new Float32Array(DUST * 4);
    const dr = rng(21);
    for (let k = 0; k < DUST; k++) {
      dseed.set(
        [
          -3.4 + dr() * 3.2,
          0.3 + dr() * 2.4,
          0.4 + dr() * 2.2,
          dr() * Math.PI * 2,
        ],
        k * 4,
      );
      dp.set([dseed[k * 4], dseed[k * 4 + 1], dseed[k * 4 + 2]], k * 3);
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: 0.018,
        map: glowTexture("rgba(255,240,210,1)", "rgba(255,230,190,0)"),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(dust);

    /* post: bloom on the lamps and the window */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(
      new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.6, 0.82),
    );
    composer.addPass(new OutputPass());

    /* the camera */
    const rest = {
      pos: new THREE.Vector3(-0.3, 1.5, 3.9),
      look: new THREE.Vector3(0.1, 1.18, -0.1),
    };
    const camPos = new THREE.Vector3(-2.3, 1.8, 2.4);
    const camLook = new THREE.Vector3(-2.3, 1.35, -0.1);
    let narrow = false;
    let intro = live.current.still ? 1 : 0;
    if (intro >= 1) {
      camPos.copy(rest.pos);
      camLook.copy(rest.look);
    }
    const resize = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / h;
      narrow = w / h < 1.1;
      camera.fov = narrow ? 56 : 40;
      rest.pos.set(narrow ? 0 : -0.3, 1.5, narrow ? 4.2 : 3.9);
      camera.updateProjectionMatrix();
      kick();
    };

    /* hover and click */
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pick = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(
        bookMeshes.map((b) => b.mesh.children[0]),
        false,
      )[0];
      return hit ? (hit.object.userData.i as number) : null;
    };
    const onMove = (e: PointerEvent) => {
      const i = pick(e);
      renderer.domElement.style.cursor = i === null ? "" : "pointer";
      if (i !== live.current.hovered) live.current.onHover(i);
      kick();
    };
    const onLeave = () => {
      live.current.onHover(null);
      kick();
    };
    const onClick = (e: PointerEvent) => {
      const i = pick(e);
      live.current.onSelect(
        i === null ? null : i === live.current.selected ? null : i,
      );
      kick();
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerleave", onLeave);
    renderer.domElement.addEventListener("click", onClick);

    /* the loop */
    const tmp = new THREE.Vector3();
    let raf = 0;
    let last = performance.now();
    let t = 0;
    let first = true;
    const frame = () => {
      raf = 0;
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const L = live.current;
      const moving = L.playing && !L.still;
      let busy = false;
      if (moving) {
        t += dt;
        const arr = dustGeo.attributes.position.array as Float32Array;
        for (let k = 0; k < DUST; k++) {
          const ph = dseed[k * 4 + 3];
          arr[k * 3] = dseed[k * 4] + Math.sin(t * 0.25 + ph) * 0.12;
          arr[k * 3 + 1] =
            dseed[k * 4 + 1] + Math.sin(t * 0.18 + ph * 2) * 0.15;
          arr[k * 3 + 2] = dseed[k * 4 + 2] + Math.cos(t * 0.2 + ph) * 0.1;
        }
        dustGeo.attributes.position.needsUpdate = true;
      }
      // the glide in
      if (intro < 1) {
        if (moving || L.still)
          intro = L.still ? 1 : Math.min(1, intro + dt / 3.6);
        busy = intro < 1;
      }
      const e = 1 - Math.pow(1 - intro, 3);
      // the books: out a little when hovered, off the shelf and turned when chosen
      for (const bm of bookMeshes) {
        const sel = L.selected === bm.b.i;
        const hov = L.hovered === bm.b.i;
        const outTo = sel ? 0.34 : hov ? 0.06 : 0;
        const turnTo = sel ? -Math.PI / 2 + 0.25 : 0;
        const k = L.still ? 1 : Math.min(1, dt * 7);
        bm.out += (outTo - bm.out) * k;
        bm.turn += (turnTo - bm.turn) * k;
        if (
          Math.abs(outTo - bm.out) > 0.001 ||
          Math.abs(turnTo - bm.turn) > 0.002
        )
          busy = true;
        bm.mesh.position.set(
          bm.home.x,
          bm.home.y + (sel ? bm.out * 0.25 : 0),
          bm.home.z + bm.out,
        );
        bm.mesh.rotation.y = bm.turn;
      }
      // the camera: the glide, or leaning in toward the chosen book
      const chosen = bookMeshes.find((b) => b.b.i === L.selected);
      const wantPos = tmp.copy(rest.pos);
      const wantLook = new THREE.Vector3().copy(rest.look);
      if (chosen) {
        wantPos.set(
          chosen.home.x * 0.7,
          chosen.home.y + 0.12,
          narrow ? 2.2 : 1.7,
        );
        wantLook.set(chosen.home.x, chosen.home.y, chosen.home.z + 0.3);
      }
      if (intro < 1 && !chosen) {
        camPos.set(
          -2.3 + 2.3 * e,
          1.8 - (1.8 - rest.pos.y) * e,
          2.4 + (rest.pos.z - 2.4) * e,
        );
        camLook.set(-2.3 + 2.3 * e, 1.35 - 0.1 * e, -0.1);
      } else {
        const k = L.still ? 1 : Math.min(1, dt * 3.2);
        camPos.lerp(wantPos, k);
        camLook.lerp(wantLook, k);
        if (camPos.distanceTo(wantPos) > 0.002) busy = true;
      }
      camera.position.copy(camPos);
      camera.lookAt(camLook);
      composer.render();
      // the hovered book's name
      const tag = tagRef.current;
      const hb = bookMeshes.find(
        (b) => b.b.i === L.hovered && L.hovered !== L.selected,
      );
      if (tag) {
        if (hb) {
          tmp
            .set(
              hb.mesh.position.x,
              hb.mesh.position.y + hb.b.height / 2 + 0.02,
              hb.mesh.position.z + DEPTH / 2,
            )
            .project(camera);
          tag.style.left = `${((tmp.x + 1) / 2) * 100}%`;
          tag.style.top = `${((1 - tmp.y) / 2) * 100}%`;
          tag.style.opacity = "1";
          const p = tag.querySelector("p");
          if (p) p.textContent = hb.b.title;
        } else tag.style.opacity = "0";
      }
      if (first) {
        first = false;
        L.onReady();
      }
      if (moving || busy) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    kickRef.current = kick;
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    resize();
    // the spines' font may arrive late: repaint them once it has
    document.fonts?.ready.then(() => {
      for (const bm of bookMeshes) {
        const m = bm.mesh.children[0] as THREE.Mesh;
        const mats = m.material as THREE.MeshStandardMaterial[];
        mats[0].map?.dispose();
        mats[4].map?.dispose();
        mats[0].map = coverTexture(bm.b);
        mats[4].map = spineTexture(bm.b);
        mats[0].needsUpdate = mats[4].needsUpdate = true;
      }
      kick();
    });

    return () => {
      kickRef.current = () => {};
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerleave", onLeave);
      renderer.domElement.removeEventListener("click", onClick);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        const all = Array.isArray(mat) ? mat : mat ? [mat] : [];
        for (const x of all) {
          (x as THREE.MeshStandardMaterial).map?.dispose();
          x.dispose();
        }
      });
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [books]);

  useEffect(() => {
    kickRef.current();
  }, [selected, hovered, playing, still]);

  return (
    <div className="absolute inset-0">
      <div ref={host} data-qa="library3d" className="absolute inset-0" />
      <div
        ref={tagRef}
        aria-hidden="true"
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full opacity-0 transition-opacity duration-150"
      >
        <div className="rounded-[8px] border border-graphite bg-card px-3 py-1.5 whitespace-nowrap">
          <p className="type-ui font-semibold" />
        </div>
        <span className="mx-auto block h-2 w-px bg-graphite" />
      </div>
    </div>
  );
}
