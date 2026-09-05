// Shared shapes for the insights layer.
//
// `LedgerEntry` is deliberately the shape an email-statement parser produces:
// one posted transaction, attributed to a card by slug. The demo ledger and a
// future real parser both emit exactly this, so nothing downstream changes when
// email access lands.

import type { Category } from "@/lib/logic/advisor/cards";

export interface LedgerEntry {
  /** Joins to Card.slug (and therefore CardRule/CardMilestone.cardSlug). */
  cardSlug: string;
  category: Category;
  merchant: string | null;
  amountInr: number;
  postedAt: Date;
}

/** A card the user actually holds, with the cycle metadata a statement reveals. */
export interface WalletCard {
  cardSlug: string;
  /** Fee-waiver / annual-milestone reset date. From the card's issue date. */
  anniversary: Date;
}

export type BenefitType = "lounge" | "movie" | "golf" | "spa" | "other";

/**
 * A countable, expiring card benefit — lounge visits, movie tickets, golf
 * rounds. Unused units are forfeited at `expiresAt`; they do not roll over,
 * which is what makes them worth alerting on.
 */
export interface BenefitEntitlement {
  id: string;
  cardSlug: string;
  label: string;
  benefitType: BenefitType;
  totalUnits: number;
  usedUnits: number;
  /** Realistic market value of one unit, for rupees-at-risk. */
  unitValueInr: number;
  /** e.g. "this quarter" — used in copy. */
  periodLabel: string;
  expiresAt: Date;
}

export type InsightKind =
  | "milestone"
  | "reward_cap"
  | "fee_waiver"
  | "unused_benefit";

export type Urgency = "critical" | "high" | "moderate" | "info";

/**
 * One ranked, user-facing insight. Every tracker emits this shape so the feed
 * can rank heterogeneous findings against each other.
 */
export interface Insight {
  id: string;
  kind: InsightKind;
  cardSlug: string;
  cardName: string;
  /** Short headline, e.g. "₹28,000 from your fee waiver". */
  title: string;
  /** One-sentence explanation of the mechanic. */
  detail: string;
  /** Imperative next step, e.g. "Spend ₹28,000 by 31 Mar". */
  action: string;
  /**
   * Rupees gained by acting (or lost by not). Drives ranking, so it must be a
   * real figure derived from card data — never a UI-invented number.
   */
  valueAtRiskInr: number;
  /** When the opportunity closes. Null for open-ended findings. */
  deadline: Date | null;
  daysRemaining: number | null;
  /** 0..1 progress toward the threshold, when the insight has one. */
  progress: number | null;
  progressLabel: string | null;
  /**
   * 0..1 how far through the insight's own period the clock has travelled.
   * Computed server-side from the real window rather than inferred by the
   * client, so the decay meter's tick reflects the actual period length.
   */
  periodElapsed: number | null;
  urgency: Urgency;
  /** valueAtRiskInr / max(daysRemaining, 1) — the ranking score. */
  score: number;
}
