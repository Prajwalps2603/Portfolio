/**
 * The repos as books (the /repos page): one book per public repository (from GitHub at build time,
 * src/content/garden.json), bound in its language's colour, its thickness from the repo's size, a
 * ribbon on the ones with a case study. Pure data: no React, no three.js.
 */
import { garden, monthYear, type GardenRepo } from "@/content/garden";
import { featuredProjects } from "@/content";

export type Book = {
  i: number;
  repo: GardenRepo;
  title: string;
  language: string;
  /** cloth colour, its darker shade, and the ink on the spine */
  cloth: string;
  clothDark: string;
  ink: string;
  height: number;
  thickness: number;
  caseStudy: { id: string; title: string } | null;
  sown: string;
};

const CLOTH: Record<string, [string, string, string]> = {
  TypeScript: ["#2d5aa0", "#1d3d70", "#f3e6c4"],
  JavaScript: ["#c8952a", "#8f6516", "#2a1d0e"],
  HTML: ["#a8442a", "#6f2a18", "#f6e3c2"],
  CSS: ["#674c9c", "#43306b", "#efe2ff"],
  "Jupyter Notebook": ["#2e7448", "#1c4c2e", "#efe7c8"],
  Python: ["#2e7448", "#1c4c2e", "#efe7c8"],
};
const PLAIN: [string, string, string] = ["#7b6650", "#4f412f", "#f3e6c4"];

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** The language order on the shelves: the most used first. */
const order = (() => {
  const n = new Map<string, number>();
  for (const r of garden.repos)
    n.set(r.language ?? "Other", (n.get(r.language ?? "Other") ?? 0) + 1);
  return [...n.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([k]) => k);
})();

export const BOOKS: Book[] = [...garden.repos]
  .sort(
    (a, b) =>
      order.indexOf(a.language ?? "Other") -
        order.indexOf(b.language ?? "Other") ||
      (a.created < b.created ? 1 : -1),
  )
  .map((repo, i) => {
    const language = repo.language ?? "Other";
    const [cloth, clothDark, ink] = CLOTH[language] ?? PLAIN;
    const study = featuredProjects.find(
      (p) =>
        p.links.repo?.toLowerCase().replace(/\/+$/, "") ===
        repo.url.toLowerCase(),
    );
    const h = hash(repo.name);
    const size = repo.size ?? 200;
    return {
      i,
      repo,
      title: repo.name.replace(/[-_]+/g, " "),
      language,
      cloth,
      clothDark,
      ink,
      height: 0.25 + ((h % 1000) / 1000) * 0.07,
      thickness: Math.min(
        0.085,
        Math.max(0.038, 0.026 + Math.log10(size + 10) * 0.011),
      ),
      caseStudy: study ? { id: study.id, title: study.shortTitle } : null,
      sown: monthYear(repo.created),
    };
  });

/** The languages in shelf order, with how many books each. */
export const SHELF_LANGUAGES = order.map((l) => ({
  language: l,
  count: BOOKS.filter((b) => b.language === l).length,
  cloth: (CLOTH[l] ?? PLAIN)[0],
}));
