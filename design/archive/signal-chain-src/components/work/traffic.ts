import type { TrafficShape } from "@/content/projects";

/**
 * Traffic shapes: the KIND of traffic on a connection (request/response pairs, server push,
 * pipeline stages...), drawn as a trace on the scope. A visual vocabulary, never measured data.
 * Each shape maps u in [0, 1) (one sweep) to a level: 1 = full height, negative = below the
 * baseline (a refusal, such as HTTP 429).
 */
const fract = (n: number) => n - Math.floor(n);
const pulse = (u: number, a: number, w: number) => u >= a && u < a + w;
const train = (u: number, a: number, b: number, per: number, duty: number) => u >= a && u < b && fract((u - a) / per) < duty;
const hash = (n: number) => fract(Math.sin(n * 127.1 + 11.7) * 43758.5453);

const SHAPES: Record<TrafficShape, (u: number) => number> = {
  reqres: (u) => (pulse(u, 0.36, 0.014) || train(u, 0.44, 0.55, 0.0105, 0.55) || pulse(u, 0.7, 0.014) || train(u, 0.78, 0.89, 0.0105, 0.55) ? 1 : 0),
  rows: (u) => (pulse(u, 0.36, 0.014) || train(u, 0.42, 0.62, 0.008, 0.5) || pulse(u, 0.76, 0.014) || train(u, 0.82, 0.97, 0.008, 0.5) ? 1 : 0),
  query: (u) => {
    if (pulse(u, 0.36, 0.014) || pulse(u, 0.7, 0.014)) return 1;
    for (let k = 0; k < 5; k++) {
      if (pulse(u, 0.43 + k * 0.03, 0.012) || pulse(u, 0.77 + k * 0.03, 0.012)) return [1, 0.86, 0.74, 0.64, 0.56][k];
    }
    return 0;
  },
  embed: (u) => {
    if (pulse(u, 0.36, 0.014) || pulse(u, 0.72, 0.014)) return 1;
    if ((u >= 0.42 && u < 0.6) || (u >= 0.78 && u < 0.96)) return 0.25 + 0.75 * hash(Math.floor(u * 420));
    return 0;
  },
  gen: (u) => {
    if (train(u, 0.34, 0.47, 0.006, 0.6)) return 1;
    if (u >= 0.6 && u < 0.86) return (train(u, 0.6, 0.86, 0.009, 0.55) ? 1 : 0) * (0.5 + 0.5 * Math.sin(((u - 0.6) / 0.26) * Math.PI));
    return 0;
  },
  fail: (u) => (train(u, 0.34, 0.47, 0.006, 0.6) ? 1 : pulse(u, 0.58, 0.012) ? -0.55 : 0),
  fallback: (u) => (pulse(u, 0.4, 0.012) ? -0.2 : train(u, 0.48, 0.68, 0.009, 0.55) ? 0.8 : 0),
  stdio: (u) => (pulse(u, 0.36, 0.012) || pulse(u, 0.41, 0.03) || pulse(u, 0.6, 0.012) || pulse(u, 0.65, 0.03) || pulse(u, 0.83, 0.012) || pulse(u, 0.88, 0.03) ? 1 : 0),
  push: (u) => ([0.36, 0.58, 0.83].some((b) => u >= b && u < b + 0.02 && fract((u - b) / 0.0065) < 0.55) ? 1 : 0),
  stages: (u) => (u < 0.3 ? 0 : u < 0.9 ? [0.3, 0.52, 0.74, 0.96][Math.min(3, Math.floor((u - 0.3) / 0.15))] : 0),
  upload: (u) => (pulse(u, 0.34, 0.012) ? 1 : u >= 0.4 && u < 0.88 ? 0.62 : 0),
  triple: (u) => (pulse(u, 0.34, 0.014) ? 1 : [0.46, 0.6, 0.74].some((a) => train(u, a, a + 0.1, 0.008, 0.55)) ? 1 : 0),
};

const N = 600;
const TOP = 3;
const BASE = 27;
const DOWN = 8;
export const SCOPE_H = 36;
export const SCOPE_W = 240;

/** SVG path of a trace (a step function: signals are discrete). `idle` draws the flat baseline. */
export function tracePath(shape: TrafficShape, idle: boolean): string {
  const f = SHAPES[shape];
  const y = (v: number) => (v >= 0 ? BASE - (BASE - TOP) * v : BASE - DOWN * v);
  let d = `M0 ${BASE}`;
  if (idle) return `${d}H${SCOPE_W}`;
  let prev = BASE;
  for (let i = 0; i < N; i++) {
    const x = ((i / N) * SCOPE_W).toFixed(2);
    const yy = +y(f((i + 0.5) / N)).toFixed(1);
    if (yy !== prev) {
      d += `H${x}V${yy}`;
      prev = yy;
    }
  }
  return `${d}H${SCOPE_W}`;
}
