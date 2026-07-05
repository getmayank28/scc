"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, BadgePercent, Check, Gift, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SAMPLE_OFFERS, type SampleOffer } from "../data/sampleOffers";
import type { SavingKind } from "../data/savings";
import type { MerchantConfig } from "../data/merchants";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { fadeUp, stagger, staticShow } from "../animations/variants";
import { Reveal } from "../animations/Reveal";

const KIND_ICON: Record<SavingKind, LucideIcon> = {
  instant: BadgePercent,
  voucher: Ticket,
  reward: Gift,
};

/**
 * Sample offer cards. Explicitly framed as *examples of what's live* — never as
 * the visitor's personalized result — to keep the pre-sign-in promise honest.
 */
export function SampleOffers({ merchant }: { merchant: MerchantConfig }) {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="relative bg-background-primary px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-orange">
            A taste of what&apos;s live
          </p>
          <p className="mt-4 text-white/60">
            Real offer types on the platform right now. Sign in to see which of
            these you can actually claim.
          </p>
        </Reveal>

        <Reveal
          as="container"
          containerVariants={reduced ? staticShow : stagger(0.08)}
          className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-4"
        >
          {SAMPLE_OFFERS.map((offer) => (
            <OfferCard key={`${offer.bank}-${offer.title}`} offer={offer} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function OfferCard({ offer }: { offer: SampleOffer }) {
  const reduced = usePrefersReducedMotion();
  const Icon = KIND_ICON[offer.kind];

  return (
    <motion.div
      variants={reduced ? staticShow : fadeUp}
      whileHover={reduced ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-3.5 transition-colors hover:border-primary-orange/30 sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-orange/10 px-2.5 py-1 text-xs font-medium text-primary-orange">
          <Icon className="size-3.5" />
          {offer.badge}
        </span>
        <span className="hidden text-[10px] uppercase tracking-wide text-white/30 sm:inline">
          Example
        </span>
      </div>

      <h3 className="mt-3 font-satoshi text-base font-medium text-white sm:mt-4 sm:text-lg">
        {offer.bank}
      </h3>
      <p className="text-xs text-white/50 sm:text-sm">{offer.title}</p>

      <ul className="mt-3 flex-1 space-y-1.5 sm:mt-4 sm:space-y-2">
        {offer.bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-2 text-xs text-white/75 sm:text-sm"
          >
            <Check className="mt-0.5 size-3.5 shrink-0 text-primary-success sm:size-4" />
            {b}
          </li>
        ))}
      </ul>

      <p className="mt-3 hidden text-xs text-white/40 sm:mt-4 sm:block">
        {offer.note}
      </p>

      <Link
        href="/sign-in?callbackUrl=%2Fsale%2Fcontinue"
        data-cta-source="sample-offer"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-orange transition-colors hover:text-primary-orange/80 sm:mt-4 sm:text-sm"
      >
        Learn more
        <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:size-4" />
      </Link>
    </motion.div>
  );
}
