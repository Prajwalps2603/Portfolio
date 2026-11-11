/**
 * 01 HERO (#top, paper). Owner: hero. docs/DESIGN.md "01 Hero", DIRECTION section 3.
 *
 * Left: the h1 name (the page's only h1), "Full Stack Developer" with a lime swipe behind
 * "Full Stack", the statement, the pills, the "Now:" status line. Right: the stage (HeroStage):
 * the "Things I build" note wired into an app window that ships his projects one by one.
 *
 * Every part the opening reveals carries data-boot (hidden only while html.booting, which only
 * JS sets) and a data-hero="..." handle the Intro measures (src/components/intro). The highlight
 * is static here: the Intro swipes it (opening, or once on arrival); reduced motion keeps it still.
 */
import { experience, profile } from "@/content";
import { Highlight, LiveDot, Pill, Section } from "@/components/ui";
import { ArrowDown, SocialIcon } from "@/components/icons";
import { HeroStage } from "./HeroStage";

/** "Full Stack Developer" -> ["Full Stack", "Developer"]: the swipe goes behind the lead words. */
function splitTitle(title: string): [string, string] {
  const at = title.lastIndexOf(" ");
  return at > 0 ? [title.slice(0, at), title.slice(at + 1)] : [title, ""];
}

export function Hero() {
  const now = experience.find((x) => x.current);
  const city = profile.location.split(",")[0];
  const [lead, last] = splitTitle(profile.title);
  return (
    <Section
      id="top"
      labelledBy="hero-name"
      spacing="none"
      className="pt-[calc(var(--header-h)+clamp(28px,4.4vw,64px))] pb-[clamp(64px,7vw,112px)]"
    >
      <div className="grid gap-y-14 md:grid-cols-[minmax(0,0.94fr)_minmax(0,1fr)] md:items-start md:gap-x-[clamp(40px,5vw,80px)]">
        <div>
          <h1 id="hero-name" data-boot="" data-hero="name" className="type-hero">
            {profile.name}
          </h1>
          <p data-boot="" data-hero="role" className="type-display mt-[clamp(14px,1.5vw,22px)] text-[clamp(1.875rem,1rem+2.6vw,3.25rem)]">
            <Highlight color="lime" trigger="static">
              {lead}
            </Highlight>
            {last ? ` ${last}` : null}
          </p>
          <p data-boot="" data-hero="statement" className="type-lead mt-6 max-w-[46ch] text-graphite">
            {profile.statement}
          </p>
          <div data-boot="" data-hero="actions" className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-3">
            <Pill href="#work" size="lg" icon={<ArrowDown />} nudge="down" magnetic className="max-sm:flex-1 max-sm:px-4 lg:px-[1.35em]">
              See my work
            </Pill>
            <Pill href={profile.resume.href} variant="outline" size="lg" hint="PDF on Google Drive, opens in a new tab" className="max-sm:flex-1 max-sm:px-4 lg:px-[1.35em]">
              {profile.resume.label}
            </Pill>
            {/* his LinkedIn newsletter: LinkedIn's subscribe link, in a new tab */}
            <Pill
              href={profile.newsletter.href}
              variant="outline"
              size="lg"
              iconBefore={<SocialIcon kind="linkedin" />}
              hint={`${profile.newsletter.title}, subscribe on LinkedIn, opens in a new tab`}
              data-qa="hero-newsletter"
              className="max-sm:basis-full max-sm:justify-center max-sm:px-4 lg:px-[1.35em]"
            >
              {profile.newsletter.label}
            </Pill>
            {/* On phones the email takes its own row; the link itself stays as wide as its text. */}
            <span className="max-sm:basis-full">
              <a href={`mailto:${profile.email}`} className="link type-ui inline-flex min-h-11 items-center rounded-chip">
                {profile.email}
              </a>
            </span>
          </div>
          {now ? (
            <p data-boot="" data-hero="status" className="type-small mt-8 text-graphite">
              <span className="flex items-start gap-2.5">
                <LiveDot pulse className="mt-[0.47em]" />
                <span>
                  <span className="font-medium text-ink">Now:</span> {now.role} at {now.company.replace(/\s+LLP$/, "")}
                  <span className="sr-only">,</span>
                </span>
              </span>
              <span className="mt-0.5 block pl-4.5">
                {city}
                <span aria-hidden="true"> · </span>
                <span className="sr-only">. </span>
                {profile.availability}
              </span>
            </p>
          ) : null}
        </div>

        <HeroStage />
      </div>
    </Section>
  );
}
