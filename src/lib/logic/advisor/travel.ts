export type TravelMix =
  | "only_domestic"
  | "mostly_domestic"
  | "balanced"
  | "mostly_international";

export type TravelPriority = "loungeAccess" | "lowForex" | "maximumRewards";

export interface TravelCardPhaseOneInput {
  tripsPerYear: number;
  travelMix: TravelMix;
  avgSpendPerTrip: number;
}

export interface TravelCardPhaseTwoInput {
  tripsPerYear: number;
  avgSpendPerTrip: number;
  totalInternationalTrip: number;
  avgInternationalSpendPerTrip: number;
  additionalFlightSpend: number;
  travelPriority: TravelPriority[];
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

export interface TravelCardPhaseTwoOutput {
  annualTravelSpend: number;
  split: {
    domestic: number;
    international: number;
    extraFlights: number;
    domesticPercentage: number;
    internationalPercentage: number;
  };
  categorySpend: {
    domestic: CategorySplit;
    international: CategorySplit;
    extraFlights: CategorySplit;
  };
  bookings: {
    domestic: number;
    international: number;
    // For extra flights we don't have trips; we use the spread (months) as
    // the cap horizon so monthly caps reset that many times.
    extraFlightsSpreadMonths: number;
  };
  forex: {
    applicableSpend: number;
    gstPercentage: number;
  };
  additionalFlightSpend: number;
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

const EXTRA_FLIGHTS_CATEGORY_SPLIT: CategorySplit = {
  flights: 1.0,
  hotels: 0,
  other: 0,
};

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

// Additional flight spend lands in lumpy bursts; the spread (months) determines
// how many monthly cap periods can absorb it.
export function additionalFlightSpreadMonths(spend: number): number {
  if (spend <= 0) return 0;
  if (spend <= 40000) return 2;
  if (spend <= 90000) return 3;
  if (spend <= 150000) return 5;
  if (spend <= 300000) return 8;
  return 12;
}

export function travelCardPhaseTwoRecommendation(
  input: TravelCardPhaseTwoInput,
): TravelCardPhaseTwoOutput {
  const {
    tripsPerYear,
    avgSpendPerTrip,
    totalInternationalTrip,
    avgInternationalSpendPerTrip,
    additionalFlightSpend,
  } = input;

  const domesticTrips = tripsPerYear - totalInternationalTrip;

  const internationalPercentage =
    tripsPerYear > 0 ? (totalInternationalTrip / tripsPerYear) * 100 : 0;
  const domesticPercentage = 100 - internationalPercentage;

  const internationalSpend =
    totalInternationalTrip * avgInternationalSpendPerTrip;
  const domesticSpend = domesticTrips * avgSpendPerTrip;
  const extraFlights = Math.max(0, additionalFlightSpend);
  const annualTravelSpend = domesticSpend + internationalSpend + extraFlights;

  const domesticCategory = allocate(domesticSpend, DOMESTIC_CATEGORY_SPLIT);
  const internationalCategory = allocate(
    internationalSpend,
    INTERNATIONAL_CATEGORY_SPLIT,
  );
  const extraFlightsCategory = allocate(
    extraFlights,
    EXTRA_FLIGHTS_CATEGORY_SPLIT,
  );

  return {
    annualTravelSpend,
    split: {
      domestic: domesticSpend,
      international: internationalSpend,
      extraFlights,
      domesticPercentage,
      internationalPercentage,
    },
    categorySpend: {
      domestic: domesticCategory,
      international: internationalCategory,
      extraFlights: extraFlightsCategory,
    },
    bookings: {
      domestic: domesticTrips,
      international: totalInternationalTrip,
      extraFlightsSpreadMonths: additionalFlightSpreadMonths(extraFlights),
    },
    forex: {
      applicableSpend: internationalCategory.other,
      gstPercentage: GST_ON_FOREX * 100,
    },
    additionalFlightSpend: extraFlights,
  };
}
