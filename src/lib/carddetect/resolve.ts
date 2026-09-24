// Resolution: product phrase -> catalog slug.
//
// Deliberately conservative. A phrase resolves only when its DISTINCTIVE tokens
// (the ones that are not issuer boilerplate) match the catalog name. This is
// what makes "HDFC Bank Credit Card" correctly resolve to NOTHING — it names an
// issuer, not a product. When a phrase does match several catalog cards equally
// well (the two HDFC Swiggy variants), the tie is reported as AMBIGUOUS with the
// variants attached rather than silently collapsed to one.

export type ResolutionStatus = "UNIQUE" | "AMBIGUOUS" | "NO_MATCH";

export interface SlugCandidate {
  slug: string;
  name: string;
  bankName: string;
  cardId: string;
  score: number;
}

export interface CatalogCard {
  cardId: string;
  slug: string;
  name: string;
  bankName: string;
  tokens: Set<string>;
}

/**
 * Tokens carrying no product identity. Issuer names live here: every phrase
 * from an issuer's own mail contains them, so they can never discriminate.
 */
const STOPWORDS = new Set([
  "credit", "card", "cards", "bank", "the", "a", "an", "of", "and", "your",
  "hdfc", "icici", "axis", "sbi", "kotak", "idfc", "yes", "rbl", "indusind",
  "american", "express", "amex", "first", "ltd", "limited", "india",
]);

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function distinctive(tokens: string[]): Set<string> {
  return new Set(tokens.filter((t) => !STOPWORDS.has(t) && t.length > 1));
}

/** Issuer slug -> the bankName values that issuer uses in the catalog. */
const ISSUER_BANK_MATCH: Record<string, RegExp> = {
  hdfc: /hdfc/i,
  icici: /icici/i,
  axis: /axis/i,
  sbi: /sbi|state bank/i,
  amex: /american express|amex/i,
  kotak: /kotak/i,
  idfc: /idfc/i,
  yes: /yes bank/i,
  rbl: /rbl/i,
  indusind: /indusind/i,
};

export interface ResolutionResult {
  phrase: string | null;
  candidates: SlugCandidate[];
  status: ResolutionStatus;
}

/**
 * Resolve the best product phrase for one issuer against the catalog.
 *
 * Phrases are tried longest-first (most specific), and the first phrase that
 * produces any catalog match wins — so a mail run that mentions both
 * "Swiggy HDFC Bank Credit Card" and the generic "HDFC Bank Credit Card"
 * resolves on the specific one.
 */
export function resolvePhrases(
  phrases: string[],
  issuer: string,
  catalog: CatalogCard[],
): ResolutionResult {
  const bankRe = ISSUER_BANK_MATCH[issuer];
  const pool = bankRe ? catalog.filter((c) => bankRe.test(c.bankName)) : catalog;
  if (pool.length === 0) return { phrase: null, candidates: [], status: "NO_MATCH" };

  for (const phrase of phrases) {
    const want = distinctive(tokenize(phrase));
    // A phrase with no distinctive tokens ("HDFC Bank Credit Card") names the
    // issuer, not a product. It can never resolve.
    if (want.size === 0) continue;

    const scored: SlugCandidate[] = [];
    for (const card of pool) {
      if (card.tokens.size === 0) continue;
      let overlap = 0;
      for (const t of want) if (card.tokens.has(t)) overlap++;
      if (overlap === 0) continue;
      // Every distinctive token in the phrase must be present in the card name.
      // "Swiggy" ⊄ "HDFC Regalia" → no match, rather than a weak partial one.
      if (overlap < want.size) continue;
      // Precision against the card's own tokens: an exact-length name scores 1.
      scored.push({
        slug: card.slug,
        name: card.name,
        bankName: card.bankName,
        cardId: card.cardId,
        score: overlap / card.tokens.size,
      });
    }

    if (scored.length === 0) continue;

    scored.sort((a, b) => b.score - a.score);
    const top = scored[0].score;
    const tied = scored.filter((c) => c.score === top);

    // A strictly better single match resolves; a tie is reported as ambiguous
    // with the tied variants, never silently collapsed.
    if (tied.length === 1) {
      return { phrase, candidates: [scored[0]], status: "UNIQUE" };
    }
    return {
      phrase,
      candidates: tied.map((c) => ({ ...c, score: Number((1 / tied.length).toFixed(3)) })),
      status: "AMBIGUOUS",
    };
  }

  return { phrase: phrases[0] ?? null, candidates: [], status: "NO_MATCH" };
}
