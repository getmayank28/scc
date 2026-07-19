import z from "zod";
import {
  EMPLOYMENT_TYPE_VALUES,
  INCOME_RANGE_VALUES,
} from "@/schemas/userInfoSchema";

// Reject NaN/Infinity early so the engines don't have to defend against them.
const nonNegativeNumber = z
  .number()
  .finite("must be a finite number")
  .nonnegative("must be >= 0");

const positiveInt = z
  .number()
  .int("must be an integer")
  .nonnegative("must be >= 0");

// Optional user profile for the eligibility filter (Step 1 of the scoring
// pipeline). Absent fields skip the income filter — fully backward compatible.
const profileFields = {
  employmentType: z.enum(EMPLOYMENT_TYPE_VALUES).optional(),
  salaryRange: z.enum(INCOME_RANGE_VALUES).optional(),
};

// ── Phase 1 schemas ─────────────────────────────────────────────────────────

export const travelRecommendPhaseOneInputSchema = z.object({
  tripsPerYear: positiveInt,
  travelMix: z.enum([
    "only_domestic",
    "mostly_domestic",
    "balanced",
    "mostly_international",
  ]),
  avgSpendPerTrip: nonNegativeNumber,
  ...profileFields,
});

export const shoppingRecommendPhaseOneInputSchema = z.object({
  monthlySpend: nonNegativeNumber,
  shoppingPreference: z.enum(["online", "equal", "offline"]),
  preferredOnlinePlatform: z
    .array(
      z.enum([
        "amazon",
        "flipkart",
        "myntra",
        "ajio",
        "nykaa",
        "tata_neu_cliq",
        "multiple_platform",
      ]),
    )
    .default([]),
  ...profileFields,
});

export const foodRecommendPhaseOneInputSchema = z.object({
  onlineFoodDeliveryFrequency: nonNegativeNumber,
  diningOutFrequency: nonNegativeNumber,
  foodDeliveryPlatformPreference: z.enum(["swiggy", "zomato", "both", "none"]),
  ...profileFields,
});

export const allrounderRecommendPhaseOneInputSchema = z.object({
  averageTotalMonthlySpend: nonNegativeNumber,
  averageOnlineMonthlySpend: nonNegativeNumber,
  mostSpendCategory: z
    .array(
      z.enum([
        "travel",
        "foodAndDining",
        "onlineShopping",
        "utilityBills",
        "fuel",
        "rentInsuranceFees",
      ]),
    )
    .default([]),
  ...profileFields,
});

// ── Phase 2 schemas ─────────────────────────────────────────────────────────

export const travelRecommendInputSchema = z.object({
  tripsPerYear: positiveInt,
  avgSpendPerTrip: nonNegativeNumber,
  totalInternationalTrip: positiveInt,
  avgInternationalSpendPerTrip: nonNegativeNumber,
  additionalFlightSpend: nonNegativeNumber,
  travelPriority: z
    .array(z.enum(["loungeAccess", "lowForex", "maximumRewards"]))
    .default([]),
  ...profileFields,
});

export const shoppingRecommendInputSchema = z.object({
  monthlySpend: nonNegativeNumber,
  preferredOnlinePlatform: z
    .array(
      z.enum([
        "amazon",
        "flipkart",
        "myntra",
        "ajio",
        "nykaa",
        "tata_neu_cliq",
        "multiple_platform",
      ]),
    )
    .default([]),
  totalOnlineShoppingMonthlySpend: nonNegativeNumber,
  additionalUtilityBills: z.boolean(),
  additionalUtilityBillsMonthlySpend: nonNegativeNumber,
  ...profileFields,
});

export const foodRecommendInputSchema = z.object({
  onlineFoodDeliveryFrequency: nonNegativeNumber,
  diningOutFrequency: nonNegativeNumber,
  onlineFoodDeliveryAverageSpend: nonNegativeNumber,
  diningOutAverageSpend: nonNegativeNumber,
  foodDeliveryPlatformPreference: z.enum(["swiggy", "zomato", "others"]),
  diningOutPlatformPreference: z.enum([
    "swiggy_dineout",
    "zomato_district",
    "eazydiner",
    "others",
  ]),
  ...profileFields,
});

export const allrounderRecommendInputSchema = z.object({
  averageTotalMonthlySpend: nonNegativeNumber,
  averageOnlineMonthlySpend: nonNegativeNumber,
  annualTravelSpend: nonNegativeNumber,
  monthlyDining: nonNegativeNumber,
  monthlyBills: nonNegativeNumber,
  monthlyOnlineShopping: nonNegativeNumber,
  monthlyFuel: nonNegativeNumber,
  monthlyRentInsuranceFees: nonNegativeNumber,
  ...profileFields,
});
