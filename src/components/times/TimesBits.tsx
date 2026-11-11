"use client";

/**
 * The interactive bits of The Prajwal Times (./index): the edition's date (today, in Bengaluru),
 * Save as PDF (the browser's print, laid out for A4 in globals.css), the WANTED ad's tear-off tabs
 * (each copies the email and comes away), and the puzzle corner (a 4x4 sudoku a tiny backtracking
 * solver fills, a nod to his Sudoku Solver). No motion beyond a torn tab dropping (none when
 * reduced).
 */
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { profile } from "@/content";
import { useCopy } from "@/lib/hooks/useCopy";

/** today, in Bengaluru ("Monday, 9 November 2026"); empty until mounted so the markup matches */
export function EditionDate() {
  const [d, setD] = useState("");
  useEffect(() => {
    setD(
      new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    );
  }, []);
  return (
    <span data-qa="times-date" suppressHydrationWarning>
      {d || "Today's edition"}
    </span>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      data-qa="times-print"
      className="type-ui inline-flex min-h-11 items-center gap-2 rounded-full bg-lime px-5 font-semibold text-ink hover:bg-ink hover:text-paper"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        <path d="M4.5 6V2.5h7V6M4.5 11.5h-2v-5h11v5h-2M4.5 9.5h7v4h-7z" />
      </svg>
      Save as PDF
    </button>
  );
}

