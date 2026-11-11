"use client";

import { useRef, useState, type ReactNode } from "react";
import type { Project } from "@/content";
import { systems } from "@/content/projects";
import { routes } from "@/lib/routes";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { EASE, DUR, STAGGER } from "@/lib/motion/eases";
import { useReducedMotion } from "@/lib/motion/media";
import { SampledText } from "@/lib/motion/sampled";
import { ChannelMark, ExternalLink, Led, Ruler } from "@/components/ui";
import { TransitionLink, usePageArrival } from "@/components/transition";
import { ArrowLeft, ArrowRight } from "@/components/icons";
import { Diagram } from "./Diagram";
import { Flow } from "./Flow";
import { layerChannel } from "./layers";
import { allFacts, scopeChannel } from "./system";

type DatasheetProps = {
  project: Project;
  prev: Project;
  next: Project;
};

function Row({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <section
      data-rise=""
      aria-labelledby={id}
      className="grid gap-x-[4vw] gap-y-5 border-b border-rule py-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-16"
    >
      <h2 id={id} className="type-title lg:pt-1 lg:text-[length:var(--text-lead)] lg:leading-snug">
        {title}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/**
 * /work/[slug]/: the datasheet. A bone sheet with the engraved ruler; everything comes from
 * the typed project record. Arrival from the bench (curtain): the title is sampled in and the
 * sections rise 18px with a 60ms stagger. Direct loads and back/forward: static.
 */
export function Datasheet({ project, prev, next }: DatasheetProps) {
  const ref = useRef<HTMLElement>(null);
  const { arrival, ready } = usePageArrival();
  const reduced = useReducedMotion();
  const enter = ready && arrival === "curtain";
  const [stage, setStage] = useState(-1);
  const system = systems[project.id];

  useGSAP(
    () => {
      if (!enter || reduced) return;
      const rows = gsap.utils.toArray<HTMLElement>("[data-rise]", ref.current);
      if (!rows.length) return;
      gsap.from(rows, {
        y: 18,
        autoAlpha: 0,
        duration: DUR.wipe,
        ease: EASE.out,
        stagger: STAGGER.sheet,
        delay: 0.2,
        clearProps: "transform,opacity,visibility",
      });
    },
    { scope: ref, dependencies: [enter, reduced], revertOnUpdate: true },
  );

  const channels = project.architecture.map((l) => layerChannel(l.layer));
  // Every fact of the record (the bench prints only its 3-4 key ones). The award is in the header.
  const figures = system ? allFacts(project, system).filter((f) => f.label !== "Award") : [];
  const pins = system?.connections.filter((c) => c.channel !== "sigma") ?? [];

  return (
    <article ref={ref} data-surface="sheet" aria-labelledby="ds-title" className="min-h-svh bg-bone pt-bar text-ink">
      <Ruler />
      <div className="mx-auto max-w-[1440px] px-margin pb-section">
        <header
          data-rise=""
          className="grid gap-x-12 gap-y-8 border-b border-rule py-16 md:grid-cols-[minmax(0,1fr)_auto] md:py-24"
        >
          <div>
            <SampledText
              as="h1"
              id="ds-title"
              play={enter}
              stepDuration={DUR.sheetStep}
              className="type-display max-w-[17ch]"
            >
              {project.title}
            </SampledText>
            <p className="type-lead measure mt-6 text-ink-muted">{project.tagline}</p>
          </div>
          <dl className="grid content-end gap-x-8 gap-y-5 text-ink md:max-w-[34ch]">
            <div>
              <dt className="type-label text-ink-muted">Kind</dt>
              <dd className="type-readout mt-2">{project.category}</dd>
            </div>
            <div>
              <dt className="type-label text-ink-muted">Layers</dt>
              <dd className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {channels.map((c) => (
                  <span key={c.key} className="type-readout inline-flex items-center gap-2">
                    <ChannelMark ch={c.id} surface="sheet" size={16} />
                    {c.id === "sigma" ? "Delivery" : c.label}
                  </span>
                ))}
              </dd>
            </div>
            {project.award ? (
              <div>
                <dt className="type-label text-ink-muted">Award</dt>
                <dd className="type-readout mt-2 flex items-start gap-2">
                  <Led state="on" color="var(--color-ink)" size={7} className="mt-[0.4em]" />
                  {project.award}
                </dd>
              </div>
            ) : null}
          </dl>
        </header>

        <Row id="ds-summary" title="Summary">
          <p className="type-lead measure">{project.summary}</p>
        </Row>

        {project.problem ? (
          <Row id="ds-problem" title="The problem">
            <p className="type-body measure">{project.problem}</p>
          </Row>
        ) : null}

        {project.approach ? (
          <Row id="ds-approach" title="The approach">
            <p className="type-body measure">{project.approach}</p>
          </Row>
        ) : null}

        {project.highlights.length ? (
          <Row id="ds-highlights" title="What it does">
            <ul className="md:columns-2 md:gap-x-[4vw]">
              {project.highlights.map((h) => (
                <li key={h} className="type-body break-inside-avoid border-t border-rule py-3.5">
                  {h}
                </li>
              ))}
            </ul>
          </Row>
        ) : null}

        {figures.length ? (
          <Row id="ds-figures" title="Facts">
            <table className="w-full max-w-[64ch] border-collapse text-left">
              <caption className="sr-only">Facts from the project record and its README</caption>
              <tbody>
                {figures.map((f) => (
                  <tr key={f.label} className="border-t border-rule last:border-b">
                    <th scope="row" className="type-small w-[40%] py-2.5 pr-4 align-baseline font-normal text-ink-muted first-letter:uppercase">
                      {f.label}
                    </th>
                    <td className="type-readout py-2.5 align-baseline">{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Row>
        ) : null}

        <Row id="ds-diagram" title="Block diagram and signal path">
          <Diagram project={project} stage={stage} />
          {project.flow?.length ? (
            <>
              <p className="type-body measure mt-10 text-ink-muted">
                The order a request takes through the system, as its README documents it.
              </p>
              <Flow
                steps={project.flow}
                label="Request path"
                className="mt-5"
                stage={stage}
                onStageChange={setStage}
                detail={(i) => {
                  const c = system?.connections.find((x) => x.id === system.stages[i]?.[0]);
                  return c ? `${c.label} (${c.protocol})` : undefined;
                }}
              />
            </>
          ) : null}
        </Row>

        {pins.length && system ? (
          <Row id="ds-pins" title="Connections">
            <table className="w-full border-collapse text-left">
              <caption className="type-body measure pb-4 text-left text-ink-muted">
                Every documented connection, with the README section that states it.{" "}
                <ExternalLink href={system.readme} className="link-mono" hint="opens the README in a new tab">
                  README
                </ExternalLink>
              </caption>
              <thead className="max-md:sr-only">
                <tr className="border-b border-ink">
                  <th scope="col" className="type-label w-12 py-2.5 pr-3 font-medium text-ink-muted">Ch</th>
                  <th scope="col" className="type-label w-[26%] py-2.5 pr-4 font-medium text-ink-muted">Connection</th>
                  <th scope="col" className="type-label w-[22%] py-2.5 pr-4 font-medium text-ink-muted">Carries</th>
                  <th scope="col" className="type-label py-2.5 font-medium text-ink-muted">What the README says</th>
                </tr>
              </thead>
              <tbody>
                {system.connections.map((c) => {
                  const ch = scopeChannel(c.channel);
                  return (
                    <tr key={c.id} className="border-b border-rule max-md:grid max-md:gap-y-1 max-md:py-4">
                      <td className="py-3 pr-3 align-baseline max-md:p-0">
                        <ChannelMark ch={ch.id} surface="sheet" size={16} />
                      </td>
                      <th scope="row" className="py-3 pr-4 text-left align-baseline font-normal max-md:p-0">
                        <span className="type-readout block">{c.label}</span>
                        <span className="type-readout block text-ink-muted">
                          {c.from} to {c.to}
                        </span>
                      </th>
                      <td className="type-readout py-3 pr-4 align-baseline max-md:p-0">
                        {c.protocol}
                        <span className="block text-ink-muted">{c.kind}</span>
                      </td>
                      <td className="py-3 align-baseline max-md:p-0 max-md:pt-1">
                        <span className="type-small block max-w-[52ch]">{c.note}</span>
                        <span className="type-small mt-1 block text-ink-muted">{c.source}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Row>
        ) : null}

        {system ? (
          <Row id="ds-whatif" title="Application note">
            <p className="type-lead measure">{system.whatIf.question}</p>
            <dl className="mt-5 max-w-[72ch]">
              {system.whatIf.options.map((o, i) => (
                <div key={o.id} className="grid gap-x-6 gap-y-1 border-t border-rule py-3 last:border-b sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
                  <dt className="type-readout">
                    {o.label}
                    {i === 0 ? <span className="text-ink-muted"> (base case)</span> : null}
                  </dt>
                  <dd className="type-small">{o.effect}</dd>
                </div>
              ))}
            </dl>
            <p className="type-small mt-4 text-ink-muted">
              Try it on the bench.{" "}
              <ExternalLink href={system.readme} className="link-mono" hint="opens the README in a new tab">
                {system.whatIf.source}
              </ExternalLink>
            </p>
          </Row>
        ) : null}

        <Row id="ds-stack" title="Stack">
          <ul className="flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <li key={s} className="type-readout border border-ink px-2.5 py-1.5">
                {s}
              </li>
            ))}
          </ul>
        </Row>

        <Row id="ds-source" title="Source">
          <div className="flex flex-wrap gap-2.5">
            {project.links.repo ? (
              <ExternalLink
                href={project.links.repo}
                className="btn btn-solid" data-cta="sheet-primary"
                hint={`opens the ${project.shortTitle} repository in a new tab`}
              >
                Repository
              </ExternalLink>
            ) : null}
            {project.links.live ? (
              <ExternalLink href={project.links.live} className="btn" hint={`opens the ${project.shortTitle} live demo in a new tab`}>
                Live demo
              </ExternalLink>
            ) : null}
            <TransitionLink href={routes.section("work")} className="btn">
              <ArrowLeft /> Back to the bench
            </TransitionLink>
          </div>
        </Row>

        <nav data-rise="" aria-label="Other systems" className="grid sm:grid-cols-2">
          {[
            { p: prev, label: "Previous system", dir: "prev" as const },
            { p: next, label: "Next system", dir: "next" as const },
          ].map(({ p, label, dir }) => (
            <TransitionLink
              key={dir}
              href={routes.work(p.id)}
              className={`block border-t border-ink py-6 transition-colors duration-200 ease-panel hover:bg-bone-shade sm:px-5 ${
                dir === "next" ? "sm:text-right" : ""
              }`}
              data-cursor-label={`Open ${p.shortTitle}`}
            >
              <span className={`type-label flex items-center gap-2 text-ink-muted ${dir === "next" ? "sm:justify-end" : ""}`}>
                {dir === "prev" ? <ArrowLeft /> : null}
                {label}
                {dir === "next" ? <ArrowRight /> : null}
              </span>
              <span className="type-title mt-2 block">{p.title}</span>
            </TransitionLink>
          ))}
        </nav>
      </div>
    </article>
  );
}
