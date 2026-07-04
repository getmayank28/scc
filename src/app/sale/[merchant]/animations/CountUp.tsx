"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

interface CountUpProps {
  value: number;
  /** Animation length in ms. */
  duration?: number;
  className?: string;
  /** Format the current (integer) value into display text. */
  format?: (value: number) => string;
  /** Start counting only once scrolled into view (default true). */
  onView?: boolean;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Counts a number up from 0 to `value`. Runs on `requestAnimationFrame`
 * (transform-free, cheap) and snaps straight to the final value when the
 * visitor prefers reduced motion. When it's a live-updating value (e.g. the
 * estimator total), pass `onView={false}` so it re-animates on every change.
 */
export function CountUp({
  value,
  duration = 1200,
  className,
  format = (v) => v.toLocaleString("en-IN"),
  onView = true,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  const active = onView ? inView : true;

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const delta = value - from;
    if (delta === 0) return;

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(from + delta * easeOutCubic(progress)));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
