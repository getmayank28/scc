import { CAMPAIGN_KEY, CARDS, type CampaignCard } from "@/app/credit-card-offers/_data/festive";

/**
 * The festive campaign as the claim logic sees it: which card slugs qualify,
 * which bank each belongs to (one approved card per bank), and the voucher.
 * The landing-page copy in `_data/festive.ts` stays the single source.
 */

export const FESTIVE = CAMPAIGN_KEY;

/** Surface `/api/out` stamps on Apply clicks from the campaign page. */
export const CAMPAIGN_SURFACE = "campaign";

const BY_SLUG = new Map(CARDS.map((c) => [c.slug, c]));

export const FESTIVE_SLUGS = CARDS.map((c) => c.slug);

export function festiveCard(slug: string | null | undefined): CampaignCard | null {
  return slug ? (BY_SLUG.get(slug) ?? null) : null;
}

/**
 * Live card slugs end in the issuer ("…-sbi-card", "…-hdfc-bank"), which is
 * the only reliable bank signal on wallet cards: `cards.bankName` held the
 * network on most rows until recently.
 */
const BANK_SLUG_SUFFIX: Record<string, string> = {
  "SBI Card": "-sbi-card",
  "IndusInd Bank": "-indusind-bank",
  "HDFC Bank": "-hdfc-bank",
  "YES Bank": "-yes-bank",
};

export function isSameBankSlug(bank: string, slug: string): boolean {
  const suffix = BANK_SLUG_SUFFIX[bank];
  return !!suffix && slug.endsWith(suffix);
}

/**
 * Cuelinks files HDFC generic (5465) and HDFC Swiggy (5507) under one landing
 * page and credits both to 5507, so an HDFC lead without `subid4` can't be
 * told apart — those go to admin review rather than becoming claims.
 */
export const HDFC_CAMPAIGN_IDS = [5465, 5507];
