"use client";

/**
 * THE SKETCHBOOK, drawn (./index loads this when sketch mode turns on).
 *
 * Drawing: a press and drag on anything that is not a link or a control (and not the header, a
 * dialog or the draggable note) draws; a plain click never leaves a mark and still does what it
 * did. A mouse or a pen draws at once; a finger draws only once a pencil is picked (the hand tool
 * gives scrolling back), because a one-finger drag is how phones scroll. Tools: pencil (graphite),
 * pen (blue ink), marker (lime highlighter), eraser (takes whole strokes), undo (Ctrl+Z; redo
 * Ctrl+Y / Ctrl+Shift+Z) and clear (undoable).
 *
 * Where drawings live: one SVG over the whole document (pointer-events none, under the header).
 * Each stroke is pinned to the block of the page it started on (a direct child of <main>, or the
 * footer) and to the page's centre line, so it stays with its section when the layout above it
 * changes or the window resizes. Kept in localStorage per page and per layout ("wide" from 900px,
 * "narrow" below), so phone drawings belong to the phone layout. Nothing leaves the browser.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { normalizePath } from "@/lib/routes";

type Ink = "pencil" | "pen" | "marker";
type Tool = "hand" | Ink | "eraser";
/** a: the anchor (block) index; p: points relative to (page centre, anchor top), flat [x, y, ...] */
type Stroke = { id: string; a: number; t: Ink; p: number[] };
type Action =
  | { k: "add"; s: Stroke }
  | { k: "erase"; items: { s: Stroke; i: number }[] }
  | { k: "clear"; all: Stroke[] };
type Layout = { cx: number; tops: number[]; h: number };

const NS = "http://www.w3.org/2000/svg";
const INK: Record<Ink, { color: string; width: number; opacity: number }> = {
  pencil: { color: "#2a2a27", width: 2.1, opacity: 0.9 },
  pen: { color: "#2c44d8", width: 2.6, opacity: 1 },
  marker: { color: "#c8f53b", width: 16, opacity: 0.55 },
};
/** where a drag never draws: links, controls, fields, media, the header, dialogs, the note */
const NO_DRAW =
  'a,button,input,textarea,select,label,summary,option,iframe,video,audio,canvas,[contenteditable=""],[contenteditable="true"],[role="button"],[role="link"],[role="tab"],[role="slider"],[role="radio"],[role="checkbox"],[role="switch"],[role="menuitem"],[role="option"],[role="dialog"],[aria-modal="true"],[draggable="true"],[tabindex]:not([tabindex="-1"]),[data-no-draw],[data-qa="hero-note"],header[data-boot]';
const MAX_STROKES = 600;
const MAX_POINTS = 2000;
const HINT_KEY = "pmp:sketchbook-hint";

const r1 = (v: number) => Math.round(v * 10) / 10;
const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const bucketOf = () => (window.innerWidth >= 900 ? "wide" : "narrow");
const keyOf = (path: string, bucket: string) =>
  `pmp:sketchbook:${bucket}:${path}`;

function load(key: string): Stroke[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const data = JSON.parse(raw) as { v?: number; s?: Stroke[] };
    if (data?.v !== 1 || !Array.isArray(data.s)) return [];
    return data.s.filter(
      (s) =>
        s &&
        typeof s.id === "string" &&
        typeof s.a === "number" &&
        Array.isArray(s.p) &&
        s.p.length >= 2 &&
        s.t in INK,
    );
  } catch {
    return [];
  }
}

