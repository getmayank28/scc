import type { Types } from "mongoose";
import AffiliateTransaction, {
  type AffiliateTransactionProps,
  type TxnStatus,
} from "@/models/AffiliateTransaction";
import CampaignClaim, { type CampaignClaimProps, type ClaimStatus } from "@/models/CampaignClaim";
import Card from "@/models/Card";
import OutboundClick from "@/models/OutboundClick";
import User from "@/models/User";
import UserCard from "@/models/UserCard";
import { trackServerEvent } from "@/lib/analytics/server";
import { CAMPAIGN_SURFACE, FESTIVE, festiveCard, isSameBankSlug } from "./festive";
import { notifyClaim } from "./notify";

/**
 * Keeps a `CampaignClaim` in step with the Cuelinks transaction behind it.
 * Called after every transaction upsert (webhook and sync); cheap and a no-op
 * for anything that isn't a festive-card application from the campaign page.
 *
 *   pending                         → applied   (claim created)
 *   validated / payable / … / paid  → approved  (48h voucher clock starts)
 *   rejected                        → rejected  (or a clawback flag if issued)
 *
 * A claim never moves backwards: a sync that walks a transaction back to
 * pending leaves an approved claim approved. Every transition is a single
 * conditional update on the current status, so the webhook and the sync
 * racing on one transaction can't both apply it.
 */

type Txn = Pick<
  AffiliateTransactionProps,
  "cuelinksId" | "status" | "kind" | "userId" | "surface" | "cardSlug" | "attribution" | "clickId"
>;

type Target = "applied" | "approved" | "rejected";

const TARGET: Record<TxnStatus, Target> = {
  pending: "applied",
  validated: "approved",
  payable: "approved",
  invoice_raised: "approved",
  paid: "approved",
  rejected: "rejected",
};

export async function syncClaimForTransaction(cuelinksId: number): Promise<void> {
  const txn = await AffiliateTransaction.findOne(
    { cuelinksId },
    "cuelinksId status kind userId surface cardSlug attribution clickId",
  ).lean<Txn | null>();
  if (!txn || txn.kind !== "card_application" || !txn.userId) return;
  if (txn.surface !== CAMPAIGN_SURFACE || txn.attribution === "none") return;
  const card = festiveCard(txn.cardSlug);
  if (!card) return;

  const target = TARGET[txn.status];
  let claim = await CampaignClaim.findOne({ cuelinksId }).lean<ClaimDoc | null>();
  if (!claim) {
    claim = await createClaim(txn, card.bank, card.voucher, target);
    if (!claim) return;
  }

  if (target === "approved") await approve(claim);
  else if (target === "rejected") await reject(claim);
}

type ClaimDoc = CampaignClaimProps & { _id: Types.ObjectId };

async function createClaim(
  txn: Txn,
  bank: string,
  amount: number,
  target: Target,
): Promise<ClaimDoc | null> {
  const now = new Date();
  // Born "applied" whatever the transaction says; approve()/reject() then move
  // it on. "Received" is only worth a message when that's still the news.
  const flags: string[] = [];
  if (txn.attribution === "inferred") flags.push("inferred_match");
  if (await holdsOtherBankCard(txn.userId!, bank, txn.cardSlug!)) flags.push("holds_bank_card");

  let created: ClaimDoc;
  try {
    created = (
      await CampaignClaim.create({
        userId: txn.userId!,
        campaign: FESTIVE,
        cardSlug: txn.cardSlug!,
        bank,
        amount,
        cuelinksId: txn.cuelinksId,
        clickId: txn.clickId,
        matchType: txn.attribution === "inferred" ? "inferred" : "subid",
        status: "applied",
        appliedAt: now,
        flags,
      })
    ).toObject() as ClaimDoc;
  } catch (err) {
    // The webhook and the sync raced to create it; use the winner's row.
    if ((err as { code?: number }).code === 11000) {
      return CampaignClaim.findOne({ cuelinksId: txn.cuelinksId }).lean<ClaimDoc | null>();
    }
    throw err;
  }

  if (target === "applied") await notifyClaim(created, "received");
  await trackServerEvent("cashback.application_received", created.userId, {
    ...(await eventBase(created)),
    matchType: created.matchType,
  });
  return created;
}

