import z from "zod";

// Reject NaN/Infinity early so the engines don't have to defend against them.
const nonNegativeNumber = z
  .number()
  .finite("must be a finite number")
  .nonnegative("must be >= 0");

const positiveInt = z
  .number()
  .int("must be an integer")
  .nonnegative("must be >= 0");

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
});

export const foodRecommendPhaseOneInputSchema = z.object({
  onlineFoodDeliveryFrequency: nonNegativeNumber,
  diningOutFrequency: nonNegativeNumber,
  foodDeliveryPlatformPreference: z.enum(["swiggy", "zomato", "both", "none"]),
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
});
