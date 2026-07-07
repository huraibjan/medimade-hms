import { z } from "zod";

export const appointmentStatuses = [
  "scheduled",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show"
] as const;

export const appointmentSchema = z.object({
  patient_id: z.string().min(1, "Select a patient"),
  doctor_id: z.string().min(1, "Select a doctor"),
  department_id: z.string().optional(),
  scheduled_start: z.string().min(1, "Start time is required"),
  scheduled_end: z.string().min(1, "End time is required"),
  reason: z.string().optional(),
  notes: z.string().optional()
}).refine((value) => new Date(value.scheduled_end) > new Date(value.scheduled_start), {
  message: "End time must be after start time",
  path: ["scheduled_end"]
});

export const appointmentStatusSchema = z.object({
  status: z.enum(appointmentStatuses),
  cancellation_reason: z.string().optional(),
  create_encounter: z.boolean().optional()
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type AppointmentStatusInput = z.infer<typeof appointmentStatusSchema>;
export type AppointmentStatusValue = (typeof appointmentStatuses)[number];
