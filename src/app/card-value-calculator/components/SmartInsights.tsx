"use client";
import { motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { CountUp } from "./CountUp";
import type { CalculatorResult, InsightTone } from "../types";
import { cn } from "@/lib/utils";

const toneClasses: Record<
  InsightTone,
  { ring: string; bg: string; text: string; icon: React.ReactNode }
> = {
  green: {
    ring: "border-emerald-400/30",
    bg: "bg-emerald-400/8",
    text: "text-emerald-300",
    icon: <CheckCircle2 className="size-4" />,
  },
  yellow: {
    ring: "border-amber-400/30",
    bg: "bg-amber-400/8",
    text: "text-amber-300",
    icon: <AlertTriangle className="size-4" />,
  },
  red: {
    ring: "border-rose-400/30",
    bg: "bg-rose-400/8",
    text: "text-rose-300",
    icon: <AlertTriangle className="size-4" />,
  },
  blue: {
    ring: "border-sky-400/30",
    bg: "bg-sky-400/8",
    text: "text-sky-300",
    icon: <Info className="size-4" />,
  },
};

type Props = { result: CalculatorResult };

export function SmartInsights({ result }: Props) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
      <ScoreCard result={result} />

      <GlassCard className="p-5 md:p-7">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary-orange">
          <Lightbulb className="size-3.5" /> Smart insights
        </div>
        <h3 className="mt-2 text-xl font-semibold text-white md:text-2xl">
          What we noticed about your card
        </h3>
        <div className="mt-5 grid gap-3">
          {result.insights.map((insight, i) => {
            const t = toneClasses[insight.tone];
            return (
              <motion.div
                key={`${insight.title}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 * i }}
                className={cn(
                  "flex gap-3 rounded-xl border bg-white/[0.02] p-4",
                  t.ring,
                  t.bg
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    t.bg,
                    t.text
                  )}
                >
                  {t.icon}
                </div>
                <div>
                  <div className={cn("text-sm font-semibold", t.text)}>
                    {insight.title}
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-white/65">
                    {insight.body}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function ScoreCard({ result }: { result: CalculatorResult }) {
  const score = result.valueScore;
  const positive = score >= 60;
  const circumference = 2 * Math.PI * 56;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <GlassCard className="p-5 md:p-7" glow>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-primary-orange">
        <Sparkles className="size-3.5" /> Value score
      </div>
      <h3 className="mt-2 text-xl font-semibold text-white md:text-2xl">
        Your personalized score
      </h3>

      <div className="mt-5 flex items-center gap-6">
        <div className="relative size-36">
          <svg viewBox="0 0 128 128" className="size-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="10"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#f6c177" />
                <stop offset="60%" stopColor="#f35a13" />
                <stop offset="100%" stopColor="#ff7a3d" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <CountUp
              value={score}
              className="text-4xl font-extrabold text-white"
            />
            <div className="text-[10px] uppercase tracking-widest text-white/45">
              / 100
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <Stat
            label="Effective return"
            value={`${result.effectiveReturnPct.toFixed(2)}%`}
            tone={result.effectiveReturnPct >= 0 ? "good" : "bad"}
          />
          <Stat label="Traveler type" value={result.travelerLabel} />
          <Stat
            label="Verdict"
            value={positive ? "Worth keeping" : "Consider switching"}
            tone={positive ? "good" : "bad"}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <TrendingUp className="size-4 text-primary-orange" />
        <div className="text-xs text-white/60">
          Score blends rewards rate, lounge utility, milestone unlocks, and fee
          impact.
        </div>
      </div>
    </GlassCard>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-[11px] uppercase tracking-wider text-white/45">
        {label}
      </div>
      <div
        className={cn(
          "text-sm font-semibold",
          tone === "good" && "text-emerald-300",
          tone === "bad" && "text-rose-300",
          !tone && "text-white"
        )}
      >
        {value}
      </div>
    </div>
  );
}
