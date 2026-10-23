/**
 * Reads the headline discount out of a Cuelinks offer title, since the feed's
 * own `percentOff` is always empty. Titles are marketing copy ("Score Up to 75%
 * Off + Extra 10%!", "Flat Rs.900 Discount", "Tank Tops from Rs. 499"), so this
 * looks for, in order: a percentage, a rupee amount off, a starting price.
 */

export interface Discount {
  /** Short badge text: "Up to 75% off", "₹900 off", "From ₹499". */
  label: string;
  /** The percentage, when the deal states one; used for ranking. */
  percent: number | null;
  /** Rupees off, when the deal states an amount instead of a percentage. */
  amount: number | null;
}

// "10% NeuCoins" is store currency, not a discount.
const PERCENT_RE = /(\d{1,2})\s*%(?!\s*(?:neu)?coins)/gi;
const AMOUNT_OFF_RE =
  /(?:(?:rs\.?|₹|inr)\s*([\d,]+)\s*(?:\/-\s*)?(?:off|discount|cashback|instant))|(?:(?:save|flat)\s*(?:rs\.?|₹)\s*([\d,]+))/i;
const PRICE_RE = /\b(starting|from|under|only|just|for|at|of)\b[^\d₹]{0,15}(?:rs\.?|₹)\s*([\d,]+)/i;
const BOGO_RE = /buy\s*(\d)\s*,?\s*get\s*(\d)\s*free|pay\s*for\s*(\d)\s*nights?,?\s*get\s*(\d)\s*free/i;

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const upToBefore = (text: string, index: number) => /up\s*to\s*$/i.test(text.slice(Math.max(0, index - 12), index).trim());

export function parseDiscount(title: string): Discount | null {
  let best: { pct: number; index: number } | null = null;
  for (const m of title.matchAll(PERCENT_RE)) {
    const pct = Number(m[1]);
    if (pct > 0 && (!best || pct > best.pct)) best = { pct, index: m.index ?? 0 };
  }
  if (best) {
    const prefix = upToBefore(title, best.index) ? "Up to " : "";
    return { label: `${prefix}${best.pct}% off`, percent: best.pct, amount: null };
  }

  const off = title.match(AMOUNT_OFF_RE);
  if (off) {
    const amount = Number((off[1] ?? off[2]).replace(/,/g, ""));
    if (amount > 0) {
      const prefix = upToBefore(title, off.index ?? 0) ? "Up to " : "";
      return { label: `${prefix}${rupees(amount)} off`, percent: null, amount };
    }
  }

  const bogo = title.match(BOGO_RE);
  if (bogo) {
    const label = bogo[1] ? `Buy ${bogo[1]} Get ${bogo[2]}` : `${bogo[4]} night${bogo[4] === "1" ? "" : "s"} free`;
    return { label, percent: null, amount: null };
  }

  const price = title.match(PRICE_RE);
  if (price) {
    const value = Number(price[2].replace(/,/g, ""));
    if (value > 0) {
      const word = price[1].toLowerCase();
      const prefix = word === "under" ? "Under" : word === "starting" || word === "from" ? "From" : "Only";
      return { label: `${prefix} ${rupees(value)}`, percent: null, amount: null };
    }
  }

  return null;
}

/**
 * A coupon's % off plus the card's % back on what's left to pay:
 * 10% off then 6% back on the remaining 90% ≈ 15.4% saved in all.
 */
export function stackedPercent(discountPct: number, cardPct: number): number {
  return discountPct + ((100 - discountPct) * cardPct) / 100;
}
