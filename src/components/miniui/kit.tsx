import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * MINI-UI KIT: the blocks the six templates are built from.
 *
 * ONE element list, two looks. Every block renders its crisp "ship" look and carries its sketch
 * twin as data attributes (`data-sk*`). The sketch layer (./SketchLayer.tsx) measures every
 * `[data-sk]` element and draws the twin at exactly the same box (rough rect, pencil line,
 * scribble, highlighter swipe, Caveat label...). The compile (./index.tsx) then fades each block
 * in, in reading order, while its strokes tighten and fade. Nothing here moves on its own.
 *
 *   <Panel id="jd" hand="the JD" className="flex-1 p-3">
 *     <Bar id="jd-1" w="80%" />
 *   </Panel>
 *
 * Rules: real labels only from @/content (passed in by the template); illustrative data must
 * look illustrative ("Venue A", "Contact A"); every text size is a token (text-micro 11px is the
 * floor); colours from the palette; no interactive elements (a mini-UI is a picture of an app).
 */

export type SkShape =
  | "rect" // rough box (radius from `r`)
  | "pill" // rough box with fully round ends
  | "bar" // one pencil line through the middle (a line of text)
  | "dash" // a short pencil stroke in the middle (a jotted number, a small value)
  | "scribble" // zig-zag fill (a paragraph "will be here")
  | "circle" // a loop around the box
  | "swipe" // a highlighter band across the box (needs `hl`)
  | "arrow" // a doodled arrow inside the box (`from` / `to` as 0..1 fractions)
  | "check" // a hand check mark
  | "cross" // a hand X (crossed out)
  | "underline" // a hand underline under the box
  | "label" // only the Caveat label (no stroke)
  | "none"; // no sketch twin: appears at the compile

export type SkTone = "ink" | "pencil" | "graphite";
export type SkHl = "lime" | "blue" | "tangerine";
/** Where the Caveat label sits: inside top-left, left-middle, centre, right-middle, above, below. */
export type SkAt = "tl" | "l" | "c" | "r" | "t" | "b";
export type SkHandTone = "ink" | "graphite" | "blue" | "tangerine" | "lime";

export type SkSpec = {
  shape: SkShape;
  /** Stable, meaningful id (seed suffix). Unique inside the template. */
  id: string;
  /** Corner radius for rect (px). Default 12. */
  r?: number;
  tone?: SkTone;
  /** Handwritten label drawn at this box (Caveat, >= 20px). */
  hand?: string;
  at?: SkAt;
  handTone?: SkHandTone;
  /** Bigger label (type-hand instead of type-hand-sm). */
  big?: boolean;
  /** Highlighter swipe behind / across the box. */
  hl?: SkHl;
  /** A sketch-only annotation (no shipped counterpart): it leaves first when the sketch compiles. Arrows always are. */
  note?: boolean;
  /** Arrow geometry (fractions of the box) and bend. */
  from?: readonly [number, number];
  to?: readonly [number, number];
  bend?: number;
};

type DataAttrs = Record<`data-${string}`, string>;

/** The data attributes that describe an element's sketch twin. Spread onto any element. */
export function sk(s: SkSpec): DataAttrs {
  const a: DataAttrs = { "data-sk": s.shape, "data-sk-id": s.id };
  if (s.r !== undefined) a["data-sk-r"] = String(s.r);
  if (s.tone) a["data-sk-tone"] = s.tone;
  if (s.hand) a["data-sk-hand"] = s.hand;
  if (s.at) a["data-sk-at"] = s.at;
  if (s.handTone) a["data-sk-hand-tone"] = s.handTone;
  if (s.big) a["data-sk-big"] = "";
  if (s.hl) a["data-sk-hl"] = s.hl;
  if (s.note) a["data-sk-note"] = "";
  if (s.from) a["data-sk-from"] = s.from.join(",");
  if (s.to) a["data-sk-to"] = s.to.join(",");
  if (s.bend !== undefined) a["data-sk-bend"] = String(s.bend);
  return a;
}

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ---------------------------------------------------------------------------------------------
// Type inside a mini-UI (tokens only; text-micro 11px is the floor; one step up in roomy windows)
// ---------------------------------------------------------------------------------------------

