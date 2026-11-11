import {
  archiveProjects,
  capabilities,
  certifications,
  education,
  experience,
  featuredProjects,
  practices,
  profile,
  projects,
  site,
  skillGroups,
} from "@/content";
import { TransitionLink } from "@/components/transition";
import { routes } from "@/lib/routes";
import { asset } from "@/lib/asset";
import { blackletter, news } from "./fonts";
import { EditionDate, PrintButton, Puzzle, TearTabs } from "./TimesBits";

/**
 * THE PRAJWAL TIMES (the /resume page; "Prajwal Times" in the header, where Résumé was): the résumé
 * as an old newspaper's front page, every word from the site's content (src/content), so it is
 * never out of date. A blackletter masthead between two "ears" (the forecast, the price), the
 * dateline (today in Bengaluru), a markets ticker (each skill and how many projects and jobs use
 * it). Three columns, balanced so no column runs short (his ask: no empty space in a newspaper):
 *   - the lead story (Livora, his main project: the body beside a photo of the live site and his
 *     own words), then "Also in this issue" (two more live sites pictured, the six case studies);
 *   - Business (the four roles, a chart of them), Education, Corrections, Notices, In brief;
 *   - Classifieds (skills by layer, certifications, the newsletter, a WANTED ad with tear-off tabs).
 * Then a row of three: a Sketch -> Ship strip, an advertisement (what he builds), the puzzle corner
 * (his Sudoku Solver). A postmark at the foot. Clean cream paper, no texture. Save as PDF prints one
 * A4 sheet (globals.css).
 */
