// Card art for the demo wallet.
//
// Purely presentational: maps a catalogue slug to the artwork shipped in
// `public/images/cardSkin`. Nothing here asserts a fact about the card — no
// last-4, no material, no issuer claim — so it cannot go stale against the
// catalogue the way fabricated card metadata would.
//
// A slug with no artwork renders the neutral placeholder tile instead, which is
// the correct behaviour once the wallet stops being a fixed set of three.

import { DEMO_SLUGS } from "./mockLedger";

export const CARD_ART: Record<string, string> = {
  [DEMO_SLUGS.amexGold]: "/images/cardSkin/amex-gold.png",
  [DEMO_SLUGS.millennia]: "/images/cardSkin/hdfc-millenia.png",
  [DEMO_SLUGS.cashbackSbi]: "/images/cardSkin/sbi-cashback.png",
};

export function cardArtFor(slug: string): string | null {
  return CARD_ART[slug] ?? null;
}
