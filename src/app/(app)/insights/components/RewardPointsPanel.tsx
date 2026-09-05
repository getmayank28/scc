"use client";

import { useEffect, useRef, useState } from "react";
import { inr, pts, type RewardPoints } from "@/lib/insights/clientTypes";
import { RP_PER_INR } from "@/lib/insights/rewardPoints";

/**
 * FiSense reward points, as a band beneath the wallet strip.
 *
 * Deliberately cooler than the rest of the page: the surrounding argument is
 * about money being LOST, and a second orange figure would compete with it.
 * Green separates "banked" from "at risk" without adding an accent to the
 * palette. The balance follows the card selection — accrual is a property of
 * spend, so scoping it to the inspected card is the only honest reading.
 */
export default function RewardPointsPanel({
  rp,
  /** Points for the current scope; the full balance when no card is selected. */
  visiblePoints,
  visibleMonthPoints,
  scopeLabel,
}: {
  rp: RewardPoints;
  visiblePoints: number;
  visibleMonthPoints: number;
  scopeLabel: string | null;
}) {
  const shown = useCountUp(visiblePoints);

  // Value per point is derived from the payload's own totals rather than
  // re-declaring the rate here, so the two can never disagree.
  const perPoint = rp.totalPoints > 0 ? rp.valueInr / rp.totalPoints : 0;
  const share =
    rp.totalPoints > 0 ? Math.min(1, visiblePoints / rp.totalPoints) : 0;

  return (
    <section
      aria-label="FiSense reward points"
      className="overflow-hidden rounded-2xl border border-emerald-400/15 bg-gradient-to-r from-emerald-400/[0.06] via-brown-sidebar/50 to-brown-sidebar/50"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-6 px-7 py-6 max-md:px-5">
        {/* Balance */}
        <div className="min-w-0">
          <div className="font-satoshi flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-secondary-gray">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/90" />
            FiSense points earned
            {scopeLabel && (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] normal-case tracking-normal text-emerald-200/80">
                {scopeLabel}
              </span>
            )}
          </div>

          <div className="mt-2.5 flex items-baseline gap-3">
            <span className="font-satoshi text-[34px] font-bold leading-none tracking-[-0.03em] text-white max-md:text-[26px]">
              {pts(shown)}
            </span>
            <span className="font-satoshi text-[13px] text-secondary-gray">
              ≈ {inr(visiblePoints * perPoint)}
            </span>
          </div>

          {/* Share of the wallet's balance — only meaningful when scoped. */}
          {scopeLabel && (
            <div className="mt-3 max-w-[260px]">
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-emerald-400/70 motion-reduce:transition-none"
                  style={{
                    width: `${share * 100}%`,
                    transition: "width 900ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
              <p className="font-satoshi mt-1.5 text-[10px] text-secondary-gray">
                {Math.round(share * 100)}% of your {pts(rp.totalPoints)} point
                balance
              </p>
            </div>
          )}
        </div>

        {/* Rate + recency */}
        <dl className="flex items-stretch divide-x divide-brown-border/70 rounded-xl border border-brown-border/70 bg-brown-background/40">
          <Stat label="Earn rate" value={`${RP_PER_INR} pt / ₹1`} />
          <Stat label="This month" value={pts(visibleMonthPoints)} />
          <Stat label="Point value" value={`₹${perPoint.toFixed(2)}`} />
        </dl>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3.5">
      <dt className="font-satoshi whitespace-nowrap text-[9px] uppercase tracking-[0.16em] text-secondary-gray">
        {label}
      </dt>
      <dd className="font-satoshi mt-1.5 whitespace-nowrap text-[14px] font-semibold text-white">
        {value}
      </dd>
    </div>
  );
}

/** Counts to `target` on mount and on change. */
function useCountUp(target: number) {
  const [n, setN] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    const DURATION = 1100;
    let start: number | null = null;

    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / DURATION);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setN(target * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target]);

  return n;
}
