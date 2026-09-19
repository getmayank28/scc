import BankModel from "@/models/Bank";

/**
 * Resolve the issuing bank for a card slug.
 *
 * WHY THIS EXISTS — the card documents cannot answer this themselves:
 *
 *   - `bankId` is null on every one of the 308 active cards, so the natural
 *     join (`Giftor.find({ bankId: card.bankId })`) matches nothing and returns
 *     an empty array rather than an error.
 *   - `bankName` does not hold a bank. It holds the NETWORK — "visa",
 *     "mastercard", "rupay", "diners" — on 306 of those 308, mirroring the
 *     `issuer` array. That is why the voucher CTA used to report "No voucher
 *     partner listed for visa yet": it was printing a network as a bank.
 *
 * The bank is, however, recoverable from the slug, which is built as
 * `<card-name>-<bank-slug>` ("simplyclick-sbi-card-sbi-card" → "sbi"). Matching
 * the LONGEST bank slug the card slug ends with resolves 293/308 on its own;
 * the remainder are all SBI, whose cards end "-sbi-card" against a bank slug of
 * "sbi", so a trailing "-card"/"-credit-card" is trimmed and retried. Together
 * that resolves 308/308, of which 287 (93.2%) have a giftor on file.
 *
 * Longest-match matters: a short bank slug can be a suffix of a longer one, and
 * taking the first hit would attribute those cards to the wrong bank.
 *
 * This is a WORKAROUND for a data gap, not the intended design. Once `bankId`
 * is backfilled on `cards`, callers should join on it directly and this can go.
 */

interface BankLike {
  _id: unknown;
  name: string;
  slug?: string;
}

/** Forms of the card slug to try, in order, before giving up. */
function slugForms(cardSlug: string): string[] {
  const s = cardSlug.toLowerCase();
  return [...new Set([s, s.replace(/-credit-card$/, ""), s.replace(/-card$/, "")])];
}

/**
 * Pick the bank whose slug is the longest suffix match on the card slug.
 * Returns null when nothing matches rather than guessing.
 */
export function matchBankBySlug<T extends BankLike>(
  cardSlug: string,
  banks: T[],
): T | null {
  const usable = banks.filter((b) => b.slug);
  for (const form of slugForms(cardSlug)) {
    let best: T | null = null;
    for (const bank of usable) {
      const key = bank.slug!.toLowerCase();
      if (form !== key && !form.endsWith(`-${key}`)) continue;
      if (!best || key.length > best.slug!.length) best = bank;
    }
    if (best) return best;
  }
  return null;
}

/**
 * Bank for a card slug, read through the `banks` collection.
 *
 * Callers must have connected already (`dbConnect`). The bank list is small
 * (18 rows) and this is not on a hot path, so it is read per call rather than
 * cached — a stale bank list would be harder to reason about than the query.
 */
export async function resolveBankForCardSlug(
  cardSlug: string,
): Promise<{ _id: unknown; name: string; slug?: string } | null> {
  if (!cardSlug) return null;
  const banks = (await BankModel.find({}, "name slug").lean()) as BankLike[];
  return matchBankBySlug(cardSlug, banks);
}
