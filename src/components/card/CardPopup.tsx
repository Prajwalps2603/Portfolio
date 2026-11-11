"use client";

/**
 * "BEFORE YOU GO": the visiting card in a popup when a visitor heads off. A page can't show its own
 * popup when a tab is closed (browsers only allow their plain "Leave site?" box), so this is exit
 * intent: on a mouse, once the pointer leaves the page through the top edge (toward the tabs, the
 * address bar or the close button) after the visitor has been here a few seconds, the card opens.
 * Once per visit (sessionStorage), never over another dialog, never on touch screens (no pointer
 * to watch; there the card is in the contact section). The palette's "Take my card" opens it too
 * (a "pmp:card" event). Esc, the close button or a click outside closes it; focus returns.
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useSmoothScroll } from "@/lib/motion/SmoothScroll";
import { useReducedMotion } from "@/lib/motion/media";
import { VisitingCard } from "./VisitingCard";
import { CARD_EVENT } from "./contact";

const KEY = "pmp:card-popup";
/** how long a visitor has been on the page before leaving counts */
const ARM_MS = 6000;

export function CardPopup() {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLElement | null>(null);
  const { lock } = useSmoothScroll();
  const reduced = useReducedMotion();
  const openRef = useRef(false);

  const show = useCallback(() => {
    if (openRef.current) return;
    openRef.current = true;
    back.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setOpen(true);
    lock(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  }, [lock]);

  const close = useCallback(() => {
    if (!openRef.current) return;
    setShown(false);
    const done = () => {
      openRef.current = false;
      setOpen(false);
      lock(false);
      back.current?.focus?.({ preventScroll: true });
    };
    if (reduced) done();
    else window.setTimeout(done, 200);
  }, [lock, reduced]);

  // exit intent: the pointer leaves through the top edge
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let armed = false;
    const t = window.setTimeout(() => (armed = true), ARM_MS);
    const onOut = (e: MouseEvent) => {
      if (!armed || e.relatedTarget || e.clientY > 6) return;
      try {
        if (sessionStorage.getItem(KEY)) return;
      } catch {
        return;
      }
      if (document.querySelector('[aria-modal="true"]')) return;
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {}
      show();
    };
    document.addEventListener("mouseout", onOut);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mouseout", onOut);
    };
  }, [show]);

  // asked for (the palette's "Take my card")
  useEffect(() => {
    window.addEventListener(CARD_EVENT, show);
    return () => window.removeEventListener(CARD_EVENT, show);
  }, [show]);

  // focus the heading once it is up
  useEffect(() => {
    if (open)
      document.getElementById(`${uid}-title`)?.focus({ preventScroll: true });
  }, [open, uid]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const f = [
      ...panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((el) => !el.closest("[inert]") && el.getClientRects().length > 0);
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (
      e.shiftKey &&
      (document.activeElement === first ||
        document.activeElement ===
          panel.current?.querySelector(`#${CSS.escape(`${uid}-title`)}`))
    ) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;
  return (
    <div
      data-qa="card-popup"
      className="fixed inset-0 z-(--z-menu) grid place-items-center overflow-y-auto p-4"
    >
      <div
        aria-hidden="true"
        onClick={close}
        className={`fixed inset-0 bg-[rgb(8_8_7/0.72)] transition-opacity duration-200 reduced:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-desc`}
        data-tone="ink"
        onKeyDown={onKey}
        className={`relative w-full max-w-[30rem] rounded-[28px] border border-seam bg-ink p-6 text-paper transition duration-300 ease-arrive reduced:transition-none sm:p-8 ${shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          data-qa="card-popup-close"
          className="absolute top-4 right-4 grid size-10 place-items-center rounded-full text-fog hover:bg-seam hover:text-paper"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
        <p className="type-label text-tangerine">Before you go</p>
        <h2
          id={`${uid}-title`}
          tabIndex={-1}
          className="type-h3 mt-2 pr-10 text-paper outline-none"
        >
          Take my card with you.
        </h2>
        <p
          id={`${uid}-desc`}
          className="mt-1 font-hand text-[1.5rem] leading-tight font-bold text-lime"
        >
          flip it for the QR, or save it to your contacts
        </p>
        <div className="mt-6">
          <VisitingCard />
        </div>
        <p className="type-small text-fog">
          On the card: my email, site and LinkedIn. No phone number.
        </p>
      </div>
    </div>
  );
}