/** a smooth path through the points: quadratic curves through the midpoints */
const pathCache = new WeakMap<Stroke, string>();
function pathOf(p: number[]): string {
  const n = p.length / 2;
  if (n === 0) return "";
  if (n === 1) return `M${p[0]} ${p[1]}l0.01 0`;
  let d = `M${p[0]} ${p[1]}`;
  for (let i = 1; i < n - 1; i++) {
    const x = p[i * 2];
    const y = p[i * 2 + 1];
    d += `Q${x} ${y} ${r1((x + p[i * 2 + 2]) / 2)} ${r1((y + p[i * 2 + 3]) / 2)}`;
  }
  return `${d}L${p[(n - 1) * 2]} ${p[(n - 1) * 2 + 1]}`;
}
const dOf = (s: Stroke) => {
  let d = pathCache.get(s);
  if (!d) {
    d = pathOf(s.p);
    pathCache.set(s, d);
  }
  return d;
};

/** does the eraser at (x, y), radius r, touch the stroke (points in the stroke's own frame) */
const boxCache = new WeakMap<Stroke, [number, number, number, number]>();
function hits(s: Stroke, x: number, y: number, r: number): boolean {
  let b = boxCache.get(s);
  if (!b) {
    b = [Infinity, Infinity, -Infinity, -Infinity];
    for (let i = 0; i < s.p.length; i += 2) {
      b[0] = Math.min(b[0], s.p[i]);
      b[1] = Math.min(b[1], s.p[i + 1]);
      b[2] = Math.max(b[2], s.p[i]);
      b[3] = Math.max(b[3], s.p[i + 1]);
    }
    boxCache.set(s, b);
  }
  if (x < b[0] - r || x > b[2] + r || y < b[1] - r || y > b[3] + r)
    return false;
  const p = s.p;
  if (p.length === 2) return Math.hypot(x - p[0], y - p[1]) <= r;
  for (let i = 0; i + 3 < p.length; i += 2) {
    const [ax, ay, bx, by] = [p[i], p[i + 1], p[i + 2], p[i + 3]];
    const dx = bx - ax;
    const dy = by - ay;
    const len = dx * dx + dy * dy;
    const t = len
      ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len))
      : 0;
    if (Math.hypot(x - (ax + t * dx), y - (ay + t * dy)) <= r) return true;
  }
  return false;
}

