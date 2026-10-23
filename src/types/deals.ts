/** Shapes shared by /api/deals and the deals UI. */

import type { Discount } from "@/lib/deals/discount";
import type { DealCategory } from "@/lib/deals/categories";

export interface DealBestCard {
  cardId: string;
  cardName: string;
  /** Effective % back on the winning route. */
  ratePct: number;
  /** "voucher" means buy the merchant's gift voucher via the bank portal first. */
  route: "voucher" | "swipe";
  /** False when the merchant has no card rule and the answer is category-wide. */
  merchantSpecific: boolean;
}

export interface Deal {
  offerId: number;
  title: string;
  description: string | null;
  terms: string | null;
  couponCode: string | null;
  percentOff: number | null;
  /** Headline discount read from the title, for the badge and ranking. */
  discount: Discount | null;
  endDate: string | null;
  /** Set when the deal only applies to one issuer's cards. */
  bank: string | null;
}

export interface MerchantDeals {
  portalSlug: string;
  merchantName: string;
  /** Sister stores on the same campaign with the same deals, folded into this one. */
  alsoAt: string[];
  category: DealCategory;
  bestCard: DealBestCard | null;
  deals: Deal[];
}

export interface DealsResponse {
  merchants: MerchantDeals[];
  /** True when the user has no cards, so no merchant can show a card pick. */
  walletEmpty: boolean;
  /** `Deal.bank` values the user holds a card from, for "works with your card". */
  walletBanks: string[];
}
