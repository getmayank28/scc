import type { SaleMerchant } from "../data";

export interface MerchantConfig {
  key: SaleMerchant;
  /** Display name used across the page. */
  label: string;
  /** Name of the headline sale event. */
  saleName: string;
  /** Short emoji used as a tasteful, non-branded sale accent. */
  emoji: string;
}

/**
 * Copy/branding is Flipkart-first (per the WhatsApp campaign) but the route is
 * merchant-aware, so Amazon / others still resolve to a sensible experience
 * without ever copying a partner's brand system — we lean on our own orange.
 */
export const MERCHANTS: Record<SaleMerchant, MerchantConfig> = {
  flipkart: {
    key: "flipkart",
    label: "Flipkart",
    saleName: "Flipkart Sale",
    emoji: "🎉",
  },
  amazon: {
    key: "amazon",
    label: "Amazon",
    saleName: "Amazon Sale",
    emoji: "🛍️",
  },
  others: {
    key: "others",
    label: "This Sale",
    saleName: "Festive Sale",
    emoji: "✨",
  },
};

export const isMerchant = (value: string): value is SaleMerchant =>
  value === "amazon" || value === "flipkart" || value === "others";

export function getMerchant(value: string): MerchantConfig {
  return isMerchant(value) ? MERCHANTS[value] : MERCHANTS.others;
}

export interface PurchaseCategory {
  id: string;
  label: string;
  /** Sensible default purchase amount (₹) to pre-fill the estimator slider. */
  defaultAmount: number;
  /** Lucide icon name resolved in the estimator component. */
  icon: "Smartphone" | "Laptop" | "Tv" | "WashingMachine" | "Shirt" | "Sofa";
}

export const CATEGORIES: PurchaseCategory[] = [
  { id: "mobile", label: "Mobile", defaultAmount: 24000, icon: "Smartphone" },
  { id: "laptop", label: "Laptop", defaultAmount: 68000, icon: "Laptop" },
  { id: "tv", label: "TV", defaultAmount: 45000, icon: "Tv" },
  { id: "appliances", label: "Appliances", defaultAmount: 32000, icon: "WashingMachine" },
  { id: "fashion", label: "Fashion", defaultAmount: 6000, icon: "Shirt" },
  { id: "furniture", label: "Furniture", defaultAmount: 28000, icon: "Sofa" },
];

export const ESTIMATOR_MIN = 2000;
export const ESTIMATOR_MAX = 200000;
export const ESTIMATOR_STEP = 1000;

/**
 * Platform-level coverage. These describe the product's overall reach (not the
 * subset of banks in any single sale) and are shown as trust proof.
 */
export interface CoverageStat {
  value: number;
  suffix: string;
  label: string;
}

export const COVERAGE_STATS: CoverageStat[] = [
  { value: 40, suffix: "+", label: "Banks covered" },
  { value: 300, suffix: "+", label: "Credit cards" },
];

export const COVERAGE_FEATURES = [
  "Instant discounts",
  "Cashback",
  "EMI offers",
  "Voucher benefits",
  "Reward points",
  "No-cost EMI",
];

/** Reasons to sign in — the core conversion argument. */
export const SIGN_IN_BENEFITS = [
  {
    title: "Personalized recommendations",
    body: "The single best card to use, chosen from the cards you already own.",
  },
  {
    title: "Maximum savings",
    body: "We rank every live offer by real rupee value — not by headline %.",
  },
  {
    title: "Best card, every purchase",
    body: "Mobile, laptop or fashion — the winning card can change per order.",
  },
  {
    title: "Cashback optimization",
    body: "Voucher, reward and cashback routes compared and stacked for you.",
  },
  {
    title: "EMI optimization",
    body: "No-cost EMI and processing fees factored into the final number.",
  },
  {
    title: "Never miss expiring offers",
    body: "Live sale offers tracked so a deadline never costs you money.",
  },
];

export const HOW_IT_WORKS = [
  {
    title: "Sign in securely",
    body: "Takes seconds. Bank-grade security, no card numbers ever stored.",
  },
  {
    title: "We match your cards",
    body: "Tell us which cards you hold and we map them to every live offer.",
  },
  {
    title: "We recommend the best card",
    body: "For every purchase you make, see exactly which card saves the most.",
  },
];
