import { randomUUID } from "crypto";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import { diagnosisSchema, type DiagnosisInput } from "@/lib/validations/clinical";

export type DiagnosisRecord = {
  id: string;
  hospital_id: string;
  patient_id: string;
  encounter_id?: string | null;
  doctor_id?: string | null;
  diagnosis_code?: string | null;
  diagnosis_name: string;
  description?: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at?: string;
};

export async function listDiagnoses(patientId: string, hospitalId?: string | null) {
  if (!hasSupabaseEnv() || !hospitalId) {
    return [{
      id: "dx-1001",
      hospital_id: DEFAULT_HOSPITAL_ID,
      patient_id: patientId,
      encounter_id: "enc-1001",
      diagnosis_code: "I10",
      diagnosis_name: "Essential hypertension",
      description: "Stable on current medication regimen.",
      is_primary: true,
      created_at: new Date().toISOString()
    } satisfies DiagnosisRecord];
  }
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase.from<DiagnosisRecord>("diagnoses").select("*").eq("hospital_id", hospitalId).eq("patient_id", patientId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addDiagnosis(hospitalId: string, values: DiagnosisInput, doctorId?: string | null) {
  const parsed = diagnosisSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix diagnosis details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Diagnosis validated. Connect Supabase to persist records." };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = {
    id: randomUUID(),
    hospital_id: hospitalId,
    ...parsed.data,
    encounter_id: parsed.data.encounter_id || null,
    diagnosis_code: parsed.data.diagnosis_code || null,
    description: parsed.data.description || null,
    doctor_id: doctorId ?? null
  };
  const { error } = await supabase.from("diagnoses").insert(payload);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "diagnosis.created", entity_type: "diagnosis", entity_id: payload.id, new_values: payload });
  return { ok: true, message: "Diagnosis added." };
}
