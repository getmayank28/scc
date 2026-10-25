import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react-hooks/exhaustive-deps": "off",
    },
  },
  // Recommendations are ranked on rewards alone, as the affiliate-disclosure
  // page promises. Keep commission data out of reach of the engines and the
  // routes that serve them, so that stays true by construction.
  {
    files: [
      "src/lib/logic/advisor/**",
      "src/lib/advisor/**",
      "src/app/api/recommend/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Matched on folder/file names so alias ("@/lib/cuelinks/…")
              // and relative ("../../cuelinks/…") imports are both caught.
              group: [
                "**/cuelinks/**",
                "**/affiliate/**",
                "**/deals/**",
                "**/AffiliateTransaction",
                "**/OutboundClick",
                "**/LiveOffer",
                "**/AffiliateLinkCache",
                "**/ReportCache",
              ],
              message:
                "Recommendation code must not depend on affiliate/commission data — rankings are reward-based only (see affiliate-disclosure).",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
