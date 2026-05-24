export type TravelMix =
  | "only_domestic"
  | "mostly_domestic"
  | "balanced"
  | "mostly_international";

export interface TravelCardPhaseOneInput {
  tripsPerYear: number;
  travelMix: TravelMix;
  avgSpendPerTrip: number;
}

export interface CategorySplit {
  flights: number;
  hotels: number;
  other: number;
}

export interface TravelCardPhaseOneOutput {
  annualTravelSpend: number;
  split: {
    domestic: number;
    international: number;
    domesticPercentage: number;
    internationalPercentage: number;
  };
  categorySpend: {
    domestic: CategorySplit;
    international: CategorySplit;
  };
  bookings: {
    domestic: number;
    international: number;
  };
  forex: {
    applicableSpend: number;
    gstPercentage: number;
  };
}

const GST_ON_FOREX = 0.18;

const MIX_SPLIT: Record<
  TravelMix,
  { domestic: number; international: number }
> = {
  only_domestic: { domestic: 1.0, international: 0.0 },
  mostly_domestic: { domestic: 0.7, international: 0.3 },
  balanced: { domestic: 0.5, international: 0.5 },
  mostly_international: { domestic: 0.3, international: 0.7 },
};

const DOMESTIC_CATEGORY_SPLIT: CategorySplit = {
  flights: 0.35,
  hotels: 0.45,
  other: 0.2,
};

const INTERNATIONAL_CATEGORY_SPLIT: CategorySplit = {
  flights: 0.45,
  hotels: 0.35,
  other: 0.2,
};

function allocate(total: number, split: CategorySplit): CategorySplit {
  return {
    flights: total * split.flights,
    hotels: total * split.hotels,
    other: total * split.other,
  };
}

export function travelCardPhaseOneRecommendation(
  input: TravelCardPhaseOneInput,
): TravelCardPhaseOneOutput {
  const { tripsPerYear, travelMix, avgSpendPerTrip } = input;

  const annualTravelSpend = tripsPerYear * avgSpendPerTrip;

  const travelSplit = MIX_SPLIT[travelMix];
  const domesticSpend = annualTravelSpend * travelSplit.domestic;
  const internationalSpend = annualTravelSpend * travelSplit.international;

  const domesticCategory = allocate(domesticSpend, DOMESTIC_CATEGORY_SPLIT);
  const internationalCategory = allocate(
    internationalSpend,
    INTERNATIONAL_CATEGORY_SPLIT,
  );

  const forexApplicableSpend = internationalCategory.other;

  const domesticBookings = tripsPerYear * travelSplit.domestic;
  const internationalBookings = tripsPerYear * travelSplit.international;

  return {
    annualTravelSpend,
    split: {
      domestic: domesticSpend,
      international: internationalSpend,
      domesticPercentage: travelSplit.domestic * 100,
      internationalPercentage: travelSplit.international * 100,
    },
    categorySpend: {
      domestic: domesticCategory,
      international: internationalCategory,
    },
    bookings: {
      domestic: domesticBookings,
      international: internationalBookings,
    },
    forex: {
      applicableSpend: forexApplicableSpend,
      gstPercentage: GST_ON_FOREX * 100,
    },
  };
}
