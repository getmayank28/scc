export type TravelFrequency = "rare" | "occasional" | "frequent";

export type CreditCard = {
  id: string;
  name: string;
  bank: string;
  bankShort: string;
  network: "Visa" | "Mastercard" | "Amex" | "Rupay" | "Diners";
  tier: "premium" | "super-premium" | "mid" | "entry";
  annualFee: number;
  feeWaiverSpend: number;
  rewardRatePct: number;
  bonusCategoryRatePct: number;
  bonusCategoriesLabel: string;
  loungeVisitsDomestic: number;
  loungeVisitsInternational: number;
  loungeValuePerVisit: number;
  milestoneBenefitValue: number;
  milestoneBenefitLabel: string;
  cardGradient: string;
  accent: string;
  emblem: string;
};

export type CalculatorInputs = {
  cardId: string;
  monthlySpend: number;
  travel: TravelFrequency;
  wantsLoungeAccess: boolean;
};

export type CalculatorResult = {
  card: CreditCard;
  yearlySpend: number;
  rewardsValue: number;
  loungeValue: number;
  milestoneValue: number;
  annualFee: number;
  feeWaived: boolean;
  netValue: number;
  effectiveReturnPct: number;
  valueScore: number;
  travelerLabel: string;
  insights: Insight[];
};

export type InsightTone = "green" | "yellow" | "red" | "blue";

export type Insight = {
  tone: InsightTone;
  title: string;
  body: string;
};
