// Single source of "now" for the insights demo.
//
// Every deadline, progress window and urgency figure in the insights layer is
// computed relative to this clock — never `new Date()` directly. The demo
// ledger is authored against a fixed anchor date, so pinning the clock keeps
// the narrative numbers ("₹28,000 in 26 days") identical whether the demo is
// presented today or in three weeks. Without this, hardcoded spend dates drift
// out of their milestone windows and the urgency copy silently goes stale.
//
// When real email access lands: set DEMO_ANCHOR to null and this transparently
// becomes the live clock — no downstream code changes.

/**
 * Fixed anchor for the demo narrative. Set to `null` to use the real clock.
 *
 * Chosen deliberately: 4 days before quarter end (Mar 31) and 26 days before
 * the Regalia Gold fee-waiver anniversary, so the quarterly-milestone and
 * fee-waiver stories are both live and urgent at the same moment.
 */
const DEMO_ANCHOR: string | null = "2026-03-05T10:30:00.000+05:30";

/** The current time for all insights computation. */
export function demoNow(): Date {
  return DEMO_ANCHOR ? new Date(DEMO_ANCHOR) : new Date();
}

/** True when the pinned demo clock is active rather than the live clock. */
export function isDemoClock(): boolean {
  return DEMO_ANCHOR !== null;
}

export const MS_PER_DAY = 86_400_000;

/** Whole days from `demoNow()` until `date`; negative once past. */
export function daysUntil(date: Date, from: Date = demoNow()): number {
  return Math.ceil((date.getTime() - from.getTime()) / MS_PER_DAY);
}

/** Inclusive-start, exclusive-end window. */
export interface Window {
  start: Date;
  end: Date;
}

export function isWithin(date: Date, w: Window): boolean {
  const t = date.getTime();
  return t >= w.start.getTime() && t < w.end.getTime();
}

/** Calendar month window containing `ref`. */
export function monthWindow(ref: Date = demoNow()): Window {
  const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
  const end = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1));
  return { start, end };
}

/** Calendar quarter window containing `ref`. */
export function quarterWindow(ref: Date = demoNow()): Window {
  const q = Math.floor(ref.getUTCMonth() / 3);
  const start = new Date(Date.UTC(ref.getUTCFullYear(), q * 3, 1));
  const end = new Date(Date.UTC(ref.getUTCFullYear(), q * 3 + 3, 1));
  return { start, end };
}

/** Calendar half-year window containing `ref`. */
export function halfYearWindow(ref: Date = demoNow()): Window {
  const h = ref.getUTCMonth() < 6 ? 0 : 6;
  const start = new Date(Date.UTC(ref.getUTCFullYear(), h, 1));
  const end = new Date(Date.UTC(ref.getUTCFullYear(), h + 6, 1));
  return { start, end };
}

/** Calendar day window containing `ref`. */
export function dayWindow(ref: Date = demoNow()): Window {
  const start = new Date(
    Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()),
  );
  return { start, end: new Date(start.getTime() + MS_PER_DAY) };
}

/**
 * Card-anniversary year window — the fee-waiver and annual-milestone period.
 * Runs from the most recent anniversary of `anniversary` on or before `ref`,
 * to the next one. Falls back to the calendar year when no anniversary known.
 */
export function anniversaryYearWindow(
  anniversary: Date | null,
  ref: Date = demoNow(),
): Window {
  if (!anniversary) {
    return {
      start: new Date(Date.UTC(ref.getUTCFullYear(), 0, 1)),
      end: new Date(Date.UTC(ref.getUTCFullYear() + 1, 0, 1)),
    };
  }
  const m = anniversary.getUTCMonth();
  const d = anniversary.getUTCDate();
  let start = new Date(Date.UTC(ref.getUTCFullYear(), m, d));
  if (start.getTime() > ref.getTime()) {
    start = new Date(Date.UTC(ref.getUTCFullYear() - 1, m, d));
  }
  const end = new Date(
    Date.UTC(start.getUTCFullYear() + 1, m, d),
  );
  return { start, end };
}

export type TrackedPeriod =
  | "daily"
  | "monthly"
  | "quarterly"
  | "halfyearly"
  | "annually";

/**
 * Resolve the active window for a rule/milestone period. `annually` honours the
 * card anniversary when known, since fee waivers reset on the card's own
 * cycle rather than on Jan 1.
 */
export function windowForPeriod(
  period: TrackedPeriod,
  anniversary: Date | null = null,
  ref: Date = demoNow(),
): Window {
  switch (period) {
    case "daily":
      return dayWindow(ref);
    case "monthly":
      return monthWindow(ref);
    case "quarterly":
      return quarterWindow(ref);
    case "halfyearly":
      return halfYearWindow(ref);
    case "annually":
      return anniversaryYearWindow(anniversary, ref);
  }
}

/**
 * How far through a window the clock has travelled, 0..1.
 * Drives the decay meter's deadline tick — the honest "time spent" against
 * which "progress made" is judged.
 */
export function elapsedFraction(w: Window, ref: Date = demoNow()): number {
  const span = w.end.getTime() - w.start.getTime();
  if (span <= 0) return 1;
  const gone = ref.getTime() - w.start.getTime();
  return Math.min(1, Math.max(0, gone / span));
}

/** Human label for a window's deadline, e.g. "31 Mar". */
export function formatDeadline(end: Date): string {
  const last = new Date(end.getTime() - MS_PER_DAY);
  return last.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
