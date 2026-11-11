import { Check } from "@/components/icons";
import { Bar, Box, Chip, Panel, TX, Txt, cx } from "../kit";
import type { TemplateProps } from "./types";

/**
 * GENERIC (any other project id): the project's title and category over its real flow as a
 * checklist. Keeps MiniUI safe to call with an archive project; the six featured projects have
 * their own templates.
 */

export const genericStamp = "right-[6%] bottom-[8%]";

export function GenericTemplate({ p }: TemplateProps) {
  const flow = p?.flow?.length ? p.flow.slice(0, 5) : [];
  const stack = (p?.stack ?? []).slice(0, 4);
  return (
    <div className="absolute inset-0 flex flex-col gap-2.5 p-3 @2xl:gap-3 @2xl:p-5">
      <span className="flex min-w-0 flex-col gap-0.5">
        <Txt id="g-title" className={cx(TX.title, "truncate text-ink")} hand={p?.shortTitle ?? "the idea"} handTone="ink">
          {p?.shortTitle ?? "Project"}
        </Txt>
        {p?.category ? (
          <Txt id="g-cat" className={cx(TX.data, "truncate text-graphite")}>
            {p.category}
          </Txt>
        ) : null}
      </span>
      <Panel id="g-panel" fill="card" className="flex min-h-0 flex-1 flex-col gap-1.5 p-2.5 @2xl:p-3.5">
        {flow.length ? (
          flow.map((s, i) => (
            <span key={s} className="flex min-w-0 items-center gap-2">
              <Box id={`g-s${i}-i`} shape="check" className="grid size-4 shrink-0 place-items-center rounded-full bg-lime text-ink [&_svg]:size-2.5">
                <Check />
              </Box>
              <Txt id={`g-s${i}`} className={cx(TX.uiSm, "truncate text-ink")}>
                {s}
              </Txt>
            </span>
          ))
        ) : (
          <>
            <Bar id="g-b1" w="80%" />
            <Bar id="g-b2" w="64%" />
            <Bar id="g-b3" w="72%" />
          </>
        )}
        {stack.length ? (
          <span className="mt-auto flex flex-wrap gap-1.5">
            {stack.map((s) => (
              <Chip key={s} id={`g-t-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} tone="outline">
                {s}
              </Chip>
            ))}
          </span>
        ) : null}
      </Panel>
    </div>
  );
}
