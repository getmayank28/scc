"use client";

import { motion } from "motion/react";
import { ShieldCheck, Sparkles, Ban } from "lucide-react";
import type { MerchantConfig } from "../data/merchants";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { Reveal } from "../animations/Reveal";
import { SaleBackground } from "../animations/SaleBackground";
import { SaleCTA } from "./SaleCTA";

/** Closing conversion section — one big, unmissable ask. */
export function FinalCTA({ merchant }: { merchant: MerchantConfig }) {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="relative overflow-hidden bg-background-primary px-5 py-24 sm:px-8">
      <SaleBackground />

      <Reveal className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.div
          initial={reduced ? false : { scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary-orange/30 bg-primary-orange/10 px-4 py-1.5 text-sm text-primary-orange"
        >
          <Sparkles className="size-4" />
          {merchant.saleName} won&apos;t wait
        </motion.div>

        <h2 className="font-satoshi text-4xl font-medium leading-tight text-white sm:text-5xl">
          Don&apos;t leave money
          <br />
          on the table.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/60">
          Sign in and we&apos;ll point you straight to the one card that saves
          you the most this {merchant.label} sale.
        </p>

        <div className="mt-9 flex justify-center">
          <SaleCTA source="final" size="xl">
            Unlock my best card
          </SaleCTA>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/50">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-primary-success" />
            Secure sign in
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-4 text-primary-orange" />
            Personalized recommendations
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Ban className="size-4 text-white/40" />
            No spam
          </span>
        </div>
      </Reveal>
    </section>
  );
}
