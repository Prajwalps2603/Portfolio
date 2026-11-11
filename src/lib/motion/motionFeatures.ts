/**
 * Motion's animation features (animate / exit / variants), loaded on demand by <MotionLite>.
 * Kept in its own module so the bundler puts it in a lazy chunk: the initial page only ships the
 * tiny `m` components and AnimatePresence (see ./lazyMotion.tsx).
 */
import { domAnimation } from "motion/react";

export default domAnimation;
