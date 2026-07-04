import type { Variants, Transition } from "motion/react";

/**
 * Shared motion variants for the sale landing page. Every transition uses only
 * `opacity` and `transform` so animation stays on the compositor thread and off
 * the main thread — cheap, 60fps, and Lighthouse-friendly.
 *
 * All movement is authored to gracefully collapse under `prefers-reduced-motion`:
 * components read {@link usePrefersReducedMotion} and swap in {@link staticShow}.
 */

const EASE_OUT: Transition["ease"] = [0.16, 1, 0.3, 1];
const SPRING: Transition = { type: "spring", stiffness: 260, damping: 26, mass: 0.9 };

/** Fade + rise. The workhorse entrance. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

/** Softer, smaller rise for dense grids. */
export const fadeUpSm: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

/** Scale-in for hero CTA and focal cards. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: SPRING },
};

/** No-op variant used when the visitor prefers reduced motion. */
export const staticShow: Variants = {
  hidden: { opacity: 1 },
  show: { opacity: 1 },
};

/** Stagger container — children reveal in sequence. */
export const stagger = (staggerChildren = 0.09, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

/** Standard `whileInView` viewport config: fire once, a little before fully visible. */
export const inViewport = { once: true, amount: 0.3, margin: "0px 0px -80px 0px" } as const;
