// Merges the four trackers into one ranked feed.
//
// A single ranked list is the point: milestones, caps, fee waivers and expiring
// benefits are different mechanics, but to the user they are one question —
// "what should I do about my cards this month?" Ranking them against each other
// by rupees-per-day is what turns four widgets into a product.
//
// Card data (fees, milestones, caps, names) is read live from `fisense-staging`.
// Only the spend ledger and benefit entitlements are simulated.

import CardModel from "@/models/Card";
import CardRuleModel, { type CardRuleDoc } from "@/models/CardRule";
import CardMilestoneModel from "@/models/CardMilestone";
import dbConnect from "@/lib/utils/dbConnet";
import { toMockCard } from "@/lib/advisor/cache";
import { toRuleCaps, toSharedCapGroup, type MockRule } from "@/lib/logic/advisor/rules";
import type { MockCard } from "@/lib/logic/advisor/cards";
import type { MockMilestone } from "@/lib/logic/advisor/scoring";
import type { Document } from "mongoose";

import type { Insight, LedgerEntry, WalletCard, BenefitEntitlement } from "./types";
import { demoNow, monthWindow } from "./demoClock";
import { URGENCY_RANK } from "./format";
import { trackMilestones, milestoneInsights } from "./milestoneTracker";
import { trackCaps, capInsights } from "./capTracker";
import { trackFeeWaiver, feeWaiverInsights } from "./feeWaiverTracker";
import { trackBenefits, benefitInsights } from "./benefitTracker";
import { computeRewardPoints, type RewardPointsSummary } from "./rewardPoints";

type LeanRule = Omit<CardRuleDoc, keyof Document> & Record<string, unknown>;

// `toMockCard` is typed against the cache's own private LeanCard shape; the
// lean() result is structurally identical but nominally distinct, so the call
// is bridged through the parameter type rather than duplicating the type here.
type ToMockCardArg = Parameters<typeof toMockCard>[0];

export interface InsightsResult {
  insights: Insight[];
  totalAtRiskInr: number;
  /** FiSense reward points accrued on tracked spend. */
  rewardPoints: RewardPointsSummary;
  cards: { slug: string; name: string; isActive: boolean }[];
  /** Narrative-guardrail warnings from the mock ledger, if any. */
  warnings: string[];
  generatedAt: string;
}

/**
 * Load the wallet's cards by slug, REGARDLESS of `is_active`.
 *
 * AdvisorCache deliberately holds only active cards, since a delisted product
 * should never be recommended. But a user still holding a delisted card (Amex
 * Gold, in this wallet) still pays its fee and still has benefits to burn, so
 * insights must track it. Hence the direct query rather than the cache.
 */
async function loadWalletCards(slugs: string[]): Promise<Map<string, MockCard>> {
  await dbConnect();
  const docs = await CardModel.find({ slug: { $in: slugs } })
    .select(
      "name slug bankName bankId network eligibility fees forex_markup_percentage rewards categories welcome_benefit lounge ideal_for not_ideal_for is_active invitation_only excluded_categories",
    )
    .lean<ToMockCardArg[]>();
  return new Map(docs.map((d) => [d.slug as string, toMockCard(d)]));
}

async function loadMilestones(
  slugs: string[],
): Promise<Map<string, MockMilestone[]>> {
  const docs = await CardMilestoneModel.find({
    cardSlug: { $in: slugs },
    is_active: true,
  })
    .select(
      "milestoneKey cardSlug milestone_type milestone_period spend_threshold_inr tier_order mutual_exclusivity_group benefit_type benefit_value_inr",
    )
    .lean();

  const out = new Map<string, MockMilestone[]>();
  for (const d of docs) {
    const slug = d.cardSlug as string;
    const list = out.get(slug) ?? [];
    list.push({
      milestoneKey: d.milestoneKey as string,
      cardSlug: slug,
      milestone_type: d.milestone_type ?? null,
      milestone_period: d.milestone_period ?? null,
      spend_threshold_inr: d.spend_threshold_inr ?? null,
      tier_order: d.tier_order ?? null,
      mutual_exclusivity_group: d.mutual_exclusivity_group ?? null,
      benefit_type: d.benefit_type ?? null,
      benefit_value_inr: d.benefit_value_inr ?? null,
    } as MockMilestone);
    out.set(slug, list);
  }
  return out;
}