export const TX = {
  /** 11px mono data (12px when the window is roomy). */
  data: "font-mono text-micro @2xl:text-label",
  /** Short uppercase mono label (1-2 words), the mini-UI's panel caption. */
  cap: "font-mono text-micro font-medium uppercase tracking-[0.08em] @2xl:text-label",
  /** 12px Inter UI text (13px roomy). */
  ui: "font-sans text-label font-medium @2xl:text-mono",
  /** 11px Inter UI text for the densest rows. */
  uiSm: "font-sans text-micro font-medium @2xl:text-label",
  /** Panel / card title (Inter 600). */
  title: "font-sans text-mono font-semibold tracking-[-0.005em] @2xl:text-ui",
} as const;

// ---------------------------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------------------------

type BlockProps = {
  id: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  as?: ElementType;
} & Partial<Omit<SkSpec, "id" | "shape">>;

const BAR = {
  line: "bg-line",
  strong: "bg-line-strong",
  ink: "bg-ink",
  graphite: "bg-graphite",
  lime: "bg-lime",
  blue: "bg-blue",
  "blue-soft": "bg-blue-soft",
  tangerine: "bg-tangerine",
  "tangerine-soft": "bg-tangerine-soft",
  "lime-soft": "bg-lime-soft",
} as const;
export type BarTone = keyof typeof BAR;

/** A skeleton line of text (illustrative copy). Sketch: one pencil line. */
export function Bar({ id, w = "100%", tone = "line", thick = false, className, sketch = "bar", hl, hand, at, handTone }: {
  id: string;
  w?: string;
  tone?: BarTone;
  /** A heading line (taller bar). */
  thick?: boolean;
  className?: string;
  sketch?: "bar" | "swipe" | "scribble" | "none";
  hl?: SkHl;
  hand?: string;
  at?: SkAt;
  handTone?: SkHandTone;
}) {
  return (
    <span
      {...sk({ shape: sketch, id, tone: "pencil", hl, hand, at, handTone })}
      className={cx("block shrink-0 rounded-pill", thick ? "h-2 @2xl:h-2.5" : "h-1.5", BAR[tone], className)}
      style={{ width: w }}
    />
  );
}

/** A row of skeleton segments: [width, tone] pairs (keyword highlights inside a line of text). */
export function Segs({ id, segs, className, hlSketch = true }: { id: string; segs: readonly (readonly [string, BarTone])[]; className?: string; hlSketch?: boolean }) {
  return (
    <span className={cx("flex items-center gap-1", className)}>
      {segs.map(([w, tone], i) => {
        const hl: SkHl | undefined = !hlSketch ? undefined : tone === "lime" || tone === "lime-soft" ? "lime" : tone === "tangerine" || tone === "tangerine-soft" ? "tangerine" : tone === "blue" || tone === "blue-soft" ? "blue" : undefined;
        return <Bar key={i} id={`${id}-${i}`} w={w} tone={tone} sketch={hl ? "swipe" : "bar"} hl={hl} className={hl ? "h-2 @2xl:h-2.5" : undefined} />;
      })}
    </span>
  );
}

/** An inner panel (rounded-panel, hairline, paper). Sketch: an ink rough box. */
export function Panel({ id, className, style, children, as: Tag = "div", r = 14, tone = "ink", hand, at = "tl", handTone, big, hl, fill = "paper" }: BlockProps & { fill?: "paper" | "card" | "paper-2" | "none" }) {
  const bg = fill === "none" ? "" : fill === "card" ? "bg-card" : fill === "paper-2" ? "bg-paper-2" : "bg-paper";
  return (
    <Tag {...sk({ shape: "rect", id, r, tone, hand, at, handTone, big, hl })} className={cx("relative rounded-panel border border-line", bg, className)} style={style}>
      {children}
    </Tag>
  );
}

/** A plain block with a sketch twin of your choosing (layout wrapper + shape). */
export function Box({ id, className, style, children, as: Tag = "div", shape = "rect", ...rest }: BlockProps & { shape?: SkShape }) {
  return (
    <Tag {...sk({ shape, id, ...rest })} className={className} style={style}>
      {children}
    </Tag>
  );
}

