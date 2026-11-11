/**
 * UI primitives (foundation-owned). See docs/DESIGN.md "Components".
 *
 *   import { Pill, IconButton, Card, Section, Label, Tag, ExternalLink, AppWindow, LiveDot, MotionToggle } from "@/components/ui";
 *   import { Highlight } from "@/components/ui";   // re-export of src/lib/motion/HighlighterSwipe
 */
export { Pill, type PillProps, type PillVariant, type PillSize } from "./Pill";
export { IconButton } from "./IconButton";
export { Card } from "./Card";
export { Section } from "./Section";
export { Label } from "./Label";
export { Tag } from "./Tag";
export { ExternalLink } from "./ExternalLink";
export { SkipLink } from "./SkipLink";
export { AppWindow, type AppWindowProps } from "./AppWindow";
export { LiveDot } from "./LiveDot";
export { MotionToggle } from "./MotionToggle";
export { Fold, FoldToggle } from "./Fold";
export { InlineScript } from "./InlineScript";
export { Highlight, swipeHighlights, type HighlightColor } from "@/lib/motion/HighlighterSwipe";
