"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  BadgePercent,
  CalendarClock,
  Coins,
  CreditCard,
  Lock,
  ShieldCheck,
  Tag,
  Ticket,
  Truck,
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
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { inr } from "../utils/format";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { Reveal } from "../animations/Reveal";
import { SaleBackground } from "../animations/SaleBackground";
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
  const { track } = useAnalytics();
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

  const handleSelectCard = (next: string) => {
    setSlug(next);
    const picked = cards.find((c) => c.slug === next);
    if (picked) {
      track(EventName.SALE_CARD_SELECTED, {
        merchant: merchant.key,
        cardSlug: picked.slug,
        cardName: picked.name,
        bankName: picked.bank,
      });
    }
  };

  // Report the calculator outcome once the visitor settles on a card + amount.
  // Debounced so dragging the slider emits a single result event, not one per tick.
  useEffect(() => {
    if (!card) return;
    const id = setTimeout(() => {
      track(EventName.SALE_BREAKDOWN_RESULT_VIEWED, {
        merchant: merchant.key,
        cardSlug: card.slug,
        cardName: card.name,
        bankName: card.bank,
        amount,
        bestRoute: best?.label ?? null,
        bestSavings: best?.savings ?? null,
        routeCount: routes.length,
      });
    }, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, amount, best?.key, best?.savings, merchant.key]);

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-background-primary px-5 py-10 sm:px-8 sm:py-24">
      <SaleBackground />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">

          <h2 className="font-satoshi text-4xl font-medium leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Know your card?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Pick a card, enter your spend, and we&apos;ll break down every {" "}
            {merchant.label} best route for you to save
          </p>
        </Reveal>

        <Reveal className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-sm sm:mt-12 sm:p-8">
          {/* card picker */}
          <label className="mb-2 block text-sm text-white/60">
            Select a credit card
          </label>
          <CardCombobox cards={options} value={slug} onChange={handleSelectCard} />

          {/* amount control */}
          <div className="mt-5">
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

          {/* results: route options (left) + best way to pay (right) */}
          <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2.5 sm:mt-7 sm:gap-4 lg:grid-cols-2 lg:items-start">
            {/* all routes — left (below the summary on mobile) */}
            <div className="order-2 min-w-0 space-y-1.5 sm:space-y-2.5 lg:order-1">
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
                      "relative overflow-hidden rounded-2xl border p-2.5 sm:p-4",
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
                    <div className="relative flex items-center gap-2.5 sm:gap-3">
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10",
                          isBest
                            ? "bg-primary-success/15 text-secondary-success"
                            : "bg-primary-orange/10 text-primary-orange"
                        )}
                      >
                        <Icon className="size-4.5 sm:size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-white sm:text-base">
                            {route.label}
                          </p>
                          {route.pct !== undefined && (
                            <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/60">
                              {route.pct}%
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-white/50">
                          {route.detail}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {route.eligible ? (
                          <p className="text-sm font-semibold text-white tabular-nums sm:text-base">
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
                      <p className="relative mt-2 pl-11 text-xs text-primary-orange/80 sm:pl-13">
                        {route.requirement}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            </div>

            {/* best way to pay — right on desktop, on top on mobile */}
            <div className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-6">
              <AnimatePresence mode="wait">
                {best ? (
                  <motion.div
                    key={`${slug}-best-${best.key}`}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0 }}
                    className="flex items-center gap-3 rounded-2xl border border-primary-success/25 bg-primary-success/[0.07] p-4 text-left sm:flex-col sm:gap-3 sm:p-6 sm:text-center"
                  >
                    <span className=" hidden max-md:flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-success/15 text-secondary-success sm:size-12">
                      <Trophy className="size-5 sm:size-6 " />
                    </span>
                    <div className="min-w-0 flex-1 sm:flex-none">
                      <p className="text-[11px] uppercase tracking-wide text-white/50 sm:text-xs">
                        Best way to pay
                      </p>
                      <p className="truncate font-medium text-white sm:mt-1">
                        {best.label}
                      </p>
                    </div>
                    <div className="shrink-0 text-right sm:text-center">
                      <p className="font-satoshi text-xl font-medium text-secondary-success tabular-nums sm:text-3xl">
                        {inr(best.savings)}
                      </p>
                      <p className="text-[11px] text-white/50 sm:text-xs">you save</p>
                    </div>
                  </motion.div>
                ) : card ? (
                  <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center text-sm text-white/50 sm:p-6">
                    No unlocked savings at this amount — try a higher spend to
                    meet offer thresholds.
                  </p>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          {/* payoff */}
          <div className="mt-3 flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-primary-orange/30 bg-primary-orange/[0.04] px-4 py-3 text-center sm:mt-6 sm:flex-row sm:justify-between sm:gap-3 sm:px-5 sm:py-4 sm:text-left">
            <p className="inline-flex items-center gap-2 text-xs text-white/80 sm:text-sm">
              <CreditCard className="size-4 shrink-0 text-primary-orange max-md:hidden" />
              Own more than one card? We&apos;ll pick the winner across all of them.
            </p>
            <SaleCTA source="card-breakdown" merchant={merchant.key} size="lg" className="shrink-0" showArrow={false}>
              Compare all my cards
            </SaleCTA>
          </div>

          {/* Flipkart marketing + shop CTA — reassures the visitor this ties
              back to the real, live sale they can shop right now. Gated to
              Flipkart since the affiliate link is Flipkart-specific. */}
          {merchant.key === "flipkart" && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#2874F0]/30 bg-[#2874F0]/[0.08]">
            <div className="flex flex-col gap-3 p-3.5 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5 sm:text-left">
              <div className="flex items-start gap-3">
                {merchant.logo && (
                  <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm sm:flex">
                    <Image
                      src={merchant.logo}
                      alt={merchant.label}
                      width={26}
                      height={26}
                      className="size-6.5 object-contain"
                    />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-satoshi text-sm font-semibold text-white sm:text-base">
                    {merchant.label} GOAT Sale is live now
                  </p>
                  <p className="mt-0.5 text-xs text-white/60 sm:text-sm">
                    Lowest prices of the year on mobiles, electronics &amp;
                    fashion — your bank offer stacks right on top.
                  </p>
                  <div className="mt-2 hidden flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-white/55 sm:flex sm:justify-start">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="size-3.5 text-[#4d90ff]" />
                      {merchant.label} Assured
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Truck className="size-3.5 text-[#4d90ff]" />
                      Free delivery
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Tag className="size-3.5 text-[#4d90ff]" />
                      Extra bank offers
                    </span>
                  </div>
                </div>
              </div>

              <motion.a
                href="https://fktr.in/04oX9J5"
                target="_blank"
                rel="noopener noreferrer sponsored"
                data-cta-source="card-breakdown-flipkart"
                onClick={() =>
                  track(EventName.SALE_SHOP_CLICKED, {
                    merchant: merchant.key,
                    source: "card-breakdown-flipkart",
                  })
                }
                whileHover={reduced ? undefined : { scale: 1.03 }}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#2874F0] px-7 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(40,116,240,0.9)] transition-colors hover:bg-[#1a63e0] sm:text-base"
              >
                Go to {merchant.label}
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </motion.a>
            </div>
          </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
