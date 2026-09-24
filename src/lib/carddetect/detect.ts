// The two-pass join.
//
// Detection cannot be per-email: the last4 and the product name usually live in
// DIFFERENT emails. HDFC statements name "Swiggy HDFC Bank Credit Card" but
// carry no last4; transaction alerts carry **9897 but no product name. Amex
// yields no usable last4 at all.
//
//   Pass A — group by (issuer, last4)  -> existence + liveness
//   Pass B — collect product phrases per issuer -> resolution to slugs
//   Join   — one last4 + one phrase per issuer -> a confident pair
//
// The verdict is a discrete lookup over (existence, resolution, liveness), not
// a tuned score, so "why did this card land here?" always has an answer.

import {
  SIGNAL_RANK,
  SIGNAL_STRENGTH,
  classifySignal,
  detectNegative,
  extractLast4,
  extractProductPhrases,
  type EmailLike,
  type NegativeKind,
  type SignalType,
} from "./signals";
import {
  resolvePhrases,
  type CatalogCard,
  type ResolutionStatus,
  type SlugCandidate,
} from "./resolve";

export type LivenessStatus = "ACTIVE" | "DORMANT" | "STALE";
export type Verdict = "AUTO_ADD" | "CONFIRM" | "SUPPRESS" | "IGNORE";

export interface EvidenceRef {
  type: SignalType;
  emailId: string;
  date: string | null;
  subject: string;
}

export interface DetectedCard {
  issuer: string;
  last4: string | null;
  existence: {
    score: number;
    strongest: SignalType;
    signals: SignalType[];
  };
  resolution: {
    phrase: string | null;
    candidates: SlugCandidate[];
    status: ResolutionStatus;
  };
  liveness: {
    lastSeen: string | null;
    daysAgo: number | null;
    negative: NegativeKind | null;
    status: LivenessStatus;
  };
  verdict: Verdict;
  /** Plain-language reason this row got its verdict. */
  reason: string;
  /** Pointers into the mailbox, not scores. */
  evidence: EvidenceRef[];
}

export interface DetectionSummary {
  emailsScanned: number;
  emailsWithCardContext: number;
  issuersSeen: string[];
  cards: DetectedCard[];
}

const DAY_MS = 86_400_000;

/**
 * How much a product phrase is trusted to name a card the user HOLDS, by the
 * signal type of the email it came from. Distinct from SIGNAL_STRENGTH, which
 * scores existence: a promo naming "Platinum Card" is strong evidence that the
 * phrase exists and weak evidence that the user owns that card.
 */
const PHRASE_TRUST: Record<SignalType, number> = {
  STATEMENT: 10,
  TRANSACTION: 8,
  PAYMENT_DUE: 8,
  ACTIVATION: 6,
  MARKETING: 0.2,
};

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * Should `next` replace `prev` as the evidence pointer for a signal type?
 *
 * A DATED pointer always beats an undated one: some issuers send mail with no
 * parseable date, and letting one of those claim the slot would otherwise hide
 * every dated email of that type behind it (which silently dropped the SBI
 * statement carrying the product name).
 */
function isFresherEvidence(next: EvidenceRef, prev: EvidenceRef | undefined): boolean {
  if (!prev) return true;
  if (!next.date) return false;
  if (!prev.date) return true;
  return new Date(next.date) > new Date(prev.date);
}

/** Step 4 — liveness bands. */
function livenessOf(daysAgo: number | null): LivenessStatus {
  if (daysAgo === null) return "STALE";
  if (daysAgo <= 90) return "ACTIVE";
  if (daysAgo <= 365) return "DORMANT";
  return "STALE";
}

/**
 * The final table, applied in order. Each branch is one row of the spec.
 */
function decide(params: {
  existence: number;
  resolution: ResolutionStatus;
  liveness: LivenessStatus;
  negative: NegativeKind | null;
}): { verdict: Verdict; reason: string } {
  const { existence, resolution, liveness, negative } = params;

  // A closed card is suppressed no matter how strong the rest looks.
  if (existence >= 0.9 && negative === "CLOSED") {
    return { verdict: "SUPPRESS", reason: "Issuer mail says this card was closed." };
  }
  if (existence >= 0.9 && negative === "REPLACED") {
    return {
      verdict: "SUPPRESS",
      reason: "Issuer mail says this card was replaced or deactivated.",
    };
  }

  if (existence < 0.9) {
    return {
      verdict: "IGNORE",
      reason: "Only marketing mail mentions this number — not enough to claim a card.",
    };
  }

  if (liveness === "STALE") {
    return {
      verdict: "IGNORE",
      reason: "No activity in over a year.",
    };
  }

  // Existence is strong but the signal is ACTIVATION-only (0.90–0.95).
  if (existence < 0.95) {
    return {
      verdict: "CONFIRM",
      reason: "A new card was announced but has not billed yet — confirm you have it.",
    };
  }

  if (resolution === "UNIQUE" && liveness === "ACTIVE") {
    return { verdict: "AUTO_ADD", reason: "Strong recent activity and one exact catalog match." };
  }
  if (resolution === "UNIQUE" && liveness === "DORMANT") {
    return {
      verdict: "CONFIRM",
      reason: "Matched exactly, but nothing seen in 90+ days — do you still have this?",
    };
  }
  if (resolution === "AMBIGUOUS") {
    return {
      verdict: "CONFIRM",
      reason: "The product name matches more than one catalog card — pick the variant.",
    };
  }
  return {
    verdict: "CONFIRM",
    reason: "The card is real, but its product name never appeared in the mail — pick it manually.",
  };
}

