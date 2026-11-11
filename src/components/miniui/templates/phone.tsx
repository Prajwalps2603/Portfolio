import { Chat, Check, Play } from "@/components/icons";
import { namesIn, SAMPLE } from "../data";
import { Box, Chip, IconTile, Panel, TX, Txt, cx } from "../kit";
import type { TemplateProps } from "./types";

/**
 * AUDIFY AI (his ask: transcription is the main thing, not the audio). The phone shows one recorded
 * call being transcribed: a small player, then the conversation as it is written out, speaker by
 * speaker (diarization), the last line still being typed. Beside it the project's real parts: the
 * speech-to-text provider picked in Settings among the others (from its highlights), where the run
 * is in its own flow, and the call's summary landing as a row in Google Sheets. The call, its lines
 * and the summary are illustrative (SAMPLE). It transcribes recordings after the call, so nothing
 * here says "live". Under 448px the providers go and the sheet shows one row (contact, summary on
 * two lines); under 384px the flow keeps its step name and the sheet's caption shortens.
 */

/** A deterministic waveform (percent heights), shortened: the player is small. */
const WAVE = [
  34, 58, 42, 76, 52, 88, 64, 40, 72, 96, 60, 44, 70, 54, 82, 48, 36, 62,
];
const PLAYED = 11;
/** Empty rows under the call's row (as many as fit): it reads as a sheet, and no row is made up. */
const EMPTY_ROWS = 4;

export const phoneStamp =
  "left-[7%] bottom-[8%] @max-md:right-[4%] @max-md:bottom-[9%] @max-md:left-auto";

