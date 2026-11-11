import type { ReactNode } from "react";
import { Check, Database, FileText, Layers, Pencil, Search } from "@/components/icons";
import { part, SAMPLE, step } from "../data";
import { Box, Chip, IconTile, Panel, TX, Txt, cx } from "../kit";
import type { TemplateProps } from "./types";

/**
 * PIPELINE (MCP Job Agent): the agent's run as five stages (the project's flow: discover, parse
 * and gate, tailor the résumé, fill the form, log) with the current stage live, above the audit
 * log it writes to Google Sheets. Roles are placeholders; statuses use the README's vocabulary
 * (eligibility gate, review-only submission).
 */

const ICONS: Record<string, ReactNode> = {
  discover: <Search />,
  parse: <FileText />,
  tailor: <Pencil />,
  fill: <Layers />,
  log: <Database />,
};
const ICON_ORDER = ["discover", "parse", "tailor", "fill", "log"];
/** Handwritten names of the stages, for the sketch. */
const HAND = ["find", "parse", "tailor", "fill", "log"];

type Row = { job: string; gate: "pass" | "gated"; doc: string | null; status: string; tone: "blue" | "lime" | "outline" };

export const pipelineStamp = "right-[5%] bottom-[8%] @max-md:right-[5%] @max-md:bottom-[5%]";

export function PipelineTemplate({ p }: TemplateProps) {
  const flow = p?.flow?.length ? p.flow : ["Discover job", "Parse and gate", "Tailor résumé", "Fill the form", "Audit log"];
  const active = Math.min(flow.length - 1, 3);
  const sheet = part(p, /sheets/i, "Google Sheets");
  const rows: Row[] = [
    { job: SAMPLE.jobs[0], gate: "pass", doc: "resume.tex", status: "review-only", tone: "blue" },
    { job: SAMPLE.jobs[1], gate: "pass", doc: "resume.tex", status: "logged", tone: "lime" },
    { job: SAMPLE.jobs[2], gate: "gated", doc: null, status: "skipped", tone: "outline" },
    { job: SAMPLE.jobs[3], gate: "pass", doc: "resume.tex", status: "logged", tone: "lime" },
    { job: SAMPLE.jobs[4], gate: "pass", doc: "resume.tex", status: "logged", tone: "lime" },
  ];
  return (
    <div className="absolute inset-0 flex flex-col gap-2.5 p-3 @2xl:gap-4 @2xl:p-5">
      {/* the run */}
      <div className="relative grid shrink-0 gap-1" style={{ gridTemplateColumns: `repeat(${flow.length}, minmax(0, 1fr))` }}>
        <Box id="track" shape="bar" className="absolute top-3.5 right-[10%] left-[10%] h-0.5 rounded-pill bg-line-strong @max-md:top-3 @2xl:top-[18px]" />
        <Box id="track-done" shape="none" className="absolute top-3.5 left-[10%] h-0.5 rounded-pill bg-ink @max-md:top-3 @2xl:top-[18px]" style={{ width: `${(active / Math.max(1, flow.length - 1)) * 80}%` }} />
        {flow.map((s, i) => {
          const state = i < active ? "done" : i === active ? "active" : "todo";
          const key = ICON_ORDER[i] ?? "log";
          return (
            <div key={s} className="relative flex min-w-0 flex-col items-center gap-1 text-center @2xl:gap-1.5">
              <IconTile
                id={`st-${i}`}
                shape="circle"
                tone={state === "done" ? "lime" : state === "active" ? "blue" : "card"}
                className={cx("size-7 rounded-full @max-md:size-6 @2xl:size-9", state === "active" && "shadow-card outline-4 outline-blue-soft")}
              >
                {state === "done" ? <Check /> : ICONS[key]}
              </IconTile>
              <Txt id={`st-${i}-t`} className={cx(TX.uiSm, "line-clamp-2 max-w-full leading-tight @max-md:hidden", state === "todo" ? "text-graphite" : "text-ink")} hand={HAND[i]} at="c" handTone={state === "active" ? "blue" : "ink"}>
                {s}
              </Txt>
            </div>
          );
        })}
      </div>

      {/* compact: the stage names need more room, so name the live one */}
      <Txt id="st-now" className={cx(TX.uiSm, "-mt-1 hidden text-center text-ink @max-md:block")} hand={HAND[active]} at="c" handTone="blue">
        <span className="text-graphite">
          {active + 1}/{flow.length}
        </span>{" "}
        {flow[active]}
      </Txt>

      {/* the audit log */}
      <Panel id="log" fill="card" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-2.5 py-1.5 @2xl:px-3.5 @2xl:py-2">
          <Txt id="log-cap" className={cx(TX.cap, "text-ink")} hand="audit log" handTone="ink">
            {step(p, 4, "Audit log")}
          </Txt>
          <Chip id="log-sheet" tone="lime" mono={false} hl="lime">
            {sheet}
          </Chip>
        </div>
        <div className="grid min-h-0 grid-cols-[1fr_0.8fr_1.1fr_1.1fr] content-start items-center gap-x-2 gap-y-1.5 px-2.5 py-2 @max-md:grid-cols-[1fr_0.8fr_1.1fr] @2xl:gap-y-2 @2xl:px-3.5 @2xl:py-2.5">
          {["Job", "Gate", "Résumé", "Status"].map((h, i) => (
            <Txt key={h} id={`h-${i}`} className={cx(TX.cap, "truncate text-graphite", i === 2 && "@max-md:hidden")}>
              {h}
            </Txt>
          ))}
          {rows.map((r, i) => (
            <div key={r.job} className={i < 3 ? "contents" : i === 3 ? "hidden @xl:contents" : "hidden @2xl:contents"}>
              <Txt id={`r${i}-job`} className={cx(TX.uiSm, "truncate text-ink")}>
                {r.job}
              </Txt>
              <Txt id={`r${i}-gate`} className={cx(TX.data, "flex items-center gap-1 truncate", r.gate === "pass" ? "text-lime-deep" : "text-tangerine-deep")}>
                <span className={cx("size-1.5 shrink-0 rounded-full", r.gate === "pass" ? "bg-lime" : "bg-tangerine")} />
                {r.gate}
              </Txt>
              <Txt id={`r${i}-doc`} className={cx(TX.data, "truncate text-graphite @max-md:hidden")}>
                {r.doc ?? "—"}
              </Txt>
              <span className="min-w-0">
                <Chip id={`r${i}-st`} tone={r.tone} className="max-w-full">
                  {r.status}
                </Chip>
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
