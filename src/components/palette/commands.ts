import { archiveProjects, experience, featuredProjects, profile, skillGroups } from "@/content";
import { routes } from "@/lib/routes";
import type { SectionId } from "@/lib/sections";

/* ------------------------------------------------------------------ output model */

export type Tone = "dim" | "blue" | "ok" | "tan" | "bold";
export type Seg = { t: string; tone?: Tone; href?: string; external?: boolean };
export type Line = {
  segs: Seg[];
  /** Hanging label column (cat stack.txt). */
  label?: string;
  /** Build-log step state. */
  status?: "run" | "done";
  /** Render the line as the tangerine SHIPPED stamp line. */
  stamp?: boolean;
  /** Blank spacer. */
  gap?: boolean;
  /** Render the focused "Open email" pill (end of the hire log). */
  mail?: boolean;
};

const t = (text: string, tone?: Tone, href?: string, external?: boolean): Seg => ({ t: text, tone, href, external });
const line = (...segs: Seg[]): Line => ({ segs });
const gap = (): Line => ({ segs: [], gap: true });

/* ------------------------------------------------------------------ command parsing */

export type CommandId = "whoami" | "ls" | "git" | "cat" | "hire" | "help" | "clear" | "exit" | "sudo" | "rm" | "vim" | "hello";

/** Every phrase that runs something, for suggestions ("did you mean"). */
export const COMMAND_NAMES = ["whoami", "ls projects", "git log --oneline", "cat stack.txt", "npm run hire-prajwal", "help", "clear"] as const;

export function parseCommand(raw: string): CommandId | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;
  if (s === "whoami" || s === "who am i") return "whoami";
  if (s === "ls" || s.startsWith("ls ") || s === "dir") return "ls";
  if (s === "git log" || s.startsWith("git log ") || s === "git") return "git";
  if (s === "cat stack.txt" || s === "cat stack" || s === "cat skills.txt") return "cat";
  if (s === "npm run hire-prajwal" || s === "npm run hire" || s === "hire-prajwal" || s === "hire" || s === "npm start") return "hire";
  if (s === "help" || s === "?" || s === "--help" || s === "man") return "help";
  if (s === "clear" || s === "cls") return "clear";
  if (s === "exit" || s === "quit" || s === "logout") return "exit";
  if (s === "sudo" || s.startsWith("sudo ")) return "sudo";
  if (s === "rm" || s.startsWith("rm ")) return "rm";
  if (s === "vim" || s === "vi" || s === "nano" || s === "emacs" || s.startsWith("vim ")) return "vim";
  if (s === "hello" || s === "hi" || s === "hey") return "hello";
  return null;
}

