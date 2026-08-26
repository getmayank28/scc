import CardAdvisorModel, { type CardDoc } from "@/models/Card";
import CardRuleModel, { type CardRuleDoc } from "@/models/CardRule";
import CardBestOfModel, { type CardBestOfDoc } from "@/models/CardBestOf";
import CardMilestoneModel, {
  type CardMilestoneDoc,
} from "@/models/CardMilestone";
import dbConnect from "@/lib/utils/dbConnet";
import type { MockCard } from "@/lib/logic/advisor/cards";
import {
  toRuleCaps,
  toSharedCapGroup,
  type MockRule,
} from "@/lib/logic/advisor/rules";
import type { MockBestOf } from "@/lib/logic/advisor/bestOf";
import type { MockMilestone } from "@/lib/logic/advisor/scoring";

// Process-local cache of advisor data. Vercel keeps function instances warm for
// minutes at a time, so this survives across many invocations. On a cold start
// the first request pays the hydrate cost; every warm request after is
// in-memory only.
//
// The snapshot holds cards + bestOf + milestones (~14 MB). Rules are NOT in it
// — see rulesByCategory below — because the active rule set is ~62 MB and no
// single request needs more than a slice of it.
//
// Invalidation: TTL-based (60s). Admin writes update Mongo synchronously; all
// instances pick up changes on their next post-TTL request. That's acceptable
// because rule edits are rare and 60s staleness has no user-visible effect.

const TTL_MS = 60_000;
const STALE_GRACE_MS = 300_000;

interface Snapshot {
  cards: MockCard[];
  bestOf: MockBestOf[];
  milestonesBySlug: Map<string, MockMilestone[]>;
}

let snapshot: Snapshot | null = null;
let fetchedAt = 0;
let inflight: Promise<void> | null = null;

// Rules are cached SEPARATELY from the snapshot, keyed by category, because
// they dwarf everything else: ~81k active rules (~62 MB) against ~14 MB for
// cards + bestOf + milestones combined. Hydrating them eagerly made every cold
// request pay for the whole catalogue even though each engine reads only its
// own handful of categories (travel reads none at all). Keyed by category so a
// food request never pulls the 41k offline/online_shopping rules.
const rulesByCategory = new Map<string, MockRule[]>();
const rulesFetchedAt = new Map<string, number>();
const rulesInflight = new Map<string, Promise<MockRule[]>>();

// The categories each engine can score. Derived from the CATEGORIES.* constants
// each engine references; every engine filters rules with `r.category === X`,
// so fetching exactly these categories is equivalent to filtering the full
// catalogue — not an approximation.
//
// `travel` is absent deliberately: recommendTravelCard/-Advanced take no rules
// argument at all, scoring purely off the CardBestOf precompute.
export const ENGINE_CATEGORIES = {
  food: ["online_food_dining", "offline_food_dining"],
  shopping: [
    "online_shopping",
    "offline_shopping",
    "offline_food_dining",
    "grocery",
    "fuel",
    "utilities",
  ],
  allrounder: [
    "flights",
    "hotels",
    "forex",
    "online_food_dining",
    "offline_food_dining",
    "online_shopping",
    "grocery",
    "fuel",
    "utilities",
    "rent",
    "insurance",
    "fees_taxes",
    "other",
  ],
} as const;

export type EngineName = keyof typeof ENGINE_CATEGORIES;

const RULE_SELECT =
  "ruleKey cardSlug category merchant reward caps shared_cap_group voucher_shared_cap_group fuel_surcharge_applicable max_fuel_transaction_limit redemption_mode voucher_validity_in_months gv_coins_percentage valid_from valid_until is_active";

// Fetch (and memoise) every active rule in one category. Concurrent callers for
// the same category share a single query rather than each issuing their own.
async function loadCategory(category: string): Promise<MockRule[]> {
  const cached = rulesByCategory.get(category);
  const age = Date.now() - (rulesFetchedAt.get(category) ?? 0);
  if (cached && age < TTL_MS) return cached;

  const existing = rulesInflight.get(category);
  if (existing) return existing;

  const p = (async () => {
    await dbConnect();
    const docs = await CardRuleModel.find({ category, is_active: true })
      .select(RULE_SELECT)
      .lean<LeanRule[]>();
    const mapped = docs.map(toMockRule);
    rulesByCategory.set(category, mapped);
    rulesFetchedAt.set(category, Date.now());
    return mapped;
  })().finally(() => {
    rulesInflight.delete(category);
  });

  rulesInflight.set(category, p);
  return p;
}

type LeanCard = Omit<CardDoc, keyof Document> & Record<string, unknown>;
type LeanRule = Omit<CardRuleDoc, keyof Document> & Record<string, unknown>;
type LeanBestOf = Omit<CardBestOfDoc, keyof Document> & Record<string, unknown>;
type LeanMilestone = Omit<CardMilestoneDoc, keyof Document> &
  Record<string, unknown>;

