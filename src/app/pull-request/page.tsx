import type { Metadata } from "next";
import { site } from "@/content";
import { ogImages } from "@/lib/og";
import { PullRequestPage } from "@/components/pullrequest";

const title = "Open a pull request";
const description =
  "Hiring, freelance or a project together: write it up like a pull request (a title, a description, labels) and your email app opens with it, addressed to Prajwal.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${site.url}pull-request/` },
  openGraph: {
    title,
    description,
    type: "website",
    url: `${site.url}pull-request/`,
    images: ogImages(),
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ogImages(),
  },
};

export default function PullRequest() {
  return <PullRequestPage />;
}
