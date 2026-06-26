// Admin CRUD validation for advisor cards and rules. Shape mirrors MockCard /
// MockRule so the docs in Mongo can be consumed by the engines unchanged.

import z from "zod";

const CATEGORY_VALUES = [
  "flights",
  "hotels",
  "forex",
  "dining",
  "fuel",
  "grocery",
  "online_shopping",
  "offline_shopping",
  "utilities",
  "other",
  "rent",
  "insurance",
  "fees_taxes",
] as const;

const NETWORK_VALUES = [
  "visa",
  "mastercard",
  "amex",
  "rupay",
  "diners",
] as const;

const REWARD_TYPE_VALUES = ["points", "cashback", "miles"] as const;
const WELCOME_BENEFIT_TYPE_VALUES = ["points", "voucher", "cashback", "miles"] as const;
const LOUNGE_PROGRAM_VALUES = ["issuer", "priority_pass", "dreamfolks", "loungekey"] as const;
const CAP_PERIOD_VALUES = ["daily", "monthly", "quarterly", "annually"] as const;
const CAP_METRIC_VALUES = ["points", "inr", "cashback"] as const;
const CAP_SCOPE_VALUES = ["merchant", "category", "card"] as const;

const loungeAccessSchema = z.object({
  visitsPerPeriod: z.number().nonnegative(),
  period: z.enum(["quarter", "year"]),
  annualCap: z.number().nonnegative(),
  spendCondition: z
    .object({
      thresholdInr: z.number().nonnegative(),
      windowMonths: z.number().nonnegative(),
    })
    .nullable(),
  membershipRequired: z.string().nullable(),
  program: z.enum(LOUNGE_PROGRAM_VALUES),
  display: z.string(),
});

export const cardCreateSchema = z.object({
  advisorKey: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  bankSlug: z.string().min(1),
  network: z.array(z.enum(NETWORK_VALUES)).default([]),
  eligibility: z.object({
    min_salary_inr: z.number().nonnegative(),
    min_self_employed_income_inr: z.number().nonnegative(),
    min_age: z.number().nonnegative(),
    max_age: z.number().nonnegative(),
  }),
  fees: z.object({
    joining_inr: z.number().nonnegative(),
    joining_gst_inr: z.number().nonnegative(),
    annual_inr: z.number().nonnegative(),
    annual_gst_inr: z.number().nonnegative(),
    waiver_spend_inr: z.number().nonnegative(),
    joining_waiver_spend_inr: z.number().nonnegative(),
    is_lifetime_free: z.boolean(),
  }),
  forex_markup_percentage: z.number().nonnegative(),
  rewards: z.object({
    base_reward_rate: z.number().nonnegative(),
    point_value_inr: z.number().nonnegative(),
    points_expiry_months: z.number().nonnegative().nullable(),
    reward_type: z.enum(REWARD_TYPE_VALUES),
  }),
  categories: z.array(z.enum(CATEGORY_VALUES)).default([]),
  welcome_benefit: z
    .object({
      type: z.enum(WELCOME_BENEFIT_TYPE_VALUES),
      value_inr: z.number().nonnegative(),
      condition: z.string(),
      expires_in_months: z.number().nonnegative(),
      display: z.string(),
    })
    .nullable(),
  lounge: z.object({
    domestic: loungeAccessSchema.nullable(),
    international: loungeAccessSchema.nullable(),
  }),
  ideal_for: z.array(z.string()).default([]),
  not_ideal_for: z.array(z.string()).default([]),
  is_active: z.boolean(),
  excluded_categories: z.array(z.enum(CATEGORY_VALUES)).default([]),
});

// PUT accepts the same shape minus advisorKey (which is the path param).
export const cardUpdateSchema = cardCreateSchema.omit({ advisorKey: true }).partial();

const sharedCapGroupSchema = z
  .object({
    multiplier: z.number().nullable().optional(),
    merchant: z.string().nullable().optional(),
    capType: z.enum(["combined", "standalone"]),
  })
  .nullable()
  .default(null);

const rewardCapSchema = z
  .object({
    period: z.enum(CAP_PERIOD_VALUES),
    metric: z.enum(CAP_METRIC_VALUES),
    value: z.number().nonnegative(),
    scope: z.enum(CAP_SCOPE_VALUES),
  })
  .nullable();

const directSwipeScheduleSchema = z
  .object({
    mode: z.enum(["marginal", "whole"]),
    period: z.enum(CAP_PERIOD_VALUES),
    tiers: z
      .array(
        z.object({
          min_spend_per_period_inr: z.number().nonnegative(),
          rate: z.number(),
        }),
      )
      .min(1),
  })
  .nullable()
  .optional();

export const ruleCreateSchema = z.object({
  ruleKey: z.string().min(1),
  cardAdvisorKey: z.string().min(1),
  category: z.enum(CATEGORY_VALUES),
  merchant: z.string().nullable(),
  reward: z.object({
    direct_swipe_percentage: z.number().nonnegative(),
    direct_swipe_schedule: directSwipeScheduleSchema,
    voucher_discount_percentage: z.number().nonnegative(),
    voucher_reward_percentage: z.number().nonnegative(),
    convenience_fee_percentage: z.number().nonnegative(),
  }),
  caps: z.object({
    reward_cap: rewardCapSchema,
    voucher_monthly_purchase_limit_inr: z.number().nonnegative().nullable(),
    max_voucher_size_inr: z.number().nonnegative().nullable(),
    vouchers_per_booking: z.number().nonnegative().nullable(),
  }),
  shared_cap_group: sharedCapGroupSchema,
  valid_from: z.coerce.date(),
  valid_until: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  is_active: z.boolean(),
});

export const ruleUpdateSchema = ruleCreateSchema.omit({ ruleKey: true }).partial();
