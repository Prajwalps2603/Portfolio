"use client";

/**
 * THE GARDEN (the /garden page): Prajwal's real GitHub contribution calendar grown as a garden:
 * painted (./PaintedGarden, ./paintArt: an anime-like painted afternoon, his request) and, in sketch
 * mode, the pencil drawing below (./gardenArt). Seven furrows of dark soil in perspective, Sunday at the back, one place per day
 * of the season: a day with contributions is a plant (GitHub's own level: a sprout, a seedling, a
 * leafy bush, a plant in flower), a day without is a sown seed, a day still to come is bare soil.
 * The busiest day is a prize sunflower with a rosette; the longest streak is a run of stepping
 * stones on the path. Around it a real garden: sky, hills, a tree line, the potting shed, the
 * picket fence with two mynahs, the scarecrow, the wheelbarrow and the gardener.
 *
 * THE TIME-LAPSE: when the garden comes on screen the season grows week by week (~6s) while the
 * gardener walks the path watering each week and the sun crosses the sky; the butterflies come
 * last. Over 5s, so a visible pause control (Pause / Play / Grow it again), run through the play
 * gate. Choosing another season replants it. Hover a plant (or focus the garden and use the arrow
 * keys) for its tag: the contributions and the date. Below it, the garden signs: the season's
 * numbers. Reduced motion, sketch mode (a pencil drawing) and no JS: fully grown (the markup).
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  dayLabel,
  garden,
  monthOf,
  shortDate,
  statsOf,
  type GardenDay,
  type GardenSeason,
} from "@/content/garden";
import { IconButton } from "@/components/ui";
import { Pause, Play, Replay } from "@/components/icons";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { EASE } from "@/lib/motion/eases";
import { safeStart } from "@/lib/motion/splitArrive";
import { useReducedMotion } from "@/lib/motion/media";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { usePlayGate } from "@/components/diagram/playGate";
import {
  BLOOM_HEART,
  BUTTERFLY,
  FENCE,
  GARDENER,
  H,
  PATH,
  PLANTS,
  PLOT,
  ROSETTE,
  SCARECROW,
  SHED,
  SKY,
  SUNFLOWER,
  W,
  WHEELBARROW,
  WEEKS,
  birdAt,
  cellAt,
  rng,
  rowAt,
  rowScale,
  tagAt,
  weekAt,
} from "./gardenArt";
import {
  GROW as PAINT_GROW,
  PaintedGarden,
  SPRAY_REST,
  SPRAY_Y,
  sunPaint,
} from "./PaintedGarden";
import { MOTES, hoseTo } from "./paintArt";
import dynamic from "next/dynamic";

/** The 3D forest (three.js), loaded only on this page and only where WebGL works. */
const Garden3D = dynamic(() => import("./Garden3D"), { ssr: false });

const f = (n: number) => Math.round(n * 10) / 10;
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
/** A plant's height (to place its tag above it). */
const HEIGHT: Record<number, number> = { 0: 6, 1: 12, 2: 26, 3: 46, 4: 58 };
const SUN_HEIGHT = 124;
/** Plants are drawn bigger than a day's spot, so a sparse season still reads as a garden. */
const GROW = 1.4;
/** The time-lapse: a week every STEP seconds after START. */
const START = 0.35;
const STEP = 0.1;
/** The gardener's walk: from the first week to beside the wheelbarrow. */
const WALK_FROM = cellAt(0, 6)[0] - 90;
const WALK_TO = 1028;
const walkX = (p: number) =>
  Math.min(WALK_TO, WALK_FROM + (cellAt(WEEKS - 1, 6)[0] - 64 - WALK_FROM) * p);
/** The sun crosses the sky as the season grows. */
const sunAt = (p: number): [number, number] => [
  170 + 820 * p,
  150 - Math.sin(Math.PI * Math.min(1, p * 0.92)) * 96,
];
const BLOOM_COLOURS = [
  "fill-tangerine",
  "fill-blue",
  "fill-card",
  "fill-tangerine",
];

type Phase = "waiting" | "growing" | "done";

