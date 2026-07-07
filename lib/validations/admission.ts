import { z } from "zod";

export const admissionSchema = z.object({
  patient_id: z.string().min(1, "Select a patient"),
  admitting_doctor_id: z.string().optional(),
  department_id: z.string().optional(),
  bed_id: z.string().optional(),
  admission_datetime: z.string().optional(),
  expected_discharge_datetime: z.string().optional(),
  reason: z.string().min(2, "Admission reason is required"),
  diagnosis_summary: z.string().optional()
});

export type AdmissionInput = z.infer<typeof admissionSchema>;

export const bedAssignmentSchema = z.object({
  admission_id: z.string().min(1),
  patient_id: z.string().min(1),
  bed_id: z.string().min(1, "Select an available bed"),
  release_current: z.boolean().optional()
});

export const dischargeSchema = z.object({
  admission_id: z.string().min(1),
  discharge_datetime: z.string().optional(),
  release_reason: z.string().optional()
});

export type BedAssignmentInput = z.infer<typeof bedAssignmentSchema>;
export type DischargeInput = z.infer<typeof dischargeSchema>;
