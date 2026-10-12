import CardAdvisorModel, { type CardDoc } from "@/models/Card";
import CardRuleModel, { type CardRuleDoc } from "@/models/CardRule";
import CardBestOfModel from "@/models/CardBestOf";
import { computeBestOfForCard } from "@/lib/logic/advisor/bestOf";
import type { MockCard } from "@/lib/logic/advisor/cards";
import {
  toRuleCaps,
  toSharedCapGroup,
  validateSharedCapGroups,
  type MockRule,
} from "@/lib/logic/advisor/rules";

type LeanCard = Omit<CardDoc, keyof Document> & Record<string, unknown>;
type LeanCardRule = Omit<CardRuleDoc, keyof Document> & Record<string, unknown>;

// Adapt the Mongoose doc back to the plain MockCard shape the engine consumes.
// _id is set from slug (the stable string id) so existing engine code that reads
// `card._id` keeps working unchanged.
function toMockCard(doc: LeanCard): MockCard {
  return {
    _id: doc.slug as string,
    name: doc.name as string,
    slug: doc.slug as string,
    bankId: doc.bankName as string,
    network: doc.network as MockCard["network"],
    eligibility: doc.eligibility as MockCard["eligibility"],
    fees: doc.fees as MockCard["fees"],
    forex_markup_percentage: doc.forex_markup_percentage as number,
    rewards: doc.rewards as MockCard["rewards"],
    categories: doc.categories as MockCard["categories"],
    welcome_benefit: doc.welcome_benefit as MockCard["welcome_benefit"],
    lounge: doc.lounge as MockCard["lounge"],
    ideal_for: doc.ideal_for as string[],
    not_ideal_for: doc.not_ideal_for as string[],
    is_active: doc.is_active as boolean,
    excluded_categories:
      doc.excluded_categories as MockCard["excluded_categories"],
    transfer_partners:
      (doc.transfer_partners as MockCard["transfer_partners"]) ?? null,
  };
}

function toMockRule(doc: LeanCardRule): MockRule {
  return {
    _id: doc.ruleKey as string,
    cardId: doc.cardSlug as string,
    category: doc.category as MockRule["category"],
    merchant: doc.merchant as MockRule["merchant"],
    reward: doc.reward as MockRule["reward"],
    caps: toRuleCaps(doc.caps),
    shared_cap_group: toSharedCapGroup(doc.shared_cap_group),
    voucher_shared_cap_group: toSharedCapGroup(doc.voucher_shared_cap_group),
    fuel_surcharge_applicable: (doc.fuel_surcharge_applicable as number) ?? 0,
    max_fuel_transaction_limit: (doc.max_fuel_transaction_limit as number) ?? 0,
    redemption_mode:
      (doc.redemption_mode as MockRule["redemption_mode"]) ?? "both",
    voucher_validity_in_months:
      (doc.voucher_validity_in_months as number | null) ?? null,
    gv_coins_percentage: (doc.gv_coins_percentage as number) ?? 0,
    valid_from: doc.valid_from as Date,
    valid_until: doc.valid_until as Date | null,
    is_active: doc.is_active as boolean,
  };
}

// Recompute the Pareto frontier + voucher frontier + baseTier for a single
// card across all (or specified) categories, then upsert the cache rows.
// Idempotent: running twice produces the same result.
export async function recomputeBestOfForCard(
  cardSlug: string,
): Promise<{ written: number }> {
  const [cardDoc, ruleDocs] = await Promise.all([
    CardAdvisorModel.findOne({ slug: cardSlug }).lean<LeanCard>(),
    CardRuleModel.find({
      cardSlug,
      is_active: true,
    }).lean<LeanCardRule[]>(),
  ]);

  if (!cardDoc) {
    throw new Error(`Card not found: ${cardSlug}`);
  }

  const card = toMockCard(cardDoc);
  const rules = (ruleDocs ?? []).map(toMockRule);
  const rulesVersion = (cardDoc.rulesVersion as number) ?? 1;

  // Combined groups pool their members' caps, so inconsistent member caps
  // would silently mis-score — fail the recompute loudly instead.
  validateSharedCapGroups(rules);

  const results = computeBestOfForCard(card, rules, rulesVersion);
  const now = new Date();

  if (results.length === 0) {
    // Card has no qualifying rules — clear any stale cache rows.
    await CardBestOfModel.deleteMany({ cardSlug });
    return { written: 0 };
  }

  await CardBestOfModel.bulkWrite(
    results.map((r) => ({
      updateOne: {
        filter: { cardSlug, category: r.category },
        update: {
          $set: {
            rulesVersion,
            payload: r,
            computedAt: now,
          },
        },
        upsert: true,
      },
    })),
  );

  // Drop categories that no longer appear in `results` (e.g. last rule deactivated).
  const keptCategories = new Set(results.map((r) => r.category));
  await CardBestOfModel.deleteMany({
    cardSlug,
    category: { $nin: Array.from(keptCategories) },
  });

  return { written: results.length };
}
