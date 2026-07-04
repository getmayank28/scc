import { saleData, type SaleMerchant, type SaleRecord } from "../data";
import { cardDisplayName } from "../utils/cardName";

/**
 * Compact, client-safe subset of a {@link SaleRecord}. The full `saleData`
 * array (1000+ rows) is filtered + trimmed to a single merchant on the server
 * and passed to the client so the estimator can compute savings without
 * shipping the entire dataset into the browser bundle.
 */
export interface MerchantOffer {
  bank: string;
  slug: string;
  directSwipePercentage?: number;
  voucherDiscountPercentage?: number;
  voucherRewardPercentage?: number;
  convenienceFeePercentage?: number;
  voucherMonthlyPurchaseLimitInr?: number;
  saleBaseDiscount?: number;
  minTransactionSaleBaseDiscount?: number;
  maxBaseDiscount?: number;
  saleEmiDiscount?: number;
  minTransactionSaleEmiDiscount?: number;
  maxEmiDiscount?: number;
  totalMaxDiscount?: number;
}

export type SavingKind = "instant" | "voucher" | "reward";

export interface BankSaving {
  bank: string;
  savings: number; // rupees saved on the given amount (rounded)
  effectivePct: number; // headline "up to X%"
  kind: SavingKind;
}

const OFFER_FIELDS = [
  "bank",
  "slug",
  "directSwipePercentage",
  "voucherDiscountPercentage",
  "voucherRewardPercentage",
  "convenienceFeePercentage",
  "voucherMonthlyPurchaseLimitInr",
  "saleBaseDiscount",
  "minTransactionSaleBaseDiscount",
  "maxBaseDiscount",
  "saleEmiDiscount",
  "minTransactionSaleEmiDiscount",
  "maxEmiDiscount",
  "totalMaxDiscount",
] as const;

function trimOffer(row: SaleRecord): MerchantOffer {
  const offer: Record<string, unknown> = {};
  for (const key of OFFER_FIELDS) {
    const value = row[key];
    if (value !== undefined && value !== "") offer[key] = value;
  }
  return offer as unknown as MerchantOffer;
}

/** Server-side: filter the dataset to one merchant and drop non-numeric noise. */
export function getMerchantOffers(merchant: SaleMerchant): MerchantOffer[] {
  return saleData
    .filter((row) => row.merchant === merchant)
    .map((row) => trimOffer(row));
}

/**
 * A single named card with its merchant-specific offer, plus the everyday
 * direct-swipe reward taken from the card's `others` (base) row — needed so the
 * per-card breakdown can show the swipe route even when the sale row omits it.
 */
export interface CardOffer extends MerchantOffer {
  name: string;
  emiProcessingFee?: string;
  baseDirectSwipePercentage?: number;
}

/** Server-side: one entry per card for a merchant, sorted by bank then name. */
export function getMerchantCards(merchant: SaleMerchant): CardOffer[] {
  const baseSwipe = new Map<string, number>();
  for (const row of saleData) {
    if (row.merchant === "others" && row.directSwipePercentage !== undefined) {
      baseSwipe.set(row.slug, row.directSwipePercentage);
    }
  }

  return saleData
    .filter((row) => row.merchant === merchant)
    .map((row) => ({
      ...trimOffer(row),
      name: cardDisplayName(row.slug, row.bank),
      emiProcessingFee: row.emiProcessingFee,
      baseDirectSwipePercentage: baseSwipe.get(row.slug),
    }))
    .sort((a, b) => a.bank.localeCompare(b.bank) || a.name.localeCompare(b.name));
}

export type BenefitRouteKey = "instant" | "emi" | "voucher" | "swipe";

export interface BenefitRoute {
  key: BenefitRouteKey;
  label: string;
  /** Rupees saved on `amount` right now (0 if the offer exists but isn't yet unlocked). */
  savings: number;
  /** Headline rate, when the route is percentage-based. */
  pct?: number;
  /** Offer exists for this card. */
  available: boolean;
  /** Currently unlocked at this amount (min-transaction thresholds met). */
  eligible: boolean;
  /** One-line terms summary. */
  detail: string;
  /** What's needed to unlock, when not yet eligible. */
  requirement?: string;
}