/**
 * Run detection over one mailbox's stored emails.
 *
 * Pure: the catalog is injected (see catalog.ts for the DB-backed loader) and
 * `now` is injectable, so results are reproducible in scripts and snapshots.
 */
export function detectCards(
  emails: EmailLike[],
  catalog: CatalogCard[],
  now: Date = new Date(),
): DetectionSummary {

  // --- Pass A: group by (issuer, last4) -------------------------------------
  interface Group {
    issuer: string;
    last4: string;
    /** True while every sighting of this tail came from a 2–3 digit mask. */
    partial: boolean;
    signals: Set<SignalType>;
    lastSeen: Date | null;
    /** Newest date per signal type, used to pick the freshest evidence. */
    evidence: Map<SignalType, EvidenceRef>;
    negative: NegativeKind | null;
    negativeAt: Date | null;
    /**
     * Product phrases seen in mail that ALSO named this tail, weighted by
     * signal strength. Preferred over the issuer-wide pool so one card's
     * product name never leaks onto a different card of the same issuer.
     */
    phrases: Map<string, number>;
  }

  const groups = new Map<string, Group>();
  // --- Pass B accumulator: phrases per issuer, weighted by signal strength ---
  const phrasesByIssuer = new Map<string, Map<string, number>>();
  const issuersSeen = new Set<string>();
  let withContext = 0;

  for (const email of emails) {
    const issuer = email.issuer;
    if (!issuer) continue;
    issuersSeen.add(issuer);

    const signal = classifySignal(email);
    const last4s = extractLast4(email);
    const negative = detectNegative(email);
    if (last4s.length > 0) withContext++;

    // Pass B — collect product phrases, weighted by how much the SOURCE of the
    // phrase can be trusted to name a card the user actually holds. Promo mail
    // constantly advertises cards the user does NOT own ("upgrade to Platinum"),
    // so it is weighted an order of magnitude below transactional mail rather
    // than by its existence strength.
    const phrases = extractProductPhrases(email);
    if (phrases.length > 0) {
      const weight = PHRASE_TRUST[signal];
      const bucket = phrasesByIssuer.get(issuer) ?? new Map<string, number>();
      for (const p of phrases) {
        bucket.set(p, (bucket.get(p) ?? 0) + weight);
      }
      phrasesByIssuer.set(issuer, bucket);
    }

    // Pass A — only card-context mail contributes existence.
    for (const hit of last4s) {
      const key = `${issuer}:${hit.last4}`;
      const g =
        groups.get(key) ??
        ({
          issuer,
          last4: hit.last4,
          partial: true,
          signals: new Set<SignalType>(),
          lastSeen: null,
          evidence: new Map<SignalType, EvidenceRef>(),
          negative: null,
          negativeAt: null,
          phrases: new Map<string, number>(),
        } satisfies Group);

      if (!hit.partial) g.partial = false;
      // Only mail the ISSUER sent about this card's own activity may name it.
      // A phrase appearing solely in promo mail is an advertisement — often for
      // a card the user does not hold ("upgrade to the Platinum Card") — so it
      // must never become this card's identity.
      if (signal !== "MARKETING") {
        for (const ph of phrases) {
          g.phrases.set(ph, (g.phrases.get(ph) ?? 0) + PHRASE_TRUST[signal]);
        }
      }

      g.signals.add(signal);

      // Liveness counts only NON-marketing signals: issuers keep promoting a
      // card long after it goes quiet, so promo mail must not make it look live.
      if (email.date && signal !== "MARKETING") {
        if (!g.lastSeen || email.date > g.lastSeen) g.lastSeen = email.date;
      }

      const candidate: EvidenceRef = {
        type: signal,
        emailId: email.id,
        date: email.date ? email.date.toISOString() : null,
        subject: email.subject,
      };
      if (isFresherEvidence(candidate, g.evidence.get(signal))) {
        g.evidence.set(signal, candidate);
      }

      if (negative) {
        // Keep the most recent negative claim.
        if (!g.negativeAt || (email.date && email.date > g.negativeAt)) {
          g.negative = negative;
          g.negativeAt = email.date;
        }
      }

      groups.set(key, g);
    }
  }

  // --- Merge partial tails into their full counterpart ----------------------
  // SBI masks its statement PAN to two digits ("XXXX XXXX XXXX XX16") and Axis
  // does the same ("ending XX15"). A partial is not a separate card — it is the
  // SAME card seen through a heavier mask. Fold it into the unique full tail it
  // suffixes, so the statement's product phrase and recency land on the real
  // card instead of minting a phantom one. Ambiguous partials (matching two
  // full tails) are dropped rather than guessed.
  // Repeated to a fixed point rather than in one pass: a 2-digit tail that
  // suffixes BOTH an intermediate and a final tail (16 → 4016 → 04016) sees two
  // hosts and must wait until the intermediate has been folded away. A single
  // ordered pass would strand it as a phantom card.
  let merged = true;
  while (merged) {
    merged = false;
    // Shortest-first, so the longest chains collapse from the inside out.
    const mergeOrder = [...groups.entries()].sort(
      (a, b) => a[1].last4.length - b[1].last4.length,
    );
    for (const [key, g] of mergeOrder) {
      if (!groups.has(key)) continue;
      const hosts = [...groups.values()].filter(
        (o) =>
          o !== g &&
          o.issuer === g.issuer &&
          o.last4.length > g.last4.length &&
          o.last4.endsWith(g.last4),
      );
      if (hosts.length !== 1) continue;
      const host = hosts[0];
      for (const sig of g.signals) host.signals.add(sig);
      for (const [ph, w] of g.phrases) host.phrases.set(ph, (host.phrases.get(ph) ?? 0) + w);
      if (g.lastSeen && (!host.lastSeen || g.lastSeen > host.lastSeen)) host.lastSeen = g.lastSeen;
      for (const [sig, ev] of g.evidence) {
        if (isFresherEvidence(ev, host.evidence.get(sig))) host.evidence.set(sig, ev);
      }
      if (g.negative && (!host.negativeAt || (g.negativeAt && g.negativeAt > host.negativeAt))) {
        host.negative = g.negative;
        host.negativeAt = g.negativeAt;
      }
      groups.delete(key);
      merged = true;
    }
  }

  // A group that only ever appeared behind a heavy mask ("XX16") and could not
  // be folded into exactly one full tail is not a card identity — it is a mask
  // whose owner is unknown. Surfacing it would invent a card the user does not
  // have, so drop it rather than guess which full tail it belongs to.
  for (const [key, g] of [...groups]) {
    if (g.partial && g.last4.length < 4) groups.delete(key);
  }

  // --- Resolution per issuer (Pass B result) --------------------------------
  const resolutionByIssuer = new Map<string, ReturnType<typeof resolvePhrases>>();
  for (const [issuer, bucket] of phrasesByIssuer) {
    // Order phrases by weight, then by specificity (longer = more specific).
    const ordered = [...bucket.entries()]
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
      .map(([p]) => p);
    resolutionByIssuer.set(issuer, resolvePhrases(ordered, issuer, catalog));
  }

  // --- Join + verdict -------------------------------------------------------
  const cards: DetectedCard[] = [];
  for (const g of groups.values()) {
    const signals = SIGNAL_RANK.filter((s) => g.signals.has(s));
    const strongest = signals[0] ?? "MARKETING";
    // Step 3 — confidence is the MAX signal strength, not a sum.
    const score = SIGNAL_STRENGTH[strongest];

    const daysAgo = g.lastSeen ? daysBetween(g.lastSeen, now) : null;
    const liveness = livenessOf(daysAgo);

    // Prefer phrases seen alongside THIS tail; only fall back to the
    // issuer-wide pool when this card never appeared next to a product name.
    const ownPhrases = [...g.phrases.entries()]
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
      .map(([ph]) => ph);
    // Resolution uses ONLY phrases seen alongside this tail. There is
    // deliberately no issuer-wide fallback: borrowing another card's product
    // name from the same issuer is how a Gold card becomes a Platinum one. When
    // this card was never named, the honest answer is NO_MATCH, and the verdict
    // table turns that into "pick it manually".
    const resolution = resolvePhrases(ownPhrases, g.issuer, catalog);

    const { verdict, reason } = decide({
      existence: score,
      resolution: resolution.status,
      liveness,
      negative: g.negative,
    });

    cards.push({
      issuer: g.issuer,
      last4: g.last4,
      existence: { score, strongest, signals },
      resolution,
      liveness: {
        lastSeen: g.lastSeen ? g.lastSeen.toISOString() : null,
        daysAgo,
        negative: g.negative,
        status: liveness,
      },
      verdict,
      reason,
      evidence: SIGNAL_RANK.flatMap((s) => {
        const e = g.evidence.get(s);
        return e ? [e] : [];
      }),
    });
  }

  // Strongest and freshest first, so the UI's first row is the most actionable.
  const VERDICT_ORDER: Verdict[] = ["AUTO_ADD", "CONFIRM", "SUPPRESS", "IGNORE"];
  cards.sort((a, b) => {
    const v = VERDICT_ORDER.indexOf(a.verdict) - VERDICT_ORDER.indexOf(b.verdict);
    if (v !== 0) return v;
    if (b.existence.score !== a.existence.score) return b.existence.score - a.existence.score;
    return (a.liveness.daysAgo ?? 9e9) - (b.liveness.daysAgo ?? 9e9);
  });

  return {
    emailsScanned: emails.length,
    emailsWithCardContext: withContext,
    issuersSeen: [...issuersSeen].sort(),
    cards,
  };
}
