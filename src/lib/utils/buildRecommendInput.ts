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

// ── Per-category assemblers ──────────────────────────────────────────────────

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
    // select captured earlier in the journey.
    foodDeliveryPlatformPreference: String(
      single.get("preferred-food-order-platform") ??
        single.get("food-dining-platform-fs") ??
        "others",
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
 * Build the typed engine input for the given category from the journey's user
 * messages. The returned object is validated by the matching Zod schema on the
 * BE (`POST /api/recommend`); this function only shapes typed values, it does
 * not parse free text.
 */
export function buildRecommendInput(
  category: CardsType,
  userMessages: BaseMessage[],
): Record<string, unknown> {
  const { single, multi } = collectAnswers(category, userMessages);

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
