"use client";

import { useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Check,
  Close,
  Copy,
  Diagram,
  FileText,
  Github,
  Layers,
  Linkedin,
  Mail,
  Pencil,
  Play,
  Terminal,
} from "@/components/icons";
import { TransitionLink, usePageTransition } from "@/components/transition";
import { profile } from "@/content";
import { useCopy } from "@/lib/hooks/useCopy";
import {
  setMotionPreference,
  useReducedMotion,
} from "@/lib/motion/preferences";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import { isHomePath, routes } from "@/lib/routes";
import { useSketchMode } from "@/lib/stores/sketchMode";
import { setWorkView } from "@/components/work/viewStore";
import {
  GROUP_LABEL,
  HIRE_STEPS,
  baseItems,
  outputFor,
  parseCommand,
  terminalItems,
  unknownOutput,
  type Action,
  type CommandId,
  type GroupId,
  type IconKey,
  type Item,
  type Line,
  type Tone,
} from "./commands";
import { matchText } from "./fuzzy";
import { CARD_EVENT, saveContact } from "@/components/card/contact";
import { LITE_KEY, isLite, setLite, useLite } from "@/lib/perf";
import { toggleTheme, useTheme } from "@/lib/stores/theme";
import { closePalette, getOpener, getTrigger, usePaletteState } from "./store";

/**
 * The palette panel (lazy chunk). Everything here loads on first open.
 * Motion: ~160ms scale 0.98 -> 1 + fade in, 110ms out; reduced motion = fade only.
 */

type Phase = "closed" | "enter" | "open" | "exit";
type Entry = { id: number; cmd: string; lines: Line[]; fresh: boolean };

const ICONS: Record<IconKey, (p: { size?: number }) => ReactNode> = {
  arrow: (p) => <ArrowRight {...p} />,
  page: (p) => <Layers {...p} />,
  doc: (p) => <FileText {...p} />,
  github: (p) => <Github {...p} />,
  linkedin: (p) => <Linkedin {...p} />,
  mail: (p) => <Mail {...p} />,
  copy: (p) => <Copy {...p} />,
  pencil: (p) => <Pencil {...p} />,
  motion: (p) => <Play {...p} />,
  terminal: (p) => <Terminal {...p} />,
  diagram: (p) => <Diagram {...p} />,
};

const TONE: Record<Tone, string> = {
  dim: "text-graphite",
  blue: "text-blue-deep",
  ok: "text-lime-deep",
  tan: "text-tangerine-deep",
  bold: "font-medium text-ink",
};

const CHIPS = [
  "whoami",
  "ls projects",
  "git log --oneline",
  "npm run hire-prajwal",
];

function plain(l: Line): string {
  const text = l.segs
    .map((s) => s.t)
    .join("")
    .trim();
  return l.label ? `${l.label}: ${text}` : text;
}

