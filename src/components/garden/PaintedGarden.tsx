/**
 * THE GARDEN, PAINTED: the drawing ./GardenScene shows outside sketch mode (./paintArt has the
 * geometry and the palette). It renders the season (one place per day on the furrows of
 * ./gardenArt) and exposes the hooks GardenScene animates: [data-sun], [data-cloud], [data-grow]
 * (each plant, with its week in data-col) and [data-sway] inside it, [data-spray] (the traveling
 * sprinkler) with [data-arm] and [data-arcs], [data-hose], [data-butterfly] with [data-wing],
 * [data-mote]. The markup is the grown garden at rest.
 */
import type { PointerEventHandler } from "react";
import type { GardenDay, GardenSeason, GardenStats } from "@/content/garden";
import { H, W, cellAt, f, rng, rowScale } from "./gardenArt";
import {
  BAMBOO,
  BUTTERFLYP,
  GROUND,
  LAND,
  MANGO,
  MOTES,
  NEAR_GRASS,
  PAINT as P,
  SHEDP,
  SKYP,
  SPRINKLER,
  SUNFLOWERP,
  hoseTo,
  paintedPlant,
} from "./paintArt";

export const GROW = 1.65;
export const SPRAY_REST = 1096;
export const SPRAY_Y = 664;
/** The sun at the end of the time-lapse (the markup) and where it starts. */
export const sunPaint = (p: number): [number, number] => [
  930 + 80 * p,
  168 - 52 * p,
];

/** A ruffled flower head: a ring of round petals at radius r. */
function ruffle(cx: number, cy: number, r: number, n: number): string {
  let d = "";
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const pr = r * 0.34;
    const x = cx + Math.cos(a) * (r - pr);
    const y = cy + Math.sin(a) * (r - pr) * 0.92;
    d += `M${f(x - pr)} ${f(y)}a${f(pr)} ${f(pr)} 0 1 0 ${f(2 * pr)} 0a${f(pr)} ${f(pr)} 0 1 0 ${f(-2 * pr)} 0Z`;
  }
  return (
    d +
    `M${f(cx - r * 0.7)} ${f(cy)}a${f(r * 0.7)} ${f(r * 0.66)} 0 1 0 ${f(r * 1.4)} 0a${f(r * 0.7)} ${f(r * 0.66)} 0 1 0 ${f(-r * 1.4)} 0Z`
  );
}

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

type Props = {
  season: GardenSeason;
  stats: GardenStats;
  onPointerMove: PointerEventHandler<SVGSVGElement>;
  onPointerLeave: PointerEventHandler<SVGSVGElement>;
};

