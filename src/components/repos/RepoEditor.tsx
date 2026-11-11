"use client";

/**
 * THE REPOS, AS A CODE EDITOR (the /repos page, "Repos" in the header; Prajwal picked "a code
 * editor explorer", no film-like scenes). An editor window in the site's ink: an activity bar
 * (Explorer, Search, Timeline), the side bar, tabs, breadcrumbs, the editor, a terminal, a status
 * bar. The Explorer is the workspace: a folder per language, a folder per repo, README.md and
 * repo.json in each (built from the GitHub data, ./editorData). A README opens with its source and
 * a live preview side by side (preview only on narrow screens, with a Source toggle); repo.json is
 * the repo's metadata, highlighted, with a minimap. Search filters the repos; Timeline is the git
 * log (a commit per repo, on the day it was created). The terminal takes help, ls, open, cat, git
 * log and clear, with Tab to complete and the arrow keys for history. Motion: only UI transitions.
 * Nothing in it scrolls on its own (his ask: "no need that scrolling, extend the height"): the
 * window is as tall as what is open, and the page scrolls. Opening a file brings the editor's top
 * into view if it is off screen.
 * RUN (his ask: a play icon in the left bar; "run", "npm run dev", "npm start" in the terminal):
 * the play button (and those commands) run the open repo (from the workspace: this portfolio) in
 * the terminal, then open its live page in a browser tab in the editor. The live address is real:
 * the repo's GitHub Pages site (or website field), kept at build time only if it answered. A repo
 * that is not deployed opens a page that says so, with its code on GitHub.
 */
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { garden, monthYear, shortDate } from "@/content/garden";
import { routes } from "@/lib/routes";
import { ExternalLink } from "@/components/ui";
import { TransitionLink } from "@/components/transition";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import {
  BOOKS,
  LOG,
  ROOT,
  SHELF_LANGUAGES,
  TREE,
  WORKSPACE_README,
  HOME_RUN,
  LIVE,
  dotOf,
  fileOf,
  findRepo,
  sourceOf,
  webFileOf,
  type Book,
  type EditorFile,
  type Line,
  type Tok,
} from "./editorData";

type View = "explorer" | "search" | "timeline" | "run";
/** a terminal line; an input line remembers the folder it was typed in */
type TermLine = {
  k: "in" | "out" | "dim" | "err" | "ok";
  text: string;
  at?: string;
};
/** what the editor asks of the terminal: run a repo (null: from the workspace root) */
type TermApi = { run: (b: Book | null) => void };
const MAX_TABS = 6;
const NEWEST = [...BOOKS].sort((a, b) =>
  a.repo.created < b.repo.created ? 1 : -1,
)[0];

