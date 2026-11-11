"use client";

import dynamic from "next/dynamic";
import { useFinePointer, useReducedMotion } from "@/lib/motion/media";
import { useLite } from "@/lib/perf";

/** The implementation is its own chunk: touch screens and reduced motion never download it. */
const CursorImpl = dynamic(() => import("./CursorImpl"), { ssr: false });

/**
 * THE CURSOR (fine pointers, full motion only; touch and reduced motion keep the native cursor).
 *
 * An ink dot that tracks the pointer 1:1 and a ring that follows with an eased lag. Over anything
 * interactive the ring grows and FILLS with that element's accent, like a highlighter (multiply
 * on paper, so ink text under it stays ink; on ink sections it becomes a lime ring with a faint
 * lime wash, so light text stays readable).
 *
 * The contract (attributes on the element or an ancestor):
 *   data-cursor="lime" | "blue" | "tangerine"   ring fill accent (default for links/buttons: lime)
 *   data-cursor="native"                        hide the custom cursor here (native cursor shows)
 *   data-cursor="hide"                          hide both (an element drawing its own cursor)
 *   data-cursor-label="View case study"         the ring becomes a pill with this label
 * The label is a hint for pointer users only: the element must still say what it does in its
 * own text or accessible name.
 *
 * This gate is all that ships on first load; ./CursorImpl (the layers, the quickTo followers,
 * the hover logic) loads right after hydration, and only where it will be used.
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  // lite mode (a weak graphics card): the native cursor, nothing redrawn on every mouse move
  const lite = useLite();
  if (!fine || reduced || lite) return null;
  return <CursorImpl />;
}
