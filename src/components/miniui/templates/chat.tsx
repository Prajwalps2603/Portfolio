import { Check, Database, Send, Sparkle } from "@/components/icons";
import { part, SAMPLE, step } from "../data";
import { Box, Chip, IconTile, Panel, TX, Txt, cx } from "../kit";
import type { TemplateProps } from "./types";

/**
 * DRONE INTELLIGENCE (his ask: the picture must show the drone concept, not blank lines). Left, the
 * rules assistant: a sample question about a flight, the answer (it restates DGCA's Drone Rules,
 * 2021), the real retrieval step (the flow's "Retrieve top 5" from ChromaDB) over the passages it
 * read, and the source. Right, the airspace check (the
 * project's compliance checker): a drawn map with a drone flying in the green zone beside an
 * airport's no-fly circle, and the verdict. The exchange, the passages and the map are illustrative
 * (SAMPLE); the model, store and step are the project's. Under 448px the passages, the composer
 * and the verdict's height go; under 416px the "Source" caption (the chip stays); under 400px the
 * answer keeps three lines; under 384px the model line goes and the answer keeps two.
 */

export const chatStamp = "right-[5%] bottom-[6%]";

/** A quadcopter seen from above (the drone), drawn at (x, y) in the map's 120 x 100 frame. */
function Drone({ x, y }: { x: number; y: number }) {
  const arm = 7;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d={`M${-arm} ${-arm}L${arm} ${arm}M${arm} ${-arm}L${-arm} ${arm}`}
        className="stroke-ink"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {[
        [-arm, -arm],
        [arm, -arm],
        [-arm, arm],
        [arm, arm],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={4.2}
          className="fill-card stroke-ink"
          strokeWidth={1.3}
        />
      ))}
      <rect
        x={-3.6}
        y={-3.6}
        width={7.2}
        height={7.2}
        rx={2}
        className="fill-ink"
      />
      <circle cx={0} cy={0} r={1.2} className="fill-lime" />
    </g>
  );
}

