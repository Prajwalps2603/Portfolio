/**
 * The wave model: one shape per layer, and the hero legend says so.
 *   CH1 Interface    smooth sine            (continuous UI)
 *   CH2 Services     square                 (request / response)
 *   CH3 Data         staircase              (write ramp)
 *   CH4 Intelligence AM-modulated carrier   (a model inside a product)
 *   Σ   Shipped      the weighted sum of the four
 *
 * The TypeScript and GLSL versions are the same functions, ported verbatim from the approved
 * sketch, so the SVG fallback, the beam head and the shader always draw the same picture.
 */

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const fract = (v: number) => v - Math.floor(v);

/** Channel waveform, ch 0..3, x in screen widths (unbounded). Returns roughly -1..1. */
export function wave(ch: number, x: number): number {
  if (ch === 0) return Math.sin(TAU * 3 * x + 0.6);
  if (ch === 1) return clamp(Math.sin(TAU * 6 * x + 0.3) * 7, -1, 1) * 0.8;
  if (ch === 2) {
    const f = fract(3 * x + 0.05);
    return (Math.floor(f * 6) / 5) * 1.6 - 0.8;
  }
  const env = 0.55 + 0.45 * Math.sin(TAU * x + 1.3);
  return Math.sin(TAU * 26 * x) * env * 0.85;
}

/** Σ: the shipped system is literally the sum of its layers. */
export function sumWave(x: number, roll: readonly number[]): number {
  return (
    (wave(0, x + roll[0]) * 0.95 + wave(1, x + roll[1]) * 0.55 + wave(2, x + roll[2]) * 0.5 + wave(3, x + roll[3]) * 0.4) / 1.75
  );
}

/** Horizontal time scale: how many "screen widths" of signal fit the hero (wider = more cycles). */
export function timeScale(width: number): number {
  return clamp(width / 1440, 0.42, 1.25);
}

/**
 * Locking snaps each channel's phase to a whole period of its own shape, so the locked picture is
 * always the same one (CH1 3 cycles, CH2 6, CH3 3, CH4 26 per screen width).
 */
export const LOCK_PERIODS = [3, 6, 3, 26] as const;

export const GLSL_WAVE = /* glsl */ `
const float TAU = 6.28318530718;
float wave(int ch, float x){
  if (ch == 0) return sin(TAU*3.0*x + 0.6);
  if (ch == 1) return clamp(sin(TAU*6.0*x + 0.3)*7.0, -1.0, 1.0)*0.8;
  if (ch == 2) { float f = fract(3.0*x + 0.05); return floor(f*6.0)/5.0*1.6 - 0.8; }
  float env = 0.55 + 0.45*sin(TAU*x + 1.3);
  return sin(TAU*26.0*x)*env*0.85;
}`;
