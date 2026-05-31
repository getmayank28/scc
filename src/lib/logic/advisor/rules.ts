import { CATEGORIES, type Category } from "./cards";

export const MERCHANTS = {
  SMARTBUY: "smartbuy",
  AIR_INDIA: "air_india",
  CLEARTRIP: "cleartrip",
  EASEMYTRIP: "easemytrip",
  FAB_HOTELS: "fab_hotels",
  ITC_HOTELS: "itc_hotels",
  IXIGO: "ixigo",
  MAKEMYTRIP: "makemytrip",
  TAJ_EXPERIENCES: "taj_experiences",
  TAJ_WELLNESS: "taj_wellness",
  YATRA: "yatra",
  ADANI_MEET_GREET: "adani_meet_greet",
  FINUSMART: "finusmart",
  IRCTC: "irctc",
  MARRIOTT: "marriott",
  GOIBIBO: "goibibo",
  THE_LEELA: "the_leela",
  THE_POSTCARD: "the_postcard",
  AMAZON_PAY: "amazon_pay",

  // Dining aggregators / sub-MCCs
  SWIGGY: "swiggy",
  ZOMATO: "zomato",
  SWIGGY_DINEOUT: "swiggy_dineout",
  EAZYDINER: "eazydiner",
  ZOMATO_DISTRICT: "zomato_district",

  // Dining merchant chains
  ABSOLUTE_BARBEQUE: "absolute_barbeque",
  ASIA_SEVEN_EXPRESS: "asia_seven_express",
  BAKINGO: "bakingo",
  BARBEQUE_NATION: "barbeque_nation",
  BASKIN_ROBBINS: "baskin_robbins",
  BEER_CAFE: "beer_cafe",
  BEHROUZ_BIRYANI: "behrouz_biryani",
  BIKANERVALA: "bikanervala",
  CAFE_COFFEE_DAY: "cafe_coffee_day",
  CAFE_DELHI_HEIGHTS: "cafe_delhi_heights",
  CHICAGO_PIZZA: "chicago_pizza",
  COSTA_COFFEE: "costa_coffee",
  DOMINOS_PIZZA: "dominos_pizza",
  EATSURE: "eatsure",
  FAASOS: "faasos",
  FRESHMENU: "freshmenu",
  HAUTE_SAUCE: "haute_sauce",
  KFC: "kfc",
  LITE_BITE_FOOD: "lite_bite_food",
  LUNCH_BOX: "lunch_box",
  MACHAAN: "machaan",
  MAINLAND_CHINA: "mainland_china",
  MARRIOTT_DINING: "marriott_dining",
  MCDONALDS: "mcdonalds",
  OH_CALCUTTA: "oh_calcutta",
  OVEN_STORY: "oven_story",
  PIZZA_HUT: "pizza_hut",
  POLAR_BEAR: "polar_bear",
  PRET_A_MANGER: "pret_a_manger",
  PUNJAB_GRILL: "punjab_grill",
  SIGREE: "sigree",
  STARBUCKS: "starbucks",
  STREET_FOODS_PUNJAB_GRILL: "street_foods_punjab_grill",
  SUBWAY: "subway",
  SUN_SCOOP: "sun_scoop",
  SWEET_BENGAL: "sweet_bengal",
  SWEET_TRUTH: "sweet_truth",
  TACO_BELL: "taco_bell",
  TGIF: "tgif",
  THE_GOOD_BOWL: "the_good_bowl",
  TIM_HORTONS: "tim_hortons",
  TOSCANO: "toscano",
  WENDYS: "wendys",
  WOW_CHICKEN: "wow_chicken",
  WOW_CHINA: "wow_china",
  WOW_MOMO: "wow_momo",
  ZAMBAR: "zambar",

  // Online shopping merchants
  AJIO: "ajio",
  AJIO_LUXE: "ajio_luxe",
  AMAZON: "amazon",
  AMAZON_FRESH: "amazon_fresh",
  AMAZON_IN_NON_PRIME: "amazon_in_non_prime",
  AMAZON_IN_PRIME: "amazon_in_prime",
  AMAZON_PAY_PARTNERS: "amazon_pay_partners",
  AMAZON_PRIME: "amazon_prime",
  AMAZON_PRIME_12_MONTHS: "amazon_prime_12_months",
  AMAZON_PRIME_3_MONTHS: "amazon_prime_3_months",
  AMAZON_PRIME_LITE: "amazon_prime_lite",
  AMAZON_SHOPPING: "amazon_shopping",
  BIG_BASKET: "big_basket",
  BLINKIT: "blinkit",
  FLIPKART: "flipkart",
  MARKS_AND_SPENCER: "marks_and_spencer",
  MYNTRA: "myntra",
  NYKAA: "nykaa",
  NYKAA_FASHION: "nykaa_fashion",
  NYKAA_MAN: "nykaa_man",
  OTHER_ONLINE_SPENDS: "other_online_spends",
  RELIANCE_DIGITAL: "reliance_digital",
  RELIANCE_JIO_MART: "reliance_jio_mart",
  SNAPDEAL_SCLP_1000: "snapdeal_sclp_1000",
  SNAPDEAL_SCLP_500: "snapdeal_sclp_500",
  TATA_CLIQ: "tata_cliq",
  TATA_CLIQ_FASHION: "tata_cliq_fashion",
  TATA_CLIQ_LUXURY: "tata_cliq_luxury",
  ZEPTO: "zepto",

  // Utility merchants
  AIRTEL_XSTREAM: "airtel_xstream",
  GAS: "gas",
  GOOGLE_PAY_BILLS: "google_pay_bills",
  HP_PAY: "hp_pay",
  RELIANCE_MY_JIO_STORE: "reliance_my_jio_store",
  UTILITIES_AMAZON: "utilities_amazon",
  UTILITY_OTHERS: "utility_others",

  // Fuel / rent / insurance / fees & taxes merchants
  BPCL_SMARTDRIVE: "bpcl_smartdrive",
  CLEARTAX: "cleartax",
  FINUSMART_SURAKSHA: "finusmart_suraksha",
  MYHQ: "myhq",
  RENTOMOJO: "rentomojo",

  // Offline shopping merchants
  CROSSWORD: "crossword",
  PUMA: "puma",
  HARPERS_BAZAAR_INDIA: "harpers_bazaar_india",
  WOGGLES: "woggles",
} as const;

export type Merchant = (typeof MERCHANTS)[keyof typeof MERCHANTS];

export type CapPeriod = "monthly" | "quarterly" | "annually";
export type CapMetric = "points" | "inr" | "cashback";
export type CapScope = "merchant" | "category" | "card";

export interface SharedCapGroup {
  multiplier: number | null;
  merchant: Merchant | null;
}

export function sharedCapGroupKey(group: SharedCapGroup): string {
  return `${group.multiplier ?? "*"}::${group.merchant ?? "*"}`;
}

export function validateSharedCapGroups(rules: MockRule[]): void {
  const byKey = new Map<string, MockRule[]>();
  for (const r of rules) {
    if (!r.shared_cap_group || !r.is_active) continue;
    const key = `${r.cardId}::${sharedCapGroupKey(r.shared_cap_group)}`;
    const list = byKey.get(key) ?? [];
    list.push(r);
    byKey.set(key, list);
  }
  for (const [key, members] of byKey) {
    if (members.length <= 1) continue;
    const first = members[0].caps.reward_cap;
    for (const m of members.slice(1)) {
      const c = m.caps.reward_cap;
      const same =
        (first === null && c === null) ||
        (first !== null &&
          c !== null &&
          first.value === c.value &&
          first.period === c.period &&
          first.metric === c.metric);
      if (!same) {
        throw new Error(
          `Shared cap group "${key}" has inconsistent reward_cap across rules: ${members
            .map((x) => x._id)
            .join(", ")}`,
        );
      }
    }
  }
}

export interface MockRule {
  _id: string;
  cardId: string;
  category: Category;
  merchant: Merchant | null;

  reward: {
    direct_swipe_percentage: number;
    voucher_discount_percentage: number;
    voucher_reward_percentage: number;
    convenience_fee_percentage: number;
  };

  caps: {
    reward_cap: {
      period: CapPeriod;
      metric: CapMetric;
      value: number;
      scope: CapScope;
    } | null;
    voucher_monthly_purchase_limit_inr: number | null;
    max_voucher_size_inr: number | null;
    vouchers_per_booking: number | null;
  };

  shared_cap_group: SharedCapGroup | null;

  valid_from: Date;
  valid_until: Date | null;

  notes: string | null;
  is_active: boolean;
}

const HDFC_REGALIA_GOLD_ID = "card_hdfc_regalia_gold";
const REGALIA_VALID_FROM = new Date("2024-01-01");

const AXIS_ACE_ID = "card_axis_ace";
const ACE_VALID_FROM = new Date("2024-01-01");

const SBI_SIMPLYCLICK_ID = "card_sbi_simplyclick";
const SBI_SIMPLYCLICK_VALID_FROM = new Date("2024-01-01");

const ICICI_AMAZON_PAY_ID = "card_icici_amazon_pay";
const ICICI_AMAZON_PAY_VALID_FROM = new Date("2024-01-01");

const AMEX_MRCC_ID = "card_amex_mrcc";
const AMEX_MRCC_VALID_FROM = new Date("2024-01-01");

interface VoucherCapOverrides {
  maxVoucherSizeInr?: number | null;
  vouchersPerBooking?: number | null;
  monthlyPurchaseLimitInr?: number | null;
  convenienceFeePercentage?: number;
}

const makeVoucherRule =
  (
    cardId: string,
    validFrom: Date,
    directSwipePercentage: number,
    voucherRewardPercentage: number,
  ) =>
  (
    id: string,
    category: Category,
    merchant: Merchant,
    voucherDiscountPercentage: number,
    capOverrides: VoucherCapOverrides = {},
  ): MockRule => ({
    _id: id,
    cardId,
    category,
    merchant,
    reward: {
      direct_swipe_percentage: directSwipePercentage,
      voucher_discount_percentage: voucherDiscountPercentage,
      voucher_reward_percentage: voucherRewardPercentage,
      convenience_fee_percentage: capOverrides.convenienceFeePercentage ?? 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr:
        capOverrides.monthlyPurchaseLimitInr ?? null,
      max_voucher_size_inr: capOverrides.maxVoucherSizeInr ?? null,
      vouchers_per_booking: capOverrides.vouchersPerBooking ?? null,
    },
    shared_cap_group: null,
    valid_from: validFrom,
    valid_until: null,
    notes: null,
    is_active: true,
  });

const regaliaVoucher = makeVoucherRule(
  HDFC_REGALIA_GOLD_ID,
  REGALIA_VALID_FROM,
  1.33,
  6.5,
);
const aceVoucher = makeVoucherRule(AXIS_ACE_ID, ACE_VALID_FROM, 4.0, 1.5);
const sbiVoucher = makeVoucherRule(
  SBI_SIMPLYCLICK_ID,
  SBI_SIMPLYCLICK_VALID_FROM,
  2.5,
  2.5,
);
const iciciAmazonVoucher = makeVoucherRule(
  ICICI_AMAZON_PAY_ID,
  ICICI_AMAZON_PAY_VALID_FROM,
  1.0,
  1.0,
);
const amexMrccVoucher = makeVoucherRule(
  AMEX_MRCC_ID,
  AMEX_MRCC_VALID_FROM,
  2.0,
  4.0,
);

// Card-specific dining voucher helpers. Most rate profiles match the existing
// (travel) helpers; these cover the dining-only direct-swipe variants.
const sbiDining = makeVoucherRule(
  SBI_SIMPLYCLICK_ID,
  SBI_SIMPLYCLICK_VALID_FROM,
  1.25,
  2.5,
);
const sbiDiningLowDirect = makeVoucherRule(
  SBI_SIMPLYCLICK_ID,
  SBI_SIMPLYCLICK_VALID_FROM,
  0.25,
  2.5,
);
const iciciAmazonDining = makeVoucherRule(
  ICICI_AMAZON_PAY_ID,
  ICICI_AMAZON_PAY_VALID_FROM,
  2.0,
  1.0,
);

