// Per-email signal classification + entity extraction.
//
// Everything here is PURE: it takes the already-stored email text and returns
// what that one email asserts. Nothing here decides whether a card exists —
// that is the join's job (see detect.ts). Keeping it pure is what makes the
// "why did this card land here?" question answerable.
//
// Shapes are tuned against the real corpus in StoredEmail (2k+ issuer mails
// across 9 issuers), not against guesses. Notable realities that drive the
// design below:
//   · Marketing mail also carries the last4 ("Card xx9897 Update: ...loan
//     offer"), so last4 presence can NEVER imply a strong signal on its own.
//   · Bank-ACCOUNT alerts look almost exactly like card alerts (Kotak "a/c
//     XX4134", RBL "account ending with XXX0740", ICICI "bank account
//     XXXXXXXX1013"). Without a card-context guard these mint phantom cards.
//   · Masked PANs print the BIN first ("5241 XXXX XXXX 4011"), so a naive
//     4-digit scan picks the wrong end.
//   · SBI masks its statement PAN to two digits ("XXXX XXXX XXXX XX16") while
//     naming the product in the subject — the join has to carry the phrase
//     from one email to a last4 found in another.

export type SignalType =
  | "STATEMENT"
  | "TRANSACTION"
  | "PAYMENT_DUE"
  | "ACTIVATION"
  | "MARKETING";

/** Existence strength per signal type. Discrete, not tuned floats. */
export const SIGNAL_STRENGTH: Record<SignalType, number> = {
  STATEMENT: 0.99,
  TRANSACTION: 0.95,
  PAYMENT_DUE: 0.95,
  ACTIVATION: 0.9,
  MARKETING: 0.3,
};

/** Ordering used to pick the "strongest" signal backing an existence claim. */
export const SIGNAL_RANK: SignalType[] = [
  "STATEMENT",
  "TRANSACTION",
  "PAYMENT_DUE",
  "ACTIVATION",
  "MARKETING",
];

export interface EmailLike {
  id: string;
  issuer: string | null;
  subject: string;
  bodyPlain: string;
  fromEmail: string;
  date: Date | null;
  hasAttachments?: boolean;
}

// ---------------------------------------------------------------------------
// Card context
// ---------------------------------------------------------------------------

/**
 * Does this email talk about a CREDIT CARD at all?
 *
 * The gate that keeps savings-account alerts out. Every issuer in the corpus
 * sends both, from overlapping domains, in near-identical prose — the only
 * reliable discriminator is the phrase "credit card" (or cardmember/cardholder)
 * appearing somewhere in the mail.
 */
export function hasCardContext(text: string): boolean {
  return /\bcredit\s*card|\bcardmember|\bcardholder|\bcard\s*member/i.test(text);
}

/**
 * Phrases that mark the surrounding number as a BANK ACCOUNT, not a card. Used
 * to veto a last4 match whose immediate left context is account-ish, so a mail
 * that mentions both ("paid from a/c XX4134 to your credit card XX7027") does
 * not contribute the account's digits.
 */
