"use client";

/**
 * THE PULL REQUEST (the /pull-request page): contact, written up like a GitHub PR, in an ink window.
 * The compare bar (base prajwal/main <- compare you/<branch from the title>), the title, the
 * description with Write / Preview (a PR template to start from; the preview renders headings, lists
 * and paragraphs), the side bar (the reviewer, labels to toggle, a milestone) and "Create pull
 * request". That builds a mailto: to Prajwal (subject "[PR][labels] title", the description, the
 * labels and the milestone) and opens the visitor's email app; nothing is sent by the site. The ▾
 * holds "Create draft pull request" (a quick hello) and "Copy as text" (for webmail users).
 */
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { profile } from "@/content";
import { useCopy } from "@/lib/hooks/useCopy";

const LABELS = [
  { id: "Full-time", tone: "blue" },
  { id: "Freelance", tone: "lime" },
  { id: "Collab", tone: "tangerine" },
] as const;
type Label = (typeof LABELS)[number]["id"];
const MILESTONES = ["ASAP", "This month", "Just exploring"] as const;
type Milestone = (typeof MILESTONES)[number];

const TEMPLATE = "## What\n\n\n## Details\n- \n";
const TITLE_MAX = 100;
const BODY_MAX = 1500;

/** the branch name from the title: kebab-case, whole words, about 32 characters at most */
const slug = (s: string) => {
  let out = "";
  for (const w of s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)) {
    const next = out ? `${out}-${w}` : w;
    if (next.length > 32) return out || w.slice(0, 32);
    out = next;
  }
  return out;
};

