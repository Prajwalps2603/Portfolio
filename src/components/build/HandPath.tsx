import { Fragment } from "react";
import { roughArrow } from "@/components/sketch/rough";

/** A tiny doodled arrow between two handwritten words (deterministic: same on server and client). */
function Hop({ seed }: { seed: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 22 12" className="mx-[0.12em] inline-block h-[0.42em] w-[0.8em] overflow-visible align-[0.08em]">
      <path
        d={roughArrow([1.5, 7], [20, 5], { seed, bend: -0.22, head: 5.5, headAngle: 32 })}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * A path through the stack, handwritten: "interface -> api -> data" with doodled arrows (authored
 * SVG, never a unicode arrow). Inline content, so a <Highlight> band wraps it line by line.
 * Decorative: give assistive tech the same path in words (graph.routeSentence).
 */
export function HandPath({ words }: { words: string[] }) {
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={w}>
          {/* the arrow stays with the word before it; the line may break after it */}
          {i > 0 ? (
            <>
              <Hop seed={`hop-${words[i - 1]}-${w}`} />
              <wbr />
            </>
          ) : null}
          <span className="whitespace-nowrap">{w}</span>
        </Fragment>
      ))}
    </>
  );
}