const ACCOUNT_CONTEXT =
  /(?:bank\s+)?(?:account|a\/c|acct|savings|deposit)\s*(?:no\.?|number|ending(?:\s+with|\s+in)?)?\s*[:#]?\s*(?:X+[\s-]*)*$/i;

/**
 * ...but "Credit Card Account Number XXXX XXXX XXXX 7027" is a CARD account.
 * Without this the veto above swallows one of the most common statement
 * phrasings and the card never appears at all.
 */
const CARD_ACCOUNT_CONTEXT =
  /(?:credit\s*card|cardmember|cardholder)\s*(?:account|a\/c|acct)\b/i;

// ---------------------------------------------------------------------------
// last4 extraction
// ---------------------------------------------------------------------------

/**
 * Patterns that expose a card's trailing 4 digits. Each must capture the digits
 * in group 1 and must anchor on card-ish wording or an explicit mask, because an
 * unanchored \d{4} scan matches amounts, years, OTPs and phone numbers.
 */
const LAST4_PATTERNS: RegExp[] = [
  // "Credit Card No. XX2415", "credit card account 5241 XXXX XXXX 4011",
  // "Credit Card number XXXX XXXX XXXX 7027"
  /credit\s*card\s*(?:account\s*|a\/c\s*)?(?:no\.?|number)?\s*[:#]?\s*((?:\d{4}[\s-]*)?(?:X{2,}[\s-]*)*X*\d{4})\b/gi,
  // "Card ending 9897", "card ending with XXXX XXXX XXXX XX16", "ending in XX7767"
  /\bcard\s*(?:no\.?|number)?\s*ending\s*(?:with|in)?\s*[:#]?\s*((?:X{2,}[\s-]*)*X*\d{2,4})\b/gi,
  // "ending with XX7767" where "card" preceded a few words earlier
  /\bending\s*(?:with|in)?\s*[:#]?\s*((?:X{2,}[\s-]*)*X*\d{4})\b/gi,
  // Explicit masks: "**9897", "xx9897", "XXXX9897"
  /(?:\*{2,}|[xX]{2,})\s?(\d{4})\b/g,
  // Amex: "Account ending: 02008" — 5 digits, card context enforced by caller.
  /\baccount\s+ending\s*[:#]?\s*(\d{4,5})\b/gi,
  // "Card Account XXXX-XXXXXX-X2008"
  /card\s+account\s*[:#]?\s*((?:[X\d]{1,6}[\s-]*){1,3}\d{4,5})\b/gi,
];

/** Strip mask characters and separators, then take the trailing 4 digits. */
function normalizeLast4(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 2) return null;
  // A masked PAN prints the BIN first ("5241 XXXX XXXX 4011"); the card's
  // identity is the TRAILING group, so always read from the right. Amex prints
  // a 5-digit account tail, which we keep whole.
  return digits.length === 5 ? digits : digits.slice(-4);
}

export interface Last4Hit {
  last4: string;
  /** True when the source text only revealed 2–3 digits (SBI statements). */
  partial: boolean;
}

/**
 * Every distinct last4 this email asserts about a credit card.
 *
 * Returns [] when the mail has no card context at all — that single guard is
 * what stops savings-account traffic from minting cards.
 */
export function extractLast4(email: EmailLike): Last4Hit[] {
  const text = `${email.subject}\n${email.bodyPlain}`;
  if (!hasCardContext(text)) return [];

  const out = new Map<string, Last4Hit>();
  for (const pattern of LAST4_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      // Veto when the immediate left context names an account rather than a card.
      const left = text.slice(Math.max(0, m.index - 60), m.index);
      if (ACCOUNT_CONTEXT.test(left) && !CARD_ACCOUNT_CONTEXT.test(left)) continue;

      const digits = (m[1] ?? "").replace(/[^0-9]/g, "");
      const last4 = normalizeLast4(m[1] ?? "");
      if (!last4) continue;
      // Reject all-same-digit noise ("0000") and obvious year-like tokens.
      if (/^(\d)\1{3}$/.test(last4)) continue;

      const partial = digits.length < 4;
      const prev = out.get(last4);
      // A full read beats a partial one for the same tail.
      if (!prev || (prev.partial && !partial)) out.set(last4, { last4, partial });
    }
  }
  return [...out.values()];
}

// ---------------------------------------------------------------------------
// Signal classification
// ---------------------------------------------------------------------------

/** Sender localparts that are transactional by construction. */
const TRANSACTIONAL_SENDER =
  /^(alerts?|transactionalert|bankalerts|statements?|estatements?|creditcard\.estatements|onlinesbicard|credit_cards|noreply|no-reply|customercare)/i;

// Anchored at both ends (allowing a separator + suffix) so a transactional
// localpart that merely STARTS with a promo word — "informationsecurity",
// "update.alerts" — is not misread as marketing and downgraded to IGNORE.
const MARKETING_SENDER =
  /^(?:offers?|information|promo(?:tions?)?|newsletter|mailers?|updates?|marketing|news)(?:[._-]?(?:mailer|mail|team|india|in|noreply))?$/i;

/**
 * Classify what this email IS. Order matters: the first match wins, strongest
 * first, because a statement mail also contains due-date and amount wording.
 */
export function classifySignal(email: EmailLike): SignalType {
  const subject = email.subject ?? "";
  const body = email.bodyPlain ?? "";
  const text = `${subject}\n${body}`;
  const localpart = (email.fromEmail ?? "").split("@")[0] ?? "";

  const marketingSender = MARKETING_SENDER.test(localpart);

  // --- STATEMENT: a periodic statement for this card was issued.
  // Requires statement wording plus a period/attachment, so "check your
  // statement in the app" marketing does not qualify.
  const statementish =
    /\b(monthly\s+statement|card\s+statement|statement\s+for\s+the\s+period|e-?statement|online\s+statement|statement\s+is\s+(?:ready|attached|available)|year\s+end\s+summary)\b/i.test(
      text,
    );
  const hasPeriod =
    /\bfor\s+the\s+period\b|\bstatement\s+for\b|\bfrom\s+\w+\s+\d{1,2},?\s*\d{4}\s+to\b|-\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4}/i.test(
      text,
    );
  // An explicit first-party statement notification ("your monthly statement is
  // attached/ready") is a STATEMENT even when it names no period and the PDF is
  // served by link rather than attached — a very common real shape.
  const explicitStatement =
    /\b(?:your|the)\s+(?:latest\s+|monthly\s+|online\s+)*(?:card\s+|credit\s+card\s+|e-?)?statement\s+(?:is|has\s+been)\s+(?:now\s+)?(?:ready|attached|available|enclosed|generated)\b|\bplease\s+find\s+(?:attached|enclosed)\s+your\s+(?:monthly\s+)?(?:credit\s+card\s+)?statement\b|\battached\s+(?:herewith\s+)?is\s+the\s+(?:monthly\s+)?statement\b/i.test(
      text,
    );
  if (statementish && (hasPeriod || email.hasAttachments || explicitStatement) && !marketingSender) {
    return "STATEMENT";
  }

  // --- TRANSACTION: money actually moved on this card.
  //
  // Must be SETTLED and past-tense. Promo fine print is full of future-tense
  // money talk ("points will be credited", "cashback will be credited within
  // 90 days") that would otherwise upgrade an upgrade-solicitation into
  // first-party evidence — which is how a user's Gold card gets resolved to the
  // Platinum card being advertised to them.
  const settled =
    /\b(?:is|was|has\s+been|have\s+been)\s+(?:successfully\s+)?(?:debited|credited)\b|\b(?:debited|credited)\s+(?:from|to)\s+your\b|\bspent\s+(?:on|via|at|using)\b|\btransaction\s+(?:alert|declined|success|on\s+your)\b|\bpayment\s+(?:received|confirmation)\b|\bdebit\s+alert\b|\bpre-?debit\s+alert\b|\bwe\s+have\s+received\s+payment\b|\bpayment\s+of\s+(?:INR|Rs\.?|₹)[\d,.\s]+\s*(?:was|is|has\s+been)\s+received\b/i;
  const futurePromise =
    /\bwill\s+be\s+(?:credited|debited|reversed|refunded)\b|\bshall\s+be\s+credited\b|\bgets?\s+credited\s+within\b/i;
  if (settled.test(text) && !(futurePromise.test(text) && marketingSender)) {
    return "TRANSACTION";
  }

  // --- PAYMENT_DUE: a bill is outstanding on this card.
  if (
    /\b(?:payment|amount)\s+due\b|\bdue\s+date\b|\btotal\s+amount\s+due\b|\bminimum\s+(?:amount\s+)?due\b|payment\s+(?:due\s+)?reminder|outstanding\s+(?:amount|balance)|\bbalance\s+update\b/i.test(
      text,
    )
  ) {
    return "PAYMENT_DUE";
  }

  // --- ACTIVATION: a card was issued/dispatched/activated but has not billed.
  if (
    /\b(?:welcome\s+to|congratulations).{0,80}\bcredit\s*card\b|card\s+(?:has\s+been\s+)?(?:activated|dispatched|despatched|delivered|approved|issued)|your\s+(?:new\s+)?card\s+is\s+(?:on\s+its\s+way|here|ready)|set\s+(?:your\s+)?(?:card\s+)?PIN|application\s+(?:is\s+)?approved/i.test(
      text,
    ) &&
    !marketingSender
  ) {
    return "ACTIVATION";
  }

  // --- OTP mail is transactional in origin but proves only an attempt; it
  // still confirms the card exists, so treat it as a weak TRANSACTION when the
  // sender is transactional, else marketing.
  if (/one\s+time\s+password|\bOTP\b/i.test(text) && TRANSACTIONAL_SENDER.test(localpart)) {
    return "TRANSACTION";
  }

  return "MARKETING";
}

// ---------------------------------------------------------------------------
// Negative (liveness-killing) signals
// ---------------------------------------------------------------------------

export type NegativeKind = "CLOSED" | "BLOCKED" | "REPLACED";

/**
 * Does this email say the card is gone? Deliberately narrow — a false CLOSED
 * suppresses a real card, which is worse than surfacing a stale one.
 */
export function detectNegative(email: EmailLike): NegativeKind | null {
  const text = `${email.subject}\n${email.bodyPlain}`;
  if (!hasCardContext(text)) return null;

  // Boilerplate that discusses closure HYPOTHETICALLY. Amex promo T&Cs ("Cards
  // ... must not be cancelled") and MITC updates ("Your Card can be suspended
  // or cancelled in case...") would otherwise suppress a perfectly live card,
  // which is the single most damaging false positive in this pipeline.
  const HYPOTHETICAL =
    /\b(?:must\s+not\s+be|can\s+be|may\s+be|could\s+be|will\s+be\s+liable|risk\s+being|to\s+avoid\s+being|if\s+(?:your|the)\s+card\s+is)\s+(?:suspended\s+or\s+)?(?:cancell?ed|closed|terminated|deactivated)\b|\bmodify\s+or\s+cancel\s+this\s+promotion\b|\bcancel\s+(?:this|the)\s+(?:promotion|offer|booking|order|transaction|subscription)\b/i;

  /** Does `re` match somewhere that is NOT inside hypothetical boilerplate? */
  function firmMatch(re: RegExp): boolean {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    let m: RegExpExecArray | null;
    while ((m = g.exec(text)) !== null) {
      const around = text.slice(Math.max(0, m.index - 120), m.index + m[0].length + 60);
      if (!HYPOTHETICAL.test(around)) return true;
    }
    return false;
  }

  // Definite, already-decided closure of THIS card.
  const CLOSED =
    /\b(?:has\s+been|have\s+been|is|was|stands)\s+(?:permanently\s+)?(?:closed|cancell?ed|terminated|deactivated)\b|\bwill\s+be\s+deactivated\b|\bcard\s+closure\s+(?:request|confirmation|completed)\b|\bclosure\s+of\s+your\s+[^.\n]{0,40}card\b|\byour\s+request\s+(?:to\s+close|for\s+closure)\b|\bsuccessfully\s+(?:closed|surrendered)\b/i;

  if (firmMatch(CLOSED)) {
    // "previous credit card no. XX2415 will be deactivated" → a replacement,
    // not a closed relationship. Distinguished so the UI can say why.
    if (/\bprevious\b|\breplac(?:ed|ement)\b|\bupgrad(?:ed|e)d?\s+(?:to|card)\b|\bnew\s+card\s+(?:has\s+been\s+)?(?:issued|dispatched|sent)\b/i.test(text)) {
      return "REPLACED";
    }
    return "CLOSED";
  }

  if (firmMatch(/\byour\s+card\s+(?:has\s+been\s+)?(?:blocked|hotlisted)\b|\bcard\s+(?:has\s+been\s+)(?:blocked|hotlisted)\b/i)) {
    return "BLOCKED";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Product phrase extraction
// ---------------------------------------------------------------------------

/**
 * Words that look like a product name but are boilerplate. Stripped so
 * "Your HDFC Bank Credit Card" does not become a distinct product from
 * "HDFC Bank Credit Card".
 */
const PHRASE_LEAD_NOISE =
  /^(?:your|the|a|an|my|our|this|dear|new|previous|existing|lifetime\s+free|free|upgraded|complimentary|add-?on|latest|monthly|annual)\s+/i;

/**
 * Phrases that are shaped like a product name but never identify one the user
 * holds. Learned from the corpus rather than assumed:
 *   · network names — "VISA Credit Card", "RuPay Card"
 *   · other instruments — "Debit Card", "Gift Card", "Forex Card"
 *   · relationship words — "Supplementary Card", "Add-on Card", "Basic Card"
 *   · referral artefacts — "MGMee's Card" (Amex refer-a-friend boilerplate)
 * Without this, Amex promo mail resolves the user's Gold card to "Platinum".
 */
const NON_PRODUCT_PHRASE =
  /^(?:(?:the|a|an)\s+)?(?:visa|mastercard|master\s*card|rupay|maestro|diners(?:\s+club)?|debit|gift|forex|travel\s+money|prepaid|virtual|supplementary|add-?on|additional|basic|primary|secondary|replacement|physical|digital|online|corporate|business|commercial|companion|partner|employee|student|international|domestic|smart|new|existing|other|all|both|each|any|such|these|those|their|our|his|her|its)\s+(?:credit\s+)?cards?$/i;

/** Possessive or pronoun-led artefacts: "MGMee's Card", "Friend's Card". */
const POSSESSIVE_PHRASE = /['’]s\s+(?:credit\s+)?cards?$/i;

function isProductPhrase(phrase: string): boolean {
  if (NON_PRODUCT_PHRASE.test(phrase)) return false;
  if (POSSESSIVE_PHRASE.test(phrase)) return false;
  // Must contain at least one token that is not generic card vocabulary, or it
  // names a category rather than a product.
  const generic =
    /^(?:credit|card|cards|bank|the|a|an|your|my|our|new|online|my\s*card)$/i;
  return phrase.split(/\s+/).some((t) => !generic.test(t));
}

/**
 * Candidate product phrases in this email, longest first.
 *
 * The grammar is "<0-4 capitalised words> <issuer-ish word> <0-3 words> Card".
 * It over-generates on purpose; scoring against the catalog (see resolve.ts) is
 * what separates "Swiggy HDFC Bank Credit Card" from "HDFC Bank Credit Card".
 */
export function extractProductPhrases(email: EmailLike): string[] {
  const text = `${email.subject}\n${email.bodyPlain}`;
  if (!hasCardContext(text)) return [];

  const out = new Map<string, number>();
  const re =
    /\b((?:[A-Z][A-Za-z0-9&'’.+-]*\s+){1,6}?(?:Credit\s+)?Cards?)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    let phrase = m[1].replace(/\s+/g, " ").trim();
    // Peel leading boilerplate, possibly stacked ("Your New HDFC ... Card").
    let prev: string;
    do {
      prev = phrase;
      phrase = phrase.replace(PHRASE_LEAD_NOISE, "");
    } while (phrase !== prev);

    if (phrase.split(/\s+/).length < 2) continue;
    if (!isProductPhrase(phrase)) continue;
    // Skip phrases whose surrounding text is payment-rail instruction rather
    // than a statement about the user's card ("...using NEFT / RTGS / Visa
    // Money Transfer facility").
    const after = text.slice(re.lastIndex, re.lastIndex + 40);
    if (/^\s*(?:money\s+transfer|transfer\s+facility|payment\s+(?:facility|option)|network)/i.test(after)) {
      continue;
    }
    // Drop phrases containing sentence punctuation — a regex crossing a clause
    // boundary ("Dear Mayank \n\n Your HDFC Bank Credit Card").
    if (/[.:;!?]/.test(phrase)) continue;
    out.set(phrase, (out.get(phrase) ?? 0) + 1);
  }
  return [...out.keys()].sort((a, b) => b.length - a.length);
}