/** Rules for the wallet's cards only — a few hundred rows, not the 82k catalogue. */
async function loadRules(slugs: string[]): Promise<Map<string, MockRule[]>> {
  const docs = await CardRuleModel.find({
    cardSlug: { $in: slugs },
    is_active: true,
  })
    .select(
      "ruleKey cardSlug category merchant reward caps shared_cap_group valid_from valid_until is_active",
    )
    .lean<LeanRule[]>();

  const out = new Map<string, MockRule[]>();
  for (const d of docs) {
    const slug = d.cardSlug as string;
    const list = out.get(slug) ?? [];
    list.push({
      _id: d.ruleKey as string,
      cardId: slug,
      category: d.category as MockRule["category"],
      merchant: d.merchant as MockRule["merchant"],
      reward: d.reward as MockRule["reward"],
      caps: toRuleCaps(d.caps),
      shared_cap_group: toSharedCapGroup(d.shared_cap_group),
      voucher_shared_cap_group: null,
      fuel_surcharge_applicable: 0,
      max_fuel_transaction_limit: 0,
      redemption_mode: "both",
      voucher_validity_in_months: null,
      gv_coins_percentage: 0,
      valid_from: d.valid_from as Date,
      valid_until: (d.valid_until as Date | null) ?? null,
      is_active: true,
    });
    out.set(slug, list);
  }
  return out;
}

export async function buildInsights(
  wallet: WalletCard[],
  ledger: LedgerEntry[],
  entitlements: BenefitEntitlement[],
  warnings: string[] = [],
  now: Date = demoNow(),
): Promise<InsightsResult> {
  const slugs = wallet.map((w) => w.cardSlug);
  const [cards, milestones, rules] = await Promise.all([
    loadWalletCards(slugs),
    loadMilestones(slugs),
    loadRules(slugs),
  ]);

  const nameFor = (slug: string) => cards.get(slug)?.name ?? slug;
  const insights: Insight[] = [];
  const missing: string[] = [];

  for (const w of wallet) {
    const card = cards.get(w.cardSlug);
    if (!card) {
      missing.push(w.cardSlug);
      continue;
    }
    const entries = ledger.filter((e) => e.cardSlug === w.cardSlug);

    insights.push(
      ...milestoneInsights(
        w.cardSlug,
        card.name,
        trackMilestones(milestones.get(w.cardSlug), entries, w.anniversary, now),
      ),
      ...capInsights(
        w.cardSlug,
        card.name,
        trackCaps(card, rules.get(w.cardSlug) ?? [], entries, w.anniversary, now),
        card.rewards?.point_value_inr ?? 1,
      ),
      ...feeWaiverInsights(
        card.name,
        trackFeeWaiver(card, entries, w.anniversary, now),
      ),
    );
  }

  insights.push(...benefitInsights(trackBenefits(entitlements, now), nameFor));

  if (missing.length) {
    warnings = [
      ...warnings,
      `Cards not found in the catalogue: ${missing.join(", ")}`,
    ];
  }

  // Rank by urgency band first so a critical item never sits below a lucrative
  // but distant one, then by rupees-per-day within the band. Items with no
  // action attached (already-waived fees) sort last regardless of band.
  insights.sort((a, b) => {
    const actionable = (i: Insight) => (i.valueAtRiskInr > 0 ? 0 : 1);
    const act = actionable(a) - actionable(b);
    if (act !== 0) return act;
    const u = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    return u !== 0 ? u : b.score - a.score;
  });

  // "At risk" is every rupee a deadline can take away where the user still has
  // an action. It deliberately includes low-urgency items — a ₹14,000 golf
  // benefit expiring in 135 days is not urgent, but it is unambiguously at
  // risk, and excluding it would understate the headline. Already-waived fees
  // and other no-action items contribute ₹0 by construction.
  // Rounded: GST-inclusive fees carry paise (₹179.82), and a headline figure
  // with stray decimals reads as a bug rather than precision.
  const totalAtRiskInr = Math.round(
    insights
      .filter((i) => i.deadline !== null)
      .reduce((t, i) => t + i.valueAtRiskInr, 0),
  );

  const m = monthWindow(now);
  const rewardPoints = computeRewardPoints(ledger, m.start, m.end);

  return {
    insights,
    totalAtRiskInr,
    rewardPoints,
    cards: [...cards.values()].map((c) => ({
      slug: c.slug,
      name: c.name,
      isActive: c.is_active ?? false,
    })),
    warnings,
    generatedAt: now.toISOString(),
  };
}
