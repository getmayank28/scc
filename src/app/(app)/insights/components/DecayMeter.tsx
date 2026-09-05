"use client";

import { useEffect, useState } from "react";
import { URGENCY_STYLE, type Urgency } from "@/lib/insights/clientTypes";

/**
 * Shortfall between elapsed time and progress, as whole percent — or null when
 * progress is keeping up. Shared with InsightRow so the bar and its caption can
 * never disagree.
 */
export function pctBehind(
  progress: number,
  timeElapsed: number,
): number | null {
  const p = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const t = Math.round(Math.min(1, Math.max(0, timeElapsed)) * 100);
  return t > p ? t - p : null;
}

/**
 * The page's signature element.
 *
 * One shape, two facts. The filled track is progress toward the goal; the
 * UNFILLED remainder is what is still at stake. The tick mark sits at the
 * deadline's position in the period, sliding left as time runs out — so a bar
 * that is nearly full with a tick close behind reads as "almost there, almost
 * out of time" without a word of explanation.
 */
export default function DecayMeter({
  progress,
  urgency,
  timeElapsed,
  delayMs = 0,
}: {
  /** 0..1 progress toward the goal. */
  progress: number;
  urgency: Urgency;
  /** 0..1 how far through the period we are — drives the tick position. */
  timeElapsed: number;
  delayMs?: number;
}) {
  const [width, setWidth] = useState(0);
  const style = URGENCY_STYLE[urgency];

  useEffect(() => {
    const t = setTimeout(() => setWidth(progress), delayMs);
    return () => clearTimeout(t);
  }, [progress, delayMs]);

  const tickPct = Math.round(Math.min(1, Math.max(0, timeElapsed)) * 100);

  return (
    <div className="w-full">
      <div className="relative h-2 w-full overflow-visible rounded-full bg-[#271d15]">
        <div
          className={`h-full rounded-full ${style.track} motion-reduce:transition-none`}
          style={{
            width: `${width * 100}%`,
            transition: "width 900ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        {/* Deadline tick — where the clock has reached. */}
        <div
          className="absolute top-[-3px] h-[14px] w-[2px] rounded-full bg-white/70 motion-reduce:transition-none"
          style={{
            left: `calc(${tickPct}% - 1px)`,
            transition: "left 900ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          aria-hidden
        />
      </div>

    </div>
  );
}
