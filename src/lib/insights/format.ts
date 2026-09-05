// Shared formatting + urgency rules for the insights layer.

import type { Urgency } from "./types";

/** Indian-format rupees, no decimals. e.g. ₹1,00,000 */
export function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/**
 * Urgency blends time pressure with proximity: a goal 95% complete with 3 days
 * left is critical, while the same 3 days at 10% complete is unreachable and
 * therefore only informational — telling someone to spend ₹90,000 in 3 days is
 * noise, not advice.
 */
export function urgencyFor(
  daysRemaining: number | null,
  progress: number | null,
): Urgency {
  if (daysRemaining === null) return "info";
  const near = progress === null || progress >= 0.7;
  const halfway = progress === null || progress >= 0.4;

  if (daysRemaining <= 7) return near ? "critical" : halfway ? "high" : "info";
  if (daysRemaining <= 30) return near ? "high" : halfway ? "moderate" : "info";
  if (daysRemaining <= 60) return halfway ? "moderate" : "info";
  return "info";
}

export const URGENCY_RANK: Record<Urgency, number> = {
  critical: 0,
  high: 1,
  moderate: 2,
  info: 3,
};
