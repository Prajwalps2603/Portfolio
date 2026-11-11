/**
 * The visiting card's actions: the contact file (a vCard: name, role, company, email, the site,
 * LinkedIn, Bengaluru; never a phone number), its download, and sharing the site. Pure helpers, no
 * React.
 */
import { experience, profile, site } from "@/content";

/** the window event that opens the card popup (the palette sends it) */
export const CARD_EVENT = "pmp:card";

const NL = "\r\n";
/** vCard text values escape backslashes, commas, semicolons and newlines */
const esc = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");

export const CARD_ROLE = experience[0]?.role ?? profile.title;
export const CARD_ORG = experience[0]?.company ?? "";
const linkedin = profile.socials.find((s) => s.kind === "linkedin");

/** the .vcf text (vCard 3.0, which every phone's contacts app reads) */
export function vcard(): string {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(profile.lastName)};${esc(profile.firstName)};;;`,
    `FN:${esc(profile.name)}`,
    `TITLE:${esc(CARD_ROLE)}`,
    CARD_ORG ? `ORG:${esc(CARD_ORG)}` : null,
    `EMAIL;TYPE=INTERNET:${profile.email}`,
    `URL:${site.url}`,
    linkedin ? `X-SOCIALPROFILE;TYPE=linkedin:${linkedin.href}` : null,
    `ADR;TYPE=WORK:;;;Bengaluru;Karnataka;;India`,
    `NOTE:${esc(`${profile.title}. Portfolio: ${site.url}`)}`,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join(NL);
}

/** download the contact file; true when the browser took it */
export function saveContact(): boolean {
  try {
    const blob = new Blob([vcard() + NL], { type: "text/vcard;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${profile.name.replace(/\s+/g, "-")}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
    return true;
  } catch {
    return false;
  }
}

/** the phone's share sheet where there is one, else copy the link: "shared" | "copied" | "failed" */
export async function shareCard(): Promise<
  "shared" | "copied" | "failed" | "cancelled"
> {
  const data = {
    title: profile.name,
    text: `${profile.name}, ${CARD_ROLE}`,
    url: site.url,
  };
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError")
        return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(site.url);
    return "copied";
  } catch {
    return "failed";
  }
}
