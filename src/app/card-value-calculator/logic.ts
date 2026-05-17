import { CARDS, TRAVEL_OPTIONS } from "./data";
import type {
  CalculatorInputs,
  CalculatorResult,
  CreditCard,
  Insight,
} from "./types";

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const travelMeta = (value: CalculatorInputs["travel"]) =>
  TRAVEL_OPTIONS.find((t) => t.value === value) ?? TRAVEL_OPTIONS[0];

export function computeResult(inputs: CalculatorInputs): CalculatorResult | null {
  const card = CARDS.find((c) => c.id === inputs.cardId);
  if (!card) return null;

  const yearlySpend = inputs.monthlySpend * 12;
  const blendedRate =
    card.rewardRatePct * 0.6 + card.bonusCategoryRatePct * 0.4;
  const rewardsValue = Math.round((yearlySpend * blendedRate) / 100);

  const travel = travelMeta(inputs.travel);
  const totalLoungeVisits =
    card.loungeVisitsDomestic + card.loungeVisitsInternational;
  const usableVisits = inputs.wantsLoungeAccess
    ? Math.round(totalLoungeVisits * travel.loungeUtilization)
    : 0;
  const loungeValue = usableVisits * card.loungeValuePerVisit;

  const milestoneValue =
    yearlySpend >= card.feeWaiverSpend * 0.6 ? card.milestoneBenefitValue : 0;

  const feeWaived = yearlySpend >= card.feeWaiverSpend;
  const annualFee = feeWaived ? 0 : card.annualFee;

  const netValue = rewardsValue + loungeValue + milestoneValue - annualFee;

  const effectiveReturnPct =
    yearlySpend > 0 ? (netValue / yearlySpend) * 100 : 0;

  const scoreRaw =
    (rewardsValue + loungeValue + milestoneValue) /
    Math.max(yearlySpend, 1) *
    100 *
    8;
  const valueScore = clamp(Math.round(scoreRaw + (feeWaived ? 6 : -4)), 5, 99);

  const insights = buildInsights({
    card,
    yearlySpend,
    rewardsValue,
    loungeValue,
    milestoneValue,
    annualFee,
    feeWaived,
    netValue,
    travel: inputs.travel,
    wantsLounge: inputs.wantsLoungeAccess,
    usableVisits,
    totalLoungeVisits,
  });

  return {
    card,
    yearlySpend,
    rewardsValue,
    loungeValue,
    milestoneValue,
    annualFee,
    feeWaived,
    netValue,
    effectiveReturnPct,
    valueScore,
    travelerLabel: travel.label,
    insights,
  };
}

function buildInsights(args: {
  card: CreditCard;
  yearlySpend: number;
  rewardsValue: number;
  loungeValue: number;
  milestoneValue: number;
  annualFee: number;
  feeWaived: boolean;
  netValue: number;
  travel: CalculatorInputs["travel"];
  wantsLounge: boolean;
  usableVisits: number;
  totalLoungeVisits: number;
}): Insight[] {
  const out: Insight[] = [];

  if (args.netValue >= args.card.annualFee * 3) {
    out.push({
      tone: "green",
      title: "This card is excellent for your spending habits",
      body: `You're generating ${formatINR(args.netValue)} of net yearly value — that's ${(
        args.netValue / Math.max(args.card.annualFee, 1)
      ).toFixed(1)}× the annual fee.`,
    });
  } else if (args.netValue > 0) {
    out.push({
      tone: "blue",
      title: "This card pays for itself",
      body: `You break even and earn an extra ${formatINR(args.netValue)} per year. Push spends slightly higher to unlock milestone tiers.`,
    });
  } else {
    out.push({
      tone: "red",
      title: "You may lose money due to annual fees",
      body: `You're losing about ${formatINR(Math.abs(args.netValue))} a year on this card. Consider downgrading or switching.`,
    });
  }

  if (args.feeWaived) {
    out.push({
      tone: "blue",
      title: "You've cleared the fee waiver",
      body: `Annual fee of ${formatINR(args.card.annualFee)} is waived this year — pure upside from here.`,
    });
  } else if (args.yearlySpend / args.card.feeWaiverSpend > 0.75) {
    out.push({
      tone: "yellow",
      title: "You're close to hitting fee waiver",
      body: `Just ${formatINR(args.card.feeWaiverSpend - args.yearlySpend)} more in annual spend will waive your ${formatINR(args.card.annualFee)} fee.`,
    });
  }

  if (
    args.wantsLounge &&
    args.totalLoungeVisits > 0 &&
    args.usableVisits / args.totalLoungeVisits < 0.4
  ) {
    out.push({
      tone: "yellow",
      title: "You are underutilizing your lounge benefits",
      body: `You're using only ${args.usableVisits} of ${args.totalLoungeVisits} available lounge visits — that's free travel value left on the table.`,
    });
  }

  if (!args.wantsLounge && args.totalLoungeVisits >= 8) {
    out.push({
      tone: "blue",
      title: "Hidden lounge benefit on your card",
      body: `Your card includes ${args.totalLoungeVisits} complimentary lounge visits — worth around ${formatINR(args.totalLoungeVisits * args.card.loungeValuePerVisit)} a year.`,
    });
  }

  return out;
}

export function formatINR(value: number): string {
  const sign = value < 0 ? "-" : "";
  const v = Math.abs(Math.round(value));
  return `${sign}₹${v.toLocaleString("en-IN")}`;
}

export function suggestBetterCards(current: CreditCard): CreditCard[] {
  return CARDS.filter((c) => c.id !== current.id)
    .sort((a, b) => b.bonusCategoryRatePct - a.bonusCategoryRatePct)
    .slice(0, 3);
}