export function toMockCard(doc: LeanCard): MockCard {
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

async function hydrate(): Promise<void> {
  await dbConnect();

  const [cardDocs, bestOfDocs, milestoneDocs] = await Promise.all([
    CardAdvisorModel.find({ is_active: true })
      .select(
        "name slug bankName bankId network eligibility fees forex_markup_percentage rewards categories welcome_benefit lounge ideal_for not_ideal_for is_active invitation_only excluded_categories rulesVersion",
      )
      .lean<LeanCard[]>(),
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

  snapshot = { cards, bestOf, milestonesBySlug };
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

  // Active rules across a set of categories, fetched concurrently and cached
  // per category. Replaces the old `rules()` accessor, which returned the
  // entire 62 MB catalogue from the snapshot.
  async rulesForCategories(categories: readonly string[]): Promise<MockRule[]> {
    const unique = [...new Set(categories)];
    const groups = await Promise.all(unique.map(loadCategory));
    return groups.flat();
  },

  // Every rule an engine needs for one recommendation request. Each engine
  // scores a fixed, statically-known set of categories (see ENGINE_CATEGORIES),
  // so this is exact — not a heuristic subset.
  async rulesForEngine(engine: EngineName): Promise<MockRule[]> {
    return this.rulesForCategories(ENGINE_CATEGORIES[engine]);
  },

  bestOf(): MockBestOf[] {
    return snapshot?.bestOf ?? [];
  },

  milestonesBySlug(): Map<string, MockMilestone[]> {
    return snapshot?.milestonesBySlug ?? new Map();
  },

  // Resolve specific slugs, INCLUDING cards with is_active: false.
  //
  // The hydrated snapshot deliberately holds only active cards, because the
  // advisor recommends cards a user could apply for today. The spend optimizer
  // asks a different question — "which of the cards I already hold should I
  // swipe?" — and users hold discontinued cards (Axis Atlas, HDFC Diners Club
  // Black). Dropping those would silently shrink their wallet, so anything the
  // snapshot lacks is fetched straight from Mongo.
  async cardsBySlugIncludingInactive(slugs: string[]): Promise<MockCard[]> {
    if (slugs.length === 0) return [];
    const bySlug = new Map((snapshot?.cards ?? []).map((c) => [c._id, c]));
    const found = slugs.map((s) => bySlug.get(s)).filter(Boolean) as MockCard[];

    const missing = slugs.filter((s) => !bySlug.has(s));
    if (missing.length === 0) return found;

    await dbConnect();
    const docs = await CardAdvisorModel.find({ slug: { $in: missing } })
      .select(
        "name slug bankName bankId network eligibility fees forex_markup_percentage rewards categories welcome_benefit lounge ideal_for not_ideal_for is_active invitation_only excluded_categories rulesVersion",
      )
      .lean<LeanCard[]>();

    return [...found, ...docs.map(toMockCard)];
  },

  // ── Narrow, on-demand reads for the spend optimizer ────────────────────────
  //
  // The full hydrate pulls ~81k rules (~71 MB) and ~6.5k bestOf payloads
  // (~13 MB). That is a reasonable one-off for the advisor, which scores every
  // card in the catalogue, but ruinous for the spend optimizer, which touches
  // only the handful of cards in one wallet and one category — a cold start was
  // costing minutes. These read exactly that slice instead.

  /** CardBestOf payloads for specific cards in ONE category. */
  async bestOfForCards(
    cardSlugs: string[],
    category: string,
  ): Promise<MockBestOf[]> {
    if (cardSlugs.length === 0) return [];
    // Serve from the snapshot when it is already warm — no query needed.
    if (snapshot) {
      return snapshot.bestOf.filter(
        (b) => b.category === category && cardSlugs.includes(b.cardId),
      );
    }
    await dbConnect();
    const docs = await CardBestOfModel.find({
      cardSlug: { $in: cardSlugs },
      category,
    })
      .select("payload")
      .lean<LeanBestOf[]>();
    return docs.map((d) => d.payload as MockBestOf);
  },

  /** Active rules for specific cards in ONE category. */
  async rulesForCards(
    cardSlugs: string[],
    category: string,
  ): Promise<MockRule[]> {
    if (cardSlugs.length === 0) return [];
    // Reuse the category cache when it is already warm; otherwise query just
    // these cards rather than warming the whole category for a few slugs.
    const cached = rulesByCategory.get(category);
    if (cached && Date.now() - (rulesFetchedAt.get(category) ?? 0) < TTL_MS) {
      const wanted = new Set(cardSlugs);
      return cached.filter((r) => wanted.has(r.cardId));
    }
    await dbConnect();
    const docs = await CardRuleModel.find({
      cardSlug: { $in: cardSlugs },
      category,
      is_active: true,
    })
      .select(RULE_SELECT)
      .lean<LeanRule[]>();
    return docs.map(toMockRule);
  },

  /**
   * Engine categories this merchant has active rules in.
   *
   * Lets the UI stop asking for a category when a merchant is unambiguous
   * (~63% of merchants) and, when it isn't, offer only that merchant's real
   * options instead of the full category list.
   */
  async categoriesForMerchant(merchantSlug: string): Promise<string[]> {
    await dbConnect();
    const cats = await CardRuleModel.distinct("category", {
      merchant: merchantSlug,
      is_active: true,
    });
    return cats as unknown as string[];
  },

  /** Whether any active rule uses this merchant slug — a cheap existence check. */
  async merchantExists(merchantSlug: string): Promise<boolean> {
    await dbConnect();
    const n = await CardRuleModel.countDocuments({
      merchant: merchantSlug,
      is_active: true,
    }).limit(1);
    return n > 0;
  },

  // Force invalidate (e.g. immediately after an admin write in the same
  // process). Other instances will pick up changes on their next TTL refresh.
  invalidate(): void {
    fetchedAt = 0;
  },
};
