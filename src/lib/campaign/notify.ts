import type { Types } from "mongoose";
import CampaignClaim, {
  type CampaignClaimProps,
  type ClaimMessageKey,
} from "@/models/CampaignClaim";
import User from "@/models/User";
import { sendTemplate } from "@/lib/whatsapp/send";
import { festiveCard } from "./festive";
import { inr } from "@/app/credit-card-offers/_data/festive";

/**
 * WhatsApp updates for campaign claims. Status only — the voucher code is
 * never sent; every message points back to /profile/rewards.
 *
 * Each template is a Meta-approved Gupshup template whose id lives in env.
 * Submit them as UTILITY templates with exactly these {{n}} params, in order,
 * and a URL button to https://www.gofisense.com/profile/rewards (the rejected
 * one to /credit-card-offers/festive). Until an id is set, that message is
 * simply not sent.
 *
 * Each message goes out at most once per claim: `notifications.<key>` is
 * reserved with one atomic write before sending, so the webhook, the sync and
 * the cron can't double-send.
 */

interface TemplateDef {
  env: string;
  /** {{1}}, {{2}} … for the template, from the claim. */
  params: (c: Pick<CampaignClaimProps, "cardSlug" | "amount">, cardName: string) => string[];
  /** Readable copy for the admin log; mirrors the submitted template. */
  text: (p: string[]) => string;
}

export const CLAIM_TEMPLATES: Record<ClaimMessageKey, TemplateDef> = {
  received: {
    env: "GUPSHUP_TPL_CLAIM_RECEIVED",
    params: (_c, name) => [name],
    text: ([name]) =>
      `The bank has your ${name} application. We'll update you here as soon as the bank decides.`,
  },
  approved: {
    env: "GUPSHUP_TPL_CLAIM_APPROVED",
    params: (c, name) => [name, inr(c.amount)],
    text: ([name, amt]) =>
      `Your ${name} is approved! Your ${amt} FiSense voucher will be ready within 48 hours.`,
  },
  voucher_ready: {
    env: "GUPSHUP_TPL_VOUCHER_READY",
    params: (c) => [inr(c.amount)],
    text: ([amt]) => `Your ${amt} voucher is ready. Open FiSense to view it.`,
  },
  reveal_reminder: {
    env: "GUPSHUP_TPL_VOUCHER_REMINDER",
    params: (c) => [inr(c.amount)],
    text: ([amt]) => `Your ${amt} FiSense voucher is waiting for you. Open FiSense to view it.`,
  },
  rejected: {
    env: "GUPSHUP_TPL_CLAIM_REJECTED",
    params: (_c, name) => [name],
    text: ([name]) =>
      `The bank didn't approve your ${name} application, so no joining fee is charged. You can still pick another card on FiSense.`,
  },
};

export const CLAIM_MESSAGE_KEYS = Object.keys(CLAIM_TEMPLATES) as ClaimMessageKey[];

type ClaimForNotify = Pick<CampaignClaimProps, "userId" | "cardSlug" | "amount"> & {
  _id: Types.ObjectId;
};

/**
 * Sends `key` for this claim unless it was already sent. `retry` re-sends a
 * message whose earlier attempt failed. Never throws.
 */
export async function notifyClaim(
  claim: ClaimForNotify,
  key: ClaimMessageKey,
  { retry = false }: { retry?: boolean } = {},
): Promise<void> {
  try {
    const def = CLAIM_TEMPLATES[key];
    const templateId = process.env[def.env]?.trim();
    // Not configured yet: leave the slot free so nothing is recorded as sent.
    if (!templateId) return;

    const path = `notifications.${key}`;
    const reserved = await CampaignClaim.findOneAndUpdate(
      { _id: claim._id, ...(retry ? { [`${path}.failed`]: true } : { [path]: { $exists: false } }) },
      retry
        ? {
            $set: { [`${path}.sentAt`]: new Date() },
            $unset: { [`${path}.failed`]: "" },
            $inc: { [`${path}.attempts`]: 1 },
          }
        : { $set: { [path]: { sentAt: new Date(), attempts: 1 } } },
    );
    if (!reserved) return;

    const user = await User.findById(claim.userId, "phoneNumber informationConsent").lean<{
      phoneNumber?: string;
      informationConsent?: boolean;
    } | null>();
    const skip = !user?.phoneNumber
      ? "no_phone"
      : user.informationConsent === false
        ? "no_consent"
        : null;
    if (skip) {
      await CampaignClaim.updateOne({ _id: claim._id }, { $set: { [`${path}.skipped`]: skip } });
      return;
    }

    const name = festiveCard(claim.cardSlug)?.name ?? "card";
    const params = def.params(claim, name);
    const result = await sendTemplate({
      phoneNumber: user!.phoneNumber!,
      templateId,
      params,
      text: def.text(params),
      userId: claim.userId,
      claimId: claim._id,
    });
    await CampaignClaim.updateOne(
      { _id: claim._id },
      {
        $set: {
          ...(result.message ? { [`${path}.waMessageId`]: result.message._id } : {}),
          ...(result.ok ? {} : { [`${path}.failed`]: true }),
        },
      },
    );
    if (!result.ok) console.error("[campaign/notify] send failed", key, String(claim._id), result.error);
  } catch (err) {
    console.error("[campaign/notify] failed", key, String(claim._id), err);
  }
}