/** the email the PR becomes */
function compose(
  title: string,
  body: string,
  labels: Label[],
  milestone: Milestone | null,
) {
  const subject = `[PR]${labels.map((l) => `[${l}]`).join("")} ${title}`;
  const meta = [
    labels.length ? `Labels: ${labels.join(", ")}` : null,
    milestone ? `When: ${milestone}` : null,
  ].filter(Boolean);
  const text = [
    "Hi Prajwal,",
    "",
    body.trim() === TEMPLATE.trim() ? "" : body.trim(),
    "",
    ...(meta.length ? ["---", ...meta] : []),
    "",
    "(Opened as a pull request from your portfolio.)",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
  return { subject, text };
}
/** open the visitor's email app: a click on a mailto: link (what a real link does) */
function openMail(url: string) {
  const a = document.createElement("a");
  a.href = url;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
const mailto = (subject: string, text: string) =>
  `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

export function PullRequestForm() {
  const uid = useId();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(TEMPLATE);
  const [labels, setLabels] = useState<Label[]>([]);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [error, setError] = useState(false);
  const [opened, setOpened] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { copy, copied, failed } = useCopy();
  const branch = `you/${slug(title) || "your-idea"}`;
  const filled = body.trim() !== TEMPLATE.trim() && body.trim() !== "";

  // the ▾ menu closes on Escape and on a click outside it
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    const onDown = (e: PointerEvent) =>
      !menuRef.current?.contains(e.target as Node) && setMenu(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [menu]);

  const toggleLabel = (l: Label) =>
    setLabels((ls) =>
      ls.includes(l)
        ? ls.filter((x) => x !== l)
        : LABELS.map((x) => x.id).filter((x) => x === l || ls.includes(x)),
    );

  const create = (e?: FormEvent) => {
    e?.preventDefault();
    const t = title.replace(/\s+/g, " ").trim();
    if (!t) {
      setError(true);
      document.getElementById(`${uid}-title`)?.focus();
      return;
    }
    setError(false);
    const { subject, text } = compose(t, body, labels, milestone);
    setOpened(true);
    openMail(mailto(subject, text));
  };
  const draft = () => {
    setMenu(false);
    const t = title.replace(/\s+/g, " ").trim();
    setOpened(true);
    openMail(
      mailto(
        `[Draft PR] ${t || "Hello"}`,
        "Hi Prajwal,\n\n\n(Opened as a draft pull request from your portfolio.)",
      ),
    );
  };
  const copyText = () => {
    setMenu(false);
    const t = title.replace(/\s+/g, " ").trim() || "Hello";
    const { subject, text } = compose(t, body, labels, milestone);
    void copy(`To: ${profile.email}\nSubject: ${subject}\n\n${text}`);
  };

  return (
    <form
      onSubmit={create}
      noValidate
      data-tone="ink"
      data-qa="pull-request"
      aria-label="Pull request to Prajwal"
      className="overflow-hidden rounded-[18px] border border-seam bg-ink text-paper"
    >
      {/* the compare bar */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-seam bg-ink-2 px-4 py-3 sm:px-5">
        <BranchIcon className="size-4 text-fog" />
        <span className="type-mono rounded-[6px] border border-seam bg-(--color-ink) px-2.5 py-1 text-fog">
          base: <span className="text-paper">prajwal/main</span>
        </span>
        <span aria-hidden="true" className="text-fog">
          ←
        </span>
        <span
          data-qa="pr-branch"
          className="type-mono max-w-full truncate rounded-[6px] border border-seam bg-(--color-ink) px-2.5 py-1 text-fog"
        >
          compare: <span className="text-paper">{branch}</span>
        </span>
        <span className="type-mono flex items-center gap-1.5 text-lime">
          <span aria-hidden="true">✓</span> Able to merge. I reply to every
          email.
        </span>
        <span className="type-mono ml-auto text-fog max-lg:hidden">
          1 commit · 1 file changed · <span className="text-lime">+1 idea</span>
        </span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* the title and the description */}
        <div className="flex gap-4 p-4 sm:p-6 lg:border-r lg:border-seam">
          <span
            aria-hidden="true"
            className="type-micro hidden size-10 shrink-0 place-items-center rounded-full bg-seam text-fog sm:grid"
          >
            you
          </span>
          <div className="min-w-0 flex-1">
            <label
              htmlFor={`${uid}-title`}
              className="type-mono mb-1.5 block text-fog"
            >
              Title
            </label>
            <input
              id={`${uid}-title`}
              data-qa="pr-title-input"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(false);
              }}
              placeholder="e.g. Full stack role on our product team"
              autoComplete="off"
              aria-invalid={error || undefined}
              aria-describedby={`${uid}-title-hint`}
              className="type-body block w-full rounded-[8px] border border-seam bg-(--color-ink) px-3.5 py-2.5 font-medium text-paper placeholder:text-fog hover:border-fog focus-visible:border-lime focus-visible:outline-none aria-invalid:border-tangerine"
            />
            <p
              id={`${uid}-title-hint`}
              role="status"
              className={`type-small mt-1.5 min-h-5 ${error ? "text-tangerine" : "text-fog"}`}
            >
              {error
                ? "A PR needs a title: a few words on what it is."
                : "It becomes the email's subject."}
            </p>

            <div className="mt-3 overflow-hidden rounded-[8px] border border-seam bg-(--color-ink) focus-within:border-lime">
              <div
                role="tablist"
                aria-label="Description"
                className="flex items-end border-b border-seam bg-ink-2 px-2 pt-2"
              >
                {(["write", "preview"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    id={`${uid}-tab-${t}`}
                    aria-selected={tab === t}
                    aria-controls={`${uid}-panel`}
                    onClick={() => setTab(t)}
                    className={`type-mono -mb-px rounded-t-[6px] border px-3.5 py-2 ${tab === t ? "border-seam border-b-transparent bg-(--color-ink) text-paper" : "border-transparent text-fog hover:text-paper"}`}
                  >
                    {t === "write" ? "Write" : "Preview"}
                  </button>
                ))}
                <span className="type-mono ml-auto pr-2 pb-2 text-fog max-sm:hidden">
                  Markdown: ## heading, - list
                </span>
              </div>
              <div
                id={`${uid}-panel`}
                role="tabpanel"
                aria-labelledby={`${uid}-tab-${tab}`}
              >
                {tab === "write" ? (
                  <>
                    <label htmlFor={`${uid}-body`} className="sr-only">
                      Description
                    </label>
                    <textarea
                      id={`${uid}-body`}
                      data-qa="pr-body"
                      value={body}
                      maxLength={BODY_MAX}
                      onChange={(e) => setBody(e.target.value)}
                      rows={9}
                      spellCheck
                      className="type-mono block min-h-56 w-full resize-y bg-transparent px-3.5 py-3 leading-[1.75] text-paper focus-visible:outline-none"
                    />
                  </>
                ) : (
                  <Preview text={body} />
                )}
              </div>
              <div className="type-mono flex justify-between gap-3 border-t border-dashed border-seam px-3.5 py-2 text-fog">
                <span>Attach files in your email app</span>
                <span className="tabular-nums">
                  {body.length} / {BODY_MAX}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* the side bar: reviewer, labels, milestone */}
        <div className="grid content-start gap-5 border-t border-seam p-4 sm:p-6 lg:row-span-2 lg:border-t-0">
          <div className="border-b border-seam pb-5">
            <p className="type-mono mb-2.5 text-fog">Reviewers</p>
            <p className="type-small flex items-center gap-2.5 text-paper">
              <span
                aria-hidden="true"
                className="type-micro grid size-7 place-items-center rounded-full bg-lime font-bold text-ink"
              >
                PM
              </span>
              {profile.name}
              <span className="type-micro ml-auto text-fog">requested</span>
            </p>
          </div>
          <fieldset className="border-b border-seam pb-5">
            <legend className="type-mono mb-2.5 text-fog">Labels</legend>
            <div className="flex flex-wrap gap-2">
              {LABELS.map((l) => {
                const on = labels.includes(l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    aria-pressed={on}
                    data-qa="pr-label"
                    onClick={() => toggleLabel(l.id)}
                    className={`type-mono inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 font-medium ${
                      l.tone === "blue"
                        ? on
                          ? "border-blue bg-blue text-paper"
                          : "border-blue text-blue-soft hover:bg-blue/15"
                        : l.tone === "lime"
                          ? on
                            ? "border-lime bg-lime text-ink"
                            : "border-lime text-lime hover:bg-lime/10"
                          : on
                            ? "border-tangerine bg-tangerine text-ink"
                            : "border-tangerine text-tangerine hover:bg-tangerine/10"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-2 rounded-full ${on ? (l.tone === "blue" ? "bg-paper" : "bg-ink") : l.tone === "blue" ? "bg-blue" : l.tone === "lime" ? "bg-lime" : "bg-tangerine"}`}
                    />
                    {l.id}
                    {on ? <span aria-hidden="true">✓</span> : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="type-mono mb-2.5 text-fog">Milestone</legend>
            <div className="grid gap-1">
              {MILESTONES.map((m) => (
                <label
                  key={m}
                  className="type-mono flex min-h-8 cursor-pointer items-center gap-2.5 text-fog has-checked:text-paper"
                >
                  <input
                    type="radio"
                    name={`${uid}-milestone`}
                    value={m}
                    checked={milestone === m}
                    onChange={() => setMilestone(m)}
                    className="size-4 accent-lime"
                  />
                  {m}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* create */}
        <div className="flex flex-col-reverse gap-4 border-t border-seam p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:border-t-0 lg:border-r lg:pt-0">
          <p className="type-small max-w-md text-fog" aria-live="polite">
            {opened ? (
              <>
                Your email app should be open with the PR written out. Nothing
                there? Use ▾ and{" "}
                <span className="text-paper">Copy as text</span>, then paste it
                into an email to {profile.email}.
              </>
            ) : (
              <>
                Opens your email app to{" "}
                <span className="text-paper">{profile.email}</span> with this PR
                written out{filled ? "" : " (the template is optional)"}.
              </>
            )}
            {copied ? (
              <span className="mt-1 block text-lime">
                Copied: paste it into an email.
              </span>
            ) : failed ? (
              <span className="mt-1 block text-tangerine">
                Copy failed: select the text and copy it.
              </span>
            ) : null}
          </p>
          <div ref={menuRef} className="relative flex shrink-0">
            <button
              type="submit"
              data-qa="pr-create"
              className="type-ui inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-l-full bg-lime pr-5 pl-6 font-semibold text-ink hover:bg-paper"
            >
              <BranchIcon className="size-4" />
              Create pull request
            </button>
            <button
              type="button"
              aria-label="More ways to send"
              aria-expanded={menu}
              aria-controls={`${uid}-menu`}
              onClick={() => setMenu((o) => !o)}
              className="grid min-h-12 w-12 place-items-center rounded-r-full border-l border-ink/25 bg-lime text-ink hover:bg-paper"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                className={`size-3 transition-transform duration-150 ${menu ? "rotate-180" : ""}`}
              >
                <path d="M2 4l4 4 4-4" fill="currentColor" />
              </svg>
            </button>
            {menu ? (
              <div
                id={`${uid}-menu`}
                className="absolute right-0 bottom-[calc(100%+8px)] z-10 w-72 overflow-hidden rounded-[10px] border border-seam bg-ink-2 p-1.5"
              >
                <button
                  type="button"
                  onClick={draft}
                  className="block w-full rounded-[6px] px-3 py-2.5 text-left hover:bg-seam"
                >
                  <span className="type-ui block text-paper">
                    Create draft pull request
                  </span>
                  <span className="type-small block text-fog">
                    a quick hello, no details yet
                  </span>
                </button>
                <button
                  type="button"
                  onClick={copyText}
                  data-qa="pr-copy"
                  className="block w-full rounded-[6px] px-3 py-2.5 text-left hover:bg-seam"
                >
                  <span className="type-ui block text-paper">Copy as text</span>
                  <span className="type-small block text-fog">
                    for Gmail or Outlook in the browser
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}

/** The description, rendered: ## headings, - lists, paragraphs. */
function Preview({ text }: { text: string }) {
  const blocks: { k: "h" | "ul" | "p"; lines: string[] }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (/^#{1,6}\s/.test(line))
      blocks.push({ k: "h", lines: [line.replace(/^#+\s*/, "")] });
    else if (/^[-*]\s/.test(line)) {
      const item = line.replace(/^[-*]\s*/, "");
      const last = blocks[blocks.length - 1];
      if (last?.k === "ul") last.lines.push(item);
      else blocks.push({ k: "ul", lines: [item] });
    } else if (line.trim()) {
      const last = blocks[blocks.length - 1];
      if (last?.k === "p") last.lines.push(line);
      else blocks.push({ k: "p", lines: [line] });
    } else blocks.push({ k: "p", lines: [] });
  }
  const shown = blocks.filter(
    (b) => b.lines.length && b.lines.some((l) => l.trim()),
  );
  return (
    <div data-qa="pr-preview" className="min-h-56 px-4 py-3.5">
      {shown.length ? (
        shown.map((b, i) =>
          b.k === "h" ? (
            <h3
              key={i}
              className="type-ui mt-3 border-b border-seam pb-1 font-semibold text-paper first:mt-0"
            >
              {b.lines[0]}
            </h3>
          ) : b.k === "ul" ? (
            <ul key={i} className="type-body mt-2 list-disc pl-5 text-paper">
              {b.lines.map((l, j) => (
                <li key={j}>{l || " "}</li>
              ))}
            </ul>
          ) : (
            <p key={i} className="type-body mt-2 text-paper">
              {b.lines.join(" ")}
            </p>
          ),
        )
      ) : (
        <p className="type-body text-fog">Nothing to preview yet.</p>
      )}
    </div>
  );
}

function BranchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="4" cy="3.5" r="1.6" />
      <circle cx="4" cy="12.5" r="1.6" />
      <circle cx="12" cy="12.5" r="1.6" />
      <path d="M4 5v6M12 11V7.5c0-2-1.5-3-3.5-3H7" />
    </svg>
  );
}
