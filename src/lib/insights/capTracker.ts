// Reward-cap utilisation for the current cap window.
//
// A reward cap is the most silently expensive mechanic in a credit card: past
// the cap the user keeps spending on that card and earns nothing, with no
// notification from the issuer. This tracker converts real ledger spend into
// earned reward units and flags caps close to binding, so the user can switch
// cards before the next transaction is wasted.

import type { MockRule } from "@/lib/logic/advisor/rules";
import type { MockCard } from "@/lib/logic/advisor/cards";
import type { LedgerEntry, Insight } from "./types";
import {
  demoNow,
  daysUntil,
  formatDeadline,
  windowForPeriod,
  elapsedFraction,
  type TrackedPeriod,
} from "./demoClock";
import { inr, urgencyFor } from "./format";

/** Utilisation is only worth surfacing once the cap is genuinely in reach. */
const ALERT_THRESHOLD = 0.6;

export interface CapUsage {
  capId: string;
  /** Categories pooled under this cap. */
  categories: string[];
  period: TrackedPeriod;
  scope: string;
  metric: string;
  /** Cap ceiling in reward units (points or rupees of cashback). */
  capValue: number;
  /** Reward units already earned in the window. */
  earnedUnits: number;
  utilisation: number;
  /** Rupees of spend that still earns before the cap binds. */
  headroomSpendInr: number;
  deadline: Date;
  daysRemaining: number;
  periodElapsed: number;
}

/**
 * Reward units earned per rupee for a rule. `direct_swipe_percentage` is a
 * percentage of spend; for cashback that IS rupees, for points it is the
 * points-per-rupee-equivalent the catalogue already normalises.
 */
function unitsPerRupee(rule: MockRule): number {
  return (rule.reward?.direct_swipe_percentage ?? 0) / 100;
}

/**
 * Group rules into cap buckets and measure each against real spend.
 *
 * Bucketing follows the cap's own `scope`: a "card" scope pools every category
 * sharing that ceiling into ONE bucket (spending on groceries eats the same
 * ceiling as spending on flights), while "category" scope keeps them separate.
 * Getting this wrong is the difference between "you have ₹2,000 left" and the
 * truth, "you have ₹140 left".
 */
export function trackCaps(
  card: MockCard,
  rules: MockRule[],
  entries: LedgerEntry[],
  anniversary: Date | null,
  now: Date = demoNow(),
): CapUsage[] {
  const buckets = new Map<
    string,
    {
      rules: MockRule[];
      cap: NonNullable<MockRule["caps"]["reward_cap"]>;
    }
  >();

  for (const r of rules) {
    const cap = r.caps?.reward_cap;
    if (!cap || !cap.value || cap.value <= 0) continue;
    if (!isTracked(cap.period)) continue;

    // Shared cap groups pool across rules by design; otherwise scope decides.
    const groupKey = r.shared_cap_group
      ? `shared:${JSON.stringify(r.shared_cap_group)}`
      : cap.scope === "category"
        ? `cat:${r.category}`
        : `card:${cap.period}:${cap.metric}:${cap.value}`;

    const b = buckets.get(groupKey);
    if (b) b.rules.push(r);
    else buckets.set(groupKey, { rules: [r], cap });
  }

  const out: CapUsage[] = [];

  for (const [capId, { rules: bucketRules, cap }] of buckets) {
    const period = cap.period as TrackedPeriod;
    const w = windowForPeriod(period, anniversary, now);
    const categories = [...new Set(bucketRules.map((r) => r.category))];

    // Rate varies per category within a bucket, so accumulate per entry using
    // the rule that actually applies to it rather than one blended rate.
    const rateByCategory = new Map<string, number>();
    for (const r of bucketRules) {
      const rate = unitsPerRupee(r);
      const cur = rateByCategory.get(r.category) ?? 0;
      if (rate > cur) rateByCategory.set(r.category, rate);
    }

    let earnedUnits = 0;
    for (const e of entries) {
      if (e.postedAt < w.start || e.postedAt >= w.end) continue;
      const rate = rateByCategory.get(e.category);
      if (!rate) continue;
      earnedUnits += e.amountInr * rate;
    }
    if (earnedUnits <= 0) continue;

    const utilisation = Math.min(1, earnedUnits / cap.value);
    // Headroom expressed as spend, using the best rate in the bucket — the
    // fastest way the user could hit the ceiling.
    const bestRate = Math.max(...rateByCategory.values());
    const headroomUnits = Math.max(0, cap.value - earnedUnits);
    const headroomSpendInr = bestRate > 0 ? headroomUnits / bestRate : 0;

    out.push({
      capId: `${card._id}:${capId}`,
      categories,
      period,
      scope: cap.scope,
      metric: cap.metric,
      capValue: cap.value,
      earnedUnits,
      utilisation,
      headroomSpendInr,
      deadline: w.end,
      daysRemaining: daysUntil(w.end, now),
      periodElapsed: elapsedFraction(w, now),
    });
  }

  return out.sort((a, b) => b.utilisation - a.utilisation);
}

