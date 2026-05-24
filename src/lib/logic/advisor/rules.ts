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
      convenience_fee_percentage: 0,
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
];
