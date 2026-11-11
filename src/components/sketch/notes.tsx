import type { CSSProperties, ElementType, ReactNode } from "react";
import { roughArrow, type Seed } from "./rough";

/**
 * The handwriting layer (Caveat). Server components (no client JS).
 *
 *   <HandNote tone="graphite" arrow="left" seed="readme-note">built this in a weekend</HandNote>
 *   <StickyNote color="paper" tilt={-3} pin="lime">...</StickyNote>
 *
 * Rules: Caveat is never below 20px (sizes sm 20 / md 24 / lg 30). Notes carry his voice and
 * real facts only. At most one handwritten note per card. Text colour on paper: ink, graphite,
 * blue-deep, tangerine-deep, lime-deep (all >= 4.5:1). On ink: paper or lime.
 */

export type HandTone = "ink" | "graphite" | "blue" | "tangerine" | "lime" | "paper";

const HAND_TONE: Record<HandTone, string> = {
  ink: "text-ink",
  graphite: "text-graphite",
  blue: "text-blue-deep",
  tangerine: "text-tangerine-deep",
  lime: "text-lime-deep",
  paper: "text-paper",
};

const HAND_SIZE = { sm: "type-hand-sm", md: "type-hand", lg: "type-hand-lg" } as const;

/** Arrow geometry per direction inside a 52 x 34 box. */
const ARROWS = {
  right: { from: [4, 24], to: [46, 12], bend: -0.28 },
  left: { from: [48, 24], to: [6, 12], bend: 0.28 },
  down: { from: [8, 6], to: [30, 30], bend: 0.32 },
  up: { from: [8, 30], to: [30, 6], bend: -0.32 },
} as const;

export type HandArrow = keyof typeof ARROWS;

/** A small doodled arrow (fixed 52 x 34), for margin notes that point at something. */
export function HandArrow({ direction, seed, className, tone = "graphite" }: { direction: HandArrow; seed: Seed; className?: string; tone?: HandTone }) {
  const a = ARROWS[direction];
  return (
    <svg aria-hidden="true" focusable="false" width={52} height={34} viewBox="0 0 52 34" className={`shrink-0 overflow-visible ${HAND_TONE[tone]}${className ? ` ${className}` : ""}`}>
      <path
        data-stroke=""
        d={roughArrow(a.from, a.to, { seed, bend: a.bend, head: 8 })}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        suppressHydrationWarning
      />
    </svg>
  );
}

type HandNoteProps = {
  children: ReactNode;
  tone?: HandTone;
  size?: keyof typeof HAND_SIZE;
  /** Degrees. Notes look written when slightly tilted (-4..4). Default -2. */
  rotate?: number;
  /** Doodled arrow: left/up sit before the text, right/down after it. */
  arrow?: HandArrow;
  /** Seed for the arrow. Required when `arrow` is set. */
  seed?: Seed;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
};

/** A handwritten margin note (Caveat), optionally with a doodled arrow. */
export function HandNote({ children, tone = "graphite", size = "md", rotate = -2, arrow, seed = "note", as: Tag = "p", className, style }: HandNoteProps) {
  const before = arrow === "left" || arrow === "up";
  return (
    <Tag
      className={`inline-flex items-center gap-1.5 ${HAND_SIZE[size]} ${HAND_TONE[tone]}${className ? ` ${className}` : ""}`}
      style={{ rotate: rotate ? `${rotate}deg` : undefined, ...style }}
    >
      {arrow && before ? <HandArrow direction={arrow} seed={seed} tone={tone} /> : null}
      <span>{children}</span>
      {arrow && !before ? <HandArrow direction={arrow} seed={seed} tone={tone} /> : null}
    </Tag>
  );
}

export type StickyColor = "paper" | "lime" | "blue" | "tangerine";

const STICKY_BG: Record<StickyColor, string> = {
  paper: "bg-card",
  lime: "bg-lime-soft",
  blue: "bg-blue-soft",
  tangerine: "bg-tangerine-soft",
};
const PIN_BG = { lime: "bg-lime", blue: "bg-blue", tangerine: "bg-tangerine", ink: "bg-ink" } as const;

type StickyNoteProps = {
  children: ReactNode;
  /** Note paper. paper (card white, the hero note), lime, blue, tangerine (soft variants). */
  color?: StickyColor;
  /** Degrees of tilt. Default -3. */
  tilt?: number;
  /** A round pin in a corner (Livora-style), or none. */
  pin?: keyof typeof PIN_BG | "none";
  pinSide?: "left" | "right";
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
};

/**
 * A sticky note: soft-shadowed paper, slightly tilted, with a curl at the bottom corner.
 * Content is yours: use type-hand text inside (and <Highlight trigger="static"> for lines).
 */
export function StickyNote({ children, color = "paper", tilt = -3, pin = "lime", pinSide = "right", as: Tag = "div", className, style }: StickyNoteProps) {
  return (
    <Tag className={`sticky-note ${STICKY_BG[color]}${className ? ` ${className}` : ""}`} style={{ rotate: `${tilt}deg`, ...style }}>
      {pin !== "none" ? <span aria-hidden="true" className={`sticky-pin ${PIN_BG[pin]} ${pinSide === "right" ? "-right-2.5" : "-left-2.5"}`} /> : null}
      {children}
    </Tag>
  );
}
