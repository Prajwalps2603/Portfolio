/**
 * CONTRACT 4 (owner: casestudy). Keep the static-export
 * plumbing: generateStaticParams over featuredProjects, dynamicParams = false, async params,
 * metadata via ogImages() + a canonical URL. May import <MiniUI> and src/components/sketch.
 * See docs/DESIGN.md "Case studies".
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { featuredProjects, site } from "@/content";
import { ogImages } from "@/lib/og";
import { CaseHero, CaseStory, HowItWorks, CaseHighlights, CaseNext } from "@/components/casestudy";

export const dynamicParams = false;

export function generateStaticParams() {
  return featuredProjects.map((p) => ({ slug: p.id }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = featuredProjects.find((p) => p.id === slug);
  if (!project) return {};
  const url = `${site.url}work/${project.id}/`;
  // The layout's title template adds " · Prajwal M P".
  return {
    title: project.title,
    description: project.tagline,
    alternates: { canonical: url },
    // A child openGraph object replaces the layout's, so the card is restated here.
    openGraph: { title: project.title, description: project.tagline, type: "article", url, images: ogImages() },
    twitter: { card: "summary_large_image", title: project.title, description: project.tagline, images: ogImages() },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const index = featuredProjects.findIndex((p) => p.id === slug);
  if (index < 0) notFound();
  const project = featuredProjects[index];
  const next = featuredProjects[(index + 1) % featuredProjects.length];
  const prev = featuredProjects[(index - 1 + featuredProjects.length) % featuredProjects.length];
  return (
    <>
      <CaseHero project={project} />
      <CaseStory project={project} />
      <HowItWorks project={project} />
      <CaseHighlights project={project} />
      <CaseNext next={next} prev={prev} />
    </>
  );
}
