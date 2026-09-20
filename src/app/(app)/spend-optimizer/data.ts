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
import { OTHER_SPEND_CATEGORY } from "@/lib/logic/advisor/spendOptimizer";

export interface Category {
  value: string;
  label: string;
  /** Used in the precision-panel dropdown, where a flat glyph reads better. */
  icon: LucideIcon;
  /**
   * Illustration for the quick-pick tile. Only the TOP_CATEGORIES entries need
   * one; the dropdown keeps using `icon` either way.
   */
  art?: string;
  /**
   * Keeps the paper chip behind the art. Needed for dark line-art (food.png is
   * navy) that would otherwise vanish against the dark tile; full-colour
   * illustrations read fine with no plate.
   */
  artOnPaper?: boolean;
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
  {
    value: "online-shopping",
    label: "Online shopping",
    icon: ShoppingBag,
    art: "/icons/online-shopping.png",
  },
  { value: "offline-retail", label: "Offline retail", icon: Store },
  { value: "food-delivery", label: "Food delivery", icon: UtensilsCrossed },
  {
    value: "dining",
    label: "Dining out",
    icon: UtensilsCrossed,
    art: "/icons/food.png",
    artOnPaper: true,
  },
  { value: "flights", label: "Flights", icon: Plane, art: "/icons/trip.png" },
  { value: "hotels", label: "Hotels", icon: Hotel, art: "/icons/hotel.png" },
  { value: "travel-ground", label: "Cabs & transport", icon: Car },
  { value: "international", label: "International spend", icon: Globe },
  { value: "forex", label: "Forex", icon: Banknote },
  { value: "utilities", label: "Utility bills", icon: Zap },
  { value: "fuel", label: "Fuel", icon: Fuel, art: "/icons/fuel.png" },
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

/**
 * The catch-all a run falls back to when the spend can't be placed — an
 * unrecognised merchant. Deliberately NOT a member of `categories`: it is never
 * a choice the user picks from the dropdown, and it must not appear among a
 * merchant's own category options either. `categoryLabel` covers both lists so
 * callers can label a run with it without special-casing.
 */
export const OTHER_SPEND: Category = {
  value: OTHER_SPEND_CATEGORY,
  label: "Other spend",
  icon: Wallet,
};

/** Display label for any run category, including the off-list catch-all. */
export function categoryLabel(value: string): string | null {
  if (value === OTHER_SPEND.value) return OTHER_SPEND.label;
  return categories.find((c) => c.value === value)?.label ?? null;
}

/** One-tap category shortcuts. Everything else lives behind the "More" tile. */
export const TOP_CATEGORIES = ["hotels", "flights"] as const;

export interface QuickMerchant {
  value: string;
  /** Display name — must match a `portals` entry so it maps to a rule merchant. */
  label: string;
  /** Category the optimizer runs on, chosen so the two can't mismatch. */
  category: string;
  /** Brand mark under /public. Omitted merchants fall back to a letter chip. */
  logo?: string;
  /**
   * True when the mark is light-on-transparent and would vanish against the
   * paper chip — it gets an inked chip instead. Amazon's wordmark is the only
   * one today; the others are dark or full-bleed marks made for light ground.
   */
  logoOnDark?: boolean;
  /**
   * True when the asset already carries its own background plate edge-to-edge
   * (Zomato's red tile, Flipkart's yellow). These fill the chip so the plate
   * becomes the chip; padded ones would show a seam of paper around the edge.
   */
  logoBleed?: boolean;
  /**
   * Scale-up for wide wordmarks whose asset bakes in wide side margins — they'd
   * otherwise fit by width and render too small to read inside the chip. Tuned
   * per asset: too much crops the mark itself.
   */
  logoScale?: number;
  /**
   * True for portrait marks (Swiggy 114x170) that fit by height in a square
   * chip. They get tighter padding so the mark fills the chip without being
   * squeezed, and stay whole rather than being cropped by the chip's radius.
   */
  logoPortrait?: boolean;
}

/** One-tap merchant shortcuts; the full list comes from the portals API. */
export const quickMerchants: QuickMerchant[] = [
  {
    value: "amazon",
    label: "Amazon",
    category: "online-shopping",
    logo: "/icons/amazon.png",
    logoOnDark: true,
    logoScale: 1.15,
  },
  {
    value: "flipkart",
    label: "Flipkart",
    category: "online-shopping",
    logo: "/icons/flipkart.png",
    logoBleed: true,
  },
  {
    value: "swiggy",
    label: "Swiggy",
    category: "food-delivery",
    logo: "/icons/swiggy.png",
    logoPortrait: true,
  },
  {
    value: "zomato",
    label: "Zomato",
    category: "food-delivery",
    logo: "/icons/zomato.png",
    logoBleed: true,
  },
  {
    value: "myntra",
    label: "Myntra",
    category: "online-shopping",
    logo: "/icons/myntra.png",
    logoScale: 1.9,
  },
  { value: "ajio", label: "Ajio", category: "online-shopping" },
];

/**
 * A merchant from the portals API, kept whole. The searchbox only needs a name,
 * but the result CTAs need the destination URL — mapping portals down to
 * `{_id, value, name}` on the way in would throw that away.
 */
export interface PortalOption {
  _id: string;
  name: string;
  /** Portal's own slug. A second key into the same row — see `merchantKey`. */
  slug?: string;
  affiliateLink?: string | null;
  websiteUrl?: string;
}

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
  /** Merchant the direct-swipe figure earns through, when rule-specific. */
  directMerchant: string | null;
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

/**
 * Collapse a merchant name or slug to a comparison key.
 *
 * Rule merchants and portal records are authored in different vocabularies:
 * rules use underscored slugs ("marks_spencer"), portals use display names
 * ("Marks & Spencer") and hyphenated slugs ("marks-spencer"). Matching on
 * `merchantLabel(slug) === portal.name` alone resolves 428 of the 677 active
 * rule merchants; folding away case, separators and punctuation recovers 91
 * more — mostly high-volume brands that differ by an apostrophe or ampersand
 * ("domino_s_pizza" / "Domino's Pizza"). The remaining ~158 are genuinely
 * absent from `portals` and must stay unresolved rather than be guessed at.
 */
export function merchantKey(nameOrSlug: string): string {
  return nameOrSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
}