export default function SketchbookImpl() {
  const path = normalizePath(usePathname() || "/");
  const fine = useMemo(
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    [],
  );
  const [tool, setTool] = useState<Tool>(() => (fine ? "pencil" : "hand"));
  const [bucket, setBucket] = useState(bucketOf);
  const key = keyOf(path, bucket);
  const [strokes, setStrokes] = useState<Stroke[]>(() => load(key));
  const strokesRef = useRef(strokes);
  const keyRef = useRef(key);
  const [lay, setLay] = useState<Layout>({ cx: 0, tops: [], h: 0 });
  const layRef = useRef(lay);
  const svgRef = useRef<SVGSVGElement>(null);
  const undoStack = useRef<Action[]>([]);
  const redoStack = useRef<Action[]>([]);
  const [, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);
  const [said, setSaid] = useState("");
  const [hint, setHint] = useState(() => {
    try {
      return localStorage.getItem(HINT_KEY) !== "1";
    } catch {
      return false;
    }
  });

  /* ---- saving (debounced; flushed on page change, unmount and when the tab is hidden) ------- */
  const pending = useRef<{ k: string; s: Stroke[] } | null>(null);
  const timer = useRef(0);
  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const p = pending.current;
    pending.current = null;
    if (!p) return;
    try {
      if (p.s.length)
        localStorage.setItem(p.k, JSON.stringify({ v: 1, s: p.s }));
      else localStorage.removeItem(p.k);
    } catch {
      // storage full or blocked: the drawing stays for this visit only
    }
  }, []);
  const commit = useCallback(
    (next: Stroke[]) => {
      strokesRef.current = next;
      setStrokes(next);
      pending.current = { k: keyRef.current, s: next };
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, 300);
    },
    [flush],
  );
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  // another page or layout: save this one, open that one
  useEffect(() => {
    if (keyRef.current === key) return;
    flush();
    keyRef.current = key;
    const next = load(key);
    strokesRef.current = next;
    setStrokes(next);
    undoStack.current = [];
    redoStack.current = [];
    bump();
  }, [key, flush]);

  /* ---- where the page's blocks are ------------------------------------------------------- */
  const measure = useCallback(() => {
    const main = document.querySelector("main");
    const els: Element[] = main ? Array.from(main.children) : [];
    const foot = document.querySelector("main ~ footer");
    if (foot) els.push(foot);
    const sy = window.scrollY;
    const tops = els.map(
      (el) => Math.round((el.getBoundingClientRect().top + sy) * 2) / 2,
    );
    const next: Layout = {
      cx: document.documentElement.clientWidth / 2,
      tops,
      h: document.body.offsetHeight,
    };
    const prev = layRef.current;
    if (
      prev.cx === next.cx &&
      prev.h === next.h &&
      prev.tops.length === tops.length &&
      prev.tops.every((t, i) => t === tops[i])
    )
      return;
    layRef.current = next;
    setLay(next);
  }, []);
  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(schedule);
    const main = document.querySelector("main");
    const observeAll = () => {
      ro.disconnect();
      ro.observe(document.body);
      if (main) Array.from(main.children).forEach((c) => ro.observe(c));
      schedule();
    };
    observeAll();
    const mo = main ? new MutationObserver(observeAll) : null;
    if (main) mo?.observe(main, { childList: true });
    const onResize = () => {
      schedule();
      setBucket(bucketOf());
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [measure, path]);

  /* ---- undo, redo, clear ------------------------------------------------------------------ */
  const announce = (m: string) => {
    setSaid("");
    window.setTimeout(() => setSaid(m), 30);
  };
  const pushUndo = useCallback((a: Action) => {
    undoStack.current.push(a);
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current = [];
    bump();
  }, []);
  const undo = useCallback(() => {
    const a = undoStack.current.pop();
    if (!a) return;
    let list = strokesRef.current;
    if (a.k === "add") list = list.filter((s) => s.id !== a.s.id);
    else if (a.k === "erase") {
      list = [...list];
      for (let j = a.items.length - 1; j >= 0; j--)
        list.splice(Math.min(a.items[j].i, list.length), 0, a.items[j].s);
    } else list = a.all;
    redoStack.current.push(a);
    commit(list);
    bump();
    announce(a.k === "clear" ? "The drawing is back." : "Undone.");
  }, [commit]);
  const redo = useCallback(() => {
    const a = redoStack.current.pop();
    if (!a) return;
    let list = strokesRef.current;
    if (a.k === "add") list = [...list, a.s];
    else if (a.k === "erase") {
      const gone = new Set(a.items.map((x) => x.s.id));
      list = list.filter((s) => !gone.has(s.id));
    } else list = [];
    undoStack.current.push(a);
    commit(list);
    bump();
    announce("Redone.");
  }, [commit]);
  const clearAll = () => {
    const all = strokesRef.current;
    if (!all.length) return;
    pushUndo({ k: "clear", all });
    commit([]);
    announce("Page cleared. Undo brings it back.");
  };
  const dismissHint = useCallback(() => {
    setHint(false);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {}
  }, []);
  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(dismissHint, 9000);
    return () => window.clearTimeout(t);
  }, [hint, dismissHint]);

  /* ---- the tool on <html>: the cursor follows it; a finger draws only with a pencil picked ---- */
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-sk-tool", tool);
    if (!fine && tool !== "hand") html.classList.add("sk-drawing");
    return () => {
      html.removeAttribute("data-sk-tool");
      html.classList.remove("sk-drawing", "sk-inking");
    };
  }, [tool, fine]);

  /* ---- keys: undo / redo ------------------------------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t?.closest(
          'input, textarea, select, [contenteditable="true"], [contenteditable=""]',
        )
      )
        return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        if (!undoStack.current.length) return;
        e.preventDefault();
        undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        if (!redoStack.current.length) return;
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  /* ---- drawing and erasing ----------------------------------------------------------------- */
  useEffect(() => {
    if (tool === "hand") return;
    const html = document.documentElement;
    let pend: {
      id: number;
      cx: number;
      cy: number;
      px: number;
      py: number;
    } | null = null;
    let live: {
      s: Stroke;
      el: SVGPathElement;
      g: SVGGElement;
      ox: number;
      oy: number;
    } | null = null;
    let erased: { s: Stroke; i: number }[] | null = null;
    let raf = 0;

    const drawable = (e: PointerEvent) => {
      if (e.button !== 0 || !e.isPrimary) return false;
      if (e.pointerType === "touch" && !html.classList.contains("sk-drawing"))
        return false;
      const t = e.target;
      if (!(t instanceof Element) || t.closest(NO_DRAW)) return false;
      return !document.querySelector('[aria-modal="true"]');
    };
    const capture = (id: number) => {
      try {
        html.setPointerCapture(id);
      } catch {}
    };
    const begin = () => {
      if (!pend || !svgRef.current) return;
      measure();
      const L = layRef.current;
      let a = 0;
      for (let i = 0; i < L.tops.length; i++) if (pend.py >= L.tops[i]) a = i;
      const ox = L.cx;
      const oy = L.tops[a] ?? 0;
      const ink = tool as Ink;
      const s: Stroke = {
        id: uid(),
        a,
        t: ink,
        p: [r1(pend.px - ox), r1(pend.py - oy)],
      };
      const g = document.createElementNS(NS, "g");
      g.setAttribute("transform", `translate(${ox} ${oy})`);
      const el = document.createElementNS(NS, "path");
      const c = INK[ink];
      el.setAttribute("fill", "none");
      el.setAttribute("stroke", c.color);
      el.setAttribute("stroke-width", String(c.width));
      el.setAttribute("stroke-opacity", String(c.opacity));
      el.setAttribute("stroke-linecap", "round");
      el.setAttribute("stroke-linejoin", "round");
      g.appendChild(el);
      svgRef.current.appendChild(g);
      live = { s, el, g, ox, oy };
      html.classList.add("sk-inking");
      window.getSelection()?.removeAllRanges();
      capture(pend.id);
    };
    const add = (clientX: number, clientY: number) => {
      if (!live) return;
      const p = live.s.p;
      if (p.length >= MAX_POINTS * 2) return;
      const x = r1(clientX + window.scrollX - live.ox);
      const y = r1(clientY + window.scrollY - live.oy);
      if (Math.hypot(x - p[p.length - 2], y - p[p.length - 1]) < 1.2) return;
      p.push(x, y);
    };
    const paint = () => {
      raf = 0;
      if (live) live.el.setAttribute("d", pathOf(live.s.p));
    };
    const eraseAt = (clientX: number, clientY: number) => {
      const L = layRef.current;
      const px = clientX + window.scrollX - L.cx;
      const py = clientY + window.scrollY;
      let list = strokesRef.current;
      const hit: number[] = [];
      list.forEach((s, i) => {
        if (hits(s, px, py - (L.tops[s.a] ?? 0), 9 + INK[s.t].width / 2))
          hit.push(i);
      });
      if (!hit.length) return;
      erased ??= [];
      for (const i of hit.sort((a, b) => b - a)) {
        erased.push({ s: list[i], i });
        list = [...list.slice(0, i), ...list.slice(i + 1)];
      }
      commit(list);
    };
    const swallow = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const end = (keep: boolean) => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      html.classList.remove("sk-inking");
      if (erased) {
        if (erased.length) pushUndo({ k: "erase", items: erased });
        erased = null;
      }
      if (!live) return false;
      const s = live.s;
      live.g.remove();
      live = null;
      if (!keep) return false;
      const next = [...strokesRef.current, s];
      commit(
        next.length > MAX_STROKES
          ? next.slice(next.length - MAX_STROKES)
          : next,
      );
      pushUndo({ k: "add", s });
      dismissHint();
      return true;
    };

    const onDown = (e: PointerEvent) => {
      if (pend || !drawable(e)) return;
      pend = {
        id: e.pointerId,
        cx: e.clientX,
        cy: e.clientY,
        px: e.clientX + window.scrollX,
        py: e.clientY + window.scrollY,
      };
      if (tool === "eraser") {
        html.classList.add("sk-inking");
        capture(e.pointerId);
        eraseAt(e.clientX, e.clientY);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!pend || e.pointerId !== pend.id) return;
      if (tool === "eraser") {
        for (const ev of e.getCoalescedEvents?.() ?? [e])
          eraseAt(ev.clientX, ev.clientY);
        return;
      }
      if (!live) {
        if (
          Math.hypot(e.clientX - pend.cx, e.clientY - pend.cy) <
          (e.pointerType === "mouse" ? 3 : 2)
        )
          return;
        begin();
      }
      const evs = e.getCoalescedEvents?.() ?? [];
      for (const ev of evs.length ? evs : [e]) add(ev.clientX, ev.clientY);
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const onUp = (e: PointerEvent) => {
      if (!pend || e.pointerId !== pend.id) return;
      const id = pend.id;
      pend = null;
      try {
        html.releasePointerCapture(id);
      } catch {}
      if (end(e.type === "pointerup")) {
        // the click that ends a stroke does nothing
        window.addEventListener("click", swallow, {
          capture: true,
          once: true,
        });
        window.setTimeout(
          () => window.removeEventListener("click", swallow, true),
          0,
        );
      }
    };
    const onDragStart = (e: DragEvent) => {
      if (pend) e.preventDefault();
    };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("dragstart", onDragStart, true);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("dragstart", onDragStart, true);
      end(false);
    };
  }, [tool, measure, commit, pushUndo, dismissHint]);

  /* ---- the toolbar ------------------------------------------------------------------------ */
  const choose = (t: Tool) => {
    setTool(t);
    announce(`${TOOLS.find((x) => x.id === t)?.label ?? t} selected.`);
  };
  const onToolbarKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const btns = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)",
      ),
    );
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    btns[
      (i + (e.key === "ArrowRight" ? 1 : btns.length - 1)) % btns.length
    ].focus();
  };

  return (
    <>
      <svg
        ref={svgRef}
        aria-hidden="true"
        data-qa="sketchbook"
        className="pointer-events-none absolute top-0 left-0 z-[55] w-full overflow-hidden print:z-0"
        style={{ height: lay.h || 0 }}
      >
        {strokes.map((s) => {
          const c = INK[s.t];
          return (
            <g
              key={s.id}
              transform={`translate(${lay.cx} ${lay.tops[s.a] ?? 0})`}
            >
              <path
                d={dOf(s)}
                fill="none"
                stroke={c.color}
                strokeWidth={c.width}
                strokeOpacity={c.opacity}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}
      </svg>

      <div
        data-no-draw=""
        className="pointer-events-none fixed inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-[65] flex justify-center px-3 print:hidden"
      >
        <div className="pointer-events-auto relative">
          {hint ? (
            <p
              data-qa="sketchbook-hint"
              className="absolute bottom-[calc(100%+10px)] left-2 flex items-end gap-1.5 font-hand text-[1.3rem] leading-tight font-bold whitespace-nowrap text-ink"
            >
              {fine
                ? "press and drag anywhere to draw"
                : "pick a pencil, then draw with a finger"}
              <svg
                aria-hidden="true"
                viewBox="0 0 32 24"
                className="mb-[-6px] h-5 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4c6 2 13 7 16 15M14 17l5 3 2-6" />
              </svg>
            </p>
          ) : null}
          <div
            role="toolbar"
            aria-label="Sketchbook: draw on this page"
            aria-orientation="horizontal"
            data-qa="sketchbook-tools"
            onKeyDown={onToolbarKey}
            className="sk-book-tools"
          >
            <span
              aria-hidden="true"
              className="px-2 font-hand text-[1.35rem] leading-none font-bold text-ink max-[560px]:hidden"
            >
              sketchbook
            </span>
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="sk-book-tool"
                aria-pressed={tool === t.id}
                aria-label={t.label}
                title={t.label}
                data-tool={t.id}
                onClick={() => choose(t.id)}
              >
                {t.icon}
                {t.swatch ? (
                  <span
                    aria-hidden="true"
                    className="sk-book-swatch"
                    style={{ background: t.swatch }}
                  />
                ) : null}
              </button>
            ))}
            <span
              aria-hidden="true"
              className="mx-1 h-7 w-px shrink-0 bg-[rgb(13_13_12/0.28)]"
            />
            <button
              type="button"
              className="sk-book-tool"
              aria-label="Undo"
              title="Undo (Ctrl+Z)"
              data-qa="sketchbook-undo"
              disabled={!undoStack.current.length}
              onClick={undo}
            >
              <Icon d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
            </button>
            <button
              type="button"
              className="sk-book-tool"
              aria-label="Clear this page's drawing"
              title="Clear the page (undo brings it back)"
              data-qa="sketchbook-clear"
              disabled={!strokes.length}
              onClick={clearAll}
            >
              <Icon d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />
            </button>
          </div>
          <span role="status" aria-live="polite" className="sr-only">
            {said}
          </span>
        </div>
      </div>
    </>
  );
}

