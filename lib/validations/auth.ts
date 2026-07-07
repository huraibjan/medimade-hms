import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters.")
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the account owner's name."),
  hospitalName: z.string().trim().min(2, "Enter the hospital name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.")
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
