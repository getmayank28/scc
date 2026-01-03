import z from "zod";

export const usernameValidations = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be less than 20 characters");

export const signUpSchema = z.object({
  username: usernameValidations,
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const emailVerificationSchema = z.string().email();
