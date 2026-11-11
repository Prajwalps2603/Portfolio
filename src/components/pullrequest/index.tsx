import { Highlight, Section } from "@/components/ui";
import { TransitionLink } from "@/components/transition";
import { routes } from "@/lib/routes";
import { PullRequestForm } from "./PullRequestForm";

/**
 * The /pull-request page (from the contact section's "Create a pull request" button, and the
 * palette): contact as a pull request. A title, a description (Write / Preview), labels
 * (Full-time, Freelance, Collab) and a milestone; "Create pull request" opens the visitor's email
 * app with all of it written, addressed to Prajwal. Nothing is sent by the site (no server).
 */
export function PullRequestPage() {
  return (
    <Section
      labelledBy="pr-title"
      spacing="none"
      className="pt-[calc(var(--header-h)+clamp(32px,6vw,72px))] pb-(--section-y)"
    >
      <TransitionLink
        href={routes.section("contact")}
        label="Contact"
        className="type-mono inline-flex items-center gap-1.5 text-graphite underline decoration-line-strong underline-offset-4 hocus:text-ink hocus:decoration-ink"
      >
        <span aria-hidden="true">←</span> Back to contact
      </TransitionLink>
      <h1 id="pr-title" className="type-display mt-6">
        Open a <Highlight color="lime">pull request</Highlight>
      </h1>
      <p className="type-lead measure mt-5 text-graphite">
        A role, a project or an idea: write it up like a PR. Create it and your
        email app opens with everything filled in; nothing is sent until you
        press send. I reply to every email.
      </p>
      <div className="mt-10">
        <PullRequestForm />
      </div>
    </Section>
  );
}
