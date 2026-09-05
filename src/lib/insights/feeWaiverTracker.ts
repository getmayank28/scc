// Annual-fee waiver race.
//
// Reuses `computeAnnualFeeInr` from the advisor's scoring pipeline as the
// single source of truth on whether a fee applies, then adds what scoring does
// not need: how far into the current card year the user is, and what remains.

import type { MockCard } from "@/lib/logic/advisor/cards";
import { computeAnnualFeeInr } from "@/lib/logic/advisor/scoring";
import type { LedgerEntry, Insight } from "./types";
import {
  demoNow,
  daysUntil,
  formatDeadline,
  anniversaryYearWindow,
  elapsedFraction,
} from "./demoClock";
import { inr, urgencyFor } from "./format";

export interface WaiverProgress {
  cardSlug: string;
  annualFeeInr: number;
  waiverSpendInr: number;
  spentInr: number;
  remainingInr: number;
  waived: boolean;
  /** True when the card has a fee but offers no spend route to waive it. */
  noWaiverRoute: boolean;
  deadline: Date;
  daysRemaining: number;
  periodElapsed: number;
}

export function trackFeeWaiver(
  card: MockCard,
  entries: LedgerEntry[],
  anniversary: Date | null,
  now: Date = demoNow(),
): WaiverProgress | null {
  const fees = card.fees;
  if (!fees || fees.is_lifetime_free) return null;

  const annualFeeInr = (fees.annual_inr ?? 0) + (fees.annual_gst_inr ?? 0);
  if (annualFeeInr <= 0) return null;

  const w = anniversaryYearWindow(anniversary, now);
  const spentInr = entries.reduce(
    (t, e) => (e.postedAt >= w.start && e.postedAt < w.end ? t + e.amountInr : t),
    0,
  );

  const waiverSpendInr = fees.waiver_spend_inr ?? 0;
  // Defer to the advisor's own fee rule so insights and recommendations can
  // never disagree about whether a fee is waived.
  const { feeWaived } = computeAnnualFeeInr(card, spentInr);

  return {
    cardSlug: card._id,
    annualFeeInr,
    waiverSpendInr,
    spentInr,
    remainingInr: Math.max(0, waiverSpendInr - spentInr),
    waived: feeWaived,
    noWaiverRoute: waiverSpendInr <= 0,
    deadline: w.end,
    daysRemaining: daysUntil(w.end, now),
    periodElapsed: elapsedFraction(w, now),
  };
}

export function feeWaiverInsights(
  cardName: string,
  p: WaiverProgress | null,
): Insight[] {
  if (!p) return [];

  // A card with a fee but no spend-based waiver has no action attached. Say so
  // plainly rather than inventing a race the user cannot win.
  if (p.noWaiverRoute) {
    return [
      {
        id: `fee:${p.cardSlug}`,
        kind: "fee_waiver",
        cardSlug: p.cardSlug,
        cardName,
        title: `${inr(p.annualFeeInr)} renewal fee, no spend waiver`,
        detail: `${cardName} charges ${inr(
          p.annualFeeInr,
        )} at renewal on ${formatDeadline(
          p.deadline,
        )} and offers no spend-based waiver. Worth checking the benefits you use justify it.`,
        action: "Review whether this card earns its fee",
        valueAtRiskInr: p.annualFeeInr,
        deadline: p.deadline,
        daysRemaining: p.daysRemaining,
        progress: null,
        progressLabel: null,
        periodElapsed: p.periodElapsed,
        urgency: p.daysRemaining <= 45 ? "moderate" : "info",
        score: p.annualFeeInr / Math.max(1, p.daysRemaining) / 4,
      },
    ];
  }

  if (p.waived) {
    return [
      {
        id: `fee:${p.cardSlug}`,
        kind: "fee_waiver",
        cardSlug: p.cardSlug,
        cardName,
        title: `${inr(p.annualFeeInr)} fee already waived`,
        detail: `You have spent ${inr(p.spentInr)} on ${cardName}, clearing the ${inr(
          p.waiverSpendInr,
        )} waiver threshold. The renewal fee will not be charged.`,
        action: "No action needed",
        valueAtRiskInr: 0,
        deadline: p.deadline,
        daysRemaining: p.daysRemaining,
        progress: 1,
        progressLabel: `${inr(p.spentInr)} of ${inr(p.waiverSpendInr)}`,
        periodElapsed: p.periodElapsed,
        urgency: "info",
        score: 0,
      },
    ];
  }

  const progress = p.waiverSpendInr > 0 ? p.spentInr / p.waiverSpendInr : 0;
  return [
    {
      id: `fee:${p.cardSlug}`,
      kind: "fee_waiver",
      cardSlug: p.cardSlug,
      cardName,
      title: `${inr(p.remainingInr)} to waive a ${inr(p.annualFeeInr)} fee`,
      detail: `${cardName} waives its ${inr(
        p.annualFeeInr,
      )} renewal fee at ${inr(p.waiverSpendInr)} of annual spend. You are at ${inr(
        p.spentInr,
      )} with ${p.daysRemaining} days left in this card year.`,
      action: `Spend ${inr(p.remainingInr)} by ${formatDeadline(p.deadline)}`,
      valueAtRiskInr: p.annualFeeInr,
      deadline: p.deadline,
      daysRemaining: p.daysRemaining,
      progress: Math.min(1, progress),
      progressLabel: `${inr(p.spentInr)} of ${inr(p.waiverSpendInr)}`,
      periodElapsed: p.periodElapsed,
      urgency: urgencyFor(p.daysRemaining, progress),
      score: p.annualFeeInr / Math.max(1, p.daysRemaining),
    },
  ];
}
