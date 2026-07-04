/**
 * Derives a human-readable card name from a dataset slug. Slugs follow the
 * pattern `<card-name>-<issuer-slug>` (often with the issuer duplicated), e.g.
 * "american-express-gold-card-american-express" -> "American Express Gold Card".
 * We strip the trailing issuer suffix (matched from the row's `bank`) and
 * title-case the rest, upper-casing common acronyms.
 */

// Trailing issuer slug (space-joined) for each `bank` value seen in the dataset.
const BANK_SUFFIX: Record<string, string> = {
  AMEX: "american express",
  "AU Bank": "au bank",
  "Axis Bank": "axis bank",
  "Bank of Baroda": "bank of baroda",
  "HDFC Bank": "hdfc bank",
  "ICICI Bank": "icici bank",
  "IDFC First Bank": "idfc first bank",
  "IndusInd Bank": "indusind bank",
  "Kotak Mahindra Bank": "kotak mahindra bank",
  "RBL Bank": "rbl bank",
  "SBI Card": "sbi",
  "Standard Chartered": "standard chartered",
  "Yes Bank": "yes bank",
  HSBC: "hsbc",
  "Federal Bank": "federal bank",
  "SBM Bank": "sbm bank",
  "CSB Bank": "csb bank",
};

const ACRONYMS = new Set([
  "bob",
  "sbi",
  "au",
  "rbl",
  "hdfc",
  "icici",
  "hsbc",
  "idfc",
  "csb",
  "sbm",
  "abc",
  "emi",
  "uae",
]);

const titleWord = (word: string): string => {
  const lower = word.toLowerCase();
  if (ACRONYMS.has(lower)) return lower.toUpperCase();
  if (lower === "amex") return "Amex";
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export function cardDisplayName(slug: string, bank: string): string {
  let words = slug.replace(/-+/g, " ").trim().split(" ").filter(Boolean);

  const suffix = BANK_SUFFIX[bank];
  if (suffix) {
    const sw = suffix.split(" ");
    if (
      words.length > sw.length &&
      words.slice(-sw.length).join(" ") === suffix
    ) {
      words = words.slice(0, words.length - sw.length);
    }
  }

  if (words.length === 0) {
    words = slug.replace(/-+/g, " ").trim().split(" ").filter(Boolean);
  }

  return words.map(titleWord).join(" ");
}
