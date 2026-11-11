/**
 * THE ROAD TRIP (pure geometry: no React, no DOM), for "The road so far". A side-on journey in a
 * fixed 480 x 300 window over a 1920-wide world, drawn in parallax layers that the camera pans:
 * FAR (x0.18: the Malnad ranges, the Ghats' peak, the city's far skyline, clouds), MID (x0.45: the
 * green hills, the waterfall and the hairpin road down the Ghats, mist, the city's middle towers),
 * NEAR (x1: the road with its kerb stones, and along it Koppa's shelter, milestone, school, areca
 * palms and a tiled house; the Ghats' warning board, the painted parapet with monkeys on it, the
 * jungle trees; Sullia's coconut palms and the college; the highway's pylons; Bengaluru's shops,
 * metro viaduct and train, autos, streetlights and the office tower), FRONT (x1.3: grass tufts).
 * LIGHTS are drawn over the night: lit windows, streetlamps, the moon and the stars. And the bus: a
 * side-on Karnataka bus with luggage on the roof, origin at its rear wheel line.
 */
import type { Point } from "@/components/sketch/rough";

export const W = 480;
export const H = 300;
export const WORLD = 1920;
export const PAR = { far: 0.18, mid: 0.45, near: 1, front: 1.3 } as const;
/** The road: its far kerb, its surface, the line the wheels run on. */
export const ROAD = { kerb: 246, top: 251, bottom: 284, wheels: 276 } as const;
/** Where the bus stands (its rear x) at Koppa, Sullia and Bengaluru. */
export const STOP_X = [64, 1110, 1740] as const;
export const BUS_LEN = 150;
export const WHEEL_R = 11;
export const WHEELS = [30, 120] as const;

/** The camera's left edge for the bus at `x` (it keeps the bus a little left of centre). */
export const camAt = (x: number) => Math.max(0, Math.min(WORLD - W, x + BUS_LEN / 2 - W * 0.42));

const f = (n: number) => Math.round(n * 10) / 10;
const pt = (p: Point) => `${f(p[0])} ${f(p[1])}`;
const rect = (x: number, y: number, w: number, h: number) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
const circle = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
const poly = (pts: Point[]) => `M${pts.map(pt).join("L")}Z`;

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

