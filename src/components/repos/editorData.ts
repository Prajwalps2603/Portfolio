/**
 * The repos as a workspace (the /repos page's code editor): a file tree (a folder per language, a
 * folder per repo, README.md and repo.json in each), the files' text, and the workspace README.
 * Every line is built from the GitHub data (src/content/garden.json via ./books); nothing invented.
 * Pure: no React.
 */
import { garden, monthYear } from "@/content/garden";
import { routes } from "@/lib/routes";
import { BOOKS, SHELF_LANGUAGES, type Book } from "./books";

/** A language's swatch (site tokens). */
export const LANG_DOT: Record<string, string> = {
  TypeScript: "bg-blue",
  JavaScript: "bg-lime",
  HTML: "bg-tangerine",
  CSS: "bg-blue-soft",
  "Jupyter Notebook": "bg-fog",
  Python: "bg-fog",
};
export const dotOf = (lang: string) => LANG_DOT[lang] ?? "bg-ash";

/** md and json are files in the tree; web is the browser a run opens (its live page) */
export type FileKind = "md" | "json" | "web";
export type EditorFile = {
  id: string;
  name: string;
  kind: FileKind;
  repo: Book | null;
  path: string[];
};

const slug = (b: Book) => b.repo.name;
export const ROOT = garden.user;

export const WORKSPACE_README: EditorFile = {
  id: "README.md",
  name: "README.md",
  kind: "md",
  repo: null,
  path: [ROOT, "README.md"],
};
export const fileOf = (b: Book, kind: FileKind): EditorFile => ({
  id: `${slug(b)}/${kind === "md" ? "README.md" : "repo.json"}`,
  name: kind === "md" ? "README.md" : "repo.json",
  kind,
  repo: b,
  path: [ROOT, b.language, slug(b), kind === "md" ? "README.md" : "repo.json"],
});

/** The browser tab a run opens: the repo's live page (or a "not deployed" page). */
export const webFileOf = (b: Book): EditorFile => ({
  id: `${slug(b)}/live`,
  name: "live",
  kind: "web",
  repo: b,
  path: [b.repo.live ?? "not deployed"],
});
/** The repos that run somewhere (a live address that answered at build time). */
export const LIVE = BOOKS.filter((b) => b.repo.live);
/** What runs from the workspace root: the portfolio (his live page), else the first live repo. */
export const HOME_RUN =
  BOOKS.find((b) => b.repo.name.toLowerCase() === "portfolio" && b.repo.live) ??
  LIVE[0] ??
  null;

export const TREE = SHELF_LANGUAGES.map((l) => ({
  language: l.language,
  repos: BOOKS.filter((b) => b.language === l.language),
}));

const size = (kb?: number) =>
  kb === undefined
    ? "unknown"
    : kb >= 1024
      ? `${(kb / 1024).toFixed(1)} MB`
      : `${kb} KB`;

/* ---- markdown: source lines (with simple token kinds) and what they render to ---------------- */
export type Tok = {
  t: string;
  k?: "h" | "b" | "q" | "l" | "u" | "c" | "dim" | "key" | "str" | "num" | "pun";
};
export type Line = Tok[];

/** A repo's README.md, as source lines. */
export function readmeSource(b: Book): Line[] {
  const r = b.repo;
  const lines: Line[] = [
    [{ t: `# ${b.title}`, k: "h" }],
    [],
    r.description
      ? [
          { t: "> ", k: "q" },
          { t: r.description, k: "q" },
        ]
      : [{ t: "_No description on GitHub yet._", k: "dim" }],
    [],
    [{ t: "- " }, { t: "**Language:**", k: "b" }, { t: ` ${b.language}` }],
    [
      { t: "- " },
      { t: "**Started:**", k: "b" },
      { t: ` ${monthYear(r.created)}` },
    ],
    [
      { t: "- " },
      { t: "**Last push:**", k: "b" },
      { t: ` ${monthYear(r.pushed)}` },
    ],
    [{ t: "- " }, { t: "**Size:**", k: "b" }, { t: ` ${size(r.size)}` }],
    [
      { t: "- " },
      { t: "**Live:**", k: "b" },
      r.live ? { t: ` ${r.live}`, k: "l" } : { t: " not deployed", k: "dim" },
    ],
  ];
  if (r.stars)
    lines.push([
      { t: "- " },
      { t: "**Stars:**", k: "b" },
      { t: ` ${r.stars}` },
    ]);
  lines.push(
    [],
    [
      { t: "[Open on GitHub]", k: "l" },
      { t: `(${r.url})`, k: "u" },
    ],
  );
  if (b.caseStudy)
    lines.push([
      { t: "[Read the case study]", k: "l" },
      { t: `(${routes.work(b.caseStudy.id)})`, k: "u" },
    ]);
  return lines;
}

