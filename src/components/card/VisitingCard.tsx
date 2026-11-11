"use client";

/**
 * THE VISITING CARD (the contact section's right column, at the top beside the heading, tilted like
 * a card left on a desk, the "Now" card under it; and the popup, ./CardPopup). A paper card that
 * flips (the tilt is still: no hover motion, at his ask; flat at rest, 3D only during the turn). Front: Bengaluru, the name, the role and company, "Open to new opportunities", the email
 * and the site. Back (lime): a QR code to the site (generated at build,
 * src/content/cardQr.ts) and a line to scan it. Under it: Flip, Save contact (a .vcf with the email,
 * the site and LinkedIn: never a phone number) and Share (the phone's share sheet, else copy the
 * link). Motion: the flip only (a turn on the long edge, ~0.65s; with reduced motion the sides swap).
 */
import { useId, useLayoutEffect, useRef, useState } from "react";
import { profile, site } from "@/content";
import { CARD_QR } from "@/content/cardQr";
import { LiveDot, Pill } from "@/components/ui";
import { CARD_ORG, CARD_ROLE, saveContact, shareCard } from "./contact";

const host = site.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

/**
 * The QR, made to belong on the card: a paper tile taped to the lime back at a slight angle, round
 * dots, rounded finder eyes, and the "PM" mark in the middle (ink, lime letters, the tangerine dot of
 * the site's wordmark). It still scans: error correction Q covers the mark (scripts/card-qr.mjs);
 * verify-card.mjs decodes it from a screenshot.
 */
function QrTile() {
  const { size, dots, eyes, logo } = CARD_QR;
  const mid = logo.at + logo.size / 2;
  return (
    <div className="relative shrink-0 -rotate-[3deg]">
      <span
        aria-hidden="true"
        className="absolute -top-2.5 left-1/2 z-10 h-5 w-14 -translate-x-1/2 rotate-[5deg] border-y border-ink/15 bg-paper-2/90"
        style={{
          clipPath:
            "polygon(0 0,4% 20%,0 40%,4% 60%,0 80%,4% 100%,100% 100%,96% 80%,100% 60%,96% 40%,100% 20%,96% 0)",
        }}
      />
      <svg
        role="img"
        aria-label={`QR code: ${site.url}`}
        data-qa="card-qr"
        viewBox={`-3 -3 ${size + 6} ${size + 6}`}
        className="block size-[clamp(8rem,6.6rem+5vw,9.5rem)] rounded-[12px] bg-paper text-ink shadow-[0_10px_18px_-12px_rgb(0_0_0/0.55)]"
      >
        <path d={dots} fill="currentColor" />
        {eyes.map(([x, y]) => (
          <g key={`${x}-${y}`} fill="currentColor">
            <path
              fillRule="evenodd"
              d={`M${x + 1.8} ${y}h3.4a1.8 1.8 0 0 1 1.8 1.8v3.4a1.8 1.8 0 0 1-1.8 1.8h-3.4a1.8 1.8 0 0 1-1.8-1.8v-3.4a1.8 1.8 0 0 1 1.8-1.8zM${x + 2} ${y + 1}h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z`}
            />
            <rect x={x + 2} y={y + 2} width="3" height="3" rx="1" />
          </g>
        ))}
        <rect
          x={logo.at + 0.6}
          y={logo.at + 0.6}
          width={logo.size - 1.2}
          height={logo.size - 1.2}
          rx="1.6"
          fill="currentColor"
        />
        <text
          x={mid - 0.35}
          y={mid + 1.15}
          textAnchor="middle"
          className="fill-lime font-display"
          fontSize="3.3"
          fontWeight="800"
          letterSpacing="-0.15"
        >
          PM
        </text>
        <circle
          cx={mid + 2}
          cy={mid - 1.2}
          r="0.55"
          className="fill-tangerine"
        />
      </svg>
      <span
        aria-hidden="true"
        className="absolute -right-3 -bottom-5 rotate-[-6deg] font-hand text-[1.25rem] leading-none font-bold whitespace-nowrap text-ink"
      >
        ↖ scan me
      </span>
    </div>
  );
}

