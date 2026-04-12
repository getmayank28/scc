import { z } from "zod";

export const SALARY_RANGE_VALUES = [
  "below_5",
  "5_to_10",
  "10_to_20",
  "20_to_50",
  "above_50",
] as const;

export type SalaryRangeValue = (typeof SALARY_RANGE_VALUES)[number];

/** Display labels — safe for client-side import (no mongoose dependency) */
export const SALARY_RANGES: { value: SalaryRangeValue; label: string }[] = [
  { value: "below_5", label: "Below ₹5 LPA" },
  { value: "5_to_10", label: "₹5 LPA – ₹10 LPA" },
  { value: "10_to_20", label: "₹10 LPA – ₹20 LPA" },
  { value: "20_to_50", label: "₹20 LPA – ₹50 LPA" },
  { value: "above_50", label: "Above ₹50 LPA" },
];

export const indianPhoneRegex = /^[6-9]\d{9}$/;

export const sendOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(indianPhoneRegex, "Enter a valid 10-digit Indian mobile number"),
});

export const verifyOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(indianPhoneRegex, "Enter a valid 10-digit Indian mobile number"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain digits only"),
});

export const userInfoSchema = z.object({
  verificationToken: z.string().min(1, "Phone verification required"),
  salaryRange: z.enum(SALARY_RANGE_VALUES, {
    error: "Please select a salary range",
  }),
  informationConsent: z.boolean(),
  promotionalConsent: z.boolean(),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UserInfoInput = z.infer<typeof userInfoSchema>;
