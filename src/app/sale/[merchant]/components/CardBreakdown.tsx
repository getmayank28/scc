"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BadgePercent,
  CalendarClock,
  Coins,
  CreditCard,
  Lock,
  Ticket,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import {
  ESTIMATOR_MAX,
  ESTIMATOR_MIN,
  ESTIMATOR_STEP,
  type MerchantConfig,
} from "../data/merchants";
import {
  bestCardRoute,
  computeCardRoutes,
  type BenefitRouteKey,
  type CardOffer,
} from "../data/savings";
import { inr } from "../utils/format";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { Reveal } from "../animations/Reveal";
import { CardCombobox, type CardOption } from "./CardCombobox";
import { SaleCTA } from "./SaleCTA";

const ROUTE_ICON: Record<BenefitRouteKey, LucideIcon> = {
  instant: BadgePercent,
  emi: CalendarClock,
  voucher: Ticket,
  swipe: Coins,
};

const DEFAULT_AMOUNT = 25000;
const clamp = (n: number) => Math.min(ESTIMATOR_MAX, Math.max(ESTIMATOR_MIN, n));

/**
 * Per-card benefit breakdown. The visitor picks any card they own (searchable),
 * enters an amount, and sees every public way that card can save during the
 * sale — instant discount, EMI discount, voucher route and direct-swipe rewards
 * — ranked, with the best highlighted. Honest by construction: the user selects
 * the card, so this is a public calculator, not a personalized claim.
 */
export function CardBreakdown({
  merchant,
  cards,
}: {
  merchant: MerchantConfig;
  cards: CardOffer[];
}) {
  const reduced = usePrefersReducedMotion();
  const [slug, setSlug] = useState<string | null>(cards[0]?.slug ?? null);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);

  const options = useMemo<CardOption[]>(
    () => cards.map((c) => ({ slug: c.slug, name: c.name, bank: c.bank })),
    [cards]
  );
  const card = useMemo(
    () => cards.find((c) => c.slug === slug) ?? null,
    [cards, slug]
  );
  const routes = useMemo(
    () => (card ? computeCardRoutes(card, amount) : []),
    [card, amount]
  );
  const best = bestCardRoute(routes);
  const maxSavings = routes.reduce((m, r) => Math.max(m, r.savings), 0);

  return (
    <section className="relative bg-background-primary px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-orange">
            Card breakdown
          </p>
          <h2 className="mt-3 font-satoshi text-3xl font-medium text-white sm:text-4xl">
            Know your card? See every way it saves.
          </h2>
          <p className="mt-4 text-white/60">
            Pick a card, enter your spend, and we&apos;ll break down every public{" "}
            {merchant.label} route — instant discount, EMI, vouchers and rewards.
          </p>
        </Reveal>

        <Reveal className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
          {/* card picker */}
          <label className="mb-2 block text-sm text-white/60">
            Select a credit card
          </label>
          <CardCombobox cards={options} value={slug} onChange={setSlug} />

          {/* amount control */}
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="breakdown-amount" className="text-sm text-white/60">
                Purchase amount
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-white/12 bg-white/[0.03] px-3 py-1.5 focus-within:border-primary-orange/60">
                <span className="text-white/50">₹</span>
                <input
                  id="breakdown-amount"
                  inputMode="numeric"
                  value={amount.toLocaleString("en-IN")}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, "");
                    setAmount(digits ? clamp(Number(digits)) : ESTIMATOR_MIN);
                  }}
                  className="w-24 bg-transparent text-right font-medium text-white tabular-nums outline-none"
                  aria-label="Purchase amount in rupees"
                />
              </div>
            </div>
            <Slider
              className="mt-4"
              value={[amount]}
              min={ESTIMATOR_MIN}
              max={ESTIMATOR_MAX}
              step={ESTIMATOR_STEP}
              onValueChange={(v) => setAmount(v[0])}
              aria-label="Purchase amount"
            />
          </div>

          {/* best route banner */}
          <AnimatePresence mode="wait">
            {best ? (
              <motion.div
                key={`${slug}-best-${best.key}`}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0 }}
                className="mt-7 flex items-center gap-3 rounded-2xl border border-primary-success/25 bg-primary-success/[0.07] p-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-success/15 text-secondary-success">
                  <Trophy className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wide text-white/50">
                    Best way to pay
                  </p>
                  <p className="truncate font-medium text-white">{best.label}</p>
                </div>
                <div className="text-right">
                  <p className="font-satoshi text-2xl font-medium text-secondary-success tabular-nums">
                    {inr(best.savings)}
                  </p>
                  <p className="text-xs text-white/50">you save</p>
                </div>
              </motion.div>
            ) : card ? (
              <p className="mt-7 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center text-sm text-white/50">
                No unlocked savings at this amount — try a higher spend to meet
                offer thresholds.
              </p>
            ) : null}
          </AnimatePresence>

          {/* all routes */}
          <div className="mt-4 space-y-2.5">
            <AnimatePresence initial={false} mode="popLayout">
              {routes.map((route) => {
                const Icon = ROUTE_ICON[route.key];
                const isBest = best?.key === route.key;
                return (
                  <motion.div
                    key={`${slug}-${route.key}`}
                    layout={!reduced}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0 }}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border p-4",
                      isBest
                        ? "border-primary-success/30 bg-primary-success/[0.04]"
                        : "border-white/10 bg-white/[0.02]"
                    )}
                  >
                    {/* proportional fill */}
                    <motion.div
                      aria-hidden
                      className={cn(
                        "absolute inset-y-0 left-0",
                        isBest ? "bg-primary-success/[0.08]" : "bg-primary-orange/[0.06]"
                      )}
                      initial={false}
                      animate={{
                        width: `${maxSavings > 0 ? (route.savings / maxSavings) * 100 : 0}%`,
                      }}
                      transition={{ type: "spring", stiffness: 200, damping: 30 }}
                    />
                    <div className="relative flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          isBest
                            ? "bg-primary-success/15 text-secondary-success"
                            : "bg-primary-orange/10 text-primary-orange"
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{route.label}</p>
                          {route.pct !== undefined && (
                            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/60">
                              {route.pct}%
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-white/50">
                          {route.detail}
                        </p>
                      </div>
                      <div className="text-right">
                        {route.eligible ? (
                          <p className="font-semibold text-white tabular-nums">
                            {inr(route.savings)}
                          </p>
                        ) : (
                          <p className="inline-flex items-center gap-1 text-xs text-white/45">
                            <Lock className="size-3" />
                            Locked
                          </p>
                        )}
                      </div>
                    </div>
                    {route.requirement && (
                      <p className="relative mt-2 pl-13 text-xs text-primary-orange/80">
                        {route.requirement}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* payoff */}
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary-orange/30 bg-primary-orange/[0.04] p-5 text-center">
            <p className="inline-flex items-center gap-2 text-sm text-white/80">
              <CreditCard className="size-4 text-primary-orange" />
              Own more than one card? We&apos;ll pick the winner across all of them.
            </p>
            <SaleCTA source="card-breakdown" size="lg">
              Compare all my cards
            </SaleCTA>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
