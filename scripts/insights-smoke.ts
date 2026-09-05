// Smoke-test the insights feed against live card data.
//   npx tsx --env-file=.env.local scripts/insights-smoke.ts
//
// Prints the ranked feed plus any narrative-guardrail warnings, so a data or
// ledger change that flattens the demo shows up here rather than on stage.
import mongoose from "mongoose";
import { buildInsights } from "../src/lib/insights/insightEngine";
import { getWallet, getLedger, getEntitlements, verifyLedger } from "../src/lib/insights/mockLedger";

async function main(){
  const r = await buildInsights(getWallet(), getLedger(), getEntitlements(), verifyLedger());
  console.log("generatedAt:", r.generatedAt);
  console.log("cards:", r.cards.map(c=>`${c.name}${c.isActive?"":" [INACTIVE]"}`).join(" | "));
  console.log("warnings:", r.warnings.length? r.warnings : "none");
  console.log("TOTAL AT RISK: ₹" + r.totalAtRiskInr.toLocaleString("en-IN"));
  console.log("\n--- FEED (" + r.insights.length + ") ---");
  for (const i of r.insights) {
    console.log(`\n[${i.urgency.toUpperCase()}] ${i.kind} · ${i.cardName} · ${i.daysRemaining}d · score ${i.score.toFixed(1)}`);
    console.log("  " + i.title);
    console.log("  " + i.detail);
    console.log("  → " + i.action + (i.progressLabel? `   (${i.progressLabel})`:""));
  }
  await mongoose.disconnect();
}
main().catch(e=>{console.error("ERR",e); process.exit(1);});
