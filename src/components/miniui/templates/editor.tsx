import { Download, FileText, Sparkle } from "@/components/icons";
import { metric, SAMPLE, step } from "../data";
import { Bar, Box, Btn, Chip, Panel, Segs, TX, Txt, cx, type BarTone } from "../kit";
import type { TemplateProps } from "./types";

/**
 * EDITOR (ResumAI): the job description on the left (keyword matches and gaps highlighted, the
 * "Diagnose gaps" step), the live split-screen A4 preview on the right with the synchronized
 * documents as tabs, the ATS-safe templates and "Export PDF". Copy is skeleton: illustrative.
 */

/** JD paragraphs of [width, tone] segments; lime = keyword match, tangerine = keyword gap. */
const JD: (readonly (readonly [string, BarTone])[])[][] = [
  [
    [["42%", "strong"]],
    [["46%", "line"], ["20%", "lime"], ["24%", "line"]],
    [["30%", "line"], ["40%", "line"], ["18%", "tangerine"]],
  ],
  [
    [["24%", "lime"], ["52%", "line"]],
    [["58%", "line"], ["22%", "line"]],
    [["36%", "line"], ["18%", "tangerine"], ["28%", "line"]],
  ],
  [
    [["50%", "line"], ["26%", "lime"]],
    [["40%", "line"], ["34%", "line"]],
  ],
  [
    [["28%", "line"], ["44%", "line"]],
    [["34%", "line"], ["20%", "tangerine"], ["22%", "line"]],
    [["46%", "line"]],
  ],
];

export const editorStamp = "right-[6%] top-[52%] @max-md:top-auto @max-md:right-[34%] @max-md:bottom-[20%]";

/**
 * "ATS-safe templates" -> ["ATS-safe", " templates"]. The swatches already picture the noun, so a
 * tight row keeps the qualifier and spells the noun out only when there is room. A label that does
 * not end in "template(s)" stays whole (and then shows only in roomy windows).
 */
function splitTemplatesLabel(label: string): readonly [head: string, tail: string] {
  const text = label.trim();
  const m = /^(.*\S)(\s+templates?)$/i.exec(text);
  return m ? [m[1], m[2]] : [text, ""];
}

