"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

/**
 * Ambient animated backdrop for the hero: two slow-drifting orange glow blobs
 * over a faint radial vignette. Pure transform/opacity animation on blurred
 * layers — no canvas, no per-frame JS — so it's effectively free on the main
 * thread. Freezes to a static gradient under reduced-motion.
 */
export function SaleBackground({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();

  const drift = (dx: number, dy: number) =>
    reduced
      ? undefined
      : {
          x: [0, dx, 0],
          y: [0, dy, 0],
        };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden
    >
      {/* base vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.28_0.06_45/0.55),transparent_60%)]" />

      {/* primary orange glow */}
      <motion.div
        className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary-orange/25 blur-[120px]"
        animate={drift(60, 40)}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* secondary amber glow */}
      <motion.div
        className="absolute -right-24 top-24 h-[28rem] w-[28rem] rounded-full bg-tertiary-orange/20 blur-[130px]"
        animate={drift(-50, 60)}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* cool balancing glow, low opacity */}
      <motion.div
        className="absolute -left-24 bottom-0 h-[26rem] w-[26rem] rounded-full bg-secondary-orange/25 blur-[130px]"
        animate={drift(40, -40)}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* subtle top fade into the page background */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background-primary" />
    </div>
  );
}
