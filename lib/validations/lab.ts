import { z } from "zod";

export const labOrderStatuses = ["ordered", "sample_collected", "processing", "completed", "cancelled"] as const;
export const labResultStatuses = ["pending", "normal", "abnormal", "critical"] as const;
export const labPriorities = ["routine", "urgent", "stat"] as const;

export const labTestSchema = z.object({
  test_name: z.string().min(2, "Test name is required"),
  test_code: z.string().min(2, "Test code is required"),
  category: z.string().optional(),
  description: z.string().optional(),
  sample_type: z.string().optional(),
  price: z.coerce.number().min(0),
  reference_range: z.string().optional(),
  is_active: z.boolean().default(true)
});

export const labOrderSchema = z.object({
  patient_id: z.string().min(1, "Select a patient"),
  doctor_id: z.string().optional(),
  encounter_id: z.string().optional(),
  technician_id: z.string().optional(),
  test_ids: z.array(z.string().min(1)).min(1, "Select at least one lab test"),
  priority: z.enum(labPriorities).default("routine"),
  notes: z.string().optional()
});

export const labOrderStatusSchema = z.object({
  status: z.enum(labOrderStatuses)
});

export const labResultSchema = z.object({
  result_value: z.string().optional(),
  result_unit: z.string().optional(),
  reference_range: z.string().optional(),
  result_status: z.enum(labResultStatuses),
  technician_id: z.string().optional(),
  result_notes: z.string().optional()
});

export type LabTestInput = z.infer<typeof labTestSchema>;
export type LabOrderInput = z.infer<typeof labOrderSchema>;
export type LabOrderStatusInput = z.infer<typeof labOrderStatusSchema>;
export type LabResultInput = z.infer<typeof labResultSchema>;
