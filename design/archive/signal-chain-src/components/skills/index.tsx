"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { practices, skillGroups, type SkillGroup } from "@/content";
import { Section, ChannelMark } from "@/components/ui";
import { channelForLayer } from "@/lib/channels";
import { useGSAP, gsap } from "@/lib/motion/gsap";
import { EASE, DUR, STAGGER } from "@/lib/motion/eases";
import { useMediaQuery, useReducedMotion } from "@/lib/motion/media";
import { safeStart } from "@/lib/motion/SplitReveal";
import { Readout } from "./Readout";

type Active = { group: string; skill: string };

const PREVIEW_DELAY = 90;

function groupColor(g: SkillGroup) {
  return channelForLayer(g.layer)?.color ?? "var(--color-bone)";
}

/**
 * 03 Stack: channel setup. A bill of materials grouped by layer. Every part is a control: hover,
 * focus or tap it and the readout names the projects and roles where it was used. No ratings.
 */
export function Stack() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const wide = useMediaQuery("(min-width: 1100px)");
  const first = skillGroups[0];
  const [active, setActive] = useState<Active>({
    group: first.id,
    skill: first.skills[0].name,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const select = useCallback(
    (a: Active) =>
      setActive((cur) =>
        cur.group === a.group && cur.skill === a.skill ? cur : a,
      ),
    [],
  );
  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const preview = (a: Active, e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    cancel();
    timer.current = setTimeout(() => select(a), PREVIEW_DELAY);
  };
  useEffect(() => cancel, [cancel]);

  const group = skillGroups.find((g) => g.id === active.group) ?? first;
  const skill =
    group.skills.find((s) => s.name === active.skill) ?? group.skills[0];
  const total = skillGroups.reduce((n, g) => n + g.skills.length, 0);

  // The authored moment: each group's rule draws from the left, then the parts rise.
  useGSAP(
    () => {
      const el = root.current;
      if (!el || reduced) return;
      const groups = gsap.utils.toArray<HTMLElement>("[data-group]", el);
      groups.forEach((g) => {
        const rule = g.querySelector<HTMLElement>("[data-rule]");
        const parts = gsap.utils.toArray<HTMLElement>("[data-part]", g);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: g,
            start: () => safeStart(g, "top 82%"),
            once: true,
            invalidateOnRefresh: true,
          },
        });
        if (rule)
          tl.from(
            rule,
            {
              scaleX: 0,
              transformOrigin: "left center",
              duration: 0.6,
              ease: EASE.beam,
            },
            0,
          );
        if (parts.length)
          tl.from(
            parts,
            {
              y: 12,
              autoAlpha: 0,
              duration: DUR.rise,
              ease: EASE.panel,
              stagger: STAGGER.bom,
            },
            0.12,
          );
      });
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <Section
      id="stack"
      surface="screen"
      labelledBy="stack-title"
      className="px-margin py-section"
    >
      <div ref={root}>
        <div className="max-w-[44ch] lg:max-w-none">
          <h2 id="stack-title" className="type-display">
            Stack
          </h2>
          <p className="type-lead mt-6 max-w-[44ch] text-muted">
            Every part is tied to something I shipped. Pick one to see the
            projects and roles where it ran.
            <span className="sr-only">
              {" "}
              {total} parts in {skillGroups.length} groups.
            </span>
          </p>
        </div>

        <div className="mt-16 grid gap-x-10 lg:grid-cols-10">
          <div className="lg:col-span-6">
            {skillGroups.map((g) => {
              const color = groupColor(g);
              const ch = channelForLayer(g.layer);
              const open = !wide && active.group === g.id;
              return (
                <div key={g.id} data-group className="relative py-6 sm:py-8">
                  <span
                    data-rule
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-px bg-graticule-strong"
                  />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {ch ? (
                      <ChannelMark ch={ch.id} />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="inline-block size-[18px] flex-none border border-bone"
                      />
                    )}
                    <h3 className="font-display text-lead font-bold [font-stretch:100%]">
                      {g.label}
                    </h3>
                    <span className="type-readout ml-auto text-dim">
                      <span className="num">{g.skills.length}</span> parts
                    </span>
                  </div>
                  <p className="type-small mt-2 max-w-[52ch] text-muted">
                    {g.description}
                  </p>
                  <ul
                    className="mt-5 flex flex-wrap gap-2"
                    aria-label={`${g.label} parts`}
                  >
                    {g.skills.map((s) => {
                      const on =
                        active.group === g.id && active.skill === s.name;
                      const a = { group: g.id, skill: s.name };
                      return (
                        <li key={s.name} data-part>
                          <button
                            type="button"
                            aria-pressed={on}
                            aria-controls={
                              wide ? "stack-readout" : `stack-readout-${g.id}`
                            }
                            onClick={() => select(a)}
                            onFocus={() => select(a)}
                            onPointerEnter={(e) => preview(a, e)}
                            onPointerLeave={cancel}
                            style={{ "--c": color } as CSSProperties}
                            className={`inline-flex min-h-10 items-center border px-3.5 py-2 text-left font-display text-small transition-colors duration-(--dur-hover) ease-panel coarse:min-h-11 ${
                              on
                                ? "border-bone bg-bone font-semibold text-ink"
                                : "border-graticule-strong text-muted hover:border-(--c) hover:text-bone"
                            }`}
                          >
                            {s.name}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {open ? (
                    <div className="mt-5">
                      <Readout
                        id={`stack-readout-${g.id}`}
                        group={group}
                        skill={skill}
                        color={color}
                        inline
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="relative py-6 sm:py-8">
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-graticule-strong"
              />
              <h3 className="font-display text-lead font-bold [font-stretch:100%]">
                How I work
              </h3>
              <ul className="type-small mt-3 grid gap-2 text-muted sm:grid-cols-2 sm:gap-x-8">
                {practices.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>

          {wide ? (
            <div className="lg:col-span-4">
              <div className="sticky top-[calc(var(--bar)+24px)]">
                <Readout
                  id="stack-readout"
                  group={group}
                  skill={skill}
                  color={groupColor(group)}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
