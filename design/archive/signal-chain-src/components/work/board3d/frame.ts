/**
 * World geometry of the 3D bench board, in board units (x to the right, z towards the viewer,
 * y up; the board's top face is y = 0). Shared by the lazy scene and by the reserved box that
 * holds its place, so the box has the canvas's exact aspect before a byte of three.js loads.
 * No imports: the router is tested in Node against this file.
 *
 * Layout: five channel columns (CH1 Interface, CH2 Services, CH3 Data, CH4 Intelligence,
 * Σ Delivery) with up to `rows` chips each. Copper runs in the gutters between columns and in
 * the lanes between rows, never under a chip.
 */

/** Camera tilt from straight down (the approved sketch: an orthographic 3/4 view at 35°). */
export const TILT = (35 * Math.PI) / 180;
export const COLS = 5;
/** Column pitch, chip footprint and the side margin outside the outer columns. */
export const PITCH_X = 2;
export const CHIP_W = 1.6;
export const MARGIN_X = 0.36;
/**
 * Chip depth; lanes between rows, above the first row and below the last; the column-header
 * band; the legend band; margins. The silkscreen refdes of a chip sits in the lane above it, in
 * a band (REF_BAND) the router keeps clear of copper.
 */
export const CHIP_D = 0.7;
export const LANE = 0.6;
export const LANE_TOP = 0.6;
export const LANE_BOTTOM = 0.4;
export const REF_BAND = 0.3;
export const HEAD = 0.4;
export const LEGEND = 0.34;
export const MARGIN_Z = 0.14;
/** Board thickness (FR4) and chip package height. */
export const SLAB = 0.16;
export const CHIP_H = 0.13;
/** Copper sits just above the board top so it never z-fights the slab. */
export const COPPER_Y = 0.012;

export const BOARD_W = (COLS - 1) * PITCH_X + CHIP_W + 2 * MARGIN_X;

export type Frame = {
  rows: number;
  /** Board depth (z). */
  depth: number;
  /** Camera frame in board units (orthographic frustum, before the canvas aspect is applied). */
  width: number;
  height: number;
  aspect: number;
  /** Screen-space centre offset of the frame along the camera's up axis. */
  centre: number;
  /** The board top face inside the frame, as fractions of the frame (for the placeholder slab). */
  slab: { left: number; top: number; width: number; height: number };
};

/** Projection of a board point onto the camera's screen-up axis (0, sin TILT, -cos TILT). */
export const screenUp = (y: number, z: number) => y * Math.sin(TILT) - z * Math.cos(TILT);

/**
 * The camera frame for a board with `rows` chip rows. Slack around the slab covers the ±4°
 * pointer tilt and the probe hooks standing on the back rows.
 */
export function frameFor(rows: number): Frame {
  const depth = 2 * MARGIN_Z + HEAD + LANE_TOP + LANE_BOTTOM + rows * CHIP_D + (rows - 1) * LANE + LEGEND;
  const width = BOARD_W + 0.5;
  const top = screenUp(0, -depth / 2) + 0.24; // back edge, plus room for the tilt
  const bottom = screenUp(-SLAB, depth / 2) - 0.14; // front edge of the slab's underside
  const height = top - bottom;
  const centre = (top + bottom) / 2;
  const slabTop = screenUp(0, -depth / 2);
  const slabBottom = screenUp(0, depth / 2);
  return {
    rows,
    depth,
    width,
    height,
    aspect: width / height,
    centre,
    slab: {
      left: (width - BOARD_W) / 2 / width,
      top: (top - slabTop) / height,
      width: BOARD_W / width,
      height: (slabTop - slabBottom) / height,
    },
  };
}

/** Column centre x. */
export const colX = (c: number) => (c - (COLS - 1) / 2) * PITCH_X;