// Shared-cap pool keys
const ACE_ACCEL_GROUP: SharedCapGroup = { multiplier: 4, merchant: null };
const SBI_10X_GROUP: SharedCapGroup = { multiplier: 10, merchant: null };
const AMEX_10X_EZ_GROUP: SharedCapGroup = {
  multiplier: 10,
  merchant: MERCHANTS.EASEMYTRIP,
};

const ACE_ACCEL_REWARD_CAP = {
  period: "monthly" as CapPeriod,
  metric: "cashback" as CapMetric,
  value: 500,
  scope: "card" as CapScope,
};
const SBI_10X_REWARD_CAP = {
  period: "monthly" as CapPeriod,
  metric: "points" as CapMetric,
  value: 10000,
  scope: "merchant" as CapScope,
};
const AMEX_10X_EZ_REWARD_CAP = {
  period: "monthly" as CapPeriod,
  metric: "points" as CapMetric,
  value: 500,
  scope: "merchant" as CapScope,
};

// Per-card dining voucher discount tables. Each entry: [merchant, discount%].
// Total voucher rate = discount + helper-baked reward.
type DiningVoucher = [Merchant, number];

const HDFC_DINING_VOUCHERS: DiningVoucher[] = [
  [MERCHANTS.ABSOLUTE_BARBEQUE, 2.5],
  [MERCHANTS.BAKINGO, 12.5],
  [MERCHANTS.BARBEQUE_NATION, 2.5],
  [MERCHANTS.BASKIN_ROBBINS, 10.0],
  [MERCHANTS.BEER_CAFE, 2.5],
  [MERCHANTS.BEHROUZ_BIRYANI, 2.5],
  [MERCHANTS.CAFE_DELHI_HEIGHTS, 5.0],
  [MERCHANTS.COSTA_COFFEE, 0],
  [MERCHANTS.DOMINOS_PIZZA, 10.0],
  [MERCHANTS.EATSURE, 2.5],
  [MERCHANTS.FAASOS, 2.5],
  [MERCHANTS.HAUTE_SAUCE, 7.5],
  [MERCHANTS.KFC, 0],
  [MERCHANTS.LUNCH_BOX, 2.5],
  [MERCHANTS.MACHAAN, 5.0],
  [MERCHANTS.MAINLAND_CHINA, 5.0],
  [MERCHANTS.OH_CALCUTTA, 5.0],
  [MERCHANTS.OVEN_STORY, 2.5],
  [MERCHANTS.PIZZA_HUT, 2.5],
  [MERCHANTS.PRET_A_MANGER, 7.5],
  [MERCHANTS.SIGREE, 5.0],
  [MERCHANTS.STARBUCKS, 0],
  [MERCHANTS.SUBWAY, 2.5],
  [MERCHANTS.SUN_SCOOP, 15.0],
  [MERCHANTS.SWEET_BENGAL, 5.0],
  [MERCHANTS.SWEET_TRUTH, 2.5],
  [MERCHANTS.SWIGGY, 0],
  [MERCHANTS.TGIF, 2.5],
  [MERCHANTS.THE_GOOD_BOWL, 2.5],
  [MERCHANTS.TIM_HORTONS, 0],
  [MERCHANTS.WENDYS, 2.5],
  [MERCHANTS.WOW_CHICKEN, 2.5],
  [MERCHANTS.WOW_CHINA, 2.5],
  [MERCHANTS.WOW_MOMO, 2.5],
  [MERCHANTS.ZOMATO, 0],
];

// Axis ACE dining vouchers all use the 4%/1.5% profile (Sun Scoop is a
// special case below — direct rate drops to 1.5% there).
const ACE_DINING_VOUCHERS: DiningVoucher[] = [
  [MERCHANTS.BAKINGO, 14.0],
  [MERCHANTS.BEHROUZ_BIRYANI, 8.5],
  [MERCHANTS.DOMINOS_PIZZA, 15.0],
  [MERCHANTS.EATSURE, 8.5],
  [MERCHANTS.FAASOS, 8.5],
  [MERCHANTS.LUNCH_BOX, 8.5],
  [MERCHANTS.OVEN_STORY, 8.5],
  [MERCHANTS.SWEET_TRUTH, 8.5],
  [MERCHANTS.THE_GOOD_BOWL, 8.5],
  [MERCHANTS.WENDYS, 8.5],
];

const SBI_DINING_VOUCHERS: DiningVoucher[] = [
  [MERCHANTS.ABSOLUTE_BARBEQUE, 8.0],
  [MERCHANTS.BAKINGO, 18.0],
  [MERCHANTS.BARBEQUE_NATION, 5.0],
  [MERCHANTS.BEER_CAFE, 10.0],
  [MERCHANTS.BEHROUZ_BIRYANI, 9.0],
  [MERCHANTS.CAFE_DELHI_HEIGHTS, 10.0],
  [MERCHANTS.CHICAGO_PIZZA, 0],
  [MERCHANTS.COSTA_COFFEE, 0],
  [MERCHANTS.LUNCH_BOX, 7.0],
  [MERCHANTS.MACHAAN, 18.0],
  [MERCHANTS.MAINLAND_CHINA, 10.0],
  [MERCHANTS.OH_CALCUTTA, 10.0],
  [MERCHANTS.OVEN_STORY, 9.0],
  [MERCHANTS.SIGREE, 13.0],
  [MERCHANTS.STARBUCKS, 6.0],
  [MERCHANTS.SUBWAY, 8.0],
  [MERCHANTS.SWEET_BENGAL, 13.0],
  [MERCHANTS.TGIF, 8.0],
  [MERCHANTS.THE_GOOD_BOWL, 9.0],
  [MERCHANTS.TIM_HORTONS, 6.0],
  [MERCHANTS.WENDYS, 7.0],
  [MERCHANTS.WOW_CHICKEN, 8.0],
  [MERCHANTS.WOW_CHINA, 8.0],
  [MERCHANTS.WOW_MOMO, 8.0],
  [MERCHANTS.ZOMATO, 0],
];

// ICICI Amazon Pay dining voucher table — uses the 2%/1% profile (direct
// swipe wins everywhere). Baskin Robbins is the 1%/1% exception below.
const ICICI_DINING_VOUCHERS: DiningVoucher[] = [
  [MERCHANTS.ABSOLUTE_BARBEQUE, 0],
  [MERCHANTS.ASIA_SEVEN_EXPRESS, 0],
  [MERCHANTS.BAKINGO, 0],
  [MERCHANTS.BARBEQUE_NATION, 0],
  [MERCHANTS.BIKANERVALA, 0],
  [MERCHANTS.CAFE_COFFEE_DAY, 0],
  [MERCHANTS.CAFE_DELHI_HEIGHTS, 0],
  [MERCHANTS.COSTA_COFFEE, 0],
  [MERCHANTS.DOMINOS_PIZZA, 0],
  [MERCHANTS.MAINLAND_CHINA, 0],
  [MERCHANTS.MCDONALDS, 0],
  [MERCHANTS.PIZZA_HUT, 0],
  [MERCHANTS.POLAR_BEAR, 0],
  [MERCHANTS.PUNJAB_GRILL, 0],
  [MERCHANTS.STARBUCKS, 0],
  [MERCHANTS.SUBWAY, 0],
  [MERCHANTS.TOSCANO, 0],
];

const AMEX_DINING_VOUCHERS: DiningVoucher[] = [
  [MERCHANTS.ABSOLUTE_BARBEQUE, 6.0],
  [MERCHANTS.ASIA_SEVEN_EXPRESS, 1.2],
  [MERCHANTS.BARBEQUE_NATION, 3.75],
  [MERCHANTS.BASKIN_ROBBINS, 12.5],
  [MERCHANTS.BEER_CAFE, 6.4],
  [MERCHANTS.BEHROUZ_BIRYANI, 0],
  [MERCHANTS.BIKANERVALA, 0],
  [MERCHANTS.CAFE_COFFEE_DAY, 2.8],
  [MERCHANTS.CAFE_DELHI_HEIGHTS, 8.0],
  [MERCHANTS.COSTA_COFFEE, 1.1],
  [MERCHANTS.DOMINOS_PIZZA, 9.0],
  [MERCHANTS.FAASOS, 0],
  [MERCHANTS.FRESHMENU, 0],
  [MERCHANTS.KFC, 0],
  [MERCHANTS.LITE_BITE_FOOD, 1.2],
  [MERCHANTS.LUNCH_BOX, 6.6],
  [MERCHANTS.MAINLAND_CHINA, 9.5],
  [MERCHANTS.MCDONALDS, 3.1],
  [MERCHANTS.OH_CALCUTTA, 9.0],
  [MERCHANTS.OVEN_STORY, 6.0],
  [MERCHANTS.PIZZA_HUT, 7.7],
  [MERCHANTS.POLAR_BEAR, 0],
  [MERCHANTS.PRET_A_MANGER, 8.0],
  [MERCHANTS.PUNJAB_GRILL, 1.2],
  [MERCHANTS.STARBUCKS, 4.2],
  [MERCHANTS.STREET_FOODS_PUNJAB_GRILL, 1.2],
  [MERCHANTS.SUBWAY, 6.0],
  [MERCHANTS.SWEET_BENGAL, 7.0],
  [MERCHANTS.SWEET_TRUTH, 8.0],
  [MERCHANTS.TACO_BELL, 1.1],
  [MERCHANTS.TIM_HORTONS, 5.0],
  [MERCHANTS.TOSCANO, 3.1],
  [MERCHANTS.WENDYS, 8.8],
  [MERCHANTS.ZAMBAR, 1.2],
];

function diningVoucherRules(
  card: "regalia" | "ace" | "sbi" | "icici" | "amex",
  table: DiningVoucher[],
  factory: ReturnType<typeof makeVoucherRule>,
): MockRule[] {
  return table.map(([m, d]) =>
    factory(`rule_${card}_dining_v_${m}`, CATEGORIES.DINING, m, d),
  );
}

// ============================================================================
// Online shopping — voucher helpers, shared-cap pools, per-card tables
// ============================================================================

// Voucher factories for online-shopping rate profiles that don't match the
// existing (travel/dining) helpers.
const regalia5XOnline = makeVoucherRule(
  HDFC_REGALIA_GOLD_ID,
  REGALIA_VALID_FROM,
  6.67,
  6.5,
);
const aceOnlineVoucher = makeVoucherRule(
  AXIS_ACE_ID,
  ACE_VALID_FROM,
  1.5,
  1.5,
);
const iciciAmazon5X = makeVoucherRule(
  ICICI_AMAZON_PAY_ID,
  ICICI_AMAZON_PAY_VALID_FROM,
  5.0,
  1.0,
);

// ICICI partner_merchant rules at 2/3/5% direct have no voucher path. Set
// voucher_reward=0 so bestVoucher skips them; bestDirect still picks them up.
const iciciPartner2 = makeVoucherRule(
  ICICI_AMAZON_PAY_ID,
  ICICI_AMAZON_PAY_VALID_FROM,
  2.0,
  0,
);
const iciciPartner3 = makeVoucherRule(
  ICICI_AMAZON_PAY_ID,
  ICICI_AMAZON_PAY_VALID_FROM,
  3.0,
  0,
);
const iciciPartner5 = makeVoucherRule(
  ICICI_AMAZON_PAY_ID,
  ICICI_AMAZON_PAY_VALID_FROM,
  5.0,
  0,
);

// Partner-rule factory: same shape as makeVoucherRule, but bakes in a
// shared_cap_group + reward_cap (so callers don't repeat them per rule).
type RewardCap = NonNullable<MockRule["caps"]["reward_cap"]>;

const makePartnerVoucherRule = (
  cardId: string,
  validFrom: Date,
  directSwipePercentage: number,
  voucherRewardPercentage: number,
  group: SharedCapGroup,
  rewardCap: RewardCap,
) =>
  (
    id: string,
    category: Category,
    merchant: Merchant,
    voucherDiscountPercentage: number,
    capOverrides: VoucherCapOverrides = {},
  ): MockRule => ({
    _id: id,
    cardId,
    category,
    merchant,
    reward: {
      direct_swipe_percentage: directSwipePercentage,
      voucher_discount_percentage: voucherDiscountPercentage,
      voucher_reward_percentage: voucherRewardPercentage,
      convenience_fee_percentage: capOverrides.convenienceFeePercentage ?? 0,
    },
    caps: {
      reward_cap: rewardCap,
      voucher_monthly_purchase_limit_inr:
        capOverrides.monthlyPurchaseLimitInr ?? null,
      max_voucher_size_inr: capOverrides.maxVoucherSizeInr ?? null,
      vouchers_per_booking: capOverrides.vouchersPerBooking ?? null,
    },
    shared_cap_group: group,
    valid_from: validFrom,
    valid_until: null,
    notes: null,
    is_active: true,
  });

