export type CardsType = "food" | "shopping" | "rounder" | "travel";

export interface CreditCard {
  _id: string;
  cardId: { _id: string; name: string; bankName: string };
}
