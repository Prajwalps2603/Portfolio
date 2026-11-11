/**
 * The seed shelf (the /garden page): one seed packet per public repository (from GitHub, via
 * src/content/garden.json), newest first. On each packet: the plant its main language grows
 * (TypeScript a cornflower, JavaScript a marigold, HTML a tomato, CSS lavender, notebooks a fern,
 * no language yet a seedling), the repo's name, language and the month it was sown, its GitHub
 * description, and links to it (and to its case study, for the featured projects).
 */
import type { ReactNode } from "react";
import { garden, monthYear, type GardenRepo } from "@/content/garden";
import { featuredProjects } from "@/content";
import { routes } from "@/lib/routes";
import { ExternalLink } from "@/components/ui";
import { TransitionLink } from "@/components/transition";
import { SPECIES_NAME, speciesOf, type Species } from "./gardenArt";

const TINT: Record<Species, string> = {
  cornflower: "bg-blue-soft",
  marigold: "bg-tangerine-soft",
  tomato: "bg-tangerine-soft",
  lavender: "bg-blue-soft",
  fern: "bg-lime-soft",
  sprout: "bg-lime-soft",
};

const caseStudyOf = (repo: GardenRepo) =>
  featuredProjects.find(
    (p) =>
      p.links.repo?.toLowerCase().replace(/\/+$/, "") ===
      repo.url.toLowerCase(),
  );

