"use client";

import {
  KIND_LABEL,
  URGENCY_STYLE,
  inr,
  type ClientInsight,
} from "@/lib/insights/clientTypes";
import DecayMeter, { pctBehind } from "./DecayMeter";

/**
 * One insight as a drawer tile.
 *
 * The three-part rhythm is fixed across every kind — stamp + clock, headline +
 * progress, then value and its action — so a grid of them can be scanned
 * column-wise without re-reading each card's structure.
 */
export default function BenefitCard({
  insight: i,
  index,
  valueCaption,
}: {
  insight: ClientInsight;
  index: number;
  /** Label under the figure, e.g. "Unredeemed value". */
  valueCaption: string;
}) {
  const style = URGENCY_STYLE[i.urgency];
  const hasMeter = i.progress !== null;
  const behind =
    i.progress !== null ? pctBehind(i.progress, i.periodElapsed ?? 0) : null;

  return (
    <article
      className="animate-insight-in flex flex-col gap-4 rounded-xl border border-brown-border bg-brown-background/50 p-5 transition-colors hover:border-brown-border/90"
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      {/* Stamp + clock */}
      <div className="flex items-start justify-between gap-3">
        <span
          className={`font-satoshi rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${style.text} border-current/30`}
        >
          {KIND_LABEL[i.kind]}
        </span>
        <span
          className={`font-satoshi shrink-0 text-[11px] font-medium ${
            i.daysRemaining !== null && i.daysRemaining <= 30
              ? style.text
              : "text-secondary-gray"
          }`}
        >
          {i.daysRemaining !== null ? `${i.daysRemaining} days left` : "No deadline"}
        </span>
      </div>

      {/* Headline */}
      <div>
        <h3 className="font-satoshi text-[17px] font-semibold leading-[1.3] tracking-[-0.01em] text-white">
          {i.title}
        </h3>
        <p className="font-satoshi mt-1 text-[12px] leading-relaxed text-white/50">
          {i.detail}
        </p>
      </div>

      {/* Progress */}
      {hasMeter && (
        <div className="space-y-2">
          <div className="font-satoshi flex items-baseline justify-between text-[11px]">
            <span className="text-secondary-gray">Progress</span>
            <span className="font-semibold text-white">
              {Math.round((i.progress ?? 0) * 100)}%
            </span>
          </div>
          <DecayMeter
            progress={i.progress ?? 0}
            urgency={i.urgency}
            timeElapsed={i.periodElapsed ?? 0}
            delayMs={120 + Math.min(index, 8) * 55}
          />
          <div className="font-satoshi flex items-center justify-between gap-2 text-[10px] text-secondary-gray">
            <span className="truncate">{i.progressLabel}</span>
            {behind !== null && (
              <span className="shrink-0">{behind}% behind</span>
            )}
          </div>
        </div>
      )}

      {/* Value + action */}
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-brown-border/60 pt-4">
        <div className="min-w-0">
          <div className="font-satoshi truncate text-[9px] uppercase tracking-[0.14em] text-secondary-gray">
            {valueCaption}
          </div>
          <div className="font-satoshi mt-0.5 text-[18px] font-bold tracking-[-0.01em] text-white">
            {i.valueAtRiskInr > 0 ? inr(i.valueAtRiskInr) : "Secured"}
          </div>
        </div>
        <p className="font-satoshi max-w-[55%] shrink-0 text-right text-[11px] leading-snug text-primary-orange">
          {i.action}
        </p>
      </div>
    </article>
  );
}
