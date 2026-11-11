"use client";

import { useEffect, useState } from "react";
import type { WorkState } from "./viewStore";

/** A scroll asked for in the same moment as the turn has started within this window. */
const START_MS = 120;
/** The page counts as still once no scroll has happened for this long. */
const STILL_MS = 140;
/** The longest a shared turn waits. */
const MAX_MS = 3000;

/** Calls `cb` once the page has stopped scrolling (after START_MS when it never started). Returns a cancel. */
function whenStill(cb: () => void): () => void {
  let idle = window.setTimeout(done, START_MS);
  const max = window.setTimeout(done, MAX_MS);
  function onScroll() {
    window.clearTimeout(idle);
    idle = window.setTimeout(done, STILL_MS);
  }
  function cancel() {
    window.clearTimeout(idle);
    window.clearTimeout(max);
    window.removeEventListener("scroll", onScroll);
  }
  function done() {
    cancel();
    cb();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  return cancel;
}

/**
 * The work state as the stacked cards show it. A card's own turn shows at once; a shared turn
 * (the palette's "Show how my projects are built", which also scrolls to #work) waits until the
 * page has stopped scrolling.
 *
 * Why: the architecture side is taller (on a phone every card grows by a few hundred px). Grown
 * while the browser's smooth scroll is on its way to #work, the new page height makes ScrollTrigger
 * refresh (lib/motion/SmoothScroll), and its measuring pass resets the scroll position, which
 * cancels the smooth scroll halfway: from Contact it stopped ~1,500px into the cards. Waiting, the
 * visitor lands on the section first, then watches the card in view turn over.
 */
export function useLanded(live: WorkState): WorkState {
  const [landed, setLanded] = useState(live);
  const same = live.seq === landed.seq;
  useEffect(() => {
    if (same) {
      // keep the last state shown, so a shared turn waits on top of every card's own turn
      if (live !== landed) setLanded(live);
      return;
    }
    return whenStill(() => setLanded(live));
  }, [same, live, landed]);
  return same ? live : landed;
}
