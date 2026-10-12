// Smoke-test Phase 2 wiring without Next.js: load the cache from Atlas, run
// each engine with a sample input, print the top result.
//
//   npm run smoke:recommend

import mongoose from "mongoose";
import { AdvisorCache, ENGINE_CATEGORIES } from "../src/lib/advisor/cache";
import { recommendTravelCardAdvanced } from "../src/lib/logic/advisor/engine";
import { recommendShoppingCardPhaseTwo } from "../src/lib/logic/advisor/shoppingCardEngine";
import { recommendFoodCardPhaseTwo } from "../src/lib/logic/advisor/foodCardEngine";
import { recommendAllRounderCardPhaseTwo } from "../src/lib/logic/advisor/allrounderEngine";

async function main() {
  console.log("[smoke] hydrating cache from Atlas...");
  const t0 = Date.now();
  await AdvisorCache.ensureFresh();
  const tHydrate = Date.now() - t0;
  // This script exercises every engine, so it loads the union of their rule
  // categories once. Real requests load only the engine they need.
  const tRules = Date.now();
  const rules = await AdvisorCache.rulesForCategories([
    ...ENGINE_CATEGORIES.food,
    ...ENGINE_CATEGORIES.shopping,
    ...ENGINE_CATEGORIES.allrounder,
  ]);
  console.log(
    `[smoke] hydrate: ${tHydrate}ms  rules: ${Date.now() - tRules}ms  cards=${AdvisorCache.cards().length}  rules=${rules.length}  bestOf=${AdvisorCache.bestOf().length}`,
  );

  // Travel
  {
    const t = Date.now();
    const r = recommendTravelCardAdvanced(
      {
        tripsPerYear: 5,
        avgSpendPerTrip: 20000,
        totalInternationalTrip: 1,
        avgInternationalSpendPerTrip: 60000,
        additionalFlightSpend: 0,
        travelPriority: ["maximumRewards"],
      },
      AdvisorCache.cards(),
      AdvisorCache.bestOf(),
    );
    console.log(
      `[smoke] travel:     ${Date.now() - t}ms  best=${r.best?.cardName ?? "n/a"}  net=₹${Math.round(r.best?.netReturnInr ?? 0)}`,
    );
  }

  // Shopping
  {
    const t = Date.now();
    const r = recommendShoppingCardPhaseTwo(
      {
        monthlySpend: 30000,
        preferredOnlinePlatform: ["amazon"],
        totalOnlineShoppingMonthlySpend: 18000,
        additionalUtilityBills: true,
        additionalUtilityBillsMonthlySpend: 5000,
      },
      AdvisorCache.cards(),
      AdvisorCache.bestOf(),
      rules,
    );
    console.log(
      `[smoke] shopping:   ${Date.now() - t}ms  best=${r.best?.cardName ?? "n/a"}  net=₹${Math.round(r.best?.annualReturnInr ?? 0)}`,
    );
  }

  // Food
  {
    const t = Date.now();
    const r = recommendFoodCardPhaseTwo(
      {
        onlineFoodDeliveryFrequency: 12,
        diningOutFrequency: 4,
        onlineFoodDeliveryAverageSpend: 600,
        diningOutAverageSpend: 1500,
        foodDeliveryPlatformPreference: "swiggy",
        diningOutPlatformPreference: "swiggy_dineout",
      },
      AdvisorCache.cards(),
      AdvisorCache.bestOf(),
      rules,
    );
    console.log(
      `[smoke] food:       ${Date.now() - t}ms  best=${r.best?.cardName ?? "n/a"}  net=₹${Math.round(r.best?.annualReturnInr ?? 0)}`,
    );
  }

  // Allrounder
  {
    const t = Date.now();
    const r = recommendAllRounderCardPhaseTwo(
      {
        averageTotalMonthlySpend: 80000,
        averageOnlineMonthlySpend: 30000,
        annualTravelSpend: 100000,
        monthlyDining: 8000,
        monthlyBills: 5000,
        monthlyOnlineShopping: 15000,
        monthlyFuel: 3000,
        monthlyRentInsuranceFees: 25000,
      },
      AdvisorCache.cards(),
      AdvisorCache.bestOf(),
      rules,
    );
    console.log(
      `[smoke] allrounder: ${Date.now() - t}ms  best=${r.best?.cardName ?? "n/a"}  net=₹${Math.round(r.best?.annualReturnInr ?? 0)}`,
    );
  }

  // Second-run cache hit
  console.log("\n[smoke] second call (warm cache)...");
  const t2 = Date.now();
  await AdvisorCache.ensureFresh();
  console.log(`[smoke] ensureFresh (warm): ${Date.now() - t2}ms`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[smoke] failed:", err);
  process.exit(1);
});