const LIFESTYLE_5X_GROUP: SharedCapGroup = { multiplier: 5, merchant: null };
const LIFESTYLE_5X_REWARD_CAP: RewardCap = {
  period: "monthly",
  metric: "points",
  value: 5000,
  scope: "card",
};
const AMEX_5X_AMZ_GROUP: SharedCapGroup = {
  multiplier: 5,
  merchant: MERCHANTS.AMAZON,
};
const AMEX_5X_AMZ_REWARD_CAP: RewardCap = {
  period: "monthly",
  metric: "points",
  value: 250,
  scope: "merchant",
};
const AMEX_10X_FUB_GROUP: SharedCapGroup = {
  multiplier: 10,
  merchant: MERCHANTS.FLIPKART,
};
const AMEX_10X_FUB_REWARD_CAP: RewardCap = {
  period: "monthly",
  metric: "points",
  value: 500,
  scope: "merchant",
};

const hdfcLifestyle5X = makePartnerVoucherRule(
  HDFC_REGALIA_GOLD_ID,
  REGALIA_VALID_FROM,
  6.67,
  6.5,
  LIFESTYLE_5X_GROUP,
  LIFESTYLE_5X_REWARD_CAP,
);
const sbi10XOnline = makePartnerVoucherRule(
  SBI_SIMPLYCLICK_ID,
  SBI_SIMPLYCLICK_VALID_FROM,
  2.5,
  2.5,
  SBI_10X_GROUP,
  SBI_10X_REWARD_CAP,
);
const sbi5XBase = makePartnerVoucherRule(
  SBI_SIMPLYCLICK_ID,
  SBI_SIMPLYCLICK_VALID_FROM,
  1.25,
  0,
  SBI_10X_GROUP,
  SBI_10X_REWARD_CAP,
);
const amex5XAmazon = makePartnerVoucherRule(
  AMEX_MRCC_ID,
  AMEX_MRCC_VALID_FROM,
  10.0,
  4.0,
  AMEX_5X_AMZ_GROUP,
  AMEX_5X_AMZ_REWARD_CAP,
);
const amex10XFlipkart = makePartnerVoucherRule(
  AMEX_MRCC_ID,
  AMEX_MRCC_VALID_FROM,
  20.0,
  4.0,
  AMEX_10X_FUB_GROUP,
  AMEX_10X_FUB_REWARD_CAP,
);

// Axis ACE Google Pay Bills — 5% direct, joins the ACE_ACCEL pool (₹500/mo
// combined with Swiggy/Zomato/Dineout/District). The pool's shared_cap_group
// key (multiplier: 4) is just an identifier; the actual rate is per-rule.
const aceGPay5X = makePartnerVoucherRule(
  AXIS_ACE_ID,
  new Date("2024-04-20"),
  5.0,
  0,
  ACE_ACCEL_GROUP,
  ACE_ACCEL_REWARD_CAP,
);

// SBI BPCL SmartDrive fuel voucher — direct 0% (fuel MCC excluded), voucher
// reward 2.5% on voucher purchase. Voucher path is the only earner.
const sbiFuelVoucher = makeVoucherRule(
  SBI_SIMPLYCLICK_ID,
  SBI_SIMPLYCLICK_VALID_FROM,
  0,
  2.5,
);

