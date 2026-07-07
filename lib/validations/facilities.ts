import { z } from "zod";

export const roomSchema = z.object({
  ward_id: z.string().min(1),
  room_number: z.string().min(1),
  room_type: z.enum(["general", "private", "semi_private", "icu", "emergency", "operating", "isolation"]),
  status: z.enum(["available", "occupied", "reserved", "cleaning", "maintenance", "inactive"]).default("available"),
  daily_rate: z.coerce.number().min(0).default(0)
});

export const wardSchema = z.object({
  department_id: z.string().optional(),
  name: z.string().min(1),
  floor: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true)
});

export const bedSchema = z.object({
  room_id: z.string().min(1),
  bed_number: z.string().min(1),
  status: z.enum(["available", "occupied", "reserved", "cleaning", "maintenance"]).default("available"),
  current_patient_id: z.string().optional()
});

export type RoomInput = z.infer<typeof roomSchema>;
export type WardInput = z.infer<typeof wardSchema>;
export type BedInput = z.infer<typeof bedSchema>;
