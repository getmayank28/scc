// Indian card-issuer sender domains used to filter mail server-side.
//
// Starting list for the spike — expected to be wrong at the edges. Statement
// mail often comes from a different subdomain than alert mail, so treat a miss
// here as "add the domain", not "the issuer has no mail".

export interface IssuerFilter {
  slug: string;
  label: string;
  /** Matched against Unipile's `from` filter, one query per domain. */
  domains: string[];
}

export const ISSUER_FILTERS: IssuerFilter[] = [
  {
    slug: "hdfc",
    label: "HDFC Bank",
    domains: ["hdfcbank.net", "hdfcbank.com"],
  },
  {
    slug: "icici",
    label: "ICICI Bank",
    domains: ["icicibank.com"],
  },
  {
    slug: "axis",
    label: "Axis Bank",
    domains: ["axisbank.com"],
  },
  {
    slug: "sbi",
    label: "SBI Card",
    domains: ["sbicard.com"],
  },
  {
    slug: "amex",
    label: "American Express",
    domains: ["americanexpress.com", "aexp.com"],
  },
  {
    slug: "kotak",
    label: "Kotak Mahindra",
    domains: ["kotak.com"],
  },
  {
    slug: "idfc",
    label: "IDFC First",
    domains: ["idfcfirstbank.com"],
  },
  {
    slug: "yes",
    label: "Yes Bank",
    domains: ["yesbank.in"],
  },
  {
    slug: "rbl",
    label: "RBL Bank",
    domains: ["rblbank.com"],
  },
  {
    slug: "indusind",
    label: "IndusInd Bank",
    domains: ["indusind.com"],
  },
];

export const ISSUER_BY_SLUG = new Map(
  ISSUER_FILTERS.map((i) => [i.slug, i]),
);

export function allIssuerDomains(): string[] {
  return ISSUER_FILTERS.flatMap((i) => i.domains);
}
