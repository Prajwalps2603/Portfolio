/**
 * The sketch system (the "idea" layer). See docs/DESIGN.md "Sketch system".
 *
 *   import { SketchRect, SketchArrow, HandNote, StickyNote, ShippedStamp, drawOn } from "@/components/sketch";
 *   import { roughRect, roughLine, seeded } from "@/components/sketch/rough"; // raw paths for your own <svg>
 */
export {
  SketchRect,
  SketchLine,
  SketchArrow,
  SketchCircle,
  SketchUnderline,
  Scribble,
  SketchCheck,
  SketchSvg,
  Stroke,
  type SketchCommon,
  type SketchTone,
  type SketchArrowProps,
} from "./primitives";
export { HandNote, HandArrow, StickyNote, type HandTone, type StickyColor } from "./notes";
export { ShippedStamp, stampIn, hideStamp } from "./stamp";
export { drawOn, hideStrokes, showStrokes, strokesIn, useDrawOn } from "./draw";
export * from "./rough";
