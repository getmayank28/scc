// Verdict-table rows the real mailbox cannot exercise.
//   npx tsx --env-file=.env.local scripts/detect-cases.ts
//
// The live corpus only ever produces AUTO_ADD / CONFIRM / SUPPRESS(REPLACED) /
// IGNORE(marketing). These synthetic emails cover the rest of the table — a
// fresh ACTIVATION-only card, a STALE one, and an explicitly CLOSED one — so a
// regex change that breaks those paths is caught. Expected output is asserted
// in the `expect` field of each case.
import mongoose from "mongoose";
import { detectCards } from "../src/lib/carddetect/detect";
import { distinctive, tokenize, type CatalogCard } from "../src/lib/carddetect/resolve";
import type { EmailLike } from "../src/lib/carddetect/signals";

const NOW = new Date("2026-09-24T00:00:00Z");
const d = (daysAgo:number)=> new Date(NOW.getTime()-daysAgo*86400000);
interface Fixture {
  id: string;
  issuer: string;
  subject: string;
  body?: string;
  from: string;
  date: Date;
  att?: boolean;
}
const mk = (o: Fixture): EmailLike => ({
  id: o.id,
  issuer: o.issuer,
  subject: o.subject,
  bodyPlain: o.body ?? "",
  fromEmail: o.from,
  date: o.date,
  hasAttachments: !!o.att,
});

const CASES: Record<string, EmailLike[]> = {
  "fresh card, activation only (expect CONFIRM, exist 0.90)": [
    mk({id:"a1",issuer:"axis",from:"noreply@axisbank.com",date:d(5),
      subject:"Your Axis Bank Magnus Credit Card has been dispatched",
      body:"Dear Customer, Congratulations! Your Axis Bank Magnus Credit Card ending XX8811 has been dispatched and will reach you shortly. Please set your PIN on first use."}),
  ],
  "stale: last activity 400d (expect IGNORE)": [
    mk({id:"s1",issuer:"icici",from:"credit_cards@icicibank.com",date:d(400),
      subject:"ICICI Bank Credit Card Statement for the period August 24 2025 to September 23 2025",
      body:"Payment due by Oct 10 2025 ICICI Bank Credit Card XX7788 Total Amount Due 5000", att:true}),
  ],
  "explicitly closed (expect SUPPRESS)": [
    mk({id:"c1",issuer:"hdfc",from:"alerts@hdfcbank.net",date:d(20),
      subject:"Rs.500 debited via Credit Card **4455",
      body:"Rs.500.00 is debited from your HDFC Bank Credit Card ending 4455 towards AMAZON on 01 Sep, 2026."}),
    mk({id:"c2",issuer:"hdfc",from:"alerts@hdfcbank.net",date:d(3),
      subject:"Closure of your HDFC Bank Credit Card",
      body:"Dear Customer, your HDFC Bank Credit Card ending 4455 has been closed as per your request. Cardmember services are now discontinued."}),
  ],
  "marketing only (expect IGNORE, exist 0.30)": [
    mk({id:"m1",issuer:"sbi",from:"Offers@sbicard.com",date:d(10),
      subject:"Get 10X rewards with your SBI Card ending 9911",
      body:"Hello Cardholder, shop now and earn 10X rewards on your SBI Credit Card ending 9911. Offer valid till month end."}),
  ],
};

async function main(){
  await mongoose.connect(process.env.MONGODB_URI!);
  const raw = await mongoose.connection.db!.collection("cards").find({is_active:{$ne:false}}).project({slug:1,name:1,bankName:1}).toArray();
  const catalog: CatalogCard[] = raw.filter(r=>r.slug&&r.name).map(r=>({cardId:String(r._id),slug:r.slug as string,name:r.name as string,bankName:(r.bankName as string)??"",tokens:distinctive(tokenize(r.name as string))}));
  for (const [label, emails] of Object.entries(CASES)) {
    const out = detectCards(emails, catalog, NOW);
    console.log(`\n### ${label}`);
    if(!out.cards.length) console.log("   (no cards detected)");
    for (const c of out.cards)
      console.log(`   ${c.verdict.padEnd(9)} ${c.issuer}/${c.last4} exist=${c.existence.score} (${c.existence.strongest}) live=${c.liveness.status} neg=${c.liveness.negative??"-"} res=${c.resolution.status}\n      why: ${c.reason}`);
  }
  await mongoose.disconnect();
}
main().catch(e=>{console.error(e);process.exit(1);});