const round = (n: number) => Math.round(n);

/**
 * Every publicly-available way a *specific* card can save on `amount` during the
 * sale: instant discount, EMI discount, voucher route and direct-swipe rewards.
 * Returns only routes the card actually offers. All figures are derived from the
 * public dataset — the user picks the card, so nothing here is personalized.
 */
export function computeCardRoutes(card: CardOffer, amount: number): BenefitRoute[] {
  const routes: BenefitRoute[] = [];

  // 1. Instant sale discount
  if (card.saleBaseDiscount) {
    const minTxn = card.minTransactionSaleBaseDiscount ?? 0;
    const eligible = amount >= minTxn;
    const raw = (amount * card.saleBaseDiscount) / 100;
    const capped = Math.min(raw, card.maxBaseDiscount ?? Infinity);
    routes.push({
      key: "instant",
      label: "Instant sale discount",
      savings: eligible ? round(capped) : 0,
      pct: card.saleBaseDiscount,
      available: true,
      eligible,
      detail: `${card.saleBaseDiscount}% off instantly${
        card.maxBaseDiscount ? `, up to ₹${card.maxBaseDiscount.toLocaleString("en-IN")}` : ""
      }`,
      requirement: eligible
        ? undefined
        : `Spend ₹${minTxn.toLocaleString("en-IN")}+ to unlock`,
    });
  }

  // 2. EMI sale discount
  if (card.saleEmiDiscount) {
    const minTxn = card.minTransactionSaleEmiDiscount ?? 0;
    const eligible = amount >= minTxn;
    const raw = (amount * card.saleEmiDiscount) / 100;
    const capped = Math.min(raw, card.maxEmiDiscount ?? Infinity);
    routes.push({
      key: "emi",
      label: "EMI sale discount",
      savings: eligible ? round(capped) : 0,
      pct: card.saleEmiDiscount,
      available: true,
      eligible,
      detail: `${card.saleEmiDiscount}% off on EMI${
        card.emiProcessingFee ? ` · ${card.emiProcessingFee}` : ""
      }`,
      requirement: eligible
        ? undefined
        : `Spend ₹${minTxn.toLocaleString("en-IN")}+ on EMI to unlock`,
    });
  }

  // 3. Voucher route
  const voucherPct =
    (card.voucherRewardPercentage ?? 0) +
    (card.voucherDiscountPercentage ?? 0) -
    (card.convenienceFeePercentage ?? 0);
  if (voucherPct > 0) {
    const limit = card.voucherMonthlyPurchaseLimitInr;
    const eligibleAmount = limit ? Math.min(amount, limit) : amount;
    const savings = round((eligibleAmount * voucherPct) / 100);
    const feeNote = card.convenienceFeePercentage
      ? ` (net of ${card.convenienceFeePercentage}% fee)`
      : "";
    const limitNote =
      limit && amount > limit
        ? ` · only ₹${limit.toLocaleString("en-IN")}/mo qualifies`
        : limit
        ? ` · up to ₹${limit.toLocaleString("en-IN")}/mo`
        : "";
    routes.push({
      key: "voucher",
      label: "Voucher benefits",
      savings,
      pct: Math.round(voucherPct * 10) / 10,
      available: true,
      eligible: true,
      detail: `${Math.round(voucherPct * 10) / 10}% value via vouchers${feeNote}${limitNote}`,
    });
  }

  // 4. Direct-swipe rewards (sale row rate if present, else everyday base rate)
  const swipePct = card.directSwipePercentage ?? card.baseDirectSwipePercentage;
  if (swipePct && swipePct > 0) {
    routes.push({
      key: "swipe",
      label: "Direct-swipe rewards",
      savings: round((amount * swipePct) / 100),
      pct: swipePct,
      available: true,
      eligible: true,
      detail:
        card.directSwipePercentage !== undefined
          ? `${swipePct}% rewards on sale spends`
          : `${swipePct}% everyday reward rate`,
    });
  }

  return routes.sort((a, b) => b.savings - a.savings);
}

