"use client";

import { useRef } from "react";
import { certifications, profile } from "@/content";
import { ExternalLink } from "@/components/ui";
import { DUR, EASE, STAGGER } from "@/lib/motion/eases";
import { gsap, useGSAP } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/media";

/** Certifications with their verify links. The final-year award is listed in the revision history. */
const CERTS = certifications.filter((c) => c.kind === "Certification");

export function Certifications() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Authored moment: each certificate is revealed by the beam crossing it left to right
  // (clip-path wipe, the row rule included). Reduced motion: final state, nothing hidden.
  useGSAP(
    () => {
      const root = ref.current;
      if (!root || reduced) return;
      const rows = gsap.utils.toArray<HTMLElement>("[data-cert]", root);
      if (!rows.length) return;
      gsap.fromTo(
        rows,
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: DUR.beamWipe,
          ease: EASE.beam,
          stagger: STAGGER.history * 1.5,
          clearProps: "clipPath",
          scrollTrigger: { trigger: root, start: "top 80%", once: true },
        },
      );
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true },
  );
  return (
    <div ref={ref} className="md:grid md:grid-cols-10 md:gap-x-6">
      <h3 id="cert-title" className="type-lead font-bold md:col-span-3">
        Certifications
      </h3>
      <div className="mt-4 md:col-span-7 md:mt-0">
        <ul aria-labelledby="cert-title" className="border-t-[1.5px] border-ink">
          {CERTS.map((c) => (
            <li key={c.id} data-cert className="grid items-baseline gap-x-6 gap-y-2 border-b border-rule py-5 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <p className="text-[length:clamp(18px,1.4vw,20px)] leading-[1.3] font-bold tracking-[-0.01em] text-balance">{c.title}</p>
                <p className="type-small mt-0.5 text-ink-muted">
                  {c.issuer} <span className="num">{c.year}</span>
                </p>
              </div>
              {c.href ? (
                <ExternalLink href={c.href} hint={`opens in a new tab, ${c.title}`} className="link-mono self-start">
                  Verify
                </ExternalLink>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="type-small mt-6 max-w-[62ch]">
          <span className="font-semibold">Currently studying:</span>{" "}
          <span className="text-ink-muted">{profile.learning.join(", ")}.</span>
        </p>
      </div>
    </div>
  );
}
