"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { loadCardData } from "@/lib/constants/cards/card_config";
import {
  calculateCardPoints,
  convertPointsToINR,
  initialFoodRecommendationInputs,
} from "@/lib/utils/recommendation";

function getTotalSpend(spendVector:{category:string;spend:number;}[]) {
  return spendVector.reduce((sum, bucket) => sum + bucket.spend, 0);
}

// @ts-expect-error some
function calculateMilestonePoints(card, totalSpend:number) {
  if (!card.milestones) return 0;

  let milestoneValueInINR = 0;

  for (const milestone of card.milestones) {
    if (totalSpend >= milestone.spend_threshold_inr) {
      milestoneValueInINR += milestone.reward_value_inr;
    }
  }

  return milestoneValueInINR;
}

const deliveryOptions = [
  { label: "Rarely or never", value: 1 },
  { label: "1–2 times a week", value: 6 },
  { label: "3–5 times a week", value: 16 },
  { label: "Almost daily", value: 25 },
];

const diningOptions = [
  { label: "Rarely or never", value: 1 },
  { label: "1–2 times a month", value: 2 },
  { label: "3–5 times a month", value: 6 },
  { label: "2-3 times Every week or more", value: 14 },
];

const platformOptions = [
  { label: "Zomato", value: "monstly_zomato" },
  { label: "Swiggy", value: "monstly_swiggy" },
  { label: "Both equally", value: "both_equal" },
  { label: "No preference", value: "no_preference" },
];

const RecommendationEngine = () => {
  const cards = loadCardData();

  const [formData, setFormData] = useState({
    weekly_delivery_food_average: "",
    monthly_dining_out_avaerage: "",
    food_prefered_platform: "",
  });

  const [results, setResults] = useState([]);
// @ts-expect-error some
  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const runRecommendation = () => {
    // @ts-expect-error some
    const annualInputs = initialFoodRecommendationInputs(formData);
    const totalSpend = getTotalSpend(annualInputs);

    const calculated = cards.map((card) => {
      const points = calculateCardPoints(card, annualInputs);
          // @ts-expect-error some
      const inrValue = convertPointsToINR(points, card?.redemption);
      const milestone = calculateMilestonePoints(card, totalSpend);

      return {
            // @ts-expect-error some
        card: card?.meta?.card_id,
        totalSpend,
        totalPointsReward: points,
        totalPointRewardValueInINR: inrValue,
        totalMilestoneRewards: milestone,
        totalRewards: inrValue + milestone,
      };
    });
    // @ts-expect-error some
    setResults(calculated.sort((a, b) => b.totalRewards - a.totalRewards));
  };
  return (
    <div className="p-20 space-y-6 max-w-xl">

      {/* Delivery */}
      <div className="space-y-2">
        <Label className="text-white font-semibold">
          Food delivery frequency
        </Label>

        <Select
          value={formData.weekly_delivery_food_average}
          onValueChange={(v) =>
            handleChange("weekly_delivery_food_average", v)
          }
        >
          <SelectTrigger className="h-12 text-white">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>

          <SelectContent >
            {deliveryOptions.map((o) => (
              //  @ts-expect-error some
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dining */}
      <div className="space-y-2">
        <Label className="text-white font-semibold">
          Dining out frequency
        </Label>

        <Select
          value={formData.monthly_dining_out_avaerage}
          onValueChange={(v) =>
            handleChange("monthly_dining_out_avaerage", v)
          }
        >
          <SelectTrigger className="h-12 text-white">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>

          <SelectContent>
            {diningOptions.map((o) => (
                  // @ts-expect-error some
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Platform */}
      <div className="space-y-2">
        <Label className="text-white font-semibold">
          Preferred platform
        </Label>

        <Select
          value={formData.food_prefered_platform}
          onValueChange={(v) =>
            handleChange("food_prefered_platform", v)
          }
        >
          <SelectTrigger className="h-12 text-white">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>

          <SelectContent>
            {platformOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={runRecommendation} className="w-full">
        Calculate Best Cards
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4 pt-6">
          {results.map((r) => (
            <div
                // @ts-expect-error some
              key={r.card}
              className="p-4 rounded-xl border text-white"
            >
                 {/* @ts-expect-error some */}
              <h3 className="font-semibold">{r.card}</h3>
              {/* @ts-expect-error some */}
              <p>Total Spend: ₹{r.totalSpend}</p>
               {/* @ts-expect-error some */}
              <p>Total Points earned: {r.totalPointsReward}</p>
               {/* @ts-expect-error some */}
              <p>Total Points Reward Value in INR: ₹{r.totalPointRewardValueInINR}</p>
               {/* @ts-expect-error some */}
              <p>Toatl Milestone Rewards in INR: ₹{r.totalMilestoneRewards}</p>

              <p className="font-bold text-green-500">
                 {/* @ts-expect-error some */}
                Total Rewards: ₹{r.totalRewards}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationEngine;