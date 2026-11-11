"use client";

import dynamic from "next/dynamic";
import { useSketchMode } from "@/lib/stores/sketchMode";

/** The sketchbook itself is its own chunk: it loads the first time sketch mode turns on. */
const SketchbookImpl = dynamic(() => import("./SketchbookImpl"), {
  ssr: false,
});

/**
 * THE SKETCHBOOK (his ask: "in sketch mode I should be able to draw anywhere, like a book"). In
 * sketch mode the page is a notebook: press and drag anywhere that is not a link or a control to
 * draw. Drawings stay on the part of the page they were drawn on and are kept per page in this
 * browser; they show only in sketch mode. ./SketchbookImpl has the drawing and the tools.
 */
export function Sketchbook() {
  const { on } = useSketchMode();
  return on ? <SketchbookImpl /> : null;
}
