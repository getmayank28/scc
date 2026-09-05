"use client";

import { useEffect, useRef, useState } from "react";
import { inr, pts } from "@/lib/insights/clientTypes";

/**
 * The page's headline figures, as one bordered strip beside the title.
 *
 * Two slots, deliberately unequal. Exposure is the page's whole argument, so it
 * gets the larger type, the accent hue and an ambient glow; the FiSense points
 * balance sits beside it as the counterweight — what the wallet has banked
 * against what it stands to lose. Both are server-computed figures.
 */
export default function WalletHeaderStrip({
  atRiskInr,
  points,
  pointsValueInr,
}: {
  atRiskInr: number;
  points: number;
  pointsValueInr: number;
}) {
  const shownRisk = useCountUp(atRiskInr);
  const shownPts = useCountUp(points);

  return (
    <div className="flex items-stretch divide-x divide-brown-border/70 overflow-hidden rounded-xl border border-primary-orange/25 bg-brown-sidebar/60 shadow-[0_10px_44px_-16px_rgba(243,90,19,0.35)] max-sm:flex-col max-sm:divide-x-0 max-sm:divide-y">
      {/* Exposure — the headline. */}
      <div
        className="relative min-w-[190px] flex-1 bg-primary-orange/[0.07] px-6 py-5"
        aria-label={`${atRiskInr} rupees at risk`}
      >
        {/* Accent rail, so the slot reads as primary even in greyscale. */}
        <span className="absolute inset-y-0 left-0 w-[3px] bg-primary-orange" />
        <div className="font-satoshi flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-primary-orange">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-orange" />
          Total at risk
        </div>
        <div className="font-satoshi mt-2 text-[34px] font-bold leading-none tracking-[-0.03em] text-primary-orange [text-shadow:0_0_30px_rgba(243,90,19,0.35)] max-md:text-[28px]">
          {inr(shownRisk)}
        </div>
        <div className="font-satoshi mt-1.5 text-[10px] text-secondary-gray">
          Forfeited if nothing changes
        </div>
      </div>

      {/* FiSense points — the counterweight. */}
      <div className="min-w-[170px] flex-1 px-6 py-5">
        <div className="font-satoshi flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-secondary-gray">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          FiSense points
        </div>
        <div className="font-satoshi mt-2 text-[26px] font-bold leading-none tracking-[-0.02em] text-white max-md:text-[22px]">
          {pts(shownPts)}
        </div>
        <div className="font-satoshi mt-1.5 text-[10px] text-secondary-gray">
          Banked · worth {inr(pointsValueInr)}
        </div>
      </div>
    </div>
  );
}

/** Counts to `target` on mount and on change. Matches the feed's easing. */
function useCountUp(target: number) {
  const [n, setN] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    const DURATION = 1200;
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