export function VisitingCard({ tilt = false }: { tilt?: boolean }) {
  const uid = useId();
  const [flipped, setFlipped] = useState(false);
  // 3D only while it turns: at rest the card is flat (the side you see, no 3D layers), which old
  // graphics cards draw cleanly (a permanent 3D group left stale paint on his GeForce GT 610)
  const [turning, setTurning] = useState(false);
  const inner = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    // the flat side is in the DOM now: drop the finished turn (same frame, no flash)
    if (!turning && anim.current) {
      anim.current.cancel();
      anim.current = null;
    }
  }, [turning]);
  const flip = () => {
    if (turning) return;
    const next = !flipped;
    const el = inner.current;
    if (document.documentElement.classList.contains("rm") || !el?.animate) {
      setFlipped(next);
      return;
    }
    setTurning(true);
    requestAnimationFrame(() => {
      const a = el.animate(
        [
          { transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" },
          { transform: next ? "rotateY(180deg)" : "rotateY(0deg)" },
        ],
        {
          duration: 650,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards",
        },
      );
      anim.current = a;
      a.onfinish = () => {
        setFlipped(next);
        setTurning(false);
      };
    });
  };
  const [status, setStatus] = useState("");

  const onSave = () =>
    setStatus(
      saveContact()
        ? `Saved ${profile.name.replace(/\s+/g, "-")}.vcf: open it to add me to your contacts.`
        : "Couldn't save the file here. My email is " + profile.email + ".",
    );
  const onShare = async () => {
    const r = await shareCard();
    setStatus(
      r === "shared"
        ? "Shared. Thank you!"
        : r === "copied"
          ? "Link copied: paste it anywhere."
          : r === "cancelled"
            ? ""
            : `Couldn't share from here. The link is ${site.url}`,
    );
  };

  return (
    <div data-qa="visiting-card" className="min-w-0">
      <div
        role="group"
        aria-label={`${profile.name}'s visiting card, ${flipped ? "back" : "front"}`}
        className={`[perspective:1400px] ${tilt ? "origin-center -rotate-[4deg] lg:-rotate-[9deg]" : ""}`}
        data-tilt={tilt || undefined}
      >
        <div
          ref={inner}
          data-qa="card-inner"
          data-flipped={flipped || undefined}
          data-turning={turning || undefined}
          className={`relative aspect-[1.6] min-h-60 w-full ${turning ? "[transform-style:preserve-3d]" : ""} ${turning && flipped ? "[transform:rotateY(180deg)]" : ""}`}
        >
          {/* the front */}
          <div
            data-qa="card-front"
            aria-hidden={flipped || undefined}
            inert={flipped}
            className={`absolute inset-0 flex flex-col rounded-[16px] border border-ink/10 bg-paper p-5 text-ink shadow-[0_26px_40px_-24px_rgb(0_0_0/0.7)] sm:p-6 ${turning ? "[backface-visibility:hidden]" : flipped ? "invisible" : ""}`}
          >
            <p className="type-mono flex items-center justify-between gap-3 text-graphite">
              <span className="flex items-center gap-1.5">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="size-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 9.8 8 14 8 14z" />
                  <circle cx="8" cy="6.5" r="1.6" />
                </svg>
                {profile.location}
              </span>
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full bg-tangerine"
              />
            </p>
            <p className="mt-3 font-display text-[clamp(1.6rem,1.2rem+1.4vw,2.1rem)] leading-none font-extrabold tracking-[-0.035em]">
              {profile.name}
            </p>
            <svg
              aria-hidden="true"
              viewBox="0 0 160 10"
              className="mt-1 h-2.5 w-40 shrink-0 text-lime"
              preserveAspectRatio="none"
            >
              <path
                d="M3 6 C 50 2, 100 9, 157 4"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <p className="type-small mt-2 font-semibold">
              {CARD_ROLE}
              {CARD_ORG ? (
                <span className="font-normal text-graphite">
                  {" "}
                  at {CARD_ORG}
                </span>
              ) : null}
            </p>
            <p className="type-small mt-1 flex items-center gap-2 text-graphite">
              <LiveDot tone="lime" /> {profile.availability}
            </p>
            <div className="type-mono mt-auto grid gap-0.5 pt-3 text-graphite">
              <a
                href={`mailto:${profile.email}`}
                className="w-fit truncate underline decoration-line-strong underline-offset-2 hocus:text-ink hocus:decoration-ink"
              >
                {profile.email}
              </a>
              <span className="truncate">{host}</span>
            </div>
          </div>

          {/* the back */}
          <div
            data-qa="card-back"
            aria-hidden={!flipped || undefined}
            inert={!flipped}
            className={`absolute inset-0 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-[16px] bg-lime p-5 text-ink shadow-[0_26px_40px_-24px_rgb(0_0_0/0.7)] sm:gap-5 sm:p-6 ${turning ? "[backface-visibility:hidden] [transform:rotateY(180deg)]" : flipped ? "" : "invisible"}`}
          >
            <QrTile />
            <div className="min-w-0">
              <p className="font-display text-[clamp(1.2rem,1rem+0.8vw,1.5rem)] leading-[1.05] font-extrabold tracking-[-0.02em]">
                Scan for the whole story
              </p>
              <p className="type-small mt-2">
                Projects, the stack and the road so far, on your phone.
              </p>
              <p className="type-mono mt-3 inline-block max-w-full truncate rounded-[6px] bg-ink px-2 py-1 text-lime">
                {host}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex flex-wrap items-center gap-2.5 ${tilt ? "mt-7 lg:mt-11" : "mt-5"}`}
      >
        <Pill
          variant="outline"
          size="md"
          icon={null}
          onClick={flip}
          aria-pressed={flipped}
          data-qa="card-flip"
          iconBefore={
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3" />
            </svg>
          }
        >
          Flip
        </Pill>
        <Pill
          variant="lime"
          size="md"
          icon={null}
          onClick={onSave}
          data-qa="card-save"
          iconBefore={
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10" />
            </svg>
          }
        >
          Save contact
        </Pill>
        <button
          type="button"
          onClick={() => void onShare()}
          data-qa="card-share"
          aria-label="Share my card"
          title="Share"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-paper/40 text-paper transition-colors duration-(--dur-feedback) hocus:border-lime hocus:text-lime"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 10V2.5M5 5.5l3-3 3 3M3.5 8.5v4.5h9V8.5" />
          </svg>
        </button>
      </div>
      <p
        id={`${uid}-status`}
        role="status"
        data-qa="card-status"
        className="type-small mt-3 min-h-5 text-fog"
      >
        {status}
      </p>
    </div>
  );
}