export function PhoneTemplate({ p }: TemplateProps) {
  const flow = p?.flow?.length
    ? p.flow
    : [
        "Discover recording",
        "Match call log",
        "Back up to Drive",
        "Transcribe",
        "Sync to Sheets",
      ];
  const activeStep = Math.max(
    0,
    flow.findIndex((s) => /transcrib/i.test(s)),
  );
  const found = namesIn(
    p,
    /Google Cloud STT v2|OpenAI Whisper|Deepgram Nova-2|AssemblyAI/,
  );
  const providers = found.length ? found : ["Speech-to-text"];
  const call = SAMPLE.calls[1];
  const lines = SAMPLE.transcript;
  const speakers = new Set(lines.map((l) => l.who)).size;
  return (
    <div className="absolute inset-0 grid grid-cols-[1fr_0.92fr] gap-3 px-3 pt-3 @max-md:grid-cols-[1.1fr_0.9fr] @max-md:gap-2.5 @2xl:gap-5 @2xl:px-5 @2xl:pt-5">
      {/* the phone: one call, transcribed */}
      <div className="relative min-h-0 min-w-0">
        <Box
          id="phone"
          shape="rect"
          r={26}
          tone="ink"
          className="absolute inset-x-[2%] top-0 h-[132%] rounded-card bg-ink p-1.5 shadow-card @max-md:inset-x-0 @2xl:inset-x-[6%] @2xl:p-2"
        >
          <div className="flex h-full flex-col gap-1.5 overflow-hidden rounded-window bg-card px-2 @2xl:gap-2 @2xl:px-2.5">
            <span className="mx-auto mt-1.5 h-1 w-8 shrink-0 rounded-pill bg-ink/85" />
            <div className="flex min-w-0 items-center justify-between gap-2 pt-0.5">
              <span className="flex min-w-0 flex-col">
                <Txt
                  id="ph-title"
                  className={cx(TX.title, "truncate text-ink")}
                  hand="transcript"
                  handTone="ink"
                >
                  Transcript
                </Txt>
                <Txt
                  id="ph-meta"
                  className={cx(TX.data, "truncate text-graphite")}
                >
                  {call.name} · {call.time}
                </Txt>
              </span>
              <Chip
                id="ph-spk"
                tone="blue"
                icon={<Chat />}
                className="@max-md:hidden"
              >
                {speakers} speakers
              </Chip>
            </div>
            {/* the player, small: the words matter more */}
            <Box
              id="player"
              shape="pill"
              tone="ink"
              className="flex shrink-0 items-center gap-1.5 rounded-pill bg-paper-2 py-1 pr-2 pl-1"
            >
              <IconTile
                id="play"
                tone="ink"
                shape="circle"
                className="size-5 rounded-full @2xl:size-6"
              >
                <Play />
              </IconTile>
              <span className="flex h-3.5 min-w-0 flex-1 items-center gap-0.5 @2xl:h-4">
                {WAVE.map((h, j) => (
                  <span
                    key={j}
                    className={cx(
                      "min-w-0 flex-1 rounded-pill",
                      j < PLAYED ? "bg-blue" : "bg-line-strong",
                    )}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </span>
            </Box>
            {/* the transcript: who said what, as it is written out */}
            <div className="flex min-h-0 min-w-0 flex-col gap-1.5 @2xl:gap-2">
              {lines.map((l, i) => {
                const two = l.who.endsWith("2");
                const last = i === lines.length - 1;
                return (
                  <Box
                    key={i}
                    id={`ln-${i}`}
                    shape="rect"
                    r={10}
                    tone={two ? "ink" : "pencil"}
                    hand={i === 0 ? "who said what" : undefined}
                    at="tl"
                    handTone="blue"
                    className={cx(
                      "flex max-w-[94%] min-w-0 flex-col gap-0.5 rounded-chip px-2 py-1.5",
                      two ? "self-end bg-blue-soft" : "self-start bg-paper-2",
                    )}
                  >
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        className={cx(
                          "font-mono text-micro leading-none font-semibold @2xl:text-label",
                          two ? "text-blue-deep" : "text-lime-deep",
                        )}
                      >
                        {l.who}
                      </span>
                      <span className="font-mono text-micro leading-none text-graphite @2xl:text-label">
                        {l.at}
                      </span>
                    </span>
                    <Txt
                      id={`ln-${i}-t`}
                      sketch="scribble"
                      className={cx(
                        TX.uiSm,
                        "leading-[1.4] text-ink",
                        last &&
                          "after:ml-0.5 after:inline-block after:h-[0.95em] after:w-[1.5px] after:translate-y-[0.12em] after:bg-blue after:content-['']",
                      )}
                    >
                      {l.text}
                    </Txt>
                  </Box>
                );
              })}
            </div>
          </div>
        </Box>
      </div>

      {/* the project's own parts: the provider, the flow, the summary in Sheets */}
      <div className="flex min-h-0 min-w-0 flex-col gap-2 pb-3 @max-sm:gap-1.5 @2xl:gap-2.5 @2xl:pb-5">
        <Panel
          id="stt"
          fill="paper"
          className="flex min-w-0 flex-col gap-1.5 p-2 @max-md:hidden @2xl:p-2.5"
        >
          <Txt
            id="stt-cap"
            className={cx(TX.cap, "truncate text-graphite")}
            hand="speech to text"
            handTone="ink"
          >
            Speech-to-text
          </Txt>
          <span className="flex min-w-0 flex-wrap gap-1">
            {providers.map((name, i) => (
              <Chip
                key={name}
                id={`stt-${i}`}
                tone={i === 0 ? "ink" : "outline"}
                mono={false}
                icon={i === 0 ? <Check /> : undefined}
                className="max-w-full min-w-0 shrink!"
              >
                <span className="truncate">{name}</span>
              </Chip>
            ))}
          </span>
        </Panel>
        <Panel
          id="flow"
          fill="paper"
          className="flex min-w-0 flex-col gap-1.5 p-2 @max-sm:gap-1 @max-sm:p-1.5 @2xl:p-2.5"
        >
          <span className="flex items-center gap-1">
            {flow.map((s, i) => (
              <Box
                key={s}
                id={`fl-${i}`}
                shape={i < activeStep ? "check" : "circle"}
                tone={i > activeStep ? "pencil" : "ink"}
                className={cx(
                  "grid size-3.5 shrink-0 place-items-center rounded-full [&_svg]:size-2.5 @2xl:size-4",
                  i < activeStep && "bg-lime text-ink",
                  i === activeStep && "border-2 border-blue bg-card",
                  i > activeStep && "border border-line-strong bg-card",
                )}
              >
                {i < activeStep ? <Check /> : null}
              </Box>
            ))}
          </span>
          <Txt
            id="fl-now"
            className={cx(TX.uiSm, "truncate text-ink")}
            hand="transcribing"
            handTone="blue"
          >
            {flow[activeStep]}
            <span className="text-graphite @max-sm:hidden">
              {" "}
              · step {activeStep + 1} of {flow.length}
            </span>
          </Txt>
        </Panel>
        <Panel
          id="sheet"
          fill="card"
          className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 p-2 @max-sm:p-1.5 @2xl:p-2.5"
        >
          <Txt
            id="sheet-cap"
            className={cx(TX.cap, "shrink-0 truncate text-graphite")}
            hand="into the sheet"
            handTone="ink"
          >
            <span className="@max-sm:hidden">{flow[flow.length - 1]}</span>
            <span className="hidden @max-sm:inline">Sheets</span>
          </Txt>
          {/* the sheet: header, the call's row, then empty rows (roomy); small windows stack the row
              to its summary, which wraps */}
          <span className="grid min-h-0 flex-1 auto-rows-min grid-cols-[auto_auto_minmax(0,1fr)] content-start overflow-hidden rounded-[6px] border border-line font-mono text-micro leading-tight @max-md:grid-cols-[auto_minmax(0,1fr)] @2xl:text-label">
            {["Contact", "Time", "Summary"].map((h, i) => (
              <span
                key={h}
                className={cx(
                  "border-b border-line bg-paper-2 px-1.5 py-1 font-semibold text-graphite @max-md:hidden",
                )}
              >
                {h}
              </span>
            ))}
            <Txt
              id="sheet-c"
              className="border-b border-line px-1.5 py-1 text-ink"
            >
              {call.name.slice(-1)}
            </Txt>
            <Txt
              id="sheet-t"
              className="border-b border-line px-1.5 py-1 text-ink tabular-nums @max-md:hidden"
            >
              {call.time}
            </Txt>
            <Txt
              id="sheet-s"
              className="min-w-0 border-b border-line bg-lime-soft px-1.5 py-1 text-ink"
            >
              {/* the clamp sits inside the padding, so no third line peeks through it */}
              <span className="block truncate @max-md:line-clamp-2 @max-md:whitespace-normal">
                {SAMPLE.summary}
              </span>
            </Txt>
            {Array.from({ length: EMPTY_ROWS * 3 }, (_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="h-5 border-b border-line/70 @2xl:h-6"
              />
            ))}
          </span>
        </Panel>
      </div>
    </div>
  );
}
