import { randomUUID } from "crypto";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import { vitalsSchema, type VitalsInput } from "@/lib/validations/clinical";

export type VitalsRecord = {
  id: string;
  hospital_id: string;
  patient_id: string;
  encounter_id?: string | null;
  recorded_by?: string | null;
  temperature_c?: number | null;
  blood_pressure_systolic?: number | null;
  blood_pressure_diastolic?: number | null;
  pulse?: number | null;
  respiratory_rate?: number | null;
  oxygen_saturation?: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  pain_score?: number | null;
  recorded_at: string;
  created_at: string;
};

export async function listVitals(patientId: string, hospitalId?: string | null) {
  if (!hasSupabaseEnv() || !hospitalId) {
    return [{
      id: "vitals-1001",
      hospital_id: DEFAULT_HOSPITAL_ID,
      patient_id: patientId,
      encounter_id: "enc-1001",
      temperature_c: 37.1,
      blood_pressure_systolic: 124,
      blood_pressure_diastolic: 78,
      pulse: 82,
      respiratory_rate: 16,
      oxygen_saturation: 98,
      pain_score: 2,
      recorded_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    } satisfies VitalsRecord];
  }

  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase.from<VitalsRecord>("vitals").select("*").eq("hospital_id", hospitalId).eq("patient_id", patientId).order("recorded_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addVitals(hospitalId: string, values: VitalsInput, actorProfileId?: string | null) {
  const parsed = vitalsSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix vitals details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Vitals validated. Connect Supabase to persist records." };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = {
    id: randomUUID(),
    hospital_id: hospitalId,
    ...parsed.data,
    encounter_id: parsed.data.encounter_id || null,
    recorded_by: actorProfileId ?? null,
    recorded_at: new Date().toISOString()
  };
  const { error } = await supabase.from("vitals").insert(payload);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "vitals.recorded", entity_type: "vitals", entity_id: payload.id, new_values: payload });
  return { ok: true, message: "Vitals recorded." };
}
