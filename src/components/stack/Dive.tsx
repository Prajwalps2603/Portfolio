"use client";

/**
 * THE DIVE (the client island of 04 Stack): the layer rows beside the iceberg.
 *
 * - The first layer of `skillGroups` (Interface) is the tip: above the waterline, on paper.
 * - The middle layers sit in the ink sea (`data-tone="ink"`, so cards, rows and links switch).
 * - The last (Languages) is the seabed: set large, the close of the section.
 *
 * Every tool is a real button (aria-expanded) that opens a card right under its own layer: where
 * Prajwal used it. One card per layer, so opening a tool never moves the rows above it. Esc closes
 * it and returns focus to the tool. Type-ahead, scoped to focus (WCAG 2.1.4): while focus is
 * inside the dive, typing a letter opens and focuses the next tool starting with it.
 * The drawing (./IcebergArt, lazy: it loads when the section is near) measures these rows.
 */
import dynamic from "next/dynamic";
import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { skillGroups } from "@/content";
import { HandNote } from "@/components/sketch";
import { useInView } from "@/lib/hooks/useInView";
import { useReducedMotion } from "@/lib/motion/media";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { Evidence } from "./Evidence";
import { stackKeys, type StackKey } from "./state";

const IcebergArt = dynamic(() => import("./IcebergArt").then((m) => m.IcebergArt), { ssr: false });

type Group = (typeof skillGroups)[number];
type Open = Record<string, string | null>;
type LayerProps = {
  group: Group;
  open: string | null;
  onToggle: (layer: string, id: string) => void;
  onClose: (layer: string) => void;
  className?: string;
};

/** From 900px the art column sits beside every row (the drawing measures `[data-art-col]`); below,
 *  the rows take the full width and the column becomes the tip's band above the waterline. */
const GRID = "wrap relative z-(--z-raised) flex flex-col md:grid md:grid-cols-[var(--art)_minmax(0,1fr)] md:gap-x-10 lg:gap-x-14";
/** Below 900px the submerged ice is drawn behind the rows: their text gets an ink backing there,
 *  line by line (an inline box with cloned decoration, so a wrapped line is backed only as far as
 *  its own text runs). */
const BACKED = "box-decoration-clone max-md:on-ink:-mx-2 max-md:on-ink:bg-ink max-md:on-ink:px-2";

const keysOf = (g: Group) => stackKeys.filter((k) => k.groupId === g.id);

function isTypingTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
}

function Tool({ k, on, controls, onToggle }: { k: StackKey; on: boolean; controls: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      data-qa="stack-tool"
      data-tool={k.id}
      aria-expanded={on}
      aria-controls={controls}
      onClick={onToggle}
      className={`type-ui inline-flex min-h-11 cursor-pointer items-center rounded-pill border px-4 transition-[background-color,border-color,color] duration-(--dur-feedback) ease-arrive ${
        on
          ? "border-lime bg-lime text-ink"
          : "border-line-strong text-ink hocus:border-ink hocus:bg-card on-ink:border-seam on-ink:text-paper on-ink:hocus:border-fog on-ink:hocus:bg-ink-2 max-md:on-ink:bg-ink"
      }`}
    >
      {k.label}
    </button>
  );
}

function escapeHandler(group: Group, open: string | null, onClose: (layer: string) => void) {
  return (e: ReactKeyboardEvent) => {
    if (e.key !== "Escape" || !open) return;
    e.stopPropagation();
    onClose(group.id);
  };
}

/** One layer of the ice: its name, what it is, its tools, and the card for the open one. */
function Layer({ group, open, onToggle, onClose, className }: LayerProps) {
  const keys = keysOf(group);
  const tool = keys.find((k) => k.id === open) ?? null;
  const card = `stack-card-${group.id}`;
  return (
    <section data-layer={group.id} data-qa="stack-layer" aria-labelledby={`stack-l-${group.id}`} onKeyDown={escapeHandler(group, open, onClose)} className={className}>
      <h3 id={`stack-l-${group.id}`} className="type-h3 w-fit max-w-full">
        <span className={BACKED}>{group.label}</span>
      </h3>
      <p className="type-small measure mt-2 text-graphite on-ink:text-fog max-sm:hidden">
        <span className={BACKED}>{group.description}</span>
      </p>
      <ul className="mt-4 flex flex-wrap gap-2 sm:mt-5">
        {keys.map((k) => (
          <li key={k.id}>
            <Tool k={k} on={open === k.id} controls={card} onToggle={() => onToggle(group.id, k.id)} />
          </li>
        ))}
      </ul>
      <Evidence id={card} tool={tool} layer={group.label} description={group.description} onClose={() => onClose(group.id)} />
    </section>
  );
}

/** A language on the seabed: big type; the lime band and its ink twin sweep in together, so the
 *  word is never ink on ink or paper on lime halfway through. */
function Word({ k, on, controls, onToggle }: { k: StackKey; on: boolean; controls: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      data-qa="stack-tool"
      data-tool={k.id}
      aria-expanded={on}
      aria-controls={controls}
      onClick={onToggle}
      className="type-display group relative -mx-2 block cursor-pointer rounded-xs px-2 text-left text-[clamp(2.25rem,1rem+4.4vw,5.25rem)] text-paper"
    >
      <span className="block">{k.label}</span>
      <span
        aria-hidden="true"
        className={`absolute inset-0 block rounded-xs bg-lime px-2 text-ink transition-[clip-path] duration-(--dur-ui) ease-pen reduced:transition-none ${
          on ? "[clip-path:inset(0)]" : "[clip-path:inset(0_100%_0_0)] group-hocus:[clip-path:inset(0)]"
        }`}
      >
        {k.label}
      </span>
    </button>
  );
}

