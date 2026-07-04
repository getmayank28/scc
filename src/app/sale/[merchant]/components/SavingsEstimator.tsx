"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Laptop,
  Lock,
  Shirt,
  Smartphone,
  Sofa,
  Tv,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import {
  CATEGORIES,
  ESTIMATOR_MAX,
  ESTIMATOR_MIN,
  ESTIMATOR_STEP,
  type MerchantConfig,
} from "../data/merchants";
import { topBankSavings, type MerchantOffer, type SavingKind } from "../data/savings";
import { inr } from "../utils/format";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { staticShow, stagger } from "../animations/variants";
import { Reveal } from "../animations/Reveal";
import { SaleCTA } from "./SaleCTA";

const ICONS: Record<string, LucideIcon> = {
  Smartphone,
  Laptop,
  Tv,
  WashingMachine,
  Shirt,
  Sofa,
};

const KIND_LABEL: Record<SavingKind, string> = {
  instant: "Instant discount",
  voucher: "Voucher benefit",
  reward: "Rewards",
};

/**
 * Interactive savings estimator. Pick a category, set a purchase amount, and see
 * real public offers ranked by rupee value — computed live from the sale
 * dataset. Crucially the framing stays honest: these are the *best offers that
 * exist*, and the payoff line drives home that only sign-in reveals which apply
 * to the cards the visitor actually holds.
 */
export function SavingsEstimator({
  merchant,
  offers,
}: {
  merchant: MerchantConfig;
  offers: MerchantOffer[];
}) {
  const reduced = usePrefersReducedMotion();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState(CATEGORIES[0].defaultAmount);

  const results = useMemo(
    () => topBankSavings(offers, amount, 3),
    [offers, amount]
  );
  const best = results[0]?.savings ?? 0;

  const selectCategory = (id: string) => {
    const next = CATEGORIES.find((c) => c.id === id);
    if (!next) return;
    setCategory(next);
    setAmount(next.defaultAmount);
  };

  return (
    <section className="relative bg-background-primary px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-orange">
            Savings estimator
          </p>
          <h2 className="mt-3 font-satoshi text-3xl font-medium text-white sm:text-4xl">
            What are you buying today?
          </h2>
          <p className="mt-4 text-white/60">
            See what the best public {merchant.label} offers are worth on your
            purchase. Sign in to find out which land on <em>your</em> cards.
          </p>
        </Reveal>

        <Reveal className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:mt-10 sm:p-8">
          {/* category chips */}
          <motion.div
            variants={reduced ? staticShow : stagger(0.04)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-3 gap-2.5 sm:grid-cols-6"
          >
            {CATEGORIES.map((c) => {
              const Icon = ICONS[c.icon];
              const active = c.id === category.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCategory(c.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-row items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary-orange/60",
                    active
                      ? "border-primary-orange/50 bg-primary-orange/10 text-white"
                      : "border-white/10 bg-transparent text-white/60 hover:border-white/25 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "hidden size-5 shrink-0 transition-colors sm:block",
                      active ? "text-primary-orange" : "text-white/50"
                    )}
                  />
                  {c.label}
                </button>
              );
            })}
          </motion.div>

          {/* amount control */}
          <div className="mt-6 sm:mt-8">
            <div className="flex items-end justify-between">
              <label className="text-sm text-white/60">Purchase amount</label>
              <div className="font-satoshi text-xl font-medium text-white tabular-nums sm:text-2xl">
                {inr(amount)}
              </div>
            </div>
            <Slider
              className="mt-3 sm:mt-4"
              value={[amount]}
              min={ESTIMATOR_MIN}
              max={ESTIMATOR_MAX}
              step={ESTIMATOR_STEP}
              onValueChange={(v) => setAmount(v[0])}
              aria-label="Purchase amount"
            />
            <div className="mt-2 flex justify-between text-xs text-white/40">
              <span>{inr(ESTIMATOR_MIN)}</span>
              <span>{inr(ESTIMATOR_MAX)}</span>
            </div>
          </div>

          {/* results: best public offer (left) + per-bank benefit cards (right) */}
          <div className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)] items-stretch gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-2">
            {/* headline result */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-primary-success/20 bg-primary-success/[0.06] p-4 text-center sm:p-6">
              <p className="inline-flex items-center justify-center gap-1.5 text-xs text-white/60 sm:text-sm">
                {merchant.logo && (
                  <span className="flex size-5 items-center justify-center overflow-hidden rounded-full bg-white">
                    <Image
                      src={merchant.logo}
                      alt={merchant.label}
                      width={14}
                      height={14}
                      className="size-3.5 object-contain"
                    />
                  </span>
                )}
                Best public {merchant.label} offer on this purchase
              </p>
              <div className="mt-1 flex items-baseline justify-center gap-1 font-satoshi text-3xl font-medium text-secondary-success sm:mt-2 sm:text-5xl">
                <span className="text-lg text-secondary-success/70 sm:text-2xl">up to</span>
                <AnimatedAmount value={best} reduced={reduced} />
              </div>
            </div>

            {/* per-bank breakdown */}
            <div className="min-w-0 space-y-2 sm:space-y-2.5">
              <AnimatePresence mode="popLayout">
                {results.map((r) => (
                  <motion.div
                    key={r.bank}
                    layout={!reduced}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0 }}
                    className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-3.5"
                  >
                    {/* proportional fill */}
                    <motion.div
                      aria-hidden
                      className="absolute inset-y-0 left-0 bg-primary-orange/10"
                      initial={false}
                      animate={{ width: `${best > 0 ? (r.savings / best) * 100 : 0}%` }}
                      transition={{ type: "spring", stiffness: 200, damping: 30 }}
                    />
                    <div className="relative flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white sm:text-base">
                          {r.bank}
                        </p>
                        <p className="text-[11px] text-white/50 sm:text-xs">
                          {KIND_LABEL[r.kind]}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-white tabular-nums sm:text-base">
                        {inr(r.savings)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* payoff */}
          <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary-orange/30 bg-primary-orange/[0.04] px-4 py-3.5 text-center sm:mt-6 sm:flex-row sm:justify-between sm:px-5 sm:py-4 sm:text-left">
            <p className="inline-flex items-center gap-2 text-xs text-white/80 sm:text-sm">
              <Lock className="size-4 shrink-0 text-primary-orange max-md:hidden" />
              These are the best offers that exist but not yet matched to you.
            </p>
            <SaleCTA source="estimator" size="lg" className="shrink-0" showArrow={false}>
              Sign in to match your cards
            </SaleCTA>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function AnimatedAmount({ value, reduced }: { value: number; reduced: boolean }) {
  if (reduced) return <span className="tabular-nums">{inr(value)}</span>;
  return (
    <span className="relative inline-flex overflow-hidden tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "60%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-60%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
        >
          {inr(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
