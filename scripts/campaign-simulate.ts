/**
 * Walk a real user through the festive cashback flow without a real bank.
 *
 * Fakes ONLY what we can't trigger ourselves — the Apply click and Cuelinks'
 * status updates — and pushes them through `upsertTransaction`, the same
 * function the Cuelinks webhook calls. Everything after that is the real code:
 * the claim, the wallet add, WhatsApp (if template ids are set), My rewards,
 * the admin queue, issue and reveal (do those two in the UI).
 *
 * Simulated rows are tagged (`raw.simulated`, cuelinksId ≥ 900000000,
 * click destination "simulated://") and `cleanup` removes exactly those.
 * Refuses any database but fisense-staging unless --yes-prod.
 *
 *   npx tsx --env-file=.env.local scripts/campaign-simulate.ts <command> --phone=98xxxxxxxx [--card=sbi]
 *
 * Commands:
 *   apply    --card=…   Apply click + Cuelinks "pending"       → Application received
 *   approve  --card=…   Cuelinks "validated"                    → Card approved, in admin queue
 *   reject   --card=…   Cuelinks "rejected"                     → Not approved (or write-off if issued)
 *   age      --days=4   Backdates this user's simulated claims  → tests the 48h clock / 3-day reminder
 *   jobs                Runs the daily campaign job (reconcile, reminders, retries)
 *   status              Prints this user's claims
 *   cleanup             Deletes this user's simulated claims, transactions, clicks and wallet adds
 *
 * Cards: sbi, tiger, neu, kiwi, swiggy. Server-side Amplitude is off unless --analytics.
 */

import mongoose, { Types } from "mongoose";
import AffiliateTransaction from "../src/models/AffiliateTransaction";
import CampaignClaim from "../src/models/CampaignClaim";
import Card from "../src/models/Card";
import OutboundClick from "../src/models/OutboundClick";
import User from "../src/models/User";
import UserCard from "../src/models/UserCard";
import { upsertTransaction, type TxnInput } from "../src/lib/cuelinks/transactions";
import { runCampaignJobs } from "../src/lib/campaign/jobs";

const CARDS: Record<string, string> = {
  sbi: "cashback-sbi-card-sbi-card",
  tiger: "indusind-tiger-credit-card-indusind-bank",
  neu: "tata-neu-plus-hdfc-bank-credit-card-hdfc-bank",
  kiwi: "kiwi-card-yes-bank",
  swiggy: "hdfc-swiggy-ornge-credit-card-hdfc-bank",
};
const SIM_BASE = 900_000_000;
const DAY = 864e5;

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const flag = (name: string) => process.argv.includes(`--${name}`);

async function resolveUser(): Promise<string> {
  const id = arg("user-id");
  if (id) return id;
  const phone = arg("phone")?.replace(/\D/g, "").slice(-10);
  if (!phone) throw new Error("Pass --phone=98xxxxxxxx (the number you sign in with)");
  const user = await User.findOne({ phoneNumber: phone }, "_id").lean<{ _id: Types.ObjectId } | null>();
  if (!user) throw new Error(`No user with phone ${phone} in this database — sign in once on this environment first`);
  return String(user._id);
}

function cardSlug(): string {
  const key = arg("card");
  const slug = key ? CARDS[key] : undefined;
  if (!slug) throw new Error(`Pass --card=${Object.keys(CARDS).join("|")}`);
  return slug;
}

async function simulatedTxn(userId: string, slug: string) {
  return AffiliateTransaction.findOne(
    { userId, cardSlug: slug, "raw.simulated": true },
    "cuelinksId raw",
  ).lean<{ cuelinksId: number; raw: Record<string, unknown> } | null>();
}

function input(cuelinksId: number, userId: string, slug: string, status: TxnInput["status"], hadCard: boolean): TxnInput {
  return {
    cuelinksId,
    status,
    campaignId: null,
    campaignName: "SIMULATED festive test",
    campaignType: "CPL",
    saleAmount: null,
    commission: 0,
    currency: "INR",
    orderId: null,
    transactionDate: new Date(),
    subids: [userId, "campaign", null, slug, "mobile"],
    sourceUpdatedAt: null,
    raw: { simulated: true, hadCard },
  };
}

async function walletHas(userId: string, slug: string): Promise<boolean> {
  const card = await Card.findOne({ slug }, "_id").lean<{ _id: Types.ObjectId } | null>();
  return !!card && !!(await UserCard.exists({ userId, cardId: card._id }));
}

