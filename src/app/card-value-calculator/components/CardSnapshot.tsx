"use client";
import { motion } from "motion/react";
import {
  Award,
  CreditCard,
  Plane,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { formatINR } from "../logic";
import type { CalculatorResult } from "../types";
import { cn } from "@/lib/utils";

type Props = {
  result: CalculatorResult;
};

export function CardSnapshot({ result }: Props) {
  const { card } = result;
  const stats = [
    {
      icon: <Wallet className="size-4" />,
      label: "Annual fee",
      value: formatINR(card.annualFee),
    },
    {
      icon: <ShieldCheck className="size-4" />,
      label: "Fee waiver",
      value: formatINR(card.feeWaiverSpend),
    },
    {
      icon: <Sparkles className="size-4" />,
      label: "Effective rate",
      value: `${(card.rewardRatePct * 0.6 + card.bonusCategoryRatePct * 0.4).toFixed(2)}%`,
    },
    {
      icon: <Plane className="size-4" />,
      label: "Lounge visits",
      value:
        card.loungeVisitsDomestic + card.loungeVisitsInternational > 0
          ? `${card.loungeVisitsDomestic + card.loungeVisitsInternational}/yr`
          : "None",
    },
  ];

  return (
    <GlassCard className="p-5 md:p-8" glow>
      <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative aspect-[1.6/1] w-full max-w-sm overflow-hidden rounded-2xl md:max-w-[340px]"
          style={{
            background: `linear-gradient(135deg, ${card.cardGradient.includes("from-") ? "" : ""})`,
          }}
        >
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              card.cardGradient
            )}
          />
          <div
            aria-hidden
            className="absolute -right-12 -top-12 size-48 rounded-full blur-3xl"
            style={{ background: `${card.accent}40` }}
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4), transparent 40%)",
            }}
          />

          <div className="relative flex h-full flex-col justify-between p-5 md:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/55">
                  {card.bank}
                </div>
                <div className="mt-1 text-xl font-bold text-white md:text-2xl">
                  {card.name}
                </div>
              </div>
              <div
                className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: `${card.accent}25`,
                  color: card.accent,
                }}
              >
                {card.network}
              </div>
            </div>

            <div>
              <div
                className="font-mono text-base tracking-[0.25em] text-white/80 md:text-lg"
                aria-hidden
              >
                •••• 4892
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70"
                  style={{ color: card.accent }}
                >
                  {card.emblem}
                </div>
                <CreditCard className="size-5 text-white/40" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary-orange">
              <Award className="size-3.5" /> Card snapshot
            </div>
            <h3 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              {card.bank} {card.name}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              {card.bonusCategoryRatePct.toFixed(1)}% on{" "}
              <span className="text-white/80">{card.bonusCategoriesLabel}</span>
              {" · "}
              {card.tier === "super-premium"
                ? "Top-tier lifestyle benefits."
                : card.tier === "premium"
                  ? "Solid travel and rewards mix."
                  : "Reliable daily driver."}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex items-center gap-1.5 text-white/45">
                  {s.icon}
                  <span className="text-[10px] uppercase tracking-wider">
                    {s.label}
                  </span>
                </div>
                <div className="mt-1.5 text-base font-bold text-white">
                  {s.value}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
