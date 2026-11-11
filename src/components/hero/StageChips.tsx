import { SHIPPED_STEP, STAGES } from "./data";

/**
 * The build stages under the stage window: idea · sketch · ui · api · data · deploy · shipped.
 * One row when the row has room (container query on the parent), a 4 + 3 grid when it does not,
 * the natural wrap on phones: never an orphaned chip.
 * The current stage is lit (blue dot on a blue highlighter), finished stages get a tangerine
 * check; when the stamp lands every stage is checked and "shipped" gets the tangerine highlighter.
 * Pure colour / opacity feedback (also with reduced motion). Not a live region: it changes
 * every few hundred ms while a project builds.
 */
export function StageChips({ step }: { step: number }) {
  const shipped = step >= SHIPPED_STEP;
  return (
    <ol
      aria-label="Build stages"
      data-hero="chips"
      data-boot=""
      className="flex min-w-0 flex-1 flex-wrap items-center gap-x-px gap-y-1 @min-[24rem]:grid @min-[24rem]:grid-cols-[repeat(4,max-content)] @min-[35.5rem]:flex"
    >
      {STAGES.map((label, i) => {
        const state = shipped || i < step ? "done" : i === step ? "current" : "todo";
        const wash = state === "current" ? "bg-blue-soft" : shipped && i === SHIPPED_STEP ? "bg-tangerine-soft" : "bg-transparent";
        return (
          <li
            key={label}
            aria-current={state === "current" ? "step" : undefined}
            className={`type-mono inline-flex h-7 items-center gap-1 rounded-pill px-1.5 transition-colors duration-(--dur-ui) ease-arrive ${wash} ${state === "todo" ? "text-graphite" : "text-ink"}`}
          >
            <Mark state={state} />
            <span data-chip-label="">{label}</span>
            <span className="sr-only">{state === "done" ? " (done)" : state === "current" ? " (in progress)" : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Every mark sits in the same 14px box, so labels never shift as the stages change. */
function Mark({ state }: { state: "done" | "current" | "todo" }) {
  return (
    <span aria-hidden="true" className="grid size-3.5 shrink-0 place-items-center">
      {state === "done" ? (
        <span className="grid size-3.5 place-items-center rounded-full bg-tangerine text-ink">
          <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.6 6.3 4.9 8.5 9.4 3.6" />
          </svg>
        </span>
      ) : state === "current" ? (
        <span className="size-2.5 rounded-full bg-blue" />
      ) : (
        <span className="size-2.5 rounded-full border border-pencil" />
      )}
    </span>
  );
}
