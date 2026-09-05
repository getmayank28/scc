// FiSense reward points.
//
// The programme assumption for this preview: every rupee the user spends runs
// through FiSense, earning a flat 0.25 RP per ₹1. That is a deliberate
// simplification — real accrual would vary by merchant and card — so the rate
// lives here as one named constant rather than being scattered through the UI.

import type { LedgerEntry } from "./types";

/** FiSense reward points earned per rupee of spend. */
export const RP_PER_INR = 0.25;

/**
 * Rupee value of one reward point at redemption.
 *
 * Set to ₹0.25 — the median `rewards.point_value_inr` across the live
 * catalogue, and its single most common value (110 of 301 active cards). At
 * 0.25 RP per ₹1 earned and ₹0.25 per point redeemed, the programme returns an
 * effective ~6.25% on spend: strong, and in line with a real premium card.
 * Valuing points at ₹1 would imply a 25% return, which no programme offers.
 */
export const RP_VALUE_INR = 0.25;

export interface RewardPointsSummary {
  /** Points earned across all tracked spend. */
  totalPoints: number;
  /** Rupees of spend those points came from. */
  eligibleSpendInr: number;
  /** Redemption value of the balance. */
  valueInr: number;
  /** Points earned in the current calendar month. */
  pointsThisMonth: number;
  /** Per-card split, so the figure can follow a card filter. */
  byCard: Record<string, number>;
  /** Per-card split for the current month. */
  monthByCard: Record<string, number>;
}

export function computeRewardPoints(
  ledger: LedgerEntry[],
  monthStart: Date,
  monthEnd: Date,
): RewardPointsSummary {
  let eligibleSpendInr = 0;
  let pointsThisMonth = 0;
  const byCard: Record<string, number> = {};
  const monthByCard: Record<string, number> = {};

  for (const e of ledger) {
    eligibleSpendInr += e.amountInr;
    const pts = e.amountInr * RP_PER_INR;
    byCard[e.cardSlug] = (byCard[e.cardSlug] ?? 0) + pts;
    if (e.postedAt >= monthStart && e.postedAt < monthEnd) {
      pointsThisMonth += pts;
      monthByCard[e.cardSlug] = (monthByCard[e.cardSlug] ?? 0) + pts;
    }
  }

  const totalPoints = Math.round(eligibleSpendInr * RP_PER_INR);

  for (const slug of Object.keys(byCard)) {
    byCard[slug] = Math.round(byCard[slug]);
  }
  for (const slug of Object.keys(monthByCard)) {
    monthByCard[slug] = Math.round(monthByCard[slug]);
  }

  return {
    totalPoints,
    eligibleSpendInr,
    valueInr: Math.round(totalPoints * RP_VALUE_INR),
    pointsThisMonth: Math.round(pointsThisMonth),
    byCard,
    monthByCard,
  };
}