export function RepoEditor() {
  const [view, setView] = useState<View>("explorer");
  const [drawer, setDrawer] = useState(false);
  const [tabs, setTabs] = useState<EditorFile[]>([WORKSPACE_README]);
  const [active, setActive] = useState(WORKSPACE_README.id);
  const [open, setOpen] = useState<Set<string>>(
    () =>
      new Set([ROOT, ...(NEWEST ? [NEWEST.language, NEWEST.repo.name] : [])]),
  );
  const [query, setQuery] = useState("");
  const [mdMode, setMdMode] = useState<"preview" | "source">("preview");
  const [termOpen, setTermOpen] = useState(true);
  const [cursors, setCursors] = useState<Record<string, number>>({});
  const [running, setRunning] = useState<string | null>(null);
  const termApi = useRef<TermApi | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);
  const { scrollTo } = useSmoothScroll();
  const file = tabs.find((t) => t.id === active) ?? tabs[0] ?? WORKSPACE_README;
  const lines = useMemo(() => sourceOf(file), [file]);
  // the open tab stays in sight in the tab strip (it scrolls sideways when the tabs overflow)
  useEffect(() => {
    const strip = tablistRef.current;
    const tab = strip?.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    )?.parentElement;
    if (!strip || !tab) return;
    const l = tab.offsetLeft;
    const r = l + tab.offsetWidth;
    if (l < strip.scrollLeft) strip.scrollLeft = l;
    else if (r > strip.scrollLeft + strip.clientWidth)
      strip.scrollLeft = r - strip.clientWidth;
  }, [active, tabs]);
  const cursor = Math.min(cursors[file.id] ?? 0, lines.length - 1);
  const setCursor = (i: number) => setCursors((c) => ({ ...c, [file.id]: i }));
  /** the inline note on the cursor's line (as an editor's blame annotation would): when, from GitHub */
  const blame = file.repo
    ? `created ${file.repo.repo.created} · pushed ${file.repo.repo.pushed}`
    : `${BOOKS.length} repos · read from GitHub ${garden.fetched}`;

  const openFile = (f: EditorFile) => {
    setTabs((ts) => {
      if (ts.some((t) => t.id === f.id)) return ts;
      const next = [...ts, f];
      return next.length > MAX_TABS ? next.slice(next.length - MAX_TABS) : next;
    });
    setActive(f.id);
    if (f.repo)
      setOpen((s) => new Set([...s, f.repo!.language, f.repo!.repo.name]));
    setDrawer(false);
    // the window grows with its content, so a file opened from far down (the tree, the git log,
    // the terminal) may open above the screen: bring the tabs back under the header
    requestAnimationFrame(() => {
      const el = editorRef.current;
      if (!el) return;
      const header =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--header-h",
          ),
        ) || 72;
      const top = el.getBoundingClientRect().top;
      if (top < header || top > window.innerHeight * 0.7)
        scrollTo(el, { offset: -(header + 16) });
    });
  };
  const closeTab = (id: string) => {
    if (running && id === `${running}/live`) setRunning(null);
    setTabs((ts) => {
      const i = ts.findIndex((t) => t.id === id);
      const next = ts.filter((t) => t.id !== id);
      if (id === active && next.length) setActive(next[Math.max(0, i - 1)].id);
      return next.length ? next : [WORKSPACE_README];
    });
    if (tabs.length === 1) setActive(WORKSPACE_README.id);
  };
  const toggle = (k: string) =>
    setOpen((s) =>
      s.has(k) ? new Set([...s].filter((x) => x !== k)) : new Set([...s, k]),
    );
  const pick = (v: View) => {
    if (v === view) setDrawer((d) => !d);
    else {
      setView(v);
      setDrawer(true);
    }
  };
  /** run a repo in the terminal (null: from the workspace root, which runs this portfolio) */
  const run = (b: Book | null) => {
    setTermOpen(true);
    // the terminal mounts its body on open: wait a frame when it was closed
    requestAnimationFrame(() => termApi.current?.run(b));
  };
  /** the play button: the Run view on wide screens (on a phone the editor stays, to show the run) */
  const play = () => {
    setView("run");
    if (!window.matchMedia("(min-width: 48rem)").matches) setDrawer(false);
    run(file.repo);
  };
  /** the terminal's run reached its end: open the browser (the live page, or "not deployed") */
  const launch = (b: Book) => {
    // only something live is "running"; a repo that isn't deployed just shows its page
    setRunning(b.repo.live ? b.repo.name : null);
    openFile(webFileOf(b));
  };
  const stop = (name: string) => {
    setRunning(null);
    closeTab(`${name}/live`);
  };

  return (
    <div
      data-tone="ink"
      data-qa="repo-editor"
      className="overflow-hidden rounded-[18px] border border-seam bg-ink text-paper"
    >
      {/* the title bar */}
      <div className="flex h-10 items-center gap-3 border-b border-seam bg-ink-2 px-4">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="size-3 rounded-full bg-tangerine" />
          <span className="size-3 rounded-full bg-lime" />
          <span className="size-3 rounded-full bg-blue" />
        </span>
        <p className="type-mono min-w-0 flex-1 truncate text-center text-fog">
          {tabLabel(file)} — {ROOT.toLowerCase()} — repos
        </p>
        <span aria-hidden="true" className="w-12" />
      </div>

      <div className="grid min-h-[560px] grid-cols-[46px_minmax(0,1fr)] md:min-h-[640px] md:grid-cols-[46px_272px_minmax(0,1fr)]">
        {/* the activity bar */}
        <nav
          aria-label="Editor views"
          className="flex flex-col items-center gap-1 border-r border-seam bg-ink-2 py-2"
        >
          <ActivityButton
            label="Explorer"
            active={view === "explorer"}
            onClick={() => pick("explorer")}
            icon="files"
          />
          <ActivityButton
            label="Search"
            active={view === "search"}
            onClick={() => pick("search")}
            icon="search"
          />
          <ActivityButton
            label="Timeline (git log)"
            active={view === "timeline"}
            onClick={() => pick("timeline")}
            icon="git"
          />
          <ActivityButton
            label="Run (npm run dev): opens the live page"
            active={view === "run"}
            onClick={play}
            icon="run"
          />
        </nav>

        {/* the side bar (below 768px it takes the editor's place while it is open) */}
        <aside
          aria-label={
            view === "explorer"
              ? "Explorer"
              : view === "search"
                ? "Search"
                : view === "timeline"
                  ? "Timeline"
                  : "Run and debug"
          }
          className={`min-w-0 flex-col bg-ink-2 md:flex md:border-r md:border-seam ${drawer ? "flex" : "hidden"}`}
        >
          {view === "explorer" ? (
            <Explorer
              open={open}
              toggle={toggle}
              active={active}
              openFile={openFile}
            />
          ) : null}
          {view === "search" ? (
            <Search query={query} setQuery={setQuery} openFile={openFile} />
          ) : null}
          {view === "timeline" ? <Timeline openFile={openFile} /> : null}
          {view === "run" ? (
            <RunView target={file.repo} running={running} onRun={run} />
          ) : null}
        </aside>

        {/* the editor */}
        <div
          ref={editorRef}
          className={`min-w-0 flex-col ${drawer ? "hidden md:flex" : "flex"}`}
        >
          <div
            ref={tablistRef}
            role="tablist"
            aria-label="Open files"
            className="flex min-h-10 overflow-x-auto border-b border-seam bg-ink-2 [scrollbar-width:none]"
          >
            {tabs.map((t) => (
              <div
                key={t.id}
                className={`group flex shrink-0 items-center border-r border-seam ${t.id === active ? "bg-(--color-ink)" : ""}`}
              >
                <button
                  type="button"
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={t.id === active}
                  aria-controls="editor-panel"
                  data-qa="editor-tab"
                  onClick={() => setActive(t.id)}
                  onAuxClick={(e) => e.button === 1 && closeTab(t.id)}
                  className={`type-mono flex h-10 items-center gap-2 pr-1 pl-3 ${t.id === active ? "text-paper" : "text-fog hover:text-paper"}`}
                >
                  <FileIcon kind={t.kind} />
                  {tabLabel(t)}
                </button>
                <button
                  type="button"
                  aria-label={`Close ${tabLabel(t)}`}
                  onClick={() => closeTab(t.id)}
                  className="mr-1.5 grid size-6 place-items-center rounded-[4px] text-fog hover:bg-seam hover:text-paper"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 12 12"
                    className="size-3"
                    fill="none"
                  >
                    <path
                      d="M3 3l6 6M9 3l-6 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* breadcrumbs, the Source / Preview toggle on narrow screens (files only) */}
          <div
            className={`min-h-8 items-center gap-2 border-b border-seam px-4 ${file.kind === "web" ? "hidden" : "flex"}`}
          >
            <p
              data-qa="crumbs"
              className="type-micro min-w-0 flex-1 truncate text-fog"
            >
              {file.path.map((p, i) => (
                <span key={i}>
                  {i ? <span className="mx-1.5 opacity-60">›</span> : null}
                  <span
                    className={i === file.path.length - 1 ? "text-paper" : ""}
                  >
                    {p}
                  </span>
                </span>
              ))}
            </p>
            {file.kind === "md" ? (
              <div
                className="flex gap-1 xl:hidden"
                role="group"
                aria-label="README view"
              >
                {(["preview", "source"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mdMode === m}
                    onClick={() => setMdMode(m)}
                    className="type-micro rounded-[4px] px-2 py-1 text-fog aria-pressed:bg-seam aria-pressed:text-paper"
                  >
                    {m === "preview" ? "Preview" : "Source"}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div
            id="editor-panel"
            role="tabpanel"
            aria-labelledby={`tab-${file.id}`}
            className="flex flex-1 flex-col"
          >
            {file.kind === "web" && file.repo ? (
              <Browser key={file.id} book={file.repo} onRun={run} />
            ) : file.kind === "md" ? (
              <div className="grid flex-1 xl:grid-cols-2">
                <div
                  className={`min-w-0 border-seam xl:block xl:border-r ${mdMode === "source" ? "block" : "hidden"}`}
                >
                  <Source
                    lines={lines}
                    cursor={cursor}
                    onCursor={setCursor}
                    blame={blame}
                  />
                </div>
                <div
                  className={`min-w-0 xl:block ${mdMode === "preview" ? "block" : "hidden"}`}
                >
                  {file.repo ? (
                    <RepoPreview book={file.repo} onRun={run} />
                  ) : (
                    <WorkspacePreview openFile={openFile} onRun={run} />
                  )}
                </div>
              </div>
            ) : (
              <div className="grid flex-1 sm:grid-cols-[minmax(0,1fr)_64px]">
                <Source
                  lines={lines}
                  cursor={cursor}
                  onCursor={setCursor}
                  blame={blame}
                />
                <Minimap lines={lines} cursor={cursor} onCursor={setCursor} />
              </div>
            )}
          </div>

          <Terminal
            open={termOpen}
            setOpen={setTermOpen}
            openFile={openFile}
            apiRef={termApi}
            activeRepo={file.repo}
            running={running}
            onLaunch={launch}
            onStop={stop}
          />
        </div>
      </div>

      {/* the status bar */}
      <div className="type-micro flex h-7 items-center gap-4 overflow-hidden border-t border-seam bg-ink-2 px-3 whitespace-nowrap text-fog">
        <span className="flex items-center gap-1.5 text-lime">
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="4" cy="3.5" r="1.6" />
            <circle cx="4" cy="12.5" r="1.6" />
            <circle cx="12" cy="6" r="1.6" />
            <path d="M4 5v6M12 7.6c0 2.4-3 2.4-6.6 4" />
          </svg>
          main
        </span>
        <span>
          {BOOKS.length} repos
          <span className="max-sm:hidden">
            {" "}
            · {SHELF_LANGUAGES.length} languages
          </span>
        </span>
        <span
          className="flex items-center gap-1 max-sm:hidden"
          title="No problems"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" />
          </svg>
          0
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="ml-1 size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          >
            <path d="M8 2l6.5 11.5h-13zM8 6.5v3.5M8 12v.01" />
          </svg>
          0<span className="sr-only"> problems</span>
        </span>
        {running ? (
          <span
            data-qa="running"
            className="flex items-center gap-1.5 text-paper max-sm:hidden"
          >
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-tangerine"
            />
            running {running}
          </span>
        ) : null}
        <span
          className={`ml-auto max-sm:hidden ${file.kind === "web" ? "invisible" : ""}`}
          data-qa="cursor-pos"
        >
          Ln {cursor + 1}, Col 1
        </span>
        <span className="max-sm:ml-auto">
          {file.kind === "md"
            ? "Markdown"
            : file.kind === "json"
              ? "JSON"
              : "Browser"}
        </span>
        <span className="max-sm:hidden">UTF-8</span>
        <span className="max-sm:hidden">
          fetched {shortDate(garden.fetched)} {garden.fetched.slice(0, 4)}
        </span>
      </div>
    </div>
  );
}

function ActivityButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: "files" | "search" | "git" | "run";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={`relative grid size-10 place-items-center rounded-[6px] ${icon === "run" ? "text-lime hover:bg-seam" : active ? "text-paper" : "text-ash hover:text-fog"}`}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-1.5 -left-[3px] w-0.5 rounded-full bg-lime"
        />
      ) : null}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon === "files" ? (
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4" />
        ) : null}
        {icon === "search" ? (
          <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />
        ) : null}
        {icon === "git" ? (
          <path d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9" />
        ) : null}
        {icon === "run" ? (
          <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
        ) : null}
      </svg>
    </button>
  );
}

/** a tab's name: a repo's file as repo/file, its browser as "repo · live" */
const tabLabel = (t: EditorFile) =>
  t.kind === "web"
    ? `${t.repo!.repo.name} · live`
    : `${t.repo ? `${t.repo.repo.name}/` : ""}${t.name}`;

function FileIcon({ kind }: { kind: "md" | "json" | "web" }) {
  if (kind === "web")
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-3.5 text-lime"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <circle cx="8" cy="8" r="6.2" />
        <path d="M1.8 8h12.4M8 1.8c2 2 2 10.4 0 12.4M8 1.8c-2 2-2 10.4 0 12.4" />
      </svg>
    );
  return kind === "md" ? (
    <span
      aria-hidden="true"
      className="text-[11px] leading-none font-bold text-blue-soft"
    >
      M↓
    </span>
  ) : (
    <span
      aria-hidden="true"
      className="text-[11px] leading-none font-bold text-tangerine"
    >
      {"{}"}
    </span>
  );
}
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={`size-3 shrink-0 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
      fill="none"
    >
      <path
        d="M4.5 2.5L8 6l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ROW =
  "type-mono flex w-full min-h-7 items-center gap-1.5 rounded-[4px] pr-2 text-left hover:bg-seam";

/** The Explorer: the workspace tree. */
function Explorer({
  open,
  toggle,
  active,
  openFile,
}: {
  open: Set<string>;
  toggle: (k: string) => void;
  active: string;
  openFile: (f: EditorFile) => void;
}) {
  return (
    <div className="p-2">
      <p className="type-micro px-2 pt-1 pb-2 tracking-[0.16em] text-fog uppercase">
        Explorer
      </p>
      <button
        type="button"
        aria-expanded={open.has(ROOT)}
        onClick={() => toggle(ROOT)}
        className={`${ROW} pl-1 font-bold text-paper`}
      >
        <Chevron open={open.has(ROOT)} />
        {ROOT.toUpperCase()}
      </button>
      {open.has(ROOT) ? (
        <ul>
          <li>
            <button
              type="button"
              data-qa="tree-file"
              onClick={() => openFile(WORKSPACE_README)}
              className={`${ROW} pl-6 ${active === WORKSPACE_README.id ? "bg-seam text-paper" : "text-fog"}`}
            >
              <FileIcon kind="md" /> README.md
            </button>
          </li>
          {TREE.map((g) => (
            <li key={g.language}>
              <button
                type="button"
                aria-expanded={open.has(g.language)}
                data-qa="tree-lang"
                onClick={() => toggle(g.language)}
                className={`${ROW} pl-3 text-paper`}
              >
                <Chevron open={open.has(g.language)} />
                <span
                  aria-hidden="true"
                  className={`inline-block size-2 shrink-0 rounded-full ${dotOf(g.language)}`}
                />
                <span className="truncate">{g.language}</span>
                <span className="ml-auto text-fog tabular-nums">
                  {g.repos.length}
                </span>
              </button>
              {open.has(g.language) ? (
                <ul>
                  {g.repos.map((b) => (
                    <li key={b.repo.name}>
                      <button
                        type="button"
                        aria-expanded={open.has(b.repo.name)}
                        data-qa="tree-repo"
                        title={b.repo.name}
                        onClick={() => toggle(b.repo.name)}
                        className={`${ROW} pl-6 text-paper`}
                      >
                        <Chevron open={open.has(b.repo.name)} />
                        <span className="truncate">{b.repo.name}</span>
                        {b.caseStudy ? (
                          <span
                            aria-label="has a case study"
                            className="ml-auto size-1.5 shrink-0 rounded-full bg-tangerine"
                          />
                        ) : null}
                      </button>
                      {open.has(b.repo.name) ? (
                        <ul>
                          {(["md", "json"] as const).map((k) => {
                            const f = fileOf(b, k);
                            return (
                              <li key={k}>
                                <button
                                  type="button"
                                  data-qa="tree-file"
                                  onClick={() => openFile(f)}
                                  className={`${ROW} pl-12 ${active === f.id ? "bg-seam text-paper" : "text-fog"}`}
                                >
                                  <FileIcon kind={k} /> {f.name}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Search: the repos by name, language or description. */
function Search({
  query,
  setQuery,
  openFile,
}: {
  query: string;
  setQuery: (q: string) => void;
  openFile: (f: EditorFile) => void;
}) {
  const q = query.trim().toLowerCase();
  const hits = q
    ? BOOKS.filter((b) =>
        `${b.repo.name} ${b.language} ${b.repo.description ?? ""}`
          .toLowerCase()
          .includes(q),
      )
    : [];
  return (
    <div className="p-3">
      <p className="type-micro pb-2 tracking-[0.16em] text-fog uppercase">
        Search
      </p>
      <label className="sr-only" htmlFor="repo-search">
        Search the repos
      </label>
      <input
        id="repo-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="name, language, words…"
        autoComplete="off"
        className="type-mono w-full rounded-[6px] border border-seam bg-(--color-ink) px-2.5 py-2 text-paper placeholder:text-fog focus-visible:border-lime focus-visible:outline-none"
      />
      <p className="type-micro mt-2 text-fog" aria-live="polite">
        {q
          ? `${hits.length} result${hits.length === 1 ? "" : "s"}`
          : `${BOOKS.length} repos`}
      </p>
      <ul className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-1">
        {(q ? hits : BOOKS).map((b) => (
          <li key={b.repo.name}>
            <button
              type="button"
              onClick={() => openFile(fileOf(b, "md"))}
              className="w-full rounded-[6px] px-2 py-1.5 text-left hover:bg-seam"
            >
              <span className="type-mono flex items-center gap-1.5 text-paper">
                <span
                  aria-hidden="true"
                  className={`inline-block size-2 rounded-full ${dotOf(b.language)}`}
                />
                {b.repo.name}
              </span>
              {b.repo.description ? (
                <span className="type-micro mt-0.5 line-clamp-2 block text-fog">
                  {b.repo.description}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Timeline: the git log, a commit per repo on the day it was created. */
function Timeline({ openFile }: { openFile: (f: EditorFile) => void }) {
  return (
    <div className="p-3">
      <p className="type-micro pb-2 tracking-[0.16em] text-fog uppercase">
        Timeline · git log
      </p>
      <ol className="relative grid grid-cols-[minmax(0,1fr)] gap-0.5 before:absolute before:inset-y-3 before:left-[7px] before:w-px before:bg-ash/50">
        {LOG.map((c) => (
          <li key={c.hash}>
            <button
              type="button"
              onClick={() => openFile(fileOf(c.book, "md"))}
              className="relative flex w-full items-start gap-2.5 rounded-[6px] py-1.5 pr-2 text-left hover:bg-seam"
            >
              <span
                aria-hidden="true"
                className={`relative mt-1 size-[15px] shrink-0 rounded-full border-2 border-ink-2 ${dotOf(c.book.language)}`}
              />
              <span className="min-w-0">
                <span className="type-mono block truncate text-paper">
                  {c.msg}
                </span>
                <span className="type-micro text-fog">
                  <span className="text-tangerine">{c.hash}</span> · {c.date}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

const TOK: Record<NonNullable<Tok["k"]>, string> = {
  h: "text-paper font-bold",
  b: "text-paper font-semibold",
  q: "text-fog italic",
  l: "text-blue-soft",
  u: "text-fog",
  c: "text-lime",
  dim: "text-fog",
  key: "text-blue-soft",
  str: "text-lime",
  num: "text-tangerine",
  pun: "text-fog",
};

/**
 * Source lines with numbers. A click puts the cursor on a line: it is marked, its number lights,
 * and the line carries a quiet note at its end (when the repo was created and last pushed).
 */
function Source({
  lines,
  cursor,
  onCursor,
  blame,
}: {
  lines: Line[];
  cursor: number;
  onCursor: (i: number) => void;
  blame: string;
}) {
  return (
    <pre
      data-qa="source"
      className="type-mono overflow-x-auto py-3 leading-[1.7]"
    >
      {lines.map((l, i) => (
        <div
          key={i}
          data-line={i + 1}
          onClick={() => onCursor(i)}
          className={`flex cursor-text ${i === cursor ? "bg-seam/70" : ""}`}
        >
          <span
            aria-hidden="true"
            className={`w-11 shrink-0 pr-4 text-right tabular-nums select-none ${i === cursor ? "text-paper" : "text-fog"}`}
          >
            {i + 1}
          </span>
          <span className="min-w-0 pr-4 whitespace-pre-wrap">
            {l.length
              ? l.map((t, k) => (
                  <span key={k} className={t.k ? TOK[t.k] : "text-paper"}>
                    {t.t}
                  </span>
                ))
              : " "}
            {i === cursor ? (
              <span
                data-qa="blame"
                className="pl-6 text-fog italic select-none max-sm:hidden"
              >
                {blame}
              </span>
            ) : null}
          </span>
        </div>
      ))}
    </pre>
  );
}

/** A minimap: a bar per line, as long as the line, coloured by what it holds; a click moves the cursor. */
function Minimap({
  lines,
  cursor,
  onCursor,
}: {
  lines: Line[];
  cursor: number;
  onCursor: (i: number) => void;
}) {
  return (
    <div
      aria-hidden="true"
      data-qa="minimap"
      className="border-l border-seam px-2 py-3 max-sm:hidden"
    >
      {lines.map((l, i) => {
        const len = l.reduce((n, t) => n + t.t.length, 0);
        const k = l.find((t) => t.k && t.k !== "pun")?.k;
        return (
          <span
            key={i}
            onClick={() => onCursor(i)}
            className={`block cursor-pointer py-[1.5px] ${i === cursor ? "bg-seam" : ""}`}
          >
            <span
              className={`block h-[3px] rounded-full ${k === "str" ? "bg-lime/70" : k === "key" ? "bg-blue-soft/70" : k === "num" ? "bg-tangerine/70" : "bg-ash/70"}`}
              style={{ width: `${Math.min(100, 8 + len * 1.6)}%` }}
            />
          </span>
        );
      })}
    </div>
  );
}

/** A repo's README, rendered. */
function RepoPreview({
  book,
  onRun,
}: {
  book: Book;
  onRun: (b: Book) => void;
}) {
  const r = book.repo;
  return (
    <article className="px-6 py-6 sm:px-8">
      <h1 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.05] font-extrabold tracking-[-0.02em] break-words text-paper">
        {book.title}
      </h1>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge dot={dotOf(book.language)}>{book.language}</Badge>
        <Badge>started {monthYear(r.created)}</Badge>
        <Badge>last push {monthYear(r.pushed)}</Badge>
        {r.stars ? <Badge>★ {r.stars}</Badge> : null}
        {book.caseStudy ? <Badge dot="bg-tangerine">case study</Badge> : null}
      </div>
      <blockquote className="type-body mt-5 border-l-2 border-seam pl-4 text-fog">
        {r.description ?? "No description on GitHub yet."}
      </blockquote>
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        {r.live ? <RunButton onClick={() => onRun(book)} /> : null}
        <ExternalLink
          href={r.url}
          hint="the repository on GitHub, opens in a new tab"
          data-cursor="lime"
          className="type-ui text-paper underline decoration-ash underline-offset-4 hocus:text-lime hocus:decoration-lime"
        >
          Open on GitHub<span className="sr-only">: {r.name}</span>
        </ExternalLink>
        {book.caseStudy ? (
          <TransitionLink
            href={routes.work(book.caseStudy.id)}
            label={book.caseStudy.title}
            className="type-ui text-paper underline decoration-ash underline-offset-4 hocus:text-lime hocus:decoration-lime"
          >
            Read the case study
            <span className="sr-only">: {book.caseStudy.title}</span>
          </TransitionLink>
        ) : null}
      </div>
    </article>
  );
}

/** The workspace README, rendered: the language bar, the newest repos, the case studies, the live ones. */
function WorkspacePreview({
  openFile,
  onRun,
}: {
  openFile: (f: EditorFile) => void;
  onRun: (b: Book) => void;
}) {
  const years = BOOKS.map((b) => b.repo.created).sort();
  const newest = [...BOOKS]
    .sort((a, b) => (a.repo.created < b.repo.created ? 1 : -1))
    .slice(0, 5);
  return (
    <article className="px-6 py-6 sm:px-8">
      <h1 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.05] font-extrabold tracking-[-0.02em] text-paper">
        Prajwal&apos;s repos
      </h1>
      <p className="type-body mt-3 text-fog">
        {BOOKS.length} public repositories in {SHELF_LANGUAGES.length}{" "}
        languages, from {monthYear(years[0])} to{" "}
        {monthYear(years[years.length - 1])}.
      </p>
      <h2 className="type-ui mt-6 font-semibold text-paper">Languages</h2>
      <div
        aria-hidden="true"
        className="mt-2 flex h-2.5 overflow-hidden rounded-full"
      >
        {SHELF_LANGUAGES.map((l) => (
          <span
            key={l.language}
            className={dotOf(l.language)}
            style={{ width: `${(l.count / BOOKS.length) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {SHELF_LANGUAGES.map((l) => (
          <li
            key={l.language}
            className="type-mono flex items-center gap-1.5 text-fog"
          >
            <span
              aria-hidden="true"
              className={`inline-block size-2 rounded-full ${dotOf(l.language)}`}
            />
            {l.language}{" "}
            <span className="text-paper tabular-nums">
              {Math.round((l.count / BOOKS.length) * 100)}%
            </span>
          </li>
        ))}
      </ul>
      <h2 className="type-ui mt-6 font-semibold text-paper">Newest</h2>
      <ul className="mt-2 grid gap-1">
        {newest.map((b) => (
          <li key={b.repo.name}>
            <button
              type="button"
              onClick={() => openFile(fileOf(b, "md"))}
              className="type-mono flex items-center gap-2 text-left text-paper underline decoration-ash underline-offset-4 hover:text-lime hover:decoration-lime"
            >
              <span
                aria-hidden="true"
                className={`inline-block size-2 rounded-full ${dotOf(b.language)}`}
              />
              {b.repo.name}
              <span className="text-fog no-underline">
                · {monthYear(b.repo.created)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <h2 className="type-ui mt-6 font-semibold text-paper">
        With a case study
      </h2>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {BOOKS.filter((b) => b.caseStudy).map((b) => (
          <li key={b.repo.name}>
            <TransitionLink
              href={routes.work(b.caseStudy!.id)}
              label={b.caseStudy!.title}
              className="type-mono text-paper underline decoration-ash underline-offset-4 hocus:text-lime hocus:decoration-lime"
            >
              {b.caseStudy!.title}
            </TransitionLink>
          </li>
        ))}
      </ul>
      <h2 className="type-ui mt-6 font-semibold text-paper">Live: run one</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {LIVE.map((b) => (
          <li key={b.repo.name}>
            <button
              type="button"
              onClick={() => onRun(b)}
              className="type-mono inline-flex items-center gap-1.5 rounded-full border border-seam px-3 py-1 text-paper hover:border-lime hover:text-lime"
            >
              <PlayGlyph />
              {b.repo.name}
            </button>
          </li>
        ))}
      </ul>
      <p className="type-hand-sm mt-8 text-fog">
        open a folder on the left, press play, or type help in the terminal
      </p>
    </article>
  );
}

function PlayGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 shrink-0">
      <path d="M3 1.8v8.4L10.2 6z" fill="currentColor" />
    </svg>
  );
}

/** "npm run dev", as a button (the README of a repo that runs somewhere) */
function RunButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-qa="run-button"
      className="type-mono inline-flex items-center gap-2 rounded-full bg-lime px-3.5 py-1.5 font-semibold text-ink hover:bg-paper"
    >
      <PlayGlyph />
      npm run dev
    </button>
  );
}

