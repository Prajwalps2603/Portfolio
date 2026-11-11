"use client";

import { CHANNELS, PALETTE } from "@/lib/channels";
import type { SceneLayout } from "./layout";
import { sumWave, timeScale, wave } from "./wave";

/**
 * The scope without WebGL2: the locked picture as one static SVG (graticule + five traces),
 * drawn from the same wave model and layout as the shader, so nothing changes but the beam.
 * A lane the hero is probing (chip focus/tap) brightens and the others step back, as on the
 * canvas, through opacity only.
 */
export function ScopeFallback({ layout, hover }: { layout: SceneLayout; hover: number }) {
  const { width: W, height: H, lanes, laneSpacing, rect, divisions } = layout;
  if (W < 2 || H < 2) return null;

  const amp = laneSpacing * 0.3;
  const xs = timeScale(W);
  const step = Math.max(2, Math.round(W / 480));
  const roll = [0, 0, 0, 0];
  const paths = CHANNELS.map((_, ch) => {
    let d = "";
    for (let x = 0; x <= W + step; x += step) {
      const px = Math.min(x, W);
      const u = (px / W) * xs;
      const y = lanes[ch] - (ch === 4 ? sumWave(u, roll) : wave(ch, u + roll[ch])) * amp;
      d += `${x === 0 ? "M" : "L"}${px.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  });

  const [x0, y0, x1, y1] = rect;
  const [cols, rows] = divisions;
  const gx = (x1 - x0) / cols;
  const gy = (y1 - y0) / rows;
  const grid: string[] = [];
  for (let i = 0; i <= cols; i++) grid.push(`M${(x0 + i * gx).toFixed(1)} ${y0}V${y1}`);
  for (let j = 0; j <= rows; j++) grid.push(`M${x0} ${(y0 + j * gy).toFixed(1)}H${x1}`);
  const cx = x0 + gx * Math.floor(cols / 2);
  const cy = y0 + gy * Math.floor(rows / 2);

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 h-full w-full bg-graphite"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
    >
      <path d={grid.join("")} stroke={PALETTE.graticule} strokeWidth={1} fill="none" vectorEffect="non-scaling-stroke" />
      <path d={`M${x0} ${cy}H${x1}M${cx} ${y0}V${y1}`} stroke={PALETTE.graticuleStrong} strokeWidth={1} fill="none" vectorEffect="non-scaling-stroke" />
      {paths.map((d, ch) => (
        <path
          key={CHANNELS[ch].key}
          d={d}
          stroke={CHANNELS[ch].hex}
          strokeWidth={1.4}
          strokeLinejoin="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
          opacity={hover < 0 ? 0.9 : hover === ch ? 1 : 0.4}
          style={{ transition: "opacity var(--dur-chip) var(--ease-panel)" }}
        />
      ))}
    </svg>
  );
}
