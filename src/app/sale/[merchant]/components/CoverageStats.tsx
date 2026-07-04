"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { COVERAGE_FEATURES, COVERAGE_STATS, type MerchantConfig } from "../data/merchants";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { fadeUpSm, stagger, staticShow } from "../animations/variants";
import { Reveal } from "../animations/Reveal";
import { CountUp } from "../animations/CountUp";

/**
 * Trust / coverage band. Animated stat cards prove breadth of coverage; the
 * dynamic "live offers" figure is derived from the real dataset so the claim is
 * grounded, not marketing.
 */
export function CoverageStats({
  merchant,
  liveOfferCount,
}: {
  merchant: MerchantConfig;
  liveOfferCount: number;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="relative bg-background-primary px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-orange">
            Coverage you can trust
          </p>
          <h2 className="mt-3 font-satoshi text-3xl font-medium text-white sm:text-4xl">
            Every major card. Every live offer.
          </h2>
          <p className="mt-4 text-white/60">
            We track the full {merchant.label} offer landscape so nothing that
            could save you money slips through.
          </p>
        </Reveal>

        <Reveal
          as="container"
          containerVariants={reduced ? staticShow : stagger(0.08)}
          className="mt-12 grid grid-cols-3 gap-3 sm:gap-4"
        >
          {COVERAGE_STATS.map((stat) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
            />
          ))}
          <StatCard
            value={liveOfferCount}
            suffix="+"
            label="Live offers"
            highlight
          />
        </Reveal>

        <Reveal
          as="container"
          containerVariants={reduced ? staticShow : stagger(0.05)}
          className="mt-6 hidden flex-wrap justify-center gap-2.5 sm:flex"
        >
          {COVERAGE_FEATURES.map((feature) => (
            <motion.span
              key={feature}
              variants={reduced ? staticShow : fadeUpSm}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm text-white/80"
            >
              <Check className="size-3.5 text-primary-success" />
              {feature}
            </motion.span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function StatCard({
  value,
  suffix,
  label,
  highlight,
}: {
  value: number;
  suffix: string;
  label: string;
  highlight?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      variants={reduced ? staticShow : fadeUpSm}
      whileHover={reduced ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={[
        "rounded-2xl border p-3 text-center backdrop-blur-sm transition-colors sm:p-6",
        highlight
          ? "border-primary-orange/30 bg-primary-orange/[0.08]"
          : "border-white/10 bg-white/[0.03] hover:border-white/20",
      ].join(" ")}
    >
      <div className="flex items-baseline justify-center font-satoshi text-2xl font-medium text-white sm:text-4xl lg:text-5xl">
        <CountUp value={value} />
        <span className={highlight ? "text-primary-orange" : "text-white/70"}>
          {suffix}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-white/60 sm:mt-2 sm:text-sm">{label}</p>
    </motion.div>
  );
}
