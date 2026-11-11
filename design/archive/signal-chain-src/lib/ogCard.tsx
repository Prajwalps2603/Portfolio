import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/content";
import { CHANNELS } from "@/lib/channels";
import { OG_SIZE } from "@/lib/og";

/**
 * The site's own lettering for the card: static Archivo instances (expanded 800 for the
 * wordmark, 500 for the role), Latin subsets from Google Fonts (OFL), read at build time.
 * The image renderer needs TTF/OTF; the page's next/font files are woff2.
 */
function cardFonts() {
  const dir = join(process.cwd(), "src", "fonts", "og");
  return [
    { name: "Archivo Expanded", data: readFileSync(join(dir, "archivo-expanded-800.ttf")), weight: 800 as const, style: "normal" as const },
    { name: "Archivo", data: readFileSync(join(dir, "archivo-500.ttf")), weight: 500 as const, style: "normal" as const },
  ];
}

const W = 1200;
const H = 630;
const GRAPHITE = "#0E0F0D";
const GRATICULE = "#2B2D28";
const BONE = "#ECE8DF";

/** One trace per lane, drawn as an SVG path in the lane's channel colour (the sum is bone). */
function tracePath(shape: string, y: number, amp: number): string {
  const x0 = 72;
  const x1 = W - 72;
  const pts: string[] = [];
  const n = 240;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + t * (x1 - x0);
    const ph = t * Math.PI * 2 * 5;
    let v: number;
    if (shape === "sine") v = Math.sin(ph);
    else if (shape === "square") v = Math.sin(ph) >= 0 ? 0.8 : -0.8;
    else if (shape === "staircase") v = Math.floor(t * 10) / 5 - 0.9;
    else if (shape === "am") v = Math.sin(ph * 2.2) * (0.35 + 0.65 * Math.abs(Math.sin(ph * 0.5)));
    else v = Math.sin(ph) * 0.35 + (Math.sin(ph) >= 0 ? 0.3 : -0.3) + (Math.floor(t * 10) / 5 - 0.9) * 0.2;
    pts.push(`${i ? "L" : "M"}${x.toFixed(1)} ${(y - v * amp).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** The 1200x630 social card: graticule, the name, the role, the five traces. Static at build. */
export function ogCard() {
  const laneTop = 372;
  const pitch = 50;
  const grid: number[] = [];
  for (let x = 72; x <= W - 72; x += 96) grid.push(x);
  const rows: number[] = [];
  for (let y = 48; y <= H - 48; y += 48) rows.push(y);
  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", background: GRAPHITE, color: BONE }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          {grid.map((x) => (
            <line key={`v${x}`} x1={x} y1={48} x2={x} y2={H - 48} stroke={GRATICULE} strokeWidth={1} />
          ))}
          {rows.map((y) => (
            <line key={`h${y}`} x1={72} y1={y} x2={W - 72} y2={y} stroke={GRATICULE} strokeWidth={1} />
          ))}
          {CHANNELS.map((ch, i) => (
            <path
              key={ch.key}
              d={tracePath(ch.shape, laneTop + i * pitch, 17)}
              fill="none"
              stroke={ch.hex}
              strokeWidth={ch.id === "sigma" ? 3 : 2.5}
              strokeLinejoin="round"
            />
          ))}
        </svg>
        <div style={{ position: "absolute", left: 72, top: 76, display: "flex", flexDirection: "column", padding: "4px 0" }}>
          <div style={{ fontFamily: "Archivo Expanded", fontSize: 100, fontWeight: 800, letterSpacing: -3.5, lineHeight: 0.9, display: "flex" }}>
            {profile.name.toUpperCase()}
          </div>
          <div style={{ fontFamily: "Archivo", fontSize: 40, fontWeight: 500, letterSpacing: -0.8, color: BONE, marginTop: 26, display: "flex" }}>{profile.title}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: cardFonts() },
  );
}