export function EditorTemplate({ p }: TemplateProps) {
  const templates = metric(p, "templates");
  const count = Math.min(8, Math.max(0, Number(templates?.value ?? 0) || 0));
  const [tplHead, tplTail] = splitTemplatesLabel(templates?.label ?? "");
  return (
    <div className="absolute inset-0 grid grid-cols-[0.9fr_1fr] gap-3 p-3 @2xl:gap-4 @2xl:p-5">
      {/* job description */}
      <div className="flex min-h-0 min-w-0 flex-col gap-2 @2xl:gap-2.5">
        <Txt id="jd-cap" className={cx(TX.cap, "flex h-6 items-center gap-1.5 text-graphite @2xl:h-7")} hand="the job" at="l">
          <FileText className="size-3.5 shrink-0" />
          <span className="truncate">{step(p, 0, "Job description")}</span>
        </Txt>
        <Panel id="jd" fill="card" className="flex min-h-0 flex-1 flex-col justify-start gap-3 overflow-hidden p-2.5 @2xl:gap-4 @2xl:p-3.5">
          {JD.map((para, i) => (
            <span key={i} className={cx("flex flex-col gap-2 @2xl:gap-2.5", i === 2 && "@max-md:hidden", i === 3 && "hidden @2xl:flex")}>
              {para.map((segs, j) => (
                <Segs key={j} id={`jd-p${i}-${j}`} segs={segs} />
              ))}
            </span>
          ))}
          <span className="mt-auto flex items-center gap-2.5 @max-md:hidden">
            <Txt id="jd-match" className={cx(TX.data, "flex items-center gap-1 text-graphite")} sketch="none">
              <span className="size-2 shrink-0 rounded-full bg-lime" />
              keyword match
            </Txt>
            <Txt id="jd-gap" className={cx(TX.data, "flex items-center gap-1 text-graphite")} sketch="none">
              <span className="size-2 shrink-0 rounded-full bg-tangerine" />
              gap
            </Txt>
          </span>
        </Panel>
        <Chip id="jd-diag" tone="blue" icon={<Sparkle />} hl="blue" className="self-start">
          {step(p, 1, "Diagnose gaps")}
        </Chip>
      </div>

      {/* split-screen studio: A4 preview */}
      <div className="flex min-h-0 min-w-0 flex-col gap-2 @2xl:gap-2.5">
        <div className="flex items-center gap-1 self-start rounded-pill bg-paper-2 p-0.5 @max-md:hidden">
          <Chip id="tab-resume" tone="ink" mono={false} hand="résumé" handTone="ink">
            Résumé
          </Chip>
          <Chip id="tab-cover" tone="outline" mono={false} className="border-transparent" hand="letter">
            Cover letter
          </Chip>
          <Chip id="tab-pitch" tone="outline" mono={false} className="border-transparent @max-md:hidden" hand="outreach">
            Outreach
          </Chip>
        </div>
        <Box id="studio" shape="none" className="relative flex min-h-0 flex-1 items-center justify-center rounded-panel bg-paper-2 p-2 @2xl:p-3">
          <Box id="a4" shape="rect" r={4} tone="ink" className="flex aspect-[1/1.414] h-full max-w-full flex-col gap-1.5 rounded-xs bg-card px-[9%] py-[8%] shadow-card @2xl:gap-2">
            <Bar id="a4-name" w="62%" tone="ink" thick />
            <Bar id="a4-sub" w="44%" tone="strong" />
            <Box id="a4-rule" shape="bar" className="my-0.5 h-0.5 w-full rounded-pill bg-lime" />
            <Txt id="a4-exp" className={cx(TX.cap, "text-ink")}>
              {SAMPLE.resumeSections[0]}
            </Txt>
            <Bar id="a4-e1" w="92%" />
            <Bar id="a4-e2" w="84%" />
            <Bar id="a4-e3" w="70%" className="@max-md:hidden" />
            <Txt id="a4-skills" className={cx(TX.cap, "mt-0.5 text-ink @max-md:hidden")}>
              {SAMPLE.resumeSections[1]}
            </Txt>
            <span className="flex gap-1 @max-md:hidden">
              <Bar id="a4-s1" w="26%" tone="lime-soft" thick />
              <Bar id="a4-s2" w="22%" tone="lime-soft" thick />
              <Bar id="a4-s3" w="30%" tone="lime-soft" thick />
            </span>
          </Box>
        </Box>
        {/* The template strip + its label never ellipsize: the label is disclosed in steps
            (measured on the bottom row): < @md the strip goes, @md swatches only, @xl the
            qualifier ("ATS-safe"), @3xl the whole label. `truncate` is only a guard for a much
            longer label in content; Export (Btn) and the swatches never shrink. */}
        <div className="flex items-center justify-between gap-2 @max-md:justify-end">
          {count > 0 ? (
            <Box id="tpl" shape="none" className="flex min-w-0 items-center gap-1.5 @max-md:hidden">
              <span className="flex shrink-0 gap-1">
                {Array.from({ length: count }, (_, i) => (
                  <Box key={i} as="span" id={`tpl-${i}`} shape="rect" r={3} tone="pencil" className={cx("h-3.5 w-2.5 @2xl:h-4 @2xl:w-3", i === 0 ? "bg-ink" : "border border-line-strong bg-card")} />
                ))}
              </span>
              {tplHead ? (
                <Txt id="tpl-label" className={cx(TX.data, "hidden min-w-0 truncate text-graphite", tplTail ? "@xl:block" : "@3xl:block")}>
                  {tplHead}
                  {tplTail ? <span className="hidden @3xl:inline">{tplTail}</span> : null}
                </Txt>
              ) : null}
            </Box>
          ) : null}
          <Btn id="export" tone="ink" icon={<Download />} hand="export" hl="lime">
            {step(p, 3, "Export PDF")}
          </Btn>
        </div>
      </div>

      {/* sketch-only note: JD -> documents */}
      <Box id="tailor-arrow" shape="arrow" from={[0, 0.2]} to={[1, 0.75]} bend={-0.25} className="pointer-events-none absolute top-[40%] left-[47.5%] h-[16%] w-[9%] @max-md:hidden" hand="tailor" at="t" handTone="blue" />
    </div>
  );
}
