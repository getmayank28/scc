import CardAdvisorModel, { type CardDoc } from "@/models/Card";
import CardRuleModel, { type CardRuleDoc } from "@/models/CardRule";
import CardBestOfModel, { type CardBestOfDoc } from "@/models/CardBestOf";
import CardMilestoneModel, {
  type CardMilestoneDoc,
} from "@/models/CardMilestone";
import dbConnect from "@/lib/utils/dbConnet";
import type { MockCard } from "@/lib/logic/advisor/cards";
import { toSharedCapGroup, type MockRule } from "@/lib/logic/advisor/rules";
import type { MockBestOf } from "@/lib/logic/advisor/bestOf";
import type { MockMilestone } from "@/lib/logic/advisor/scoring";

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
  milestonesBySlug: Map<string, MockMilestone[]>;
}

let snapshot: Snapshot | null = null;
let fetchedAt = 0;
let inflight: Promise<void> | null = null;

type LeanCard = Omit<CardDoc, keyof Document> & Record<string, unknown>;
type LeanRule = Omit<CardRuleDoc, keyof Document> & Record<string, unknown>;
type LeanBestOf = Omit<CardBestOfDoc, keyof Document> & Record<string, unknown>;
type LeanMilestone = Omit<CardMilestoneDoc, keyof Document> &
  Record<string, unknown>;

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
    invitation_only: (doc.invitation_only as boolean) ?? false,
    excluded_categories:
      doc.excluded_categories as MockCard["excluded_categories"],
    transfer_partners:
      (doc.transfer_partners as MockCard["transfer_partners"]) ?? null,
  };
}

function toMockRule(doc: LeanRule): MockRule {
  return {
    _id: doc.ruleKey as string,
    cardId: doc.cardSlug as string,
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

  const [cardDocs, ruleDocs, bestOfDocs, milestoneDocs] = await Promise.all([
    CardAdvisorModel.find({ is_active: true })
      .select(
        "name slug bankName bankId network eligibility fees forex_markup_percentage rewards categories welcome_benefit lounge ideal_for not_ideal_for is_active invitation_only excluded_categories rulesVersion",
      )
      .lean<LeanCard[]>(),
    CardRuleModel.find({ is_active: true })
      .select(
        "ruleKey cardSlug category merchant reward caps shared_cap_group fuel_surcharge_applicable max_fuel_transaction_limit redemption_mode voucher_validity_in_months gv_coins_percentage valid_from valid_until notes is_active",
      )
      .lean<LeanRule[]>(),
    CardBestOfModel.find({})
      .select("cardSlug category rulesVersion payload")
      .lean<LeanBestOf[]>(),
    CardMilestoneModel.find({ is_active: true })
      .select(
        "milestoneKey cardSlug milestone_type milestone_period spend_threshold_inr tier_order mutual_exclusivity_group benefit_type benefit_value_inr",
      )
      .lean<LeanMilestone[]>(),
  ]);

  const cards = cardDocs.map(toMockCard);
  const bestOf = bestOfDocs.map((d) => d.payload as MockBestOf);

  // Staleness check (see CardDoc.rulesVersion): each card bumps rulesVersion on
  // any rule write, and recompute stamps that version into the bestOf payload.
  // A mismatch means the precompute cache lags the live rules — the engine would
  // silently score against stale returns. We keep serving (stale-but-close beats
  // dropping to base-rate-only), but warn loudly so it gets recomputed. Fix with
  // `npm run bestof:recompute` or POST /api/admin/advisor/recompute.
  const cardVersion = new Map(
    cardDocs.map((d) => [d.slug as string, (d.rulesVersion as number) ?? 1]),
  );
  const stale = bestOf.filter((b) => {
    const live = cardVersion.get(b.cardId);
    return live !== undefined && live !== b.rulesVersion;
  });
  if (stale.length > 0) {
    const sample = stale
      .slice(0, 10)
      .map(
        (b) =>
          `${b.cardId}/${b.category} (bestOf v${b.rulesVersion} != card v${cardVersion.get(b.cardId)})`,
      );
    console.warn(
      `[AdvisorCache] ${stale.length} stale CardBestOf payload(s); ` +
        `run 'npm run bestof:recompute'. e.g. ${sample.join(", ")}`,
    );
  }

  const milestonesBySlug = new Map<string, MockMilestone[]>();
  for (const d of milestoneDocs) {
    const m: MockMilestone = {
      milestoneKey: d.milestoneKey as string,
      cardSlug: d.cardSlug as string,
      milestone_type: (d.milestone_type as string | null) ?? null,
      milestone_period:
        (d.milestone_period as MockMilestone["milestone_period"]) ?? null,
      spend_threshold_inr: (d.spend_threshold_inr as number | null) ?? null,
      tier_order: (d.tier_order as number | null) ?? null,
      mutual_exclusivity_group:
        (d.mutual_exclusivity_group as string | null) ?? null,
      benefit_type: (d.benefit_type as MockMilestone["benefit_type"]) ?? null,
      benefit_value_inr: (d.benefit_value_inr as number | null) ?? null,
    };
    const list = milestonesBySlug.get(m.cardSlug);
    if (list) list.push(m);
    else milestonesBySlug.set(m.cardSlug, [m]);
  }

  snapshot = { cards, rules: ruleDocs.map(toMockRule), bestOf, milestonesBySlug };
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

  milestonesBySlug(): Map<string, MockMilestone[]> {
    return snapshot?.milestonesBySlug ?? new Map();
  },

  // Force invalidate (e.g. immediately after an admin write in the same
  // process). Other instances will pick up changes on their next TTL refresh.
  invalidate(): void {
    fetchedAt = 0;
  },
};
