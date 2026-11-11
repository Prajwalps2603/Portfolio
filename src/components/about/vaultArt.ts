/**
 * THE VAULT (pure geometry: no React, no DOM), for "Certifications & awards". One drawing in a
 * fixed viewBox (-40 -40 480 480, the door's centre at 200 200, 1 unit = the box's width / 480):
 * the frame ring in the wall with a receiver for each bolt, the doorway's tunnel, and the
 * strongroom seen through it in one-point perspective (walls of deposit boxes, a back wall of
 * them, a lamp hanging from the ceiling); the round door (rim, rivets, face, eight bolts, the
 * combination dial, the spoked wheel, the plate) and its two hinges.
 */
import type { Point } from "@/components/sketch/rough";

export const VIEW = { x: -40, y: -40, w: 480, h: 480 } as const;
export const VIEWBOX = `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`;
/** The door's centre (x and y). */
export const C = 200;
export const R = { door: 184, rivets: 172, face: 156, opening: 198, frame: 222 } as const;

/** The hinge pins' axis: the door swings about it. */
export const PIVOT_X = -8;
/** The door layer's transform-origin, in % of its box. */
export const PIVOT_ORIGIN = `${(((PIVOT_X - VIEW.x) / VIEW.w) * 100).toFixed(3)}% 50%`;
/** How far the door stands open (degrees about the hinge; negative: toward the viewer). */
export const OPEN_DEG = -72;
/** How far a deposit box's little door stands open. */
export const HATCH_DEG = -74;

/** The eight bolts' angles; a bolt is drawn along +x, then turned. */
export const BOLTS = [0, 45, 90, 135, 180, 225, 270, 315];
/** A bolt, `x` from the centre: retracted (the markup) its end is under the rim; locked it slides
 *  out by `travel`, across the gap into its receiver. */
export const BOLT = { x: 150, w: 32, h: 18, travel: 30 } as const;

export const DIAL = { x: 200, y: 84, r: 24, bezel: 31 } as const;
/** The wheel's three spokes (degrees clockwise from up), their length and the balls on their ends. */
export const SPOKES = [60, 180, 300];
export const SPOKE = { len: 74, ball: 11, hub: 30, cap: 11 } as const;
export const PLATE = { x: 160, y: 292, w: 80, h: 28 } as const;

const f = (n: number) => Math.round(n * 10) / 10;
const pt = (p: Point) => `${f(p[0])} ${f(p[1])}`;
const circle = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
const polar = (r: number, deg: number, cx = C, cy = C): Point => [cx + Math.cos((deg * Math.PI) / 180) * r, cy + Math.sin((deg * Math.PI) / 180) * r];
const quad = (a: Point, b: Point, c: Point, d: Point) => `M${pt(a)}L${pt(b)}L${pt(c)}L${pt(d)}Z`;

/** The door: its rivets, the dial's ticks, a spoke. */
export const DOOR = (() => {
  let rivets = "";
  for (let k = 0; k < 28; k++) {
    const [x, y] = polar(R.rivets, (k / 28) * 360 + 6);
    rivets += circle(x, y, 2.6);
  }
  let ticks = "";
  for (let k = 0; k < 40; k++) {
    const deg = (k / 40) * 360;
    ticks += `M${pt(polar(k % 5 === 0 ? 15 : 18.5, deg, DIAL.x, DIAL.y))}L${pt(polar(22.5, deg, DIAL.x, DIAL.y))}`;
  }
  // the dial's index, on the bezel above it
  const index = `M${DIAL.x - 4.5} ${DIAL.y - DIAL.bezel + 0.5}h9l-4.5 6.5Z`;
  // a hinge arm, from the pin across the gap onto the rim
  const arms = `M${PIVOT_X} 121h56v18h-56Z M${PIVOT_X} 261h56v18h-56Z`;
  const armBolts = circle(30, 130, 3) + circle(41, 130, 3) + circle(30, 270, 3) + circle(41, 270, 3);
  return { rivets, ticks, index, arms, armBolts };
})();

/** The frame ring in the wall, its rivets and a receiver for each bolt. */
export const FRAME = (() => {
  const ring = circle(C, C, R.frame) + circle(C, C, R.opening);
  let rivets = "";
  for (let k = 0; k < 8; k++) {
    for (const d of [15, 30]) {
      const [x, y] = polar(R.opening + 13, k * 45 + d);
      rivets += circle(x, y, 2.2);
    }
  }
  return { ring, rivets };
})();

/** The hinge knuckles on the frame (the pins the door turns on). */
export const KNUCKLES = `M${PIVOT_X - 8} 106h16v48h-16Z M${PIVOT_X - 8} 246h16v48h-16Z`;
export const KNUCKLE_JOINTS = `M${PIVOT_X - 8} 130h16M${PIVOT_X - 8} 270h16`;
export const KNUCKLE_CAPS = `M${PIVOT_X - 4} 100h8v6h-8Z M${PIVOT_X - 4} 240h8v6h-8Z`;

/* ---- the strongroom through the doorway -------------------------------------------------- */
const VP: Point = [200, 186];
const H0 = 260;
const BACK = 0.3;
const P = (x: number, y: number, s: number): Point => [VP[0] + x * H0 * s, VP[1] + y * H0 * s];

