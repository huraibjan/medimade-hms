import { randomUUID } from "crypto";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import { treatmentPlanSchema, type TreatmentPlanInput } from "@/lib/validations/clinical";

export type TreatmentPlanRecord = {
  id: string;
  hospital_id: string;
  patient_id: string;
  encounter_id?: string | null;
  doctor_id?: string | null;
  plan_title: string;
  plan_details?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
};

export async function listTreatmentPlans(patientId: string, hospitalId?: string | null) {
  if (!hasSupabaseEnv() || !hospitalId) {
    return [{
      id: "plan-1001",
      hospital_id: DEFAULT_HOSPITAL_ID,
      patient_id: patientId,
      encounter_id: "enc-1001",
      plan_title: "Cardiology follow-up plan",
      plan_details: "Continue medication, repeat labs, follow up in two weeks.",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null,
      status: "active",
      created_at: new Date().toISOString()
    } satisfies TreatmentPlanRecord];
  }
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase.from<TreatmentPlanRecord>("treatment_plans").select("*").eq("hospital_id", hospitalId).eq("patient_id", patientId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addTreatmentPlan(hospitalId: string, values: TreatmentPlanInput, doctorId?: string | null) {
  const parsed = treatmentPlanSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix treatment plan details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Treatment plan validated. Connect Supabase to persist records." };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = {
    id: randomUUID(),
    hospital_id: hospitalId,
    ...parsed.data,
    encounter_id: parsed.data.encounter_id || null,
    plan_details: parsed.data.plan_details || null,
    start_date: parsed.data.start_date || null,
    end_date: parsed.data.end_date || null,
    doctor_id: doctorId ?? null
  };
  const { error } = await supabase.from("treatment_plans").insert(payload);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "treatment_plan.created", entity_type: "treatment_plan", entity_id: payload.id, new_values: payload });
  return { ok: true, message: "Treatment plan added." };
}