function isTracked(p: string): p is TrackedPeriod {
  return ["daily", "monthly", "quarterly", "halfyearly", "annually"].includes(p);
}

/** Convert cap utilisation into ranked insights. */
export function capInsights(
  cardSlug: string,
  cardName: string,
  usages: CapUsage[],
  /** Rupee value of one reward point, from the card's own catalogue entry. */
  pointValueInr: number,
): Insight[] {
  return usages
    .filter((u) => u.utilisation >= ALERT_THRESHOLD)
    .map((u) => {
      const isCashback = u.metric === "cashback";
      const unit = isCashback ? "" : " pts";
      const earned = isCashback
        ? inr(u.earnedUnits)
        : `${Math.round(u.earnedUnits).toLocaleString("en-IN")}${unit}`;
      const ceiling = isCashback
        ? inr(u.capValue)
        : `${u.capValue.toLocaleString("en-IN")}${unit}`;
      const pct = Math.round(u.utilisation * 100);
      const capped = u.utilisation >= 1;

      return {
        id: `cap:${u.capId}`,
        kind: "reward_cap" as const,
        cardSlug,
        cardName,
        title: capped
          ? `${cardName} has stopped earning`
          : `${pct}% of your ${periodWord(u.period)} cap used`,
        detail: capped
          ? `You have hit the ${ceiling} ${periodWord(
              u.period,
            )} cap on ${cardName}. Every further rupee on this card earns nothing until ${formatDeadline(
              u.deadline,
            )}.`
          : `${earned} of ${ceiling} earned on ${cardName}. Only about ${inr(
              u.headroomSpendInr,
            )} of spend still earns before the cap binds.`,
        action: capped
          ? `Switch cards until ${formatDeadline(u.deadline)}`
          : `Switch cards after ${inr(u.headroomSpendInr)} more`,
        // What is at stake is the reward forgone by continuing to spend on a
        // capped card. Points are converted at the card's own redemption value
        // rather than a flat assumption.
        valueAtRiskInr: isCashback ? u.capValue : u.capValue * pointValueInr,
        deadline: u.deadline,
        daysRemaining: u.daysRemaining,
        progress: u.utilisation,
        progressLabel: `${earned} of ${ceiling}`,
        periodElapsed: u.periodElapsed,
        urgency: capped ? "critical" : urgencyFor(u.daysRemaining, u.utilisation),
        score:
          (isCashback ? u.capValue : u.capValue * pointValueInr) /
          Math.max(1, u.daysRemaining),
      };
    });
}

function periodWord(p: TrackedPeriod): string {
  return p === "monthly"
    ? "monthly"
    : p === "quarterly"
      ? "quarterly"
      : p === "daily"
        ? "daily"
        : p === "halfyearly"
          ? "half-yearly"
          : "annual";
}