function Icon({ d, children }: { d?: string; children?: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className="size-[22px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d ? <path d={d} /> : null}
      {children}
    </svg>
  );
}

const TOOLS: { id: Tool; label: string; swatch?: string; icon: ReactNode }[] = [
  {
    id: "hand",
    label: "Hand: scroll and click",
    icon: (
      <Icon d="M8 13.5V6.5a1.5 1.5 0 0 1 3 0V12M11 11.5V5a1.5 1.5 0 0 1 3 0v6.5M14 11.5V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.6 7-6.2 7-2.5 0-4-1.2-5.3-3.2l-2.2-3.4a1.5 1.5 0 0 1 2.4-1.8L8 14.2" />
    ),
  },
  {
    id: "pencil",
    label: "Pencil",
    swatch: INK.pencil.color,
    icon: (
      <Icon>
        <g transform="rotate(-45 12 12)">
          <path d="M8.2 9.3H18.4M8.2 14.7H18.4M8.2 9.3V14.7M8.2 9.3 3.1 12l5.1 2.7" />
          <path d="M18.4 9.3h1.4a2.7 2.7 0 0 1 0 5.4h-1.4zM18.4 9.3v5.4" />
          <path d="M3.1 12 5 11v2z" fill="currentColor" />
        </g>
      </Icon>
    ),
  },
  {
    id: "pen",
    label: "Pen: blue ink",
    swatch: INK.pen.color,
    icon: (
      <Icon d="M15.4 4.6a2.1 2.1 0 0 1 3 0l1 1a2.1 2.1 0 0 1 0 3L9 19l-5 1 1-5zM13.4 6.6l4 4" />
    ),
  },
  {
    id: "marker",
    label: "Marker: lime highlighter",
    swatch: INK.marker.color,
    icon: (
      <Icon d="M14.6 3.6l5.8 5.8-7.6 7.6H8.4v-4.4zM8.4 17 5 20.4h4.6M11.2 9.4l3.4 3.4" />
    ),
  },
  {
    id: "eraser",
    label: "Eraser",
    icon: (
      <Icon d="M8.5 20.5h11M5.2 14.8l8.6-8.6a2 2 0 0 1 2.8 0l2.8 2.8a2 2 0 0 1 0 2.8l-6.9 6.9a2 2 0 0 1-1.4.6H8.6a2 2 0 0 1-1.4-.6l-2-2a1.4 1.4 0 0 1 0-1.9zM9.5 10.5l4.9 4.9" />
    ),
  },
];