/** A repo's repo.json (its GitHub metadata), as highlighted lines. */
export function jsonSource(b: Book): Line[] {
  const r = b.repo;
  const entries: [string, string | number | null][] = [
    ["name", r.name],
    ["language", r.language],
    ["description", r.description],
    ["created", r.created],
    ["lastPush", r.pushed],
    ["sizeKB", r.size ?? null],
    ["stars", r.stars],
    ["url", r.url],
    ["live", r.live ?? null],
    ["caseStudy", b.caseStudy ? routes.work(b.caseStudy.id) : null],
  ];
  const out: Line[] = [[{ t: "{", k: "pun" }]];
  entries.forEach(([k, v], i) => {
    const comma = i < entries.length - 1 ? "," : "";
    const val: Tok =
      v === null
        ? { t: "null", k: "num" }
        : typeof v === "number"
          ? { t: String(v), k: "num" }
          : { t: JSON.stringify(v), k: "str" };
    out.push([
      { t: "  " },
      { t: JSON.stringify(k), k: "key" },
      { t: ": ", k: "pun" },
      val,
      { t: comma, k: "pun" },
    ]);
  });
  out.push([{ t: "}", k: "pun" }]);
  return out;
}

/** The workspace's README.md. */
export function workspaceSource(): Line[] {
  const years = BOOKS.map((b) => b.repo.created).sort();
  const lines: Line[] = [
    [{ t: "# Prajwal's repos", k: "h" }],
    [],
    [
      {
        t: `${BOOKS.length} public repositories in ${SHELF_LANGUAGES.length} languages, from ${monthYear(years[0])} to ${monthYear(years[years.length - 1])}.`,
      },
    ],
    [],
    [{ t: "## Languages", k: "h" }],
    ...SHELF_LANGUAGES.map((l): Line => [
      { t: "- " },
      { t: `**${l.language}**`, k: "b" },
      { t: `: ${l.count}` },
    ]),
    [],
    [{ t: "## Newest", k: "h" }],
    ...[...BOOKS]
      .sort((a, b) => (a.repo.created < b.repo.created ? 1 : -1))
      .slice(0, 5)
      .map((b): Line => [
        { t: "- " },
        { t: `[${b.title}]`, k: "l" },
        { t: `(./${b.language}/${b.repo.name})`, k: "u" },
        { t: ` · ${monthYear(b.repo.created)}`, k: "dim" },
      ]),
    [],
    [{ t: "## With a case study", k: "h" }],
    ...BOOKS.filter((b) => b.caseStudy).map((b): Line => [
      { t: "- " },
      { t: `[${b.caseStudy!.title}]`, k: "l" },
      { t: `(${routes.work(b.caseStudy!.id)})`, k: "u" },
    ]),
    [],
    [{ t: "## Live (npm run dev opens them)", k: "h" }],
    ...LIVE.map((b): Line => [
      { t: "- " },
      { t: `[${b.repo.name}]`, k: "l" },
      { t: `(${b.repo.live})`, k: "u" },
    ]),
  ];
  return lines;
}

export const sourceOf = (f: EditorFile): Line[] =>
  f.kind === "web" ? [] : sourceOfFile(f);
const sourceOfFile = (f: EditorFile): Line[] =>
  f.repo
    ? f.kind === "md"
      ? readmeSource(f.repo)
      : jsonSource(f.repo)
    : workspaceSource();

/** The git log: a commit per repo, on the day it was created (newest first). */
export const LOG = [...BOOKS]
  .sort((a, b) => (a.repo.created < b.repo.created ? 1 : -1))
  .map((b) => ({
    book: b,
    hash: hex(b.repo.name),
    date: b.repo.created,
    msg: `feat: create ${b.repo.name}`,
  }));
function hex(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

/** Find a repo by a loose name ("audify", "Audify-AI", "audify ai"). */
export function findRepo(q: string): Book | null {
  const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const k = n(q);
  if (!k) return null;
  return (
    BOOKS.find((b) => n(b.repo.name) === k) ??
    BOOKS.find((b) => n(b.repo.name).startsWith(k)) ??
    BOOKS.find((b) => n(b.repo.name).includes(k)) ??
    null
  );
}
export { BOOKS, SHELF_LANGUAGES };
export type { Book };
