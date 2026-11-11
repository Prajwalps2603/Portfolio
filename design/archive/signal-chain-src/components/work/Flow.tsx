"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight } from "@/components/icons";

type FlowProps = {
  steps: string[];
  /** Label above the path. */
  label?: string;
  /** Prefix for cursor readouts, e.g. "Probe". */
  probe?: string;
  /** Called with the selected stage (-1 = none) whenever it changes. */
  onStageChange?: (stage: number) => void;
  /** Stage selected from outside. */
  stage?: number;
  /** Extra text for the readout of a stage (e.g. the protocol that carries it). */
  detail?: (stage: number) => string | undefined;
  className?: string;
};

const STEP_MS = 650;

/**
 * The request path of a system on its datasheet: the documented flow as a numbered sequence of
 * stages joined by arrows. Every stage is a button (aria-pressed) that lights its wires in the
 * block diagram; "Trace request" walks the path stage by stage at a constant pace. Passed stages
 * keep a filled marker, the selected one is outlined in ink. State is shown by colour, fill and
 * border only, so it reads the same with reduced motion. Built for the bone sheet.
 */
export function Flow({ steps, label = "Request path", probe = "Light stage", onStageChange, stage, detail, className = "" }: FlowProps) {
  const [inner, setInner] = useState(-1);
  const step = stage ?? inner;
  const setStep = (n: number) => {
    setInner(n);
    onStageChange?.(n);
  };
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  };

  // A new system, a new path: reset.
  useEffect(() => {
    stop();
    setInner(-1);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);

  const trace = () => {
    stop();
    setRunning(true);
    let i = 0;
    setStep(0);
    timer.current = setInterval(() => {
      i += 1;
      if (i >= steps.length) {
        stop();
        return;
      }
      setStep(i);
    }, STEP_MS);
  };

  const extra = step >= 0 ? detail?.(step) : undefined;

  return (
    <div className={`mt-6 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <p className="type-label text-ink-muted">
          {label} <span className="num normal-case">({steps.length} stages)</span>
        </p>
        <div className="flex items-center gap-x-5">
          {step >= 0 ? (
            <button type="button" onClick={() => { stop(); setStep(-1); }} className="link-mono coarse:min-h-11">
              Clear
            </button>
          ) : null}
          <button
            type="button"
            onClick={trace}
            disabled={running}
            className="link-mono coarse:min-h-11 disabled:opacity-60"
            data-cursor-label="Trace request"
          >
            {running ? "Tracing" : "Trace request"}
          </button>
        </div>
      </div>

      <ol className="mt-4 grid grid-cols-1 gap-y-0 sm:grid-flow-col sm:auto-cols-fr">
        {steps.map((s, i) => {
          const passed = step >= 0 && i < step;
          const here = i === step;
          const last = i === steps.length - 1;
          return (
            <li key={`${s}-${i}`} className="flex min-w-0 flex-col sm:flex-row sm:items-stretch">
              <button
                type="button"
                aria-pressed={here}
                onClick={() => {
                  stop();
                  setStep(here ? -1 : i);
                }}
                data-cursor-label={`${probe} ${i + 1}`}
                className={`group grid min-h-14 w-full min-w-0 flex-1 grid-cols-[28px_minmax(0,1fr)] items-center gap-x-3 border px-3 py-2.5 text-left transition-[background-color,border-color,color] duration-200 ease-panel active:bg-rule ${
                  here
                    ? "border-ink bg-bone-shade text-ink ring-1 ring-ink ring-inset"
                    : passed
                      ? "border-ink text-ink hover:bg-bone-shade"
                      : "border-rule text-ink hover:border-ink hover:bg-bone-shade"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`type-readout grid size-7 place-items-center border transition-colors duration-200 ease-panel ${
                    here || passed ? "border-ink bg-ink text-bone" : "border-ink-muted text-ink-muted group-hover:border-ink group-hover:text-ink"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="type-small min-w-0 leading-snug">
                  <span className="sr-only">Stage {i + 1}: </span>
                  {s}
                </span>
              </button>
              {!last ? (
                <span aria-hidden="true" className={`type-small grid place-items-center sm:w-7 ${passed || here ? "text-ink" : "text-ink-muted"}`}>
                  <ArrowDown className="my-1 sm:hidden" />
                  <ArrowRight className="hidden sm:block" />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className="type-small mt-4 min-h-[3em] max-w-[70ch] text-ink-muted" aria-live="polite">
        {step < 0 ? (
          "Select a stage to light its wires in the diagram, or trace the whole request."
        ) : (
          <>
            <span className="type-readout mr-2 text-ink">
              Stage <span className="num">{step + 1}</span>/<span className="num">{steps.length}</span>
            </span>
            {steps[step]}
            {extra ? `, carried by ${extra}.` : "."}
          </>
        )}
      </p>
    </div>
  );
}