export function PaintedGarden({
  season,
  stats,
  onPointerMove,
  onPointerLeave,
}: Props) {
  const plants = season.days
    .filter((d) => d.count > 0 && !d.future)
    .sort((a, b) => a.weekday - b.weekday || a.week - b.week);
  const seeds = season.days
    .filter((d) => d.count === 0 && !d.future)
    .map((d) => {
      const [x, y] = cellAt(d.week, d.weekday);
      const s = rowScale(d.weekday);
      return `M${f(x - 2.4 * s)} ${f(y - 2 * s)}a${f(2.4 * s)} ${f(1.5 * s)} 0 1 0 ${f(4.8 * s)} 0a${f(2.4 * s)} ${f(1.5 * s)} 0 1 0 ${f(-4.8 * s)} 0Z`;
    })
    .join("");
  const months: { x: number; label: string }[] = [];
  let prevMonth = "";
  let prevCol = -9;
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  for (const d of season.days) {
    if (d.weekday !== 0 && d !== season.days[0]) continue;
    const m = d.date.slice(0, 7);
    if (m === prevMonth) continue;
    prevMonth = m;
    if (d.week - prevCol < 3) continue;
    months.push({
      x: cellAt(d.week, 6)[0],
      label: MONTHS[Number(d.date.slice(5, 7)) - 1],
    });
    prevCol = d.week;
  }
  const streak =
    stats.streak && stats.streak.days > 1
      ? [
          ...new Set(
            season.days
              .filter(
                (d) =>
                  d.date >= stats.streak!.from && d.date <= stats.streak!.to,
              )
              .map((d) => d.week),
          ),
        ]
      : [];
  const tall = [...plants].sort((a, b) => b.count - a.count).slice(0, 3);
  const [sx, sy] = sunPaint(1);

  return (
    <div className="relative">
      {/* the still background: sky, land, the shed, the soil, the path (painted once) */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        focusable="false"
        className="block h-auto w-full"
      >
        <defs>
          <linearGradient id="pg-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.skyTop} />
            <stop offset="0.42" stopColor={P.skyMid} />
            <stop offset="0.78" stopColor={P.skyLow} />
            <stop offset="1" stopColor={P.skyHaze} />
          </linearGradient>
          <radialGradient id="pg-sunglow">
            <stop offset="0" stopColor={P.sun} stopOpacity="1" />
            <stop offset="0.12" stopColor={P.sunGlow} stopOpacity="0.85" />
            <stop offset="0.4" stopColor={P.sunGlow} stopOpacity="0.28" />
            <stop offset="1" stopColor={P.sunGlow} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pg-cloud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.cloudTop} />
            <stop offset="0.55" stopColor={P.cloudMid} />
            <stop offset="1" stopColor={P.cloudShade} />
          </linearGradient>
          <linearGradient id="pg-ghats" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.ridgeFar} />
            <stop offset="1" stopColor={P.ridgeFarLow} />
          </linearGradient>
          <linearGradient id="pg-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pg-hill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.hill} />
            <stop offset="1" stopColor={P.hillLow} />
          </linearGradient>
          <linearGradient id="pg-lawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.lawnFar} />
            <stop offset="1" stopColor={P.lawnNear} />
          </linearGradient>
          <linearGradient id="pg-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.soilTop} />
            <stop offset="1" stopColor={P.soilLow} />
          </linearGradient>
          <linearGradient id="pg-ridge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.ridgeLit} />
            <stop offset="1" stopColor={P.ridge} />
          </linearGradient>
          <linearGradient id="pg-plank" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={P.plank} />
            <stop offset="1" stopColor={P.plankDark} />
          </linearGradient>
          <linearGradient id="pg-roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.roof} />
            <stop offset="1" stopColor={P.roofDark} />
          </linearGradient>
          <linearGradient id="pg-leaf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={P.leafLit} />
            <stop offset="0.55" stopColor={P.leaf} />
            <stop offset="1" stopColor={P.leafDark} />
          </linearGradient>
          <linearGradient id="pg-leafdark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={P.leaf} />
            <stop offset="1" stopColor={P.leafDark} />
          </linearGradient>
          <linearGradient id="pg-chili" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={P.chiliLit} />
            <stop offset="0.6" stopColor={P.chili} />
            <stop offset="1" stopColor="#8f150c" />
          </linearGradient>
          <radialGradient id="pg-marigold" cx="0.4" cy="0.35">
            <stop offset="0" stopColor="#ffe08a" />
            <stop offset="0.5" stopColor={P.marigold} />
            <stop offset="0.85" stopColor={P.marigoldDeep} />
            <stop offset="1" stopColor={P.marigoldEdge} />
          </radialGradient>
          <linearGradient id="pg-petal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={P.petalDeep} />
            <stop offset="0.5" stopColor={P.petal} />
            <stop offset="1" stopColor="#ffe98a" />
          </linearGradient>
          <radialGradient id="pg-seedhead">
            <stop offset="0" stopColor={P.seedHead} />
            <stop offset="1" stopColor={P.seedHeadLow} />
          </radialGradient>
          <linearGradient id="pg-iron" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.ironLit} />
            <stop offset="0.5" stopColor={P.iron} />
            <stop offset="1" stopColor={P.ironDark} />
          </linearGradient>
          <linearGradient id="pg-stone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.stone} />
            <stop offset="1" stopColor={P.stoneDark} />
          </linearGradient>
          <linearGradient id="pg-drum" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={P.drumDark} />
            <stop offset="0.4" stopColor={P.drum} />
            <stop offset="1" stopColor={P.drumDark} />
          </linearGradient>
          <linearGradient id="pg-pot" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={P.terracotta} />
            <stop offset="1" stopColor={P.terracottaDark} />
          </linearGradient>
          <linearGradient id="pg-tin" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#dfe5e8" />
            <stop offset="0.5" stopColor="#b6c0c6" />
            <stop offset="1" stopColor="#7d888f" />
          </linearGradient>
          <linearGradient id="pg-warm" x1="1" y1="0" x2="0.2" y2="0.8">
            <stop offset="0" stopColor={P.warm} stopOpacity="0.32" />
            <stop offset="1" stopColor={P.warm} stopOpacity="0" />
          </linearGradient>
          <radialGradient id="pg-vignette" cx="0.55" cy="0.45" r="0.8">
            <stop offset="0.6" stopColor={P.vignette} stopOpacity="0" />
            <stop offset="1" stopColor={P.vignette} stopOpacity="0.38" />
          </radialGradient>
          <radialGradient id="pg-shade">
            <stop offset="0" stopColor={P.shadow} stopOpacity="0.55" />
            <stop offset="1" stopColor={P.shadow} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pg-mist">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <filter id="pg-soft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <filter id="pg-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="pg-shadow" x="-50%" y="-100%" width="200%" height="300%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          <filter id="pg-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="2"
              seed="4"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.1  0 0 0 0 0.06  0 0 0 0 0.03  0 0 0 1.6 -0.62"
            />
          </filter>
          <clipPath id="pg-soilclip">
            <path d={GROUND.soil} />
          </clipPath>
        </defs>

        {/* the sky, the sun and its light, clouds, birds */}
        <rect width={W} height={H} fill="url(#pg-sky)" />
        <g data-sun="" transform={`translate(${f(sx)} ${f(sy)})`}>
          <path d={SKYP.rays} fill="#ffffff" opacity={0.07} />
          <circle r={300} fill="url(#pg-sunglow)" />
          <circle r={30} fill={P.sun} />
          <circle r={22} fill="#ffffff" />
        </g>
        <path
          d={SKYP.wisps}
          fill="#ffffff"
          opacity={0.5}
          filter="url(#pg-soft)"
        />
        {[SKYP.big, SKYP.mid, SKYP.small].map((c, i) => (
          <g key={i} filter="url(#pg-soft)">
            <path d={c.body} fill="url(#pg-cloud)" />
            <path d={c.shade} fill={P.cloudShade} opacity={0.35} />
            <path d={c.lit} fill="#ffffff" opacity={0.75} />
          </g>
        ))}
        <path
          d={SKYP.birds}
          fill="none"
          stroke="#2b3542"
          strokeWidth={1.6}
          strokeLinecap="round"
        />

        {/* the Ghats in haze, the hills, the forest line, palms */}
        <path d={LAND.ghats} fill="url(#pg-ghats)" />
        <rect y={226} width={W} height={120} fill="url(#pg-haze)" />
        <path d={LAND.hills} fill="url(#pg-hill)" />
        <path d={LAND.forestDeep} fill={P.forestDeep} />
        <path d={LAND.forest} fill={P.forest} />
        <path d={LAND.forestLit} fill={P.forestLit} opacity={0.55} />
        {LAND.palms.map((p, i) => (
          <g key={i}>
            <path d={p.trunk} fill="#6d5a41" />
            <path
              d={p.leaflets}
              stroke={P.forest}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={p.fronds}
              stroke={P.forestDeep}
              strokeWidth={2.6}
              strokeLinecap="round"
              fill="none"
            />
          </g>
        ))}

        {/* the lawn, the bamboo fence and its creeper */}
        <path d={GROUND.lawn} fill="url(#pg-lawn)" />
        <path
          d={BAMBOO.poles}
          fill={P.bamboo}
          stroke={P.bambooDark}
          strokeWidth={0.8}
        />
        <path d={BAMBOO.nodes} stroke={P.bambooDark} strokeWidth={1.4} />
        <path d={BAMBOO.rails} fill={P.bambooDark} />
        <path d={BAMBOO.vine} fill="none" stroke={P.vine} strokeWidth={1.6} />
        <path d={BAMBOO.vineLeaves} fill="url(#pg-leaf)" />
        <path d={BAMBOO.pink} fill={P.flowerPink} />
        <path d={BAMBOO.blue} fill={P.flowerBlue} />

        {/* the shed */}
        <path
          d={SHEDP.shadow}
          fill={P.shadow}
          opacity={0.28}
          filter="url(#pg-blur)"
        />
        <path d={SHEDP.body} fill="url(#pg-plank)" />
        <path
          d={SHEDP.planks}
          stroke={P.plankLine}
          strokeWidth={1.2}
          opacity={0.7}
        />
        <path
          d={SHEDP.grain}
          fill="none"
          stroke={P.plankLine}
          strokeWidth={0.8}
          opacity={0.35}
        />
        <path d={SHEDP.eave} fill={P.shadow} opacity={0.35} />
        <path
          d={SHEDP.door}
          fill={P.plankDark}
          stroke={P.plankLine}
          strokeWidth={1.4}
        />
        <path
          d={SHEDP.doorPlanks}
          stroke={P.plankLine}
          strokeWidth={1}
          opacity={0.6}
        />
        <path d={SHEDP.hinges} fill="#2b2622" />
        <path d={SHEDP.knob} fill="#d8b46a" />
        <path
          d={SHEDP.window}
          fill={P.window}
          stroke={P.windowFrame}
          strokeWidth={4}
        />
        <path d={SHEDP.panes} stroke={P.windowFrame} strokeWidth={3} />
        <path d={SHEDP.sill} fill={P.plankDark} />
        <path d={SHEDP.roof} fill="url(#pg-roof)" />
        <path
          d={SHEDP.tiles}
          fill="none"
          stroke={P.roofLine}
          strokeWidth={1.2}
          opacity={0.75}
        />
        <path
          d={SHEDP.board}
          fill="#3a2a1c"
          stroke="#24180f"
          strokeWidth={1.5}
        />
        <text
          x={SHEDP.boardText[0]}
          y={SHEDP.boardText[1]}
          textAnchor="middle"
          fill="#f3e3c0"
          className="font-display"
          style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.1em" }}
        >
          PRAJWAL&apos;S GARDEN
        </text>
        <path d={SHEDP.creeper} fill="url(#pg-leaf)" />
        <path d={SHEDP.drum} fill="url(#pg-drum)" />
        <path d={SHEDP.drumRibs} stroke={P.drumDark} strokeWidth={2} />
        <path d={SHEDP.drumLid} fill={P.drumDark} />
        <path d={SHEDP.potLeaves} fill="url(#pg-leaf)" />
        <path d={SHEDP.pots} fill="url(#pg-pot)" />
        <path d={SHEDP.potRims} fill={P.terracottaDark} />
        <g>
          <path
            d={SHEDP.can.handle}
            fill="none"
            stroke="#7d888f"
            strokeWidth={3}
          />
          <path d={SHEDP.can.spout} fill="url(#pg-tin)" />
          <path d={SHEDP.can.body} fill="url(#pg-tin)" />
          <path d={SHEDP.can.rose} fill="#9aa5ab" />
        </g>

        {/* the mango tree's trunk, its dappled shade */}
        <path
          d={MANGO.dapples}
          fill="#fff4c2"
          opacity={0.22}
          filter="url(#pg-soft)"
        />
        <path d={MANGO.trunk + MANGO.branch} fill="#4a3826" />

        {/* grass */}
        <path d={GROUND.blades[0]} fill={P.bladeDeep} />
        <path d={GROUND.blades[1]} fill={P.blade} />
        <path d={GROUND.blades[2]} fill={P.bladeLit} opacity={0.85} />

        {/* the plot: soil, its grain, the furrows, pebbles, the seeds sown, the wooden edge */}
        <path d={GROUND.soil} fill="url(#pg-soil)" />
        <g clipPath="url(#pg-soilclip)">
          <rect
            x={0}
            y={GROUND.back - 4}
            width={W}
            height={GROUND.front - GROUND.back + 8}
            filter="url(#pg-grain)"
            opacity={0.55}
          />
        </g>
        <path
          d={GROUND.troughs}
          stroke={P.trough}
          strokeWidth={7}
          opacity={0.6}
          filter="url(#pg-soft)"
        />
        <path d={GROUND.ridges} fill="url(#pg-ridge)" />
        <path
          d={GROUND.ridgeLit}
          stroke="#a77650"
          strokeWidth={1.4}
          opacity={0.65}
        />
        <path d={GROUND.pebbles} fill={P.pebble} opacity={0.75} />
        <path d={seeds} fill="#d9c3a4" />
        <path d={GROUND.edge} fill="url(#pg-plank)" />
        <path d={GROUND.edgeLines} stroke={P.plankLine} strokeWidth={1.2} />

        {/* wooden markers at the furrows' ends */}
        {[1, 3, 5].map((r) => {
          const [x, y] = cellAt(-2.6, r);
          const s = rowScale(r);
          return (
            <g
              key={r}
              transform={`translate(${f(x)} ${f(y)}) scale(${f(0.7 + s * 0.4)})`}
            >
              <path d="M-1.5 4V-14h3V4Z" fill={P.plankDark} />
              <path
                d="M-15 -28H15V-14H-15Z"
                fill="#e8d9b8"
                stroke={P.plankLine}
                strokeWidth={1}
              />
              <text
                y={-17.5}
                textAnchor="middle"
                fill="#3a2a1c"
                className="type-micro"
                style={{ fontSize: 9.5, fontWeight: 700 }}
              >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][r]}
              </text>
            </g>
          );
        })}

        {/* the path: flagstones, moss between, the months; the longest streak's stepping stones */}
        <path
          d={GROUND.stones}
          fill="url(#pg-stone)"
          stroke={P.stoneDark}
          strokeWidth={0.8}
        />
        <path
          d={GROUND.gaps}
          fill="none"
          stroke={P.moss}
          strokeWidth={3}
          opacity={0.75}
        />
        {streak.map((c) => {
          const [x] = cellAt(c, 6);
          return (
            <path
              key={c}
              d={`M${f(x - 10)} ${GROUND.front + 22}a10 4 0 1 0 20 0a10 4 0 1 0 -20 0Z`}
              fill="#e6dccb"
              stroke={P.stoneDark}
              strokeWidth={1}
            />
          );
        })}
        {months.map((m, i) => (
          <text
            key={i}
            x={f(m.x)}
            y={668}
            textAnchor="middle"
            fill="#4a3a2a"
            className="type-micro"
            style={{ fontSize: 11, fontWeight: 700 }}
          >
            {m.label}
          </text>
        ))}
      </svg>
      {/* what moves: the plants and butterflies, the sprinkler, the pollen (its own layer, so the
        breeze repaints only this) */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute inset-0 size-full"
        style={{ willChange: "transform" }}
      >
        {/* the plants, back furrows first */}
        {plants.map((d) => (
          <PaintedDay
            key={d.date}
            d={d}
            prize={d.count === stats.busiest?.count}
          />
        ))}

        {/* butterflies by the tallest plants */}
        {tall.map((d, i) => {
          const [x, y] = cellAt(d.week, d.weekday);
          const s = rowScale(d.weekday) * GROW;
          const h = (d.count === stats.busiest?.count ? 130 : 56) * s;
          return (
            <g
              key={d.date}
              data-butterfly=""
              transform={`translate(${f(x + (i % 2 ? -22 : 24))} ${f(y - h - 6 - i * 8)}) rotate(${i % 2 ? -12 : 14}) scale(${f(0.7 + s * 0.2)})`}
            >
              <g data-wing="">
                <path
                  d={BUTTERFLYP.hind}
                  fill={P.butterfly}
                  stroke={P.butterflyVein}
                  strokeWidth={0.8}
                />
                <path
                  d={BUTTERFLYP.fore}
                  fill={P.butterfly}
                  stroke={P.butterflyVein}
                  strokeWidth={0.8}
                />
                <path
                  d={BUTTERFLYP.veins}
                  stroke={P.butterflyVein}
                  strokeWidth={0.6}
                />
                <path d={BUTTERFLYP.spots} fill="#ffffff" />
              </g>
              <path d={BUTTERFLYP.body} fill={P.butterflyVein} />
              <path
                d={BUTTERFLYP.antennae}
                fill="none"
                stroke={P.butterflyVein}
                strokeWidth={0.7}
              />
            </g>
          );
        })}

        {/* the traveling sprinkler, its hose and its water */}
        <path
          data-hose=""
          d={hoseTo(SPRAY_REST)}
          fill="none"
          stroke={P.hose}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <g data-spray="" transform={`translate(${SPRAY_REST} ${SPRAY_Y})`}>
          <g data-arcs="" opacity={0}>
            <path d={SPRINKLER.mist} fill="url(#pg-mist)" />
            <path
              d={SPRINKLER.arcs}
              fill="none"
              stroke={P.water}
              strokeWidth={1.8}
              strokeDasharray="2 7"
              strokeLinecap="round"
            />
          </g>
          <path d={SPRINKLER.wheelL + SPRINKLER.wheelR} fill="#2b2b2b" />
          <path d={SPRINKLER.hubL + SPRINKLER.hubR} fill="#9aa5ab" />
          <path d={SPRINKLER.body} fill="url(#pg-iron)" />
          <path
            d={SPRINKLER.bodyLit}
            fill="none"
            stroke="#a6e0ad"
            strokeWidth={1.4}
            opacity={0.8}
          />
          <path d={SPRINKLER.mast} fill="#c9cfd3" />
          <g data-arm="">
            <path d={SPRINKLER.arm} fill="#c9cfd3" />
            <path d={SPRINKLER.nozzles} fill="#e0b25a" />
          </g>
          <path d={SPRINKLER.cap} fill="#e0b25a" />
        </g>

        {/* pollen in the light */}
        {MOTES.map((m, i) => (
          <circle
            key={i}
            data-mote=""
            cx={f(m.x)}
            cy={f(m.y)}
            r={f(m.r)}
            fill={P.pollen}
            opacity={0.55}
          />
        ))}
      </svg>
      {/* the still foreground: grass close to the eye, the mango's canopy, the light */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 size-full"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {/* close to the eye: blurred grass; the mango's canopy over the top left */}
        <path
          d={NEAR_GRASS}
          fill={P.bladeDeep}
          filter="url(#pg-blur)"
          opacity={0.9}
        />
        <path d={MANGO.deep} fill={P.canopyDeep} />
        <path d={MANGO.mid} fill={P.canopy} />
        <path d={MANGO.lit} fill={P.canopyLit} opacity={0.7} />
        <path d={MANGO.leaves} fill={P.canopy} />

        <rect width={W} height={H} fill="url(#pg-warm)" pointerEvents="none" />
        <rect
          width={W}
          height={H}
          fill="url(#pg-vignette)"
          pointerEvents="none"
        />
      </svg>
    </div>
  );
}

