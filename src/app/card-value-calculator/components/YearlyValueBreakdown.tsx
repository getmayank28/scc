"use client";
import { motion } from "motion/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Gift,
  Plane,
  Trophy,
  Wallet,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { CountUp } from "./CountUp";
import { formatINR } from "../logic";
import type { CalculatorResult } from "../types";
import { cn } from "@/lib/utils";

type Props = { result: CalculatorResult };

export function YearlyValueBreakdown({ result }: Props) {
  const positive = result.netValue >= 0;
  const lineItems = [
    {
      icon: <Gift className="size-4" />,
      label: "Rewards earned",
      value: result.rewardsValue,
      tone: "positive" as const,
    },
    {
      icon: <Plane className="size-4" />,
      label: "Lounge benefit",
      value: result.loungeValue,
      tone: "positive" as const,
    },
    {
      icon: <Trophy className="size-4" />,
      label: "Milestone benefits",
      value: result.milestoneValue,
      tone: "positive" as const,
    },
    {
      icon: <Wallet className="size-4" />,
      label: result.feeWaived ? "Annual fee (waived)" : "Annual fee",
      value: -result.annualFee,
      tone: "negative" as const,
      muted: result.feeWaived,
    },
  ];

  return (
    <GlassCard className="p-5 md:p-8" glow>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary-orange">
            <Trophy className="size-3.5" /> Yearly value breakdown
          </div>

          <div className="mt-3">
            <div className="text-xs text-white/45">
              Estimated Net Yearly Value
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <CountUp
                value={result.netValue}
                format={(n) => formatINR(n)}
                className={cn(
                  "text-5xl font-extrabold tracking-tight md:text-6xl",
                  positive ? "text-white" : "text-rose-300"
                )}
              />
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                  positive
                    ? "bg-emerald-400/15 text-emerald-300"
                    : "bg-rose-400/15 text-rose-300"
                )}
              >
                {positive ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {positive ? "Net Positive" : "Net Negative"}
              </span>
            </div>
            <div className="mt-2 text-xs text-white/45">
              On yearly spend of{" "}
              <span className="text-white/80">
                {formatINR(result.yearlySpend)}
              </span>
            </div>
          </div>

          <BoardingPass result={result} />
        </div>

        <div className="flex flex-col justify-center gap-2">
          {lineItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
              className={cn(
                "flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-white/15 hover:bg-white/[0.05]",
                item.muted && "opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    item.tone === "positive"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300"
                  )}
                >
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-white/85">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-white/40">
                    {item.tone === "positive" ? "Adds to value" : "Reduces value"}
                  </div>
                </div>
              </div>
              <CountUp
                value={item.value}
                format={(n) => formatINR(n)}
                className={cn(
                  "text-base font-bold",
                  item.tone === "positive"
                    ? "text-emerald-300"
                    : "text-rose-300"
                )}
              />
            </motion.div>
          ))}

          <div className="mt-2 flex items-center justify-between rounded-xl border border-primary-orange/30 bg-primary-orange/10 px-4 py-3">
            <div className="text-sm font-semibold text-white">
              Net gain to you
            </div>
            <CountUp
              value={result.netValue}
              format={(n) => formatINR(n)}
              className="text-lg font-extrabold text-primary-orange"
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function BoardingPass({ result }: { result: CalculatorResult }) {
  const positive = result.netValue >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative mt-7 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02]"
    >
      <div
        aria-hidden
        className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-brown-background"
      />
      <div
        aria-hidden
        className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full bg-brown-background"
      />
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-4 md:px-6 md:py-5">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">
            From
          </div>
          <div className="mt-1 text-xl font-bold text-white">
            {formatINR(result.yearlySpend)}
          </div>
          <div className="text-[11px] text-white/45">your yearly spend</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-widest text-white/40">
            Net value
          </div>
          <Plane
            className={cn(
              "mt-1.5 size-6 rotate-90",
              positive ? "text-emerald-300" : "text-rose-300"
            )}
          />
          <div
            className={cn(
              "mt-1 text-[10px] font-bold uppercase tracking-widest",
              positive ? "text-emerald-300" : "text-rose-300"
            )}
          >
            {positive ? "On time" : "Delayed"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/40">
            To
          </div>
          <div
            className={cn(
              "mt-1 text-xl font-bold",
              positive ? "text-emerald-300" : "text-rose-300"
            )}
          >
            {formatINR(result.netValue)}
          </div>
          <div className="text-[11px] text-white/45">
            in your pocket
          </div>
        </div>
      </div>
      <div className="border-t border-dashed border-white/10 px-5 py-3 md:px-6">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/45">
          <span>
            Passenger ·{" "}
            <span className="text-white/80">{result.travelerLabel}</span>
          </span>
          <span>
            Card ·{" "}
            <span className="text-white/80">
              {result.card.bankShort} {result.card.emblem}
            </span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
