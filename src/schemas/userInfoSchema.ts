import { z } from "zod";

export const EMPLOYMENT_TYPE_VALUES = [
  "salaried",
  "self_employed",
  "retired",
  "student_unemployed",
] as const;

export type EmploymentTypeValue = (typeof EMPLOYMENT_TYPE_VALUES)[number];

export const EMPLOYMENT_TYPES: { value: EmploymentTypeValue; label: string }[] = [
  { value: "salaried", label: "Salaried" },
  { value: "self_employed", label: "Self-employed / Business Owner" },
  { value: "retired", label: "Retired" },
  { value: "student_unemployed", label: "Student / Currently Not Employed" },
];

export const INCOME_RANGE_VALUES = [
  "below_30k",
  "30k_to_50k",
  "50k_to_1l",
  "1l_to_2_5l",
  "2_5l_to_5l",
  "below_5l",
  "5l_to_10l",
  "10l_to_20l",
  "20l_to_50l",
  "50l_to_1cr",
  "1l_to_2l",
] as const;

export type IncomeRangeValue = (typeof INCOME_RANGE_VALUES)[number];

export const SALARIED_INCOME_RANGES: { value: IncomeRangeValue; label: string }[] = [
  { value: "below_30k", label: "Below ₹30K" },
  { value: "30k_to_50k", label: "₹30K – ₹50K" },
  { value: "50k_to_1l", label: "₹50K – ₹1L" },
  { value: "1l_to_2_5l", label: "₹1L – ₹2.5L" },
  { value: "2_5l_to_5l", label: "₹2.5L – ₹5L" },
];

export const SELF_EMPLOYED_INCOME_RANGES: { value: IncomeRangeValue; label: string }[] = [
  { value: "below_5l", label: "Below ₹5 Lakhs" },
  { value: "5l_to_10l", label: "₹5 Lakhs – ₹10 Lakhs" },
  { value: "10l_to_20l", label: "₹10 Lakhs – ₹20 Lakhs" },
  { value: "20l_to_50l", label: "₹20 Lakhs – ₹50 Lakhs" },
  { value: "50l_to_1cr", label: "₹50 Lakhs – ₹1 Crore" },
];

export const RETIRED_INCOME_RANGES: { value: IncomeRangeValue; label: string }[] = [
  { value: "below_30k", label: "Below ₹30K" },
  { value: "30k_to_50k", label: "₹30K – ₹50K" },
  { value: "50k_to_1l", label: "₹50K – ₹1L" },
  { value: "1l_to_2l", label: "₹1L – ₹2L" },
];

export function getIncomeRangesForEmployment(type: EmploymentTypeValue) {
  switch (type) {
    case "salaried":
      return SALARIED_INCOME_RANGES;
    case "self_employed":
      return SELF_EMPLOYED_INCOME_RANGES;
    case "retired":
      return RETIRED_INCOME_RANGES;
    case "student_unemployed":
      return [];
  }
}

export function getIncomeLabel(type: EmploymentTypeValue) {
  switch (type) {
    case "salaried":
      return "Your monthly take-home salary";
    case "self_employed":
      return "Annual income as per last tax return (ITR)";
    case "retired":
      return "Approximate monthly income from pension or other sources";
    default:
      return "";
  }
}

// Keep old exports for backward compat during migration
export const SALARY_RANGE_VALUES = INCOME_RANGE_VALUES;
export type SalaryRangeValue = IncomeRangeValue;
export const SALARY_RANGES = SALARIED_INCOME_RANGES;

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
  employmentType: z.enum(EMPLOYMENT_TYPE_VALUES, {
    error: "Please select your employment type",
  }),
  salaryRange: z.enum(INCOME_RANGE_VALUES).optional(),
  informationConsent: z.boolean(),
  promotionalConsent: z.boolean(),
}).refine(
  (data) => {
    if (data.employmentType === "student_unemployed") return true;
    return !!data.salaryRange;
  },
  { message: "Please select your income range", path: ["salaryRange"] }
);

export const updateProfileInfoSchema = z.object({
  employmentType: z.enum(EMPLOYMENT_TYPE_VALUES, {
    error: "Please select your employment type",
  }),
  salaryRange: z.enum(INCOME_RANGE_VALUES).optional(),
}).refine(
  (data) => {
    if (data.employmentType === "student_unemployed") return true;
    return !!data.salaryRange;
  },
  { message: "Please select your income range", path: ["salaryRange"] }
);

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UserInfoInput = z.infer<typeof userInfoSchema>;
