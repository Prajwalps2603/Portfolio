import { Check, ChevronRight } from "@/components/icons";
import { SAMPLE, step } from "../data";
import { Box, Chip, IconTile, Panel, TX, Txt, cx } from "../kit";
import type { TemplateProps } from "./types";

/**
 * CALENDAR (BookMyVenue): a month of dates for one venue, booked and free (one booking per
 * venue per date), your chosen date, and the ticket you get once the advance is paid. The venue
 * and the dates are illustrative ("Venue A"); the steps come from the project's flow.
 */

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Illustrative month: starts on a Wednesday, 30 days. */
const OFFSET = 2;
const DAYS = 30;
const BOOKED = new Set([3, 6, 7, 11, 13, 14, 20, 21, 25, 27, 28]);
const CHOSEN = 18;
/** Barcode bar weights (deterministic). */
const BARCODE = [2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2, 1, 3];

export const calendarStamp = "right-[5%] bottom-[7%] @max-md:right-[4%] @max-md:bottom-[5%]";

export function CalendarTemplate({ p }: TemplateProps) {
  const cells = Array.from({ length: 35 }, (_, i) => {
    const day = i - OFFSET + 1;
    return day >= 1 && day <= DAYS ? day : null;
  });
  const chosenName = DAY_NAMES[(OFFSET + CHOSEN - 1) % 7];
  return (
    <div className="absolute inset-0 grid grid-cols-[1.18fr_0.82fr] gap-3 p-3 @2xl:gap-5 @2xl:p-5">
      {/* dates */}
      <Panel id="cal" fill="card" className="flex min-h-0 min-w-0 flex-col gap-1.5 p-2 @2xl:gap-2 @2xl:p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 flex-col">
            <Txt id="cal-venue" className={cx(TX.title, "truncate text-ink")} hand="pick a date" handTone="ink">
              {SAMPLE.venue}
            </Txt>
            <Txt id="cal-step" className={cx(TX.data, "truncate text-graphite @max-md:hidden")}>
              {step(p, 1, "Check dates")}
            </Txt>
          </span>
          <span className="flex shrink-0 gap-1">
            <IconTile id="cal-prev" tone="paper" className="size-5 @2xl:size-6">
              <ChevronRight className="rotate-180" />
            </IconTile>
            <IconTile id="cal-next" tone="paper" className="size-5 @2xl:size-6">
              <ChevronRight />
            </IconTile>
          </span>
        </div>
        <Box id="cal-week" shape="bar" className="grid grid-cols-7 gap-0.5">
          {WEEK.map((d, i) => (
            <span key={i} className={cx(TX.data, "text-center text-graphite")}>
              {d}
            </span>
          ))}
        </Box>
        <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-5 gap-0.5 @2xl:gap-1">
          {cells.map((day, i) => {
            if (day === null) return <span key={i} />;
            const booked = BOOKED.has(day);
            const chosen = day === CHOSEN;
            return (
              <Box
                key={i}
                id={`d${day}`}
                shape={chosen ? "circle" : booked ? "cross" : "dash"}
                tone={chosen ? "ink" : "pencil"}
                hl={chosen ? "blue" : undefined}
                className={cx(
                  TX.data,
                  "grid min-h-0 place-items-center rounded-xs tabular-nums",
                  chosen ? "bg-blue font-medium text-paper" : booked ? "bg-paper-2 text-graphite line-through decoration-graphite/60" : "bg-paper text-ink",
                )}
              >
                {day}
              </Box>
            );
          })}
        </div>
        <div className="flex items-center gap-2.5 @max-md:hidden">
          {[
            { id: "lg-free", label: "Free", cls: "bg-paper border border-line" },
            { id: "lg-booked", label: "Booked", cls: "bg-paper-2" },
            { id: "lg-you", label: "Your date", cls: "bg-blue" },
          ].map((l) => (
            <Txt key={l.id} id={l.id} className={cx(TX.data, "flex items-center gap-1 text-graphite")}>
              <span className={cx("size-2.5 rounded-xs", l.cls)} />
              {l.label}
            </Txt>
          ))}
        </div>
      </Panel>

      {/* the ticket */}
      <div className="flex min-h-0 min-w-0 flex-col justify-center gap-2 @2xl:gap-3">
        <Box id="ticket" shape="rect" r={14} tone="ink" hand="the ticket!" at="t" handTone="tangerine" className="relative flex min-w-0 flex-col rounded-panel border border-line bg-card">
          <div className="flex min-w-0 flex-col items-start gap-1 p-2.5 @2xl:gap-1.5 @2xl:p-3.5">
            <Chip id="tk-paid" tone="tangerine" icon={<Check />} hl="tangerine">
              Advance paid
            </Chip>
            <Txt id="tk-venue" className={cx(TX.title, "mt-0.5 truncate text-ink")}>
              {SAMPLE.venue}
            </Txt>
            <Txt id="tk-date" className={cx(TX.data, "text-graphite")}>
              {chosenName} {CHOSEN}
            </Txt>
          </div>
          <div className="relative mx-2.5 border-t border-dashed border-line-strong" aria-hidden="true">
            <span className="absolute -top-1.5 -left-[17px] size-3 rounded-full border border-line bg-card [clip-path:inset(0_0_0_50%)]" />
            <span className="absolute -top-1.5 -right-[17px] size-3 rounded-full border border-line bg-card [clip-path:inset(0_50%_0_0)]" />
          </div>
          <div className="flex min-w-0 items-end gap-2 p-2.5 @2xl:p-3.5">
            <Box id="tk-code" shape="scribble" className="flex h-6 min-w-0 flex-1 items-stretch gap-0.5 @2xl:h-8">
              {BARCODE.map((w, j) => (
                <span key={j} className="bg-ink" style={{ flexGrow: w, flexBasis: 0 }} />
              ))}
            </Box>
            <Txt id="tk-label" className={cx(TX.cap, "text-graphite @max-md:hidden")}>
              {step(p, 3, "Get ticket").replace(/^get\s+/i, "")}
            </Txt>
          </div>
        </Box>
        <Chip id="no-double" tone="outline" icon={<Check />} className="self-start @max-md:hidden">
          No double-booking
        </Chip>
      </div>
    </div>
  );
}