/** Real text. Sketch: a pencil line (default), a Caveat label (`hand`), or nothing. */
export function Txt({ id, className, children, as: Tag = "span", hand, at = "l", handTone, big, sketch, hl }: BlockProps & { sketch?: SkShape }) {
  const shape: SkShape = sketch ?? (hand ? "label" : "bar");
  return (
    <Tag {...sk({ shape, id, tone: "pencil", hand, at, handTone, big, hl })} className={className}>
      {children}
    </Tag>
  );
}

const CHIP = {
  outline: "border border-line-strong text-graphite",
  paper: "bg-paper text-ink border border-line",
  lime: "bg-lime-soft text-ink",
  "lime-strong": "bg-lime text-ink",
  blue: "bg-blue-soft text-ink",
  tangerine: "bg-tangerine-soft text-ink",
  ink: "bg-ink text-paper",
} as const;
export type ChipTone = keyof typeof CHIP;

/** A small status / tag pill (mono 11px). Sketch: a rough pill, optionally swiped. */
export function Chip({ id, tone = "outline", className, children, icon, hand, at = "c", handTone, hl, mono = true }: {
  id: string;
  tone?: ChipTone;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
  hand?: string;
  at?: SkAt;
  handTone?: SkHandTone;
  hl?: SkHl;
  mono?: boolean;
}) {
  return (
    <span
      {...sk({ shape: "pill", id, tone: "pencil", hand, at, handTone, hl })}
      className={cx(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-pill px-2 leading-none whitespace-nowrap @2xl:h-6 @2xl:px-2.5",
        mono ? "font-mono text-micro @2xl:text-label" : "font-sans text-micro font-medium @2xl:text-label",
        CHIP[tone],
        className,
      )}
    >
      {icon ? <span className="inline-flex size-3 shrink-0 items-center justify-center [&_svg]:size-full">{icon}</span> : null}
      {children}
    </span>
  );
}

const BTN = {
  ink: "bg-ink text-paper",
  lime: "bg-lime text-ink",
  blue: "bg-blue text-paper",
  outline: "border border-ink/80 text-ink",
} as const;

/** A picture of a button (not a control: mini-UIs are images). Sketch: an ink rough pill + label. */
export function Btn({ id, tone = "ink", className, children, icon, hand, handTone, hl }: {
  id: string;
  tone?: keyof typeof BTN;
  className?: string;
  children?: ReactNode;
  icon?: ReactNode;
  hand?: string;
  handTone?: SkHandTone;
  hl?: SkHl;
}) {
  return (
    <span
      {...sk({ shape: "pill", id, tone: "ink", hand, at: "c", handTone: handTone ?? "ink", hl })}
      className={cx(
        "inline-flex h-6 shrink-0 items-center justify-center gap-1.5 rounded-pill px-2.5 font-sans text-micro font-semibold whitespace-nowrap @2xl:h-7 @2xl:px-3 @2xl:text-label",
        BTN[tone],
        className,
      )}
    >
      {icon ? <span className="inline-flex size-3 shrink-0 items-center justify-center [&_svg]:size-full">{icon}</span> : null}
      {children}
    </span>
  );
}

/** An icon in a small rounded tile. Sketch: a rough rounded square. */
export function IconTile({ id, tone = "paper", shape = "rect", className, children, hand, at, handTone }: {
  id: string;
  tone?: "paper" | "ink" | "lime" | "blue" | "tangerine" | "card";
  /** Sketch twin: "rect" (rounded square) or "circle" for round tiles. */
  shape?: "rect" | "circle";
  className?: string;
  children: ReactNode;
  hand?: string;
  at?: SkAt;
  handTone?: SkHandTone;
}) {
  const t = {
    paper: "bg-paper text-ink border border-line",
    card: "bg-card text-ink border border-line",
    ink: "bg-ink text-paper",
    lime: "bg-lime text-ink",
    blue: "bg-blue text-paper",
    tangerine: "bg-tangerine text-ink",
  }[tone];
  return (
    <span {...sk({ shape, id, r: 8, tone: "ink", hand, at, handTone })} className={cx("inline-flex shrink-0 items-center justify-center rounded-chip [&_svg]:size-[55%]", t, className)}>
      {children}
    </span>
  );
}

export { cx };
