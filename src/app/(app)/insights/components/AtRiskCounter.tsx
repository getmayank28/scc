"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The thesis of the page: money is leaking right now.
 *
 * Counts up on mount so the figure arrives rather than simply being present.
 * The two stat cards beside it answer the immediate follow-up questions —
 * how soon, and across how much.
 */
export default function AtRiskCounter({
  totalInr,
  soonestDays,
  soonestLabel,
  itemCount,
  cardCount,
}: {
  totalInr: number;
  soonestDays: number;
  /** Date the nearest deadline falls on, e.g. "31 Mar". */
  soonestLabel: string;
  itemCount: number;
  cardCount: number;
}) {
  const [display, setDisplay] = useState(0);
  const reduced = usePrefersReducedMotion();
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      setDisplay(totalInr);
      return;
    }
    const DURATION = 1400;
    let start: number | null = null;

    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / DURATION);
      // easeOutExpo — fast arrival, long settle, so the final digits land calmly.
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setDisplay(totalInr * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [totalInr, reduced]);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="h-px w-6 bg-primary-orange" />
        <h2 className="font-satoshi text-[11px] font-medium uppercase tracking-[0.28em] text-secondary-gray">
          At risk in your wallet
        </h2>
      </div>

      <div className="flex justify-between gap-6 max-lg:flex-col lg:items-baseline">
        <div>
          <span
            className="font-satoshi block text-[104px] font-bold leading-[0.9] tracking-[-0.04em] text-primary-orange [text-shadow:0_0_38px_rgba(243,90,19,0.22)] max-md:text-[58px]"
            aria-label={`${Math.round(totalInr)} rupees at risk`}
          >
            ₹{Math.round(display).toLocaleString("en-IN")}
          </span>
          <p className="font-satoshi mt-4 max-w-xl text-[17px] font-light leading-relaxed text-secondary-gray max-md:text-[15px]">
            Rewards, waivers and benefits your cards forfeit if nothing changes
            this billing cycle.
          </p>
        </div>

        <div className="flex shrink-0 gap-4 py-1 max-sm:flex-col lg:border-l lg:border-brown-border/80 lg:pl-8">
          <StatCard
            eyebrow="Nearest deadline"
            value={`${soonestDays} days`}
            caption={`${soonestLabel} expiring window`}
            accent
          />
          <StatCard
            eyebrow="Attention req."
            value={`${itemCount} item${itemCount === 1 ? "" : "s"}`}
            caption={`Across ${cardCount} card${cardCount === 1 ? "" : "s"}`}
          />
        </div>
      </div>
    </section>
  );
}

function StatCard({
  eyebrow,
  value,
  caption,
  accent = false,
}: {
  eyebrow: string;
  value: string;
  caption: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-[170px] rounded-lg border border-brown-border bg-brown-sidebar/70 p-4">
      <div
        className={`font-satoshi flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${
          accent ? "text-primary-orange" : "text-secondary-gray"
        }`}
      >
        {accent && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary-orange" />
        )}
        {eyebrow}
      </div>
      <div className="font-satoshi mt-1 text-[24px] font-bold tracking-[-0.02em] text-white">
        {value}
      </div>
      <div className="font-satoshi mt-0.5 text-[11px] text-secondary-gray">
        {caption}
      </div>
    </div>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}
