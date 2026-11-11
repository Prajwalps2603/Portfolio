import type { Metadata } from "next";
import { site } from "@/content";
import { ogImages } from "@/lib/og";
import { TimesPage } from "@/components/times";

const title = "The Prajwal Times (résumé)";
const description =
  "Prajwal M P's résumé as a newspaper front page: the current role, four roles over time, the projects, education, certifications and skills, printed from the site so it is always up to date.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${site.url}resume/` },
  openGraph: {
    title,
    description,
    type: "website",
    url: `${site.url}resume/`,
    images: ogImages(),
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ogImages(),
  },
};

export default function Resume() {
  return <TimesPage />;
}
