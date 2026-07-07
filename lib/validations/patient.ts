import { z } from "zod";

export const genderOptions = ["male", "female", "other", "unknown"] as const;
export const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"] as const;

export const patientSchema = z.object({
  mrn: z.string().trim().optional(),
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(genderOptions, { message: "Gender is required" }),
  blood_group: z.enum(bloodGroupOptions).optional().or(z.literal("")),
  phone: z.string().min(7, "Phone is required"),
  email: z.string().email("Use a valid email").optional().or(z.literal("")),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  allergies: z.string().optional(),
  chronic_conditions: z.string().optional(),
  notes: z.string().optional()
});

export type PatientFormValues = z.infer<typeof patientSchema>;
