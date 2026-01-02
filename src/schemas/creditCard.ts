import z from "zod";

const luhnCheck = (cardNumber: string): boolean => {
  let sum = 0;
  let shouldDouble = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = Number(cardNumber[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

export const creditCardSchema = z
  .string()
  .trim()
  .regex(/^\d{13,19}$/, "Credit card number must be 13–19 digits")
  .refine(luhnCheck, {
    message: "Invalid credit card number",
  });
