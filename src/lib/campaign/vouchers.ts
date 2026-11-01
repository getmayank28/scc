import type { Types } from "mongoose";
import CampaignClaim, { type CampaignClaimProps } from "@/models/CampaignClaim";
import { decryptSecret, encryptSecret } from "@/lib/crypto/voucher";
import { trackServerEvent } from "@/lib/analytics/server";
import type { RevealedVoucher, RewardClaim, RewardsResponse } from "@/types/rewards";
import { festiveCard } from "./festive";
import { notifyClaim } from "./notify";
import { claimEventBase } from "./claims";

/**
 * Voucher issue (admin) and reveal (user). Codes are encrypted at rest and
 * only ever leave the server through `revealVoucher`, for the claim's owner.
 */

type ClaimDoc = CampaignClaimProps & { _id: Types.ObjectId };

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);

export function toRewardClaim(c: ClaimDoc): RewardClaim {
  return {
    id: String(c._id),
    campaign: c.campaign,
    cardSlug: c.cardSlug,
    cardName: festiveCard(c.cardSlug)?.name ?? c.cardSlug,
    bank: c.bank,
    amount: c.amount,
    status: c.status,
    appliedAt: iso(c.appliedAt)!,
    approvedAt: iso(c.approvedAt),
    issuedAt: iso(c.issuedAt),
    rejectedAt: iso(c.rejectedAt),
    voucher:
      c.status === "issued" && c.voucher
        ? {
            brand: c.voucher.brand,
            amount: c.voucher.amount,
            expiry: iso(c.voucher.expiry),
            revealed: !!c.voucher.revealedAt,
            hasPin: !!c.voucher.pinEnc,
            usedAt: iso(c.voucher.usedAt),
          }
        : null,
  };
}

export async function rewardsFor(userId: string): Promise<RewardsResponse> {
  // pinEnc is read only to say whether a PIN exists; it never leaves toRewardClaim.
  const rows = await CampaignClaim.find({ userId }, "-voucher.codeEnc")
    .sort({ appliedAt: -1 })
    .limit(20)
    .lean<ClaimDoc[]>();
  const claims = rows.map(toRewardClaim);
  return { claims, hasUnrevealed: claims.some((c) => c.voucher && !c.voucher.revealed) };
}

export interface IssueInput {
  brand: string;
  code: string;
  pin?: string | null;
  expiry?: string | null;
}

export type IssueResult = { ok: true } | { ok: false; status: number; error: string };

export async function issueVoucher(
  claimId: string,
  input: IssueInput,
  adminPhone: string,
): Promise<IssueResult> {
  const brand = input.brand?.trim();
  const code = input.code?.trim();
  if (!brand || !code) return { ok: false, status: 400, error: "Brand and code are required" };
  const expiry = input.expiry ? new Date(input.expiry) : null;
  if (expiry && Number.isNaN(expiry.getTime())) return { ok: false, status: 400, error: "Bad expiry date" };

  // The voucher is for the amount owed on the claim; no free-typed amount.
  const owed = await CampaignClaim.findOne({ _id: claimId, status: "approved" }, "amount").lean<{
    amount: number;
  } | null>();
  if (!owed) return { ok: false, status: 409, error: "Claim is not awaiting a voucher" };

  const now = new Date();
  const claim = await CampaignClaim.findOneAndUpdate(
    { _id: claimId, status: "approved" },
    {
      $set: {
        status: "issued",
        issuedAt: now,
        voucher: {
          brand,
          amount: owed.amount,
          codeEnc: encryptSecret(code),
          pinEnc: input.pin?.trim() ? encryptSecret(input.pin.trim()) : null,
          expiry,
          issuedBy: adminPhone,
          revealedAt: null,
          lastRevealedAt: null,
          revealCount: 0,
          usedAt: null,
        },
      },
    },
    { new: true },
  ).lean<ClaimDoc | null>();
  if (!claim) return { ok: false, status: 409, error: "Claim is not awaiting a voucher" };

  await notifyClaim(claim, "voucher_ready");
  await trackServerEvent("cashback.voucher_issued", claim.userId, {
    ...(await claimEventBase(claim)),
    amount: claim.amount,
    hoursFromApproval: claim.approvedAt
      ? Math.round((now.getTime() - new Date(claim.approvedAt).getTime()) / 36e5)
      : null,
  });
  return { ok: true };
}

export type RevealResult = { ok: true; voucher: RevealedVoucher } | { ok: false; status: number; error: string };

export async function revealVoucher(claimId: string, userId: string): Promise<RevealResult> {
  const now = new Date();
  const claim = await CampaignClaim.findOneAndUpdate(
    { _id: claimId, userId, status: "issued" },
    { $set: { "voucher.lastRevealedAt": now }, $inc: { "voucher.revealCount": 1 } },
    { new: true },
  ).lean<ClaimDoc | null>();
  if (!claim?.voucher) return { ok: false, status: 404, error: "Voucher not found" };
  if (!claim.voucher.revealedAt) {
    await CampaignClaim.updateOne(
      { _id: claim._id, "voucher.revealedAt": null },
      { $set: { "voucher.revealedAt": now } },
    );
  }

  return {
    ok: true,
    voucher: {
      brand: claim.voucher.brand,
      amount: claim.voucher.amount,
      code: decryptSecret(claim.voucher.codeEnc),
      pin: claim.voucher.pinEnc ? decryptSecret(claim.voucher.pinEnc) : null,
      expiry: iso(claim.voucher.expiry),
    },
  };
}

/** The user's own "I've used this" toggle. Self-reported; only moves it between groups on My rewards. */
export async function setVoucherUsed(claimId: string, userId: string, used: boolean): Promise<boolean> {
  const res = await CampaignClaim.updateOne(
    { _id: claimId, userId, status: "issued" },
    { $set: { "voucher.usedAt": used ? new Date() : null } },
  );
  return res.matchedCount === 1;
}
