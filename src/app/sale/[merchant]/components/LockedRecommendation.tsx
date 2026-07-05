"use client";

import { motion } from "motion/react";
import { Lock, Sparkles } from "lucide-react";
import type { MerchantConfig } from "../data/merchants";
import { inr } from "../utils/format";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { Reveal } from "../animations/Reveal";
import { SaleBackground } from "../animations/SaleBackground";
import { SaleCTA } from "./SaleCTA";

/**
 * Locked recommendation. Deliberately teases a *real* achievable number (derived
 * from the dataset) behind a frosted lock so it stokes curiosity without ever
 * claiming to know the visitor's actual cards — the card name stays blurred.
 */
export function LockedRecommendation({
  merchant,
  potentialSaving,
}: {
  merchant: MerchantConfig;
  potentialSaving: number;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="relative overflow-hidden bg-background-primary px-5 py-20 sm:px-8">
      <SaleBackground />

      <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-orange">
            One card wins this sale
          </p>
          <h2 className="mt-3 font-satoshi text-3xl font-medium text-white sm:text-4xl">
            Your best card is ready. It just needs a name.
          </h2>
          <p className="mt-4 text-white/60">
            We&apos;ve already lined up every live {merchant.label} offer. The
            moment you sign in, we match them to the cards you own and reveal the
            single card that saves you the most.
          </p>
          <div className="mt-7 hidden lg:block">
            <SaleCTA source="locked" merchant={merchant.key}>Unlock my best card</SaleCTA>
          </div>
        </Reveal>

        {/* the locked card */}
        <Reveal>
          <motion.div
            whileHover={reduced ? undefined : { y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6"
          >
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Sparkles className="size-4 text-primary-orange" />
              Your best card
            </div>

            {/* blurred card name */}
            <div className="mt-3 space-y-2" aria-label="Card name hidden until sign in">
              <div className="h-6 w-3/4 rounded-md bg-white/15 blur-[6px]" />
              <div className="h-4 w-1/2 rounded-md bg-white/10 blur-[5px]" />
            </div>

            <div className="mt-7">
              <p className="text-sm text-white/50">Potential savings this sale</p>
              <div className="mt-1 flex items-baseline gap-1 font-satoshi text-5xl font-medium text-secondary-success">
                <span className="text-2xl text-secondary-success/70">up to</span>
                {inr(potentialSaving)}
              </div>
            </div>

            {/* shimmer sweep over the whole card */}
            {!reduced && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.08)_50%,transparent_60%)]"
                initial={{ x: "-100%" }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
              />
            )}

            {/* lock chip */}
            <div className="mt-7 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/30 py-3 text-sm text-white/70 backdrop-blur-sm">
              <Lock className="size-4 text-primary-orange" />
              Unlock after sign in
            </div>
          </motion.div>

          <div className="mt-7 lg:hidden">
            <SaleCTA source="locked" merchant={merchant.key} block>
              Unlock my best card
            </SaleCTA>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
