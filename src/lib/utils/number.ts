export function formatNumber(val: number) {
  const value = Number(val);
  if (Number(value) >= 100000) {
    const num = (value / 100000).toFixed(1);
    return `${num.endsWith(".0") ? num.slice(0, -2) : num}L`;
  }

  if (value >= 1000) {
    const num = (value / 1000).toFixed(1);
    return `${num.endsWith(".0") ? num.slice(0, -2) : num}K`;
  }

  return Number(value?.toString() || 0).toFixed();
}

export const formatCurrency = (value: string): string => {
  if (!value) return "";
  const number = value.replace(/[^\d]/g, "");
  const formatted = new Intl.NumberFormat("en-IN").format(Number(number));
  return `₹${formatted}`;
};

export function calculateRewardsSpendRatio(
  totalRewardsEarned?: number | null,
  totalAmountSpent?: number | null,
): number {
  const earned = Number(totalRewardsEarned) || 0;
  const spent = Number(totalAmountSpent) || 0;

  if (spent === 0 || earned === 0) return 0;

  return Math.round((earned / spent) * 100);
}

export function getRedemptionRatio(inrPerPoint: number) {
  if (inrPerPoint <= 0) return null;

  if (Number.isInteger(1 / inrPerPoint)) {
    return `${1 / inrPerPoint}:1`;
  } else {
    return `1:${inrPerPoint}`;
  }
}

export function convertStringToNumber(value: string) {
  return Number(value.replace(/,/g, ""));
}

export function formatToINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
