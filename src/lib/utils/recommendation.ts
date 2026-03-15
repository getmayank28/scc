import { RECOMMENDATION_CATEGORY_RESOLUTION } from "./recommendationCategoryResolution";

interface FoodRecommendationProps {
  weekly_delivery_food_average: number;
  monthly_dining_out_avaerage: number;
  food_prefered_platform:
    | "monstly_swiggy"
    | "monstly_zomato"
    | "both_equal"
    | "no_preference";
}

const getFoodPreferedPlatformRatio = (
  platform:
    | "monstly_swiggy"
    | "monstly_zomato"
    | "both_equal"
    | "no_preference",
  annually_delivery_food_average: number,
  annually_dining_out_avaerage: number,
) => {
  switch (platform) {
    case "monstly_swiggy":
      return [
        {
          category: "food_delivery_swiggy",
          spend: 0.75 * annually_delivery_food_average,
        },
        {
          category: "food_delivery",
          spend: 0.25 * annually_delivery_food_average,
        },
        {
          category: "food_dining_swiggy",
          spend: 0.75 * annually_dining_out_avaerage,
        },
        {
          category: "food_dining",
          spend: 0.25 * annually_dining_out_avaerage,
        },
      ];

    case "monstly_zomato":
      return [
        {
          category: "food_delivery_zomato",
          spend: 0.75 * annually_delivery_food_average,
        },
        {
          category: "food_delivery",
          spend: 0.25 * annually_delivery_food_average,
        },
        {
          category: "food_dining_zomato",
          spend: 0.75 * annually_dining_out_avaerage,
        },
        {
          category: "food_dining",
          spend: 0.25 * annually_dining_out_avaerage,
        },
      ];

    case "both_equal":
      return [
        {
          category: "food_delivery_zomato",
          spend: 0.5 * annually_delivery_food_average,
        },
        {
          category: "food_delivery_swiggy",
          spend: 0.5 * annually_delivery_food_average,
        },
        {
          category: "food_dining_zomato",
          spend: 0.5 * annually_dining_out_avaerage,
        },
        {
          category: "food_dining_swiggy",
          spend: 0.5 * annually_dining_out_avaerage,
        },
      ];

    case "no_preference":
      return [
        {
          category: "food_delivery",
          spend: annually_delivery_food_average,
        },
        {
          category: "food_dining",
          spend: annually_dining_out_avaerage,
        },
      ];
  }
};

export const initialFoodRecommendationInputs = ({
  weekly_delivery_food_average,
  monthly_dining_out_avaerage,
  food_prefered_platform,
}: FoodRecommendationProps) => {
  //calculate monthly frequency
  const monthly_delivery_food_average = weekly_delivery_food_average * 4;

  // assumptions(inr)
  const average_delivery_food_order_value = 500;
  const average_dining_out_order_value = 2000;

  //calculate annual spend
  const annual_delivery_spend =
    monthly_delivery_food_average * average_delivery_food_order_value * 12;
  const annual_dining_spend =
    monthly_dining_out_avaerage * average_dining_out_order_value * 12;

  const food_prefered_platform_allocation = getFoodPreferedPlatformRatio(
    food_prefered_platform,
    annual_delivery_spend,
    annual_dining_spend,
  );

  return food_prefered_platform_allocation;
};

// @ts-expect-error some
export function resolveRecommendationCardRule(cardRules, spendCategory) {
  // @ts-expect-error some
  const fallbackChain = RECOMMENDATION_CATEGORY_RESOLUTION[spendCategory];

  for (const category of fallbackChain) {
    // @ts-expect-error some
    const rule = cardRules.find((r) => r.category === category);

    if (rule) return rule;
  }

  return null;
}
// @ts-expect-error some
export function calculateCardPoints(card, spendVector) {
  let totalPoints = 0;

  for (const spendBucket of spendVector) {
    const rule = resolveRecommendationCardRule(
      card.rules,
      spendBucket.category,
    );

    if (!rule) continue;

    const units = spendBucket.spend / rule.spend_unit_inr;

    const points = units * rule.points_per_unit;

    totalPoints += points;
  }
  return totalPoints;
}
// @ts-expect-error some
export function convertPointsToINR(points, redemptions) {
  // @ts-expect-error some
  const defaultRedemption = redemptions.find((r) => r.engine_default === true);

  if (!defaultRedemption) {
    throw new Error("No engine_default redemption found");
  }

  const valuePerPoint = defaultRedemption.value_per_point_inr;

  return points * valuePerPoint;
}