async function setStatus(userId: string, status: TxnInput["status"]) {
  const slug = cardSlug();
  const existing = await simulatedTxn(userId, slug);
  if (!existing && status !== "pending") {
    console.log(`No simulated application for ${slug} yet — run "apply" first (or this jumps straight to ${status}).`);
  }
  const cuelinksId = existing?.cuelinksId ?? SIM_BASE + Math.floor(Math.random() * 99_999_999);
  const hadCard = existing ? Boolean(existing.raw?.hadCard) : await walletHas(userId, slug);

  if (!existing) {
    await OutboundClick.create({
      userId,
      type: "card",
      targetId: slug,
      surface: "campaign",
      cardSlug: slug,
      step: "direct",
      destination: "simulated://festive",
      redirectUrl: "simulated://festive",
      affiliated: false,
      device: "mobile",
    });
  }
  // Webhook source so a forward move always applies; same path as production.
  const outcome = await upsertTransaction(input(cuelinksId, userId, slug, status, hadCard), "webhook");
  console.log(`Cuelinks ${status} for ${slug} (txn ${cuelinksId}): ${outcome}`);
  await printStatus(userId);
}

async function printStatus(userId: string) {
  const claims = await CampaignClaim.find({ userId }, "-voucher.codeEnc -voucher.pinEnc")
    .sort({ appliedAt: 1 })
    .lean();
  if (!claims.length) return console.log("No claims for this user.");
  console.table(
    claims.map((c) => ({
      card: c.cardSlug,
      status: c.status,
      amount: c.amount,
      simulated: c.cuelinksId >= SIM_BASE,
      approvedAt: c.approvedAt?.toISOString().slice(0, 16) ?? "",
      issued: c.voucher ? `${c.voucher.brand}${c.voucher.revealedAt ? " (revealed)" : ""}` : "",
      flags: (c.flags ?? []).join(" "),
      whatsapp: Object.entries(c.notifications ?? {})
        .map(([k, v]) => `${k}${v?.skipped ? `:${v.skipped}` : v?.failed ? ":failed" : ""}`)
        .join(" "),
    })),
  );
}

async function age(userId: string) {
  const days = Number(arg("days") ?? "3");
  const shift = days * DAY;
  const claims = await CampaignClaim.find({ userId, cuelinksId: { $gte: SIM_BASE } });
  for (const c of claims) {
    for (const k of ["appliedAt", "approvedAt", "issuedAt"] as const) {
      if (c[k]) c[k] = new Date(c[k]!.getTime() - shift);
    }
    await c.save();
  }
  console.log(`Moved ${claims.length} simulated claim(s) ${days} day(s) into the past.`);
  await printStatus(userId);
}

async function cleanup(userId: string) {
  const txns = await AffiliateTransaction.find({ userId, "raw.simulated": true }, "cuelinksId cardSlug raw").lean<
    { cuelinksId: number; cardSlug: string; raw: Record<string, unknown> }[]
  >();
  for (const t of txns) {
    // Only undo wallet adds the simulation made; keep cards the user really had.
    if (!t.raw?.hadCard) {
      const card = await Card.findOne({ slug: t.cardSlug }, "_id").lean<{ _id: Types.ObjectId } | null>();
      if (card) await UserCard.deleteOne({ userId, cardId: card._id });
    }
  }
  const ids = txns.map((t) => t.cuelinksId);
  const claims = await CampaignClaim.deleteMany({ userId, cuelinksId: { $in: ids } });
  const tx = await AffiliateTransaction.deleteMany({ userId, "raw.simulated": true });
  const clicks = await OutboundClick.deleteMany({ userId, destination: "simulated://festive" });
  console.log(`Removed ${claims.deletedCount} claim(s), ${tx.deletedCount} transaction(s), ${clicks.deletedCount} click(s).`);
}

async function main() {
  const command = process.argv[2];
  if (!flag("analytics")) {
    delete process.env.AMPLITUDE_API_KEY;
    delete process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  }

  await mongoose.connect(process.env.MONGODB_URI!);
  const db = mongoose.connection.db!.databaseName;
  console.log(`Database: ${db}`);
  if (db !== "fisense-staging" && !flag("yes-prod")) {
    throw new Error(`Refusing to simulate on ${db}. Use .env.local (staging), or pass --yes-prod if you really mean it.`);
  }
  await CampaignClaim.init();

  const userId = await resolveUser();
  switch (command) {
    case "apply":
      await setStatus(userId, "pending");
      break;
    case "approve":
      await setStatus(userId, "validated");
      break;
    case "reject":
      await setStatus(userId, "rejected");
      break;
    case "age":
      await age(userId);
      break;
    case "jobs":
      console.log(await runCampaignJobs({ deadline: Date.now() + 60_000 }));
      await printStatus(userId);
      break;
    case "status":
      await printStatus(userId);
      break;
    case "cleanup":
      await cleanup(userId);
      break;
    default:
      throw new Error("Command: apply | approve | reject | age | jobs | status | cleanup (see the header)");
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
