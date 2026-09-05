// Per-card rollups for the wallet selector.
//
// Every figure here is derived from the insights payload the server already
// returns — no card metadata is invented. A tile therefore describes exactly
// what the feed below it will say, and cannot drift from it.

import {
  KIND_LABEL,
  inr,
  pts,
  type ClientInsight,
  type InsightsPayload,
  type Urgency,
} from "./clientTypes";
import { URGENCY_RANK } from "./format";

export interface WalletCardSummary {
  slug: string;
  name: string;
  isActive: boolean;
  /** Insights belonging to this card, already in the payload's ranked order. */
  insights: ClientInsight[];
  /** Sum of value at risk across this card's dated insights. */
  atRiskInr: number;
  /** Highest urgency present on the card, for the tile's accent. */
  urgency: Urgency;
  /** Nearest live deadline on this card, in days. Null when nothing is dated. */
  soonestDays: number | null;
  /** Label for that deadline, e.g. "Fee waiver". */
  soonestLabel: string | null;
  /** FiSense points accrued on this card's tracked spend. */
  points: number;
}

/**
 * One derived stat shown on a card tile. The pair varies by card because the
 * mechanics do: a card whose story is a cap ceiling should lead with the cap,
 * not with a milestone it does not have.
 */
export interface TileStat {
  eyebrow: string;
  value: string;
  caption: string;
  /** True when the caption should read as a warning rather than a note. */
  alert?: boolean;
}

export function buildWalletSummaries(
  payload: InsightsPayload,
): WalletCardSummary[] {
  const rp = payload.rewardPoints;

  const summaries = payload.cards.map((c) => {
    const insights = payload.insights.filter((i) => i.cardSlug === c.slug);
    const dated = insights.filter(
      (i): i is ClientInsight & { daysRemaining: number } =>
        i.deadline !== null && i.daysRemaining !== null && i.daysRemaining > 0,
    );
    const soonest = dated.length
      ? dated.reduce((a, b) => (b.daysRemaining < a.daysRemaining ? b : a))
      : null;

    return {
      slug: c.slug,
      name: c.name,
      isActive: c.isActive,
      insights,
      atRiskInr: Math.round(
        insights
          .filter((i) => i.deadline !== null)
          .reduce((t, i) => t + i.valueAtRiskInr, 0),
      ),
      urgency: mostUrgent(insights),
      soonestDays: soonest?.daysRemaining ?? null,
      soonestLabel: soonest ? KIND_LABEL[soonest.kind] : null,
      points: Math.round(rp?.byCard?.[c.slug] ?? 0),
    };
  });

  // Cards carrying the most exposure lead, so the wallet reads left-to-right in
  // the order the user should act.
  return summaries.sort((a, b) => b.atRiskInr - a.atRiskInr);
}

function mostUrgent(insights: ClientInsight[]): Urgency {
  if (!insights.length) return "info";
  return insights.reduce<Urgency>(
    (worst, i) =>
      URGENCY_RANK[i.urgency] < URGENCY_RANK[worst] ? i.urgency : worst,
    "info",
  );
}

/**
 * The two stats a tile shows.
 *
 * The first slot is the card's dominant mechanic — the kind of its top-ranked
 * insight — rendered in that mechanic's own terms. The second is always the
 * nearest deadline, so the tiles stay comparable at a glance.
 */
export function tileStats(
  s: WalletCardSummary,
  pointValueInr: number,
): [TileStat, TileStat] {
  const lead = s.insights[0] ?? null;

  const primary: TileStat = lead
    ? leadStat(lead, s, pointValueInr)
    : {
        eyebrow: "Reward balance",
        value: `${pts(s.points)} pts`,
        caption: `≈ ${inr(s.points * pointValueInr)}`,
      };

  const deadline: TileStat =
    s.soonestDays !== null
      ? {
          eyebrow: "Nearest deadline",
          value: `${s.soonestDays} days left`,
          caption: s.soonestLabel ?? "",
          alert: s.soonestDays <= 30,
        }
      : {
          eyebrow: "Nearest deadline",
          value: "None",
          caption: "Nothing expiring",
        };

  return [primary, deadline];
}

/** The lead insight, expressed as a compact tile stat in its own units. */
function leadStat(
  lead: ClientInsight,
  s: WalletCardSummary,
  pointValueInr: number,
): TileStat {
  switch (lead.kind) {
    case "reward_cap":
      return {
        eyebrow: "Cap utilisation",
        value: lead.progressLabel ?? inr(lead.valueAtRiskInr),
        caption: `${Math.round((lead.progress ?? 0) * 100)}% of cap used`,
        alert: (lead.progress ?? 0) >= 0.8,
      };
    case "milestone":
      return {
        eyebrow: "Milestone spend",
        value: lead.progressLabel ?? inr(lead.valueAtRiskInr),
        caption: `${Math.round((lead.progress ?? 0) * 100)}% of target`,
        alert: (lead.progress ?? 0) < 1,
      };
    case "fee_waiver":
      return {
        eyebrow: "Fee waiver",
        value: lead.progressLabel ?? inr(lead.valueAtRiskInr),
        caption: `${Math.round((lead.progress ?? 0) * 100)}% of threshold`,
        alert: (lead.progress ?? 0) < 1,
      };
    default:
      return {
        eyebrow: "Reward balance",
        value: `${pts(s.points)} pts`,
        caption: `≈ ${inr(s.points * pointValueInr)}`,
      };
  }
}
