import { ROUTES } from "@/lib/constants/routes";

/**
 * Deep link into the spend optimizer. The optimizer reads these params on
 * mount, prefills its inputs and runs once the wallet is loaded.
 */
export function optimizerHref({
  merchant,
  category,
  amount,
}: {
  merchant?: string | null;
  category?: string | null;
  amount?: number | null;
}): string {
  const params = new URLSearchParams();
  if (merchant) params.set("merchant", merchant);
  if (category) params.set("category", category);
  if (amount && amount > 0) params.set("amount", String(Math.round(amount)));
  const qs = params.toString();
  return qs ? `${ROUTES.SPEND_OPTIMIZER}?${qs}` : ROUTES.SPEND_OPTIMIZER;
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Rates come back as floats (7.000000000000001); one decimal is enough. */
export const pct = (n: number) => `${Math.round(n * 10) / 10}%`;
