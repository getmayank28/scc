"use client";

import { useEffect, useRef, useState } from "react";
import { inr, pts, type RewardPoints } from "@/lib/insights/clientTypes";
import { RP_PER_INR } from "@/lib/insights/rewardPoints";

/**
 * FiSense reward points, as a single quiet band beneath the hero.
 *
 * Deliberately understated: the page's argument is about money being LOST, and
 * a second large figure would compete with it. So points get a horizontal strip
 * — earned balance, what it is worth, what it is earning at — rather than a
 * card or a stat grid. Green separates "banked" from the orange "at risk"
 * language above without introducing a new accent into the palette.
 */
export default function RewardPointsBar({
  rp,
  /** Points for the current card selection; falls back to the full balance. */
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
  const valueInr = visiblePoints * (rp.totalPoints > 0 ? rp.valueInr / rp.totalPoints : 0);

  return (
    <section
      aria-label="FiSense reward points"
      className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-xl border border-brown-border bg-brown-sidebar/50 px-6 py-5 max-md:px-5"
    >
      <div>
        <div>
          <div className="font-satoshi flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-secondary-gray">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/80" />
            FiSense points earned
            {scopeLabel && (
              <span className="normal-case tracking-normal"> · {scopeLabel}</span>
            )}
          </div>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="font-satoshi text-[30px] font-bold leading-none tracking-[-0.02em] text-white max-md:text-[24px]">
              {pts(shown)}
            </span>
            <span className="font-satoshi text-[13px] text-secondary-gray">
              ≈ {inr(valueInr)}
            </span>
          </div>
        </div>
      </div>

      <dl className="flex items-center gap-8 max-md:gap-6">
        <Stat label="Earn rate" value={`${RP_PER_INR} pt / ₹1`} />
        <Stat label="This month" value={pts(visibleMonthPoints)} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-satoshi text-[10px] uppercase tracking-[0.18em] text-secondary-gray">
        {label}
      </dt>
      <dd className="font-satoshi mt-1 text-[15px] font-medium text-white">
        {value}
      </dd>
    </div>
  );
}

/** Counts to `target` on mount and on change, matching the hero's easing. */
function useCountUp(target: number) {
  const [n, setN] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    const from = 0;
    const DURATION = 1100;
    let start: number | null = null;

    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / DURATION);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setN(from + (target - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target]);

  return n;
}
