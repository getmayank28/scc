// Dump full ranked card lists for each engine flow, for before/after regression
// diffing. Deterministic ordering. Usage: npx tsx --env-file=.env.local
// scripts/regression-snapshot.ts > /tmp/snap.txt
import mongoose from "mongoose";
import { AdvisorCache } from "../src/lib/advisor/cache";
import { recommendTravelCardAdvanced } from "../src/lib/logic/advisor/engine";
import { recommendShoppingCardPhaseTwo } from "../src/lib/logic/advisor/shoppingCardEngine";
import { recommendFoodCardPhaseTwo } from "../src/lib/logic/advisor/foodCardEngine";
import { recommendAllRounderCardPhaseTwo } from "../src/lib/logic/advisor/allrounderEngine";

function dump(label: string, rows: { id: string; net: number }[]) {
  const sorted = [...rows].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
  for (const r of sorted) console.log(`${label}\t${r.id}\t${r.net.toFixed(4)}`);
}

async function main() {
  await AdvisorCache.ensureFresh();
  const cards = AdvisorCache.cards();
  const bestOf = AdvisorCache.bestOf();
  const rules = AdvisorCache.rules();

  const travel = recommendTravelCardAdvanced(
    {
      tripsPerYear: 5,
      avgSpendPerTrip: 20000,
      totalInternationalTrip: 1,
      avgInternationalSpendPerTrip: 60000,
      additionalFlightSpend: 0,
      travelPriority: ["maximumRewards"],
    },
    cards,
    bestOf,
  );
  dump(
    "travel",
    travel.byCard.map((c) => ({ id: c.cardId, net: c.netReturnInr })),
  );

  const shopping = recommendShoppingCardPhaseTwo(
    {
      monthlySpend: 30000,
      preferredOnlinePlatform: ["amazon"],
      totalOnlineShoppingMonthlySpend: 18000,
      additionalUtilityBills: true,
      additionalUtilityBillsMonthlySpend: 5000,
    },
    cards,
    bestOf,
    rules,
  );
  dump(
    "shopping",
    shopping.byCard.map((c) => ({ id: c.cardId, net: c.annualReturnInr })),
  );

  const food = recommendFoodCardPhaseTwo(
    {
      onlineFoodDeliveryFrequency: 12,
      diningOutFrequency: 4,
      onlineFoodDeliveryAverageSpend: 600,
      diningOutAverageSpend: 1500,
      foodDeliveryPlatformPreference: "swiggy",
      diningOutPlatformPreference: "swiggy_dineout",
    },
    cards,
    bestOf,
    rules,
  );
  dump(
    "food",
    food.byCard.map((c) => ({ id: c.cardId, net: c.annualReturnInr })),
  );

  const all = recommendAllRounderCardPhaseTwo(
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
    cards,
    bestOf,
    rules,
  );
  dump(
    "allrounder",
    all.byCard.map((c) => ({ id: c.cardId, net: c.annualReturnInr })),
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("snapshot failed:", err);
  process.exit(1);
});
