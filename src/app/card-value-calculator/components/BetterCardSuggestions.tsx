"use client";
import { motion } from "motion/react";
import { ArrowRight, Plane, Sparkles, TrendingUp } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { formatINR } from "../logic";
import type { CalculatorResult, CreditCard } from "../types";
import { cn } from "@/lib/utils";

type Props = {
  result: CalculatorResult;
  suggestions: CreditCard[];
  onCompare: () => void;
};

export function BetterCardSuggestions({ result, suggestions, onCompare }: Props) {
  return (
    <GlassCard className="p-5 md:p-8">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary-orange">
            <Sparkles className="size-3.5" /> Better matches
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white md:text-2xl">
            Cards that could earn you more
          </h3>
          <p className="mt-1 text-sm text-white/55">
            Based on {result.travelerLabel.toLowerCase()} habits and a yearly
            spend of {formatINR(result.yearlySpend)}.
          </p>
        </div>
        <button
          onClick={onCompare}
          className="group mt-3 inline-flex w-fit items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-primary-orange/40 hover:bg-primary-orange/10 md:mt-0"
        >
          Compare cards
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="mt-6 -mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {suggestions.map((card, i) => {
          const expectedRewards = Math.round(
            (result.yearlySpend *
              (card.rewardRatePct * 0.6 + card.bonusCategoryRatePct * 0.4)) /
              100
          );
          const delta = expectedRewards - result.rewardsValue;
          const better = delta > 0;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className="snap-start"
            >
              <div className="group relative h-full w-[280px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05] md:w-auto">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-30 blur-3xl transition group-hover:opacity-60"
                  style={{ background: card.accent }}
                />

                <div
                  className={cn(
                    "relative aspect-[1.6/1] w-full overflow-hidden rounded-xl bg-gradient-to-br",
                    card.cardGradient
                  )}
                >
                  <div className="absolute inset-0 flex flex-col justify-between p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[9px] uppercase tracking-widest text-white/60">
                          {card.bank}
                        </div>
                        <div className="mt-0.5 text-base font-bold text-white">
                          {card.name}
                        </div>
                      </div>
                      <div
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                        style={{
                          background: `${card.accent}30`,
                          color: card.accent,
                        }}
                      >
                        {card.network}
                      </div>
                    </div>
                    <div
                      className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-70"
                      style={{ color: card.accent }}
                    >
                      {card.emblem}
                    </div>
                  </div>
                </div>

                <div className="relative mt-4 grid gap-2.5">
                  <Row
                    icon={<TrendingUp className="size-3.5" />}
                    label="Expected rewards"
                    value={formatINR(expectedRewards)}
                    delta={
                      better
                        ? `+${formatINR(delta)}`
                        : delta < 0
                          ? formatINR(delta)
                          : null
                    }
                    deltaTone={better ? "good" : "bad"}
                  />
                  <Row
                    icon={<Plane className="size-3.5" />}
                    label="Lounge visits"
                    value={`${
                      card.loungeVisitsDomestic + card.loungeVisitsInternational
                    } / year`}
                  />
                  <Row
                    label="Annual fee"
                    value={formatINR(card.annualFee)}
                    delta={
                      card.annualFee < result.card.annualFee
                        ? "Cheaper"
                        : card.annualFee > result.card.annualFee
                          ? "Premium"
                          : null
                    }
                    deltaTone={
                      card.annualFee <= result.card.annualFee ? "good" : "neutral"
                    }
                  />
                </div>

                {better && (
                  <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                    <Sparkles className="size-3" /> Better than your current card
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function Row({
  icon,
  label,
  value,
  delta,
  deltaTone,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  delta?: string | null;
  deltaTone?: "good" | "bad" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-1.5 text-white/50">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white">{value}</span>
        {delta && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              deltaTone === "good" && "bg-emerald-400/15 text-emerald-300",
              deltaTone === "bad" && "bg-rose-400/15 text-rose-300",
              deltaTone === "neutral" && "bg-white/10 text-white/65"
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