/** The doorway's tunnel: its far rim, scaled toward the vanishing point. */
const TUNNEL = 0.9;
export const TUNNEL_C: Point = [VP[0] + (C - VP[0]) * TUNNEL, VP[1] + (C - VP[1]) * TUNNEL];
export const TUNNEL_R = f(R.opening * TUNNEL);
export const TUNNEL_RING = circle(C, C, R.opening) + circle(TUNNEL_C[0], TUNNEL_C[1], TUNNEL_R);
export const TUNNEL_RIM = circle(TUNNEL_C[0], TUNNEL_C[1], TUNNEL_R);

export const ROOM = (() => {
  const ceiling = quad(P(-1, -1, 1), P(1, -1, 1), P(1, -1, BACK), P(-1, -1, BACK));
  const floor = quad(P(-1, 1, 1), P(1, 1, 1), P(1, 1, BACK), P(-1, 1, BACK));
  const walls = quad(P(-1, -1, 1), P(-1, -1, BACK), P(-1, 1, BACK), P(-1, 1, 1)) + quad(P(1, -1, 1), P(1, -1, BACK), P(1, 1, BACK), P(1, 1, 1));
  const back = quad(P(-1, -1, BACK), P(1, -1, BACK), P(1, 1, BACK), P(-1, 1, BACK));
  const edges = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([x, y]) => `M${pt(P(x, y, 1))}L${pt(P(x, y, BACK))}`).join("");

  // deposit boxes on both side walls (depths foreshortened) and on the back wall
  const ROWS = [-0.8, -0.45, -0.1, 0.25, 0.6];
  const DEPTHS = [0.75, 0.6, 0.5, 0.43, 0.375, 0.335, BACK];
  let boxes = "";
  let holes = "";
  for (const x of [-1, 1]) {
    for (const y of ROWS) boxes += `M${pt(P(x, y, 0.8))}L${pt(P(x, y, BACK))}`;
    for (const s of DEPTHS.slice(0, -1)) boxes += `M${pt(P(x, ROWS[0], s))}L${pt(P(x, ROWS[ROWS.length - 1], s))}`;
    for (let i = 0; i < DEPTHS.length - 1; i++) {
      for (let j = 0; j < ROWS.length - 1; j++) {
        const s = (DEPTHS[i] + DEPTHS[i + 1]) / 2;
        const [hx, hy] = P(x, (ROWS[j] + ROWS[j + 1]) / 2, s);
        holes += circle(hx, hy, 3.4 * s);
      }
    }
  }
  const COLS = [-1, -0.6, -0.2, 0.2, 0.6, 1];
  for (const y of ROWS) boxes += `M${pt(P(-1, y, BACK))}L${pt(P(1, y, BACK))}`;
  for (const x of COLS.slice(1, -1)) boxes += `M${pt(P(x, ROWS[0], BACK))}L${pt(P(x, ROWS[ROWS.length - 1], BACK))}`;
  for (let i = 0; i < COLS.length - 1; i++) {
    for (let j = 0; j < ROWS.length - 1; j++) {
      const [hx, hy] = P((COLS[i] + COLS[i + 1]) / 2, (ROWS[j] + ROWS[j + 1]) / 2, BACK);
      holes += circle(hx, hy, 1.3);
    }
  }
  // a runner on the floor
  const runner = quad(P(-0.36, 1, 0.92), P(0.36, 1, 0.92), P(0.36, 1, BACK), P(-0.36, 1, BACK));

  // the lamp, hanging from the ceiling halfway in, and the light it throws on the floor
  const [lx, ly] = P(0, -1, 0.5);
  const floorY = P(0, 1, 0.5)[1];
  const cord = `M${f(lx)} ${f(ly)}V${f(ly + 22)}`;
  const shade = `M${f(lx - 10)} ${f(ly + 22)}h20l9 16h-38Z`;
  const bulb = `M${f(lx - 6)} ${f(ly + 38)}a6 6 0 0 0 12 0Z`;
  const cone = `M${f(lx - 17)} ${f(ly + 40)}L${f(lx + 17)} ${f(ly + 40)}L${f(lx + 66)} ${f(floorY)}L${f(lx - 66)} ${f(floorY)}Z`;
  const pool = `M${f(lx - 66)} ${f(floorY)}a66 9 0 1 0 132 0a66 9 0 1 0 -132 0Z`;
  return { ceiling, floor, walls, back, edges, boxes, holes, runner, cord, shade, bulb, cone, pool };
})();

/** A deposit box's compartment (104 x 88, stretched to its box): ceiling, walls, floor and back
 *  in one-point perspective, and the four edges running in. */
export const COMPARTMENT = (() => {
  const W = 104;
  const H = 88;
  const v: Point = [52, 44];
  const k = 0.58;
  const b0: Point = [v[0] - v[0] * k, v[1] - v[1] * k];
  const b1: Point = [v[0] + (W - v[0]) * k, v[1] + (H - v[1]) * k];
  const tl: Point = [0, 0];
  const tr: Point = [W, 0];
  const br: Point = [W, H];
  const bl: Point = [0, H];
  const btl = b0;
  const btr: Point = [b1[0], b0[1]];
  const bbr = b1;
  const bbl: Point = [b0[0], b1[1]];
  return {
    view: `0 0 ${W} ${H}`,
    ceiling: quad(tl, tr, btr, btl),
    walls: quad(tl, btl, bbl, bl) + quad(tr, btr, bbr, br),
    floor: quad(bl, br, bbr, bbl),
    back: quad(btl, btr, bbr, bbl),
    edges: `M${pt(tl)}L${pt(btl)}M${pt(tr)}L${pt(btr)}M${pt(br)}L${pt(bbr)}M${pt(bl)}L${pt(bbl)}`,
  };
})();
