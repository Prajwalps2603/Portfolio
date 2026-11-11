import type { SectionId } from "./sections";

/**
 * Route helpers. All paths are app paths WITHOUT the deployment base path: next/link and
 * router.push add it (raw asset URLs go through asset() instead). trailingSlash is on, so page
 * paths end in "/".
 */
export const routes = {
  home: "/",
  /** The repos, as a code editor (src/app/repos). */
  repos: "/repos/",
  /** The Prajwal Times: the résumé as a newspaper front page (src/app/resume). */
  resume: "/resume/",
  /** Contact as a pull request: a PR form that opens a prefilled email (src/app/pull-request). */
  pullRequest: "/pull-request/",
  /** A case study: /work/<slug>/ (slug = Project.id in src/content/projects.ts, featured only). */
  work: (slug: string) => `/work/${slug}/`,
  /** A home section from any page: "/#work". On the home page this smooth-scrolls. */
  section: (id: SectionId) => `/#${id}`,
} as const;

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** "/Portfolio/work/x/" or "/work/x" -> "/work/x" ; "/" stays "/". Drops query and hash. */
export function normalizePath(path: string): string {
  let p = path.split(/[?#]/)[0] || "/";
  if (BASE && (p === BASE || p.startsWith(`${BASE}/`))) p = p.slice(BASE.length) || "/";
  if (p.length > 1) p = p.replace(/\/+$/, "");
  if (p === "/index.html" || p === "") p = "/";
  return p;
}

export function isHomePath(path: string): boolean {
  return normalizePath(path) === "/";
}

/** Slug if the path is a case study (/work/<slug>), else null. */
export function caseStudySlug(path: string): string | null {
  const m = /^\/work\/([^/]+)$/.exec(normalizePath(path));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Prefix an app path with the base path, for the rare hard navigation (location.assign). */
export function withBasePath(path: string): string {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
