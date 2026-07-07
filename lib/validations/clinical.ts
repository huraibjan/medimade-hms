import { z } from "zod";

export const encounterTypes = ["outpatient", "inpatient", "emergency", "follow_up"] as const;

export const encounterSchema = z.object({
  patient_id: z.string().min(1, "Select a patient"),
  appointment_id: z.string().optional(),
  admission_id: z.string().optional(),
  doctor_id: z.string().optional(),
  nurse_id: z.string().optional(),
  encounter_type: z.enum(encounterTypes),
  chief_complaint: z.string().optional(),
  notes: z.string().optional()
});

export const clinicalNotesSchema = z.object({
  chief_complaint: z.string().optional(),
  doctor_notes: z.string().optional(),
  nurse_notes: z.string().optional()
});

export const vitalsSchema = z.object({
  patient_id: z.string().min(1),
  encounter_id: z.string().optional(),
  temperature_c: z.coerce.number().optional(),
  blood_pressure_systolic: z.coerce.number().int().optional(),
  blood_pressure_diastolic: z.coerce.number().int().optional(),
  pulse: z.coerce.number().int().optional(),
  respiratory_rate: z.coerce.number().int().optional(),
  oxygen_saturation: z.coerce.number().min(0).max(100).optional(),
  weight_kg: z.coerce.number().optional(),
  height_cm: z.coerce.number().optional(),
  pain_score: z.coerce.number().int().min(0).max(10).optional()
});

export const diagnosisSchema = z.object({
  patient_id: z.string().min(1),
  encounter_id: z.string().optional(),
  diagnosis_code: z.string().optional(),
  diagnosis_name: z.string().min(2, "Diagnosis name is required"),
  description: z.string().optional(),
  is_primary: z.boolean().default(false)
});

export const treatmentPlanSchema = z.object({
  patient_id: z.string().min(1),
  encounter_id: z.string().optional(),
  plan_title: z.string().min(2, "Plan title is required"),
  plan_details: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().default("active")
});

export type EncounterInput = z.infer<typeof encounterSchema>;
export type ClinicalNotesInput = z.infer<typeof clinicalNotesSchema>;
export type VitalsInput = z.infer<typeof vitalsSchema>;
export type DiagnosisInput = z.infer<typeof diagnosisSchema>;
export type TreatmentPlanInput = z.infer<typeof treatmentPlanSchema>;
