"use client";

import { useState } from "react";
import {
  KIND_LABEL,
  URGENCY_STYLE,
  inr,
  type ClientInsight,
} from "@/lib/insights/clientTypes";
import DecayMeter, { pctBehind } from "./DecayMeter";
import { ChevronDown } from "lucide-react";

/**
 * One insight, as a bordered editorial card.
 *
 * The most urgent item (index 0) is promoted: accent border, ambient glow and a
 * "Most urgent" stamp. Everything below sits in the quiet default treatment, so
 * ranking is legible before a word is read.
 */
export default function InsightRow({
  insight: i,
  index,
  valueCaption,
}: {
  insight: ClientInsight;
  index: number;
  /** Right-column label under the figure, e.g. "Unredeemed value". */
  valueCaption: string;
}) {
  const [open, setOpen] = useState(false);
  const style = URGENCY_STYLE[i.urgency];
  const hasMeter = i.progress !== null;
  const featured = index === 0;
  const behind =
    i.progress !== null ? pctBehind(i.progress, i.periodElapsed ?? 0) : null;

  return (
    <article
      className={`animate-insight-in rounded-xl p-7 transition-colors max-md:p-5 ${
        featured
          ? "border border-primary-orange/40 bg-brown-sidebar/90 shadow-[0_10px_40px_-10px_rgba(243,90,19,0.12),inset_0_1px_0_rgba(243,90,19,0.2)]"
          : "border border-brown-border bg-brown-sidebar hover:border-brown-border/90"
      }`}
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <div className="flex justify-between gap-6 max-md:flex-col">
        {/* Left: meta, headline, meter */}
        <div className="min-w-0 flex-1 space-y-3.5">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {featured && (
              <span className="rounded bg-primary-orange px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brown-background">
                Most urgent
              </span>
            )}
            <span
              className={`font-satoshi text-xl font-bold ${
                featured ? "text-primary-orange" : "text-secondary-gray"
              }`}
            >
              {i.daysRemaining !== null ? `${i.daysRemaining}d` : "—"}
            </span>
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            <span className="font-satoshi text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-gray">
              {KIND_LABEL[i.kind]}
            </span>
            <span className="text-brown-border">•</span>
            <span className="font-satoshi truncate font-medium text-white/80">
              {i.cardName}
            </span>
          </div>

          <div>
            <h3 className="font-satoshi text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] text-white max-md:text-[20px]">
              {i.title}
            </h3>
            <p className="font-satoshi mt-1.5 text-[14px] text-white/55">
              {i.action}
            </p>
          </div>

          {hasMeter && (
            <div className="max-w-lg space-y-2 pt-1">
              <DecayMeter
                progress={i.progress ?? 0}
                urgency={i.urgency}
                timeElapsed={i.periodElapsed ?? 0}
                delayMs={120 + Math.min(index, 8) * 55}
              />
              {i.progressLabel && (
                <div className="font-satoshi flex items-center justify-between gap-4 text-[12px] text-secondary-gray">
                  <span className="font-medium text-white">
                    {i.progressLabel}
                  </span>
                  {behind !== null && (
                    <span className="whitespace-nowrap text-center">
                      {behind}% behind expected cadence
                    </span>
                  )}
                  {i.deadline && (
                    <span className="whitespace-nowrap">
                      {deadlineLabel(i)}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="pt-0.5">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="font-satoshi inline-flex items-center gap-1.5 text-[12px] text-secondary-gray transition-colors hover:text-primary-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-orange"
            >
              Why this matters
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <p
                className={`font-satoshi mt-2.5 max-w-xl border-l-2 pl-3 text-[12px] leading-[1.7] text-secondary-gray ${
                  featured ? "border-primary-orange/40" : "border-brown-border"
                }`}
              >
                {i.detail}
              </p>
            )}
          </div>
        </div>

        {/* Right: value at stake */}
        <div className="min-w-[160px] shrink-0 text-right max-md:min-w-0 max-md:border-t max-md:border-brown-border/60 max-md:pt-4 max-md:text-left">
          {i.valueAtRiskInr > 0 ? (
            <>
              <div className="font-satoshi text-[32px] font-bold leading-none tracking-[-0.02em] text-white max-md:text-[24px]">
                {inr(i.valueAtRiskInr)}
              </div>
              <div className="font-satoshi mt-1 text-[11px] uppercase tracking-wider text-secondary-gray">
                {valueCaption}
              </div>
            </>
          ) : (
            <span className="font-satoshi text-[11px] uppercase tracking-wider text-white/30">
              Secured
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/** Short right-aligned deadline note under the meter. */
function deadlineLabel(i: ClientInsight): string {
  if (i.daysRemaining === null) return "";
  if (i.kind === "reward_cap") return `Resets in ${i.daysRemaining}d`;
  return `${i.daysRemaining} days left`;
}
