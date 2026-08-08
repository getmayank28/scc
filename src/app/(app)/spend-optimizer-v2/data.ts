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
  Banknote,
  LucideIcon,
} from "lucide-react";

export interface V2Category {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const v2Categories: V2Category[] = [
  { value: "online-shopping", label: "Shopping", icon: ShoppingBag },
  { value: "food-delivery", label: "Food delivery", icon: UtensilsCrossed },
  { value: "dining", label: "Food & Dining", icon: UtensilsCrossed },
  { value: "flights", label: "Flights", icon: Plane },
  { value: "hotels", label: "Hotels", icon: Hotel },
  { value: "travel-ground", label: "Cabs & transport", icon: Car },
  { value: "international", label: "International / subscriptions", icon: Globe },
  { value: "forex", label: "Forex", icon: Banknote },
  { value: "utilities", label: "Utility Bills", icon: Zap },
  { value: "fuel", label: "Fuel & FASTag", icon: Fuel },
  { value: "offline-retail", label: "Offline retail", icon: Store },
  { value: "rent", label: "Rent / insurance", icon: Home },
];

/** Top-5 category shortcuts shown as one-tap CTAs. */
export const TOP_CATEGORIES = [
  "hotels",
  "flights",
  "dining",
  "forex",
  "utilities",
  "online-shopping",
] as const;

export interface V2Merchant {
  value: string;
  label: string;
  /** The category the optimizer runs on — chosen for the user so the two can't mismatch. */
  category: string;
  /** Local asset path or emoji fallback for the tile. */
  emoji: string;
}

export const v2Merchants: V2Merchant[] = [
  { value: "amazon", label: "Amazon", category: "online-shopping", emoji: "🛒" },
  { value: "flipkart", label: "Flipkart", category: "online-shopping", emoji: "🛍️" },
  { value: "swiggy", label: "Swiggy", category: "food-delivery", emoji: "🍔" },
  { value: "zomato", label: "Zomato", category: "food-delivery", emoji: "🍽️" },
  { value: "myntra", label: "Myntra", category: "online-shopping", emoji: "👗" },
  { value: "ajio", label: "Ajio", category: "online-shopping", emoji: "🧥" },
];

/** Top-5 merchant shortcuts (same list here — kept separate so it can diverge). */
export const TOP_MERCHANTS = v2Merchants.map((m) => m.value);

export interface V2Card {
  _id: string;
  name: string;
  bankName: string;
}

/** Max cards a user can compare at once. */
export const MAX_SELECTED = 3;

/** Mock wallet so the prototype needs no backend. */
export const v2Cards: V2Card[] = [
  { _id: "hdfc-regalia-gold", name: "Regalia Gold", bankName: "HDFC Bank" },
  { _id: "hdfc-infinia", name: "Infinia", bankName: "HDFC Bank" },
  { _id: "hdfc-millennia", name: "Millennia", bankName: "HDFC Bank" },
  { _id: "axis-magnus", name: "Magnus", bankName: "Axis Bank" },
  { _id: "axis-atlas", name: "Atlas", bankName: "Axis Bank" },
  { _id: "axis-ace", name: "Ace", bankName: "Axis Bank" },
  { _id: "icici-amazon-pay", name: "Amazon Pay", bankName: "ICICI Bank" },
  { _id: "icici-sapphiro", name: "Sapphiro", bankName: "ICICI Bank" },
  { _id: "sbi-cashback", name: "Cashback SBI", bankName: "SBI" },
  { _id: "sbi-elite", name: "SBI Elite", bankName: "SBI" },
  { _id: "amex-platinum-travel", name: "Platinum Travel", bankName: "American Express" },
  { _id: "amex-mrcc", name: "Membership Rewards", bankName: "American Express" },
  { _id: "idfc-first-select", name: "FIRST Select", bankName: "IDFC FIRST Bank" },
  { _id: "kotak-league", name: "League Platinum", bankName: "Kotak Mahindra Bank" },
  { _id: "indusind-legend", name: "Legend", bankName: "IndusInd Bank" },
];

export interface V2ResultCard {
  cardId: string;
  cardName: string;
  bankName: string;
  voucherSavingsInInr: number;
  directSwipeSavingsInInr: number;
  isBestCard: boolean;
}

export type V2Route = "voucher" | "swipe";

export interface V2ResultCardResolved extends V2ResultCard {
  bestRoute: V2Route;
  bestSavings: number;
  bestRatePct: number;
}

/**
 * Deterministic mock optimizer. Produces plausible per-card savings that vary
 * by category and amount, so the prototype feels alive without a backend.
 */
/** Stable 0..1 hash from a string, so each card gets deterministic rates. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

export function mockOptimize(
  cardIds: string[],
  category: string,
  amount: number,
): V2ResultCardResolved[] {
  // per-card base reward rates, derived deterministically so every card differs
  const swipeRate = (id: string) => 0.01 + hash01(id) * 0.05; // 1%..6%
  const voucherBonus = (id: string) => hash01(id + "v") * 0.05; // 0%..5%
  // category multipliers to make the winner shift as the user changes category
  const catMult: Record<string, number> = {
    "online-shopping": 1.2,
    "food-delivery": 1.0,
    dining: 0.9,
    flights: 1.6,
    hotels: 1.4,
    "travel-ground": 0.8,
    international: 0.7,
    forex: 1.1,
    utilities: 0.4,
    fuel: 0.6,
    "offline-retail": 0.9,
    rent: 0.2,
  };
  const mult = catMult[category] ?? 1;

  const cards = cardIds.map((id, i) => {
    const swipe = Math.round(amount * swipeRate(id) * mult);
    // vouchers only make sense for online-ish spend
    const voucherActive = ["online-shopping", "food-delivery", "flights", "hotels"].includes(
      category,
    );
    const voucher = voucherActive
      ? Math.round(amount * (swipeRate(id) + voucherBonus(id)) * mult)
      : 0;
    const name = v2Cards.find((c) => c._id === id);
    const bestRoute: V2Route = voucher > swipe ? "voucher" : "swipe";
    const bestSavings = Math.max(voucher, swipe);
    return {
      cardId: id,
      cardName: name?.name ?? id,
      bankName: name?.bankName ?? "",
      voucherSavingsInInr: voucher,
      directSwipeSavingsInInr: swipe,
      isBestCard: false,
      bestRoute,
      bestSavings,
      bestRatePct: amount > 0 ? (bestSavings / amount) * 100 : 0,
      _tie: i, // stable tiebreak
    };
  });

  cards.sort((a, b) => b.bestSavings - a.bestSavings || a._tie - b._tie);
  if (cards.length) cards[0].isBestCard = true;
  return cards.map(({ _tie, ...c }) => c);
}
