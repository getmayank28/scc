// Builds the "Do this" instruction for the winning card.
//
// This replaces a two-branch template string that produced one flat sentence
// per route. It returns structured segments rather than text so the UI can bold
// the things the user has to act on (the brand, the portal, the card) and link
// the portal, and so the case matrix below is explicit instead of being buried
// in nested ternaries in JSX.
//
// The cases are driven entirely by fields the engine already returns. Three of
// them are the ones the old copy got wrong:
//
//   - a swipe win whose rate comes from a merchant-specific rule reads as a
//     category-wide rate unless the merchant is named (`directMerchant`);
//   - a card with no voucher route at all must not be told to buy a voucher
//     (`voucherSavingsInInr === 0` — see SpendActions, same guard);
//   - a base-rate fallback has no route on file, so asserting either one is a
//     guess (`isBaseRateFallback`).

import { merchantLabel, type OptimizedCardResult } from "./data";

export interface VoucherPortal {
  name: string;
  url: string;
}

/** One run of instruction text. `strong` is the part the user must act on. */
export interface Segment {
  text: string;
  strong?: boolean;
  /** Renders as a link when present. */
  href?: string;
}

export interface Instruction {
  /** Ordered steps. Rendered as a list when more than one. */
  steps: Segment[][];
  /**
   * A note about the other lane, or null when the two are close enough that
   * saying anything is noise.
   *
   * `tone` matters: "warn" is a mistake that costs money (the losing lane is
   * genuinely worse), while "tip" is an opportunity (the other lane pays MORE
   * but is suppressed because a voucher can't win a category-wide run). Styling
   * them alike would tell users not to do the better-paying thing.
   */
  warning: { text: string; tone: "warn" | "tip" } | null;
  /** Cap text, folded in from the engine. */
  capNote: string | null;
}

const s = (text: string): Segment => ({ text });
const b = (text: string): Segment => ({ text, strong: true });
const link = (text: string, href: string): Segment => ({
  text,
  strong: true,
  href,
});

/**
 * A lane has to beat the other by this much before we tell the user not to use
 * it. Below this the two routes are effectively the same and a "do not" line is
 * noise — most merchants in a category tie on rate, so small gaps are common.
 */
const MATERIAL_GAP_INR = 50;

export function buildInstruction(
  card: OptimizedCardResult,
  /** The merchant the run was made with, or "" for a category-wide run. */
  ranMerchant: string,
  portal: VoucherPortal | null,
): Instruction {
  const capNote = card.capNote;

  // No route on file: the figure is the card's general earn rate, so naming a
  // route or a merchant would invent detail the data doesn't have.
  if (card.isBaseRateFallback) {
    return {
      steps: [
        [
          s("Pay with "),
          b(card.cardName),
          s(
            ". We don't have category-specific reward data for this card, so this is its general earn rate.",
          ),
        ],
      ],
      warning: null,
      capNote,
    };
  }

  // Nothing to earn either way — don't dress up a zero as a recommendation.
  if (card.bestSavingsInInr <= 0) {
    return {
      steps: [
        [
          s("Pay with "),
          b(card.cardName),
          s(". This purchase earns no rewards on any of your selected cards."),
        ],
      ],
      warning: null,
      capNote,
    };
  }

  // Signed, not absolute: which lane is actually ahead decides whether there is
  // a mistake to warn about at all.
  const voucherLead = card.voucherSavingsInInr - card.directSwipeSavingsInInr;
  const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  if (card.bestRoute === "voucher") {
    // The brand the voucher is bought for. On a merchant-named run that's the
    // user's own choice; on a category-wide run it's whatever brand won, and
    // naming it is what makes the number interpretable.
    const brand =
      ranMerchant || (card.voucherMerchant ? merchantLabel(card.voucherMerchant) : null);

    const buy: Segment[] = [s("Purchase ")];
    if (brand) buy.push(b(`${brand} gift voucher`));
    else buy.push(b("a gift voucher"));
    if (portal) {
      buy.push(s(" via "));
      buy.push(link(portal.name, portal.url));
    } else {
      buy.push(s(" via your bank's voucher portal"));
    }
    buy.push(s(" using your "));
    buy.push(b(card.cardName));
    buy.push(s("."));

    const steps: Segment[][] = [
      buy,
      [
        s("Pay with the voucher balance at checkout"),
        ...(brand ? [s(" on "), b(brand)] : []),
        s(". Check the voucher's validity and T&C before buying."),
      ],
    ];

    return {
      steps,
      // The voucher won, so swiping is the mistake — but only worth flagging
      // when the swipe is materially worse.
      warning:
        voucherLead >= MATERIAL_GAP_INR
          ? {
              text: `Do not swipe directly at checkout — you'd earn ${inr(voucherLead)} less.`,
              tone: "warn",
            }
          : null,
      capNote,
    };
  }

  // Direct swipe. `directMerchant` is the channel the winning rule is tied to;
  // it's null when the category floor won, which genuinely is category-wide.
  const where =
    ranMerchant || (card.directMerchant ? merchantLabel(card.directMerchant) : null);

  const pay: Segment[] = [s("Pay directly with your "), b(card.cardName)];
  if (where) {
    pay.push(s(" at "));
    pay.push(b(where));
  }
  pay.push(s("."));

  const steps: Segment[][] = [pay];

  // A merchant-specific swipe rate only applies at that merchant. Without this
  // the headline rate reads as if it applies to the whole category — the exact
  // misreading the unlabelled version produced.
  if (where && !ranMerchant) {
    steps.push([
      s("This rate applies at "),
      b(where),
      s(" only — other merchants in this category earn the card's base rate."),
    ]);
  }

  // A swipe win with a HIGHER voucher figure isn't a beaten lane — on a
  // category-wide run the engine bars a voucher from winning (it's bought for
  // one brand, and the top-earning brand in a category is usually obscure), so
  // the voucher number is suppressed rather than defeated. Telling the user not
  // to buy it would be backwards: it's the better-paying route, just not one we
  // can recommend until they name the merchant. Point them at that instead.
  if (voucherLead >= MATERIAL_GAP_INR) {
    const brand = card.voucherMerchant ? merchantLabel(card.voucherMerchant) : null;
    return {
      steps,
      warning: {
        text: brand
          ? `Buying a ${brand} voucher earns ${inr(voucherLead)} more — pick ${brand} above to price it.`
          : `A voucher earns ${inr(voucherLead)} more here — pick a specific merchant above to price it.`,
        tone: "tip",
      },
      capNote,
    };
  }

  return {
    steps,
    // Swipe genuinely ahead: the voucher is the costlier route.
    warning:
      card.voucherSavingsInInr > 0 && -voucherLead >= MATERIAL_GAP_INR
        ? {
            text: `Don't buy a voucher for this — you'd earn ${inr(-voucherLead)} less.`,
            tone: "warn",
          }
        : null,
    capNote,
  };
}
