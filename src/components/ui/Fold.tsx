"use client";

import { createContext, useContext, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ChevronDown } from "@/components/icons";

/**
 * Phone folds: long lists fold behind a toggle on phones only, so the home page stays a sensible
 * length. The folding itself is CSS (globals.css "PHONE FOLDS", phones + html.js only), so the
 * server HTML is complete, nothing shifts at hydration, and without JavaScript every row shows.
 *
 *   <Fold>                                   // data-fold, data-open once expanded
 *     <ul id="x" data-fold-list>…</ul>       // rows after the first four fold away
 *     <FoldToggle controls="x" more="Show all 9" less="Show fewer" />
 *   </Fold>
 *
 * Mark a block that folds away entirely with data-fold-rest instead of data-fold-list.
 * Fold renders a server-safe wrapper; children can be Server Components.
 */
type FoldState = { open: boolean; toggle: () => void };
const FoldContext = createContext<FoldState | null>(null);

export function Fold({ children, className }: { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <FoldContext.Provider value={{ open, toggle: () => setOpen((o) => !o) }}>
      <div data-fold="" data-open={open ? "" : undefined} className={className}>
        {children}
      </div>
    </FoldContext.Provider>
  );
}

type FoldToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onClick"> & {
  /** id of the folded list or block. */
  controls: string;
  more: ReactNode;
  less: ReactNode;
};

/** The button (phones + JS only, see globals.css). Collapsing keeps the button in view. */
export function FoldToggle({ controls, more, less, className, ...rest }: FoldToggleProps) {
  const fold = useContext(FoldContext);
  const ref = useRef<HTMLButtonElement>(null);
  const open = fold?.open ?? false;
  return (
    <button
      ref={ref}
      type="button"
      data-fold-toggle=""
      aria-expanded={open}
      aria-controls={controls}
      onClick={() => {
        fold?.toggle();
        // Folding removes rows above the button: bring it back under the finger (centred, so the
        // fixed header never covers it).
        if (open) requestAnimationFrame(() => ref.current?.scrollIntoView({ block: "center" }));
      }}
      className={`items-center gap-2 ${className ?? ""}`}
      {...rest}
    >
      <span>{open ? less : more}</span>
      <ChevronDown size={18} className={`shrink-0 transition-transform duration-(--dur-ui) ease-arrive reduced:transition-none ${open ? "rotate-180" : ""}`} />
    </button>
  );
}
