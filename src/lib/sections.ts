/**
 * The home page's sections, in order. The ids are the anchor contract between the header,
 * in-page links ("/#work"), the page transition and every section builder. Do not rename.
 *
 * `tone` is the section's material (see <Section tone>): paper sections show the interactive
 * dot grid, paper-2 is the alternate band, ink sections are dark (inset slab or full bleed).
 */
export type SectionId = "top" | "build" | "work" | "stack" | "changelog" | "about" | "contact";

export type SectionTone = "paper" | "paper-2" | "ink";

export type SectionDef = {
  id: SectionId;
  /** Plain-language name in the header / mobile menu (null = not in the nav). */
  nav: string | null;
  tone: SectionTone;
  /** Component that renders it (src/components/<dir>, see src/app/page.tsx). */
  component: string;
};

export const SECTIONS: readonly SectionDef[] = [
  { id: "top", nav: null, tone: "paper", component: "hero/Hero" },
  { id: "build", nav: null, tone: "paper", component: "build/BuildSection" },
  { id: "work", nav: "Work", tone: "paper-2", component: "work/Work" },
  { id: "stack", nav: "Stack", tone: "paper", component: "stack/Stack" },
  { id: "changelog", nav: "Experience", tone: "paper", component: "changelog/Changelog" },
  { id: "about", nav: "About", tone: "paper", component: "about/About" },
  { id: "contact", nav: "Contact", tone: "ink", component: "contact/Contact" },
] as const;

export const NAV_SECTIONS = SECTIONS.filter((s): s is SectionDef & { nav: string } => s.nav !== null);

export const SECTION_IDS = SECTIONS.map((s) => s.id);
