import { HandArrow } from "@/components/sketch/notes";

/**
 * Sketch mode's margin notes: the design intent behind each home section, handwritten in its top
 * padding the way a wireframe is annotated. They describe the page itself (never facts about
 * Prajwal), exist only while sketch mode is on (CSS: `.sk-note`), and are decoration
 * (aria-hidden): every section already says the same thing in its real content.
 */
const NOTES: Record<string, string> = {
  build: "rows flood with colour on hover",
  work: "real projects only, no made-up numbers",
  stack: "most of the stack sits under the waterline",
  changelog: "career as a git log: HEAD is today",
  about: "README: short, honest, real links",
  contact: "make the email impossible to miss",
};

export function hasSketchNote(id: string | undefined): id is string {
  return !!id && id in NOTES;
}

export function SketchNote({ id, slab = false }: { id: string; slab?: boolean }) {
  const text = NOTES[id];
  if (!text) return null;
  return (
    <span aria-hidden="true" data-qa="sketch-note" className={`sk-note${slab ? " sk-note-slab" : ""}`}>
      <span>{text}</span>
      <HandArrow direction="down" seed={`sk-note-${id}`} tone="blue" className="sk-note-arrow" />
    </span>
  );
}