/** One day's plant, painted: by GitHub's level (a seedling, a young plant, a chili plant, a
 *  marigold in flower); the busiest day is the sunflower. */
function PaintedDay({ d, prize }: { d: GardenDay; prize: boolean }) {
  const [x, y] = cellAt(d.week, d.weekday);
  const s = rowScale(d.weekday) * GROW;
  const r = rng(hash(d.date));
  const flip = r() > 0.5 ? -1 : 1;
  if (prize) {
    const S = SUNFLOWERP;
    return (
      <g transform={`translate(${f(x)} ${f(y)}) scale(${f(s)})`}>
        <g data-grow="" data-col={d.week}>
          <ellipse cx={-14} cy={2} rx={34} ry={7} fill="url(#pg-shade)" />
          <g data-sway="">
            <path
              d={S.stem}
              fill="none"
              stroke={P.stem}
              strokeWidth={4}
              strokeLinecap="round"
            />
            {S.leaves.map((l, i) => (
              <path
                key={i}
                d={l}
                fill="url(#pg-leaf)"
                stroke="#2a5a1e"
                strokeWidth={0.6}
              />
            ))}
            <path d={S.ribs} stroke="#2f6a22" strokeWidth={0.8} opacity={0.7} />
            {S.back.map((p, i) => (
              <path key={`b${i}`} d={p} fill={P.petalDeep} />
            ))}
            {S.petals.map((p, i) => (
              <path
                key={i}
                d={p}
                fill="url(#pg-petal)"
                stroke="#c97a06"
                strokeWidth={0.4}
              />
            ))}
            <path d={S.head} fill="url(#pg-seedhead)" />
            <path d={S.seeds} fill="#8a5a2a" opacity={0.8} />
          </g>
        </g>
      </g>
    );
  }
  const plant = paintedPlant(
    Math.max(1, Math.min(4, d.level || 1)),
    hash(d.date),
  );
  return (
    <g transform={`translate(${f(x)} ${f(y)}) scale(${f(s * flip)} ${f(s)})`}>
      <g data-grow="" data-col={d.week}>
        <ellipse
          cx={-6}
          cy={1.5}
          rx={8 + plant.height * 0.3}
          ry={4}
          fill="url(#pg-shade)"
        />
        <g data-sway="">
          <path
            d={plant.stem}
            fill="none"
            stroke={P.stem}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          {plant.dark.map((l, i) => (
            <path key={`d${i}`} d={l} fill="url(#pg-leafdark)" />
          ))}
          {plant.leaves.map((l, i) => (
            <path
              key={i}
              d={l}
              fill="url(#pg-leaf)"
              stroke="#2a5a1e"
              strokeWidth={0.4}
            />
          ))}
          {plant.ribs ? (
            <path
              d={plant.ribs}
              stroke="#3f7a28"
              strokeWidth={0.5}
              opacity={0.6}
            />
          ) : null}
          {plant.fruit ? <path d={plant.fruit} fill="url(#pg-chili)" /> : null}
          {plant.fruitLit ? (
            <path
              d={plant.fruitLit}
              fill="none"
              stroke="#ffb3a1"
              strokeWidth={0.7}
              opacity={0.8}
            />
          ) : null}
          {plant.flowers?.map((fl, i) => (
            <g key={i}>
              <path d={ruffle(fl.x, fl.y, fl.r, 16)} fill={P.marigoldEdge} />
              <path
                d={ruffle(fl.x, fl.y - 0.4, fl.r * 0.86, 14)}
                fill="url(#pg-marigold)"
              />
              <path
                d={ruffle(fl.x - 0.3, fl.y - 0.8, fl.r * 0.6, 11)}
                fill={P.marigold}
                stroke={P.marigoldDeep}
                strokeWidth={0.5}
              />
              <path
                d={ruffle(fl.x - 0.5, fl.y - 1.1, fl.r * 0.34, 8)}
                fill="#ffd25e"
                stroke={P.marigoldDeep}
                strokeWidth={0.4}
              />
            </g>
          ))}
        </g>
      </g>
    </g>
  );
}
