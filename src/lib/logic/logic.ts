import { BENEFIT_TYPES, cardRules } from "../../lib/constants";

// Define types for better type safety
type CardType = keyof typeof cardRules;
type Category = string;
type Spend = string;

interface Rule {
  type: string;
  value?: number;
  per?: number;
  thresholds?: Array<{ min: number; value: number }>;
  percent?: number;
  minSpend?: number;
  maxBenefit?: number;
}

interface BreakdownItem {
  name: string;
  benefit: string;
}

interface CalculationResult {
  breakdown: BreakdownItem[];
  total: string;
  cardType: string;
}

// Universal benefit calculator
function calculateBenefit(
  cardType: CardType,
  category: Category,
  spend: Spend
): number {
  const spendValue = Number(spend);
  const cardRule = cardRules[cardType];
  if (!cardRule) return 0;

  const rule = cardRule[category as keyof typeof cardRule] as Rule;
  if (!rule) return 0;

  switch (rule.type) {
    case BENEFIT_TYPES.PERCENTAGE_OF_SPEND:
      return spendValue * ((rule.value || 0) / 100);
    case BENEFIT_TYPES.PER_SPEND_BLOCK:
      return Math.floor(spendValue / (rule.per || 1)) * (rule.value || 0);
    case BENEFIT_TYPES.FIXED_DISCOUNT:
      let discount = 0;
      if (rule.thresholds) {
        rule.thresholds.forEach((t) => {
          if (spendValue >= t.min) discount = t.value;
        });
      }
      return discount;
    case BENEFIT_TYPES.PERCENTAGE_WITH_CAP:
      if (spendValue < (rule.minSpend || 0)) return 0;
      return Math.min(
        spendValue * ((rule.percent || 0) / 100),
        rule.maxBenefit || 0
      );
    case BENEFIT_TYPES.NO_BENEFIT:
      return 0;
    default:
      return 0;
  }
}

// Calculate for a given card type
export function calculateTotal(
  cardType: CardType,
  spends: Record<Category, Spend>
): CalculationResult {
  let total = 0;
  const breakdown: BreakdownItem[] = Object.keys(spends).map((item) => {
    const benefit = calculateBenefit(cardType, item, spends[item]);
    total += benefit;
    return { name: item, benefit: benefit.toFixed(2) };
  });

  return { cardType: cardType, breakdown, total: total.toFixed(2) };
}

// Example usage

// console.log("Card C benefits:", calculateTotal("C", spendCategories));
// console.log("Card E benefits:", calculateTotal("E", spendCategories));
