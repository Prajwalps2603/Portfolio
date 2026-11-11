import { profile } from "@/content";
import { Led } from "@/components/ui";

/**
 * The factual route, Koppa to Sullia to Bengaluru, as one engraved rule with a tick at each
 * station and the place read out inline beneath it. No tiles, no dots, no connecting trace.
 */
export function Route() {
  const last = profile.route.length - 1;
  return (
    <ol aria-label="Route" className="grid gap-y-5 md:grid-cols-3 md:gap-x-6 md:gap-y-0 md:border-t-[1.5px] md:border-ink">
      {profile.route.map((s, i) => (
        <li
          key={s.place}
          className="relative border-t-[1.5px] border-ink pt-3 before:absolute before:top-0 before:left-0 before:h-2.5 before:w-[1.5px] before:bg-ink md:border-t-0"
        >
          <p className="type-readout flex items-center gap-2 font-semibold text-ink">
            {s.place}
            {i === last ? <Led state="on" color="currentColor" size={7} /> : null}
            <span className="font-medium text-ink-muted">{s.region}</span>
          </p>
          <p className="type-small mt-1.5">{s.chapter}</p>
          <p className="type-readout num mt-0.5 text-ink-muted">{s.years}</p>
        </li>
      ))}
    </ol>
  );
}