export default function Body() {
  const { open, query: initialQuery, seq } = usePaletteState();
  const reduced = useReducedMotion();
  const lite = useLite();
  const theme = useTheme();
  const { lock } = useSmoothScroll();
  const { navigate } = usePageTransition();
  const router = useRouter();
  const sketch = useSketchMode();
  const { copy } = useCopy();
  const uid = useId();

  const [phase, setPhase] = useState<Phase>("closed");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [forceList, setForceList] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const pending = useRef<(() => void) | null>(null);
  const timers = useRef<number[]>([]);
  const entryId = useRef(0);
  const moved = useRef(false);
  const hireActive = useRef<(() => void) | null>(null);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  /* ---------------------------------------------------------------- open / close lifecycle */
  useEffect(() => {
    if (open) {
      clearTimers();
      setQuery(initialQuery);
      setActive(0);
      setEntries([]);
      setForceList(false);
      setAnnounce("");
      setFlash(null);
      pending.current = null;
      hireActive.current = null;
      moved.current = false;
      setPhase("enter");
      const raf = requestAnimationFrame(() => setPhase("open"));
      return () => cancelAnimationFrame(raf);
    }
    // closing
    setPhase((p) => (p === "closed" ? p : "exit"));
    clearTimers();
    const id = window.setTimeout(
      () => setPhase("closed"),
      reducedRef.current ? 90 : 110,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seq]);

  // Focus the prompt as soon as the panel is in the DOM (the input mounts with the "enter" phase).
  useEffect(() => {
    if (!open || phase === "closed" || phase === "exit") return;
    const el = inputRef.current;
    if (!el || document.activeElement === el) return;
    el.focus({ preventScroll: true });
    el.setSelectionRange(el.value.length, el.value.length);
  }, [open, phase]);

  // Scroll lock while visible.
  const visible = phase !== "closed";
  useEffect(() => {
    if (!visible) return;
    lock(true);
    return () => lock(false);
  }, [visible, lock]);

  // After the exit finished: run a queued action, or hand focus back.
  const wasVisible = useRef(false);
  useEffect(() => {
    if (visible) {
      wasVisible.current = true;
      return;
    }
    if (!wasVisible.current) return;
    wasVisible.current = false;
    const job = pending.current;
    pending.current = null;
    if (job) {
      requestAnimationFrame(job);
      return;
    }
    const target = getOpener() ?? getTrigger();
    const el = target && target.isConnected ? target : getTrigger();
    el?.focus({ preventScroll: true });
  }, [visible]);

  useEffect(() => clearTimers, [clearTimers]);

  // Esc closes, wherever focus is.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !e.isComposing) {
        e.preventDefault();
        closePalette();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* ---------------------------------------------------------------- items + filtering */
  const items = useMemo<Item[]>(() => {
    const base = baseItems();
    const extra: Item[] = [
      {
        id: "act-sketch",
        group: "actions",
        label: sketch.on ? "Turn sketch mode off" : "Turn sketch mode on",
        keywords: "pencil draw wireframe ship toggle theme",
        action: { type: "sketch" },
        icon: "pencil",
        hint: sketch.on ? "on" : "off",
      },
      {
        id: "act-theme",
        group: "actions",
        label:
          theme === "dark" ? "Turn dark mode off (light)" : "Turn dark mode on",
        keywords: "dark light theme night day mode colour color appearance",
        action: { type: "theme" },
        icon: "motion",
        hint: theme,
      },
      {
        id: "act-lite",
        group: "actions",
        label: lite
          ? "Turn lite mode off (full effects)"
          : "Turn lite mode on (smoother on older computers)",
        keywords: "performance lag slow smooth fast speed gpu lite effects",
        action: { type: "lite" },
        icon: "motion",
        hint: lite ? "on" : "off",
      },
      {
        id: "act-motion",
        group: "actions",
        label: reduced ? "Allow full motion" : "Reduce motion",
        keywords: "animation accessibility calm toggle",
        action: { type: "motion" },
        icon: "motion",
        hint: reduced ? "reduced" : "full",
      },
    ];
    return [...base, ...extra, ...terminalItems()];
  }, [sketch.on, reduced, lite, theme]);

  const { groups, flat } = useMemo(() => {
    const q = query.trim();
    const order: GroupId[] = ["goto", "actions", "terminal"];
    type Row = { item: Item; score: number; idx: number[] };
    const byGroup = new Map<GroupId, Row[]>();
    for (const item of items) {
      const m = q
        ? matchText(q, item.label, item.keywords)
        : { score: 0, idx: [] as number[] };
      if (!m) continue;
      (
        byGroup.get(item.group) ?? byGroup.set(item.group, []).get(item.group)!
      ).push({ item, score: m.score, idx: m.idx });
    }
    const list = order
      .filter((g) => byGroup.has(g))
      .map((g) => {
        const rows = byGroup.get(g)!;
        if (q) rows.sort((a, b) => b.score - a.score);
        return {
          id: g,
          rows,
          best: rows.length ? Math.max(...rows.map((r) => r.score)) : 0,
        };
      });
    if (q) list.sort((a, b) => b.best - a.best);
    return { groups: list, flat: list.flatMap((g) => g.rows) };
  }, [items, query]);

  const showOutput = !query.trim() && entries.length > 0 && !forceList;
  const optId = (i: number) => `${uid}-opt-${i}`;
  const activeRow = !showOutput
    ? flat[Math.min(active, flat.length - 1)]
    : undefined;

  useEffect(() => {
    if (!open || showOutput || !query.trim()) return;
    setAnnounce(
      flat.length
        ? `${flat.length} ${flat.length === 1 ? "result" : "results"}`
        : "No results. Press Enter to run it as a command.",
    );
  }, [flat.length, query, open, showOutput]);

  useEffect(() => {
    if (showOutput) return;
    document
      .getElementById(optId(Math.min(active, flat.length - 1)))
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, showOutput, flat.length]);

  useEffect(() => {
    const el = outRef.current;
    const last = el?.lastElementChild as HTMLElement | null;
    if (!el || !last) return;
    // A tall result starts at its first line; a short or growing one (the build log) stays pinned to the end.
    el.scrollTop =
      last.offsetHeight + 32 > el.clientHeight
        ? Math.max(0, last.offsetTop - 16 - el.offsetTop)
        : el.scrollHeight;
  }, [entries, showOutput]);

  /* ---------------------------------------------------------------- terminal commands */
  const addEntry = useCallback((cmd: string, lines: Line[]) => {
    const id = ++entryId.current;
    setEntries((es) => [...es, { id, cmd, lines, fresh: true }]);
    return id;
  }, []);

  const runHire = useCallback(
    (text: string) => {
      const id = addEntry(text, [
        { segs: [{ t: "> hire-prajwal@1.0.0 build", tone: "dim" }] },
      ]);
      const patch = (fn: (l: Line[]) => Line[]) =>
        setEntries((es) =>
          es.map((e) => (e.id === id ? { ...e, lines: fn(e.lines) } : e)),
        );
      const done = (i: number): Line => ({
        status: "done",
        segs: [{ t: HIRE_STEPS[i] }],
      });
      const ship: Line = { status: "done", segs: [{ t: "ready to send" }] };
      const pill: Line = { mail: true, segs: [] };
      const mail = () => {
        hireActive.current = null;
        window.location.href = `mailto:${profile.email}`;
      };
      // Finishing (naturally or skipped with a second Enter) shows the pill; the mail app only opens by itself
      // a few seconds later, and never after Esc (closing the palette clears every timer).
      const finish = () => {
        clearTimers();
        hireActive.current = null;
        patch((l) => [
          ...l.filter((x) => !x.status),
          ...HIRE_STEPS.map((_, i) => done(i)),
          ship,
          pill,
        ]);
        setAnnounce(
          "Build finished. Shipped. Press Enter on Open email, or Escape to stay here.",
        );
        later(3500, mail);
      };
      if (reducedRef.current) {
        hireActive.current = null;
        patch((l) => [...l, ...HIRE_STEPS.map((_, i) => done(i)), ship, pill]);
        setAnnounce(
          "Build finished. Shipped. Press Enter on Open email, or Escape to stay here.",
        );
        later(3500, mail);
        return;
      }
      hireActive.current = finish;
      const T0 = 260;
      const STEP = 400;
      HIRE_STEPS.forEach((s, i) => {
        later(T0 + i * STEP, () =>
          patch((l) => [...l, { status: "run", segs: [{ t: s }] }]),
        );
        later(T0 + i * STEP + 320, () => {
          patch((l) =>
            l.map((x) =>
              x.status === "run" && x.segs[0].t === s ? done(i) : x,
            ),
          );
          setAnnounce(`${s}: done`);
        });
      });
      const end = T0 + (HIRE_STEPS.length - 1) * STEP + 320;
      later(end + 160, finish);
    },
    [addEntry, clearTimers, later],
  );

  const runCommand = useCallback(
    (id: CommandId, text: string) => {
      setQuery("");
      setActive(0);
      setForceList(false);
      moved.current = false;
      hireActive.current = null;
      clearTimers();
      if (id === "clear") {
        setEntries([]);
        setAnnounce("Screen cleared.");
        return;
      }
      if (id === "exit") {
        closePalette();
        return;
      }
      if (id === "hire") {
        runHire(text);
        return;
      }
      const lines = outputFor(id);
      addEntry(text, lines);
      setAnnounce(`${text}. ${lines.map(plain).filter(Boolean).join(". ")}`);
    },
    [addEntry, clearTimers, runHire],
  );

  const runUnknown = useCallback(
    (text: string) => {
      setQuery("");
      setForceList(false);
      const lines = unknownOutput(text);
      addEntry(text, lines);
      setAnnounce(lines.map(plain).join(". "));
    },
    [addEntry],
  );

  /* ---------------------------------------------------------------- actions */
  const goAfterClose = useCallback((job: () => void) => {
    pending.current = job;
    closePalette();
  }, []);

  const runItem = useCallback(
    (item: Item) => {
      const a: Action = item.action;
      switch (a.type) {
        case "cmd":
          runCommand(a.id, a.text);
          return;
        case "copy-email":
          void copy(profile.email).then((ok) => {
            setFlash(ok ? "Copied" : "Copy failed");
            setAnnounce(
              ok
                ? "Email address copied to the clipboard."
                : `Copy failed. The address is ${profile.email}.`,
            );
            later(ok ? 750 : 1800, () => closePalette());
          });
          return;
        case "section": {
          const id = a.id;
          goAfterClose(() => {
            if (isHomePath(window.location.pathname)) {
              const link = document.createElement("a");
              link.href = `#${id}`;
              link.hidden = true;
              document.body.appendChild(link);
              link.click();
              link.remove();
            } else if (!navigate(routes.section(id))) {
              router.push(routes.section(id));
            }
          });
          return;
        }
        case "page":
          goAfterClose(() => {
            if (!navigate(a.href, { label: a.label })) router.push(a.href);
          });
          return;
        case "external":
          goAfterClose(
            () => void window.open(a.href, "_blank", "noopener,noreferrer"),
          );
          return;
        case "mailto":
          goAfterClose(() => {
            window.location.href = `mailto:${profile.email}`;
          });
          return;
        case "card":
          goAfterClose(() => window.dispatchEvent(new Event(CARD_EVENT)));
          return;
        case "save-contact": {
          const ok = saveContact();
          setFlash(ok ? "Saved" : "Save failed");
          setAnnounce(
            ok
              ? "Contact file saved: open it to add Prajwal to your contacts."
              : `Couldn't save the file. The address is ${profile.email}.`,
          );
          later(ok ? 900 : 1800, () => closePalette());
          return;
        }
        case "sketch":
          // No origin: the lens grows out of the header pencil, like every other entry point.
          goAfterClose(() => sketch.toggle());
          return;
        case "architecture":
          goAfterClose(() => {
            setWorkView("architecture");
            if (isHomePath(window.location.pathname)) {
              const link = document.createElement("a");
              link.href = "#work";
              link.hidden = true;
              document.body.appendChild(link);
              link.click();
              link.remove();
            } else if (!navigate(routes.section("work"))) {
              router.push(routes.section("work"));
            }
          });
          return;
        case "motion":
          setMotionPreference(reducedRef.current ? "full" : "reduced");
          goAfterClose(() => undefined);
          return;
        case "theme":
          goAfterClose(() => toggleTheme());
          return;
        case "lite":
          // chosen by hand: the frame watch never overrides it
          try {
            localStorage.setItem(`${LITE_KEY}:by-hand`, "1");
          } catch {}
          setLite(!isLite());
          goAfterClose(() => undefined);
          return;
      }
    },
    [copy, goAfterClose, later, navigate, router, runCommand, sketch],
  );

  const submit = useCallback(() => {
    if (hireActive.current) {
      hireActive.current();
      return;
    }
    const text = query.trim();
    if (!text) {
      if (showOutput) return;
      if (activeRow) runItem(activeRow.item);
      return;
    }
    const cmd = parseCommand(text);
    if (cmd && !(moved.current && activeRow)) {
      runCommand(cmd, text);
      return;
    }
    if (activeRow) {
      runItem(activeRow.item);
      return;
    }
    runUnknown(text);
  }, [activeRow, query, runCommand, runItem, runUnknown, showOutput]);

  /* ---------------------------------------------------------------- keyboard */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const dir = e.key === "ArrowDown" ? 1 : -1;
      if (showOutput) {
        setForceList(true);
        setActive(dir === 1 ? 0 : Math.max(0, flat.length - 1));
        return;
      }
      if (!flat.length) return;
      moved.current = true;
      setActive(
        (a) => (Math.min(a, flat.length - 1) + dir + flat.length) % flat.length,
      );
      return;
    }
    if (e.key === "PageDown" || e.key === "PageUp") {
      const box = showOutput ? outRef.current : listRef.current;
      if (box) {
        e.preventDefault();
        box.scrollBy({
          top: (e.key === "PageDown" ? 1 : -1) * box.clientHeight * 0.8,
        });
      }
      return;
    }
    if (e.key === "Enter" && e.target === inputRef.current) {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === "Tab") {
      const focusables = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          "input, button:not([disabled]), a[href]",
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const cur = document.activeElement;
      if (e.shiftKey && cur === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && cur === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  /* ---------------------------------------------------------------- render */
  if (phase === "closed")
    return <div className="sr-only" role="status" aria-live="polite" />;

  const shown = phase === "open";
  const panelStyle = {
    opacity: shown ? 1 : 0,
    transform: reduced
      ? undefined
      : `scale(${shown ? 1 : phase === "exit" ? 0.99 : 0.98}) translateY(${shown ? 0 : phase === "exit" ? 0 : 6}px)`,
    transition: shown
      ? `opacity 160ms var(--ease-arrive), transform 160ms var(--ease-arrive)`
      : `opacity 100ms var(--ease-exit), transform 100ms var(--ease-exit)`,
  } as const;
  const scrimStyle = {
    opacity: shown ? 1 : 0,
    transition: shown
      ? "opacity 160ms var(--ease-arrive)"
      : "opacity 100ms var(--ease-exit)",
  } as const;
  const listboxId = `${uid}-list`;
  const hasQuery = query.trim().length > 0;

  return (
    <div
      data-qa="palette"
      data-state={phase}
      className="fixed inset-0 z-(--z-menu)"
    >
      <div
        aria-hidden="true"
        data-qa="palette-scrim"
        onPointerDown={() => closePalette()}
        style={{
          ...scrimStyle,
          background:
            "color-mix(in srgb, var(--color-ink) 11%, var(--color-paper) 89%)",
          opacity: shown ? 0.9 : 0,
        }}
        className="absolute inset-0"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        data-qa="palette-panel"
        data-lenis-prevent=""
        onKeyDown={onKeyDown}
        style={panelStyle}
        className="absolute inset-x-3 top-[max(0.75rem,9dvh)] mx-auto flex max-h-[calc(100dvh-1.5rem)] max-w-[40rem] origin-top flex-col overflow-hidden rounded-card border border-line-strong bg-card shadow-lift sm:inset-x-4"
      >
        {/* prompt line */}
        <div className="flex min-h-14 items-center gap-2 border-b border-line pr-2 pl-4 sm:gap-2.5 sm:pl-5">
          <span
            aria-hidden="true"
            className="type-mono shrink-0 whitespace-nowrap select-none"
          >
            <span className="hidden text-blue-deep sm:inline">
              prajwal@portfolio{" "}
            </span>
            <span className="text-graphite">~ </span>
            <span className="text-tangerine-deep">$</span>
          </span>
          <input
            ref={inputRef}
            data-qa="palette-input"
            type="text"
            role="combobox"
            aria-label="Command or search"
            aria-expanded={!showOutput}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-activedescendant={
              !showOutput && flat.length
                ? optId(Math.min(active, flat.length - 1))
                : undefined
            }
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="type a command, or search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setForceList(false);
              moved.current = false;
            }}
            className="h-14 min-w-0 flex-1 bg-transparent font-mono text-[16px] text-ink caret-blue outline-none placeholder:text-graphite"
          />
          <button
            type="button"
            data-qa="palette-close"
            aria-label="Close command palette"
            onClick={() => closePalette()}
            className="inline-flex size-11 shrink-0 items-center justify-center gap-1 rounded-pill text-graphite transition-colors duration-(--dur-feedback) hover:bg-paper-2 hover:text-ink sm:w-auto sm:px-3"
          >
            <Close size={18} className="sm:hidden" />
            <kbd className="type-micro hidden rounded-chip border border-line-strong px-1.5 py-0.5 sm:inline">
              esc
            </kbd>
          </button>
        </div>

        {/* results / output */}
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          tabIndex={-1}
          data-lenis-prevent=""
        >
          {/* listbox is always in the DOM so aria-controls resolves */}
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Results"
            data-qa="palette-list"
            hidden={showOutput}
            tabIndex={-1}
            className="max-h-[min(24rem,calc(100dvh-14rem))] overflow-y-auto overscroll-contain p-2"
            data-lenis-prevent=""
          >
            {groups.map((g) => (
              <div
                key={g.id}
                role="group"
                aria-labelledby={`${uid}-g-${g.id}`}
                className="pb-1"
              >
                <div
                  id={`${uid}-g-${g.id}`}
                  className="type-label px-3 pt-3 pb-1.5 text-graphite"
                >
                  {GROUP_LABEL[g.id]}
                </div>
                {g.rows.map((row) => {
                  const i = flat.indexOf(row);
                  const selected = i === Math.min(active, flat.length - 1);
                  const Icon = ICONS[row.item.icon];
                  const mono = row.item.group === "terminal";
                  return (
                    <div
                      key={row.item.id}
                      id={optId(i)}
                      role="option"
                      aria-selected={selected}
                      data-qa="palette-option"
                      data-id={row.item.id}
                      onPointerMove={() => {
                        if (i !== active || !moved.current) {
                          moved.current = true;
                          setActive(i);
                        }
                      }}
                      onClick={() => runItem(row.item)}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-panel px-3 py-1.5 text-ink transition-colors duration-(--dur-tap) aria-selected:bg-lime-soft"
                    >
                      <span
                        className={`shrink-0 ${selected ? "text-ink" : "text-graphite"}`}
                      >
                        <Icon size={18} />
                      </span>
                      <span
                        className={`min-w-0 flex-1 truncate ${mono ? "type-mono" : "type-ui"}`}
                      >
                        <Highlight text={row.item.label} idx={row.idx} />
                        {row.item.external ? (
                          <span className="sr-only"> (opens in a new tab)</span>
                        ) : null}
                      </span>
                      {flash && row.item.id === "act-copy" ? (
                        <span className="type-micro inline-flex items-center gap-1 rounded-pill bg-lime px-2 py-0.5 text-ink">
                          <Check size={12} /> {flash}
                        </span>
                      ) : (
                        <span className="type-micro shrink-0 text-graphite">
                          {row.item.hint}
                        </span>
                      )}
                      <kbd
                        aria-hidden="true"
                        className={`type-micro hidden size-6 shrink-0 items-center justify-center rounded-chip border border-ink/25 sm:inline-flex ${selected ? "opacity-100" : "opacity-0"}`}
                      >
                        ↵
                      </kbd>
                    </div>
                  );
                })}
              </div>
            ))}
            {!flat.length ? (
              <div data-qa="palette-empty" className="px-4 py-8 text-center">
                <p className="type-ui text-ink">
                  Nothing matches{" "}
                  <span className="type-mono rounded-chip bg-paper-2 px-1.5 py-0.5">
                    {query.trim()}
                  </span>
                </p>
                <p className="type-ui mt-1.5 text-graphite">
                  Press Enter to run it as a command, or try one below.
                </p>
              </div>
            ) : null}
          </div>

          <div
            ref={outRef}
            role="log"
            aria-live="polite"
            aria-label="Terminal output"
            data-qa="palette-output"
            hidden={!showOutput}
            tabIndex={-1}
            className="max-h-[min(24rem,calc(100dvh-14rem))] overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
            data-lenis-prevent=""
          >
            {entries.map((e) => (
              <div
                key={e.id}
                data-qa="palette-entry"
                className="mb-4 last:mb-0"
              >
                <p className="type-mono text-graphite">
                  <span className="text-blue-deep">prajwal@portfolio</span> ~{" "}
                  <span className="text-tangerine-deep">$</span>{" "}
                  <span className="text-ink">{e.cmd}</span>
                </p>
                <div className="mt-1.5">
                  {e.lines.map((l, i) => (
                    <TermLine
                      key={i}
                      line={l}
                      index={i}
                      reduced={reduced}
                      onNavigate={() => closePalette()}
                      onMail={() => {
                        clearTimers();
                        window.location.href = `mailto:${profile.email}`;
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* footer: starters + key hints */}
        <div className="flex items-center gap-3 border-t border-line bg-paper px-3 py-2 sm:px-4">
          <span
            className="type-hand-sm hidden shrink-0 -rotate-2 text-graphite sm:block"
            aria-hidden="true"
          >
            try
          </span>
          <ul
            tabIndex={-1}
            className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-1"
            data-lenis-prevent=""
          >
            {CHIPS.map((c) => (
              <li key={c} className="shrink-0">
                <button
                  type="button"
                  data-qa="palette-chip"
                  onClick={() => {
                    const id = parseCommand(c);
                    if (id) runCommand(id, c);
                    inputRef.current?.focus({ preventScroll: true });
                  }}
                  className="type-micro inline-flex min-h-9 items-center rounded-pill border border-line-strong bg-card px-3 text-ink transition-colors duration-(--dur-feedback) hover:border-ink hover:bg-lime-soft coarse:min-h-11"
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-qa="palette-status"
        >
          {announce}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

function Highlight({ text, idx }: { text: string; idx: number[] }) {
  if (!idx.length) return <>{text}</>;
  const set = new Set(idx);
  const parts: ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const on = set.has(i);
    let j = i;
    while (j < text.length && set.has(j) === on) j++;
    const chunk = text.slice(i, j);
    parts.push(
      on ? (
        <mark key={i} className="rounded-[3px] bg-lime text-ink">
          {chunk}
        </mark>
      ) : (
        <Fragment key={i}>{chunk}</Fragment>
      ),
    );
    i = j;
  }
  return <>{parts}</>;
}

/** One output line. It types itself in with a stepped clip (the full text is in the DOM). */
function TermLine({
  line,
  index,
  reduced,
  onNavigate,
  onMail,
}: {
  line: Line;
  index: number;
  reduced: boolean;
  onNavigate: () => void;
  onMail: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mailRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (line.mail) mailRef.current?.focus({ preventScroll: true });
  }, [line.mail]);
  const chars =
    (line.label?.length ?? 0) + line.segs.reduce((n, s) => n + s.t.length, 0);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || line.status || line.stamp || line.gap) return;
    const n = Math.max(2, Math.min(chars, 90));
    const a = el.animate(
      [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }],
      {
        duration: Math.min(120 + n * 9, 520),
        delay: Math.min(index * 45, 420),
        easing: `steps(${n}, end)`,
        fill: "backwards",
      },
    );
    return () => a.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (line.gap) return <div aria-hidden="true" className="h-3" />;
  if (line.mail)
    return (
      <div className="pt-2">
        <button
          ref={mailRef}
          type="button"
          data-qa="palette-open-email"
          onClick={onMail}
          className="type-ui inline-flex min-h-11 items-center gap-2 rounded-pill bg-lime px-5 font-medium text-ink transition-transform duration-(--dur-feedback) hover:-translate-y-px active:translate-y-0"
        >
          <Mail size={16} /> Open email
        </button>
      </div>
    );

  return (
    <div
      ref={ref}
      className={`type-mono flex items-baseline gap-2 leading-relaxed text-ink${line.segs.some((s) => s.href) ? " coarse:min-h-11 coarse:items-center" : ""}`}
      style={{ minHeight: "1.45em" }}
    >
      {line.status ? (
        <StepMark status={line.status} reduced={reduced} />
      ) : line.stamp ? (
        <span aria-hidden="true" className="size-4 shrink-0" />
      ) : null}
      {line.label ? (
        <span className="w-[10.5rem] shrink-0 text-graphite max-sm:w-[7.5rem]">
          {line.label}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 break-words whitespace-pre-wrap">
        {line.segs.map((s, i) => {
          const cls = s.tone ? TONE[s.tone] : "";
          if (!s.href)
            return (
              <span key={i} className={cls}>
                {s.t}
              </span>
            );
          const isHttp = /^https?:/.test(s.href);
          if (s.href.startsWith("/")) {
            return (
              <TransitionLink
                key={i}
                href={s.href}
                onClick={onNavigate}
                className={`${cls} underline decoration-blue/40 underline-offset-4 hover:decoration-current`}
              >
                {s.t}
              </TransitionLink>
            );
          }
          return (
            <a
              key={i}
              href={s.href}
              {...(isHttp
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={`${cls} underline decoration-blue/40 underline-offset-4 hover:decoration-current`}
            >
              {s.t}
              {isHttp ? (
                <span className="sr-only"> (opens in a new tab)</span>
              ) : null}
            </a>
          );
        })}
        {line.stamp ? <Stamp reduced={reduced} /> : null}
      </span>
    </div>
  );
}

function StepMark({
  status,
  reduced,
}: {
  status: "run" | "done";
  reduced: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  useEffect(() => {
    if (reduced) return;
    if (status === "run" && ref.current) {
      const a = ref.current.animate(
        [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
        { duration: 700, iterations: Infinity, easing: "linear" },
      );
      return () => a.cancel();
    }
    if (status === "done" && path.current) {
      const a = path.current.animate(
        [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
        {
          duration: 220,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "backwards",
        },
      );
      return () => a.cancel();
    }
  }, [status, reduced]);
  return (
    <span
      className="inline-flex size-4 shrink-0 translate-y-[3px] items-center justify-center"
      aria-hidden="true"
    >
      {status === "run" ? (
        <svg
          ref={ref}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-graphite"
        >
          <path d="M12 3a9 9 0 1 0 9 9" />
        </svg>
      ) : (
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-lime text-ink">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              ref={path}
              d="m5 12.5 4.5 4.5L19 7"
              pathLength={1}
              strokeDasharray={1}
            />
          </svg>
        </span>
      )}
    </span>
  );
}

/** The tangerine SHIPPED stamp (the one place a back-out overshoot is allowed). */
function Stamp({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduced || !ref.current) return;
    const a = ref.current.animate(
      [
        { transform: "scale(1.9) rotate(-14deg)", opacity: 0 },
        { transform: "scale(1) rotate(-5deg)", opacity: 1 },
      ],
      {
        duration: 300,
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        fill: "backwards",
      },
    );
    return () => a.cancel();
  }, [reduced]);
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="type-label ml-3 inline-block -rotate-[5deg] rounded-[6px] border-2 border-ink bg-tangerine px-2 py-0.5 align-middle text-ink"
    >
      shipped
    </span>
  );
}
