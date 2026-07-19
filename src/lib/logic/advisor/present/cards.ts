import type { MockCard } from "../cards";
import type {
  CardTravelReturn,
  TravelEngineAdvancedResult,
} from "../engine";
import type {
  CardFoodReturn,
  FoodCardEngineResultTwo,
} from "../foodCardEngine";
import type {
  CardShoppingReturnTwo,
  ShoppingCardEngineResultTwo,
} from "../shoppingCardEngine";
import type {
  CardAllRounderReturn,
  AllRounderEnginePhaseTwoResult,
} from "../allrounderEngine";
import type { BotRecommendationCreditCardProps } from "@/types/card";

// The subset of engine card-return shapes that share the fields we display.
type AnyCardReturn =
  | CardTravelReturn
  | CardFoodReturn
  | CardShoppingReturnTwo
  | CardAllRounderReturn;

export type RecommendCategory =
  | "travel"
  | "food"
  | "shopping"
  | "allrounder";

export type EngineResult =
  | TravelEngineAdvancedResult
  | FoodCardEngineResultTwo
  | ShoppingCardEngineResultTwo
  | AllRounderEnginePhaseTwoResult;

const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function formatInr(value: number): string {
  return `₹${INR.format(Math.max(0, Math.round(value)))}`;
}

// Every engine row now carries finalReturnInr (spend return + milestones −
// fees) — prefer it so the chat ranks the same way the engines sort. Fall back
// to the older per-engine metrics for any payload predating the field.
function annualReturn(card: AnyCardReturn): number {
  if (typeof card.finalReturnInr === "number") return card.finalReturnInr;
  return "netReturnInr" in card ? card.netReturnInr : card.annualReturnInr;
}

function annualSpend(card: AnyCardReturn): number {
  if ("annualSpend" in card) return card.annualSpend;
  // Travel: sum of the segment spends the engine already computed.
  const t = card as CardTravelReturn;
  return (
    t.domestic.totalSpend +
    t.international.totalSpend +
    (t.extraFlights?.totalSpend ?? 0)
  );
}

function returnOnSpend(card: AnyCardReturn): string {
  if ("effectiveRatePercentage" in card) {
    return card.effectiveRatePercentage.toFixed(1);
  }
  const spend = annualSpend(card);
  const rate = spend > 0 ? (annualReturn(card) / spend) * 100 : 0;
  return rate.toFixed(1);
}

// A ", "-joined string of per-stream returns; the modal splits it on ", ".
function categoryWiseReward(
  category: RecommendCategory,
  card: AnyCardReturn,
): string {
  const parts: string[] = [];
  const push = (label: string, inr: number) => {
    if (inr > 0) parts.push(`${label} ${formatInr(inr)}`);
  };

  switch (category) {
    case "travel": {
      const t = card as CardTravelReturn;
      push("Domestic", t.domestic.totalReturnInr);
      push("International", t.international.totalReturnInr);
      if (t.extraFlights) push("Extra flights", t.extraFlights.totalReturnInr);
      if (t.forex.totalCostInr > 0)
        parts.push(`Forex cost ${formatInr(t.forex.totalCostInr)}`);
      break;
    }
    case "food": {
      const f = card as CardFoodReturn;
      push("Delivery", f.delivery.returnInr);
      push("Dining", f.dining.returnInr);
      break;
    }
    case "shopping": {
      const s = card as CardShoppingReturnTwo;
      push("Online", s.online.returnInr);
      push("Offline", s.offline.returnInr);
      break;
    }
    case "allrounder": {
      const a = card as CardAllRounderReturn;
      for (const bucket of Object.values(a.buckets)) {
        push(String(bucket.bucket), bucket.totalReturnInr);
      }
      break;
    }
  }

  return parts.length ? parts.join(", ") : "Rewards across your spend";
}

function annualFeeText(card: MockCard | undefined): string {
  if (!card) return "—";
  if (card.fees.is_lifetime_free) return "0 (Lifetime free)";
  const fee = card.fees.annual_inr;
  if (fee <= 0) return "0";
  if (card.fees.waiver_spend_inr > 0) {
    return `${INR.format(fee)} (waived on ₹${INR.format(
      card.fees.waiver_spend_inr,
    )} spend)`;
  }
  return `${INR.format(fee)}`;
}

function whyThisCard(card: MockCard | undefined, returnRate: string): string {
  const reasons = card?.ideal_for?.slice(0, 2).join("; ");
  const base = `Delivers a ${returnRate}% effective return on your annual spend.`;
  return reasons ? `${base} ${reasons}.` : base;
}

function notIdealFor(card: MockCard | undefined): string {
  const reasons = card?.not_ideal_for?.slice(0, 2).join("; ");
  return reasons || "—";
}

/**
 * Map an engine result's best-first `byCard` (top 3) to the UI card shape the
 * chat renders. Relative "annual loss" is measured against the best card, so
 * the top card is always 0. Always returns an array (possibly empty).
 */
export function toRecommendationCards(
  category: RecommendCategory,
  result: EngineResult,
  catalog: MockCard[],
): BotRecommendationCreditCardProps[] {
  const byCard = result.byCard as AnyCardReturn[];
  if (!byCard.length) return [];

  const catalogById = new Map(catalog.map((c) => [c._id, c]));
  const bestReturn = annualReturn(byCard[0]);

  return byCard.slice(0, 3).map((card) => {
    const catalogCard = catalogById.get(card.cardId);
    const loss = Math.max(0, bestReturn - annualReturn(card));
    const rate = returnOnSpend(card);

    return {
      id: card.cardId,
      cardName: card.cardName,
      // Best card => "0" so ChatCard shows "Maximum" only when empty; keep an
      // explicit "0" for the top card and a formatted delta for the rest.
      netAnnualRewardLoss: loss > 0 ? formatInr(loss) : "0",
      returnOnSpend: rate,
      categoryWiseReward: categoryWiseReward(category, card),
      whyThisCard: whyThisCard(catalogCard, rate),
      annualFee: annualFeeText(catalogCard),
      notIdealFor: notIdealFor(catalogCard),
      applyLink: "", // resolved lazily client-side from `id`
    };
  });
}
