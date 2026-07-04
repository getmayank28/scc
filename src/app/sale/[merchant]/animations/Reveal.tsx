"use client";

import { motion, type Variants } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { fadeUp, inViewport, staticShow } from "./variants";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Variant to animate with; defaults to {@link fadeUp}. */
  variants?: Variants;
  /** Delay before this element reveals, in seconds. */
  delay?: number;
  /** Render as a stagger container instead of a leaf (children supply variants). */
  as?: "item" | "container";
  containerVariants?: Variants;
}

/**
 * Reveals its children with a `whileInView` entrance the first time they scroll
 * into view. Respects reduced-motion by rendering statically. Used for every
 * below-the-fold section so the page "comes alive" progressively.
 */
export function Reveal({
  children,
  className,
  variants = fadeUp,
  delay = 0,
  as = "item",
  containerVariants,
}: RevealProps) {
  const reduced = usePrefersReducedMotion();

  if (as === "container") {
    return (
      <motion.div
        className={className}
        variants={reduced ? staticShow : containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={inViewport}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={reduced ? staticShow : variants}
      initial="hidden"
      whileInView="show"
      viewport={inViewport}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </motion.div>
  );
}
