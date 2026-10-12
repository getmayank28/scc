import type { BotRecommendationCreditCardProps } from "@/types/card";

/**
 * Display helpers shared by the recommendation card and its detail modal, so
 * the two can never disagree about a number or a name.
 */

/**
 * Just the fields these helpers read. The modal destructures `applyLink` out of
 * its props before passing the rest along, so requiring the full card shape
 * here would reject it for a field none of this code touches.
 */
type CardDisplayFields = Partial<
  Pick<
    BotRecommendationCreditCardProps,
    | "annualFee"
    | "categoryWiseReward"
    | "feeInr"
    | "feeWaived"
    | "feeWaiverSpendInr"
    | "rewardStreams"
  >
>;

const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatInr(value: number): string {
  return `₹${INR.format(Math.round(Math.abs(value)))}`;
}

/**
 * Compact rupees for the headline figure, where the exact digit matters less
 * than the magnitude: ₹34,000 reads as "₹34.0K" and ₹1,20,000 as "₹1.2L".
 */
export function formatInrCompact(value: number): string {
  const n = Math.round(Math.abs(value));
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n}`;
}

/**
 * Card names arrive from `doc.name`, which for some catalog records still holds
 * the slug ("american-express-membership-rewards-credit-card-american-express")
 * rather than a display name. Rendering that raw is the single ugliest thing on
 * the current card, so detect it and title-case it back into something legible.
 *
 * This is presentation-side triage for a data defect, not a fix: the underlying
 * records still need correcting.
 */
export function displayCardName(rawName: string | undefined): string {
  const name = (rawName ?? "").trim();
  if (!name) return "This card";
  // A real display name has spaces; a slug has hyphens and none.
  if (name.includes(" ") || !name.includes("-")) return name;

  const words = name.split("-").filter(Boolean);

  // Slugs frequently repeat the issuer at both ends
  // ("american-express-…-american-express"); drop the trailing echo.
  for (let take = Math.floor(words.length / 2); take >= 1; take--) {
    const head = words.slice(0, take).join(" ");
    const tail = words.slice(words.length - take).join(" ");
    if (head === tail) {
      words.splice(words.length - take, take);
      break;
    }
  }

  const SMALL = new Set(["and", "or", "the", "of", "for"]);
  return words
    .map((word, index) =>
      index > 0 && SMALL.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

/**
 * The fee line, resolved against projected spend rather than left as a bare
 * "(waived)". Whether the user clears the waiver is knowable here, so say it.
 */
export function feeStatus(card: CardDisplayFields): {
  label: string;
  detail: string;
  isFree: boolean;
} {
  // Structured fields absent (socket payload or restored older session): fall
  // back to parsing the preformatted string.
  //
  // The shapes `annualFeeText` produces are:
  //   "0 (Lifetime free)" | "0" | "4,500 (waived on ₹1,50,000 spend)" | "4,500"
  //
  // The waiver form is CONDITIONAL — it names the spend needed, not a waiver
  // already earned. Reading it as "fee waived" while still printing the amount
  // is how the card ended up claiming "Fee waived · 4,500" at once.
  if (typeof card.feeInr !== "number") {
    const text = (card.annualFee ?? "").trim();
    if (!text || text === "—") {
      return { label: "—", detail: "Annual fee", isFree: false };
    }

    const amount = text.split(" ").at(0) ?? "—";
    const isZero = amount === "0" || amount === "₹0";

    if (isZero) {
      return {
        label: "No fee",
        detail: /lifetime/i.test(text) ? "Lifetime free" : "No annual fee",
        isFree: true,
      };
    }

    // Without the structured `annualSpendInr` we cannot know whether the user
    // clears the threshold, so state the condition rather than assert an
    // outcome.
    const waiverMatch = text.match(/waived on ([^)]+?) spend/i);
    if (waiverMatch) {
      return {
        label: `₹${amount}`,
        detail: `Waived above ${waiverMatch[1].trim()}`,
        isFree: false,
      };
    }

    // Empty rather than "Annual fee": the caller already labels the row that,
    // and this branch cannot say whether the parsed figure includes GST.
    return { label: `₹${amount}`, detail: "", isFree: false };
  }

  if (card.feeWaived) {
    return { label: "No fee", detail: "Waived at your spend", isFree: true };
  }

  // The engine's fee is `annual_inr + annual_gst_inr` (see computeAnnualFeeInr),
  // so every figure below is already tax-inclusive. Saying so matters: banks
  // advertise the pre-GST number, so a reader comparing this card against the
  // bank's own page sees a higher figure here and would otherwise assume the
  // engine is wrong rather than that it is quoting what actually gets charged.
  // Only stated on the structured branch — the string fallback above parses a
  // preformatted fee of unknown tax basis, so it cannot make this claim.
  if (card.feeWaiverSpendInr) {
    return {
      label: formatInr(card.feeInr),
      detail: `Incl. GST · waived above ${formatInr(card.feeWaiverSpendInr)}`,
      isFree: false,
    };
  }

  return {
    label: card.feeInr > 0 ? formatInr(card.feeInr) : "No fee",
    detail: card.feeInr > 0 ? "Incl. GST" : "Lifetime free",
    isFree: card.feeInr <= 0,
  };
}

/**
 * The reward breakdown as numbers. Prefers the structured streams and falls
 * back to parsing the legacy ", "-joined string so socket-delivered payloads
 * still render bars instead of degrading to plain text.
 */
export function rewardStreamsOf(
  card: CardDisplayFields,
): { label: string; valueInr: number; isCost: boolean }[] {
  if (card.rewardStreams?.length) {
    return card.rewardStreams.map((s) => ({
      label: s.label,
      valueInr: s.valueInr,
      isCost: !!s.isCost,
    }));
  }

  const raw = card.categoryWiseReward;
  if (typeof raw !== "string" || !raw.includes("₹")) return [];

  return raw
    .split(", ")
    .map((part) => {
      const match = part.match(/^(.*?)\s*₹([\d,]+)$/);
      if (!match) return null;
      const label = match[1].trim();
      const valueInr = Number(match[2].replace(/,/g, ""));
      if (!label || !Number.isFinite(valueInr)) return null;
      return { label, valueInr, isCost: /cost/i.test(label) };
    })
    .filter((s): s is { label: string; valueInr: number; isCost: boolean } => !!s);
}

export interface ValueLedger {
  /** Everything earned across reward streams. */
  earnedInr: number;
  /** Deductions inside the streams (forex markup). */
  costInr: number;
  milestoneInr: number;
  feeInr: number;
  /** earned + milestones − costs − fee. The figure the ranking is built on. */
  netInr: number;
  /** True when netInr came from the engine rather than being reconstructed. */
  isExact: boolean;
}

/**
 * The card's value arithmetic, resolved from whichever payload shape arrived.
 *
 * The engine supplies `netAnnualValueInr` directly. When it is missing — a
 * socket payload, or a session restored from before the structured fields
 * existed — the same figure is reconstructed from the reward streams and the
 * parsed fee, which are enough to reach it.
 *
 * Without this the modal fell back to showing a bare "11.1% return" above a
 * breakdown totalling ₹40,004, two numbers that never visibly meet. Deriving
 * the net means the ledger always resolves to the headline.
 */
export function valueLedgerOf(
  card: Pick<
    BotRecommendationCreditCardProps,
    | "netAnnualValueInr"
    | "feeInr"
    | "milestones"
    | "annualFee"
    | "categoryWiseReward"
    | "rewardStreams"
    | "feeWaived"
    | "feeWaiverSpendInr"
  >,
): ValueLedger | null {
  const streams = rewardStreamsOf(card);

  const earnedInr = streams
    .filter((s) => !s.isCost)
    .reduce((sum, s) => sum + s.valueInr, 0);
  const costInr = streams
    .filter((s) => s.isCost)
    .reduce((sum, s) => sum + s.valueInr, 0);
  const milestoneInr = (card.milestones ?? []).reduce(
    (sum, m) => sum + m.annualValueInr,
    0,
  );

  // Prefer the structured fee; otherwise recover the amount from the legacy
  // string, which always leads with the figure ("4,500 (waived on …)").
  let feeInr = card.feeInr;
  if (typeof feeInr !== "number") {
    const amount = (card.annualFee ?? "").trim().split(" ").at(0) ?? "";
    const parsed = Number(amount.replace(/[₹,]/g, ""));
    feeInr = Number.isFinite(parsed) ? parsed : 0;
    // A stated waiver in the legacy string means the fee was not charged.
    if (/waiv|lifetime/i.test(card.annualFee ?? "")) feeInr = 0;
  }

  if (!earnedInr && !milestoneInr) return null;

  const exact = card.netAnnualValueInr;
  const isExact = typeof exact === "number";

  return {
    earnedInr,
    costInr,
    milestoneInr,
    feeInr,
    netInr: isExact ? exact : earnedInr + milestoneInr - costInr - feeInr,
    isExact,
  };
}
