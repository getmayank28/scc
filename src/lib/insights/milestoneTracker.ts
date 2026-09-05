// Milestone progress within the CURRENT period.
//
// Distinct from `computeMilestoneReturnInr` in scoring.ts: that answers "would
// this card pay out at a projected annual spend?" for recommendation ranking.
// This answers "how far into the live window is the user right now, and what
// must they spend before it closes?" — so it buckets real ledger spend into the
// active window instead of dividing an annual projection.

import type { MockMilestone } from "@/lib/logic/advisor/scoring";
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

const TRACKED: TrackedPeriod[] = [
  "daily",
  "monthly",
  "quarterly",
  "halfyearly",
  "annually",
];

function isTracked(p: string | null): p is TrackedPeriod {
  return p !== null && (TRACKED as string[]).includes(p);
}

export interface MilestoneProgress {
  milestoneKey: string;
  label: string;
  period: TrackedPeriod;
  thresholdInr: number;
  spentInr: number;
  remainingInr: number;
  benefitValueInr: number;
  achieved: boolean;
  deadline: Date;
  daysRemaining: number;
  periodElapsed: number;
}

/**
 * Progress against every live milestone on one card.
 *
 * Within a `mutual_exclusivity_group` only ONE tier is actionable: the cheapest
 * tier the user has not yet cleared. Showing every tier would double-count the
 * value and tell the user to chase a goal that a lower tier already supersedes.
 */
export function trackMilestones(
  milestones: MockMilestone[] | undefined,
  entries: LedgerEntry[],
  anniversary: Date | null,
  now: Date = demoNow(),
): MilestoneProgress[] {
  if (!milestones?.length) return [];

  const all: (MilestoneProgress & { group: string | null; tier: number })[] = [];

  for (const m of milestones) {
    if (!isTracked(m.milestone_period)) continue;
    if (m.spend_threshold_inr === null || m.spend_threshold_inr <= 0) continue;
    if (m.benefit_value_inr === null || m.benefit_value_inr <= 0) continue;

    const w = windowForPeriod(m.milestone_period, anniversary, now);
    const spentInr = entries.reduce(
      (t, e) =>
        e.postedAt >= w.start && e.postedAt < w.end ? t + e.amountInr : t,
      0,
    );

    all.push({
      milestoneKey: m.milestoneKey,
      label: m.milestone_type ?? "Milestone",
      period: m.milestone_period,
      thresholdInr: m.spend_threshold_inr,
      spentInr,
      remainingInr: Math.max(0, m.spend_threshold_inr - spentInr),
      benefitValueInr: m.benefit_value_inr,
      achieved: spentInr >= m.spend_threshold_inr,
      deadline: w.end,
      daysRemaining: daysUntil(w.end, now),
      periodElapsed: elapsedFraction(w, now),
      group: m.mutual_exclusivity_group,
      tier: m.tier_order ?? Number.POSITIVE_INFINITY,
    });
  }

  // Collapse mutually-exclusive tiers to the single actionable one.
  const byGroup = new Map<string, (typeof all)[number]>();
  const out: MilestoneProgress[] = [];

  for (const p of all) {
    if (!p.group) {
      out.push(p);
      continue;
    }
    const cur = byGroup.get(p.group);
    if (!cur) {
      byGroup.set(p.group, p);
      continue;
    }
    // Prefer the nearest unachieved tier; if all are achieved, keep the richest.
    const better = cur.achieved && p.achieved
      ? p.benefitValueInr > cur.benefitValueInr
      : cur.achieved
        ? true
        : !p.achieved && p.remainingInr < cur.remainingInr;
    if (better) byGroup.set(p.group, p);
  }
  out.push(...byGroup.values());

  return out.sort((a, b) => a.remainingInr - b.remainingInr);
}

/** Convert milestone progress into ranked, user-facing insights. */
export function milestoneInsights(
  cardSlug: string,
  cardName: string,
  progress: MilestoneProgress[],
): Insight[] {
  return progress
    // An achieved milestone is not an action — it is already banked.
    .filter((p) => !p.achieved && p.remainingInr > 0)
    .map((p) => {
      const progressFraction =
        p.thresholdInr > 0 ? Math.min(1, p.spentInr / p.thresholdInr) : 0;
      return {
        id: `milestone:${p.milestoneKey}`,
        kind: "milestone" as const,
        cardSlug,
        cardName,
        title: `${inr(p.remainingInr)} from ${inr(p.benefitValueInr)} in rewards`,
        detail: `${p.label} on ${cardName}: spend ${inr(
          p.thresholdInr,
        )} ${periodPhrase(p.period)} to unlock ${inr(
          p.benefitValueInr,
        )}. You are at ${inr(p.spentInr)}.`,
        action: `Spend ${inr(p.remainingInr)} by ${formatDeadline(p.deadline)}`,
        valueAtRiskInr: p.benefitValueInr,
        deadline: p.deadline,
        daysRemaining: p.daysRemaining,
        progress: progressFraction,
        progressLabel: `${inr(p.spentInr)} of ${inr(p.thresholdInr)}`,
        periodElapsed: p.periodElapsed,
        urgency: urgencyFor(p.daysRemaining, progressFraction),
        score: p.benefitValueInr / Math.max(1, p.daysRemaining),
      };
    });
}

function periodPhrase(p: TrackedPeriod): string {
  switch (p) {
    case "daily":
      return "today";
    case "monthly":
      return "this month";
    case "quarterly":
      return "this quarter";
    case "halfyearly":
      return "this half-year";
    case "annually":
      return "this card year";
  }
}