/** The best currently-unlocked route for a card at a given amount. */
export function bestCardRoute(routes: BenefitRoute[]): BenefitRoute | null {
  const eligible = routes.filter((r) => r.eligible && r.savings > 0);
  return eligible.length ? eligible[0] : null;
}

/**
 * Best publicly-available saving a single card offer yields on `amount`.
 * Considers instant/EMI flat discounts, voucher-route rewards and direct-swipe
 * rewards, and returns whichever is largest. Numbers come straight from the
 * public sale dataset — nothing here is personalized.
 */
export function offerSaving(
  offer: MerchantOffer,
  amount: number
): { savings: number; pct: number; kind: SavingKind } {
  // Flat instant / EMI discount (e.g. "10% up to ₹1,500 over ₹4,990").
  let instant = 0;
  if (offer.saleBaseDiscount && amount >= (offer.minTransactionSaleBaseDiscount ?? 0)) {
    instant = Math.min(
      (amount * offer.saleBaseDiscount) / 100,
      offer.maxBaseDiscount ?? Infinity
    );
  }
  if (offer.saleEmiDiscount && amount >= (offer.minTransactionSaleEmiDiscount ?? 0)) {
    const emi = Math.min(
      (amount * offer.saleEmiDiscount) / 100,
      offer.maxEmiDiscount ?? Infinity
    );
    instant = Math.max(instant, emi);
  }
  if (instant > 0 && offer.totalMaxDiscount) {
    instant = Math.min(instant, offer.totalMaxDiscount);
  }

  // Voucher route: reward % (net of convenience fee), capped by monthly limit.
  const voucherPct =
    (offer.voucherRewardPercentage ?? 0) +
    (offer.voucherDiscountPercentage ?? 0) -
    (offer.convenienceFeePercentage ?? 0);
  let voucher = 0;
  if (voucherPct > 0) {
    const eligible = offer.voucherMonthlyPurchaseLimitInr
      ? Math.min(amount, offer.voucherMonthlyPurchaseLimitInr)
      : amount;
    voucher = (eligible * voucherPct) / 100;
  }

  // Plain direct-swipe reward.
  const swipe = offer.directSwipePercentage
    ? (amount * offer.directSwipePercentage) / 100
    : 0;

  const best = Math.max(instant, voucher, swipe, 0);
  const kind: SavingKind =
    best === 0
      ? "reward"
      : best === instant
      ? "instant"
      : best === voucher
      ? "voucher"
      : "reward";

  return {
    savings: Math.round(best),
    pct: amount > 0 ? (best / amount) * 100 : 0,
    kind,
  };
}

/**
 * Top `limit` banks by best-card saving for a purchase of `amount`.
 * Groups a merchant's offers by bank, keeping each bank's strongest card.
 */
export function topBankSavings(
  offers: MerchantOffer[],
  amount: number,
  limit = 5
): BankSaving[] {
  const byBank = new Map<string, BankSaving>();

  for (const offer of offers) {
    const { savings, pct, kind } = offerSaving(offer, amount);
    if (savings <= 0) continue;
    const existing = byBank.get(offer.bank);
    if (!existing || savings > existing.savings) {
      byBank.set(offer.bank, {
        bank: offer.bank,
        savings,
        effectivePct: Math.round(pct * 10) / 10,
        kind,
      });
    }
  }

  return Array.from(byBank.values())
    .sort((a, b) => b.savings - a.savings)
    .slice(0, limit);
}

/** Highest single saving across all banks — powers the "you could save" hook. */
export function maxSaving(offers: MerchantOffer[], amount: number): number {
  return offers.reduce(
    (max, offer) => Math.max(max, offerSaving(offer, amount).savings),
    0
  );
}
