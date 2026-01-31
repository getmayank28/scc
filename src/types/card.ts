export type CardsType = "food" | "shopping" | "rounder" | "travel";

export interface CreditCard {
  _id: string;
  cardId: { _id: string; name: string; bankName: string };
}

export type MessageSourceType = "DIRECT" | "JOURNEY";


export interface BotRecommendationCreditCardProps {
  cardName: string;
  netAnnualRewardLoss: string;
  returnOnSpend: string;
  categoryWiseReward: string;
  whyThisCard: string;
  annualFee: string;
  notIdealFor: string;
  applyLink: string;
}