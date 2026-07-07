import { z } from "zod";
import type { UserRole } from "./database";

export const roles = [
  "super_admin",
  "hospital_admin",
  "doctor",
  "nurse",
  "receptionist",
  "pharmacist",
  "lab_technician",
  "billing_staff"
] as const satisfies readonly UserRole[];

export const roleSchema = z.enum(roles);
export type Role = (typeof roles)[number];