export function SeedShelf() {
  return (
    <ul
      data-qa="seed-shelf"
      className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4"
    >
      {garden.repos.map((r) => {
        const species = speciesOf(r.language);
        const study = caseStudyOf(r);
        return (
          <li
            key={r.name}
            className="flex flex-col overflow-hidden rounded-b-[12px] border border-line-strong bg-card"
          >
            {/* the crimped seal */}
            <svg
              aria-hidden="true"
              viewBox="0 0 120 8"
              preserveAspectRatio="none"
              className="block h-2.5 w-full"
              fill="none"
            >
              <path
                d={`M0 8${Array.from({ length: 20 }, (_, k) => `L${k * 6 + 3} 1L${k * 6 + 6} 8`).join("")}`}
                strokeWidth={1.2}
                vectorEffect="non-scaling-stroke"
                className="stroke-graphite"
              />
            </svg>
            <div
              className={`relative mx-2.5 mt-1.5 grid h-24 place-items-center rounded-[8px] ${TINT[species]}`}
            >
              <SpeciesArt species={species} />
              <span
                aria-hidden="true"
                className="type-hand-sm absolute bottom-1 left-2.5 leading-none text-graphite"
              >
                {SPECIES_NAME[species]}
              </span>
            </div>
            <div className="flex flex-1 flex-col px-3.5 pt-3 pb-3.5">
              <h3 className="type-ui font-semibold break-words">
                {r.name.replace(/[-_]/g, " ")}
              </h3>
              <p className="type-micro mt-1 text-graphite">
                {r.language ?? "No language yet"} · sown {monthYear(r.created)}
              </p>
              <p className="type-small mt-2 line-clamp-3 flex-1 text-graphite">
                {r.description ?? "No description on GitHub yet."}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                <ExternalLink
                  href={r.url}
                  hint="the repository on GitHub, opens in a new tab"
                  data-cursor="blue"
                  className="type-ui text-blue-deep underline decoration-blue-deep/40 underline-offset-4 hocus:decoration-blue-deep"
                >
                  GitHub<span className="sr-only">: {r.name}</span>
                </ExternalLink>
                {study ? (
                  <TransitionLink
                    href={routes.work(study.id)}
                    label={study.shortTitle}
                    className="type-ui text-ink underline decoration-line-strong underline-offset-4 hocus:decoration-ink"
                  >
                    Case study
                    <span className="sr-only">: {study.shortTitle}</span>
                  </TransitionLink>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** The plant on the packet. */
function SpeciesArt({ species }: { species: Species }) {
  const svg = (children: ReactNode) => (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="size-16"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
  switch (species) {
    case "cornflower":
      return svg(
        <>
          <path
            d="M32 62V30M32 50Q22 44 20 36M32 44Q42 40 44 32"
            strokeWidth={2}
            className="stroke-lime-deep"
          />
          {Array.from({ length: 10 }, (_, k) => {
            const a = (k / 10) * Math.PI * 2;
            const x = 32 + Math.cos(a) * 11;
            const y = 22 + Math.sin(a) * 11;
            return (
              <path
                key={k}
                d={`M32 22L${(x - Math.sin(a) * 3.5).toFixed(1)} ${(y + Math.cos(a) * 3.5).toFixed(1)}L${(32 + Math.cos(a) * 15).toFixed(1)} ${(22 + Math.sin(a) * 15).toFixed(1)}L${(x + Math.sin(a) * 3.5).toFixed(1)} ${(y - Math.cos(a) * 3.5).toFixed(1)}Z`}
                strokeWidth={0.9}
                className="fill-blue stroke-ink"
              />
            );
          })}
          <circle
            cx={32}
            cy={22}
            r={4.5}
            strokeWidth={1}
            className="fill-ink-2 stroke-ink"
          />
        </>,
      );
    case "marigold":
      return svg(
        <>
          <path
            d="M32 62V36M32 54Q22 50 18 42M32 48Q42 46 46 38"
            strokeWidth={2}
            className="stroke-lime-deep"
          />
          <path
            d="M18 42Q22 36 26 44ZM46 38Q42 32 38 40Z"
            className="fill-lime"
          />
          {[15, 11, 7].map((r, i) => (
            <path
              key={r}
              d={
                Array.from({ length: 12 }, (_, k) => {
                  const a = (k / 12) * Math.PI * 2 + i * 0.3;
                  const b = ((k + 0.5) / 12) * Math.PI * 2 + i * 0.3;
                  return `${k ? "L" : "M"}${(32 + Math.cos(a) * r).toFixed(1)} ${(24 + Math.sin(a) * r).toFixed(1)}L${(32 + Math.cos(b) * (r - 3)).toFixed(1)} ${(24 + Math.sin(b) * (r - 3)).toFixed(1)}`;
                }).join("") + "Z"
              }
              strokeWidth={0.9}
              className={`${i === 1 ? "fill-tangerine-deep" : "fill-tangerine"} stroke-ink`}
            />
          ))}
        </>,
      );
    case "tomato":
      return svg(
        <>
          <path
            d="M14 62V8M14 18Q30 14 34 22M14 34Q32 30 40 40M34 22V28M40 40V46"
            strokeWidth={2}
            className="stroke-lime-deep"
          />
          <path d="M14 8V62" strokeWidth={2.5} className="stroke-graphite" />
          <path
            d="M20 16Q24 10 28 16Q24 20 20 16ZM24 32Q30 26 34 32Q30 36 24 32Z"
            className="fill-lime stroke-ink"
            strokeWidth={0.9}
          />
          {[
            [34, 33, 7],
            [44, 50, 8],
            [30, 52, 6],
          ].map(([x, y, r]) => (
            <g key={x}>
              <circle
                cx={x}
                cy={y}
                r={r}
                strokeWidth={1}
                className="fill-tangerine stroke-ink"
              />
              <path
                d={`M${x - 3} ${y - r + 1}L${x} ${y - r - 2}L${x + 3} ${y - r + 1}`}
                strokeWidth={1.4}
                className="stroke-lime-deep"
              />
              <circle
                cx={x - r * 0.35}
                cy={y - r * 0.35}
                r={1.3}
                className="fill-card"
              />
            </g>
          ))}
        </>,
      );
    case "lavender":
      return svg(
        <>
          {[20, 32, 44].map((x, i) => (
            <g key={x}>
              <path
                d={`M32 62Q${x} 44 ${x} ${16 + i * 2}`}
                strokeWidth={1.8}
                className="stroke-lime-deep"
              />
              {Array.from({ length: 6 }, (_, k) => (
                <ellipse
                  key={k}
                  cx={x + (k % 2 ? 2.4 : -2.4)}
                  cy={18 + i * 2 + k * 4.5}
                  rx={2.6}
                  ry={3.2}
                  strokeWidth={0.7}
                  className="fill-blue stroke-ink"
                />
              ))}
            </g>
          ))}
        </>,
      );
    case "fern":
      return svg(
        <>
          {[
            ["M32 62Q30 36 14 18", -1],
            ["M32 62Q36 34 50 16", 1],
            ["M32 62Q33 40 30 10", 1],
          ].map(([d, s], i) => (
            <g key={i}>
              <path
                d={d as string}
                strokeWidth={1.8}
                className="stroke-lime-deep"
              />
              {Array.from({ length: 7 }, (_, k) => {
                const t = 0.2 + k * 0.11;
                const x =
                  i === 0
                    ? 32 - 18 * t * t - 4 * t
                    : i === 1
                      ? 32 + 18 * t * t + 2 * t
                      : 32 - 2 * t;
                const y = 62 - 48 * t;
                return (
                  <path
                    key={k}
                    d={`M${x.toFixed(1)} ${y.toFixed(1)}q${(6 * (s as number)).toFixed(1)} -2 ${(9 * (s as number)).toFixed(1)} -6M${x.toFixed(1)} ${y.toFixed(1)}q${(-6 * (s as number)).toFixed(1)} -1 ${(-8 * (s as number)).toFixed(1)} -5`}
                    strokeWidth={2.4}
                    className="stroke-lime"
                  />
                );
              })}
            </g>
          ))}
        </>,
      );
    default:
      return svg(
        <>
          <path
            d="M18 62Q32 56 46 62"
            strokeWidth={2}
            className="stroke-graphite"
          />
          <path d="M32 60V36" strokeWidth={2.2} className="stroke-lime-deep" />
          <path
            d="M32 38C22 26 12 30 12 36C20 40 27 39 32 38ZM32 36C40 22 52 24 53 31C46 36 38 37 32 36Z"
            strokeWidth={1}
            className="fill-lime stroke-ink"
          />
        </>,
      );
  }
}