/** Run and debug: run the open repo, or any live one; the rest are named as not deployed. */
function RunView({
  target,
  running,
  onRun,
}: {
  target: Book | null;
  running: string | null;
  onRun: (b: Book | null) => void;
}) {
  const name = (target ?? HOME_RUN)?.repo.name ?? "this portfolio";
  const idle = BOOKS.filter((b) => !b.repo.live);
  return (
    <div className="p-3">
      <p className="type-micro pb-3 tracking-[0.16em] text-fog uppercase">
        Run and debug
      </p>
      <button
        type="button"
        onClick={() => onRun(target)}
        className="type-mono flex w-full items-center justify-center gap-2 rounded-[8px] bg-lime px-3 py-2.5 font-semibold text-ink hover:bg-paper"
      >
        <PlayGlyph />
        Run {name}
      </button>
      <p className="type-micro mt-2 text-fog">
        npm run dev in the terminal, then its live page opens in a browser tab.{" "}
        {target ? "" : "From the workspace it runs this portfolio."}
      </p>
      <p className="type-micro mt-6 pb-1.5 tracking-[0.16em] text-fog uppercase">
        Live · {LIVE.length}
      </p>
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-0.5">
        {LIVE.map((b) => (
          <li key={b.repo.name}>
            <button
              type="button"
              onClick={() => onRun(b)}
              className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left hover:bg-seam"
            >
              <span className="text-lime">
                <PlayGlyph />
              </span>
              <span className="min-w-0">
                <span className="type-mono block truncate text-paper">
                  {b.repo.name}
                </span>
                <span className="type-micro block truncate text-fog">
                  {b.repo.live!.replace(/^https?:\/\//, "")}
                </span>
              </span>
              {running === b.repo.name ? (
                <span className="type-micro ml-auto flex shrink-0 items-center gap-1 text-paper">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-tangerine"
                  />
                  running
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      <p className="type-micro mt-6 pb-1.5 tracking-[0.16em] text-fog uppercase">
        Not deployed · {idle.length}
      </p>
      <p className="type-micro text-fog">
        No GitHub Pages site and no website on GitHub: their code is the thing
        to read. Running one says so.
      </p>
    </div>
  );
}

/** The browser a run opens: the live page in a frame (desktop or phone width), or "not deployed". */
function Browser({ book, onRun }: { book: Book; onRun: (b: Book) => void }) {
  const url = book.repo.live ?? null;
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [nonce, setNonce] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const host = url ? new URL(url).host : null;
  return (
    <div data-qa="browser" className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-seam bg-ink-2 px-3 py-2">
        <button
          type="button"
          aria-label="Reload"
          disabled={!url}
          onClick={() => {
            setLoaded(false);
            setNonce((n) => n + 1);
          }}
          className="grid size-8 shrink-0 place-items-center rounded-[6px] text-fog hover:bg-seam hover:text-paper disabled:opacity-40"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3" />
          </svg>
        </button>
        <p
          data-qa="address"
          className="type-mono flex min-w-0 flex-1 items-center gap-2 rounded-full border border-seam bg-(--color-ink) px-3 py-1.5 text-fog"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            {url ? (
              <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v6.5h-9z" />
            ) : (
              <path d="M8 2.5l6 11H2zM8 6.5v3M8 11.5v.01" />
            )}
          </svg>
          <span className="truncate text-paper">
            {url ?? `${book.repo.name}: not deployed`}
          </span>
        </p>
        {url ? (
          <div
            role="group"
            aria-label="Viewport"
            className="hidden shrink-0 gap-1 sm:flex"
          >
            {(["desktop", "phone"] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                aria-label={d === "desktop" ? "Desktop width" : "Phone width"}
                title={d === "desktop" ? "Desktop width" : "Phone width"}
                onClick={() => setDevice(d)}
                className="grid size-8 place-items-center rounded-[6px] text-fog hover:text-paper aria-pressed:bg-seam aria-pressed:text-paper"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                >
                  {d === "desktop" ? (
                    <path d="M2 3.5h12v8H2zM6 14h4M8 11.5V14" />
                  ) : (
                    <path d="M5 1.8h6v12.4H5zM7.3 12h1.4" />
                  )}
                </svg>
              </button>
            ))}
          </div>
        ) : null}
        <ExternalLink
          href={url ?? book.repo.url}
          hint="opens in a new tab"
          className="type-micro inline-flex shrink-0 items-center gap-1 rounded-[6px] px-2 py-1.5 text-fog hover:bg-seam hover:text-paper"
        >
          <span className="max-sm:sr-only">{url ? "New tab" : "GitHub"}</span>
          <span className="sr-only">: {book.repo.name}</span>
        </ExternalLink>
      </div>
      <div className="relative grid min-h-[max(480px,min(78vh,860px))] flex-1 place-items-center bg-ink-2">
        {url ? (
          <>
            <iframe
              key={nonce}
              src={url}
              title={`${book.repo.name}, the live page`}
              data-qa="live-frame"
              onLoad={() => setLoaded(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              referrerPolicy="no-referrer"
              className={`absolute bg-paper ${loaded ? "" : "opacity-0"} ${device === "phone" ? "inset-y-4 left-1/2 w-[390px] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-[28px] border-[6px] border-seam" : "inset-0 size-full"}`}
            />
            {!loaded ? (
              <p
                aria-live="polite"
                className="type-mono absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-fog"
              >
                loading {host}…
              </p>
            ) : null}
          </>
        ) : (
          <div className="max-w-md px-6 text-center">
            <p className="type-micro tracking-[0.16em] text-fog uppercase">
              Nothing to open
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.4rem,2.6vw,1.9rem)] leading-[1.1] font-extrabold tracking-[-0.02em] text-paper">
              {book.repo.name} isn&apos;t deployed
            </h2>
            <p className="type-body mt-3 text-fog">
              It has no GitHub Pages site and no website set on GitHub, so there
              is no live page. Its code is on GitHub.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {LIVE.slice(0, 6).map((b) => (
                <button
                  key={b.repo.name}
                  type="button"
                  onClick={() => onRun(b)}
                  className="type-mono inline-flex items-center gap-1.5 rounded-full border border-seam px-3 py-1 text-paper hover:border-lime hover:text-lime"
                >
                  <PlayGlyph />
                  {b.repo.name}
                </button>
              ))}
            </div>
            <p className="type-micro mt-3 text-fog">these ones run</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ children, dot }: { children: ReactNode; dot?: string }) {
  return (
    <span className="type-micro inline-flex items-center gap-1.5 rounded-[4px] border border-seam bg-ink-2 px-2 py-1 text-fog">
      {dot ? (
        <span
          aria-hidden="true"
          className={`inline-block size-2 rounded-full ${dot}`}
        />
      ) : null}
      {children}
    </span>
  );
}

/* ---- the terminal ------------------------------------------------------------------------ */
const HELP: TermLine[] = [
  { k: "dim", text: "commands:" },
  {
    k: "out",
    text: "  ls [language]      list the folders, or a language's repos",
  },
  {
    k: "out",
    text: "  open <repo>        open a repo's README.md (cat works too)",
  },
  { k: "out", text: "  open <repo> json   open its repo.json" },
  { k: "out", text: "  git log            the repos, as commits" },
  {
    k: "out",
    text: "  cd <repo> | cd ..  move into a repo, or back to the workspace",
  },
  {
    k: "out",
    text: "  npm run dev        run this repo, open its live page (npm start, yarn dev, run <repo>)",
  },
  { k: "out", text: "  Ctrl+C | stop      stop it (closes its browser tab)" },
  { k: "out", text: "  neofetch           the workspace at a glance" },
  { k: "out", text: "  clear              empty the terminal" },
];

/** neofetch: the workspace at a glance, every line from the GitHub data. */
function neofetch(): TermLine[] {
  const byDate = [...BOOKS].sort((a, b) =>
    a.repo.created < b.repo.created ? -1 : 1,
  );
  const first = byDate[0];
  const last = byDate[byDate.length - 1];
  const head = `${ROOT.toLowerCase()}@github`;
  return [
    { k: "ok", text: head },
    { k: "dim", text: "-".repeat(head.length) },
    { k: "out", text: `role       Full Stack Developer` },
    { k: "out", text: `repos      ${BOOKS.length} public` },
    {
      k: "out",
      text: `languages  ${SHELF_LANGUAGES.map((l) => `${l.language} ${l.count}`).join(", ")}`,
    },
    {
      k: "out",
      text: `first      ${first.repo.name} (${monthYear(first.repo.created)})`,
    },
    {
      k: "out",
      text: `latest     ${last.repo.name} (${monthYear(last.repo.created)})`,
    },
    {
      k: "out",
      text: `case       ${BOOKS.filter((b) => b.caseStudy).length} repos have a case study`,
    },
    { k: "out", text: `profile    ${garden.profile.replace("https://", "")}` },
  ];
}

function Terminal({
  open,
  setOpen,
  openFile,
  apiRef,
  activeRepo,
  running,
  onLaunch,
  onStop,
}: {
  open: boolean;
  setOpen: (o: boolean) => void;
  openFile: (f: EditorFile) => void;
  apiRef: RefObject<TermApi | null>;
  activeRepo: Book | null;
  running: string | null;
  onLaunch: (b: Book) => void;
  onStop: (name: string) => void;
}) {
  const [lines, setLines] = useState<TermLine[]>([
    {
      k: "dim",
      text: `${ROOT.toLowerCase()} workspace · type help, npm run dev, or try neofetch`,
    },
  ]);
  const [input, setInput] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  /** the folder the terminal is in: a repo, or the workspace root (null) */
  const [cwd, setCwd] = useState<Book | null>(null);
  const follow = useRef(false);
  const timers = useRef<number[]>([]);
  const { scrollTo } = useSmoothScroll();
  const names = useMemo(() => BOOKS.map((b) => b.repo.name), []);
  const here = cwd ? `~/${cwd.repo.name}` : "~";

  // the terminal grows with its output (no scroll of its own): after a command, keep the prompt on
  // screen (not after `open` or a run's last line, which bring the editor into view instead)
  useEffect(() => {
    if (!follow.current) return;
    follow.current = false;
    const el = document.getElementById("repo-term");
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.bottom > window.innerHeight - 16)
      scrollTo(window.scrollY + r.bottom - window.innerHeight + 48, {
        immediate: true,
      });
  }, [lines, scrollTo]);
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const print = (out: TermLine[], keepInView = true) => {
    follow.current = keepInView;
    setLines((l) => [...l, ...out].slice(-200));
  };
  const cancel = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  /**
   * npm run dev: a few lines, then the browser. Nothing is built here: the live page is the repo's
   * GitHub Pages site (or its website field), as GitHub reported it at build time.
   */
  const start = (b: Book | null, shown: string, typedAt: string) => {
    cancel();
    const target = b ?? HOME_RUN;
    const out: TermLine[] = [{ k: "in", text: shown, at: typedAt }];
    if (!target) {
      print([...out, { k: "err", text: "nothing here runs: no repo is live" }]);
      return;
    }
    const steps: TermLine[] = [];
    if (!b)
      steps.push({
        k: "dim",
        text: `no package.json in ~ (the workspace): running ${target.repo.name}, this portfolio`,
      });
    const live = target.repo.live;
    const host = live ? new URL(live).host : "";
    steps.push(
      { k: "dim", text: `> ${target.repo.name.toLowerCase()}@live dev` },
      {
        k: "out",
        text: live
          ? "  looking up the live build…"
          : "  looking for a live build…",
      },
    );
    if (live)
      steps.push(
        {
          k: "ok",
          text: `✓ ready: served by ${host.endsWith("github.io") ? "GitHub Pages" : host}`,
        },
        { k: "out", text: `  ➜  Live:   ${live}` },
        { k: "dim", text: "  opening it in the browser · Ctrl+C stops it" },
      );
    else
      steps.push(
        {
          k: "err",
          text: `✗ ${target.repo.name} isn't deployed: no GitHub Pages site, no website on GitHub`,
        },
        { k: "out", text: `  ➜  Code:   ${target.repo.url}` },
        {
          k: "dim",
          text: `  these run: ${LIVE.map((x) => x.repo.name).join(", ")}`,
        },
      );
    setCwd(target);
    const instant = document.documentElement.classList.contains("rm");
    if (instant) {
      print([...out, ...steps]);
      onLaunch(target);
      return;
    }
    print(out);
    steps.forEach((line, i) => {
      timers.current.push(
        window.setTimeout(() => print([line]), 180 + i * 220),
      );
    });
    timers.current.push(
      window.setTimeout(() => onLaunch(target), 180 + steps.length * 220 + 120),
    );
  };
  // the editor's play button and run buttons come in here
  useImperativeHandle(apiRef, () => ({
    run: (b) => start(b, "npm run dev", b ? `~/${b.repo.name}` : "~"),
  }));

  const stopRun = (typed: TermLine[]) => {
    cancel();
    if (running) {
      onStop(running);
      print([...typed, { k: "dim", text: `stopped ${running}` }]);
    } else print([...typed, { k: "dim", text: "nothing is running" }]);
  };

  const exec = (raw: string) => {
    const cmd = raw.trim();
    const out: TermLine[] = [{ k: "in", text: cmd, at: here }];
    const [verb = "", ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ");
    const v = verb.toLowerCase();
    // npm run dev, npm start, yarn dev, pnpm dev, bun dev, npm run start / serve / preview
    if (
      /^(npm|yarn|pnpm|bun)$/.test(v) &&
      /^(run\s+)?(dev|start|serve|preview)$/i.test(arg)
    ) {
      start(cwd ?? activeRepo, cmd, here);
      return;
    }
    switch (v) {
      case "":
        break;
      case "help":
        out.push(...HELP);
        break;
      case "clear":
        setLines([]);
        return;
      case "run": {
        if (!arg) {
          start(cwd ?? activeRepo, cmd, here);
          return;
        }
        const b = findRepo(arg);
        if (b) {
          start(b, cmd, here);
          return;
        }
        out.push({ k: "err", text: `run: no repo matches "${arg}"` });
        break;
      }
      case "stop":
        stopRun(out);
        return;
      case "npm":
      case "yarn":
      case "pnpm":
      case "bun":
        out.push({
          k: "err",
          text: `${v}: only "${v === "npm" ? "npm run dev" : `${v} dev`}" or "${v} start" here`,
        });
        break;
      case "cd": {
        if (!arg || arg === "~" || arg === ".." || arg === "/") setCwd(null);
        else {
          const b = findRepo(arg.replace(/^~\//, "").replace(/\/$/, ""));
          if (b) setCwd(b);
          else out.push({ k: "err", text: `cd: no such repo: ${arg}` });
        }
        break;
      }
      case "pwd":
        out.push({
          k: "out",
          text: `/${ROOT.toLowerCase()}${cwd ? `/${cwd.language}/${cwd.repo.name}` : ""}`,
        });
        break;
      case "ls": {
        if (!arg && cwd) {
          out.push({ k: "out", text: "README.md  repo.json" });
          break;
        }
        if (!arg) {
          out.push(
            { k: "out", text: "README.md" },
            ...SHELF_LANGUAGES.map((l): TermLine => ({
              k: "ok",
              text: `${l.language}/  (${l.count})`,
            })),
          );
          break;
        }
        const lang = SHELF_LANGUAGES.find((l) =>
          l.language.toLowerCase().startsWith(arg.toLowerCase()),
        );
        if (!lang) out.push({ k: "err", text: `ls: no folder ${arg}` });
        else
          out.push(
            ...BOOKS.filter((b) => b.language === lang.language).map(
              (b): TermLine => ({ k: "ok", text: `${b.repo.name}/` }),
            ),
          );
        break;
      }
      case "open":
      case "cat":
      case "code": {
        const json = /\s+json$|\.json$/i.test(arg);
        const name = arg
          .replace(/\s+json$/i, "")
          .replace(/\/?(readme\.md|repo\.json)$/i, "")
          .replace(/\/$/, "");
        const b = name ? findRepo(name) : cwd;
        if (!b)
          out.push({
            k: "err",
            text: `${verb}: no repo matches "${name || "?"}" (try ls)`,
          });
        else {
          openFile(fileOf(b, json ? "json" : "md"));
          out.push({
            k: "ok",
            text: `opened ${b.repo.name}/${json ? "repo.json" : "README.md"}`,
          });
          print(out, false);
          return;
        }
        break;
      }
      case "git":
        if (rest[0] === "log")
          out.push(
            ...LOG.slice(0, 10).map((c): TermLine => ({
              k: "out",
              text: `${c.hash}  ${c.date}  ${c.msg}`,
            })),
            ...(LOG.length > 10
              ? [
                  {
                    k: "dim" as const,
                    text: `… ${LOG.length - 10} more (the Timeline view has them all)`,
                  },
                ]
              : []),
          );
        else out.push({ k: "err", text: "git: only `git log` here" });
        break;
      case "whoami":
        out.push({ k: "out", text: "prajwal m p, full stack developer" });
        break;
      case "neofetch":
        out.push(...neofetch());
        break;
      default:
        out.push({ k: "err", text: `command not found: ${verb}. type help` });
    }
    print(out);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    if (
      e.ctrlKey &&
      e.key.toLowerCase() === "c" &&
      el.selectionStart === el.selectionEnd
    ) {
      e.preventDefault();
      stopRun([{ k: "in", text: `${input}^C`, at: here }]);
      setInput("");
      return;
    }
    if (e.key === "Enter") {
      exec(input);
      if (input.trim()) setHist((h) => [...h, input]);
      setHi(-1);
      setInput("");
    } else if (e.key === "Tab") {
      const m = /^(open|cat|code|cd|run)\s+(\S*)$/i.exec(input);
      if (m) {
        e.preventDefault();
        const hit = names.find((n) =>
          n.toLowerCase().startsWith(m[2].toLowerCase()),
        );
        if (hit) setInput(`${m[1]} ${hit}`);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const i = hi < 0 ? hist.length - 1 : Math.max(0, hi - 1);
      if (hist[i] !== undefined) {
        setHi(i);
        setInput(hist[i]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const i = hi < 0 ? -1 : hi + 1;
      if (i >= hist.length || i < 0) {
        setHi(-1);
        setInput("");
      } else {
        setHi(i);
        setInput(hist[i]);
      }
    }
  };

  return (
    <div className="border-t border-seam bg-(--color-ink)">
      <div className="flex h-8 items-center gap-3 px-4">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="type-micro flex items-center gap-1.5 tracking-[0.14em] text-fog uppercase hover:text-paper"
        >
          <Chevron open={open} /> Terminal
        </button>
        {running ? (
          <span className="type-micro flex items-center gap-1.5 text-fog">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-tangerine"
            />
            {running}: npm run dev
          </span>
        ) : null}
      </div>
      {open ? (
        <div
          data-qa="terminal"
          className="type-mono min-h-36 px-4 pb-4"
          onClick={() => document.getElementById("repo-term")?.focus()}
        >
          {lines.map((l, i) => (
            <p
              key={i}
              className={`whitespace-pre-wrap ${l.k === "err" ? "text-tangerine" : l.k === "dim" ? "text-fog" : l.k === "ok" ? "text-lime" : "text-paper"}`}
            >
              {l.k === "in" ? (
                <span className="text-blue-soft">
                  prajwal@repos {l.at ?? "~"} ${" "}
                </span>
              ) : null}
              {l.text}
            </p>
          ))}
          <div className="-mx-1 flex items-center gap-1 rounded-[4px] px-1 focus-within:bg-seam/50">
            <label htmlFor="repo-term" className="shrink-0 text-blue-soft">
              prajwal@repos {here} $
            </label>
            <input
              id="repo-term"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              className="min-w-0 flex-1 rounded-[3px] bg-transparent text-paper caret-lime focus-visible:outline-none"
              aria-describedby="repo-term-hint"
            />
            <span id="repo-term-hint" className="sr-only">
              Type help for the commands; npm run dev runs the open repo.
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
