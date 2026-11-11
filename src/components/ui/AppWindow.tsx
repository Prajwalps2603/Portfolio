import type { CSSProperties, ElementType, ReactNode, Ref } from "react";
import { SketchCircle, SketchLine, SketchRect } from "@/components/sketch/primitives";
import type { Seed } from "@/components/sketch/rough";

export type AppWindowProps = {
  /** Mono title in the bar, e.g. "resumai — editor" (Caveat in the sketch variant). */
  title: ReactNode;
  /** ship: crisp UI. sketch: identical box model, every border drawn as a pencil stroke. */
  variant?: "ship" | "sketch";
  /** The outer paper-2 frame (10px, 28px radius), Livora's device frame. Default true. */
  frame?: boolean;
  /** CSS aspect-ratio of the whole window, e.g. "16 / 11" (the MiniUI ratio). null = auto height. */
  ratio?: string | null;
  /** Right side of the title bar (a status chip, a tiny control). */
  actions?: ReactNode;
  /** Seed for the sketch strokes (default: derived from the title text). */
  seed?: Seed;
  as?: ElementType;
  className?: string;
  bodyClassName?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
};

/** The three window dots are the three highlighters. */
const DOTS = ["bg-lime", "bg-blue", "bg-tangerine"] as const;

/**
 * THE APP WINDOW: the crisp product frame every mini-UI lives in (three highlighter dots + a mono
 * title + the body). The "sketch" variant keeps EXACTLY the same box model (same padding,
 * borders reserved as transparent, same 40px bar) and draws the frame with pencil strokes, so a
 * sketch window can sit precisely under a ship window.
 *
 *   <AppWindow title="resumai — editor" ratio="16 / 11">...</AppWindow>
 *   <AppWindow title="resumai — editor" ratio="16 / 11" variant="sketch">...</AppWindow>
 */
export function AppWindow({ title, variant = "ship", frame = true, ratio = null, actions, seed, as: Tag = "div", className, bodyClassName, style, ref, children }: AppWindowProps) {
  const sketch = variant === "sketch";
  const s = String(seed ?? (typeof title === "string" ? title : "window"));
  return (
    <Tag
      ref={ref}
      data-variant={variant}
      className={`aw${frame ? "" : " aw-bare"}${className ? ` ${className}` : ""}`}
      style={ratio ? { aspectRatio: ratio, ...style } : style}
    >
      {sketch && frame ? <SketchRect seed={`${s}-frame`} radius={26} tone="pencil" /> : null}
      <div className="aw-panel">
        {sketch ? <SketchRect seed={`${s}-panel`} radius={frame ? 16 : 12} /> : null}
        <div className="aw-bar">
          <span className="aw-dots" aria-hidden="true">
            {DOTS.map((bg, i) =>
              sketch ? (
                <span key={bg} className="aw-dot relative">
                  <SketchCircle seed={`${s}-dot-${i}`} inset={-1} passes={1} strokeWidth={1.3} />
                </span>
              ) : (
                <span key={bg} className={`aw-dot ${bg}`} />
              ),
            )}
          </span>
          <span className="aw-title">{title}</span>
          {actions ? <span className="ml-auto flex items-center gap-2">{actions}</span> : null}
          {sketch ? (
            <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-2 translate-y-1/2">
              <SketchLine seed={`${s}-bar`} />
            </span>
          ) : null}
        </div>
        <div className={`aw-body${bodyClassName ? ` ${bodyClassName}` : ""}`}>{children}</div>
      </div>
    </Tag>
  );
}