/** Closest known command to a mistyped one, or null. */
export function suggest(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  const first = s.split(" ")[0];
  let best: string | null = null;
  let bestD = 99;
  for (const c of COMMAND_NAMES) {
    const d = Math.min(distance(s, c), distance(first, c.split(" ")[0]));
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return bestD <= Math.max(2, Math.floor(first.length / 3)) ? best : null;
}

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/* ------------------------------------------------------------------ outputs */

function hash(id: string): string {
  // Short, stable, obviously decorative commit id derived from the entry id.
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(7, "0").slice(0, 7);
}

export function unknownOutput(raw: string): Line[] {
  const word = raw.trim().split(/\s+/)[0] || raw.trim();
  const hint = suggest(raw);
  return [
    line(t(`command not found: ${word}`, "tan")),
    hint ? line(t("did you mean "), t(hint, "blue"), t("?")) : line(t("type "), t("help", "blue"), t(" to see what this terminal can do.")),
  ];
}

export function outputFor(id: CommandId): Line[] {
  switch (id) {
    case "whoami": {
      const now = experience.find((e) => e.current) ?? experience[0];
      return [
        line(t(profile.name, "bold")),
        line(t(`${now.role} at ${now.company}`)),
        line(t(profile.location, "dim")),
        gap(),
        line(t(profile.statement)),
        gap(),
        { label: "status", segs: [t(profile.availability, "ok")] },
        { label: "email", segs: [t(profile.email, "blue", `mailto:${profile.email}`, true)] },
      ];
    }
    case "ls": {
      const out: Line[] = [line(t("featured/", "dim"))];
      for (const p of featuredProjects) out.push(line(t("  "), t(`${p.id}/`, "blue", routes.work(p.id)), t(`  ${p.category}`, "dim")));
      out.push(gap(), line(t("archive/", "dim")));
      for (const p of archiveProjects) {
        const href = p.links.repo ?? p.links.live;
        out.push(line(t("  "), href ? t(`${p.id}/`, "blue", href, true) : t(`${p.id}/`), t(`  ${p.category}`, "dim")));
      }
      out.push(gap(), line(t(`${featuredProjects.length + archiveProjects.length} projects. click a name to open it.`, "dim")));
      return out;
    }
    case "git":
      return experience.map((e, i) =>
        line(
          t(hash(e.id), "tan"),
          t(" "),
          ...(i === 0 ? [t("(HEAD -> main) ", "blue")] : []),
          t(`${e.role} @ ${e.company}`),
          t(`  ${e.periodLabel}`, "dim"),
        ),
      );
    case "cat":
      return skillGroups.map((g) => ({ label: g.label, segs: [t(g.skills.map((s) => s.name).join(", "))] }));
    case "help":
      return [
        { label: "whoami", segs: [t("who is this", "dim")] },
        { label: "ls projects", segs: [t("everything he has shipped", "dim")] },
        { label: "git log --oneline", segs: [t("career, as commits", "dim")] },
        { label: "cat stack.txt", segs: [t("the toolbox, by layer", "dim")] },
        { label: "npm run hire-prajwal", segs: [t("a build log, then an email", "dim")] },
        { label: "clear", segs: [t("empty this screen", "dim")] },
        gap(),
        line(t("Or type anything to jump to a section, a project or an action.", "dim")),
      ];
    case "sudo":
      return [line(t("nice try. Ask Prajwal for access.", "tan"))];
    case "rm":
      return [line(t("permission denied: this portfolio is read-only.", "tan")), line(t("(and also: please do not.)", "dim"))];
    case "vim":
      return [line(t("you can leave this one. press "), t("Esc", "bold"), t(", it works here too."))];
    case "hello":
      return [line(t("hello! try "), t("whoami", "blue"), t(" or "), t("ls projects", "blue"), t("."))];
    case "exit":
    case "clear":
    case "hire":
      return [];
  }
}

/* ------------------------------------------------------------------ the hire-prajwal build log */

export const HIRE_STEPS = ["compiling interface", "wiring APIs", "loading data", "training the AI", "deploying to production"] as const;

/* ------------------------------------------------------------------ list items */

export type Action =
  | { type: "section"; id: SectionId }
  | { type: "page"; href: string; label: string }
  | { type: "external"; href: string }
  | { type: "mailto" }
  | { type: "copy-email" }
  | { type: "card" }
  | { type: "save-contact" }
  | { type: "sketch" }
  | { type: "architecture" }
  | { type: "motion" }
  | { type: "lite" }
  | { type: "theme" }
  | { type: "cmd"; id: CommandId; text: string };

export type GroupId = "goto" | "actions" | "terminal";
export const GROUP_LABEL: Record<GroupId, string> = { goto: "Go to", actions: "Actions", terminal: "Terminal" };

export type IconKey = "arrow" | "doc" | "github" | "linkedin" | "mail" | "copy" | "pencil" | "motion" | "terminal" | "page" | "diagram";

export type Item = {
  id: string;
  group: GroupId;
  label: string;
  /** Extra words that should find this item. */
  keywords: string;
  action: Action;
  /** Short mono hint on the right. */
  hint?: string;
  icon: IconKey;
  external?: boolean;
};

const SECTION_ITEMS: { id: SectionId; label: string; keywords: string }[] = [
  { id: "top", label: "Home", keywords: "top hero start intro" },
  { id: "build", label: "What I build", keywords: "capabilities services" },
  { id: "work", label: "Selected work", keywords: "projects portfolio case studies" },
  { id: "stack", label: "Stack", keywords: "skills tech tools keyboard" },
  { id: "changelog", label: "Experience", keywords: "changelog jobs career history roles" },
  { id: "about", label: "About", keywords: "readme story bio" },
  { id: "contact", label: "Contact", keywords: "email hire reach talk" },
];

export function baseItems(): Item[] {
  const items: Item[] = [];
  for (const s of SECTION_ITEMS) {
    items.push({ id: `go-${s.id}`, group: "goto", label: s.label, keywords: s.keywords, action: { type: "section", id: s.id }, icon: "arrow" });
  }
  items.push({ id: "go-repos", group: "goto", label: "Repos", keywords: "github repositories repos code editor terminal run live projects all", action: { type: "page", href: routes.repos, label: "Repos" }, icon: "page", hint: "page" });
  items.push({ id: "go-times", group: "goto", label: "The Prajwal Times (résumé)", keywords: "resume cv newspaper times print pdf career experience education", action: { type: "page", href: routes.resume, label: "The Prajwal Times" }, icon: "page", hint: "page" });
  items.push({ id: "go-pull-request", group: "goto", label: "Open a pull request", keywords: "contact hire job role freelance collab email pr pull request", action: { type: "page", href: routes.pullRequest, label: "Open a pull request" }, icon: "page", hint: "page" });
  for (const p of featuredProjects) {
    items.push({
      id: `go-${p.id}`,
      group: "goto",
      label: p.shortTitle,
      keywords: `${p.title} ${p.category} case study project`,
      action: { type: "page", href: routes.work(p.id), label: p.shortTitle },
      icon: "page",
      hint: "case study",
    });
  }
  // Flip the work stage to its living architecture diagrams, then go there.
  items.push({
    id: "act-architecture",
    group: "actions",
    label: "Show how my projects are built",
    keywords: "architecture diagram system design flow request journey work",
    action: { type: "architecture" },
    icon: "diagram",
    hint: "diagrams",
  });
  const gh = profile.socials.find((s) => s.kind === "github");
  const li = profile.socials.find((s) => s.kind === "linkedin");
  items.push(
    { id: "act-copy", group: "actions", label: "Copy email address", keywords: `${profile.email} mail clipboard`, action: { type: "copy-email" }, icon: "copy", hint: "copy" },
    { id: "act-resume", group: "actions", label: "Open résumé", keywords: "resume cv pdf download", action: { type: "external", href: profile.resume.href }, icon: "doc", hint: "new tab", external: true },
  );
  if (gh) items.push({ id: "act-github", group: "actions", label: "Open GitHub", keywords: `${gh.handle} code repos`, action: { type: "external", href: gh.href }, icon: "github", hint: "new tab", external: true });
  if (li) items.push({ id: "act-linkedin", group: "actions", label: "Open LinkedIn", keywords: `${li.handle} profile`, action: { type: "external", href: li.href }, icon: "linkedin", hint: "new tab", external: true });
  items.push({ id: "act-newsletter", group: "actions", label: `Subscribe to my newsletter: ${profile.newsletter.title}`, keywords: "newsletter linkedin subscribe weekly ai software insights blog articles", action: { type: "external", href: profile.newsletter.href }, icon: "linkedin", hint: "new tab", external: true });
  items.push({ id: "act-mail", group: "actions", label: "Send an email", keywords: `${profile.email} mailto write hire`, action: { type: "mailto" }, icon: "mail", hint: "mail app" });
  items.push(
    { id: "act-card", group: "actions", label: "Take my card", keywords: "visiting business card qr contact vcard save share", action: { type: "card" }, icon: "doc", hint: "card" },
    { id: "act-save-contact", group: "actions", label: "Save my contact", keywords: "vcard vcf contacts phone add save card", action: { type: "save-contact" }, icon: "copy", hint: ".vcf" },
  );
  return items;
}

const TERMINAL: { id: CommandId; text: string; keywords: string }[] = [
  { id: "whoami", text: "whoami", keywords: "about me who name role location" },
  { id: "ls", text: "ls projects", keywords: "list work projects archive" },
  { id: "git", text: "git log --oneline", keywords: "experience history jobs career commits" },
  { id: "cat", text: "cat stack.txt", keywords: "skills tech stack tools" },
  { id: "hire", text: "npm run hire-prajwal", keywords: "hire contact build email" },
  { id: "help", text: "help", keywords: "commands usage" },
  { id: "clear", text: "clear", keywords: "reset empty" },
];

export function terminalItems(): Item[] {
  return TERMINAL.map((c) => ({
    id: `cmd-${c.id}`,
    group: "terminal" as const,
    label: c.text,
    keywords: c.keywords,
    action: { type: "cmd" as const, id: c.id, text: c.text },
    icon: "terminal" as const,
    hint: "run",
  }));
}