/** The seabed: the languages underneath it all. */
function Bedrock({ group, open, onToggle, onClose }: LayerProps) {
  const keys = keysOf(group);
  const tool = keys.find((k) => k.id === open) ?? null;
  const card = `stack-card-${group.id}`;
  return (
    <section data-qa="stack-bedrock" aria-labelledby={`stack-l-${group.id}`} onKeyDown={escapeHandler(group, open, onClose)}>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <h3 id={`stack-l-${group.id}`} className="type-h3">
          {group.label}
        </h3>
        <p className="type-small text-fog">{group.description}</p>
        {/* right after the line, its arrow curls down onto the words */}
        <HandNote tone="paper" arrow="down" seed="stack-bed-note" rotate={-3} className="ml-4 self-end max-md:hidden">
          it all runs on these
        </HandNote>
      </div>
      <ul className="mt-5 flex flex-wrap items-baseline gap-x-[clamp(14px,2.6vw,44px)] gap-y-1 sm:mt-7">
        {keys.map((k) => (
          <li key={k.id}>
            <Word k={k} on={open === k.id} controls={card} onToggle={() => onToggle(group.id, k.id)} />
          </li>
        ))}
      </ul>
      <Evidence id={card} tool={tool} layer={group.label} description={group.description} onClose={() => onClose(group.id)} />
    </section>
  );
}

export function Dive() {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Open>({});
  const reduced = useReducedMotion();
  const { on: sketch } = useSketchMode();
  const near = useInView(root, { rootMargin: "1000px 0px", once: true });
  const { scrollTo } = useSmoothScroll();

  const tip = skillGroups[0];
  const bed = skillGroups.find((g) => g.id === "languages") ?? skillGroups[skillGroups.length - 1];
  const sea = skillGroups.filter((g) => g !== tip && g !== bed);

  const toggle = (layer: string, id: string) => setOpen((o) => ({ ...o, [layer]: o[layer] === id ? null : id }));
  const close = (layer: string) => {
    const id = open[layer];
    setOpen((o) => ({ ...o, [layer]: null }));
    if (id) root.current?.querySelector<HTMLElement>(`[data-qa=stack-tool][data-tool="${id}"]`)?.focus();
  };

  // Type-ahead while focus is inside the dive: a letter opens and focuses the next tool that starts
  // with it (repeat it to cycle), so Esc then closes that card and focus stays where it belongs.
  const onTypeAhead = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    if (isTypingTarget(e.target)) return;
    const letter = e.key.toUpperCase();
    if (!/^[A-Z0-9]$/.test(letter)) return;
    const matches = stackKeys.filter((k) => k.letter === letter);
    if (!matches.length) return;
    e.preventDefault();
    const current = (e.target as HTMLElement).closest?.("[data-tool]")?.getAttribute("data-tool");
    const next = matches[(matches.findIndex((k) => k.id === current) + 1) % matches.length];
    setOpen((o) => ({ ...o, [next.groupId]: next.id }));
    const btn = root.current?.querySelector<HTMLElement>(`[data-qa=stack-tool][data-tool="${next.id}"]`);
    if (!btn) return;
    btn.focus({ preventScroll: true });
    const r = btn.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.12 || r.bottom > window.innerHeight * 0.6) scrollTo(btn, { offset: -Math.round(window.innerHeight * 0.3) });
  };

  return (
    <div ref={root} data-qa="stack-dive" onKeyDown={onTypeAhead} className="relative mt-12 sm:mt-16 md:[--art:clamp(15rem,31vw,28rem)]">
      {/* above the water: the tip, and the layer users see */}
      <div className={GRID}>
        <div data-art-col className="relative max-md:order-last max-md:mt-8 max-md:h-[clamp(150px,42vw,240px)]">
          <HandNote size="sm" tone="graphite" rotate={-5} arrow="right" seed="stack-tip-note" className="absolute top-0 left-0 max-md:hidden">
            what users see
          </HandNote>
        </div>
        <Layer group={tip} open={open[tip.id] ?? null} onToggle={toggle} onClose={close} className="pt-2 md:pb-[clamp(44px,5vw,80px)]" />
      </div>

      {/* the sea: everything under the interface */}
      <div data-sea data-tone="ink" className="relative bg-ink text-paper">
        <div className={GRID}>
          <div aria-hidden="true" className="max-md:hidden" />
          <div className="relative flex flex-col pt-[clamp(52px,6.5vw,104px)]">
            <HandNote tone="paper" arrow="left" seed="stack-sea-note" rotate={-3} className="absolute top-[clamp(10px,1.4vw,22px)] -left-6 max-md:hidden">
              and everything I build under it
            </HandNote>
            {sea.map((g) => (
              <Layer key={g.id} group={g} open={open[g.id] ?? null} onToggle={toggle} onClose={close} className="py-[clamp(24px,3.2vw,48px)]" />
            ))}
          </div>
        </div>
        <div data-seabed className="wrap relative z-(--z-raised) mt-[clamp(40px,5vw,88px)] pt-[clamp(36px,4.5vw,64px)] pb-[var(--section-y-end)]">
          <Bedrock group={bed} open={open[bed.id] ?? null} onToggle={toggle} onClose={close} />
        </div>
      </div>

      {near ? <IcebergArt rootRef={root} sketch={sketch} reduced={reduced} /> : null}
    </div>
  );
}