export function ChatTemplate({ p }: TemplateProps) {
  const retrieve = step(p, 2, "Retrieve top 5");
  const model = part(p, /gemini|gpt|openai|llm/i, "LLM");
  const store = part(p, /chroma|vector|pinecone|faiss/i, "Vector store");
  const D = SAMPLE.drone;
  return (
    <div className="absolute inset-0 grid grid-cols-[1.1fr_0.9fr] gap-3 p-3 @max-md:grid-cols-[1fr_0.86fr] @max-md:gap-2 @max-sm:grid-cols-[1.15fr_0.85fr] @2xl:gap-4 @2xl:p-5">
      {/* the rules assistant */}
      <div className="flex min-h-0 min-w-0 flex-col gap-2 @2xl:gap-3">
        <Box
          id="q"
          shape="rect"
          r={12}
          tone="ink"
          className="max-w-[94%] self-end rounded-panel rounded-br-xs bg-ink px-2.5 py-1.5 @2xl:px-3 @2xl:py-2"
        >
          <Txt
            id="q-text"
            className={cx(TX.uiSm, "block text-paper @2xl:text-label")}
            hand="ask in plain words"
            handTone="graphite"
          >
            {D.question}
          </Txt>
        </Box>
        <div className="flex min-h-0 min-w-0 flex-1 items-stretch gap-2">
          <IconTile
            id="ai"
            tone="lime"
            shape="circle"
            className="size-6 rounded-full @max-md:hidden @2xl:size-7"
          >
            <Sparkle />
          </IconTile>
          <Panel
            id="answer"
            fill="card"
            className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 overflow-hidden p-2.5 @2xl:gap-2 @2xl:p-3"
          >
            <Txt
              id="model"
              className={cx(TX.data, "text-graphite @max-sm:hidden")}
              hand="the answer"
              at="l"
              handTone="ink"
            >
              {model}
            </Txt>
            <Txt
              id="a-text"
              sketch="scribble"
              className={cx(
                TX.uiSm,
                "line-clamp-5 leading-[1.45] text-ink @max-md:line-clamp-4 @max-[25rem]:line-clamp-3 @max-sm:line-clamp-2 @2xl:text-label",
              )}
            >
              {D.answer}
            </Txt>
            {/* the retrieval step: the passages the answer was built from. A column that wraps: a
                passage that does not fit wraps into a second column, which is clipped, so only
                whole lines show (and the sketch twin skips the clipped ones) */}
            <span className="flex min-h-0 flex-1 flex-col flex-wrap content-start justify-end gap-x-6 gap-y-1 overflow-hidden pt-1 @max-md:hidden @2xl:gap-y-1.5">
              <Txt
                id="ret"
                className={cx(
                  TX.data,
                  "flex w-full min-w-0 items-center gap-1 text-graphite",
                )}
                hand="what it read"
                at="l"
                handTone="blue"
              >
                <Database className="size-3 shrink-0" />
                <span className="truncate">
                  {retrieve} · {store}
                </span>
              </Txt>
              {D.chunks.map((c, i) => (
                <span
                  key={c}
                  className="flex w-full min-w-0 items-center gap-1.5"
                >
                  <Chip
                    id={`ch-${i}`}
                    tone="outline"
                    className="h-4 px-1.5 @2xl:h-5"
                  >
                    {i + 1}
                  </Chip>
                  <Txt
                    id={`ch-${i}-t`}
                    sketch="scribble"
                    className={cx(TX.uiSm, "min-w-0 truncate text-ink")}
                  >
                    {c}
                  </Txt>
                </span>
              ))}
            </span>
            <span className="flex min-w-0 items-center gap-1.5 pt-1 @max-md:mt-auto">
              <Txt
                id="src-cap"
                className={cx(
                  TX.cap,
                  "shrink-0 text-graphite @max-[26rem]:hidden",
                )}
              >
                Source
              </Txt>
              <Chip
                id="src"
                tone="blue"
                hand="source"
                handTone="blue"
                className="max-w-full min-w-0 shrink!"
              >
                <span className="truncate">{D.source}</span>
              </Chip>
            </span>
          </Panel>
        </div>
        <Box
          id="composer"
          shape="pill"
          tone="ink"
          className="flex h-7 shrink-0 items-center justify-between gap-2 rounded-pill border border-line bg-card pr-0.5 pl-3 @max-md:hidden @2xl:h-9"
        >
          <Txt
            id="composer-ph"
            className={cx(TX.uiSm, "truncate text-graphite")}
          >
            {SAMPLE.ask}
          </Txt>
          <IconTile
            id="send"
            tone="blue"
            shape="circle"
            className="size-6 rounded-full @2xl:size-8"
          >
            <Send />
          </IconTile>
        </Box>
      </div>

      {/* the airspace check: the drone, the zones, the verdict */}
      <Panel
        id="airspace"
        fill="paper"
        className="flex min-h-0 min-w-0 flex-col gap-1.5 p-2 @2xl:gap-2 @2xl:p-3"
      >
        <Txt
          id="as-cap"
          className={cx(TX.cap, "truncate text-graphite")}
          hand="where it flies"
          at="l"
          handTone="ink"
        >
          Airspace<span className="@max-sm:hidden"> check</span>
        </Txt>
        <Box
          id="map"
          shape="rect"
          r={10}
          tone="ink"
          className="relative min-h-0 flex-1 overflow-hidden rounded-chip border border-line bg-lime-soft"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 120 100"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 size-full"
          >
            {/* a faint street grid */}
            <path
              d="M0 30h120M0 64h120M34 0v100M78 0v100"
              className="stroke-ink/10"
              strokeWidth={1}
            />
            {/* the airport: a red zone inside a yellow zone */}
            <circle
              cx={96}
              cy={22}
              r={36}
              className="fill-tangerine-soft stroke-tangerine/60"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={96}
              cy={22}
              r={17}
              className="fill-tangerine/80 stroke-tangerine-deep"
              strokeWidth={1}
            />
            {/* an aircraft, from above */}
            <path
              d="M96 12.5v19M87.5 23.5 96 20l8.5 3.5M91.5 30.5 96 28.5l4.5 2"
              className="stroke-ink"
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* the flight: from the take-off point to the drone, in the green zone */}
            <circle
              cx={24}
              cy={82}
              r={3}
              className="fill-card stroke-ink"
              strokeWidth={1.2}
            />
            <path
              d="M24 82C30 76 34 70 42 65"
              className="stroke-ink"
              strokeWidth={1.3}
              strokeDasharray="2.5 2.5"
              fill="none"
            />
            <circle cx={48} cy={60} r={13} className="fill-lime/50" />
            <Drone x={48} y={60} />
          </svg>
          {/* the sketch twin's marks: the no-fly zone and the drone */}
          <Box
            id="zone"
            shape="circle"
            className="absolute top-[4%] right-[-6%] h-[40%] w-[34%]"
          />
          <Box
            id="drone"
            shape="circle"
            hand="drone"
            at="b"
            handTone="ink"
            className="absolute top-[47%] left-[30%] h-[26%] w-[20%]"
          />
        </Box>
        <Box
          id="verdict"
          shape="pill"
          tone="ink"
          className="flex min-w-0 items-center gap-1.5 rounded-pill bg-lime px-2 py-1 @2xl:py-1.5"
        >
          <Check className="size-3.5 shrink-0 @max-sm:hidden" />
          <Txt id="verdict-t" className={cx(TX.uiSm, "truncate text-ink")}>
            {D.verdict}
            <span className="@max-md:hidden"> · {D.limit}</span>
          </Txt>
        </Box>
        <span className="flex min-w-0 items-center gap-2 @max-md:hidden">
          {[
            ["bg-tangerine", "red"],
            ["bg-tangerine-soft border border-tangerine/60", "yellow"],
            ["bg-lime-soft border border-ink/20", "green"],
          ].map(([sw, label]) => (
            <Txt
              key={label}
              id={`lg-${label}`}
              className={cx(TX.data, "flex items-center gap-1 text-graphite")}
            >
              <span
                aria-hidden="true"
                className={cx("inline-block size-2 shrink-0 rounded-full", sw)}
              />
              {label}
            </Txt>
          ))}
        </span>
      </Panel>
    </div>
  );
}
