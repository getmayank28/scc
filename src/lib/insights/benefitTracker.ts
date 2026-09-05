// Unused-benefit alerts — lounge visits, movie tickets, golf rounds.
//
// These entitlements expire unused at period end and do not roll over, and no
// issuer proactively warns about them. The rupee value at risk is simply the
// unused units times what one unit is worth.
//
// Data source: mocked today (see mockLedger.ts). None of the demo cards carry
// `lounge` data in staging and the schema has no movie/golf fields, so this
// stands in for a benefits feed. The tracker itself is real logic and will run
// unchanged against live entitlements.

import type { BenefitEntitlement, Insight } from "./types";
import { demoNow, daysUntil, formatDeadline } from "./demoClock";
import { inr, urgencyFor } from "./format";

export interface BenefitUsage extends BenefitEntitlement {
  unusedUnits: number;
  valueAtRiskInr: number;
  daysRemaining: number;
  utilisation: number;
  periodElapsed: number;
}

/** Nominal length of a benefit period, for the elapsed-time tick. */
const PERIOD_DAYS: Record<string, number> = {
  "this quarter": 91,
  "this month": 30,
  "this membership year": 365,
  "this year": 365,
};

export function trackBenefits(
  entitlements: BenefitEntitlement[],
  now: Date = demoNow(),
): BenefitUsage[] {
  return entitlements
    .map((b) => {
      const unusedUnits = Math.max(0, b.totalUnits - b.usedUnits);
      const daysRemaining = daysUntil(b.expiresAt, now);
      const periodDays = PERIOD_DAYS[b.periodLabel] ?? 365;
      return {
        ...b,
        unusedUnits,
        valueAtRiskInr: unusedUnits * b.unitValueInr,
        daysRemaining,
        utilisation: b.totalUnits > 0 ? b.usedUnits / b.totalUnits : 1,
        periodElapsed: Math.min(
          1,
          Math.max(0, (periodDays - daysRemaining) / periodDays),
        ),
      };
    })
    // Expired or fully-used benefits carry no action.
    .filter((b) => b.unusedUnits > 0 && b.daysRemaining > 0)
    .sort((a, b) => b.valueAtRiskInr - a.valueAtRiskInr);
}

export function benefitInsights(
  usages: BenefitUsage[],
  cardNameFor: (slug: string) => string,
): Insight[] {
  return usages.map((b) => {
    const cardName = cardNameFor(b.cardSlug);
    const noun = b.unusedUnits === 1 ? unitNoun(b) : unitNounPlural(b);
    return {
      id: `benefit:${b.id}`,
      kind: "unused_benefit" as const,
      cardSlug: b.cardSlug,
      cardName,
      title: `${b.unusedUnits} unused ${noun} worth ${inr(b.valueAtRiskInr)}`,
      detail: `${b.label} on ${cardName}: ${b.usedUnits} of ${
        b.totalUnits
      } used ${b.periodLabel}. The remaining ${
        b.unusedUnits
      } expire on ${formatDeadline(
        new Date(b.expiresAt.getTime() + 86_400_000),
      )} and do not carry over.`,
      action: `Use ${b.unusedUnits} ${noun} before ${formatDeadline(
        new Date(b.expiresAt.getTime() + 86_400_000),
      )}`,
      valueAtRiskInr: b.valueAtRiskInr,
      deadline: b.expiresAt,
      daysRemaining: b.daysRemaining,
      // Progress here is consumption — a low bar filled is the problem.
      progress: b.utilisation,
      progressLabel: `${b.usedUnits} of ${b.totalUnits} used`,
      periodElapsed: b.periodElapsed,
      // Unused benefits invert the usual rule: LOW utilisation late in the
      // period is the alarming case, so urgency is driven by how much value
      // remains stranded rather than by how close the user is to a goal.
      urgency: urgencyFor(b.daysRemaining, 1 - b.utilisation),
      score: b.valueAtRiskInr / Math.max(1, b.daysRemaining),
    };
  });
}

function unitNoun(b: BenefitUsage): string {
  switch (b.benefitType) {
    case "lounge":
      return "lounge visit";
    case "movie":
      return "movie ticket";
    case "golf":
      return "golf round";
    case "spa":
      return "spa session";
    default:
      return "benefit";
  }
}

function unitNounPlural(b: BenefitUsage): string {
  return `${unitNoun(b)}s`;
}
