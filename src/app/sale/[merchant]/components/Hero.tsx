"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ShieldCheck, Sparkles } from "lucide-react";
import type { MerchantConfig } from "../data/merchants";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { fadeUp, scaleIn, stagger, staticShow } from "../animations/variants";
import { SaleBackground } from "../animations/SaleBackground";
import { SaleCTA } from "./SaleCTA";
import { CreditCardVisual } from "./CreditCardVisual";

/**
 * Above-the-fold hero. Runs the page's entrance sequence: the eyebrow, headline,
 * subhead, CTA and trust row cascade in via a stagger container, while the card
 * visual scales in beside them. This is the first — and highest-stakes — beat of
 * the "come alive" landing animation.
 */
export function Hero({ merchant }: { merchant: MerchantConfig }) {
  const reduced = usePrefersReducedMotion();
  const container = reduced ? staticShow : stagger(0.12, 0.1);
  const item = reduced ? staticShow : fadeUp;

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-background-primary px-5 pb-16 pt-24 sm:px-8">
      <SaleBackground />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* copy column */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="text-center lg:text-left"
        >
          <motion.div
            variants={item}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary-orange/30 bg-primary-orange/10 py-1.5 pl-1.5 pr-4 text-sm text-primary-orange lg:mx-0"
          >
            {merchant.logo ? (
              <span className="flex size-6 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
                <Image
                  src={merchant.logo}
                  alt={merchant.label}
                  width={18}
                  height={18}
                  className="size-4.5 object-contain"
                />
              </span>
            ) : (
              <span className="relative ml-1.5 flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-orange/70" />
                <span className="relative inline-flex size-2 rounded-full bg-primary-orange" />
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              {merchant.saleName} is Live {merchant.emoji}
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-orange/70" />
                <span className="relative inline-flex size-2 rounded-full bg-primary-orange" />
              </span>
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="font-satoshi text-4xl font-medium leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Stop guessing which
            <br className="hidden sm:block" /> card to use
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg lg:mx-0"
          >
            We compare your credit cards against every live {merchant.label}{" "}
            offer and recommend the one that saves you the most
          </motion.p>

          <motion.div
            variants={reduced ? staticShow : scaleIn}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
          >
            <SaleCTA source="hero">Check My Best Card</SaleCTA>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50 lg:justify-start"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary-orange" />
              No card numbers stored
            </span>
            <span className="hidden h-4 w-px bg-white/15 sm:block" />
            <span>Works with cards you already own</span>
          </motion.div>
        </motion.div>

        {/* visual column */}
        <motion.div
          variants={reduced ? staticShow : scaleIn}
          initial="hidden"
          animate="show"
          transition={{ delay: reduced ? 0 : 0.35 }}
          className="relative mt-10 mb-14 lg:my-0"
        >
          {merchant.logo && (
            <motion.div
              className="absolute -top-4 right-2 z-20 flex items-center gap-2 rounded-2xl border border-black/5 bg-white px-3 py-2 shadow-xl shadow-black/40"
              initial={reduced ? false : { opacity: 0, y: -12, rotate: 6 }}
              animate={{ opacity: 1, y: 0, rotate: 5 }}
              transition={{ delay: reduced ? 0 : 0.7, type: "spring", stiffness: 200, damping: 16 }}
            >
              <Image
                src={merchant.logo}
                alt={merchant.label}
                width={26}
                height={26}
                className="size-6 rounded-md object-contain"
              />
              <span className="flex flex-col leading-tight">
                <span
                  className="text-sm font-bold"
                  style={{ color: merchant.brandColor ?? "#2874F0" }}
                >
                  {merchant.label}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  Sale offers
                </span>
              </span>
            </motion.div>
          )}
          <CreditCardVisual />
        </motion.div>
      </div>

      {/* scroll hint */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-6 mx-auto flex w-full justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <motion.div
            className="flex h-9 w-6 items-start justify-center rounded-full border border-white/25 p-1.5"
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="h-1.5 w-1 rounded-full bg-white/60" />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