/** the tabs at the foot of the WANTED ad: tear one off, take the address */
export function TearTabs({ count = 6 }: { count?: number }) {
  const [torn, setTorn] = useState<number[]>([]);
  const { copy, copied, failed } = useCopy(2600);
  return (
    <div className="mt-3 print:hidden">
      <p
        role="status"
        className="min-h-4 text-center font-mono text-[0.68rem] text-paper/80"
      >
        {copied
          ? "Taken: the address is on your clipboard."
          : failed
            ? profile.email
            : "tear one off ↓"}
      </p>
      {/* the tabs run to the ad's bottom edge; vertical text, so each tab is as tall as the address */}
      <div
        className="-mx-3 -mb-3 mt-2 flex border-t-2 border-dashed border-paper/60"
        data-qa="times-tabs"
      >
        {Array.from({ length: count }, (_, i) => {
          const gone = torn.includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={gone}
              onClick={() => {
                setTorn((t) => [...t, i]);
                void copy(profile.email);
              }}
              aria-label={
                gone ? "Taken" : `Tear off a tab: copy ${profile.email}`
              }
              className={`flex min-w-0 flex-1 justify-center border-r border-dashed border-paper/45 py-2.5 last:border-r-0 ${gone ? "translate-y-2 rotate-3 opacity-0 transition duration-300 ease-exit reduced:transition-none" : "hover:bg-paper/10"}`}
            >
              <span className="rotate-180 font-mono text-[0.6rem] leading-none whitespace-nowrap [writing-mode:vertical-rl]">
                {profile.email}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- the puzzle corner: a 4x4 sudoku, 2x2 boxes, solved by backtracking ---------------------- */
const GIVEN = [1, 2, 0, 4, 0, 4, 1, 0, 0, 1, 4, 0, 4, 0, 0, 1];
const fits = (g: number[], at: number, v: number) => {
  const r = Math.floor(at / 4);
  const c = at % 4;
  for (let i = 0; i < 4; i++) {
    if (g[r * 4 + i] === v || g[i * 4 + c] === v) return false;
  }
  const br = r - (r % 2);
  const bc = c - (c % 2);
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++)
      if (g[(br + i) * 4 + bc + j] === v) return false;
  return true;
};
function solve(start: number[]) {
  const g = [...start];
  let steps = 0;
  const go = (at: number): boolean => {
    if (at === 16) return true;
    if (g[at]) return go(at + 1);
    for (let v = 1; v <= 4; v++) {
      steps++;
      if (fits(g, at, v)) {
        g[at] = v;
        if (go(at + 1)) return true;
        g[at] = 0;
      }
    }
    return false;
  };
  go(0);
  return { grid: g, steps };
}

/** The squares that repeat a number in their row, column or 2x2 box. */
function clashes(g: number[]) {
  const bad = new Set<number>();
  for (let a = 0; a < 16; a++) {
    if (!g[a]) continue;
    for (let b = a + 1; b < 16; b++) {
      if (g[b] !== g[a]) continue;
      const [ra, ca, rb, cb] = [a >> 2, a & 3, b >> 2, b & 3];
      if (
        ra === rb ||
        ca === cb ||
        (ra >> 1 === rb >> 1 && ca >> 1 === cb >> 1)
      ) {
        bad.add(a);
        bad.add(b);
      }
    }
  }
  return bad;
}
const ROWS = [0, 1, 2, 3];
const PILL =
  "rounded-full border border-current px-3 py-0.5 font-mono text-[0.7rem] uppercase hover:bg-ink hover:text-paper print:hidden";

/**
 * His ask (2026-11-10, "I should be able to solve that"): the reader plays it. Tap (or Tab to) an
 * empty square, then a number on the pad beside the grid; on a keyboard 1-4 fill the focused square,
 * Backspace / Delete / 0 empty it, the arrows move between the open squares (one tab stop: the
 * grid is an ARIA grid with a roving tabindex). A number that repeats in its row, column or box
 * turns tangerine; a full grid with no repeat is solved (the squares go lime). "Solve it" still
 * fills it by backtracking (and says how many tries); "Clear" starts over.
 */
export function Puzzle() {
  const [grid, setGrid] = useState(GIVEN);
  const [sel, setSel] = useState<number | null>(null);
  /** tries, when the button solved it (0 while the reader plays) */
  const [auto, setAuto] = useState(0);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const bad = clashes(grid);
  const won = grid.every(Boolean) && bad.size === 0;
  const touched = grid.some((v, i) => v !== GIVEN[i]);
  const tabAt = sel ?? GIVEN.findIndex((v) => !v);
  const playing = !auto && !won;

  const put = (at: number, v: number) => {
    if (GIVEN[at] || auto) return;
    setGrid((g) => g.map((x, i) => (i === at ? v : x)));
  };
  const go = (from: number, dr: number, dc: number) => {
    let r = from >> 2;
    let c = from & 3;
    for (;;) {
      r += dr;
      c += dc;
      if (r < 0 || r > 3 || c < 0 || c > 3) return;
      const i = r * 4 + c;
      if (!GIVEN[i]) {
        setSel(i);
        cells.current[i]?.focus();
        return;
      }
    }
  };
  const onKey = (i: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const k = e.key;
    if (/^[1-4]$/.test(k)) put(i, Number(k));
    else if (k === "Backspace" || k === "Delete" || k === "0") put(i, 0);
    else if (k === "ArrowUp") go(i, -1, 0);
    else if (k === "ArrowDown") go(i, 1, 0);
    else if (k === "ArrowLeft") go(i, 0, -1);
    else if (k === "ArrowRight") go(i, 0, 1);
    else return;
    e.preventDefault();
  };
  const clear = () => {
    setGrid(GIVEN);
    setAuto(0);
    setSel(null);
  };
  const status = auto
    ? `backtracking: ${auto} tries`
    : won
      ? "Solved! Nicely done."
      : bad.size
        ? "Repeats in a row, column or box."
        : sel === null
          ? "Tap a square, then a number."
          : "Now a number, 1 to 4.";

  return (
    <div data-qa="times-puzzle" data-solved={won || undefined}>
      {/* the grid, and the number pad as a column beside it (as tall as the grid: it adds no row) */}
      <div className="flex items-stretch justify-center gap-2">
        <div
          role="grid"
          aria-label="A 4 by 4 sudoku"
          className="w-full max-w-[9.5rem] min-w-0 border-2 border-ink"
        >
          {ROWS.map((r) => (
            <div key={r} role="row" className="grid grid-cols-4">
              {ROWS.map((c) => {
                const i = r * 4 + c;
                const v = grid[i];
                const given = !!GIVEN[i];
                const clash = bad.has(i);
                return (
                  <span
                    key={c}
                    role="gridcell"
                    aria-selected={given ? undefined : sel === i}
                    className={`grid aspect-square place-items-center text-[1.05rem] transition-colors duration-300 reduced:transition-none ${c === 1 ? "border-r-2 border-r-ink" : c < 3 ? "border-r border-r-ink/35" : ""} ${r === 1 ? "border-b-2 border-b-ink" : r < 3 ? "border-b border-b-ink/35" : ""} ${won ? "bg-lime-soft" : clash ? "bg-tangerine-soft" : ""}`}
                  >
                    {given ? (
                      <span
                        className={`font-bold ${clash ? "text-tangerine-deep" : ""}`}
                      >
                        {v}
                      </span>
                    ) : auto ? (
                      <span className="text-blue-deep italic">{v}</span>
                    ) : (
                      <button
                        ref={(el) => {
                          cells.current[i] = el;
                        }}
                        type="button"
                        data-qa="times-cell"
                        tabIndex={i === tabAt ? 0 : -1}
                        aria-label={`Row ${r + 1}, column ${c + 1}: ${v || "empty"}${clash ? ", repeats" : ""}`}
                        onClick={() => setSel(i)}
                        onFocus={() => setSel(i)}
                        onKeyDown={onKey(i)}
                        className={`grid size-full place-items-center italic outline-none ${clash ? "text-tangerine-deep" : "text-blue-deep"} ${sel === i && !won ? "bg-blue-soft shadow-[inset_0_0_0_2px_var(--color-blue)]" : "hover:bg-ink/5"}`}
                      >
                        {v || ""}
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        {/* the number pad (a tap on a phone, a click on a desktop; keys work on the square itself);
          it keeps its place when the puzzle is done, so the grid does not jump */}
        <div
          role="group"
          aria-label="Numbers"
          aria-hidden={playing ? undefined : true}
          className={`flex w-7 shrink-0 flex-col gap-[3px] print:hidden ${playing ? "" : "invisible"}`}
        >
          {[1, 2, 3, 4, 0].map((d) => (
            <button
              key={d}
              type="button"
              data-qa={`times-pad-${d}`}
              disabled={!playing || sel === null}
              aria-label={d ? `Put ${d}` : "Empty the square"}
              onClick={() => sel !== null && put(sel, d)}
              className="grid min-h-0 flex-1 place-items-center border border-ink text-[0.9rem] font-semibold transition-colors duration-(--dur-feedback) hover:bg-ink hover:text-paper disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-ink"
            >
              {d || (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
      <p
        className="mt-1.5 text-center font-mono text-[0.68rem] leading-snug"
        role="status"
      >
        {status}
      </p>
      <div className="mt-1.5 flex items-center justify-center gap-2">
        {playing ? (
          <button
            type="button"
            data-qa="times-solve"
            onClick={() => {
              const s = solve(GIVEN);
              setGrid(s.grid);
              setAuto(s.steps);
              setSel(null);
            }}
            className={PILL}
          >
            Solve it
          </button>
        ) : null}
        {touched ? (
          <button
            type="button"
            data-qa="times-clear"
            onClick={clear}
            className={PILL}
          >
            {won && !auto ? "Play again" : "Clear"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
