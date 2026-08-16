export type CardsType = "food" | "shopping" | "rounder" | "travel";

export interface CreditCard {
  _id: string;
  cardId: { _id: string; name: string; bankName: string; slug: string };
}

export type MessageSourceType = "DIRECT" | "JOURNEY";

/** One line of the reward breakdown, kept numeric so the UI can rank and chart it. */
export interface CardRewardStream {
  label: string;
  valueInr: number;
  /** Forex markup and similar are costs, not earnings — rendered as negative. */
  isCost?: boolean;
}

/** An unlocked milestone, and what it took to unlock it. */
export interface CardMilestoneSummary {
  label: string;
  annualValueInr: number;
  spendThresholdInr: number;
  period: string;
}

export interface BotRecommendationCreditCardProps {
  cardName: string;
  netAnnualRewardLoss: string;
  returnOnSpend: string;
  categoryWiseReward: string;
  whyThisCard: string;
  annualFee: string;
  notIdealFor: string;
  applyLink: string;
  id: string;

  /* --------------------------------------------------------------------- */
  /* Structured fields.                                                     */
  /*                                                                        */
  /* The strings above are the original wire shape from when the partner    */
  /* bot returned recommendations as JSON. Now that the engines run locally  */
  /* the real numbers are available, so they are passed through as numbers  */
  /* instead of being formatted and re-parsed. All optional: a payload that  */
  /* arrives over the socket, or one restored from an older session, has    */
  /* only the strings, and the UI falls back to them.                       */
  /* --------------------------------------------------------------------- */

  /** Net annual value: spend return + milestones − fee. The headline figure. */
  netAnnualValueInr?: number;
  /** Rupees behind the best card. 0 for the winner. */
  lossVsBestInr?: number;
  /** Projected annual spend the whole recommendation is based on. */
  annualSpendInr?: number;
  feeInr?: number;
  feeWaived?: boolean;
  /** Spend needed to waive the fee, when a waiver exists and is unmet. */
  feeWaiverSpendInr?: number;
  rewardStreams?: CardRewardStream[];
  milestones?: CardMilestoneSummary[];
  bankName?: string;
  /** Rank within the recommendation, 1-based. */
  rank?: number;
}
