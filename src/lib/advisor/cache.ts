import CardAdvisorModel, { type CardDoc } from "@/models/CardDoc";
import CardRuleModel, { type CardRuleDoc } from "@/models/CardRule";
import CardBestOfModel, { type CardBestOfDoc } from "@/models/CardBestOf";
import dbConnect from "@/lib/utils/dbConnet";
import type { MockCard } from "@/lib/logic/advisor/cards";
import { toSharedCapGroup, type MockRule } from "@/lib/logic/advisor/rules";
import type { MockBestOf } from "@/lib/logic/advisor/bestOf";

// Process-local cache of advisor data. Vercel keeps function instances warm for
// minutes at a time, so this Map survives across many invocations. On a cold
// start the first request pays the hydrate cost (~500ms on M0); every warm
// request after is in-memory only.
//
// Invalidation: TTL-based (60s). Admin writes update Mongo synchronously; all
// instances pick up changes on their next post-TTL request. That's acceptable
// because rule edits are rare and 60s staleness has no user-visible effect.

const TTL_MS = 60_000;
const STALE_GRACE_MS = 300_000;

interface Snapshot {
  cards: MockCard[];
  rules: MockRule[];
  bestOf: MockBestOf[];
}

let snapshot: Snapshot | null = null;
let fetchedAt = 0;
let inflight: Promise<void> | null = null;

type LeanCard = Omit<CardDoc, keyof Document> & Record<string, unknown>;
type LeanRule = Omit<CardRuleDoc, keyof Document> & Record<string, unknown>;
type LeanBestOf = Omit<CardBestOfDoc, keyof Document> & Record<string, unknown>;

function toMockCard(doc: LeanCard): MockCard {
  return {
    _id: doc.advisorKey as string,
    name: doc.name as string,
    slug: doc.slug as string,
    bankId: doc.bankSlug as string,
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

function toMockRule(doc: LeanRule): MockRule {
  return {
    _id: doc.ruleKey as string,
    cardId: doc.cardAdvisorKey as string,
    category: doc.category as MockRule["category"],
    merchant: doc.merchant as MockRule["merchant"],
    reward: doc.reward as MockRule["reward"],
    caps: doc.caps as MockRule["caps"],
    shared_cap_group: toSharedCapGroup(doc.shared_cap_group),
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

async function hydrate(): Promise<void> {
  await dbConnect();

  const [cardDocs, ruleDocs, bestOfDocs] = await Promise.all([
    CardAdvisorModel.find({ is_active: true })
      .select(
        "advisorKey name slug bankSlug network eligibility fees forex_markup_percentage rewards categories welcome_benefit lounge ideal_for not_ideal_for is_active excluded_categories rulesVersion",
      )
      .lean<LeanCard[]>(),
    CardRuleModel.find({ is_active: true })
      .select(
        "ruleKey cardAdvisorKey category merchant reward caps shared_cap_group fuel_surcharge_applicable max_fuel_transaction_limit redemption_mode voucher_validity_in_months gv_coins_percentage valid_from valid_until notes is_active",
      )
      .lean<LeanRule[]>(),
    CardBestOfModel.find({})
      .select("cardAdvisorKey category rulesVersion payload")
      .lean<LeanBestOf[]>(),
  ]);

  snapshot = {
    cards: cardDocs.map(toMockCard),
    rules: ruleDocs.map(toMockRule),
    bestOf: bestOfDocs.map((d) => d.payload as MockBestOf),
  };
  fetchedAt = Date.now();
}

async function refreshInBackground(): Promise<void> {
  try {
    if (inflight) return inflight;
    inflight = hydrate().finally(() => {
      inflight = null;
    });
    await inflight;
  } catch (err) {
    console.error("[AdvisorCache] background refresh failed:", err);
  }
}

export const AdvisorCache = {
  // Awaits hydrate on cold cache or when data is older than STALE_GRACE_MS.
  // For ages between TTL_MS and STALE_GRACE_MS, returns immediately while
  // triggering a background refresh (stale-while-revalidate).
  async ensureFresh(): Promise<void> {
    const age = Date.now() - fetchedAt;
    if (snapshot && age < TTL_MS) return;

    if (!snapshot || age > STALE_GRACE_MS) {
      if (!inflight) {
        inflight = hydrate().finally(() => {
          inflight = null;
        });
      }
      await inflight;
      return;
    }

    void refreshInBackground();
  },

  cards(): MockCard[] {
    return snapshot?.cards ?? [];
  },

  rules(): MockRule[] {
    return snapshot?.rules ?? [];
  },

  bestOf(): MockBestOf[] {
    return snapshot?.bestOf ?? [];
  },

  // Force invalidate (e.g. immediately after an admin write in the same
  // process). Other instances will pick up changes on their next TTL refresh.
  invalidate(): void {
    fetchedAt = 0;
  },
};
