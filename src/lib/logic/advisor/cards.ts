export const CATEGORIES = {
  FLIGHTS: "flights",
  HOTELS: "hotels",
  FOREX: "forex",
  FUEL: "fuel",
  GROCERY: "grocery",
  ONLINE_SHOPPING: "online_shopping",
  OFFLINE_SHOPPING: "offline_shopping",
  UTILITIES: "utilities",
  OTHER: "other",
  RENT: "rent",
  INSURANCE: "insurance",
  FEES_TAXES: "fees_taxes",

  // Extended categories (added for Amex Membership Rewards rule data).
  // Category matching is case-insensitive; names are kept in snake_case.
  ENTERTAINMENT: "entertainment",
  TAXES: "taxes",
  OFFLINE_FOOD_DINING: "offline_food_dining",
  ONLINE_FOOD_DINING: "online_food_dining",
  GROCERIES_SUPERMARKETS: "groceries_supermarkets",
  HEALTHCARE: "healthcare",
  OTHER_TRAVEL: "other_travel",
  TRAVEL_CABS: "travel_cabs",
  UTILITY_BILLS: "utility_bills",
  EDUCATION: "education",
  GOVERNMENT_PAYMENTS: "government_payments",
  EMI_SPEND: "emi_spend",
  WALLET_RELOADS: "wallet_reloads",
  ELECTRONICS: "electronics",
  HOME_FURNISHING: "home_furnishing",
  OTT: "ott",
  MOBILE_RECHARGE: "mobile_recharge",
  INTERNET: "internet",
  PHARMACY: "pharmacy",
  AUTO_SERVICES: "auto_services",
  PARKING_TOLL: "parking_toll",
  RAILWAY_BOOKINGS: "railway_bookings",
  BUS_BOOKINGS: "bus_bookings",
  INTERNATIONAL_SPEND: "international_spend",
  CASH_WITHDRAWALS: "cash_withdrawals",
  CHARITY: "charity",
  PET_CARE: "pet_care",
  GAMING: "gaming",
  DIGITAL_GOODS: "digital_goods",
  VOUCHER: "voucher",
  INVESTMENT: "investment",
  MAINTENANCE_CHARGES: "maintenance_charges",
  BUSINESS_EXPENSES: "business_expenses",
  OTHER_SPEND: "other_spend",
  FOREX_CHARGE: "forex_charge",
  BEAUTY_FASHION: "beauty_fashion",
  WATCHES_JEWELRY: "watches_jewelry",
  MARKETPLACE: "marketplace",
  ART: "art",
  WELLNESS_EXCLUSIVE_ACCESS: "wellness_exclusive_access",
  TRAVEL: "travel",
  REWARDXCELERATOR_MERCHANT_SPECIFIC: "rewardxcelerator_merchant_specific",
} as const;

export type Category = (typeof CATEGORIES)[keyof typeof CATEGORIES];

export type CardNetwork = "visa" | "mastercard" | "amex" | "rupay" | "diners";
export type RewardType = "points" | "cashback" | "miles";
export type WelcomeBenefitType =
  | "points"
  | "voucher"
  | "cashback"
  | "miles"
  | "membership";
export type LoungeProgram =
  | "issuer"
  | "priority_pass"
  | "dreamfolks"
  | "loungekey";

export interface LoungeAccess {
  visitsPerPeriod: number;
  period: "quarter" | "year";
  annualCap: number;
  spendCondition: {
    thresholdInr: number;
    windowMonths: number;
  } | null;
  membershipRequired: string | null;
  program: LoungeProgram;
  display: string;
}

export interface MockCard {
  _id: string;
  name: string;
  slug: string;
  bankId: string;
  network: CardNetwork[];

  eligibility: {
    min_salary_inr: number;
    min_self_employed_income_inr: number;
    min_age: number;
    max_age: number;
  };

  fees: {
    joining_inr: number;
    joining_gst_inr: number;
    annual_inr: number;
    annual_gst_inr: number;
    waiver_spend_inr: number;
    joining_waiver_spend_inr: number;
    is_lifetime_free: boolean;
  };

  forex_markup_percentage: number;

  rewards: {
    base_reward_rate: number;
    point_value_inr: number;
    points_expiry_months: number | null;
    reward_type: RewardType;
  };

  categories: Category[];

  welcome_benefit: {
    type: WelcomeBenefitType;
    value_inr: number;
    condition: string;
    expires_in_months: number;
    display: string;
  } | null;

  lounge: {
    domestic: LoungeAccess | null;
    international: LoungeAccess | null;
  };

  // Reasons this card is a strong pick — sourced from the dataset's
  // "why_this_card" positioning, split into individual selling points.
  ideal_for: string[];

  // Airline & hotel reward-transfer program for this card, or null when the
  // card has no transfer partners (e.g. cashback / co-brand-only cards).
  transfer_partners: {
    partners: string[]; // main airline & hotel transfer partners
    max_value_note: string; // note on best / maximum value on transfer
  } | null;

  not_ideal_for: string[];
  is_active: boolean;

  // Invite-only cards are never recommended. Optional; undefined means the
  // card is openly available.
  invitation_only?: boolean;

  // Categories where the card's base reward rate does NOT apply. Specific
  // merchant rules still earn at their declared rate; spend that doesn't match
  // any merchant rule earns 0% (instead of falling back to the base rate).
  // Example: ICICI Amazon Pay excludes UTILITIES — only Amazon-routed utility
  // (UTILITIES_AMAZON merchant) earns 2%; everything else earns 0%, not 1%.
  excluded_categories?: Category[];
}
