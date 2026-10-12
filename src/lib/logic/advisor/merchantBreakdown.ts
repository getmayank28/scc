// Per-merchant "where should I actually shop with this card" breakdown.
//
// `optimizeSpend` answers "which card, and which lane" and collapses the answer
// to one merchant per lane. This answers the follow-up the UI needs for its
// explore panel: for ONE card and ONE category, what are the best merchants in
// each lane, and what would this exact purchase earn at each?
//
// IMPORTANT — why this prices each merchant through `optimizeSpend` rather than
// reading `rule.reward.*` directly:
//
// Raw rule percentages are not what the user earns. A rule's rupees depend on
// its caps (`max_voucher_size_inr × vouchers_per_booking` clamps the voucher
// lane against THIS amount), on tiered schedules, and on cap groups that pool
// across rules. Ranking on the raw percentage would produce a list that
// disagrees with the headline number the user is looking at, for the same card
// and the same purchase. Re-running the real optimizer per merchant costs a few
// hundred microseconds on an in-memory rule slice and is always consistent.
//
// A note on ties, which dominate this data: within a card and category the
// merchant rates are nearly flat (measured: ~1.1-1.3 distinct rates per
// card/category, with 75-97% of cards tied at the top). Ranking is by RUPEES,
// which caps do differentiate, but tied merchants are NOT collapsed — the panel
// is a "where do I shop" list, so the names are the payload even when the rate
// beside them repeats.

import type { Category, MockCard } from "./cards";
import type { MockRule } from "./rules";
import type { MockBestOf } from "./bestOf";
import { optimizeSpend } from "./spendOptimizer";

export interface MerchantOption {
  /** Rule merchant slug. */
  merchant: string;
  /** What this purchase earns at this merchant, in this lane. */
  savingsInInr: number;
  /** Effective % back, derived from the rupees actually earned. */
  ratePct: number;
  /** Cap note from the engine, when the winning rule for this merchant is capped. */
  capNote: string | null;
}

export interface MerchantBreakdown {
  voucher: MerchantOption[];
  swipe: MerchantOption[];
  /** Distinct merchants considered, before the top-N slice. */
  totalMerchants: number;
}

/**
 * Best merchants per lane for one card, ranked by what `amountInr` actually
 * earns there.
 *
 * `rules` should already be narrowed to this card and category; `bestOfIndex`
 * is the same index `optimizeSpend` takes.
 */
export function buildMerchantBreakdown(
  card: MockCard,
  category: Category,
  amountInr: number,
  bestOfIndex: Map<string, MockBestOf>,
  rules: MockRule[],
  limit = 5,
): MerchantBreakdown {
  const merchants = [
    ...new Set(
      rules
        .filter((r) => r.is_active && r.category === category && r.merchant)
        .map((r) => r.merchant as string),
    ),
  ];

  if (merchants.length === 0) {
    return { voucher: [], swipe: [], totalMerchants: 0 };
  }

  const voucher: MerchantOption[] = [];
  const swipe: MerchantOption[] = [];

  for (const merchant of merchants) {
    // One card in, one row out. Scoring with the merchant named is what makes
    // `laneView` rebuild that merchant's candidates from the rules instead of
    // reading the Pareto-pruned frontier, which usually doesn't contain them.
    const [scored] = optimizeSpend(
      [card],
      bestOfIndex,
      { amountInr, category, merchant },
      rules,
    );
    if (!scored) continue;

    if (scored.voucherSavingsInInr > 0) {
      voucher.push({
        merchant,
        savingsInInr: scored.voucherSavingsInInr,
        ratePct:
          amountInr > 0 ? (scored.voucherSavingsInInr / amountInr) * 100 : 0,
        capNote: scored.bestRoute === "voucher" ? scored.capNote : null,
      });
    }

    if (scored.directSwipeSavingsInInr > 0) {
      swipe.push({
        merchant,
        savingsInInr: scored.directSwipeSavingsInInr,
        ratePct:
          amountInr > 0
            ? (scored.directSwipeSavingsInInr / amountInr) * 100
            : 0,
        capNote: scored.bestRoute === "swipe" ? scored.capNote : null,
      });
    }
  }

  return {
    voucher: rank(voucher, limit),
    swipe: rank(swipe, limit),
    totalMerchants: merchants.length,
  };
}

/**
 * Rank by rupees, then take the top `limit`.
 *
 * Tied merchants each get their own row. These rates are very flat — on
 * HDFC/online_shopping 76 merchants pay identically — so a list of distinct
 * PAYOUTS would be shorter and more "informative" per row, but it answers the
 * wrong question. The user is choosing WHERE TO SHOP, and "Cleartrip Hotels,
 * +5 more at this rate" doesn't tell them the other five are ITC, Marriott,
 * EaseMyTrip, FabHotels and Sterling. Names are the point; the rate repeating
 * is fine.
 *
 * Ties sort alphabetically so the order is stable across requests rather than
 * reshuffling between renders.
 *
 * Known limitation of a small `limit` with expanded ties: where a rate is
 * shared widely the top N is an alphabetical slice of that tied group, so
 * well-known merchants can fall outside it (Diamant/online_shopping has 50+
 * merchants at an identical rate, and a top 5 stops at "Beyoung" without ever
 * reaching Amazon or Myntra). `totalMerchants` reports the full count so the UI
 * can say how much it is not showing.
 */
function rank(options: MerchantOption[], limit: number): MerchantOption[] {
  return [...options]
    .sort(
      (a, b) =>
        b.savingsInInr - a.savingsInInr || a.merchant.localeCompare(b.merchant),
    )
    .slice(0, limit);
}
