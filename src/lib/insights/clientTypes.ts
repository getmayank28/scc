// Client-side mirror of the insights payload. Dates arrive as ISO strings over
// the wire, so the client shape differs from the server's `Insight`.

export type InsightKind =
  | "milestone"
  | "reward_cap"
  | "fee_waiver"
  | "unused_benefit";

export type Urgency = "critical" | "high" | "moderate" | "info";

export interface ClientInsight {
  id: string;
  kind: InsightKind;
  cardSlug: string;
  cardName: string;
  title: string;
  detail: string;
  action: string;
  valueAtRiskInr: number;
  deadline: string | null;
  daysRemaining: number | null;
  progress: number | null;
  progressLabel: string | null;
  periodElapsed: number | null;
  urgency: Urgency;
  score: number;
}

export interface RewardPoints {
  totalPoints: number;
  eligibleSpendInr: number;
  valueInr: number;
  pointsThisMonth: number;
  byCard: Record<string, number>;
  monthByCard: Record<string, number>;
}

export interface InsightsPayload {
  insights: ClientInsight[];
  totalAtRiskInr: number;
  rewardPoints: RewardPoints;
  cards: { slug: string; name: string; isActive: boolean }[];
  warnings: string[];
  generatedAt: string;
}

export const KIND_LABEL: Record<InsightKind, string> = {
  milestone: "Milestone",
  reward_cap: "Reward cap",
  fee_waiver: "Fee waiver",
  unused_benefit: "Expiring benefit",
};

/**
 * Urgency drives hue, not just intensity: the eye should sort the feed before
 * reading a word of it.
 */
export const URGENCY_STYLE: Record<
  Urgency,
  { dot: string; text: string; track: string; label: string }
> = {
  critical: {
    dot: "bg-[#FF4D3D]",
    text: "text-[#FF6B5C]",
    track: "bg-[#FF4D3D]",
    label: "Act now",
  },
  high: {
    dot: "bg-primary-orange",
    text: "text-primary-orange",
    track: "bg-primary-orange",
    label: "This month",
  },
  moderate: {
    dot: "bg-[#E8B84B]",
    text: "text-[#E8B84B]",
    track: "bg-[#E8B84B]",
    label: "Coming up",
  },
  info: {
    dot: "bg-[#6E8F7A]",
    text: "text-[#8FB39C]",
    track: "bg-[#6E8F7A]",
    label: "Keep in view",
  },
};

export function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/** Point counts read as plain grouped numerals, never with a ₹ prefix. */
export function pts(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}
