export const CATEGORIES = {
  FLIGHTS: "flights",
  HOTELS: "hotels",
  FOREX: "forex",
  DINING: "dining",
  FUEL: "fuel",
  GROCERY: "grocery",
  ONLINE_SHOPPING: "online_shopping",
  UTILITIES: "utilities",
  OTHER: "other",
} as const;

export type Category = (typeof CATEGORIES)[keyof typeof CATEGORIES];

export type CardNetwork = "visa" | "mastercard" | "amex" | "rupay" | "diners";
export type RewardType = "points" | "cashback" | "miles";
export type WelcomeBenefitType = "points" | "voucher" | "cashback" | "miles";
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

  ideal_for: string[];
  not_ideal_for: string[];
  is_active: boolean;
}

export const MOCK_CARDS: MockCard[] = [
  {
    _id: "card_hdfc_regalia_gold",
    name: "HDFC Regalia Gold",
    slug: "regalia-gold-credit-card-hdfc-bank",
    bankId: "hdfc",
    network: ["mastercard"],
    eligibility: {
      min_salary_inr: 1200000,
      min_self_employed_income_inr: 1200000,
      min_age: 21,
      max_age: 60,
    },
    fees: {
      joining_inr: 2500,
      joining_gst_inr: 450,
      annual_inr: 2500,
      annual_gst_inr: 450,
      waiver_spend_inr: 400000,
      joining_waiver_spend_inr: 10000,
      is_lifetime_free: false,
    },
    forex_markup_percentage: 2,
    rewards: {
      base_reward_rate: 1.33,
      point_value_inr: 0.5,
      points_expiry_months: 24,
      reward_type: "points",
    },
    categories: [],
    welcome_benefit: {
      type: "voucher",
      value_inr: 2500,
      condition: "joining_fee_payment",
      expires_in_months: 12,
      display:
        "₹2,500 gift voucher on joining; Swiggy One + MMT Black Gold on ₹1L spend in 90 days",
    },
    lounge: {
      domestic: {
        visitsPerPeriod: 3,
        period: "quarter",
        annualCap: 12,
        spendCondition: { thresholdInr: 60000, windowMonths: 3 },
        membershipRequired: null,
        program: "issuer",
        display: "3/quarter on ₹60K spend prev quarter (max 12/year)",
      },
      international: {
        visitsPerPeriod: 6,
        period: "year",
        annualCap: 6,
        spendCondition: null,
        membershipRequired: null,
        program: "priority_pass",
        display: "6/year via Priority Pass (no spend condition)",
      },
    },
    ideal_for: [],
    not_ideal_for: [
      "Frequent international travellers who need higher lounge counts or true travel rewards",
      "Airmiles/hotel points maximisers (prefer Axis Atlas or HSBC TravelOne)",
      "Those wanting simple flat cashback",
    ],
    is_active: true,
  },
  {
    _id: "card_axis_ace",
    name: "Axis Bank ACE",
    slug: "axis-bank-ace-credit-card-axis-bank",
    bankId: "axis",
    network: ["visa"],
    eligibility: {
      min_salary_inr: 300000,
      min_self_employed_income_inr: 300000,
      min_age: 21,
      max_age: 60,
    },
    fees: {
      joining_inr: 499,
      joining_gst_inr: 90,
      annual_inr: 499,
      annual_gst_inr: 90,
      waiver_spend_inr: 200000,
      joining_waiver_spend_inr: 10000,
      is_lifetime_free: false,
    },
    forex_markup_percentage: 3.4,
    rewards: {
      base_reward_rate: 1.5,
      point_value_inr: 1,
      points_expiry_months: null,
      reward_type: "cashback",
    },
    categories: [],
    welcome_benefit: {
      type: "voucher",
      value_inr: 250,
      condition: "first_transaction",
      expires_in_months: 12,
      display: "₹250 Amazon eVoucher on first transaction",
    },
    lounge: {
      domestic: {
        visitsPerPeriod: 1,
        period: "quarter",
        annualCap: 4,
        spendCondition: { thresholdInr: 50000, windowMonths: 3 },
        membershipRequired: null,
        program: "issuer",
        display: "1/quarter on ₹50K spend prev 3 months (max 4/year)",
      },
      international: null,
    },
    ideal_for: [],
    not_ideal_for: [
      "Heavy offline shoppers or those who rarely pay utility bills digitally",
      "Travellers who want lounge access or travel rewards",
      "People who spend primarily on fuel (no accelerated rate on fuel)",
    ],
    is_active: true,
  },
  {
    _id: "card_sbi_simplyclick",
    name: "SBI SimplyCLICK",
    slug: "simplyclick-sbi-card-sbi-card",
    bankId: "sbi",
    network: ["visa"],
    eligibility: {
      min_salary_inr: 300000,
      min_self_employed_income_inr: 200000,
      min_age: 21,
      max_age: 60,
    },
    fees: {
      joining_inr: 499,
      joining_gst_inr: 90,
      annual_inr: 499,
      annual_gst_inr: 90,
      waiver_spend_inr: 100000,
      joining_waiver_spend_inr: 0,
      is_lifetime_free: false,
    },
    forex_markup_percentage: 3.5,
    rewards: {
      base_reward_rate: 0.5,
      point_value_inr: 0.25,
      points_expiry_months: 24,
      reward_type: "points",
    },
    categories: [],
    welcome_benefit: {
      type: "voucher",
      value_inr: 500,
      condition: "joining_fee_payment",
      expires_in_months: 12,
      display: "₹500 Amazon e-gift voucher on payment of joining fee",
    },
    lounge: {
      domestic: null,
      international: null,
    },
    ideal_for: [],
    not_ideal_for: [
      "Offline spenders (no accelerated rewards offline)",
      "Those who primarily shop at Amazon/Flipkart (not 10X partners)",
      "Cardholders who want cashback instead of points",
      "Users needing lounge access",
    ],
    is_active: true,
  },
  {
    _id: "card_icici_amazon_pay",
    name: "ICICI Amazon Pay",
    slug: "amazon-pay-icici-bank-credit-card-icici-bank",
    bankId: "icici",
    network: ["visa"],
    eligibility: {
      min_salary_inr: 0,
      min_self_employed_income_inr: 0,
      min_age: 21,
      max_age: 60,
    },
    fees: {
      joining_inr: 0,
      joining_gst_inr: 0,
      annual_inr: 0,
      annual_gst_inr: 0,
      waiver_spend_inr: 0,
      joining_waiver_spend_inr: 0,
      is_lifetime_free: true,
    },
    forex_markup_percentage: 1.99,
    rewards: {
      base_reward_rate: 1,
      point_value_inr: 1,
      points_expiry_months: null,
      reward_type: "cashback",
    },
    categories: [],
    welcome_benefit: {
      type: "cashback",
      value_inr: 200,
      condition: "first_amazon_order",
      expires_in_months: 12,
      display: "No joining fee; ₹200 cashback on first Amazon order",
    },
    lounge: {
      domestic: {
        visitsPerPeriod: 1,
        period: "quarter",
        annualCap: 4,
        spendCondition: { thresholdInr: 75000, windowMonths: 3 },
        membershipRequired: "Amazon Prime",
        program: "issuer",
        display: "1/quarter on ₹75K spend prev quarter (Prime members only)",
      },
      international: null,
    },
    ideal_for: [],
    not_ideal_for: [
      "Non-Amazon shoppers",
      "Those who want travel rewards, lounge access, or points programs",
      "Cardholders needing forex spends (3.4% forex markup on spending abroad is on the higher side for a no-fee card)",
    ],
    is_active: true,
  },
  {
    _id: "card_amex_mrcc",
    name: "Amex MRCC",
    slug: "american-express-membership-rewards-credit-card-american-express",
    bankId: "amex",
    network: ["amex"],
    eligibility: {
      min_salary_inr: 600000,
      min_self_employed_income_inr: 600000,
      min_age: 21,
      max_age: 60,
    },
    fees: {
      joining_inr: 1000,
      joining_gst_inr: 180,
      annual_inr: 4500,
      annual_gst_inr: 810,
      waiver_spend_inr: 150000,
      joining_waiver_spend_inr: 0,
      is_lifetime_free: false,
    },
    forex_markup_percentage: 1.99,
    rewards: {
      base_reward_rate: 1,
      point_value_inr: 0.5,
      points_expiry_months: null,
      reward_type: "points",
    },
    categories: [],
    welcome_benefit: {
      type: "points",
      value_inr: 2000,
      condition: "first_spend_within_90d",
      expires_in_months: 12,
      display:
        "4,000 bonus MR pts on first spend within 90 days; 1,000 bonus pts/month on 4 txns ≥₹1,500",
    },
    lounge: {
      domestic: null,
      international: null,
    },
    ideal_for: [],
    not_ideal_for: [
      "Users in Tier-2/3 cities (limited Amex acceptance)",
      "Those who spend heavily on fuel, utilities, or insurance (excluded categories)",
      "Anyone needing simple cashback rather than a points program",
      "Low monthly spenders who won't hit ₹20K milestone",
    ],
    is_active: true,
  },
];
