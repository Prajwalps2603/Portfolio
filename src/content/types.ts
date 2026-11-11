/**
 * Content model for the portfolio.
 * Every fact in /src/content comes from Prajwal's résumé, cover letter, public GitHub READMEs,
 * or the data files of his previous portfolio. Do not add unverifiable claims.
 */

export type ExternalLink = {
  label: string;
  href: string;
};

export type Social = ExternalLink & {
  handle: string;
  kind: "github" | "linkedin" | "x" | "instagram" | "email";
};

export type Profile = {
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  location: string;
  email: string;
  /** One-sentence positioning statement. */
  statement: string;
  /** Short hero line in his own words (previous portfolio). */
  tagline: string;
  /** Longer professional summary (résumé). */
  summary: string;
  /** His own words (GitHub profile README). */
  inHisWords: string;
  /** Short paragraphs for an About section. */
  about: string[];
  /** The factual journey: places that shaped him. */
  route: { place: string; region: string; chapter: string; years: string }[];
  currentFocus: string[];
  learning: string[];
  availability: string;
  socials: Social[];
  resume: ExternalLink;
  /** What he is open to, in his words. */
  openTo: string;
  /** More work he has built, as he named it (no case study or repo on the site yet). */
  alsoBuilt: { name: string; note?: string }[];
  /** His LinkedIn newsletter: the subscribe link opens LinkedIn's follow dialog. */
  newsletter: ExternalLink & { title: string; about: string };
};

export type ExperienceItem = {
  id: string;
  role: string;
  company: string;
  location?: string;
  start: string; // "2025-12"
  end: string | null; // null = present
  periodLabel: string;
  durationLabel?: string;
  type: "Full-time" | "Internship";
  current: boolean;
  summary: string;
  highlights: string[];
  stack: string[];
};

export type ArchitectureLayer = {
  /** Layer of the system, top (user) to bottom (infrastructure). */
  layer: "Interface" | "API" | "Intelligence" | "Data" | "Infrastructure";
  items: string[];
  note?: string;
};

/**
 * What happens at one step of a featured project's `flow` (src/content/journeys.ts): the case-study
 * "How it works" diagram places the step in its layer and explains it. Restates the README only.
 */
export type JourneyStep = {
  /** The architecture layer the step happens in (the diagram lane). */
  layer: ArchitectureLayer["layer"];
  /** The technology doing the work, named as the README names it (code-ish, shown in mono). */
  tech?: string;
  /** What happens there: one or two sentences. */
  does: string;
  /** The same in a few handwritten words, for the diagram's margin note (Caveat). */
  note: string;
};

export type Project = {
  id: string;
  title: string;
  shortTitle: string;
  /** Approximate year (from résumé or repository history). */
  year: string;
  category: string;
  featured: boolean;
  tagline: string;
  summary: string;
  problem?: string;
  approach?: string;
  highlights: string[];
  /** Only real, verifiable numbers. */
  metrics: { value: string; label: string }[];
  award?: string;
  stack: string[];
  architecture: ArchitectureLayer[];
  /** Data/request flow through the system, in order. */
  flow?: string[];
  links: { repo?: string; live?: string };
};

export type SkillGroup = {
  id: string;
  label: string;
  /** Maps to a layer of the stack, useful for layered/system visualisations. */
  layer: "Interface" | "API" | "Intelligence" | "Data" | "Infrastructure" | "Languages" | "Practice";
  description: string;
  skills: { name: string; usedIn: string[] }[];
};

export type EducationItem = {
  id: string;
  institution: string;
  qualification: string;
  field: string;
  location: string;
  period: string;
  grade: string;
  note?: string;
};

export type Certification = {
  id: string;
  title: string;
  issuer: string;
  year: string;
  kind: "Certification" | "Award";
  href?: string;
  note?: string;
};
