import type { Metadata } from "next";
import { site } from "@/content";
import { ogImages } from "@/lib/og";
import { ReposPage } from "@/components/repos";

const title = "Repos";
const description =
  "Every public repository Prajwal has on GitHub, opened as a workspace in a code editor: each repo's README and metadata, a git log, a terminal, and the live ones running in a browser tab.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${site.url}repos/` },
  openGraph: {
    title,
    description,
    type: "website",
    url: `${site.url}repos/`,
    images: ogImages(),
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ogImages(),
  },
};

export default function Repos() {
  return <ReposPage />;
}