export function GardenScene() {
  const host = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { on: sketch } = useSketchMode();
  const still = reduced || sketch;
  const live = usePlayGate(scroller, { threshold: 0.15 });
  const [key, setKey] = useState(garden.seasons[0]?.key ?? "last");
  const season = garden.seasons.find((s) => s.key === key) ?? garden.seasons[0];
  const stats = useMemo(() => statsOf(season), [season]);
  const [phase, setPhase] = useState<Phase>("done");
  const [paused, setPaused] = useState(false);
  const started = useRef(false);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const userScrolled = useRef(false);
  const breezeOn = useRef(false);
  // the 3D forest (WebGL, not in sketch mode); the painted garden is its poster and its fallback
  const [webgl, setWebgl] = useState(false);
  const [ready3d, setReady3d] = useState(false);
  const [growToken, setGrowToken] = useState(0);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
  }, []);
  const three = webgl && !sketch;
  // in 3D the time-lapse starts when the forest comes on screen (and again with a new season)
  useEffect(() => {
    if (!three) return;
    if (reduced) {
      setPhase("done");
      return;
    }
    const view = scroller.current;
    if (!view) return;
    if (started.current) {
      setPhase("growing");
      setGrowToken((t) => t + 1);
      return;
    }
    setPhase("waiting");
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        started.current = true;
        setPhase("growing");
        io.disconnect();
      },
      { threshold: 0.25 },
    );
    io.observe(view);
    return () => io.disconnect();
  }, [three, reduced, key]);

  // the tag: the day under the pointer, or the one chosen with the keys
  const [hover, setHover] = useState<GardenDay | null>(null);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState<number>(-1);
  const grid = useMemo(() => {
    const g = new Map<string, number>();
    season.days.forEach((d, i) => g.set(`${d.week}:${d.weekday}`, i));
    return g;
  }, [season]);
  const lastPast = useMemo(() => {
    for (let i = season.days.length - 1; i >= 0; i--)
      if (!season.days[i].future) return i;
    return season.days.length - 1;
  }, [season]);
  const shown = hover ?? (focused && active >= 0 ? season.days[active] : null);
  /** The days with a plant, back furrows first (for the pointer). */
  const growing = useMemo(
    () =>
      season.days
        .filter((d) => d.count > 0 && !d.future)
        .sort((a, b) => a.weekday - b.weekday || a.week - b.week),
    [season],
  );

  useGSAP(
    () => {
      const box = host.current;
      const view = scroller.current;
      if (!box || !view || still || three) return;
      const one = <T extends Element>(s: string) => box.querySelector<T>(s);
      const man = one<SVGGElement>("[data-gardener]");
      const legs = Array.from(box.querySelectorAll<SVGGElement>("[data-leg]"));
      const drops = Array.from(
        box.querySelectorAll<SVGCircleElement>("[data-drop]"),
      );
      const sun = one<SVGElement>("[data-sun]");
      const plants = Array.from(
        box.querySelectorAll<SVGGElement>("[data-grow]"),
      );
      const flies = Array.from(
        box.querySelectorAll<SVGGElement>("[data-butterfly]"),
      );
      // the painted garden's: the traveling sprinkler, its hose, arm and water; the breeze
      const spray = one<SVGGElement>("[data-spray]");
      const hose = one<SVGPathElement>("[data-hose]");
      const arm = one<SVGGElement>("[data-arm]");
      const arcs = one<SVGGElement>("[data-arcs]");
      const sways = Array.from(
        box.querySelectorAll<SVGGElement>("[data-sway]"),
      );
      const wings = Array.from(
        box.querySelectorAll<SVGGElement>("[data-wing]"),
      );
      const motes = Array.from(
        box.querySelectorAll<SVGCircleElement>("[data-mote]"),
      );
      const clouds = Array.from(
        box.querySelectorAll<SVGGElement>("[data-cloud]"),
      );
      if (!sun) return;
      const set = (n: Element, a: string, v: string) => n.setAttribute(a, v);

      const draw = (p: number, walking: boolean) => {
        const t = performance.now() / 1000;
        let x = walkX(p);
        if (man) {
          set(man, "transform", `translate(${f(x)} ${PATH.walk})`);
          legs.forEach((l, i) =>
            set(
              l,
              "transform",
              `rotate(${walking ? f(Math.sin(t * 11 + i * Math.PI) * 20) : 0} 0 -38)`,
            ),
          );
          drops.forEach((d, k) => {
            const ph = (t * 1.6 + k / drops.length) % 1;
            set(d, "cx", f(GARDENER.water[0] + 4 + ph * 10) + "");
            set(d, "cy", f(GARDENER.water[1] + ph * 46) + "");
            set(d, "opacity", walking ? (1 - ph * 0.6).toFixed(2) : "0");
          });
          const [sx, sy] = sunAt(p);
          set(sun, "cx", f(sx) + "");
          set(sun, "cy", f(sy) + "");
        }
        if (spray) {
          // the sprinkler rolls along the path under the week that is growing
          x = walking
            ? Math.min(SPRAY_REST, cellAt(p * (WEEKS - 1), 6)[0])
            : SPRAY_REST;
          set(spray, "transform", `translate(${f(x)} ${SPRAY_Y})`);
          if (hose) set(hose, "d", hoseTo(x));
          if (arm)
            set(
              arm,
              "transform",
              walking ? `rotate(${f((t * 540) % 360)} 0 -46)` : "",
            );
          if (arcs) {
            set(arcs, "opacity", walking ? "1" : "0");
            arcs
              .querySelectorAll("path[stroke-dasharray]")
              .forEach((a) =>
                a.setAttribute("stroke-dashoffset", f(-t * 60) + ""),
              );
          }
          const [sx, sy] = sunPaint(p);
          set(sun, "transform", `translate(${f(sx)} ${f(sy)})`);
        }
        // phones: the garden scrolls sideways; follow the gardener (or the sprinkler) unless the visitor took over
        if (
          walking &&
          !userScrolled.current &&
          view.scrollWidth > view.clientWidth + 4
        ) {
          view.scrollLeft =
            (x / W) * view.scrollWidth - view.clientWidth * 0.45;
        }
      };

      // the breeze (painted only): plants sway, wings beat, pollen drifts, clouds creep; it runs
      // while the garden is on screen and not paused (the pause control stops it too)
      let last = 0;
      const breeze = () => {
        if (!breezeOn.current) return;
        const t = performance.now() / 1000;
        // 30 frames a second is plenty for a breeze
        if (t - last < 1 / 30) return;
        last = t;
        sways.forEach((g, i) =>
          set(
            g,
            "transform",
            `rotate(${f(Math.sin(t * 1.3 + i * 1.7) * 2.2)})`,
          ),
        );
        wings.forEach((w, i) =>
          set(
            w,
            "transform",
            `scale(${(0.35 + Math.abs(Math.sin(t * 9 + i * 2)) * 0.65).toFixed(2)} 1)`,
          ),
        );
        motes.forEach((m, i) => {
          const d = MOTES[i];
          if (!d) return;
          const y = ((((d.y - t * d.speed) % 420) + 420) % 420) + 200;
          set(m, "cy", f(y) + "");
          set(m, "cx", f(d.x + Math.sin(t * 0.6 + d.phase) * 14) + "");
        });
        clouds.forEach((c, i) =>
          set(c, "transform", `translate(${f(Math.sin(t * 0.05 + i) * 18)} 0)`),
        );
      };
      if (spray) gsap.ticker.add(breeze);

      const weeks = Math.max(1, season.weeks);
      const end = START + (weeks - 1) * STEP;
      const proxy = { p: 0 };
      const t = gsap.timeline({
        paused: true,
        onComplete: () => {
          draw(1, false);
          setPhase("done");
        },
      });
      plants.forEach((el) => {
        const col = Number(el.dataset.col) || 0;
        t.fromTo(
          el,
          { scale: 0, transformOrigin: "50% 100%" },
          { scale: 1, duration: 0.55, ease: EASE.arrive },
          START + col * STEP + 0.04,
        );
      });
      t.fromTo(
        proxy,
        { p: 0 },
        {
          p: 1,
          duration: end,
          ease: "none",
          onUpdate: () => draw(proxy.p, true),
        },
        0,
      );
      t.fromTo(
        flies,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: EASE.arrive, stagger: 0.12 },
        end + 0.35,
      );
      tl.current = t;
      draw(0, false);
      setPaused(false);

      if (started.current) setPhase("growing");
      else {
        setPhase("waiting");
        ScrollTrigger.create({
          trigger: view,
          start: () => safeStart(view, "top 85%"),
          once: true,
          onEnter: () => {
            started.current = true;
            setPhase("growing");
          },
        });
      }
      return () => {
        tl.current = null;
        gsap.ticker.remove(breeze);
        // back to the markup: grown, the sprinkler (or the gardener) at rest, the sun high, still
        draw(1, false);
        sways.forEach((g) => g.removeAttribute("transform"));
        wings.forEach((w) => w.removeAttribute("transform"));
        clouds.forEach((c) => c.removeAttribute("transform"));
        motes.forEach((m, i) => {
          const d = MOTES[i];
          if (!d) return;
          set(m, "cx", f(d.x) + "");
          set(m, "cy", f(d.y) + "");
        });
      };
    },
    { scope: host, dependencies: [key, still, three], revertOnUpdate: true },
  );

  useEffect(() => {
    breezeOn.current = live && !paused && !still;
    const t = tl.current;
    if (!t) return;
    if (phase === "growing" && live && !paused) t.play();
    else t.pause();
  }, [phase, live, paused, key, still]);

  const regrow = () => {
    userScrolled.current = false;
    tl.current?.restart().pause();
    setPaused(false);
    setPhase("growing");
    setGrowToken((t) => t + 1);
  };

  /* ---- the tag: pointer and keys ---- */
  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const m = svg.getScreenCTM();
    if (!m) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    // a plant under the pointer first (front furrows first: they stand in front), then the furrow
    const g = sketch ? GROW : PAINT_GROW;
    for (let k = growing.length - 1; k >= 0; k--) {
      const d = growing[k];
      const [x, y] = cellAt(d.week, d.weekday);
      const sc = rowScale(d.weekday) * g;
      const h =
        (d.count === stats.busiest?.count
          ? SUN_HEIGHT
          : (HEIGHT[d.level] ?? 12)) * sc;
      const w = Math.max(18 * sc, h * 0.55);
      if (p.x > x - w / 2 && p.x < x + w / 2 && p.y > y - h && p.y < y + 6 * sc)
        return setHover(d);
    }
    const r = rowAt(p.y);
    if (r === null) return setHover(null);
    const c = weekAt(p.x, r);
    const i = grid.get(`${c}:${r}`);
    setHover(i === undefined ? null : season.days[i]);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const cur = season.days[active >= 0 ? active : lastPast];
    if (!cur) return;
    let [c, r] = [cur.week, cur.weekday];
    if (e.key === "ArrowLeft") c--;
    else if (e.key === "ArrowRight") c++;
    else if (e.key === "ArrowUp") r--;
    else if (e.key === "ArrowDown") r++;
    else if (e.key === "Home") return (e.preventDefault(), setActive(0));
    else if (e.key === "End") return (e.preventDefault(), setActive(lastPast));
    else return;
    e.preventDefault();
    // the keys take over from the pointer
    setHover(null);
    const i = grid.get(`${c}:${r}`);
    if (i !== undefined) setActive(i);
  };

  const ink = !sketch;
  const pen = (a: string, b = "fill-none stroke-graphite") => (ink ? a : b);
  const plants = season.days
    .filter((d) => d.count > 0 && !d.future)
    .sort((a, b) => a.weekday - b.weekday || a.week - b.week);
  const seeds = season.days
    .filter((d) => d.count === 0 && !d.future)
    .map((d) => {
      const [x, y] = cellAt(d.week, d.weekday);
      const s = rowScale(d.weekday);
      return `M${f(x - 2.2 * s)} ${f(y - 1)}a${f(2.2 * s)} ${f(1.3 * s)} 0 1 0 ${f(4.4 * s)} 0a${f(2.2 * s)} ${f(1.3 * s)} 0 1 0 ${f(-4.4 * s)} 0Z`;
    })
    .join("");
  // the months along the front, at each month's first week
  const months: { x: number; label: string }[] = [];
  let prevMonth = "";
  let prevCol = -9;
  for (const d of season.days) {
    // the first day of each week's column
    if (d.weekday !== 0 && d !== season.days[0]) continue;
    const m = d.date.slice(0, 7);
    if (m === prevMonth) continue;
    prevMonth = m;
    if (d.week - prevCol < 3) continue;
    months.push({ x: cellAt(d.week, 6)[0], label: monthOf(d.date) });
    prevCol = d.week;
  }
  const streakCols =
    stats.streak && stats.streak.days > 1
      ? season.days.filter(
          (d) => d.date >= stats.streak!.from && d.date <= stats.streak!.to,
        )
      : [];
  const stones = [...new Set(streakCols.map((d) => d.week))];
  const tall = [...plants].sort((a, b) => b.count - a.count).slice(0, 3);
  const bird1 = birdAt(452, 272);
  const bird2 = birdAt(808, 272, true);
  const tagPos = shown
    ? (() => {
        const [x, y] = cellAt(shown.week, shown.weekday);
        const h =
          shown.date === stats.prize
            ? SUN_HEIGHT
            : (HEIGHT[shown.count > 0 ? shown.level : 0] ?? 8);
        return {
          left: `${(x / W) * 100}%`,
          top: `${((y - h * (ink ? PAINT_GROW : GROW) * rowScale(shown.weekday) - 6) / H) * 100}%`,
        };
      })()
    : null;

  return (
    <div ref={host} data-qa="garden" data-phase={still ? "done" : phase}>
      {/* the seasons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Season"
          className="flex flex-wrap gap-1.5"
        >
          {garden.seasons.map((s) => (
            <button
              key={s.key}
              role="tab"
              type="button"
              aria-selected={s.key === key}
              aria-controls="garden-plot"
              data-qa="garden-season"
              onClick={() => {
                setHover(null);
                setActive(-1);
                userScrolled.current = false;
                setKey(s.key);
              }}
              className="type-ui min-h-11 rounded-pill border border-line-strong px-4 transition-colors duration-(--dur-ui) ease-arrive hover:border-ink aria-selected:border-ink aria-selected:bg-ink aria-selected:font-semibold aria-selected:text-paper"
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="type-mono text-graphite">
          {garden.profile.replace("https://", "")} · public contributions ·
          updated {shortDate(garden.fetched)} {garden.fetched.slice(0, 4)}
        </p>
      </div>

      <div
        id="garden-plot"
        role="tabpanel"
        aria-label={`The garden: ${season.label}`}
        className="relative mt-5"
      >
        <div
          ref={scroller}
          data-lenis-prevent=""
          onPointerDown={() => void (userScrolled.current = true)}
          onWheel={() => void (userScrolled.current = true)}
          className={
            three
              ? "relative aspect-[1200/680] overflow-hidden rounded-[22px] border border-line-strong bg-card max-sm:aspect-[4/5]"
              : "overflow-x-auto overscroll-x-contain rounded-[22px] border border-line-strong bg-card [scrollbar-width:thin]"
          }
        >
          <div
            tabIndex={0}
            role="group"
            aria-label={`${season.label}: ${stats.total} contributions on ${stats.bloom} days. Use the arrow keys to walk the furrows, one day at a time.`}
            onKeyDown={onKey}
            onFocus={() => {
              setFocused(true);
              if (active < 0) setActive(lastPast);
            }}
            onBlur={() => setFocused(false)}
            className={
              three
                ? "absolute inset-0 rounded-[22px] focus-visible:outline-offset-[-3px]"
                : "relative min-w-[880px] rounded-[22px] focus-visible:outline-offset-[-3px]"
            }
          >
            {three ? (
              <>
                {/* the painted garden as the poster, until the forest has drawn */}
                <div
                  className={`absolute inset-0 transition-opacity duration-700 ${ready3d ? "opacity-0" : ""}`}
                >
                  <PaintedGarden
                    season={season}
                    stats={stats}
                    onPointerMove={() => {}}
                    onPointerLeave={() => {}}
                  />
                </div>
                <Garden3D
                  season={season}
                  stats={stats}
                  playing={live && !paused}
                  growing={phase === "growing"}
                  growToken={growToken}
                  still={reduced}
                  shown={shown}
                  onHover={setHover}
                  onGrown={() => setPhase("done")}
                  onReady={() => setReady3d(true)}
                />
              </>
            ) : ink ? (
              <PaintedGarden
                season={season}
                stats={stats}
                onPointerMove={onMove}
                onPointerLeave={() => setHover(null)}
              />
            ) : (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                aria-hidden="true"
                focusable="false"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="block h-auto w-full"
                onPointerMove={onMove}
                onPointerLeave={() => setHover(null)}
              >
                {/* the sky, the sun, clouds, the hills, the tree line */}
                {ink ? (
                  <rect width={W} height={H} className="fill-blue-soft" />
                ) : null}
                <circle
                  data-sun=""
                  cx={f(sunAt(1)[0])}
                  cy={f(sunAt(1)[1])}
                  r={26}
                  strokeWidth={1.5}
                  className={pen("fill-tangerine stroke-ink")}
                />
                <path
                  d={SKY.clouds}
                  strokeWidth={1.2}
                  className={pen(
                    "fill-card stroke-line-strong",
                    "stroke-pencil",
                  )}
                />
                <path
                  d={SKY.hills}
                  strokeWidth={1.3}
                  className={pen("fill-line stroke-pencil", "stroke-pencil")}
                />
                <path
                  d={SKY.palms.trunk}
                  strokeWidth={1}
                  className={pen("fill-graphite stroke-ink")}
                />
                <path
                  d={SKY.palms.fronds}
                  strokeWidth={3.2}
                  className={pen("stroke-lime-deep", "stroke-graphite")}
                />
                <path
                  d={SKY.canopies}
                  strokeWidth={1.2}
                  className={pen("fill-lime-deep stroke-ink")}
                />

                {/* the lawn */}
                <path
                  d={`M0 262H${W}V${H}H0Z`}
                  className={pen("fill-lime-soft", "")}
                />

                {/* the fence, the birds on it */}
                <path
                  d={FENCE.rails}
                  strokeWidth={5}
                  className={pen("stroke-graphite", "stroke-pencil")}
                />
                <path
                  d={FENCE.rails}
                  strokeWidth={3}
                  className={pen("stroke-card", "")}
                />
                <path
                  d={FENCE.pickets}
                  strokeWidth={1.2}
                  className={pen("fill-card stroke-graphite")}
                />
                <path
                  d={FENCE.gate}
                  strokeWidth={2.2}
                  className={pen("stroke-graphite")}
                />
                <path
                  d={FENCE.latch}
                  className={pen("fill-ink", "stroke-graphite")}
                />
                {[bird1, bird2].map((b, i) => (
                  <g key={i}>
                    <path
                      d={b.legs}
                      strokeWidth={1.4}
                      className={pen(
                        "stroke-tangerine-deep",
                        "stroke-graphite",
                      )}
                    />
                    <path
                      d={b.body}
                      strokeWidth={1.1}
                      className={pen("fill-graphite stroke-ink")}
                    />
                    <path
                      d={b.wing}
                      strokeWidth={1.2}
                      className={pen("stroke-card", "stroke-pencil")}
                    />
                    <path
                      d={b.head}
                      className={pen("fill-ink", "stroke-graphite")}
                    />
                    <path
                      d={b.beak}
                      className={pen("fill-lime", "stroke-graphite")}
                    />
                    <path
                      d={b.eye}
                      className={pen("fill-lime", "stroke-graphite")}
                    />
                  </g>
                ))}

                {/* the potting shed, the barrel, the tools, the pots */}
                <path
                  d={SHED.body}
                  strokeWidth={1.6}
                  className={pen("fill-card stroke-ink")}
                />
                <path
                  d={SHED.planks}
                  strokeWidth={0.9}
                  className={pen("stroke-pencil")}
                />
                <path
                  d={SHED.roof}
                  strokeWidth={1.6}
                  className={pen("fill-tangerine stroke-ink")}
                />
                <path
                  d={SHED.tiles}
                  strokeWidth={0.8}
                  className={pen("stroke-ink", "stroke-pencil")}
                  opacity={0.55}
                />
                <path
                  d={SHED.board}
                  strokeWidth={1.2}
                  className={pen("fill-ink stroke-ink")}
                />
                <text
                  x={SHED.boardText[0]}
                  y={SHED.boardText[1]}
                  textAnchor="middle"
                  className={`font-display ${ink ? "fill-lime" : "fill-graphite"}`}
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                  }}
                >
                  PRAJWAL&apos;S GARDEN
                </text>
                <path
                  d={SHED.door}
                  strokeWidth={1.6}
                  className={pen("fill-paper-2 stroke-ink")}
                />
                <path
                  d={SHED.doorPlanks}
                  strokeWidth={0.9}
                  className={pen("stroke-pencil")}
                />
                <path
                  d={SHED.knob}
                  className={pen("fill-ink", "stroke-graphite")}
                />
                <path
                  d={SHED.window}
                  strokeWidth={1.6}
                  className={pen("fill-blue-soft stroke-ink")}
                />
                <path
                  d={SHED.panes}
                  strokeWidth={1.4}
                  className={pen("stroke-ink", "stroke-graphite")}
                />
                <path
                  d={SHED.sill}
                  strokeWidth={1.2}
                  className={pen("fill-paper-2 stroke-ink")}
                />
                <path
                  d={SHED.sillPot}
                  strokeWidth={1.2}
                  className={pen("fill-tangerine-deep stroke-ink")}
                />
                <path
                  d={SHED.sillLeaves}
                  strokeWidth={2.4}
                  className={pen("stroke-lime-deep", "stroke-graphite")}
                />
                <path
                  d={SHED.tools}
                  strokeWidth={3}
                  className={pen("stroke-graphite")}
                />
                <path
                  d={SHED.rake}
                  strokeWidth={1.6}
                  className={pen("stroke-graphite")}
                />
                <path
                  d={SHED.spade}
                  strokeWidth={1.2}
                  className={pen("fill-fog stroke-ink")}
                />
                <path
                  d={SHED.barrel}
                  strokeWidth={1.5}
                  className={pen("fill-blue stroke-ink")}
                />
                <path
                  d={SHED.hoops}
                  strokeWidth={2}
                  className={pen("stroke-ink", "stroke-graphite")}
                />
                <path
                  d={SHED.potLeaves}
                  strokeWidth={2.6}
                  className={pen("stroke-lime-deep", "stroke-graphite")}
                />
                <path
                  d={SHED.pots}
                  strokeWidth={1.3}
                  className={pen("fill-tangerine-deep stroke-ink")}
                />

                {/* the scarecrow */}
                <path
                  d={SCARECROW.pole}
                  strokeWidth={4}
                  className={pen("stroke-graphite")}
                />
                <path
                  d={SCARECROW.sleeves}
                  strokeWidth={1.3}
                  className={pen("fill-blue stroke-ink")}
                />
                <path
                  d={SCARECROW.shirt}
                  strokeWidth={1.3}
                  className={pen("fill-blue stroke-ink")}
                />
                <path
                  d={SCARECROW.patch}
                  strokeWidth={1}
                  className={pen("fill-tangerine stroke-ink")}
                />
                <path
                  d={SCARECROW.straw}
                  strokeWidth={1.6}
                  className={pen("stroke-lime-deep", "stroke-pencil")}
                />
                <path
                  d={SCARECROW.head}
                  strokeWidth={1.3}
                  className={pen("fill-paper-2 stroke-ink")}
                />
                <path
                  d={SCARECROW.face}
                  strokeWidth={1.2}
                  className={pen("fill-ink stroke-ink", "stroke-graphite")}
                />
                <path
                  d={SCARECROW.hat}
                  strokeWidth={2.4}
                  className={pen("fill-ink stroke-ink", "stroke-graphite")}
                />

                {/* the plot: soil, furrows, clods, the seeds sown */}
                <path
                  d={PLOT.soil}
                  strokeWidth={1.6}
                  className={pen("fill-ink-2 stroke-ink")}
                />
                <path
                  d={PLOT.mounds}
                  className={pen("fill-graphite", "stroke-pencil")}
                />
                {ink ? (
                  <path
                    d={PLOT.soil}
                    className="fill-tangerine-deep"
                    opacity={0.22}
                  />
                ) : null}
                <path
                  d={PLOT.shadows}
                  strokeWidth={2}
                  className={pen("stroke-ink", "")}
                  opacity={0.6}
                />
                <path d={PLOT.clods} className={pen("fill-seam", "")} />
                <path d={seeds} className={pen("fill-fog", "fill-pencil")} />
                {[1, 3, 5].map((r) => {
                  const [x, y] = cellAt(-2.4, r);
                  const t = tagAt(x, y);
                  return (
                    <g key={r}>
                      <path
                        d={t.stake}
                        strokeWidth={2}
                        className={pen("stroke-card", "stroke-graphite")}
                      />
                      <path
                        d={t.tag}
                        strokeWidth={1}
                        className={pen("fill-card stroke-graphite")}
                      />
                      <text
                        x={x}
                        y={y - 15.5}
                        textAnchor="middle"
                        className={`type-micro ${ink ? "fill-ink" : "fill-graphite"}`}
                        style={{ fontSize: 9.5, fontWeight: 700 }}
                      >
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][r]}
                      </text>
                    </g>
                  );
                })}

                {/* the plants, back furrows first */}
                {plants.map((d) => (
                  <Plant
                    key={d.date}
                    d={d}
                    prize={d.count === stats.busiest?.count}
                    ribbon={d.date === stats.prize}
                    ink={ink}
                  />
                ))}
                {tall.map((d, i) => {
                  const [x, y] = cellAt(d.week, d.weekday);
                  const s = rowScale(d.weekday);
                  const h =
                    (d.date === stats.prize ? SUN_HEIGHT : HEIGHT[d.level]) *
                    s *
                    GROW;
                  return (
                    <g
                      key={d.date}
                      data-butterfly=""
                      transform={`translate(${f(x + (i % 2 ? -18 : 20))} ${f(y - h - 8 - i * 6)}) rotate(${i % 2 ? -14 : 12})`}
                    >
                      <path
                        d={BUTTERFLY.wings}
                        strokeWidth={0.9}
                        className={pen(
                          `${i % 2 ? "fill-blue" : "fill-tangerine"} stroke-ink`,
                        )}
                      />
                      <path
                        d={BUTTERFLY.body}
                        strokeWidth={1.3}
                        className={pen("stroke-ink", "stroke-graphite")}
                      />
                    </g>
                  );
                })}

                {/* the path, the months on it, the streak's stepping stones */}
                <path
                  d={PATH.gravel}
                  strokeWidth={1.2}
                  className={pen("fill-paper-2 stroke-pencil", "stroke-pencil")}
                />
                <path
                  d={PATH.stones}
                  className={pen("fill-line-strong", "fill-pencil")}
                />
                {stones.map((c) => {
                  const [x] = cellAt(c, 6);
                  return (
                    <path
                      key={c}
                      d={`M${f(x - 9)} ${PATH.top + 22}a9 4.5 0 1 0 18 0a9 4.5 0 1 0 -18 0Z`}
                      strokeWidth={1.2}
                      className={pen("fill-card stroke-graphite")}
                    />
                  );
                })}
                {months.map((m, i) => (
                  <text
                    key={i}
                    x={f(m.x)}
                    y={PATH.top + 12}
                    textAnchor="middle"
                    className={`type-micro ${ink ? "fill-graphite" : "fill-graphite"}`}
                    style={{ fontSize: 11, fontWeight: 700 }}
                  >
                    {m.label}
                  </text>
                ))}

                {/* the wheelbarrow */}
                <path
                  d={WHEELBARROW.legs}
                  strokeWidth={3}
                  className={pen("stroke-graphite")}
                />
                <path
                  d={WHEELBARROW.soil}
                  strokeWidth={1}
                  className={pen("fill-ink-2 stroke-ink")}
                />
                <path
                  d={WHEELBARROW.tray}
                  strokeWidth={1.5}
                  className={pen("fill-tangerine stroke-ink")}
                />
                <path
                  d={WHEELBARROW.wheel}
                  strokeWidth={1.5}
                  className={pen("fill-ink stroke-ink")}
                />
                <path
                  d={WHEELBARROW.hub}
                  className={pen("fill-fog", "stroke-graphite")}
                />

                {/* the gardener and his watering can */}
                <g
                  data-gardener=""
                  transform={`translate(${f(walkX(1))} ${PATH.walk})`}
                >
                  {[0, 1].map((i) => (
                    <g key={i} data-leg="">
                      <path
                        d={GARDENER.leg}
                        strokeWidth={1.2}
                        className={pen("fill-graphite stroke-ink")}
                        transform={i ? "translate(5 0)" : undefined}
                      />
                      <path
                        d={GARDENER.boot}
                        className={pen("fill-ink", "stroke-graphite")}
                        transform={i ? "translate(5 0)" : undefined}
                      />
                    </g>
                  ))}
                  <path
                    d={GARDENER.backArm}
                    strokeWidth={6.5}
                    className={pen("stroke-ink", "stroke-graphite")}
                  />
                  <path
                    d={GARDENER.backArm}
                    strokeWidth={4.2}
                    className={pen("stroke-card", "")}
                  />
                  <path
                    d={GARDENER.shirt}
                    strokeWidth={1.3}
                    className={pen("fill-card stroke-ink")}
                  />
                  <path
                    d={GARDENER.neck}
                    className={pen("fill-tangerine-soft", "")}
                  />
                  <path
                    d={GARDENER.head}
                    strokeWidth={1.3}
                    className={pen("fill-tangerine-soft stroke-ink")}
                  />
                  <path
                    d={GARDENER.hatCrown}
                    strokeWidth={1.2}
                    className={pen("fill-paper-2 stroke-ink")}
                  />
                  <path
                    d={GARDENER.hatBrim}
                    strokeWidth={1.2}
                    className={pen("fill-paper-2 stroke-ink")}
                  />
                  <path
                    d={GARDENER.hatBand}
                    strokeWidth={2.2}
                    className={pen("stroke-tangerine", "stroke-graphite")}
                  />
                  <path
                    d={GARDENER.canHandle}
                    strokeWidth={2.4}
                    className={pen("stroke-ink", "stroke-graphite")}
                  />
                  <path
                    d={GARDENER.spout}
                    strokeWidth={3.2}
                    className={pen("stroke-ink", "stroke-graphite")}
                  />
                  <path
                    d={GARDENER.rose}
                    strokeWidth={1}
                    className={pen("fill-lime stroke-ink")}
                  />
                  <path
                    d={GARDENER.can}
                    strokeWidth={1.4}
                    className={pen("fill-lime stroke-ink")}
                  />
                  <path
                    d={GARDENER.frontArm}
                    strokeWidth={6.5}
                    className={pen("stroke-ink", "stroke-graphite")}
                  />
                  <path
                    d={GARDENER.frontArm}
                    strokeWidth={4.2}
                    className={pen("stroke-card", "")}
                  />
                  <path
                    d={GARDENER.hand}
                    strokeWidth={1}
                    className={pen("fill-tangerine-soft stroke-ink")}
                  />
                  {ink
                    ? [0, 1, 2, 3].map((k) => (
                        <circle
                          key={k}
                          data-drop=""
                          cx={GARDENER.water[0]}
                          cy={GARDENER.water[1]}
                          r={1.8}
                          className="fill-blue"
                          opacity={0}
                        />
                      ))
                    : null}
                </g>

                {/* grass at the front */}
                <path
                  d={FRONT_GRASS}
                  strokeWidth={1.6}
                  className={pen("stroke-lime-deep", "stroke-pencil")}
                />
              </svg>
            )}

            {/* the tag of the day under the pointer, or chosen with the keys */}
            {!three && shown && tagPos ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
                style={tagPos}
              >
                <div className="relative rounded-[8px] border border-graphite bg-card px-3 pt-2 pb-1.5 text-center whitespace-nowrap">
                  <span className="absolute top-1.5 left-1.5 size-1.5 rounded-full border border-graphite" />
                  <p className="type-ui font-semibold">{tagText(shown)}</p>
                  <p className="type-mono text-graphite">
                    {dayLabel(shown.date)}
                  </p>
                </div>
                <span className="mx-auto block h-2 w-px bg-graphite" />
              </div>
            ) : null}
          </div>
        </div>
        <p aria-live="polite" className="sr-only">
          {focused && active >= 0 && season.days[active]
            ? `${tagText(season.days[active])}, ${dayLabel(season.days[active].date)}`
            : ""}
        </p>
        {still ? null : (
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            {phase === "done" ? (
              <IconButton
                label="Grow it again"
                size="sm"
                icon={<Replay />}
                onClick={regrow}
                data-qa="garden-replay"
                className="bg-card"
              />
            ) : null}
            <IconButton
              label={paused ? "Play the garden" : "Pause the garden"}
              aria-pressed={paused}
              size="sm"
              icon={paused ? <Play /> : <Pause />}
              onClick={() => setPaused((p) => !p)}
              data-qa="garden-control"
              className="bg-card"
            />
          </div>
        )}
        <p className="type-hand-sm mt-2 text-graphite md:hidden">
          {three
            ? "tap a plant to read its day"
            : "swipe along the furrows · tap a plant"}
        </p>
      </div>

      <Signs season={season} />
    </div>
  );
}

