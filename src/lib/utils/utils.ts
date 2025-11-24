import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function camelCaseToWords(str: string) {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

export function formatAmount(amount: number) {
  if (amount < 1000) {
    return amount.toString();
  } else if (amount < 100000) {
    // Thousands
    return (
      (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1).replace(/\.0$/, "") +
      "k"
    );
  } else if (amount < 10000000) {
    // Lakhs
    return (
      (amount / 100000)
        .toFixed(amount % 100000 === 0 ? 0 : 1)
        .replace(/\.0$/, "") + "L"
    );
  } else {
    // Crores
    return (
      (amount / 10000000)
        .toFixed(amount % 10000000 === 0 ? 0 : 1)
        .replace(/\.0$/, "") + "Cr"
    );
  }
}