// Tiny helpers for the many merchant: null documentation rules (exclusion
// notes + base-rate disclosures). Skipped by best-of (merchant null), so they
// don't affect computation — they make the dataset self-describing for future
// engine work.
function exclusionDocRule(
  id: string,
  cardId: string,
  category: Category,
  validFrom: Date,
  notes: string,
): MockRule {
  return {
    _id: id,
    cardId,
    category,
    merchant: null,
    reward: {
      direct_swipe_percentage: 0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: validFrom,
    valid_until: null,
    notes,
    is_active: true,
  };
}

function baseDocRule(
  id: string,
  cardId: string,
  category: Category,
  directSwipePct: number,
  validFrom: Date,
  notes: string,
): MockRule {
  return {
    _id: id,
    cardId,
    category,
    merchant: null,
    reward: {
      direct_swipe_percentage: directSwipePct,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: validFrom,
    valid_until: null,
    notes,
    is_active: true,
  };
}

// Per-card online voucher discount tables. Same shape as DiningVoucher.
type OnlineVoucher = [Merchant, number];

// HDFC voucher_available rows at 5X direct without overrides (Amazon / Amazon
// Shopping / Flipkart need conv-fee + purchase-limit overrides — inline below).
const HDFC_ONLINE_5X_VOUCHERS: OnlineVoucher[] = [
  [MERCHANTS.AJIO, 0],
  [MERCHANTS.AJIO_LUXE, 0],
  [MERCHANTS.AMAZON_FRESH, 0],
  [MERCHANTS.TATA_CLIQ, 6.5],
  [MERCHANTS.TATA_CLIQ_LUXURY, 6.5],
];
const HDFC_ONLINE_1X_VOUCHERS: OnlineVoucher[] = [
  [MERCHANTS.AMAZON_PRIME, 10.0],
  [MERCHANTS.BIG_BASKET, 0],
  [MERCHANTS.BLINKIT, 0],
  [MERCHANTS.RELIANCE_JIO_MART, 0],
  [MERCHANTS.ZEPTO, 0],
];

const ACE_ONLINE_VOUCHERS: OnlineVoucher[] = [
  [MERCHANTS.AJIO_LUXE, 3.5],
  [MERCHANTS.AMAZON, 0],
  [MERCHANTS.AMAZON_PRIME, 15.0],
  [MERCHANTS.AMAZON_SHOPPING, 0],
  [MERCHANTS.BIG_BASKET, 0],
  [MERCHANTS.FLIPKART, 0],
  [MERCHANTS.MYNTRA, 2.0],
  [MERCHANTS.NYKAA, 4.5],
  [MERCHANTS.NYKAA_FASHION, 4.5],
  [MERCHANTS.NYKAA_MAN, 4.5],
  [MERCHANTS.RELIANCE_JIO_MART, 1.5],
  [MERCHANTS.TATA_CLIQ, 7.5],
  [MERCHANTS.TATA_CLIQ_LUXURY, 7.5],
];

// SBI 10X-direct online voucher rows (uses sbiVoucher 2.5/2.5).
const SBI_ONLINE_HIGH_VOUCHERS: OnlineVoucher[] = [
  [MERCHANTS.AJIO, 4.0],
  [MERCHANTS.AJIO_LUXE, 3.0],
  [MERCHANTS.AMAZON, 0],
  [MERCHANTS.AMAZON_FRESH, 0],
  [MERCHANTS.AMAZON_PRIME, 15.0],
  [MERCHANTS.AMAZON_SHOPPING, 0],
  [MERCHANTS.FLIPKART, 0],
  [MERCHANTS.TATA_CLIQ, 10.0],
];
// SBI 1X-direct online voucher rows (grocery/quick-commerce excluded from
// 10X — uses sbiDiningLowDirect 0.25/2.5).
const SBI_ONLINE_LOW_VOUCHERS: OnlineVoucher[] = [
  [MERCHANTS.BIG_BASKET, 1.0],
  [MERCHANTS.BLINKIT, 1.0],
  [MERCHANTS.RELIANCE_DIGITAL, 2.0],
  [MERCHANTS.RELIANCE_JIO_MART, 2.0],
  [MERCHANTS.ZEPTO, 2.0],
];

// ICICI 5X-direct online vouchers (no overrides; rules with conv-fee +
// purchase-limit are inline below).
const ICICI_ONLINE_5X_VOUCHERS: OnlineVoucher[] = [
  [MERCHANTS.AJIO, 0],
  [MERCHANTS.MYNTRA, 0],
  [MERCHANTS.NYKAA, 0],
  [MERCHANTS.NYKAA_MAN, 0],
];
const ICICI_ONLINE_1X_VOUCHERS: OnlineVoucher[] = [
  [MERCHANTS.MARKS_AND_SPENCER, 0],
  [MERCHANTS.RELIANCE_JIO_MART, 0],
];

const AMEX_ONLINE_VOUCHERS: OnlineVoucher[] = [
  [MERCHANTS.AJIO, 3.25],
  [MERCHANTS.BIG_BASKET, 0],
  [MERCHANTS.MARKS_AND_SPENCER, 8.25],
  [MERCHANTS.MYNTRA, 0],
  [MERCHANTS.NYKAA, 3.0],
  [MERCHANTS.NYKAA_FASHION, 2.0],
  [MERCHANTS.NYKAA_MAN, 2.0],
  [MERCHANTS.RELIANCE_DIGITAL, 0],
  [MERCHANTS.RELIANCE_JIO_MART, 0],
  [MERCHANTS.SNAPDEAL_SCLP_1000, 1.1],
  [MERCHANTS.SNAPDEAL_SCLP_500, 0],
  [MERCHANTS.TATA_CLIQ_FASHION, 5.0],
  [MERCHANTS.TATA_CLIQ_LUXURY, 1.2],
];

function onlineVoucherRules(
  prefix: string,
  table: OnlineVoucher[],
  factory: ReturnType<typeof makeVoucherRule>,
): MockRule[] {
  return table.map(([m, d]) =>
    factory(`rule_${prefix}_online_v_${m}`, CATEGORIES.ONLINE_SHOPPING, m, d),
  );
}

export const MOCK_RULES: MockRule[] = [
  regaliaVoucher(
    "rule_regalia_v_air_india",
    CATEGORIES.FLIGHTS,
    MERCHANTS.AIR_INDIA,
    0,
    {
      maxVoucherSizeInr: 10000,
    },
  ),
  regaliaVoucher(
    "rule_regalia_v_cleartrip_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.CLEARTRIP,
    0,
    {
      maxVoucherSizeInr: 10000,
      vouchersPerBooking: 15,
    },
  ),
  regaliaVoucher(
    "rule_regalia_v_cleartrip_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.CLEARTRIP,
    10,
    {
      maxVoucherSizeInr: 10000,
      vouchersPerBooking: 15,
    },
  ),
  regaliaVoucher(
    "rule_regalia_v_easemytrip_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.EASEMYTRIP,
    2.5,
    {
      maxVoucherSizeInr: 5000,
      vouchersPerBooking: 3,
    },
  ),
  regaliaVoucher(
    "rule_regalia_v_easemytrip_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.EASEMYTRIP,
    5,
    {
      maxVoucherSizeInr: 5000,
      vouchersPerBooking: 3,
    },
  ),
  regaliaVoucher(
    "rule_regalia_v_itc_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.ITC_HOTELS,
    2.5,
    {
      maxVoucherSizeInr: 10000,
    },
  ),
  regaliaVoucher(
    "rule_regalia_v_ixigo_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.IXIGO,
    2.5,
    {
      maxVoucherSizeInr: 3000,
      vouchersPerBooking: 1,
    },
  ),
  regaliaVoucher(
    "rule_regalia_v_ixigo_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.IXIGO,
    7.5,
    {
      maxVoucherSizeInr: 2500,
      vouchersPerBooking: 1,
    },
  ),
  regaliaVoucher(
    "rule_regalia_v_makemytrip_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.MAKEMYTRIP,
    0,
    {
      maxVoucherSizeInr: 10000,
      vouchersPerBooking: 3,
    },
  ),
  regaliaVoucher(
    "rule_regalia_v_makemytrip_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.MAKEMYTRIP,
    7.5,
    {
      maxVoucherSizeInr: 10000,
      vouchersPerBooking: 3,
    },
  ),
  regaliaVoucher(
    "rule_regalia_v_taj_experiences",
    CATEGORIES.HOTELS,
    MERCHANTS.TAJ_EXPERIENCES,
    2,
    {
      maxVoucherSizeInr: 10000,
    },
  ),
  regaliaVoucher(
    "rule_regalia_v_taj_wellness",
    CATEGORIES.HOTELS,
    MERCHANTS.TAJ_WELLNESS,
    2,
    {
      maxVoucherSizeInr: 10000,
    },
  ),
  regaliaVoucher(
    "rule_regalia_v_yatra",
    CATEGORIES.FLIGHTS,
    MERCHANTS.YATRA,
    0,
    {
      maxVoucherSizeInr: 10000,
      vouchersPerBooking: 1,
    },
  ),

  {
    _id: "rule_regalia_base_other",
    cardId: HDFC_REGALIA_GOLD_ID,
    category: CATEGORIES.OTHER,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1.33,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: REGALIA_VALID_FROM,
    valid_until: null,
    notes:
      "Base: 4pts/₹150; grocery 2000pt cap; utility/insurance/edu earn base",
    is_active: true,
  },
  {
    _id: "rule_regalia_base_flights",
    cardId: HDFC_REGALIA_GOLD_ID,
    category: CATEGORIES.FLIGHTS,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1.33,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: REGALIA_VALID_FROM,
    valid_until: null,
    notes:
      "Direct booking on airline/hotel site or OTA (non-portal). Earns base rate. For portal-specific rates see SmartBuy rule.",
    is_active: true,
  },
  {
    _id: "rule_regalia_base_hotels",
    cardId: HDFC_REGALIA_GOLD_ID,
    category: CATEGORIES.HOTELS,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1.33,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: REGALIA_VALID_FROM,
    valid_until: null,
    notes:
      "Direct booking on airline/hotel site or OTA (non-portal). Earns base rate. For portal-specific rates see SmartBuy rule.",
    is_active: true,
  },
  {
    _id: "rule_regalia_smartbuy_flights",
    cardId: HDFC_REGALIA_GOLD_ID,
    category: CATEGORIES.FLIGHTS,
    merchant: MERCHANTS.SMARTBUY,
    reward: {
      direct_swipe_percentage: 6.67,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: {
        period: "monthly",
        metric: "points",
        value: 4000,
        scope: "merchant",
      },
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: { multiplier: null, merchant: MERCHANTS.SMARTBUY },
    valid_from: REGALIA_VALID_FROM,
    valid_until: null,
    notes:
      "Via HDFC SmartBuy portal only. Shared 4,000 pts/month combined cap across all SmartBuy categories.",
    is_active: true,
  },
  {
    _id: "rule_regalia_smartbuy_hotels",
    cardId: HDFC_REGALIA_GOLD_ID,
    category: CATEGORIES.HOTELS,
    merchant: MERCHANTS.SMARTBUY,
    reward: {
      direct_swipe_percentage: 13.33,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: {
        period: "monthly",
        metric: "points",
        value: 4000,
        scope: "merchant",
      },
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: { multiplier: null, merchant: MERCHANTS.SMARTBUY },
    valid_from: REGALIA_VALID_FROM,
    valid_until: null,
    notes:
      "Via HDFC SmartBuy portal only. Shared 4,000 pts/month combined cap across all SmartBuy categories.",
    is_active: true,
  },

  aceVoucher(
    "rule_ace_v_air_india",
    CATEGORIES.FLIGHTS,
    MERCHANTS.AIR_INDIA,
    4,
    {
      maxVoucherSizeInr: 10000,
    },
  ),
  aceVoucher(
    "rule_ace_v_cleartrip_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.CLEARTRIP,
    4,
    {
      maxVoucherSizeInr: 10000,
      vouchersPerBooking: 15,
    },
  ),
  aceVoucher(
    "rule_ace_v_cleartrip_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.CLEARTRIP,
    0,
    {
      maxVoucherSizeInr: 10000,
      vouchersPerBooking: 15,
    },
  ),
  aceVoucher(
    "rule_ace_v_easemytrip_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.EASEMYTRIP,
    7,
    {
      maxVoucherSizeInr: 5000,
      vouchersPerBooking: 3,
    },
  ),
  aceVoucher(
    "rule_ace_v_easemytrip_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.EASEMYTRIP,
    12.5,
    {
      maxVoucherSizeInr: 5000,
      vouchersPerBooking: 3,
    },
  ),
  aceVoucher(
    "rule_ace_v_fab_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.FAB_HOTELS,
    10,
    {
      maxVoucherSizeInr: 10000,
      vouchersPerBooking: 1,
    },
  ),
  aceVoucher(
    "rule_ace_v_ixigo_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.IXIGO,
    6,
    {
      maxVoucherSizeInr: 3000,
      vouchersPerBooking: 1,
    },
  ),
  aceVoucher(
    "rule_ace_v_makemytrip_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.MAKEMYTRIP,
    4.5,
    {
      maxVoucherSizeInr: 10000,
      vouchersPerBooking: 3,
    },
  ),
  aceVoucher(
    "rule_ace_v_makemytrip_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.MAKEMYTRIP,
    10,
    {
      maxVoucherSizeInr: 10000,
      vouchersPerBooking: 3,
    },
  ),
  aceVoucher(
    "rule_ace_v_taj_wellness",
    CATEGORIES.HOTELS,
    MERCHANTS.TAJ_WELLNESS,
    10,
    {
      maxVoucherSizeInr: 10000,
    },
  ),
  {
    _id: "rule_ace_base_other",
    cardId: AXIS_ACE_ID,
    category: CATEGORIES.OTHER,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1.5,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: new Date("2024-04-20"),
    valid_until: null,
    notes: "Base 1.5%; unlimited; reduced from 2% Apr 2024",
    is_active: true,
  },
  {
    _id: "rule_ace_base_flights",
    cardId: AXIS_ACE_ID,
    category: CATEGORIES.FLIGHTS,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1.5,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: ACE_VALID_FROM,
    valid_until: null,
    notes:
      "No dedicated bank portal for Axis ACE. Base 1.5% cashback applies for flight bookings on any platform (direct or OTA).",
    is_active: true,
  },
  {
    _id: "rule_ace_base_hotels",
    cardId: AXIS_ACE_ID,
    category: CATEGORIES.HOTELS,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1.5,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: ACE_VALID_FROM,
    valid_until: null,
    notes:
      "No dedicated bank portal for Axis ACE. Base 1.5% cashback applies for hotel bookings on any platform (direct or OTA).",
    is_active: true,
  },

  sbiVoucher(
    "rule_sbi_v_adani_meet_greet",
    CATEGORIES.OTHER,
    MERCHANTS.ADANI_MEET_GREET,
    0,
  ),
  sbiVoucher(
    "rule_sbi_v_air_india",
    CATEGORIES.FLIGHTS,
    MERCHANTS.AIR_INDIA,
    2,
    {
      maxVoucherSizeInr: 10000,
    },
  ),
  sbiVoucher(
    "rule_sbi_v_fab_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.FAB_HOTELS,
    8,
    {
      maxVoucherSizeInr: 10000,
      vouchersPerBooking: 1,
    },
  ),
  sbiVoucher("rule_sbi_v_irctc", CATEGORIES.OTHER, MERCHANTS.IRCTC, 0),
  sbiVoucher(
    "rule_sbi_v_itc_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.ITC_HOTELS,
    7,
    {
      maxVoucherSizeInr: 10000,
    },
  ),
  sbiVoucher(
    "rule_sbi_v_ixigo_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.IXIGO,
    7,
    {
      maxVoucherSizeInr: 3000,
      vouchersPerBooking: 1,
    },
  ),
  sbiVoucher(
    "rule_sbi_v_makemytrip_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.MAKEMYTRIP,
    5,
    {
      maxVoucherSizeInr: 10000,
      vouchersPerBooking: 3,
    },
  ),
  sbiVoucher(
    "rule_sbi_v_makemytrip_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.MAKEMYTRIP,
    9,
    {
      maxVoucherSizeInr: 10000,
      vouchersPerBooking: 3,
    },
  ),
  sbiVoucher(
    "rule_sbi_v_taj_experiences",
    CATEGORIES.HOTELS,
    MERCHANTS.TAJ_EXPERIENCES,
    7,
    {
      maxVoucherSizeInr: 10000,
    },
  ),
  sbiVoucher(
    "rule_sbi_v_taj_wellness",
    CATEGORIES.HOTELS,
    MERCHANTS.TAJ_WELLNESS,
    10,
    {
      maxVoucherSizeInr: 10000,
    },
  ),

  {
    _id: "rule_sbi_v_finusmart",
    cardId: SBI_SIMPLYCLICK_ID,
    category: CATEGORIES.OTHER,
    merchant: MERCHANTS.FINUSMART,
    reward: {
      direct_swipe_percentage: 0.25,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 2.5,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: SBI_SIMPLYCLICK_VALID_FROM,
    valid_until: null,
    notes:
      "Finance category earns base 1X on direct swipe; voucher purchase earns 10X (2.5%).",
    is_active: true,
  },
  {
    _id: "rule_sbi_partner_cleartrip_flights",
    cardId: SBI_SIMPLYCLICK_ID,
    category: CATEGORIES.FLIGHTS,
    merchant: MERCHANTS.CLEARTRIP,
    reward: {
      direct_swipe_percentage: 2.5,
      voucher_discount_percentage: 4,
      voucher_reward_percentage: 2.5,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: {
        period: "monthly",
        metric: "points",
        value: 10000,
        scope: "merchant",
      },
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: 10000,
      vouchers_per_booking: 15,
    },
    shared_cap_group: { multiplier: 10, merchant: null },
    valid_from: SBI_SIMPLYCLICK_VALID_FROM,
    valid_until: null,
    notes:
      "SBI 10X partner portal Cleartrip. Earn 10pts/₹100 = 2.5%. Shares 10,000pt/month combined cap.",
    is_active: true,
  },
  {
    _id: "rule_sbi_partner_cleartrip_hotels",
    cardId: SBI_SIMPLYCLICK_ID,
    category: CATEGORIES.HOTELS,
    merchant: MERCHANTS.CLEARTRIP,
    reward: {
      direct_swipe_percentage: 2.5,
      voucher_discount_percentage: 12,
      voucher_reward_percentage: 2.5,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: {
        period: "monthly",
        metric: "points",
        value: 10000,
        scope: "merchant",
      },
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: 10000,
      vouchers_per_booking: 15,
    },
    shared_cap_group: { multiplier: 10, merchant: null },
    valid_from: SBI_SIMPLYCLICK_VALID_FROM,
    valid_until: null,
    notes:
      "SBI 10X partner portal Cleartrip Hotels. Earn 10pts/₹100 = 2.5%. Shares 10,000pt/month combined cap.",
    is_active: true,
  },
  {
    _id: "rule_sbi_base_flights",
    cardId: SBI_SIMPLYCLICK_ID,
    category: CATEGORIES.FLIGHTS,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1.25,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: {
        period: "monthly",
        metric: "points",
        value: 10000,
        scope: "card",
      },
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: { multiplier: 10, merchant: null },
    valid_from: SBI_SIMPLYCLICK_VALID_FROM,
    valid_until: null,
    notes:
      "Direct booking on airline/hotel site or OTA (non-portal). Earns 5X base = 1.25%. For 10X partner rates see Cleartrip rules.",
    is_active: true,
  },
  {
    _id: "rule_sbi_base_hotels",
    cardId: SBI_SIMPLYCLICK_ID,
    category: CATEGORIES.HOTELS,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1.25,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: {
        period: "monthly",
        metric: "points",
        value: 10000,
        scope: "card",
      },
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: { multiplier: 10, merchant: null },
    valid_from: SBI_SIMPLYCLICK_VALID_FROM,
    valid_until: null,
    notes:
      "Direct booking on airline/hotel site or OTA (non-portal). Earns 5X base = 1.25%. For 10X partner rates see Cleartrip rules.",
    is_active: true,
  },

  iciciAmazonVoucher(
    "rule_icici_amzn_v_cleartrip_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.CLEARTRIP,
    0,
    { maxVoucherSizeInr: 10000, vouchersPerBooking: 15 },
  ),
  iciciAmazonVoucher(
    "rule_icici_amzn_v_cleartrip_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.CLEARTRIP,
    0,
    { maxVoucherSizeInr: 10000, vouchersPerBooking: 15 },
  ),
  iciciAmazonVoucher(
    "rule_icici_amzn_v_easemytrip_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.EASEMYTRIP,
    0,
    { maxVoucherSizeInr: 5000, vouchersPerBooking: 3 },
  ),
  iciciAmazonVoucher(
    "rule_icici_amzn_v_fab_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.FAB_HOTELS,
    0,
    { maxVoucherSizeInr: 10000, vouchersPerBooking: 1 },
  ),
  iciciAmazonVoucher(
    "rule_icici_amzn_v_itc_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.ITC_HOTELS,
    0,
    { maxVoucherSizeInr: 10000 },
  ),
  iciciAmazonVoucher(
    "rule_icici_amzn_v_marriott",
    CATEGORIES.HOTELS,
    MERCHANTS.MARRIOTT,
    0,
    { maxVoucherSizeInr: 10000 },
  ),
  iciciAmazonVoucher(
    "rule_icici_amzn_v_taj_experiences",
    CATEGORIES.HOTELS,
    MERCHANTS.TAJ_EXPERIENCES,
    0,
    { maxVoucherSizeInr: 10000 },
  ),

  {
    _id: "rule_icici_amzn_base_other",
    cardId: ICICI_AMAZON_PAY_ID,
    category: CATEGORIES.OTHER,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: new Date("2025-10-11"),
    valid_until: null,
    notes: "Offline, non-Amazon online. 1% cashback.",
    is_active: true,
  },
  {
    _id: "rule_icici_amzn_base_flights",
    cardId: ICICI_AMAZON_PAY_ID,
    category: CATEGORIES.FLIGHTS,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: ICICI_AMAZON_PAY_VALID_FROM,
    valid_until: null,
    notes:
      "Direct booking on airline site or non-Amazon OTA. Earns 1% base. For Amazon.in travel see AMAZON_PAY rule.",
    is_active: true,
  },
  {
    _id: "rule_icici_amzn_base_hotels",
    cardId: ICICI_AMAZON_PAY_ID,
    category: CATEGORIES.HOTELS,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: ICICI_AMAZON_PAY_VALID_FROM,
    valid_until: null,
    notes:
      "Direct booking on hotel site or non-Amazon OTA. Earns 1% base. For Amazon.in travel see AMAZON_PAY rule.",
    is_active: true,
  },
  {
    _id: "rule_icici_amzn_partner_amazon_flights",
    cardId: ICICI_AMAZON_PAY_ID,
    category: CATEGORIES.FLIGHTS,
    merchant: MERCHANTS.AMAZON_PAY,
    reward: {
      direct_swipe_percentage: 5,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: new Date("2025-10-11"),
    valid_until: null,
    notes:
      "Flights booked via Amazon.in travel section earn 5% (Prime) cashback.",
    is_active: true,
  },
  {
    _id: "rule_icici_amzn_partner_amazon_hotels",
    cardId: ICICI_AMAZON_PAY_ID,
    category: CATEGORIES.HOTELS,
    merchant: MERCHANTS.AMAZON_PAY,
    reward: {
      direct_swipe_percentage: 5,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: new Date("2025-10-11"),
    valid_until: null,
    notes:
      "Hotels booked via Amazon.in travel section earn 5% (Prime) cashback.",
    is_active: true,
  },

  amexMrccVoucher(
    "rule_amex_v_air_india",
    CATEGORIES.FLIGHTS,
    MERCHANTS.AIR_INDIA,
    3,
    { maxVoucherSizeInr: 10000 },
  ),
  amexMrccVoucher(
    "rule_amex_v_cleartrip_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.CLEARTRIP,
    2.3,
    { maxVoucherSizeInr: 10000, vouchersPerBooking: 15 },
  ),
  amexMrccVoucher(
    "rule_amex_v_cleartrip_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.CLEARTRIP,
    11.9,
    { maxVoucherSizeInr: 10000, vouchersPerBooking: 15 },
  ),
  amexMrccVoucher(
    "rule_amex_v_fab_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.FAB_HOTELS,
    3.1,
    { maxVoucherSizeInr: 10000, vouchersPerBooking: 1 },
  ),
  amexMrccVoucher(
    "rule_amex_v_goibibo_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.GOIBIBO,
    2.1,
    { maxVoucherSizeInr: 10000 },
  ),
  amexMrccVoucher(
    "rule_amex_v_itc_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.ITC_HOTELS,
    5.1,
    { maxVoucherSizeInr: 10000 },
  ),
  amexMrccVoucher(
    "rule_amex_v_makemytrip_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.MAKEMYTRIP,
    0,
    { maxVoucherSizeInr: 10000, vouchersPerBooking: 3 },
  ),
  amexMrccVoucher(
    "rule_amex_v_makemytrip_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.MAKEMYTRIP,
    6.6,
    { maxVoucherSizeInr: 10000, vouchersPerBooking: 3 },
  ),
  amexMrccVoucher(
    "rule_amex_v_marriott_hotels",
    CATEGORIES.HOTELS,
    MERCHANTS.MARRIOTT,
    0,
    { maxVoucherSizeInr: 10000 },
  ),
  amexMrccVoucher(
    "rule_amex_v_taj_experiences",
    CATEGORIES.HOTELS,
    MERCHANTS.TAJ_EXPERIENCES,
    2.4,
    { maxVoucherSizeInr: 10000 },
  ),
  amexMrccVoucher(
    "rule_amex_v_the_leela",
    CATEGORIES.HOTELS,
    MERCHANTS.THE_LEELA,
    2.1,
  ),
  amexMrccVoucher(
    "rule_amex_v_the_postcard",
    CATEGORIES.HOTELS,
    MERCHANTS.THE_POSTCARD,
    2.2,
  ),
  amexMrccVoucher(
    "rule_amex_v_yatra_flights",
    CATEGORIES.FLIGHTS,
    MERCHANTS.YATRA,
    1,
    { maxVoucherSizeInr: 10000, vouchersPerBooking: 1 },
  ),

  {
    _id: "rule_amex_partner_easemytrip_flights",
    cardId: AMEX_MRCC_ID,
    category: CATEGORIES.FLIGHTS,
    merchant: MERCHANTS.EASEMYTRIP,
    reward: {
      direct_swipe_percentage: 20,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 4,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: {
        period: "monthly",
        metric: "points",
        value: 500,
        scope: "merchant",
      },
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: 5000,
      vouchers_per_booking: 3,
    },
    shared_cap_group: { multiplier: 10, merchant: MERCHANTS.EASEMYTRIP },
    valid_from: AMEX_MRCC_VALID_FROM,
    valid_until: null,
    notes:
      "EaseMyTrip is the primary Amex travel portal. 10X = 20pts/₹100. Shared 500pt/month cap with Zomato.",
    is_active: true,
  },
  {
    _id: "rule_amex_partner_easemytrip_hotels",
    cardId: AMEX_MRCC_ID,
    category: CATEGORIES.HOTELS,
    merchant: MERCHANTS.EASEMYTRIP,
    reward: {
      direct_swipe_percentage: 20,
      voucher_discount_percentage: 2.1,
      voucher_reward_percentage: 4,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: {
        period: "monthly",
        metric: "points",
        value: 500,
        scope: "merchant",
      },
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: 5000,
      vouchers_per_booking: 3,
    },
    shared_cap_group: { multiplier: 10, merchant: MERCHANTS.EASEMYTRIP },
    valid_from: AMEX_MRCC_VALID_FROM,
    valid_until: null,
    notes: "EaseMyTrip hotels. 10X = 20pts/₹100. Shared 500pt/month cap.",
    is_active: true,
  },
  {
    _id: "rule_amex_base_other",
    cardId: AMEX_MRCC_ID,
    category: CATEGORIES.OTHER,
    merchant: null,
    reward: {
      direct_swipe_percentage: 2,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: AMEX_MRCC_VALID_FROM,
    valid_until: null,
    notes: "Base: 1pt/₹50=2pts/₹100; Bonvoy ₹1/pt",
    is_active: true,
  },
  {
    _id: "rule_amex_base_flights",
    cardId: AMEX_MRCC_ID,
    category: CATEGORIES.FLIGHTS,
    merchant: null,
    reward: {
      direct_swipe_percentage: 2,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: AMEX_MRCC_VALID_FROM,
    valid_until: null,
    notes:
      "Direct booking on airline site or OTA (non-portal). Earns 2% base. For EaseMyTrip 10X partner rate see partner rule.",
    is_active: true,
  },
  {
    _id: "rule_amex_base_hotels",
    cardId: AMEX_MRCC_ID,
    category: CATEGORIES.HOTELS,
    merchant: null,
    reward: {
      direct_swipe_percentage: 2,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: AMEX_MRCC_VALID_FROM,
    valid_until: null,
    notes:
      "Direct booking on hotel site or OTA (non-portal). Earns 2% base. For EaseMyTrip 10X partner rate see partner rule.",
    is_active: true,
  },

  // ==========================================================================
  // Food & Dining Out — voucher rules (per card)
  // ==========================================================================
  ...diningVoucherRules("regalia", HDFC_DINING_VOUCHERS, regaliaVoucher),
  ...diningVoucherRules("ace", ACE_DINING_VOUCHERS, aceVoucher),
  // Axis ACE Sun Scoop dining voucher — direct swipe drops to 1.5% (base),
  // voucher reward stays at 1.5%. Single-row exception to the 4% table above.
  {
    _id: "rule_ace_dining_v_sun_scoop",
    cardId: AXIS_ACE_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.SUN_SCOOP,
    reward: {
      direct_swipe_percentage: 1.5,
      voucher_discount_percentage: 20.0,
      voucher_reward_percentage: 1.5,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: ACE_VALID_FROM,
    valid_until: null,
    notes: null,
    is_active: true,
  },
  ...diningVoucherRules("sbi", SBI_DINING_VOUCHERS, sbiDining),
  // SBI Baskin Robbins & Pret A Manger — direct swipe is base (0.25%) since
  // they're outside the accelerator categories; voucher reward stays at 2.5%.
  sbiDiningLowDirect(
    "rule_sbi_dining_v_baskin_robbins",
    CATEGORIES.DINING,
    MERCHANTS.BASKIN_ROBBINS,
    14.0,
  ),
  sbiDiningLowDirect(
    "rule_sbi_dining_v_pret_a_manger",
    CATEGORIES.DINING,
    MERCHANTS.PRET_A_MANGER,
    12.0,
  ),
  // SBI Sun Scoop dining voucher — 10X earn (2.5%) with 16% discount.
  sbiVoucher(
    "rule_sbi_dining_v_sun_scoop",
    CATEGORIES.DINING,
    MERCHANTS.SUN_SCOOP,
    16.0,
  ),
  ...diningVoucherRules("icici", ICICI_DINING_VOUCHERS, iciciAmazonDining),
  // ICICI Baskin Robbins — base 1%/1% (not in dining accelerator list).
  iciciAmazonVoucher(
    "rule_icici_dining_v_baskin_robbins",
    CATEGORIES.DINING,
    MERCHANTS.BASKIN_ROBBINS,
    0,
  ),
  ...diningVoucherRules("amex", AMEX_DINING_VOUCHERS, amexMrccVoucher),
  // Amex Marriott Dining — voucher cap data calls out a ₹10K voucher size.
  amexMrccVoucher(
    "rule_amex_dining_v_marriott",
    CATEGORIES.DINING,
    MERCHANTS.MARRIOTT_DINING,
    0,
    { maxVoucherSizeInr: 10000 },
  ),

  // ==========================================================================
  // Food & Dining Out — partner_merchant rules (accelerated direct swipe)
  // ==========================================================================
  // Axis ACE Swiggy/Zomato/Swiggy Dineout/Zomato District: 4% cashback,
  // combined ₹500/month cap (ACE_ACCEL pool).
  {
    _id: "rule_ace_partner_swiggy",
    cardId: AXIS_ACE_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.SWIGGY,
    reward: {
      direct_swipe_percentage: 4.0,
      voucher_discount_percentage: 1.5,
      voucher_reward_percentage: 1.5,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: ACE_ACCEL_REWARD_CAP,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: ACE_ACCEL_GROUP,
    valid_from: ACE_VALID_FROM,
    valid_until: null,
    notes:
      "Swiggy earns ACE 4% cashback; ₹500/month combined cap across Swiggy, Zomato, Swiggy Dineout, Zomato District.",
    is_active: true,
  },
  {
    _id: "rule_ace_partner_zomato",
    cardId: AXIS_ACE_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.ZOMATO,
    reward: {
      direct_swipe_percentage: 4.0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: ACE_ACCEL_REWARD_CAP,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: ACE_ACCEL_GROUP,
    valid_from: new Date("2024-04-20"),
    valid_until: null,
    notes: "Zomato earns ACE 4% cashback; ₹500/month combined ACE_ACCEL cap.",
    is_active: true,
  },

  // SBI SimplyCLICK Swiggy (5X) & Domino's Pizza (10X) — share the existing
  // 10,000pt/month SBI_10X pool with Cleartrip flights/hotels.
  {
    _id: "rule_sbi_partner_swiggy",
    cardId: SBI_SIMPLYCLICK_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.SWIGGY,
    reward: {
      direct_swipe_percentage: 1.25,
      voucher_discount_percentage: 2.0,
      voucher_reward_percentage: 2.5,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: SBI_10X_REWARD_CAP,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: SBI_10X_GROUP,
    valid_from: new Date("2025-04-01"),
    valid_until: null,
    notes:
      "SBI Swiggy 5X (post-Apr 2025) = 5pts/₹100 = 1.25%; shares 10,000pt/month combined cap.",
    is_active: true,
  },
  {
    _id: "rule_sbi_partner_dominos_pizza",
    cardId: SBI_SIMPLYCLICK_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.DOMINOS_PIZZA,
    reward: {
      direct_swipe_percentage: 2.5,
      voucher_discount_percentage: 12.0,
      voucher_reward_percentage: 2.5,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: SBI_10X_REWARD_CAP,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: SBI_10X_GROUP,
    valid_from: SBI_SIMPLYCLICK_VALID_FROM,
    valid_until: null,
    notes:
      "SBI Domino's 10X partner = 10pts/₹100 = 2.5%; shares 10,000pt/month combined cap.",
    is_active: true,
  },

  // ==========================================================================
  // Food & Dining Out — base rules for sub-MCC merchants (Swiggy Dineout,
  // EazyDiner, Zomato District) and the generic "Dining Others" base rate.
  // ==========================================================================

  // Swiggy Dineout per card — merchant rule so it shows up in best-of lookup.
  {
    _id: "rule_regalia_dining_swiggy_dineout",
    cardId: HDFC_REGALIA_GOLD_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.SWIGGY_DINEOUT,
    reward: {
      direct_swipe_percentage: 1.33,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: REGALIA_VALID_FROM,
    valid_until: null,
    notes:
      "Swiggy Dineout via Swiggy app = dining MCC. HDFC has no Swiggy accelerator; earns base 1.33%.",
    is_active: true,
  },
  {
    _id: "rule_ace_dining_swiggy_dineout",
    cardId: AXIS_ACE_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.SWIGGY_DINEOUT,
    reward: {
      direct_swipe_percentage: 4.0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: ACE_ACCEL_REWARD_CAP,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: ACE_ACCEL_GROUP,
    valid_from: new Date("2024-04-20"),
    valid_until: null,
    notes:
      "Swiggy Dineout → ACE 4% (Swiggy partner); ₹500/month combined ACE_ACCEL cap.",
    is_active: true,
  },
  {
    _id: "rule_sbi_dining_swiggy_dineout",
    cardId: SBI_SIMPLYCLICK_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.SWIGGY_DINEOUT,
    reward: {
      direct_swipe_percentage: 1.25,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: SBI_10X_REWARD_CAP,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: SBI_10X_GROUP,
    valid_from: new Date("2025-04-01"),
    valid_until: null,
    notes:
      "Swiggy Dineout → Swiggy 5X rate (post-Apr 2025); shares 10,000pt SBI_10X cap.",
    is_active: true,
  },
  {
    _id: "rule_icici_dining_swiggy_dineout",
    cardId: ICICI_AMAZON_PAY_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.SWIGGY_DINEOUT,
    reward: {
      direct_swipe_percentage: 1.0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: new Date("2025-10-11"),
    valid_until: null,
    notes: "Swiggy Dineout earns ICICI base 1% (no Amazon ecosystem rate).",
    is_active: true,
  },
  {
    _id: "rule_amex_dining_swiggy_dineout",
    cardId: AMEX_MRCC_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.SWIGGY_DINEOUT,
    reward: {
      direct_swipe_percentage: 2.0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: AMEX_MRCC_VALID_FROM,
    valid_until: null,
    notes: "Swiggy Dineout not in Amex 10X partners; earns base 2pts/₹100.",
    is_active: true,
  },

  // EazyDiner per card (restaurant dining MCC; no card has accelerator).
  {
    _id: "rule_regalia_dining_eazydiner",
    cardId: HDFC_REGALIA_GOLD_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.EAZYDINER,
    reward: {
      direct_swipe_percentage: 1.33,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: REGALIA_VALID_FROM,
    valid_until: null,
    notes: "EazyDiner = restaurant payment dining MCC; HDFC earns base 1.33%.",
    is_active: true,
  },
  {
    _id: "rule_ace_dining_eazydiner",
    cardId: AXIS_ACE_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.EAZYDINER,
    reward: {
      direct_swipe_percentage: 1.5,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: new Date("2024-04-20"),
    valid_until: null,
    notes:
      "EazyDiner = dining MCC; ACE earns base 1.5% (Axis offers a separate 15% EazyDiner discount perk).",
    is_active: true,
  },
  {
    _id: "rule_sbi_dining_eazydiner",
    cardId: SBI_SIMPLYCLICK_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.EAZYDINER,
    reward: {
      direct_swipe_percentage: 0.25,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: SBI_SIMPLYCLICK_VALID_FROM,
    valid_until: null,
    notes: "EazyDiner = dining MCC; SBI earns base 1pt/₹100 = 0.25%.",
    is_active: true,
  },
  {
    _id: "rule_icici_dining_eazydiner",
    cardId: ICICI_AMAZON_PAY_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.EAZYDINER,
    reward: {
      direct_swipe_percentage: 1.0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: new Date("2025-10-11"),
    valid_until: null,
    notes: "EazyDiner = dining MCC; ICICI earns base 1%.",
    is_active: true,
  },
  {
    _id: "rule_amex_dining_eazydiner",
    cardId: AMEX_MRCC_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.EAZYDINER,
    reward: {
      direct_swipe_percentage: 2.0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: AMEX_MRCC_VALID_FROM,
    valid_until: null,
    notes: "EazyDiner = dining MCC; Amex earns base 2pts/₹100.",
    is_active: true,
  },

  // Zomato District per card.
  {
    _id: "rule_regalia_dining_zomato_district",
    cardId: HDFC_REGALIA_GOLD_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.ZOMATO_DISTRICT,
    reward: {
      direct_swipe_percentage: 1.33,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: REGALIA_VALID_FROM,
    valid_until: null,
    notes:
      "Zomato District = Zomato platform dining; HDFC has no Zomato accelerator → base 1.33%.",
    is_active: true,
  },
  {
    _id: "rule_ace_dining_zomato_district",
    cardId: AXIS_ACE_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.ZOMATO_DISTRICT,
    reward: {
      direct_swipe_percentage: 4.0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: ACE_ACCEL_REWARD_CAP,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: ACE_ACCEL_GROUP,
    valid_from: new Date("2024-04-20"),
    valid_until: null,
    notes:
      "Zomato District → ACE 4% (Zomato partner); ₹500/month combined ACE_ACCEL cap.",
    is_active: true,
  },
  {
    _id: "rule_sbi_dining_zomato_district",
    cardId: SBI_SIMPLYCLICK_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.ZOMATO_DISTRICT,
    reward: {
      direct_swipe_percentage: 0.25,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: SBI_SIMPLYCLICK_VALID_FROM,
    valid_until: null,
    notes:
      "Zomato District = dining via Zomato; SBI has no Zomato accelerator → base 1pt/₹100.",
    is_active: true,
  },
  {
    _id: "rule_icici_dining_zomato_district",
    cardId: ICICI_AMAZON_PAY_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.ZOMATO_DISTRICT,
    reward: {
      direct_swipe_percentage: 1.0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: new Date("2025-10-11"),
    valid_until: null,
    notes: "Zomato District outside Amazon ecosystem; ICICI earns base 1%.",
    is_active: true,
  },
  {
    _id: "rule_amex_dining_zomato_district",
    cardId: AMEX_MRCC_ID,
    category: CATEGORIES.DINING,
    merchant: MERCHANTS.ZOMATO_DISTRICT,
    reward: {
      direct_swipe_percentage: 20.0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: AMEX_10X_EZ_REWARD_CAP,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: AMEX_10X_EZ_GROUP,
    valid_from: AMEX_MRCC_VALID_FROM,
    valid_until: null,
    notes:
      "Zomato District → Amex 10X Zomato rate (20pts/₹100); shares 500pt/month AMEX_10X_EZ cap with EaseMyTrip.",
    is_active: true,
  },

  // "Dining Others" — generic offline restaurant swipe earning base rate.
  // merchant: null so it doesn't affect best-of (these are documentation rules).
  {
    _id: "rule_regalia_dining_others",
    cardId: HDFC_REGALIA_GOLD_ID,
    category: CATEGORIES.DINING,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1.33,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: REGALIA_VALID_FROM,
    valid_until: null,
    notes:
      "Generic offline restaurant / café swipe — base 2.6667pts/₹100 = 1.33%.",
    is_active: true,
  },
  {
    _id: "rule_ace_dining_others",
    cardId: AXIS_ACE_ID,
    category: CATEGORIES.DINING,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1.5,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: ACE_VALID_FROM,
    valid_until: null,
    notes: "Generic offline restaurant / café swipe — ACE base 1.5% cashback.",
    is_active: true,
  },
  {
    _id: "rule_sbi_dining_others",
    cardId: SBI_SIMPLYCLICK_ID,
    category: CATEGORIES.DINING,
    merchant: null,
    reward: {
      direct_swipe_percentage: 0.25,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: SBI_SIMPLYCLICK_VALID_FROM,
    valid_until: null,
    notes:
      "Generic offline restaurant / café swipe — SBI base 1pt/₹100 = 0.25%.",
    is_active: true,
  },
  {
    _id: "rule_icici_dining_others",
    cardId: ICICI_AMAZON_PAY_ID,
    category: CATEGORIES.DINING,
    merchant: null,
    reward: {
      direct_swipe_percentage: 1.0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: ICICI_AMAZON_PAY_VALID_FROM,
    valid_until: null,
    notes: "Generic offline restaurant / café swipe — ICICI base 1%.",
    is_active: true,
  },
  {
    _id: "rule_amex_dining_others",
    cardId: AMEX_MRCC_ID,
    category: CATEGORIES.DINING,
    merchant: null,
    reward: {
      direct_swipe_percentage: 2.0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: AMEX_MRCC_VALID_FROM,
    valid_until: null,
    notes: "Generic offline restaurant / café swipe — Amex base 2pts/₹100.",
    is_active: true,
  },

  // ==========================================================================
  // Online Shopping — partner_merchant rules (shared-cap accelerators)
  // ==========================================================================

  // HDFC LIFESTYLE_5X pool — Marks & Spencer / Myntra / Nykaa family / Reliance
  // Digital share 5,000 pts/month combined.
  hdfcLifestyle5X(
    "rule_regalia_online_p_marks_and_spencer",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.MARKS_AND_SPENCER,
    5.0,
  ),
  hdfcLifestyle5X(
    "rule_regalia_online_p_myntra",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.MYNTRA,
    0,
    { monthlyPurchaseLimitInr: 10000 },
  ),
  hdfcLifestyle5X(
    "rule_regalia_online_p_nykaa",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.NYKAA,
    2.5,
  ),
  hdfcLifestyle5X(
    "rule_regalia_online_p_nykaa_fashion",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.NYKAA_FASHION,
    0,
  ),
  hdfcLifestyle5X(
    "rule_regalia_online_p_nykaa_man",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.NYKAA_MAN,
    0,
  ),
  hdfcLifestyle5X(
    "rule_regalia_online_p_reliance_digital",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.RELIANCE_DIGITAL,
    0,
  ),

  // SBI — Myntra is the only explicit 10X online partner; everything else
  // routes through the "Other Online Spends" base rule below. Both share the
  // existing 10,000 pts/month SBI_10X pool with travel + dining.
  sbi10XOnline(
    "rule_sbi_online_p_myntra",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.MYNTRA,
    2.0,
  ),
  sbi5XBase(
    "rule_sbi_online_b_other",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.OTHER_ONLINE_SPENDS,
    0,
  ),

  // ICICI Amazon Pay partners — three standalone tiers, no shared cap.
  iciciPartner2(
    "rule_icici_online_p_amazon_pay_partners",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_PAY_PARTNERS,
    0,
  ),
  iciciPartner3(
    "rule_icici_online_p_amazon_non_prime",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_IN_NON_PRIME,
    0,
  ),
  iciciPartner5(
    "rule_icici_online_p_amazon_prime",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_IN_PRIME,
    0,
  ),

  // Amex 5X Amazon family — AMEX_5X_AMZ pool, 250 pts/month combined cap.
  amex5XAmazon(
    "rule_amex_online_p_amazon",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON,
    0,
    { convenienceFeePercentage: 1.77, monthlyPurchaseLimitInr: 10000 },
  ),
  amex5XAmazon(
    "rule_amex_online_p_amazon_fresh",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_FRESH,
    0,
    { monthlyPurchaseLimitInr: 10000 },
  ),
  amex5XAmazon(
    "rule_amex_online_p_amazon_prime",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_PRIME,
    10.0,
  ),
  amex5XAmazon(
    "rule_amex_online_p_amazon_prime_12m",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_PRIME_12_MONTHS,
    10.0,
  ),
  amex5XAmazon(
    "rule_amex_online_p_amazon_prime_3m",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_PRIME_3_MONTHS,
    10.0,
  ),
  amex5XAmazon(
    "rule_amex_online_p_amazon_prime_lite",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_PRIME_LITE,
    10.0,
  ),
  amex5XAmazon(
    "rule_amex_online_p_amazon_shopping",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_SHOPPING,
    2.75,
    { convenienceFeePercentage: 1.77, monthlyPurchaseLimitInr: 10000 },
  ),

  // Amex 10X Flipkart — AMEX_10X_FUB pool, 500 pts/month combined cap.
  amex10XFlipkart(
    "rule_amex_online_p_flipkart",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.FLIPKART,
    0,
  ),

  // ==========================================================================
  // Online Shopping — voucher rules (per card)
  // ==========================================================================

  // HDFC 5X-direct voucher rows (without overrides).
  ...onlineVoucherRules("regalia5x", HDFC_ONLINE_5X_VOUCHERS, regalia5XOnline),
  // HDFC 5X-direct voucher rows with conv fee / purchase limit (inline).
  regalia5XOnline(
    "rule_regalia5x_online_v_amazon",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON,
    0,
    { convenienceFeePercentage: 4.13 },
  ),
  regalia5XOnline(
    "rule_regalia5x_online_v_amazon_shopping",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_SHOPPING,
    0,
    { convenienceFeePercentage: 4.13 },
  ),
  regalia5XOnline(
    "rule_regalia5x_online_v_flipkart",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.FLIPKART,
    0,
    { convenienceFeePercentage: 2.95, monthlyPurchaseLimitInr: 10000 },
  ),
  // HDFC 1X-direct voucher rows (Amazon Prime / Big Basket / Blinkit /
  // Reliance Jio Mart / Zepto — no 5X portal on these MCCs).
  ...onlineVoucherRules(
    "regalia1x",
    HDFC_ONLINE_1X_VOUCHERS,
    regaliaVoucher,
  ),

  // Axis ACE — all online voucher rows at 1.5% direct + 1.5% voucher reward.
  ...onlineVoucherRules("ace", ACE_ONLINE_VOUCHERS, aceOnlineVoucher),

  // SBI 10X-direct online vouchers and 1X-direct (grocery/quick-commerce) ones.
  ...onlineVoucherRules("sbi_high", SBI_ONLINE_HIGH_VOUCHERS, sbiVoucher),
  ...onlineVoucherRules(
    "sbi_low",
    SBI_ONLINE_LOW_VOUCHERS,
    sbiDiningLowDirect,
  ),

  // ICICI 5X-direct vouchers — no overrides for these merchants.
  ...onlineVoucherRules("icici5x", ICICI_ONLINE_5X_VOUCHERS, iciciAmazon5X),
  // ICICI 5X-direct vouchers with monthly purchase limit (₹2K grocery / ₹30K Tata Cliq).
  iciciAmazon5X(
    "rule_icici5x_online_v_big_basket",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.BIG_BASKET,
    0,
    { monthlyPurchaseLimitInr: 2000 },
  ),
  iciciAmazon5X(
    "rule_icici5x_online_v_blinkit",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.BLINKIT,
    0,
    { monthlyPurchaseLimitInr: 2000 },
  ),
  iciciAmazon5X(
    "rule_icici5x_online_v_tata_cliq",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.TATA_CLIQ,
    0,
    { monthlyPurchaseLimitInr: 30000 },
  ),
  iciciAmazon5X(
    "rule_icici5x_online_v_tata_cliq_luxury",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.TATA_CLIQ_LUXURY,
    0,
    { monthlyPurchaseLimitInr: 30000 },
  ),
  // ICICI 5X-direct vouchers with conv-fee + ₹12K purchase limit (Amazon family).
  iciciAmazon5X(
    "rule_icici5x_online_v_amazon",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON,
    0,
    { convenienceFeePercentage: 2.95, monthlyPurchaseLimitInr: 12000 },
  ),
  iciciAmazon5X(
    "rule_icici5x_online_v_amazon_fresh",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_FRESH,
    0,
    { convenienceFeePercentage: 2.95, monthlyPurchaseLimitInr: 12000 },
  ),
  iciciAmazon5X(
    "rule_icici5x_online_v_amazon_shopping",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_SHOPPING,
    0,
    { convenienceFeePercentage: 2.95, monthlyPurchaseLimitInr: 12000 },
  ),
  // ICICI 1X-direct vouchers (Marks & Spencer / Jio Mart — no overrides).
  ...onlineVoucherRules("icici1x", ICICI_ONLINE_1X_VOUCHERS, iciciAmazonVoucher),
  // ICICI 1X-direct vouchers with conv-fee + ₹12K purchase limit.
  iciciAmazonVoucher(
    "rule_icici1x_online_v_amazon_prime",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_PRIME,
    0,
    { convenienceFeePercentage: 2.95, monthlyPurchaseLimitInr: 12000 },
  ),
  iciciAmazonVoucher(
    "rule_icici1x_online_v_amazon_prime_lite",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.AMAZON_PRIME_LITE,
    0,
    { convenienceFeePercentage: 2.95, monthlyPurchaseLimitInr: 12000 },
  ),
  iciciAmazonVoucher(
    "rule_icici1x_online_v_flipkart",
    CATEGORIES.ONLINE_SHOPPING,
    MERCHANTS.FLIPKART,
    0,
    { convenienceFeePercentage: 2.95, monthlyPurchaseLimitInr: 12000 },
  ),

  // Amex — all non-Amazon/non-Flipkart online vouchers at 2%/4%.
  ...onlineVoucherRules("amex", AMEX_ONLINE_VOUCHERS, amexMrccVoucher),

  // ==========================================================================
  // Utility Bills — partner_merchant, voucher_available, base, exclusion rules
  // ==========================================================================

  // HDFC Regalia Gold — Reliance My Jio Store voucher (5X = 6.67% direct +
  // 6.5% voucher reward). Exclusion below documents the >₹50K surcharge.
  regalia5XOnline(
    "rule_regalia_utility_v_reliance_my_jio_store",
    CATEGORIES.UTILITIES,
    MERCHANTS.RELIANCE_MY_JIO_STORE,
    0,
  ),
  {
    _id: "rule_regalia_utility_excl_high_txn",
    cardId: HDFC_REGALIA_GOLD_ID,
    category: CATEGORIES.UTILITIES,
    merchant: null,
    reward: {
      direct_swipe_percentage: 0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: new Date("2024-08-01"),
    valid_until: null,
    notes:
      "HDFC charges 1% fee on utility transactions above ₹50,000 (documentation; engine doesn't model surcharges).",
    is_active: true,
  },

  // Axis ACE — Google Pay Bills 5% (Android only) joins the ACE_ACCEL pool;
  // non-GPay utility falls back to ACE base 1.5%.
  aceGPay5X(
    "rule_ace_utility_p_gpay_bills",
    CATEGORIES.UTILITIES,
    MERCHANTS.GOOGLE_PAY_BILLS,
    0,
  ),
  {
    _id: "rule_ace_utility_b_others",
    cardId: AXIS_ACE_ID,
    category: CATEGORIES.UTILITIES,
    merchant: MERCHANTS.UTILITY_OTHERS,
    reward: {
      direct_swipe_percentage: 1.5,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: new Date("2024-04-20"),
    valid_until: null,
    notes: "Non-GPay utility falls to ACE base 1.5% cashback.",
    is_active: true,
  },

  // SBI SimplyCLICK — utility merchants (Airtel Xstream / HP Pay / Reliance
  // My Jio Store) plus a base rule for everything else.
  sbiVoucher(
    "rule_sbi_utility_v_airtel_xstream",
    CATEGORIES.UTILITIES,
    MERCHANTS.AIRTEL_XSTREAM,
    0,
  ),
  sbiDiningLowDirect(
    "rule_sbi_utility_v_hp_pay",
    CATEGORIES.UTILITIES,
    MERCHANTS.HP_PAY,
    2.0,
  ),
  sbiDiningLowDirect(
    "rule_sbi_utility_v_reliance_my_jio_store",
    CATEGORIES.UTILITIES,
    MERCHANTS.RELIANCE_MY_JIO_STORE,
    1.0,
  ),
  {
    _id: "rule_sbi_utility_b_others",
    cardId: SBI_SIMPLYCLICK_ID,
    category: CATEGORIES.UTILITIES,
    merchant: MERCHANTS.UTILITY_OTHERS,
    reward: {
      direct_swipe_percentage: 0.25,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: SBI_SIMPLYCLICK_VALID_FROM,
    valid_until: null,
    notes:
      "SBI SimplyCLICK has no utility accelerator — base 1pt/₹100 = 0.25%. Utility MCCs 4900,4811,4816,4899.",
    is_active: true,
  },

  // ICICI Amazon Pay — utility via Amazon app 2%; GAS 1%; everything else 0%.
  iciciPartner2(
    "rule_icici_utility_p_amazon",
    CATEGORIES.UTILITIES,
    MERCHANTS.UTILITIES_AMAZON,
    0,
  ),
  iciciAmazonVoucher(
    "rule_icici_utility_v_gas",
    CATEGORIES.UTILITIES,
    MERCHANTS.GAS,
    0,
  ),
  {
    _id: "rule_icici_utility_excl_non_amazon",
    cardId: ICICI_AMAZON_PAY_ID,
    category: CATEGORIES.UTILITIES,
    merchant: null,
    reward: {
      direct_swipe_percentage: 0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: new Date("2025-10-11"),
    valid_until: null,
    notes:
      "Non-Amazon utility earns 0% on ICICI Amazon Pay (documentation; engine still applies base 1% fallback).",
    is_active: true,
  },

  // Amex MRCC — utility base earns 2pts/₹100 (= 1% direct equivalent? No,
  // Amex says 2X = 2pts/₹100 = ₹1/₹100 = 1% in INR but the data treats it as
  // 2% effective via direct_swipe_reward_pct. Following the data.) Voucher
  // path adds 4% reward. MCC 4900/4811/4899 (electricity/gas/water) excluded.
  {
    _id: "rule_amex_utility_b_others",
    cardId: AMEX_MRCC_ID,
    category: CATEGORIES.UTILITIES,
    merchant: MERCHANTS.UTILITY_OTHERS,
    reward: {
      direct_swipe_percentage: 2.0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 4.0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: AMEX_MRCC_VALID_FROM,
    valid_until: null,
    notes:
      "Mobile recharge / broadband / DTH / postpaid earn base 2pts/₹100; voucher path adds 4% reward. Electricity/gas/water (MCC 4900,4811,4899) excluded — see exclusion rule.",
    is_active: true,
  },
  {
    _id: "rule_amex_utility_excl_mcc",
    cardId: AMEX_MRCC_ID,
    category: CATEGORIES.UTILITIES,
    merchant: null,
    reward: {
      direct_swipe_percentage: 0,
      voucher_discount_percentage: 0,
      voucher_reward_percentage: 0,
      convenience_fee_percentage: 0,
    },
    caps: {
      reward_cap: null,
      voucher_monthly_purchase_limit_inr: null,
      max_voucher_size_inr: null,
      vouchers_per_booking: null,
    },
    shared_cap_group: null,
    valid_from: new Date("2015-03-01"),
    valid_until: null,
    notes:
      "Amex excludes MCC 4900 (electricity), 4811 (telecom long-dist), 4899 (cable/satellite) from rewards (documentation).",
    is_active: true,
  },

  // ==========================================================================
  // Fuel — all 5 cards exclude generic fuel; SBI BPCL voucher is the only
  // earning merchant. HDFC/Amex carry a net negative effective rate per data,
  // captured as exclusion (engine treats as 0%).
  // ==========================================================================
  exclusionDocRule(
    "rule_regalia_fuel_excl",
    HDFC_REGALIA_GOLD_ID,
    CATEGORIES.FUEL,
    new Date("2024-08-01"),
    "HDFC fuel: 1% surcharge × 1.18 GST = -0.85% net after base earn of 0.33%. ≤₹15K transactions only; >₹15K incur full 1% fee. Treated as excluded for reward computation.",
  ),
  exclusionDocRule(
    "rule_ace_fuel_excl",
    AXIS_ACE_ID,
    CATEGORIES.FUEL,
    ACE_VALID_FROM,
    "Axis ACE: no fuel cashback. 1% surcharge waiver between ₹400-₹4,000.",
  ),
  sbiFuelVoucher(
    "rule_sbi_fuel_v_bpcl_smartdrive",
    CATEGORIES.FUEL,
    MERCHANTS.BPCL_SMARTDRIVE,
    0,
  ),
  exclusionDocRule(
    "rule_sbi_fuel_excl",
    SBI_SIMPLYCLICK_ID,
    CATEGORIES.FUEL,
    SBI_SIMPLYCLICK_VALID_FROM,
    "SBI fuel: MCC 5541/5542/5172/5983 excluded from base earn. Surcharge waiver ₹500-₹3,000. BPCL SmartDrive voucher still earns 2.5%.",
  ),
  exclusionDocRule(
    "rule_icici_fuel_excl",
    ICICI_AMAZON_PAY_ID,
    CATEGORIES.FUEL,
    new Date("2025-10-11"),
    "ICICI fuel: no cashback. Surcharge waiver available.",
  ),
  exclusionDocRule(
    "rule_amex_fuel_excl",
    AMEX_MRCC_ID,
    CATEGORIES.FUEL,
    new Date("2025-06-12"),
    "Amex fuel: no MR points from Jun 12 2025. 1% surcharge + 18% GST = 1.18% net cost (engine treats earn as 0%).",
  ),

  // ==========================================================================
  // Rent — HDFC/Axis/SBI/ICICI fully exclude (MCC 6513). Amex has myHQ /
  // Rentomojo vouchers; CRED/PayTM/Cheq rent payments excluded.
  // ==========================================================================
  exclusionDocRule(
    "rule_regalia_rent_excl",
    HDFC_REGALIA_GOLD_ID,
    CATEGORIES.RENT,
    new Date("2024-08-01"),
    "HDFC rent: MCC 6513 excluded + 1% fee from Aug 2024.",
  ),
  exclusionDocRule(
    "rule_ace_rent_excl",
    AXIS_ACE_ID,
    CATEGORIES.RENT,
    ACE_VALID_FROM,
    "Axis ACE rent: MCC 6513 excluded.",
  ),
  exclusionDocRule(
    "rule_sbi_rent_excl",
    SBI_SIMPLYCLICK_ID,
    CATEGORIES.RENT,
    new Date("2024-04-01"),
    "SBI rent: excluded from Apr 2024.",
  ),
  exclusionDocRule(
    "rule_icici_rent_excl",
    ICICI_AMAZON_PAY_ID,
    CATEGORIES.RENT,
    new Date("2025-10-11"),
    "ICICI rent: MCC 6513 excluded from Oct 11 2025.",
  ),
  amexMrccVoucher(
    "rule_amex_rent_v_myhq",
    CATEGORIES.RENT,
    MERCHANTS.MYHQ,
    0,
  ),
  amexMrccVoucher(
    "rule_amex_rent_v_rentomojo",
    CATEGORIES.RENT,
    MERCHANTS.RENTOMOJO,
    3.1,
  ),
  exclusionDocRule(
    "rule_amex_rent_excl",
    AMEX_MRCC_ID,
    CATEGORIES.RENT,
    AMEX_MRCC_VALID_FROM,
    "Amex rent via CRED/PayTM/Cheq (MCC 6513) earns no MR points per T&Cs. Specific platforms (myHQ, Rentomojo) still earn.",
  ),

  // ==========================================================================
  // Insurance — HDFC/SBI/ICICI earn base rate; Axis ACE and Amex exclude
  // (MCC 6300, 5960). SBI additionally has a FinuSmart Suraksha voucher.
  // ==========================================================================
  baseDocRule(
    "rule_regalia_insurance_base",
    HDFC_REGALIA_GOLD_ID,
    CATEGORIES.INSURANCE,
    1.33,
    REGALIA_VALID_FROM,
    "HDFC insurance: earns base 2.6667pts/₹100 = 1.33%; not excluded.",
  ),
  exclusionDocRule(
    "rule_ace_insurance_excl",
    AXIS_ACE_ID,
    CATEGORIES.INSURANCE,
    ACE_VALID_FROM,
    "Axis ACE insurance: MCC 6300, 5960 excluded.",
  ),
  baseDocRule(
    "rule_sbi_insurance_base",
    SBI_SIMPLYCLICK_ID,
    CATEGORIES.INSURANCE,
    0.25,
    SBI_SIMPLYCLICK_VALID_FROM,
    "SBI insurance: base 1pt/₹100 offline = 0.25%; not explicitly excluded.",
  ),
  sbiDiningLowDirect(
    "rule_sbi_insurance_v_finusmart_suraksha",
    CATEGORIES.INSURANCE,
    MERCHANTS.FINUSMART_SURAKSHA,
    0,
  ),
  baseDocRule(
    "rule_icici_insurance_base",
    ICICI_AMAZON_PAY_ID,
    CATEGORIES.INSURANCE,
    1.0,
    new Date("2025-10-11"),
    "ICICI insurance: base 1% cashback on premium payments.",
  ),
  exclusionDocRule(
    "rule_amex_insurance_excl",
    AMEX_MRCC_ID,
    CATEGORIES.INSURANCE,
    new Date("2015-03-01"),
    "Amex insurance: MCC 6300, 5960 excluded.",
  ),

  // ==========================================================================
  // Fees & Taxes — HDFC / Axis / Amex earn base; SBI and ICICI exclude govt
  // MCCs (9311/9399/9222). SBI Cleartax voucher still earns 2.5%.
  // ==========================================================================
  baseDocRule(
    "rule_regalia_feestaxes_base",
    HDFC_REGALIA_GOLD_ID,
    CATEGORIES.FEES_TAXES,
    1.33,
    REGALIA_VALID_FROM,
    "HDFC fees/taxes: base rate on govt/tax/school fee payments. 3P payment apps may incur 1% fee from Aug 2024.",
  ),
  baseDocRule(
    "rule_ace_feestaxes_base",
    AXIS_ACE_ID,
    CATEGORIES.FEES_TAXES,
    1.5,
    new Date("2024-04-20"),
    "Axis ACE fees/taxes: base 1.5%. Govt MCC 9311/9399/9222 not explicitly excluded.",
  ),
  sbiDiningLowDirect(
    "rule_sbi_feestaxes_v_cleartax",
    CATEGORIES.FEES_TAXES,
    MERCHANTS.CLEARTAX,
    0,
  ),
  exclusionDocRule(
    "rule_sbi_feestaxes_excl",
    SBI_SIMPLYCLICK_ID,
    CATEGORIES.FEES_TAXES,
    new Date("2024-06-01"),
    "SBI fees/taxes: govt MCC 9311/9399/9222 excluded from Jun 2024. Cleartax voucher still earns 2.5%.",
  ),
  exclusionDocRule(
    "rule_icici_feestaxes_excl",
    ICICI_AMAZON_PAY_ID,
    CATEGORIES.FEES_TAXES,
    new Date("2025-10-11"),
    "ICICI fees/taxes: tax MCC 9311 excluded from Oct 11 2025. Other govt spend earns 1% base.",
  ),
  baseDocRule(
    "rule_amex_feestaxes_base",
    AMEX_MRCC_ID,
    CATEGORIES.FEES_TAXES,
    2.0,
    AMEX_MRCC_VALID_FROM,
    "Amex fees/taxes: base 2pts/₹100 = 2%. Govt MCC not specifically excluded.",
  ),

  // ==========================================================================
  // Offline Shopping — voucher_available + base rules per card
  // ==========================================================================

  // HDFC Regalia Gold — Crossword on 5X portal (6.67% direct + 6.5% voucher),
  // Puma at base (1.33% direct + 6.5% voucher).
  regalia5XOnline(
    "rule_regalia_offline_v_crossword",
    CATEGORIES.OFFLINE_SHOPPING,
    MERCHANTS.CROSSWORD,
    1.0,
  ),
  regaliaVoucher(
    "rule_regalia_offline_v_puma",
    CATEGORIES.OFFLINE_SHOPPING,
    MERCHANTS.PUMA,
    2.5,
  ),
  baseDocRule(
    "rule_regalia_offline_base",
    HDFC_REGALIA_GOLD_ID,
    CATEGORIES.OFFLINE_SHOPPING,
    1.33,
    REGALIA_VALID_FROM,
    "Base rate on all offline retail swipes. Grocery offline: 2.6667pts (2000pt cap).",
  ),

  // Axis ACE — no offline accelerator; base 1.5% cashback only.
  baseDocRule(
    "rule_ace_offline_base",
    AXIS_ACE_ID,
    CATEGORIES.OFFLINE_SHOPPING,
    1.5,
    new Date("2024-04-20"),
    "Base 1.5% cashback on offline retail. No offline shopping accelerator on ACE.",
  ),

  // SBI SimplyCLICK — Harper's Bazaar India voucher (2.5%/2.5%); base 0.25%.
  sbiVoucher(
    "rule_sbi_offline_v_harpers_bazaar_india",
    CATEGORIES.OFFLINE_SHOPPING,
    MERCHANTS.HARPERS_BAZAAR_INDIA,
    0,
  ),
  baseDocRule(
    "rule_sbi_offline_base",
    SBI_SIMPLYCLICK_ID,
    CATEGORIES.OFFLINE_SHOPPING,
    0.25,
    SBI_SIMPLYCLICK_VALID_FROM,
    "Base 1pt/₹100 offline. SimplyCLICK accelerators are online only.",
  ),

  // ICICI Amazon Pay — Woggles voucher (1%/1%); base 1% cashback.
  iciciAmazonVoucher(
    "rule_icici_offline_v_woggles",
    CATEGORIES.OFFLINE_SHOPPING,
    MERCHANTS.WOGGLES,
    0,
  ),
  baseDocRule(
    "rule_icici_offline_base",
    ICICI_AMAZON_PAY_ID,
    CATEGORIES.OFFLINE_SHOPPING,
    1.0,
    new Date("2025-10-11"),
    "Base 1% cashback on offline retail. No offline accelerator on Amazon Pay card.",
  ),

  // Amex MRCC — Crossword voucher (2%/4% with 1.1% discount); base 2pts/₹100.
  amexMrccVoucher(
    "rule_amex_offline_v_crossword",
    CATEGORIES.OFFLINE_SHOPPING,
    MERCHANTS.CROSSWORD,
    1.1,
  ),
  baseDocRule(
    "rule_amex_offline_base",
    AMEX_MRCC_ID,
    CATEGORIES.OFFLINE_SHOPPING,
    2.0,
    AMEX_MRCC_VALID_FROM,
    "Base 2pts/₹100 on offline retail. Amex accelerators are all online-only.",
  ),
];
