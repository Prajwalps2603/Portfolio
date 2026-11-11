import { ArrowRight, Award, Check, Upload } from "@/components/icons";
import { awardShort, metric, stackOf, step } from "../data";
import { Box, Chip, Panel, TX, Txt, cx } from "../kit";
import type { TemplateProps } from "./types";

/**
 * SCAN (Brain Tumor Detection): an uploaded MRI scan, the CNN, and the prediction (tumour or
 * non-tumour) next to the model's real accuracy and training set. The scan is an authored,
 * stylised illustration and the shown result is a sample, not a diagnosis.
 */

export const scanStamp = "left-[35%] bottom-[6%] @max-md:left-[34%] @max-md:bottom-[5%] @2xl:left-auto @2xl:right-[6%]";

/** A stylised axial MRI slice (authored SVG, palette only, decorative). */
function MriSlice() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true" focusable="false" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="50" cy="51" rx="35" ry="41" className="fill-ash/25 stroke-fog" strokeWidth="2.4" />
      <ellipse cx="50" cy="51" rx="30" ry="36" className="fill-ash/35" />
      <path d="M50 16c-2 9 2 15 0 24s-2 15 0 24-2 14 0 22" className="stroke-ink/70" strokeWidth="1.6" />
      <path
        d="M27 35c4-3 8 1 6 5s4 7 0 10M24 52c5-2 8 3 4 6s3 8-1 11M33 74c3-4 8-2 9 1M38 24c3 3 0 7 4 9M73 35c-4-3-8 1-6 5s-4 7 0 10M76 52c-5-2-8 3-4 6s-3 8 1 11M67 74c-3-4-8-2-9 1M62 24c-3 3 0 7-4 9"
        className="stroke-fog/70"
        strokeWidth="1.3"
      />
      <path d="M44 46c-4 0-6 4-4 8 1 3 4 3 4 0zM56 46c4 0 6 4 4 8-1 3-4 3-4 0z" className="fill-ink/80" />
      <circle cx="66" cy="36" r="10" className="fill-paper/15" />
      <circle cx="66" cy="36" r="6.5" className="fill-paper/85" />
    </svg>
  );
}

const LAYERS = [
  { h: "h-[78%]", w: "w-[15%]" },
  { h: "h-[62%]", w: "w-[13%]" },
  { h: "h-[46%]", w: "w-[11%]" },
  { h: "h-[32%]", w: "w-[9%]" },
] as const;

