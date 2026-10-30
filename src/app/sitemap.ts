import type { MetadataRoute } from "next";

const SITE_URL = "https://www.gofisense.com";

// Public, indexable pages only — everything else sits behind sign-in.
const PATHS = [
  "/",
  "/about",
  "/credit-card-offers/festive",
  "/sale/flipkart",
  "/tools/saving-calculator",
  "/privacy-policy",
  "/terms",
  "/legal-compliance",
  "/affiliate-disclosure",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({ url: `${SITE_URL}${path}` }));
}
