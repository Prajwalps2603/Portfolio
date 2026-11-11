import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { featuredProjects, profile, site } from "@/content";
import { ogImages } from "@/lib/og";
import { Datasheet } from "@/components/work/Datasheet";

/**
 * /work/[slug]/: datasheets, statically generated for every featured project.
 * The page root is a bone sheet (data-surface="sheet") directly inside <main>.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return featuredProjects.map((p) => ({ slug: p.id }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = featuredProjects.find((p) => p.id === slug);
  if (!project) return {};
  const title = `${project.title}: datasheet · ${profile.name}`;
  return {
    title,
    description: project.tagline,
    // A child openGraph object replaces the layout's, so the card is restated here.
    openGraph: { title, description: project.tagline, type: "article", url: `${site.url}work/${project.id}/`, images: ogImages() },
    twitter: { card: "summary_large_image", title, description: project.tagline, images: ogImages() },
  };
}

export default async function DatasheetPage({ params }: Props) {
  const { slug } = await params;
  const index = featuredProjects.findIndex((p) => p.id === slug);
  if (index < 0) notFound();
  const n = featuredProjects.length;
  return (
    <Datasheet
      project={featuredProjects[index]}
      prev={featuredProjects[(index - 1 + n) % n]}
      next={featuredProjects[(index + 1) % n]}
    />
  );
}