export function ScanTemplate({ p }: TemplateProps) {
  const accuracy = metric(p, "accuracy");
  const images = metric(p, "MRI");
  const award = awardShort(p);
  const resultCap = step(p, 3, "Prediction shown").split(" ")[0] ?? "Prediction";
  const served = stackOf(p, /tensorflow|keras|flask/i);
  return (
    <div className="absolute inset-0 flex flex-col gap-2 p-3 @2xl:gap-3 @2xl:p-5">
      {/* the facts: training set and the award */}
      <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-1.5 @max-md:hidden">
        {images ? (
          <Chip id="train" tone="outline">
            trained on {images.value} {images.label}
          </Chip>
        ) : (
          <span />
        )}
        {award ? (
          <Chip id="award" tone="lime" icon={<Award />} mono={false} hl="lime">
            {award}
          </Chip>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[0.9fr_auto_0.85fr_auto_1.3fr] items-center gap-x-1.5 @md:grid-cols-[1fr_auto_0.62fr_auto_0.92fr_auto_1.1fr] @2xl:grid-cols-[1.25fr_auto_0.62fr_auto_0.92fr_auto_1.1fr] @2xl:gap-x-3">
      {/* 1. the uploaded scan */}
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        <Box id="mri" shape="rect" r={12} tone="ink" className="relative aspect-square w-full overflow-hidden rounded-panel bg-ink">
          <MriSlice />
          <Box id="mri-head" shape="circle" tone="pencil" className="absolute top-[10%] left-[15%] h-[82%] w-[70%] rounded-full" />
          <Box id="roi" shape="circle" tone="ink" className="absolute top-[24%] left-[54%] size-[24%] rounded-full border-2 border-tangerine" />
        </Box>
        <Txt id="mri-cap" className={cx(TX.uiSm, "flex max-w-full items-center justify-center gap-1 text-center leading-tight text-graphite")} hand="upload" handTone="ink" at="c">
          <Upload className="size-3 shrink-0 @max-md:hidden" />
          <span className="line-clamp-2">{step(p, 0, "Upload scan")}</span>
        </Txt>
      </div>

      <Box id="arrow-1" shape="arrow" from={[0.05, 0.6]} to={[0.95, 0.45]} bend={-0.3} className="grid h-5 w-4 place-items-center text-graphite @2xl:w-6 [&_svg]:size-4">
        <ArrowRight />
      </Box>

      {/* 1b. preprocess and resize (the same scan, smaller) */}
      <div className="hidden min-w-0 flex-col items-center gap-1.5 @md:flex">
        <Box id="resize" shape="rect" r={10} tone="pencil" className="relative aspect-square w-full rounded-panel border border-dashed border-line-strong">
          <Box id="resize-img" shape="rect" r={6} tone="ink" className="absolute bottom-0 left-0 size-[62%] overflow-hidden rounded-chip bg-ink">
            <MriSlice />
          </Box>
        </Box>
        <Txt id="resize-cap" className={cx(TX.uiSm, "line-clamp-2 max-w-full text-center leading-tight text-graphite")} hand="resize" handTone="ink" at="c">
          {step(p, 1, "Preprocess and resize")}
        </Txt>
      </div>

      <Box id="arrow-1b" shape="arrow" from={[0.05, 0.45]} to={[0.95, 0.55]} bend={0.25} className="hidden h-5 w-4 place-items-center text-graphite @md:grid @2xl:w-6 [&_svg]:size-4">
        <ArrowRight />
      </Box>

      {/* 2. the CNN */}
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        <Box id="cnn" shape="rect" r={12} tone="ink" className="relative flex aspect-square w-full items-center justify-center gap-[5%] rounded-panel border border-line bg-paper px-[8%]">
          {LAYERS.map((l, i) => (
            <Box key={i} id={`cnn-l${i}`} shape="rect" r={4} tone="pencil" className={cx("shrink-0 rounded-xs border border-blue/50 bg-blue-soft", l.h, l.w)} />
          ))}
          <span className="flex shrink-0 flex-col gap-[3px]">
            <Box id="cnn-o1" shape="circle" className="size-2 rounded-full bg-tangerine @2xl:size-2.5" />
            <Box id="cnn-o2" shape="circle" className="size-2 rounded-full bg-line-strong @2xl:size-2.5" />
          </span>
        </Box>
        <Txt id="cnn-cap" className={cx(TX.uiSm, "line-clamp-2 max-w-full text-center leading-tight text-graphite")} hand="CNN" handTone="ink" at="c">
          {step(p, 2, "CNN analyses")}
        </Txt>
      </div>

      <Box id="arrow-2" shape="arrow" from={[0.05, 0.45]} to={[0.95, 0.6]} bend={0.3} className="grid h-5 w-4 place-items-center text-graphite @2xl:w-6 [&_svg]:size-4">
        <ArrowRight />
      </Box>

      {/* 3. the prediction */}
      <Panel id="result" fill="card" className="flex min-w-0 flex-col gap-1 self-center p-2 @2xl:gap-1.5 @2xl:p-3">
        <Txt id="res-cap" className={cx(TX.cap, "text-graphite")} hand="result" handTone="ink">
          {resultCap}
        </Txt>
        <Box id="res-yes" shape="rect" r={8} tone="ink" hl="tangerine" className={cx(TX.uiSm, "flex items-center justify-between gap-1 rounded-chip bg-tangerine-soft px-1.5 py-1 text-ink")}>
          <span className="truncate">Tumour</span>
          <Check className="size-3 shrink-0" />
        </Box>
        <Box id="res-no" shape="rect" r={8} tone="pencil" className={cx(TX.uiSm, "truncate rounded-chip border border-line px-1.5 py-1 text-graphite")}>
          Non-tumour
        </Box>
        {accuracy ? (
          <span className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            <Txt id="res-acc" className="font-display text-h4 leading-none font-bold tracking-[-0.02em] text-ink" sketch="label" hand={accuracy.value} handTone="ink">
              {accuracy.value}
            </Txt>
            <Txt id="res-acc-l" className={cx(TX.data, "text-graphite @max-md:hidden")}>
              {accuracy.label}
            </Txt>
          </span>
        ) : null}
      </Panel>
      </div>

      {/* roomy: what serves it (the real stack) */}
      {served.length ? (
        <ul className="hidden shrink-0 flex-wrap items-center gap-1.5 @2xl:flex">
          {served.map((s) => (
            <li key={s}>
              <Chip id={`stack-${s.toLowerCase()}`} tone="outline">
                {s}
              </Chip>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
