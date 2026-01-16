export type CardsType = "food" | "shopping" | "rounder" | "travel";

export interface CreditCard {
  _id: string;
  cardId: { name: string; bankName: string };
}
