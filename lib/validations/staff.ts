import { z } from "zod";
import { roleSchema } from "@/types/roles";

export const staffSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  role: roleSchema,
  department_id: z.string().optional(),
  phone: z.string().optional()
});

export type StaffInput = z.infer<typeof staffSchema>;
