import {
  ShoppingBag,
  UtensilsCrossed,
  Plane,
  Hotel,
  Car,
  Globe,
  Zap,
  Fuel,
  Store,
  Home,
  GraduationCap,
  Gem,
  Heart,
  Wallet,
  Gift,
  Banknote,
  Tv,
  Smartphone,
  ShieldCheck,
  Laptop,
  Ticket,
  LucideIcon,
} from "lucide-react";

interface Category {
  value: string;
  label: string;
  icon: LucideIcon;
}

export interface SpendTransaction {
  category: string;
  amount: string;
  merchant: string;
  transactionMode: string;
  cards: {
    cardId: string;
    cardName: string;
    directSwipePortalLink: string;
    directSwipeSavingsInInr: number;
    isBestCard: boolean;
    isDirectSwipePortalSavings: boolean;
    voucherSavingsInInr: number;
  }[];
}

export interface FormData {
  category: string;
  amount: string;
  merchant: string;
  transactionMode: "online" | "offline";
}

export interface FormErrors {
  category: boolean;
  amount: boolean;
  merchant: boolean;
  transactionMode: boolean;
}

/**
 * Selectable categories. Every `value` here must have an entry in
 * UI_CATEGORY_TO_ENGINE (src/lib/logic/advisor/spendOptimizer.ts) — the API
 * schema derives its enum from that map, so an unmapped value is rejected at
 * the boundary rather than silently scored as "other".
 */
export const categories: Category[] = [
  { value: "online-shopping", label: "Online shopping", icon: ShoppingBag },
  { value: "offline-retail", label: "Offline retail", icon: Store },
  { value: "food-delivery", label: "Food delivery", icon: UtensilsCrossed },
  { value: "dining", label: "Dining out", icon: UtensilsCrossed },
  { value: "flights", label: "Flights", icon: Plane },
  { value: "hotels", label: "Hotels", icon: Hotel },
  { value: "travel-ground", label: "Cabs & transport", icon: Car },
  { value: "international", label: "International spend", icon: Globe },
  { value: "forex", label: "Forex", icon: Banknote },
  { value: "utilities", label: "Utility bills", icon: Zap },
  { value: "fuel", label: "Fuel & FASTag", icon: Fuel },
  { value: "groceries", label: "Groceries", icon: ShoppingBag },
  { value: "electronics", label: "Electronics", icon: Laptop },
  { value: "healthcare", label: "Healthcare", icon: Heart },
  { value: "entertainment", label: "Entertainment", icon: Ticket },
  { value: "ott", label: "OTT & subscriptions", icon: Tv },
  { value: "mobile-recharge", label: "Mobile recharge", icon: Smartphone },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "insurance", label: "Insurance", icon: ShieldCheck },
  { value: "jewellery", label: "Jewellery & watches", icon: Gem },
  { value: "wallet-load", label: "Wallet load", icon: Wallet },
  { value: "gift-card", label: "Gift card purchase", icon: Gift },
  { value: "rent", label: "Rent", icon: Home },
];

/** One-tap category shortcuts. */
export const TOP_CATEGORIES = [
  "hotels",
  "flights",
  "dining",
  "online-shopping",
  "fuel",
  "utilities",
] as const;

export interface QuickMerchant {
  value: string;
  /** Display name — must match a `portals` entry so it maps to a rule merchant. */
  label: string;
  /** Category the optimizer runs on, chosen so the two can't mismatch. */
  category: string;
}

/** One-tap merchant shortcuts; the full list comes from the portals API. */
export const quickMerchants: QuickMerchant[] = [
  { value: "amazon", label: "Amazon", category: "online-shopping" },
  { value: "flipkart", label: "Flipkart", category: "online-shopping" },
  { value: "swiggy", label: "Swiggy", category: "food-delivery" },
  { value: "zomato", label: "Zomato", category: "food-delivery" },
  { value: "myntra", label: "Myntra", category: "online-shopping" },
  { value: "ajio", label: "Ajio", category: "online-shopping" },
];

/** Max cards compared at once. */
export const MAX_SELECTED = 3;

export const AMOUNT_CHIPS = [500, 2000, 5000, 15000, 50000];

/** Shape returned by POST /api/spend-optimizer. */
export interface OptimizedCardResult {
  cardId: string;
  cardName: string;
  bankName: string;
  voucherSavingsInInr: number;
  directSwipeSavingsInInr: number;
  isBestCard: boolean;
  bestRoute: "voucher" | "swipe";
  bestSavingsInInr: number;
  bestRatePct: number;
  merchant: string | null;
  /** Brand the voucher figure belongs to — vouchers are always brand-bound. */
  voucherMerchant: string | null;
  capNote: string | null;
  isBaseRateFallback: boolean;
}

/** Turn a rule merchant slug ("cleartrip_hotels") into a label ("Cleartrip Hotels"). */
export function merchantLabel(slug: string): string {
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
