import type { SavingKind } from "./savings";

export interface SampleOffer {
  bank: string;
  title: string;
  kind: SavingKind;
  badge: string;
  bullets: string[];
  note: string;
}

/**
 * Curated, illustrative example offers. Numbers mirror real rows in the sale
 * dataset (AMEX 25% vouchers, ICICI voucher stacking, BoB 10% instant, Axis
 * voucher value), but these are shown as *examples of what's live* — never as
 * the visitor's personalized result. That distinction is load-bearing.
 */
export const SAMPLE_OFFERS: SampleOffer[] = [
  {
    bank: "American Express",
    title: "Amazon Voucher Benefits",
    kind: "voucher",
    badge: "Vouchers",
    bullets: ["Up to 25% voucher value", "Extra reward points on spend"],
    note: "Subject to monthly voucher purchase limit.",
  },
  {
    bank: "ICICI Bank",
    title: "Reward Stacking",
    kind: "voucher",
    badge: "Rewards",
    bullets: ["Up to 36% back via voucher stacking", "Accelerated points on select cards"],
    note: "Value varies by card variant.",
  },
  {
    bank: "Bank of Baroda",
    title: "Instant Discount",
    kind: "instant",
    badge: "Instant",
    bullets: ["Flat 10% instant discount", "On orders above ₹4,990"],
    note: "Capped at ₹1,500 per transaction.",
  },
  {
    bank: "Axis Bank",
    title: "Voucher + No-Cost EMI",
    kind: "voucher",
    badge: "EMI",
    bullets: ["Up to 30% voucher value", "No-cost EMI on eligible orders"],
    note: "Processing fees may apply on EMI.",
  },
];