async function approve(claim: ClaimDoc): Promise<void> {
  if (claim.status !== "applied" && claim.status !== "rejected") return;
  const now = new Date();
  let updated: ClaimDoc | null;
  try {
    updated = await CampaignClaim.findOneAndUpdate(
      { _id: claim._id, status: claim.status },
      { $set: { status: "approved", approvedAt: now, rejectedAt: null, bankLock: claim.bank } },
      { new: true },
    ).lean<ClaimDoc | null>();
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err;
    // Another card from this bank is already approved for this user.
    await CampaignClaim.updateOne(
      { _id: claim._id, status: claim.status },
      { $set: { status: "duplicate_bank" satisfies ClaimStatus, bankLock: null } },
    );
    return;
  }
  if (!updated) return; // lost the race; the winner did the side effects

  await addToWallet(updated.userId, updated.cardSlug);
  await notifyClaim(updated, "approved");

  const click = updated.clickId
    ? await OutboundClick.findById(updated.clickId, "createdAt").lean<{ createdAt: Date } | null>()
    : null;
  await trackServerEvent("cashback.card_approved", updated.userId, {
    ...(await eventBase(updated)),
    daysFromClick: click ? Math.round((now.getTime() - click.createdAt.getTime()) / 864e5) : null,
  });
}

async function reject(claim: ClaimDoc): Promise<void> {
  if (claim.status === "issued") {
    // Can't take a revealed voucher back: record it as a write-off for admin.
    await CampaignClaim.updateOne({ _id: claim._id }, { $addToSet: { flags: "clawback" } });
    return;
  }
  if (claim.status !== "applied" && claim.status !== "approved") return;
  const updated = await CampaignClaim.findOneAndUpdate(
    { _id: claim._id, status: claim.status },
    { $set: { status: "rejected", rejectedAt: new Date(), bankLock: null } },
    { new: true },
  ).lean<ClaimDoc | null>();
  if (!updated) return;

  await notifyClaim(updated, "rejected");
  await trackServerEvent("cashback.card_rejected", updated.userId, await eventBase(updated));
}

/** The approved card goes straight into the wallet so the rest of the app knows it. */
async function addToWallet(userId: string, slug: string): Promise<void> {
  try {
    const card = await Card.findOne({ slug }, "_id").lean<{ _id: Types.ObjectId } | null>();
    if (!card) {
      console.warn("[campaign/claims] approved card not in catalog", slug);
      return;
    }
    await UserCard.updateOne(
      { userId, cardId: card._id },
      { $setOnInsert: { userId, cardId: card._id } },
      { upsert: true },
    );
  } catch (err) {
    // Unique index race with a manual add — the card is in the wallet either way.
    if ((err as { code?: number }).code !== 11000) {
      console.error("[campaign/claims] wallet add failed", err);
    }
  }
}

/** Whether the wallet already holds a different card from this bank (the bank may reject). */
async function holdsOtherBankCard(userId: string, bank: string, slug: string): Promise<boolean> {
  const rows = await UserCard.find({ userId }, "cardId")
    .populate("cardId", "slug")
    .lean<{ cardId: { slug?: string } | null }[]>();
  return rows.some((r) => {
    const s = r.cardId?.slug;
    return !!s && s !== slug && isSameBankSlug(bank, s);
  });
}

async function eventBase(claim: Pick<CampaignClaimProps, "userId" | "cardSlug" | "bank">) {
  const user = await User.findById(claim.userId, "signupAttribution").lean<{
    signupAttribution?: { utm_source?: string; utm_campaign?: string; utm_content?: string };
  } | null>();
  const a = user?.signupAttribution;
  return {
    campaign: FESTIVE,
    cardSlug: claim.cardSlug,
    bank: claim.bank,
    utm_source: a?.utm_source ?? null,
    utm_campaign: a?.utm_campaign ?? null,
    utm_content: a?.utm_content ?? null,
  };
}

export { eventBase as claimEventBase };
