import { gsap } from "@/lib/motion/gsap";
import { DUR, EASE, STAGGER } from "@/lib/motion/eases";
import { resetScopeToUntriggered, scope, stage, wakeScope } from "@/lib/stores/stage";

export type LockTargets = {
  /** The name (sample-and-hold). */
  name: HTMLElement;
  /** "Full Stack Developer" (beam wipe). */
  role: HTMLElement | null;
  /** Everything else that waits for the lock, in DOM order (hero + top-bar [data-boot]). */
  chrome: HTMLElement[];
  /** The top-bar status: it must be readable while it says AUTO. */
  status: HTMLElement[];
};

/** Snap a phase to the nearest whole period of its waveform (the trigger aligning phases). */
const snap = (v: number, cycles: number) => Math.round(v * cycles) / cycles;

/**
 * THE LOCK: one master timeline, ~2.5s at timeScale 1 (docs/MOTION.md §5, spec openingSequence).
 * Tightened in refinement round 1: the name is readable by ~1.1s instead of ~2.2s, and the
 * scroll lock lifts ~0.5s sooner. Every curve is a named EASE token.
 *
 *    0-150ms  beam powers on (head, EASE.probe); the top-bar status appears, reading AUTO
 *  150-1050   beam sweeps (beam ease) drawing the raw composite; graticule follows it
 *  620-1090   the name resolves by sample-and-hold WHILE the beam draws: 24 / 12 (40 + 50ms,
 *             dimmed) then 6 / 3px, then solid (hard steps). Readable from the 6px step (~710ms).
 * 1050-1450   free-run: the trace rolls at 0.32 widths/s, AUTO blinks
 *     1450    trigger: TRIG'D, roll stops in 180ms (EASE.probe), phases snap, noise -> 0.6% (lock)
 * 1300-2000   "Full Stack Developer" beam-wipes in
 * 1500-2100   split into CH1-CH4 + Σ (lock)
 * 1750-2500   chrome arrives: 10px slide + fade, 35ms stagger (panel)
 *
 * The scene reads `scope.signal` every frame; onUpdate wakes it so a converged loop renders.
 */
export function buildLockTimeline({ name, role, chrome, status }: LockTargets) {
  const s = scope.signal;
  resetScopeToUntriggered();
  s.head = 0;
  stage.set({ trigger: "auto" });

  // Hidden states are set here, by JS (the CSS boot rules only cover the frames before this).
  if (chrome.length) gsap.set(chrome, { autoAlpha: 0, x: -10 });
  if (status.length) gsap.set(status, { autoAlpha: 0 });
  if (role) gsap.set(role, { "--rp": 0 });

  const tl = gsap.timeline({ onUpdate: wakeScope });

  tl.to(s, { head: 1, duration: 0.15, ease: EASE.probe }, 0);
  if (status.length) tl.to(status, { autoAlpha: 1, duration: 0.3, ease: EASE.panel }, 0.05);
  tl.to(s, { reveal: 1, grat: 1, duration: DUR.beam, ease: EASE.beam }, 0.15)
    .to(s, { head: 0, duration: 0.3, ease: EASE.out }, 1.05)
    .call(
      () => {
        s.locked = true;
        stage.set({ trigger: "locked" });
      },
      undefined,
      1.45,
    )
    .to(s.speed, { 0: 0, 1: 0, 2: 0, 3: 0, duration: 0.18, ease: EASE.probe }, 1.45)
    .to(s, { noise: 0.006, duration: 0.5, ease: EASE.lock }, 1.45)
    // function values resolve when the playhead arrives, i.e. after the roll has stopped
    .to(
      s.roll,
      {
        0: () => snap(s.roll[0], 3),
        1: () => snap(s.roll[1], 6),
        2: () => snap(s.roll[2], 3),
        3: () => snap(s.roll[3], 26),
        duration: 0.5,
        ease: EASE.lock,
      },
      1.63,
    )
    .to(s, { split: 1, duration: 0.6, ease: EASE.lock }, 1.5);

  // Sample-and-hold: hard steps, never tweens (sampling is discrete). Round 2: the two coarse
  // pitches flash by (40ms + 50ms, at lowered contrast) so the unreadable window is ~90ms instead
  // of ~340ms; the readable 6px and 3px steps hold longer, and the name is solid at ~1.1s.
  const sampleAt = 0.62;
  const steps: { at: number; pitch: number; alpha: number }[] = [
    { at: 0, pitch: 24, alpha: 0.38 },
    { at: 0.04, pitch: 12, alpha: 0.62 },
    { at: 0.09, pitch: 6, alpha: 1 },
    { at: 0.27, pitch: 3, alpha: 1 },
  ];
  const solidAt = sampleAt + 0.47;
  name.setAttribute("data-sampling", "");
  name.style.setProperty("--sw", "0px");
  name.style.setProperty("--sp", "24px");
  steps.forEach(({ at, pitch, alpha }) => {
    tl.call(
      () => {
        name.style.setProperty("--sp", `${pitch}px`);
        name.style.setProperty("--sw", "2px");
        name.style.opacity = alpha < 1 ? String(alpha) : "";
      },
      undefined,
      sampleAt + at,
    );
  });
  // Solid. html.booting would mask the name again until finishBoot(), so hold it solid
  // explicitly with a slice as wide as its pitch (index.tsx clears it after the boot).
  tl.call(
    () => {
      name.removeAttribute("data-sampling");
      name.style.opacity = "";
      name.style.setProperty("--sw", "3px");
      name.style.setProperty("--sp", "3px");
    },
    undefined,
    solidAt,
  );

  if (role) tl.to(role, { "--rp": 1, duration: DUR.beamWipe, ease: EASE.beam }, 1.3);
  if (chrome.length) {
    tl.to(
      chrome,
      {
        autoAlpha: 1,
        x: 0,
        duration: DUR.panel,
        ease: EASE.panel,
        stagger: STAGGER.chrome,
        clearProps: "opacity,visibility,transform",
      },
      1.75,
    );
  }
  return tl;
}