const FRONT_GRASS = (() => {
  const r = rng(17);
  let d = "";
  for (let x = 8; x < W; x += 22 + r() * 30) {
    const y = H - 2;
    const h = 8 + r() * 8;
    d += `M${f(x)} ${y}Q${f(x - 2)} ${f(y - h * 0.6)} ${f(x - 5)} ${f(y - h)}M${f(x + 3)} ${y}Q${f(x + 3)} ${f(y - h)} ${f(x + 4)} ${f(y - h * 1.3)}M${f(x + 6)} ${y}Q${f(x + 8)} ${f(y - h * 0.6)} ${f(x + 11)} ${f(y - h * 0.9)}`;
  }
  return d;
})();

/** A day's tag: its contributions, or a sown seed, or a day still to come. */
const tagText = (d: GardenDay) =>
  d.future
    ? "Not grown yet"
    : d.count
      ? `${d.count} contribution${d.count === 1 ? "" : "s"}`
      : "Sown, nothing came up";

/** One day's plant, by GitHub's level; the busiest day is the sunflower (the latest of them wears the rosette). */
function Plant({
  d,
  prize,
  ribbon,
  ink,
}: {
  d: GardenDay;
  prize: boolean;
  ribbon: boolean;
  ink: boolean;
}) {
  const [x, y] = cellAt(d.week, d.weekday);
  const s = rowScale(d.weekday);
  const r = rng(hash(d.date));
  const flip = r() > 0.5 ? -1 : 1;
  const tilt = f((r() - 0.5) * 10);
  const pen = (a: string, b = "fill-none stroke-graphite") => (ink ? a : b);
  if (prize) {
    return (
      <g transform={`translate(${f(x)} ${f(y)}) scale(${f(s * GROW)})`}>
        <g data-grow="" data-col={d.week}>
          <path
            d={SUNFLOWER.stake}
            strokeWidth={2.4}
            className={pen("stroke-paper-2", "stroke-graphite")}
          />
          <path
            d={SUNFLOWER.tie}
            strokeWidth={1.6}
            className={pen("stroke-lime-deep", "stroke-pencil")}
          />
          <path
            d={SUNFLOWER.stem}
            strokeWidth={3.2}
            className={pen("stroke-lime-deep", "stroke-graphite")}
          />
          <path
            d={SUNFLOWER.leaves}
            strokeWidth={1.1}
            className={pen("fill-lime stroke-ink")}
          />
          <path d={SUNFLOWER.dark} className={pen("fill-lime-deep", "")} />
          <path
            d={SUNFLOWER.veins}
            strokeWidth={0.9}
            className={pen("stroke-ink", "stroke-pencil")}
            opacity={0.5}
          />
          <path
            d={SUNFLOWER.petals}
            strokeWidth={0.9}
            className={pen("fill-tangerine stroke-ink")}
          />
          <path
            d={SUNFLOWER.head}
            strokeWidth={1.2}
            className={pen("fill-ink-2 stroke-ink")}
          />
          <path
            d={SUNFLOWER.seeds}
            className={pen("fill-tangerine-deep", "fill-pencil")}
          />
          {ribbon ? (
            <g>
              <path
                d={ROSETTE.ribbons}
                strokeWidth={0.8}
                className={pen("fill-blue stroke-ink")}
              />
              <path
                d={ROSETTE.star}
                strokeWidth={1}
                className={pen("fill-lime stroke-ink")}
              />
              <path
                d={ROSETTE.heart}
                strokeWidth={0.8}
                className={pen("fill-card stroke-ink")}
              />
              <text
                x={ROSETTE.c[0]}
                y={ROSETTE.c[1] + 2.4}
                textAnchor="middle"
                className={`font-display ${ink ? "fill-ink" : "fill-graphite"}`}
                style={{ fontSize: 6.5, fontWeight: 800 }}
              >
                1st
              </text>
            </g>
          ) : null}
        </g>
      </g>
    );
  }
  const level = Math.max(1, Math.min(4, d.level || 1)) as 1 | 2 | 3 | 4;
  const p = PLANTS[level];
  const bloom = BLOOM_COLOURS[hash(d.date) % BLOOM_COLOURS.length];
  return (
    <g
      transform={`translate(${f(x)} ${f(y)}) scale(${f(s * flip * GROW)} ${f(s * GROW)}) rotate(${tilt})`}
    >
      <g data-grow="" data-col={d.week}>
        <path
          d={p.stem}
          strokeWidth={1.8}
          className={pen("stroke-lime-deep", "stroke-graphite")}
        />
        <path
          d={p.leaf}
          strokeWidth={1}
          className={pen("fill-lime stroke-ink")}
        />
        {p.dark ? (
          <path d={p.dark} className={pen("fill-lime-deep", "")} />
        ) : null}
        {p.bloom ? (
          <path
            d={p.bloom}
            strokeWidth={0.9}
            className={pen(`${level === 3 ? "fill-card" : bloom} stroke-ink`)}
          />
        ) : null}
        {level === 4 ? (
          <path
            d={BLOOM_HEART}
            strokeWidth={0.8}
            className={pen("fill-lime stroke-ink")}
          />
        ) : null}
      </g>
    </g>
  );
}

