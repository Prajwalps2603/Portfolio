/**
 * The home page's section plan, in order. Ids are the anchor contract between the header,
 * the record-view nav, in-page links ("/#work") and every section builder. Do not rename.
 *
 * `surface` is the material: screens are graphite and carry live signals; sheets are bone and
 * carry records. Put it on the section as data-surface so the top bar can swap material.
 */
export type SectionId = "source" | "signal" | "work" | "stack" | "experience" | "contact";

export type SectionDef = {
  id: SectionId;
  /** Plain-language name used in navigation (null = not in the nav). */
  nav: string | null;
  /** Instrument dialect for 11px mono labels only (never headings or nav). */
  stage: string;
  surface: "screen" | "sheet";
  /** Component that renders it (for orientation; see src/app/page.tsx). */
  component: string;
};

export const SECTIONS: readonly SectionDef[] = [
  { id: "source", nav: null, stage: "Source", surface: "screen", component: "hero/Hero" },
  { id: "signal", nav: null, stage: "Signal", surface: "screen", component: "about/Statement" },
  { id: "work", nav: "Work", stage: "Systems", surface: "screen", component: "work/Work" },
  { id: "stack", nav: "Stack", stage: "Channel setup", surface: "screen", component: "skills/Stack" },
  { id: "experience", nav: "Experience", stage: "History", surface: "sheet", component: "about/History" },
  { id: "contact", nav: "Contact", stage: "Connect", surface: "screen", component: "contact/Contact" },
] as const;

export const NAV_SECTIONS = SECTIONS.filter((s): s is SectionDef & { nav: string } => s.nav !== null);

export const SECTION_IDS = SECTIONS.map((s) => s.id);