/** A smooth line through the points (Catmull-Rom as cubic Béziers). */
function smooth(points: Point[], tension = 0.55): string {
  let d = `M${pt(points[0])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1: Point = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2: Point = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}
/** A filled ridge: the smooth top line, closed down to `base`. */
const ridge = (points: Point[], base: number) => `${smooth(points)}L${f(points[points.length - 1][0])} ${base}L${f(points[0][0])} ${base}Z`;

/** A cloud: three puffs on a flat base. */
const cloud = (x: number, y: number, s: number) => circle(x, y, 9 * s) + circle(x + 11 * s, y - 5 * s, 11 * s) + circle(x + 24 * s, y, 8 * s) + rect(x - 2 * s, y, 32 * s, 6 * s);

/** An areca palm: a slim straight trunk with rings, and a tuft of fronds. */
function areca(x: number, base: number, h: number): { trunk: string; tuft: string } {
  const top = base - h;
  let trunk = `M${f(x)} ${base}L${f(x + 1.5)} ${f(top)}`;
  for (let y = base - 8; y > top + 6; y -= 7) trunk += `M${f(x - 1.4)} ${f(y)}h3`;
  const tx = x + 1.5;
  const tuft = [
    [-16, 6],
    [-11, -4],
    [-3, -9],
    [6, -8],
    [13, -2],
    [16, 7],
  ]
    .map(([dx, dy]) => `M${f(tx)} ${f(top)}Q${f(tx + dx * 0.5)} ${f(top + dy - 6)} ${f(tx + dx)} ${f(top + dy)}`)
    .join("");
  return { trunk, tuft };
}

/** A coconut palm: a curved leaning trunk and long drooping fronds. */
function coconut(x: number, base: number, h: number, lean: number): { trunk: string; fronds: string; nuts: string } {
  const top: Point = [x + lean, base - h];
  const trunk = `M${f(x - 3)} ${base}Q${f(x + lean * 0.2)} ${f(base - h * 0.5)} ${f(top[0] - 1.5)} ${f(top[1])}L${f(top[0] + 1.5)} ${f(top[1])}Q${f(x + lean * 0.2 + 4)} ${f(base - h * 0.5)} ${f(x + 3)} ${base}Z`;
  const fronds = [
    [-26, 12],
    [-20, -6],
    [-6, -14],
    [10, -13],
    [22, -4],
    [27, 13],
  ]
    .map(([dx, dy]) => `M${pt(top)}Q${f(top[0] + dx * 0.55)} ${f(top[1] + dy - 9)} ${f(top[0] + dx)} ${f(top[1] + dy)}`)
    .join("");
  const nuts = circle(top[0] - 2, top[1] + 4, 2.2) + circle(top[0] + 2.5, top[1] + 4.5, 2.2);
  return { trunk, fronds, nuts };
}

/** A jungle tree: a trunk and a round canopy of three lobes. */
const tree = (x: number, base: number, s: number) => ({
  trunk: `M${f(x - 2.5 * s)} ${base}L${f(x - 1.5 * s)} ${f(base - 22 * s)}L${f(x + 1.5 * s)} ${f(base - 22 * s)}L${f(x + 2.5 * s)} ${base}Z`,
  canopy: circle(x - 9 * s, base - 28 * s, 11 * s) + circle(x + 8 * s, base - 30 * s, 12 * s) + circle(x, base - 40 * s, 13 * s),
});

/** A milestone: a white stone with a painted dome. */
const milestone = (x: number, base: number) => ({
  stone: `M${x} ${base}V${base - 26}a15 15 0 0 1 30 0V${base}Z`,
  dome: `M${x} ${base - 24}V${base - 26}a15 15 0 0 1 30 0V${base - 24}Z`,
  text: [x + 15, base - 28] as Point,
  year: [x + 15, base - 10] as Point,
});

/** A bus shelter: posts, a tiled roof, a bench. */
const shelter = (x: number, base: number) => ({
  posts: `M${x + 4} ${base}V${base - 50}M${x + 56} ${base}V${base - 50}`,
  roof: poly([
    [x - 6, base - 50],
    [x + 66, base - 50],
    [x + 60, base - 60],
    [x, base - 60],
  ]),
  bench: rect(x + 10, base - 16, 40, 4) + `M${x + 14} ${base - 12}V${base}M${x + 46} ${base - 12}V${base}`,
});

/* ---- FAR -------------------------------------------------------------------------------- */
export const FAR = (() => {
  const hills = ridge(
    [
      [0, 182],
      [40, 168],
      [85, 176],
      [130, 158],
      [175, 170],
      [220, 150],
      [262, 166],
      [300, 140],
      [340, 112],
      [375, 92],
      [405, 104],
      [440, 128],
      [480, 152],
      [520, 170],
      [560, 184],
      [600, 190],
      [650, 194],
      [700, 190],
      [740, 192],
    ],
    262,
  );
  const city = (
    [
      [596, 172, 14],
      [612, 160, 10],
      [624, 176, 16],
      [642, 150, 12],
      [656, 168, 16],
      [674, 158, 10],
      [686, 172, 22],
      [710, 162, 12],
      [724, 176, 14],
    ] as const
  )
    .map(([x, top, w]) => rect(x, top, w, 200 - top))
    .join("");
  const clouds = cloud(40, 62, 1) + cloud(196, 42, 1.2) + cloud(320, 70, 0.9) + cloud(452, 48, 1.1) + cloud(590, 60, 1) + cloud(690, 38, 0.9);
  return { hills, city, clouds, width: W + (WORLD - W) * PAR.far };
})();

/* ---- MID -------------------------------------------------------------------------------- */
export const MID = (() => {
  // the Ghats' green peak stands between Koppa and Sullia (the layer moves at x0.45: it is ahead at
  // Koppa, beside the bus in the Ghats, and behind it by Sullia)
  const hills = ridge(
    [
      [0, 214],
      [60, 202],
      [120, 208],
      [180, 194],
      [240, 204],
      [300, 190],
      [350, 170],
      [400, 146],
      [440, 128],
      [470, 120],
      [500, 126],
      [540, 146],
      [590, 176],
      [640, 198],
      [700, 210],
      [760, 206],
      [820, 212],
      [880, 208],
      [940, 214],
      [1020, 218],
      [1128, 218],
    ],
    262,
  );
  // the waterfall down its left flank, and its pool
  const fall = `M414 150C418 174 413 200 418 224L434 224C429 200 434 174 428 150Z`;
  const flow = "M419 156C422 176 418 200 422 220M425 154C428 176 424 200 428 220M430 160C432 180 429 202 431 218";
  const pool = "M402 224c8 -5 40 -5 48 0c-8 5 -40 5 -48 0Z";
  // the hairpin road down its right flank
  const hairpins = smooth(
    [
      [480, 214],
      [566, 204],
      [580, 196],
      [566, 190],
      [496, 184],
      [486, 176],
      [498, 168],
      [560, 160],
      [572, 152],
      [560, 146],
      [516, 140],
    ],
    0.4,
  );
  const mist = "M30 214c40 -10 220 -10 260 0c-40 8 -220 8 -260 0Z M330 186c30 -9 150 -9 180 0c-30 7 -150 7 -180 0Z M520 170c24 -7 100 -7 130 0c-24 6 -100 6 -130 0Z";
  // palms on the Malnad hills and on Sullia's
  let palms = "";
  let tufts = "";
  for (const [x, base, h] of [
    [70, 204, 26],
    [86, 206, 30],
    [214, 198, 24],
    [232, 200, 28],
    [330, 202, 26],
  ] as const) {
    const p = areca(x, base, h);
    palms += p.trunk;
    tufts += p.tuft;
  }
  for (const [x, base, h, lean] of [
    [820, 210, 30, 5],
    [850, 208, 34, -4],
    [930, 214, 28, 6],
  ] as const) {
    const p = coconut(x, base, h, lean);
    palms += p.trunk;
    tufts += p.fronds;
  }
  // the city's middle towers (seen as the bus comes in)
  let towers = "";
  let towerWins = "";
  for (const [x, top, w] of [
    [960, 150, 30],
    [996, 120, 26],
    [1028, 160, 34],
    [1068, 132, 28],
    [1100, 156, 24],
  ] as const) {
    towers += rect(x, top, w, 218 - top);
    for (let y = top + 8; y < 210; y += 10) for (let xx = x + 5; xx < x + w - 5; xx += 7) towerWins += rect(xx, y, 3, 4);
  }
  return { hills, fall, flow, pool, hairpins, mist, palms, tufts, towers, towerWins, width: W + (WORLD - W) * PAR.mid };
})();

/* ---- NEAR ------------------------------------------------------------------------------- */
export const NEAR = (() => {
  const verge = rect(0, 232, WORLD, ROAD.kerb - 232);
  let kerbInk = "";
  let kerbWhite = "";
  for (let x = 0, k = 0; x < WORLD; x += 10, k++) {
    if (k % 2) kerbInk += rect(x, ROAD.kerb, 10, ROAD.top - ROAD.kerb);
    else kerbWhite += rect(x, ROAD.kerb, 10, ROAD.top - ROAD.kerb);
  }
  const road = rect(0, ROAD.top, WORLD, ROAD.bottom - ROAD.top);
  let dashes = "";
  for (let x = 8; x < WORLD; x += 36) dashes += rect(x, 266, 18, 2.4);
  const near = rect(0, ROAD.bottom, WORLD, H - ROAD.bottom);

  // KOPPA: areca palms, the shelter and the milestone, the school, a tiled house, coffee bushes
  let palms = "";
  let tufts = "";
  for (const [x, h] of [
    [16, 96],
    [34, 84],
    [178, 104],
    [196, 90],
    [470, 98],
    [520, 86],
  ] as const) {
    const p = areca(x, 232, h);
    palms += p.trunk;
    tufts += p.tuft;
  }
  const koppaShelter = shelter(222, ROAD.kerb);
  const koppaStone = milestone(292, ROAD.kerb);
  const school = {
    roof: poly([
      [324, 168],
      [474, 168],
      [460, 148],
      [338, 148],
    ]),
    tiles: "M340 154H458M334 161H466M360 148L352 168M384 148L380 168M408 148L408 168M432 148L436 168",
    body: rect(332, 168, 134, ROAD.kerb - 168),
    windows: [0, 1].flatMap((row) => Array.from({ length: 6 }, (_, k) => rect(342 + k * 20, 178 + row * 30, 11, 14))).join(""),
    door: rect(391, 222, 16, ROAD.kerb - 222),
    board: rect(352, 132, 94, 13),
    boardText: [399, 141.5] as Point,
  };
  const house = {
    roof: poly([
      [482, 196],
      [544, 196],
      [532, 182],
      [494, 182],
    ]),
    body: rect(488, 196, 50, ROAD.kerb - 196),
    door: rect(506, 214, 12, ROAD.kerb - 214),
    window: rect(492, 206, 9, 9) + rect(525, 206, 9, 9),
  };
  const bushes = [550, 566, 584].map((x) => circle(x, 238, 7) + circle(x + 7, 236, 6)).join("");

  // THE GHATS: the warning board, the painted parapet, monkeys, jungle trees
  const ghatPost = "M580 246V206";
  const ghatBoard = rect(556, 196, 50, 22);
  let parapetInk = "";
  let parapetWhite = "";
  for (let x = 620, k = 0; x < 990; x += 15, k++) {
    if (k % 2) parapetInk += rect(x, 236, 13, 10);
    else parapetWhite += rect(x, 236, 13, 10);
  }
  const monkeys = [700, 788]
    .map((x) => `M${x} 236c-1 -6 1 -11 5 -12c4 -1 7 3 7 8c0 2 -1 3 -1 4Z` + circle(x + 6, 222, 3.6) + `M${x + 11} 234c6 2 8 -4 6 -8c-1 -3 1 -5 3 -4`)
    .join("");
  let jungle = "";
  let jungleTrunks = "";
  for (const [x, s] of [
    [646, 1.2],
    [726, 1],
    [860, 1.3],
    [944, 1.1],
  ] as const) {
    const t = tree(x, 236, s);
    jungle += t.canopy;
    jungleTrunks += t.trunk;
  }

  // SULLIA: coconut palms, the college, the shelter and the milestone
  let coconuts = "";
  let fronds = "";
  let nuts = "";
  for (const [x, h, lean] of [
    [1010, 104, 10],
    [1062, 92, -8],
    [1376, 98, 9],
    [1404, 86, -6],
  ] as const) {
    const p = coconut(x, 232, h, lean);
    coconuts += p.trunk;
    fronds += p.fronds;
    nuts += p.nuts;
  }
  const college = {
    body: rect(1112, 120, 190, ROAD.kerb - 120),
    floors: "M1112 162H1302M1112 204H1302",
    windows: [0, 1, 2].flatMap((row) => Array.from({ length: 8 }, (_, k) => (k === 3 || k === 4 ? "" : rect(1120 + k * 23, 130 + row * 42, 13, 18)))).join(""),
    portico: rect(1182, 112, 50, 8) + "M1186 120V246M1199 120V246M1215 120V246M1228 120V246",
    steps: rect(1176, 240, 62, 6),
    board: rect(1124, 98, 166, 15),
    boardText: [1207, 108.6] as Point,
  };
  const sulliaShelter = shelter(1268, ROAD.kerb);
  const sulliaStone = milestone(1334, ROAD.kerb);

  // THE HIGHWAY: pylons and their wires, a direction board
  const pylon = (x: number) =>
    `M${x - 12} 246L${x - 3} 150L${x + 3} 150L${x + 12} 246M${x - 9} 214L${x + 7} 182M${x + 9} 214L${x - 7} 182M${x - 6} 182L${x + 5} 160M${x + 6} 182L${x - 5} 160M${x - 22} 162H${x + 22}M${x - 16} 174H${x + 16}`;
  const pylons = pylon(1450) + pylon(1560);
  const wires = "M1428 162Q1505 184 1582 162M1434 174Q1505 194 1576 174M1300 166Q1360 186 1428 162";
  const sign = { post: "M1500 246V214", board: rect(1474, 196, 54, 20), text: [1499, 209.5] as Point };

  // BENGALURU: shops, the office tower, the metro viaduct and its train, autos, streetlights
  const shops = rect(1600, 196, 52, 50) + rect(1656, 186, 46, 60) + rect(1890, 190, 40, 56);
  const shutters = "M1606 222H1646M1606 228H1646M1606 234H1646M1606 240H1646M1662 222H1696M1662 228H1696M1662 234H1696M1662 240H1696";
  const shopBoards = rect(1602, 200, 48, 10) + rect(1658, 192, 42, 10);
  const tower = { body: rect(1760, 40, 112, ROAD.kerb - 40), crown: rect(1774, 28, 84, 12) + "M1816 28V12" };
  let towerWins = "";
  const lit: string[] = [];
  const r = rng(11);
  for (let y = 50; y < 150; y += 14) {
    for (let x = 1768; x < 1866; x += 12) {
      const w = rect(x, y, 7, 8);
      towerWins += w;
      if (r() > 0.45) lit.push(w);
    }
  }
  const viaduct = { deck: rect(1580, 150, 340, 12), caps: [1640, 1760, 1880].map((x) => rect(x - 14, 162, 28, 6)).join(""), pillars: [1640, 1760, 1880].map((x) => rect(x - 6, 168, 12, ROAD.kerb - 168)).join("") };
  const metro = {
    cars: rect(0, 0, 58, 18) + rect(62, 0, 58, 18) + rect(124, 0, 58, 18),
    windows: [0, 62, 124].flatMap((o) => [6, 18, 30, 42].map((x) => rect(o + x, 4, 8, 6))).join(""),
    stripe: [0, 62, 124].map((o) => rect(o, 12, 58, 2.5)).join(""),
  };
  const auto = (x: number) => ({
    body: `M${x} 258V246Q${x} 236 ${x + 10} 234H${x + 26}V258Z`,
    canopy: `M${x + 4} 236V224Q${x + 4} 220 ${x + 10} 220H${x + 30}Q${x + 34} 220 ${x + 34} 226V258H${x + 26}`,
    wheels: circle(x + 7, 259, 4.5) + circle(x + 30, 259, 4.5),
  });
  const autos = [auto(1606), auto(1660)];
  const lamp = (x: number) => ({ pole: `M${x} 246V160Q${x} 152 ${x + 8} 152H${x + 16}`, head: rect(x + 14, 150, 12, 5) });
  const lamps = [lamp(1588), lamp(1712), lamp(1898)];
  const cones = [1588, 1712, 1898].map((x) => poly([
    [x + 15, 155],
    [x + 25, 155],
    [x + 46, 250],
    [x - 6, 250],
  ])).join("");
  const lampHeads = lamps.map((l) => l.head).join("");
  const blrStone = milestone(1700, ROAD.kerb);
  return {
    verge,
    kerbInk,
    kerbWhite,
    road,
    dashes,
    near,
    palms,
    tufts,
    koppaShelter,
    koppaStone,
    school,
    house,
    bushes,
    ghatPost,
    ghatBoard,
    parapetInk,
    parapetWhite,
    monkeys,
    jungle,
    jungleTrunks,
    coconuts,
    fronds,
    nuts,
    college,
    sulliaShelter,
    sulliaStone,
    pylons,
    wires,
    sign,
    shops,
    shutters,
    shopBoards,
    tower,
    towerWins,
    towerLit: lit.join(""),
    viaduct,
    metro,
    autos,
    lamps,
    lampHeads,
    cones,
    blrStone,
  };
})();
/** The metro train's x on the viaduct (it crosses as the bus comes in). */
export const METRO_Y = 132;

/* ---- FRONT ------------------------------------------------------------------------------ */
export const FRONT = (() => {
  const r = rng(5);
  let grass = "";
  const width = W + (WORLD - W) * PAR.front;
  for (let x = 10; x < width; x += 46 + r() * 40) {
    const h = 6 + r() * 6;
    grass += `M${f(x)} 300Q${f(x - 2)} ${f(300 - h * 0.6)} ${f(x - 5)} ${f(300 - h)}M${f(x + 3)} 300Q${f(x + 3)} ${f(300 - h)} ${f(x + 4)} ${f(300 - h * 1.3)}M${f(x + 6)} 300Q${f(x + 8)} ${f(300 - h * 0.6)} ${f(x + 11)} ${f(300 - h * 0.9)}`;
  }
  return { grass, width };
})();

/* ---- THE SKY ---------------------------------------------------------------------------- */
export const SKY = (() => {
  const r = rng(29);
  let stars = "";
  for (let k = 0; k < 46; k++) {
    const x = r() * W;
    const y = 8 + r() * 110;
    if (x > 360 && y < 80) continue; // the moon
    stars += circle(x, y, 0.6 + r() * 0.9);
  }
  return { stars, moon: circle(404, 44, 15), bite: circle(412, 39, 13) };
})();
/** The sun's place for the bus at `x`: it climbs over Koppa, crosses at noon and sets by Bengaluru. */
export function sunAt(x: number): Point {
  const q = Math.max(0, Math.min(1, x / (STOP_X[2] - 120)));
  return [70 + q * 330, 150 - Math.sin(Math.PI * Math.min(1, q * 1.05)) * 108 + Math.max(0, q - 0.86) * 360];
}
/** How dark it is (0 day, 1 night) and how golden (the evening), for the bus at `x`. */
export function dusk(x: number): { night: number; gold: number } {
  const s = (a: number, b: number) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  return { night: s(1320, 1700), gold: s(1000, 1300) * (1 - s(1500, 1700)) };
}

/* ---- THE BUS (origin: rear end, on the wheel line; y up is negative) ---------------------- */
export const BUS = (() => {
  const body = "M0 -14V-60Q0 -66 6 -66H128Q138 -66 142 -58L150 -36V-14Q150 -10 146 -10H4Q0 -10 0 -14Z";
  const band = rect(4, -58, 120, 22);
  const panes = Array.from({ length: 5 }, (_, k) => rect(8 + k * 19.6, -56, 16, 18));
  const heads = [0, 1, 3, 4].map((k) => circle(16 + k * 19.6, -45, 3.4) + `M${f(10 + k * 19.6)} -38Q${f(16 + k * 19.6)} -43 ${f(22 + k * 19.6)} -38`).join("");
  const door = rect(106, -56, 16, 44);
  const doorGlass = rect(108, -54, 5.5, 22) + rect(114.5, -54, 5.5, 22);
  const screen = poly([
    [126, -58],
    [140, -58],
    [147, -36],
    [126, -36],
  ]);
  const driver = circle(134, -46, 3.4) + "M129 -38Q134 -43 139 -38";
  const stripes = rect(2, -33, 146, 3);
  const skirt = rect(0, -24, 150, 2);
  const board = rect(126, -65, 18, 5);
  let boardDots = "";
  for (let k = 0; k < 7; k++) boardDots += rect(128 + k * 2.2, -63.6, 1.2, 2);
  const rails = "M12 -66V-72H108V-66M36 -72V-66M60 -72V-66M84 -72V-66";
  const bags = [rect(16, -79, 16, 10), rect(34, -77, 13, 8), rect(50, -81, 19, 12), rect(72, -78, 14, 9), rect(89, -76, 13, 7)];
  const ropes = "M14 -73L104 -80M14 -79L104 -72";
  const headlight = rect(146.5, -22, 3.5, 6);
  const tail = rect(0, -22, 2.5, 6);
  const mirror = "M146 -54H153V-45";
  const bumper = rect(-1.5, -12, 153, 3.5);
  const arches = WHEELS.map((x) => `M${x - 14} -10A14 14 0 0 1 ${x + 14} -10Z`).join("");
  const exhaust = rect(-5, -10, 7, 3);
  // the lights at night: lit panes, the beam ahead, the tail light
  const beam = poly([
    [150, -22],
    [238, -38],
    [238, 4],
    [150, -15],
  ]);
  return { body, band, panes: panes.join(""), heads, door, doorGlass, screen, driver, stripes, skirt, board, boardDots, rails, bags, ropes, headlight, tail, mirror, bumper, arches, exhaust, beam };
})();
/** A wheel at the origin: tyre, rim, hub and five bolts (it turns). */
export const WHEEL = (() => {
  let bolts = "";
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    bolts += circle(Math.cos(a) * 3.8, Math.sin(a) * 3.8, 0.9);
  }
  return { tyre: circle(0, 0, WHEEL_R), rim: circle(0, 0, 6.2), hub: circle(0, 0, 2) + bolts };
})();