/** The garden signs: the season's numbers on boards staked in the lawn. */
function Signs({ season }: { season: GardenSeason }) {
  const s = statsOf(season);
  const when =
    season.key === "last" ? "in the last 12 months" : `in ${season.label}`;
  const signs = [
    { label: "Contributions", value: String(s.total), note: when },
    {
      label: "Days in bloom",
      value: String(s.bloom),
      note: `${s.bloom === 1 ? "day" : "days"} with at least one contribution`,
    },
    {
      label: "Longest streak",
      value: s.streak
        ? `${s.streak.days} day${s.streak.days === 1 ? "" : "s"}`
        : "none yet",
      note: s.streak
        ? s.streak.days > 1
          ? `${shortDate(s.streak.from)} to ${shortDate(s.streak.to)}, the stepping stones`
          : shortDate(s.streak.from)
        : "the first one is coming",
    },
    {
      label: "Busiest day",
      value: s.busiest ? String(s.busiest.count) : "0",
      note: s.busiest
        ? `on ${dayLabel(s.busiest.date)}, the prize sunflower`
        : "no contributions yet",
    },
  ];
  return (
    <ul
      data-qa="garden-signs"
      className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4"
    >
      {signs.map((x) => (
        <li key={x.label} className="flex flex-col">
          <div className="flex-1 rounded-[8px] border-2 border-graphite bg-paper-2 px-4 pt-3 pb-3.5">
            <p className="type-micro tracking-[0.14em] text-graphite uppercase">
              {x.label}
            </p>
            <p className="mt-1 font-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-none font-extrabold tracking-[-0.02em] tabular-nums">
              {x.value}
            </p>
            <p className="type-small mt-1.5 text-graphite">{x.note}</p>
          </div>
          <div aria-hidden="true" className="flex justify-between px-[18%]">
            <span className="h-5 w-2 rounded-b-[2px] bg-graphite" />
            <span className="h-5 w-2 rounded-b-[2px] bg-graphite" />
          </div>
        </li>
      ))}
    </ul>
  );
}
