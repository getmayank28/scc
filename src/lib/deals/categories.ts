/**
 * Shopper-facing category for a deals store. Portal `portalType` is mostly
 * "others" (Croma, Tata CLiQ, Jockey…), and it also drives card scoring in
 * `bestCard.ts`, so rather than rewrite it we curate the stores that have
 * deals here and fall back to `portalType` for the rest.
 */

export const DEAL_CATEGORIES = [
  "Fashion",
  "Beauty",
  "Electronics",
  "Health",
  "Travel",
  "Home & gifts",
  "Kids",
  "Food",
  "Grocery",
  "Entertainment",
  "Shopping",
  "More",
] as const;

export type DealCategory = (typeof DEAL_CATEGORIES)[number];

const BY_SLUG: Record<string, DealCategory> = {
  ajio: "Fashion",
  biba: "Fashion",
  campus: "Fashion",
  decathlon: "Fashion",
  jockey: "Fashion",
  "linen-club": "Fashion",
  "louis-philippe": "Fashion",
  luxe: "Fashion",
  "marks-spencer": "Fashion",
  "nykaa-fashion": "Fashion",
  only: "Fashion",
  palmonas: "Fashion",
  pantaloons: "Fashion",
  "tata-cliq": "Fashion",
  "tata-cliq-fashion": "Fashion",
  "tcns-w": "Fashion",
  "w-for-women": "Fashion",

  nykaa: "Beauty",
  "nua-woman": "Beauty",
  plum: "Beauty",
  skinn: "Beauty",
  "swiss-beauty": "Beauty",
  "the-man-company": "Beauty",

  agaro: "Electronics",
  boat: "Electronics",
  croma: "Electronics",
  noise: "Electronics",
  "vijay-sales": "Electronics",

  healthkart: "Health",
  "wellbeing-nutrition": "Health",

  "air-india": "Travel",
  "itc-hotels": "Travel",
  klook: "Travel",

  "flower-aura": "Home & gifts",
  igp: "Home & gifts",
  pepperfry: "Home & gifts",

  "first-cry": "Kids",
};

const BY_PORTAL_TYPE: Record<string, DealCategory> = {
  fashion: "Fashion",
  jewellery: "Fashion",
  travel: "Travel",
  healthcare: "Health",
  "food-and-delivery": "Food",
  grocery: "Grocery",
  "OTT/software": "Entertainment",
  "e-commerce": "Shopping",
};

export function dealCategory(slug: string, portalType?: string | null): DealCategory {
  if (BY_SLUG[slug]) return BY_SLUG[slug];
  if (slug.startsWith("makemytrip")) return "Travel";
  if (slug.startsWith("unipin")) return "Entertainment";
  return BY_PORTAL_TYPE[portalType ?? ""] ?? "More";
}