const LEAD = "livora";
/** the other live projects, pictured under "Also in this issue" (screenshots in public/times) */
const PICTURED = ["bookmyvenue", "buddy"];
const month = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}`;
};
const host = site.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

/** skills as a market: how many projects and jobs use each (the site's evidence, not ratings) */
const MARKET = skillGroups
  .flatMap((g) => g.skills)
  .filter((s) => s.usedIn.length > 0)
  .sort(
    (a, b) => b.usedIn.length - a.usedIn.length || a.name.localeCompare(b.name),
  )
  .slice(0, 16);

const KICKER =
  "font-mono text-[0.68rem] tracking-[0.16em] text-tangerine-deep uppercase";
const BOXHEAD =
  "border-b border-ink pb-1 font-mono text-[0.62rem] tracking-[0.16em] uppercase";
const COL =
  "min-w-0 lg:border-l lg:border-ink/30 lg:pl-6 print:border-l print:border-ink/30 print:pl-3";
const ROW =
  "grid gap-x-7 gap-y-8 lg:grid-cols-[minmax(0,2.15fr)_minmax(0,1fr)_minmax(0,1fr)] print:grid-cols-[minmax(0,2.15fr)_minmax(0,1fr)_minmax(0,1fr)] print:gap-x-4 print:gap-y-3";

export function TimesPage() {
  const lead = projects.find((p) => p.id === LEAD) ?? featuredProjects[0];
  const more = featuredProjects.filter((p) => p.id !== lead.id).slice(0, 6);
  const sudoku = projects.find((p) => p.id === "sudoku-solver");
  const degree = education[0];
  const li = profile.socials.find((s) => s.kind === "linkedin");
  const gh = profile.socials.find((s) => s.kind === "github");
  const now = experience[0];
  // the career chart: each role as a bar from its start to its end, late 2023 to today
  const t0 = 2023 + 9 / 12;
  const t1 = 2026 + 11 / 12;
  const at = (ym: string | null) => {
    if (!ym) return t1;
    const [y, m] = ym.split("-").map(Number);
    return y + (m - 1) / 12;
  };
  const x = (t: number) => ((t - t0) / (t1 - t0)) * 100;

  return (
    <div
      className={`${blackletter.variable} ${news.variable} pt-[calc(var(--header-h)+clamp(20px,4vw,48px))] pb-(--section-y)`}
    >
      {/* the toolbar (screen only) */}
      <div className="wrap mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <TransitionLink
          href={routes.home}
          label="Home"
          className="type-mono inline-flex items-center gap-1.5 text-graphite underline decoration-line-strong underline-offset-4 hocus:text-ink hocus:decoration-ink"
        >
          <span aria-hidden="true">←</span> Back to the site
        </TransitionLink>
        <div className="flex flex-wrap items-center gap-3">
          <p className="type-small text-graphite max-sm:hidden">
            My résumé, as a front page. Always up to date.
          </p>
          <PrintButton />
        </div>
      </div>

      <article
        data-qa="times"
        aria-labelledby="times-title"
        className="times-paper relative mx-auto w-[min(100%-2*var(--margin),1180px)] md:-rotate-[0.35deg] border border-ink/15 px-[clamp(16px,3.4vw,44px)] pt-[clamp(18px,2.6vw,32px)] pb-[clamp(22px,3vw,40px)] text-ink print:w-full print:rotate-0 print:border-0 print:p-0"
        style={{ fontFamily: "var(--font-news), Georgia, serif" }}
      >
        {/* the fold across the middle (from tablet width up: on a phone the paper is one long
            column, the fold lands on a line of text and reads as a strikethrough; the tilt is
            tablet-up too, since on a ~6000px phone paper 0.35deg pushes its top onto the screen's
            left edge and its bottom onto the right) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-ink/10 max-md:hidden print:hidden"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[calc(50%+1px)] h-px bg-card max-md:hidden print:hidden"
        />

        {/* masthead: the ears and the title */}
        <header className="grid items-center gap-4 border-b border-ink pb-3 md:grid-cols-[11rem_minmax(0,1fr)_11rem] print:grid-cols-[9rem_minmax(0,1fr)_9rem]">
          <div className="hidden border border-ink p-2 text-center md:block print:block">
            <p className="font-mono text-[0.62rem] tracking-[0.16em] uppercase">
              Forecast
            </p>
            <svg
              aria-hidden="true"
              viewBox="0 0 32 32"
              className="mx-auto my-1 size-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <circle cx="16" cy="16" r="6" />
              <path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l2.8 2.8M22.2 22.2 25 25M7 25l2.8-2.8M22.2 9.8 25 7" />
            </svg>
            <p className="text-[0.82rem] leading-tight italic">
              Clear skies. Good for shipping.
            </p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[0.66rem] tracking-[0.18em] uppercase">
              The résumé of {profile.name}, {profile.title}
            </p>
            <h1
              id="times-title"
              className="mt-1 text-[clamp(2.3rem,0.6rem+5.2vw,5.5rem)] leading-[1.02] md:whitespace-nowrap print:whitespace-nowrap"
              style={{ fontFamily: "var(--font-blackletter), serif" }}
            >
              The Prajwal Times
            </h1>
          </div>
          <div className="hidden border border-ink p-2 text-center md:block print:block">
            <p className="font-mono text-[0.62rem] tracking-[0.16em] uppercase">
              Price
            </p>
            <p className="my-1 text-[1.6rem] leading-none font-extrabold">1</p>
            <p className="text-[0.82rem] leading-tight italic">
              interview. Bengaluru or wherever you are.
            </p>
          </div>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b-[3px] border-double border-ink py-1.5 font-mono text-[0.7rem] tracking-[0.1em] uppercase">
          <EditionDate />
          <span className="max-sm:hidden">
            &ldquo;Ideas into complete, working software&rdquo;
          </span>
          <span>Indian edition</span>
        </div>

        {/* the markets: each skill and how many projects and jobs use it */}
        <div
          className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-ink py-1.5 font-mono text-[0.72rem]"
          aria-label="Skills, with how many of my projects and jobs use each"
        >
          <span className="bg-ink px-1.5 py-0.5 tracking-[0.14em] text-paper uppercase">
            Markets
          </span>
          {MARKET.map((s) => (
            <span key={s.name} className="whitespace-nowrap">
              {s.name}{" "}
              <span className="text-lime-deep">▲{s.usedIn.length}</span>
            </span>
          ))}
        </div>

        <div className={`mt-5 print:mt-2 ${ROW}`}>
          {/* the lead story: Livora, then the rest of the news under it */}
          <section aria-labelledby="times-lead" className="min-w-0">
            <p className={KICKER}>Lead story · {lead.category}</p>
            <h2
              id="times-lead"
              className="mt-1.5 text-[clamp(2rem,1.2rem+2.6vw,3.3rem)] leading-[0.98] font-extrabold tracking-[-0.02em]"
            >
              {lead.title} goes live: the studio site where the software builds
              itself in front of you
            </h2>
            <p className="mt-3 text-[1.12rem] leading-snug text-ink/80 italic">
              {lead.summary}
            </p>
            <p className="mt-2 font-mono text-[0.66rem] tracking-[0.12em] uppercase">
              By our full stack correspondent · {profile.location}
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] print:mt-2 print:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] print:gap-3">
              <div className="text-[0.98rem] leading-[1.5] text-justify hyphens-auto">
                {profile.about.map((p, i) => (
                  <p
                    key={i}
                    className={`mb-3 ${i === 0 ? "first-letter:float-left first-letter:pt-1 first-letter:pr-1.5 first-letter:text-[3.1rem] first-letter:leading-[0.8] first-letter:font-extrabold" : ""}`}
                  >
                    {p}
                  </p>
                ))}
              </div>
              <div className="min-w-0">
                <figure>
                  <NewsPhoto
                    src={`/times/${lead.id}.jpg`}
                    alt={`${lead.title}'s home page, live: from problem to working software`}
                  />
                  <figcaption className="mt-1.5 text-[0.82rem] leading-snug text-ink/70 italic">
                    {lead.title}, {lead.year}: {lead.stack.join(", ")}.{" "}
                    {lead.featured ? (
                      <TransitionLink
                        href={routes.work(lead.id)}
                        label={lead.title}
                        className="text-blue-deep not-italic underline underline-offset-2"
                      >
                        The full story
                      </TransitionLink>
                    ) : null}
                    {lead.links.live ? (
                      <a
                        href={lead.links.live}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-deep not-italic underline underline-offset-2"
                      >
                        Visit it live
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : null}
                  </figcaption>
                </figure>
                <blockquote className="mt-4 border-y-2 border-ink py-2.5 text-center text-[1.12rem] leading-snug font-semibold italic">
                  &ldquo;{profile.inHisWords}&rdquo;
                  <footer className="mt-1 font-mono text-[0.64rem] font-normal tracking-[0.14em] not-italic uppercase">
                    {profile.name}
                  </footer>
                </blockquote>
              </div>
            </div>

            {/* also in this issue: two more live sites pictured, then the case studies */}
            <div className="mt-6 border-t-[3px] border-double border-ink pt-3 print:mt-3 print:pt-2">
              <p id="times-more" className={KICKER}>
                Also in this issue
              </p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                {PICTURED.map((id) => {
                  const p = projects.find((q) => q.id === id);
                  if (!p) return null;
                  return (
                    <figure key={id} className="min-w-0">
                      <NewsPhoto
                        src={`/times/${id}.jpg`}
                        alt={`${p.title}'s home page, live`}
                      />
                      <figcaption className="mt-1 text-[0.8rem] leading-snug text-ink/75 italic">
                        <span className="font-bold text-ink not-italic">
                          {p.title}
                        </span>
                        , {p.year}: {p.tagline}{" "}
                        {p.links.live ? (
                          <a
                            href={p.links.live}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-deep not-italic underline underline-offset-2"
                          >
                            visit
                            <span className="sr-only">
                              {" "}
                              {p.title} (opens in a new tab)
                            </span>
                          </a>
                        ) : null}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
              <ul
                aria-labelledby="times-more"
                className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2 md:grid-cols-3 print:mt-2 print:grid-cols-3 print:gap-y-2"
              >
                {more.map((p) => (
                  <li key={p.id} className="border-t border-ink pt-2">
                    <p className="font-mono text-[0.6rem] tracking-[0.12em] uppercase">
                      {p.category} · {p.year}
                    </p>
                    <h3 className="mt-0.5 text-[1.12rem] leading-tight font-extrabold">
                      <TransitionLink
                        href={routes.work(p.id)}
                        label={p.shortTitle}
                        className="hover:text-blue-deep hover:underline"
                      >
                        {p.shortTitle}
                      </TransitionLink>
                    </h3>
                    <p className="mt-0.5 text-[0.88rem] leading-snug">
                      {p.tagline}
                    </p>
                  </li>
                ))}
                {/* also built: more of his work, by name (src/content/profile.ts), as briefs like the rest */}
                {profile.alsoBuilt.map((w) => (
                  <li
                    key={w.name}
                    data-qa="times-also-built"
                    className="border-t border-ink pt-2"
                  >
                    <p className="font-mono text-[0.6rem] tracking-[0.12em] uppercase">
                      Also built
                    </p>
                    <h3 className="mt-0.5 text-[1.12rem] leading-tight font-extrabold">
                      {w.name}
                    </h3>
                    <p className="mt-0.5 text-[0.88rem] leading-snug">
                      {w.note ?? "Ask me about it."}
                    </p>
                  </li>
                ))}
              </ul>
              {/* from the archive: his other projects on the site, not in this issue */}
              <p
                data-qa="times-archive"
                className="mt-4 border-t-2 border-ink pt-2 text-[0.9rem] leading-snug print:mt-2"
              >
                <span className="mr-2 font-mono text-[0.62rem] tracking-[0.16em] uppercase">
                  From the archive
                </span>
                {archiveProjects
                  .filter((p) => p.id !== lead.id && !PICTURED.includes(p.id))
                  .map((p, i) => (
                    <span key={p.id}>
                      {i ? (
                        <span
                          aria-hidden="true"
                          className="mx-1.5 text-tangerine-deep"
                        >
                          ·
                        </span>
                      ) : null}
                      <span className="font-bold">{p.shortTitle}</span>{" "}
                      <span className="text-ink/70 italic">({p.year})</span>
                    </span>
                  ))}
              </p>
            </div>
          </section>

          {/* business: the roles, education, corrections, notices, in brief */}
          <section
            aria-labelledby="times-business"
            className={`flex flex-col ${COL}`}
          >
            <p className={KICKER}>Business</p>
            <h2
              id="times-business"
              className="mt-1 text-[1.5rem] leading-tight font-extrabold"
            >
              Four roles, one direction
            </h2>
            <figure
              className="mt-3"
              aria-label="My roles over time, 2023 to now"
            >
              <div className="relative">
                {experience.map((e, i) => {
                  const a = x(at(e.start));
                  const b = x(at(e.end));
                  return (
                    <div key={e.id} className="relative mb-1.5 h-4">
                      <span
                        className={`absolute inset-y-0 rounded-[2px] ${i === 0 ? "bg-lime" : "bg-ink/80"}`}
                        style={{
                          left: `${a}%`,
                          width: `${Math.max(2.5, b - a)}%`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between border-t border-ink pt-0.5 font-mono text-[0.6rem]">
                <span>2023</span>
                <span>2024</span>
                <span>2025</span>
                <span>now</span>
              </div>
            </figure>
            <ol className="mt-3 grid gap-2.5">
              {experience.map((e, i) => (
                <li
                  key={e.id}
                  className="border-b border-ink/20 pb-2 last:border-b-0"
                >
                  <p className="text-[1rem] leading-tight font-bold">
                    {i === 0 ? (
                      <span
                        aria-hidden="true"
                        className="mr-1 inline-block size-2 rounded-full bg-tangerine align-middle"
                      />
                    ) : null}
                    {e.role}
                  </p>
                  <p className="text-[0.92rem] leading-snug">{e.company}</p>
                  <p className="font-mono text-[0.62rem] tracking-[0.08em] uppercase">
                    {month(e.start)} – {e.end ? month(e.end) : "now"}
                  </p>
                  {i === 0 ? (
                    <p className="mt-1 text-[0.86rem] leading-snug text-ink/75 italic">
                      {e.summary}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
            <p className={`mt-5 ${KICKER}`}>Education</p>
            <h3 className="mt-1 text-[1.08rem] leading-tight font-bold">
              {degree.qualification}, {degree.field}
            </h3>
            <p className="text-[0.92rem] leading-snug">
              {degree.institution}, {degree.location}.{" "}
              {degree.period.replace("—", "to")}. {degree.grade}.
            </p>
            {degree.note ? (
              <p className="mt-1 text-[0.88rem] leading-snug italic">
                {degree.note}.
              </p>
            ) : null}

            <div className="mt-5 border-t-2 border-ink pt-2">
              <p className="font-mono text-[0.68rem] tracking-[0.16em] uppercase">
                Corrections
              </p>
              <p className="mt-1 text-[0.86rem] leading-snug">
                Older copies of this résumé (the PDF) predate the current job.{" "}
                {profile.name} has been a {now.role} at {now.company} since{" "}
                {month(now.start)}. This edition is printed from the site, so it
                stays current.
              </p>
            </div>

            {/* notices: what he is learning, what he works on, the road, how he works */}
            <div className="mt-5 border-2 border-ink p-2.5 print:mt-3">
              <p className={BOXHEAD}>Notices</p>
              <p className="mt-1.5 text-[0.86rem] leading-snug">
                <span className="font-bold">Now learning: </span>
                {profile.learning.join(", ")}.
              </p>
              <p className="mt-1.5 text-[0.86rem] leading-snug">
                <span className="font-bold">Current focus: </span>
                {profile.currentFocus.join(", ")}.
              </p>
              <p className="mt-1.5 text-[0.86rem] leading-snug">
                <span className="font-bold">The road so far: </span>
                {profile.route
                  .map(
                    (r) => `${r.place} (${r.years.replace(/\s*–\s*/, " to ")})`,
                  )
                  .join(", then ")}
                .
              </p>
            </div>
            {/* how he works (the site's practices), filling the column */}
            <div className="mt-4 flex flex-1 flex-col border-2 border-ink p-2.5 print:mt-2">
              <p className="border-b border-ink pb-1 font-mono text-[0.62rem] tracking-[0.16em] uppercase">
                How I work
              </p>
              <ul className="mt-1.5 flex flex-1 flex-col justify-evenly gap-1 text-[0.88rem] leading-snug">
                {practices.map((t) => (
                  <li key={t} className="pl-3 -indent-3">
                    <span
                      aria-hidden="true"
                      className="mr-1.5 text-tangerine-deep"
                    >
                      ■
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* classifieds */}
          <section
            aria-labelledby="times-classifieds"
            className={`flex flex-col ${COL}`}
          >
            <p id="times-classifieds" className={KICKER}>
              Classifieds
            </p>
            <div className="mt-2 border border-ink p-2.5">
              <p className={BOXHEAD}>Skills for hire</p>
              <dl className="mt-1.5 grid gap-1.5 text-[0.86rem] leading-snug">
                {skillGroups.map((g) => (
                  <div key={g.id}>
                    <dt className="inline font-bold">{g.label}: </dt>
                    <dd className="inline">
                      {g.skills.map((s) => s.name).join(", ")}.
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mt-3 border border-ink p-2.5">
              <p className={BOXHEAD}>Certified</p>
              <ul className="mt-1.5 grid gap-1.5 text-[0.86rem] leading-snug">
                {certifications.map((c) => (
                  <li key={c.title}>
                    <span className="font-semibold">{c.title}</span>, {c.issuer}
                    , {c.year}
                    {c.href ? (
                      <>
                        {" "}
                        <a
                          href={c.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-deep underline underline-offset-2 print:hidden"
                        >
                          verify
                          <span className="sr-only">
                            : {c.title} (opens in a new tab)
                          </span>
                        </a>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
            {/* the directory: where to find him (his profile), as one run of text like real classifieds */}
            <div className="mt-3 border border-ink p-2.5">
              <p className={BOXHEAD}>Directory</p>
              <p className="mt-1.5 text-[0.86rem] leading-snug">
                {profile.socials.map((so, i) => (
                  <span key={so.kind}>
                    {i ? (
                      <span
                        aria-hidden="true"
                        className="mx-1 text-tangerine-deep"
                      >
                        ·
                      </span>
                    ) : null}
                    <span className="font-bold">{so.label}</span>{" "}
                    <a
                      href={so.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-deep hover:underline"
                    >
                      {so.handle}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </span>
                ))}
              </p>
            </div>
            <a
              href={profile.newsletter.href}
              target="_blank"
              rel="noopener noreferrer"
              data-qa="times-newsletter"
              className="mt-3 block border-2 border-ink bg-paper-2 p-2.5 hover:bg-lime-soft"
            >
              <span className="block font-mono text-[0.62rem] tracking-[0.16em] uppercase">
                Subscribe
              </span>
              <span className="mt-0.5 block text-[1.08rem] leading-tight font-extrabold">
                {profile.newsletter.title}
              </span>
              <span className="mt-0.5 block text-[0.84rem] leading-snug">
                {profile.newsletter.about} Weekly, on LinkedIn.
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            {/* the WANTED ad, with tear-off tabs; it takes the rest of the column */}
            <div className="mt-3 flex flex-1 flex-col bg-ink p-3 text-paper">
              <div className="flex flex-1 flex-col justify-center">
                <p className="text-center text-[2rem] leading-none font-extrabold tracking-[0.04em]">
                  WANTED
                </p>
                {/* his words (profile.openTo: anywhere in the world, any software development role),
                    in classified-ad voice */}
                <p className="mt-2 text-center text-[1.05rem] leading-snug font-semibold italic">
                  A desk anywhere on the map.
                </p>
                <p className="mt-1 text-center text-[0.92rem] leading-snug">
                  Bags packed for any city or time zone, ready for any software
                  development role.
                </p>
                <p className="mt-2 text-center font-mono text-[0.72rem]">
                  <span className="text-paper/70">Apply within: </span>
                  <span className="text-lime">{profile.email}</span>
                </p>
              </div>
              <TearTabs />
            </div>
          </section>
        </div>

        {/* the bottom row: the strip, the advertisement, the puzzle. Three columns from 1200px (the comic a little wider, so its strip is about as tall as the puzzle);
            from 600px the strip runs across and the advertisement and the puzzle share the row
            under it (three columns there left the puzzle's column narrower than its grid) */}
        <div className="mt-8 grid gap-x-7 gap-y-8 border-t-[3px] border-double border-ink pt-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,0.85fr)_minmax(0,1fr)] print:hidden">
          <section
            aria-labelledby="times-comic"
            className="flex min-w-0 flex-col sm:col-span-2 lg:col-span-1"
          >
            <p id="times-comic" className={KICKER}>
              Comics
            </p>
            <Strip />
            <p className="mt-1.5 text-center text-[0.8rem] italic">
              Sketch → Ship, by P.M.P.
            </p>
          </section>
          <section
            aria-labelledby="times-ad"
            className="flex min-w-0 flex-col lg:border-l lg:border-ink/30 lg:pl-6 print:border-l print:border-ink/30 print:pl-3"
          >
            {/* an advertisement: what he builds (the site's capabilities, in his words) */}
            <div className="flex flex-1 flex-col justify-center border-[3px] border-double border-ink p-2.5 text-center">
              <p className="font-mono text-[0.6rem] tracking-[0.2em] uppercase">
                Advertisement
              </p>
              <p
                id="times-ad"
                className="mt-1 text-[1.3rem] leading-tight font-extrabold"
              >
                What I build
              </p>
              <ul className="mx-auto mt-1.5 grid w-fit gap-1 text-[0.9rem] leading-snug">
                {capabilities.map((c) => (
                  <li key={c.id} className="font-semibold">
                    {c.title}
                  </li>
                ))}
              </ul>
              <p className="mt-2 border-t border-ink pt-1.5 font-mono text-[0.66rem]">
                Write to {profile.email}
              </p>
            </div>
          </section>
          <section
            aria-labelledby="times-puzzle"
            className="flex min-w-0 flex-col sm:border-l sm:border-ink/30 sm:pl-6 print:border-l print:border-ink/30 print:pl-3"
          >
            <p id="times-puzzle" className={KICKER}>
              Puzzle corner
            </p>
            <p className="mt-1 mb-2 text-[0.86rem] leading-snug">
              Fill 1 to 4 in every row, column and box.{" "}
              {sudoku
                ? `Stuck? ${sudoku.title} (${sudoku.year}) solves the 9x9 kind by backtracking.`
                : null}
            </p>
            <Puzzle />
          </section>
        </div>

        {/* the foot of the page and the postmark */}
        <footer className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-ink pt-3 print:mt-3 print:pt-1">
          <p className="font-mono text-[0.66rem] leading-relaxed">
            {profile.email}
            {li ? ` · ${li.href.replace("https://www.", "")}` : ""}
            {gh ? ` · github.com/${gh.handle}` : ""}
            <br />
            Printed from {host}: every word is the site&apos;s own.
          </p>
          <span
            aria-hidden="true"
            className="inline-grid size-[5.5rem] -rotate-12 place-items-center rounded-full border-[3px] border-double border-tangerine-deep text-center font-mono text-[0.58rem] leading-tight font-bold tracking-[0.1em] text-tangerine-deep uppercase"
          >
            Always
            <br />
            up to
            <br />
            date
          </span>
        </footer>
      </article>
    </div>
  );
}

/**
 * A news photo: a real screenshot of the live site (public/times, taken from the site as it is online)
 * printed the old way: black and white with a touch of sepia, clean (no dot screen, at his ask).
 */
function NewsPhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden border border-ink bg-card">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, a plain image */}
      <img
        src={asset(src)}
        alt={alt}
        width={1280}
        height={800}
        decoding="async"
        className="absolute inset-0 size-full object-cover object-top contrast-[1.1] grayscale sepia-[0.35]"
      />
    </div>
  );
}

/** Three pencil panels: the sketch, the build, shipped. */
function Strip() {
  return (
    <div
      aria-label="A three-panel strip: a pencil sketch of an app, the app built, the app live"
      role="img"
      className="mx-auto mt-2 grid w-full max-w-[36rem] grid-cols-3 gap-1.5"
    >
      {[0, 1, 2].map((k) => (
        <svg
          key={k}
          viewBox="0 0 100 120"
          className="block h-auto w-full border-2 border-ink bg-card"
          aria-hidden="true"
        >
          {k === 0 ? (
            <g
              fill="none"
              stroke="#55554f"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="5 3"
            >
              <rect x="14" y="22" width="72" height="56" rx="4" />
              <path d="M22 34h40M22 46h52M22 58h30" />
              <path
                d="M70 96l14-14 6 6-14 14z"
                stroke="#0d0d0c"
                strokeDasharray="0"
              />
            </g>
          ) : null}
          {k === 1 ? (
            <g>
              <rect
                x="14"
                y="22"
                width="72"
                height="56"
                rx="4"
                fill="#fbfbf8"
                stroke="#0d0d0c"
                strokeWidth="2.2"
              />
              <rect
                x="14"
                y="22"
                width="72"
                height="11"
                rx="4"
                fill="#0d0d0c"
              />
              <rect
                x="20"
                y="40"
                width="28"
                height="20"
                rx="2"
                fill="#ffe1d3"
                stroke="#0d0d0c"
              />
              <rect
                x="52"
                y="40"
                width="28"
                height="20"
                rx="2"
                fill="#dde3ff"
                stroke="#0d0d0c"
              />
              <rect
                x="20"
                y="65"
                width="22"
                height="7"
                rx="3.5"
                fill="#c8f53b"
                stroke="#0d0d0c"
              />
            </g>
          ) : null}
          {k === 2 ? (
            <g>
              <rect
                x="14"
                y="22"
                width="72"
                height="56"
                rx="4"
                fill="#fbfbf8"
                stroke="#0d0d0c"
                strokeWidth="2.2"
              />
              <g>
                <circle
                  cx="50"
                  cy="50"
                  r="16"
                  fill="#c8f53b"
                  stroke="#1f1c16"
                  strokeWidth="2.2"
                />
                <path
                  d="M42 50l6 6 11-12"
                  fill="none"
                  stroke="#1f1c16"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>
          ) : null}
          <text
            x="50"
            y="108"
            textAnchor="middle"
            fontSize="12"
            fontStyle="italic"
            fill="#1f1c16"
            fontFamily="var(--font-news), Georgia, serif"
          >
            {["sketch", "build", "ship"][k]}
          </text>
        </svg>
      ))}
    </div>
  );
}
