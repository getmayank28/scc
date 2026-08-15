import { BaseMessage } from "@/types/chatMessages";
import { CardsType } from "@/types/card";
import { cardCategoryJourneyData } from "@/lib/constants/chatJourney";
import { CARD_CATEGORY } from "@/lib/data/cards";

// A flat view of a journey question, including FORM inner inputs, keyed by its
// m_id (== the questionId stored on user answers).
type QuestionIndex = Map<string, BaseMessage>;

function indexQuestions(category: CardsType): QuestionIndex {
  const index: QuestionIndex = new Map();
  const questions = cardCategoryJourneyData[category] ?? [];
  for (const q of questions) {
    index.set(q.m_id, q);
    if (q.inputs?.length) {
      for (const inner of q.inputs) {
        index.set(inner.m_id, inner as BaseMessage);
      }
    }
  }
  return index;
}

// The typed value the engine wants for a given answer: the matching slot's
// `engineValue` when present, else the raw slot value / slider number.
function engineValueFor(
  question: BaseMessage | undefined,
  answer: string | number,
): string | number {
  const slot = question?.slots?.find((s) => String(s.value) === String(answer));
  if (slot?.engineValue !== undefined) return slot.engineValue;
  return answer;
}

function toNumber(value: string | number | undefined, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Collapse the journey's user messages into a lookup of typed answers by
 * questionId. Reads FORM per-field values from `formValues`, and maps
 * select/multi-select answers to their slot `engineValue`.
 */
function collectAnswers(
  category: CardsType,
  userMessages: BaseMessage[],
): {
  single: Map<string, string | number>;
  multi: Map<string, (string | number)[]>;
} {
  const questions = indexQuestions(category);
  const single = new Map<string, string | number>();
  const multi = new Map<string, (string | number)[]>();

  for (const msg of userMessages) {
    const qid = msg.questionId;
    if (!qid) continue;
    const question = questions.get(qid);

    // FORM answers carry raw per-field values keyed by inner input m_id.
    if (msg.formValues) {
      for (const [innerId, raw] of Object.entries(msg.formValues)) {
        single.set(innerId, engineValueFor(questions.get(innerId), raw));
      }
      continue;
    }

    const content = msg.content ?? "";

    // Multi-select answers are a comma-separated list of slot values.
    if (question?.type === "MultiSelect") {
      const parts = content
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      multi.set(
        qid,
        parts.map((p) => engineValueFor(question, p)),
      );
      continue;
    }

    single.set(qid, engineValueFor(question, content));
  }

  return { single, multi };
}

function dedupeEnums<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

// The journey submits twice: once early (phase 1) and again after the fine-tune
// questions (phase 2). Each phase has its own engine and its own Zod schema, so
// each needs its own payload — phase 1 must never be padded with invented
// phase-2 defaults.
export type RecommendPhase = 1 | 2;

// ── Per-category assemblers: phase 1 ─────────────────────────────────────────

function buildTravelPhaseOne(single: Map<string, string | number>) {
  return {
    tripsPerYear: toNumber(
      single.get("domestic-international-holidays-trips"),
      2,
    ),
    travelMix: String(single.get("total-travel-spend") ?? "only_domestic"),
    avgSpendPerTrip: toNumber(single.get("spend-per-holiday"), 40000),
  };
}

function buildFoodPhaseOne(single: Map<string, string | number>) {
  return {
    onlineFoodDeliveryFrequency: toNumber(
      single.get("online-food-order-frequency-fs"),
      1,
    ),
    diningOutFrequency: toNumber(single.get("dine-out-frequency-fs"), 1),
    foodDeliveryPlatformPreference: String(
      single.get("food-dining-platform-fs") ?? "none",
    ),
  };
}

// `mostly-shopping` slots carry no engineValue, so map the raw slot text onto
// the phase-1 enum here.
const SHOPPING_PREFERENCE_BY_ANSWER: Record<string, string> = {
  "Mostly online (more than 70% online)": "online",
  "Mix of online and offline ( Approx. 50-50)": "equal",
  "Mostly offline ( more than 70% offline)": "offline",
};

function buildShoppingPhaseOne(
  single: Map<string, string | number>,
  multi: Map<string, (string | number)[]>,
) {
  const answer = String(single.get("mostly-shopping") ?? "");
  return {
    monthlySpend: toNumber(single.get("average-shopping-spend"), 20000),
    shoppingPreference: SHOPPING_PREFERENCE_BY_ANSWER[answer] ?? "equal",
    preferredOnlinePlatform: dedupeEnums(
      (multi.get("preferred-shopping-online-platform") ?? []).map(String),
    ),
  };
}

// `most-spend-category` slots carry no engineValue either.
const SPEND_CATEGORY_BY_ANSWER: Record<string, string> = {
  Travel: "travel",
  "Food & Dining": "foodAndDining",
  "Online Shopping": "onlineShopping",
  "Utility Bills": "utilityBills",
  Fuel: "fuel",
  "Rent / Insurance / Fees": "rentInsuranceFees",
};

function buildAllrounderPhaseOne(
  single: Map<string, string | number>,
  multi: Map<string, (string | number)[]>,
) {
  const monthlyTotal = toNumber(single.get("monthly-spend"), 50000);
  return {
    averageTotalMonthlySpend: monthlyTotal,
    averageOnlineMonthlySpend: toNumber(
      single.get("online-spend"),
      Math.round(monthlyTotal * 0.6),
    ),
    mostSpendCategory: dedupeEnums(
      (multi.get("most-spend-category") ?? [])
        .map((v) => SPEND_CATEGORY_BY_ANSWER[String(v)])
        .filter(Boolean),
    ),
  };
}

// ── Per-category assemblers: phase 2 ─────────────────────────────────────────

// Phase 2's delivery enum is swiggy | zomato | others — it has no "both"/"none"
// (phase 1 splits those 50/50 and 100%-fallback respectively). Anything that
// isn't an explicit single-platform answer narrows to "others".
function toPhaseTwoDeliveryPreference(value: string | number | undefined) {
  return value === "swiggy" || value === "zomato" ? value : "others";
}

function buildTravel(
  single: Map<string, string | number>,
  multi: Map<string, (string | number)[]>,
) {
  const travelMix = String(single.get("total-travel-spend") ?? "only_domestic");
  const isOnlyDomestic = travelMix === "only_domestic";

  return {
    tripsPerYear: toNumber(
      single.get("domestic-international-holidays-trips"),
      2,
    ),
    avgSpendPerTrip: toNumber(single.get("spend-per-holiday"), 40000),
    totalInternationalTrip: isOnlyDomestic
      ? 0
      : toNumber(single.get("international-holiday-trip"), 0),
    avgInternationalSpendPerTrip: isOnlyDomestic
      ? 0
      : toNumber(single.get("per-international-trip-spend"), 0),
    additionalFlightSpend: toNumber(single.get("additional-flights"), 0),
    travelPriority: dedupeEnums(
      (multi.get("travel-priority") ?? []).map(String),
    ),
  };
}

function buildFood(single: Map<string, string | number>) {
  return {
    onlineFoodDeliveryFrequency: toNumber(
      single.get("online-food-order-frequency-fs"),
      1,
    ),
    diningOutFrequency: toNumber(single.get("dine-out-frequency-fs"), 1),
    onlineFoodDeliveryAverageSpend: toNumber(
      single.get("per-online-food-order-fs"),
      700,
    ),
    diningOutAverageSpend: toNumber(single.get("dining-out-average-bill-fs"), 2000),
    // Prefer the explicit FORM answer; fall back to the delivery-preference
    // select captured earlier in the journey. That earlier select is a phase-1
    // question, so its "both"/"none" answers have no phase-2 equivalent and
    // narrow to "others".
    foodDeliveryPlatformPreference: toPhaseTwoDeliveryPreference(
      single.get("preferred-food-order-platform") ??
        single.get("food-dining-platform-fs"),
    ),
    diningOutPlatformPreference: String(
      single.get("preferred-dining-platform") ?? "others",
    ),
  };
}

function buildShopping(
  single: Map<string, string | number>,
  multi: Map<string, (string | number)[]>,
) {
  const monthlySpend = toNumber(single.get("average-shopping-spend"), 20000);
  const hasUtility = String(single.get("utility-bill-payments-spend")) === "yes";

  return {
    monthlySpend,
    preferredOnlinePlatform: dedupeEnums(
      (multi.get("preferred-shopping-online-platform") ?? []).map(String),
    ),
    totalOnlineShoppingMonthlySpend: toNumber(
      single.get("online-shopping-percentage"),
      Math.round(monthlySpend * 0.6),
    ),
    additionalUtilityBills: hasUtility,
    additionalUtilityBillsMonthlySpend: hasUtility
      ? toNumber(single.get("payments-monthly-spend"), 0)
      : 0,
  };
}

function buildAllrounder(single: Map<string, string | number>) {
  const monthlyTotal = toNumber(single.get("monthly-spend"), 50000);
  return {
    averageTotalMonthlySpend: monthlyTotal,
    averageOnlineMonthlySpend: toNumber(
      single.get("online-spend"),
      Math.round(monthlyTotal * 0.6),
    ),
    annualTravelSpend: toNumber(single.get("yearly-travel-spend"), 0),
    monthlyDining: toNumber(single.get("food-and-dining"), 0),
    monthlyBills: toNumber(single.get("bill-payments"), 0),
    monthlyOnlineShopping: toNumber(single.get("online-shopping"), 0),
    monthlyFuel: toNumber(single.get("fuel"), 0),
    monthlyRentInsuranceFees: toNumber(single.get("taxes-insurance-rent"), 0),
  };
}

/**
 * Build the typed engine input for the given category and phase from the
 * journey's user messages. The returned object is validated by the matching
 * Zod schema on the BE (`POST /api/recommend`); this function only shapes
 * typed values, it does not parse free text.
 *
 * Phase 1 is the early submit (few answers, engine models the spend); phase 2
 * runs only after the fine-tune questions supply declared per-bill amounts.
 */
export function buildRecommendInput(
  category: CardsType,
  phase: RecommendPhase,
  userMessages: BaseMessage[],
): Record<string, unknown> {
  const { single, multi } = collectAnswers(category, userMessages);

  if (phase === 1) {
    switch (category) {
      case CARD_CATEGORY.TRAVEL:
        return buildTravelPhaseOne(single);
      case CARD_CATEGORY.FOOD:
        return buildFoodPhaseOne(single);
      case CARD_CATEGORY.SHOPPING:
        return buildShoppingPhaseOne(single, multi);
      case CARD_CATEGORY.ALL_ROUNDER:
      default:
        return buildAllrounderPhaseOne(single, multi);
    }
  }

  switch (category) {
    case CARD_CATEGORY.TRAVEL:
      return buildTravel(single, multi);
    case CARD_CATEGORY.FOOD:
      return buildFood(single);
    case CARD_CATEGORY.SHOPPING:
      return buildShopping(single, multi);
    case CARD_CATEGORY.ALL_ROUNDER:
      return buildAllrounder(single);
    default:
      return buildAllrounder(single);
  }
}
