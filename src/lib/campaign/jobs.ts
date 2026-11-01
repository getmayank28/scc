import type { Types } from "mongoose";
import AffiliateTransaction from "@/models/AffiliateTransaction";
import CampaignClaim, { type CampaignClaimProps } from "@/models/CampaignClaim";
import { syncClaimForTransaction } from "./claims";
import { CAMPAIGN_SURFACE, FESTIVE_SLUGS } from "./festive";
import { CLAIM_MESSAGE_KEYS, notifyClaim } from "./notify";

/**
 * Daily campaign upkeep, run from the Cuelinks cron after the transaction sync:
 *   1. reconcile — re-run the claim step for recent campaign transactions, so a
 *      claim update that failed inside a webhook still lands;
 *   2. remind users who haven't opened an issued voucher after 3 days;
 *   3. retry WhatsApp messages whose send failed (up to 3 attempts).
 * Everything is idempotent; `deadline` keeps it inside the cron's budget.
 */

const DAY = 864e5;

type ClaimDoc = CampaignClaimProps & { _id: Types.ObjectId };

export async function runCampaignJobs({ deadline }: { deadline: number }) {
  const now = Date.now();
  const out = { reconciled: 0, reminders: 0, retries: 0, outOfTime: false };

  const txns = await AffiliateTransaction.find(
    {
      kind: "card_application",
      surface: CAMPAIGN_SURFACE,
      cardSlug: { $in: FESTIVE_SLUGS },
      updatedAt: { $gte: new Date(now - 45 * DAY) },
    },
    "cuelinksId",
  ).lean<{ cuelinksId: number }[]>();
  for (const t of txns) {
    if (Date.now() > deadline) return { ...out, outOfTime: true };
    try {
      await syncClaimForTransaction(t.cuelinksId);
      out.reconciled++;
    } catch (err) {
      console.error("[campaign/jobs] reconcile failed", t.cuelinksId, err);
    }
  }

  const unopened = await CampaignClaim.find({
    status: "issued",
    "voucher.revealedAt": null,
    issuedAt: { $lte: new Date(now - 3 * DAY) },
    "notifications.reveal_reminder": { $exists: false },
  }).lean<ClaimDoc[]>();
  for (const c of unopened) {
    if (Date.now() > deadline) return { ...out, outOfTime: true };
    await notifyClaim(c, "reveal_reminder");
    out.reminders++;
  }

  for (const key of CLAIM_MESSAGE_KEYS) {
    const failed = await CampaignClaim.find({
      [`notifications.${key}.failed`]: true,
      [`notifications.${key}.sentAt`]: { $gte: new Date(now - 3 * DAY) },
      [`notifications.${key}.attempts`]: { $not: { $gte: 3 } },
    }).lean<ClaimDoc[]>();
    for (const c of failed) {
      if (Date.now() > deadline) return { ...out, outOfTime: true };
      await notifyClaim(c, key, { retry: true });
      out.retries++;
    }
  }

  return out;
}
