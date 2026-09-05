"use client";

import { useRouter } from "next/navigation";
import { useGetInsightsQuery } from "@/store/api";
import {
  inr,
  URGENCY_STYLE,
  type InsightsPayload,
} from "@/lib/insights/clientTypes";
import { ArrowRight } from "lucide-react";

/**
 * Full-width banner above the dashboard.
 *
 * It sits at the top because it is the only thing on this page with a deadline
 * attached — the panels below report what happened, this reports what is about
 * to be lost. On desktop it reads as one horizontal line: figure, the single
 * most urgent action, then scope, so it can be taken in without stopping.
 */
export default function InsightsTeaser() {
  const router = useRouter();
  const { data, isFetching } = useGetInsightsQuery({});
  const payload = data as InsightsPayload | undefined;

  if (isFetching && !payload) {
    return (
      <div className="w-full rounded-xl border border-brown-border bg-brown-sidebar px-6 py-5">
        <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-8 w-56 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  const total = payload?.totalAtRiskInr ?? 0;
  if (!payload || total <= 0) return null;

  const top = payload.insights.find((i) => i.valueAtRiskInr > 0);
  const style = top ? URGENCY_STYLE[top.urgency] : null;

  return (
    <button
      onClick={() => router.push("/insights")}
      aria-label={`${inr(total)} at risk across your cards. Open insights.`}
      className="group w-full cursor-pointer rounded-xl border border-brown-border bg-brown-sidebar px-6 py-5 text-left transition-colors hover:border-primary-orange/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-orange max-md:px-5"
    >
      <div className="flex items-center gap-6 max-md:flex-col max-md:items-start max-md:gap-3">
        {/* Figure */}
        <div className="shrink-0">
          <div className="font-satoshi text-[10px] uppercase tracking-[0.22em] text-secondary-gray">
            At risk in your wallet
          </div>
          <div className="font-satoshi mt-1 text-[32px] font-bold leading-none tracking-[-0.02em] text-primary-orange max-md:text-[26px]">
            {inr(total)}
          </div>
        </div>

        {/* Most urgent action — the reason to click */}
        {top && style && (
          <div className="min-w-0 flex-1 border-l border-brown-border/70 pl-6 max-md:border-l-0 max-md:pl-0">
            <div className="font-satoshi flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-secondary-gray">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
              Most urgent
            </div>
            <p className="font-satoshi mt-1 truncate text-[15px] font-medium text-white max-md:whitespace-normal">
              {top.action}
            </p>
            <p className="font-satoshi mt-0.5 truncate text-[12px] text-secondary-gray">
              {top.cardName}
              {top.daysRemaining !== null && ` · ${top.daysRemaining} days left`}
            </p>
          </div>
        )}

        {/* Scope + affordance */}
        <div className="flex shrink-0 items-center gap-4">
          <span className="font-satoshi text-right text-[12px] text-secondary-gray max-md:text-left">
            {payload.insights.length} to review
            <br className="max-md:hidden" />
            <span className="max-md:ml-1">across {payload.cards.length} cards</span>
          </span>
          <ArrowRight
            size={18}
            className="shrink-0 text-white/35 transition-transform group-hover:translate-x-1 group-hover:text-primary-orange"
          />
        </div>
      </div>
    </button>
  );
}
