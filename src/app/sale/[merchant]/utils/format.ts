/** Indian-format currency, e.g. 250000 -> "₹2,50,000". */
export function inr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Compact currency for tight UI, e.g. 250000 -> "₹2.5L". */
export function inrCompact(amount: number): string {
  const n = Math.round(amount);
  if (n >= 10000000) return `₹${trim(n / 10000000)}Cr`;
  if (n >= 100000) return `₹${trim(n / 100000)}L`;
  if (n >= 1000) return `₹${trim(n / 1000)}k`;
  return `₹${n}`;
}

function trim(value: number): string {
  return value.toFixed(value % 1 === 0 ? 0 : 1).replace(/\.0$/, "");
}
