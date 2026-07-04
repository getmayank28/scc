"use client";

import { motion } from "motion/react";
import { Sparkles, Wifi } from "lucide-react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

/**
 * Hero focal visual: a stack of premium, non-branded credit cards with the top
 * card gently floating and catching light. Communicates "your cards" without
 * naming any real bank or copying a partner's brand. Float freezes under
 * reduced-motion.
 */
export function CreditCardVisual() {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="relative mx-auto aspect-[1.9/1] w-full max-w-sm [perspective:1200px]">
      {/* back cards for depth */}
      <div className="absolute inset-x-6 top-8 h-full rounded-2xl border border-white/10 bg-white/5 [transform:rotate(-8deg)]" />
      <div className="absolute inset-x-3 top-4 h-full rounded-2xl border border-white/10 bg-white/10 [transform:rotate(-4deg)]" />

      {/* top card */}
      <motion.div
        className="relative h-full w-full overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-black/50"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.30 0.09 45) 0%, oklch(0.20 0.05 40) 45%, oklch(0.15 0.02 40) 100%)",
        }}
        animate={
          reduced
            ? undefined
            : { y: [0, -10, 0], rotateZ: [0, -1.2, 0] }
        }
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* glare sweep */}
        {!reduced && (
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.18)_45%,transparent_60%)]"
            initial={{ x: "-100%" }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
          />
        )}

        {/* orange accent glow */}
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-orange/40 blur-2xl" />

        <div className="relative flex h-full flex-col justify-between p-5">
          <div className="flex items-start justify-between">
            <span className="font-satoshi text-lg font-medium text-white">
              FiSense
            </span>
            <Wifi className="size-5 rotate-90 text-white/70" />
          </div>

          {/* chip */}
          <div className="h-7 w-10 rounded-md bg-gradient-to-br from-amber-200 to-amber-500/80 shadow-inner" />

          <div className="space-y-3">
            <p className="font-mono text-sm tracking-[0.2em] text-white/80">
              ••••&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;7042
            </p>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-orange/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                <Sparkles className="size-3" />
                Best for this sale
              </span>
              <span className="text-xs text-white/50">VISA</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
