import { randomUUID } from "crypto";
import { subHours } from "date-fns";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import {
  clinicalNotesSchema,
  encounterSchema,
  type ClinicalNotesInput,
  type EncounterInput
} from "@/lib/validations/clinical";
import type { DiagnosisRecord } from "./diagnosis";
import type { TreatmentPlanRecord } from "./treatment-plans";
import type { VitalsRecord } from "./vitals";

export type EncounterStatus = "in_progress" | "completed" | "cancelled";
export type EncounterType = "outpatient" | "inpatient" | "emergency" | "follow_up";

export type EncounterRecord = {
  id: string;
  hospital_id: string;
  patient_id: string;
  admission_id?: string | null;
  appointment_id?: string | null;
  doctor_id?: string | null;
  nurse_id?: string | null;
  encounter_type: EncounterType;
  chief_complaint?: string | null;
  notes?: string | null;
  status: EncounterStatus;
  started_at: string;
  ended_at?: string | null;
  created_at: string;
  updated_at?: string;
  patients?: {
    id: string;
    mrn: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
  } | null;
  vitals?: VitalsRecord[];
  diagnoses?: DiagnosisRecord[];
  treatment_plans?: TreatmentPlanRecord[];
  prescriptions?: Array<{ id: string; status: string; prescribed_at: string; notes?: string | null }>;
  lab_orders?: Array<{ id: string; status: string; priority: string; ordered_at: string }>;
};

export type EncounterTimelineItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  status?: string;
};

export type EncounterDetail = EncounterRecord & {
  timeline: EncounterTimelineItem[];
};

function mockEncounter(id = "enc-1001"): EncounterDetail {
  const started = subHours(new Date(), 3).toISOString();
  const encounter: EncounterRecord = {
    id,
    hospital_id: DEFAULT_HOSPITAL_ID,
    patient_id: "p-1001",
    appointment_id: "a-3001",
    encounter_type: "outpatient",
    chief_complaint: "Chest pain follow-up and medication review",
    notes: "Doctor notes: Symptoms improved. Nurse notes: Patient ambulatory, no acute distress.",
    status: "in_progress",
    started_at: started,
    created_at: started,
    patients: {
      id: "p-1001",
      mrn: "MC-240001",
      first_name: "Maya",
      last_name: "Bennett",
      phone: "+1 212 555 0171"
    },
    vitals: [],
    diagnoses: [],
    treatment_plans: [],
    prescriptions: [{ id: "rx-1001", status: "active", prescribed_at: subHours(new Date(), 2).toISOString(), notes: "Continue Atorvastatin." }],
    lab_orders: [{ id: "lab-1001", status: "processing", priority: "routine", ordered_at: subHours(new Date(), 2).toISOString() }]
  };
  return { ...encounter, timeline: buildEncounterTimeline(encounter) };
}

function buildEncounterTimeline(encounter: EncounterRecord): EncounterTimelineItem[] {
  return [
    {
      id: `encounter-${encounter.id}`,
      title: "Encounter started",
      description: encounter.chief_complaint ?? "Clinical encounter opened",
      date: encounter.started_at,
      status: encounter.status
    },
    ...(encounter.vitals ?? []).map((vital) => ({
      id: `vitals-${vital.id}`,
      title: "Vitals recorded",
      description: `BP ${vital.blood_pressure_systolic ?? "-"} / ${vital.blood_pressure_diastolic ?? "-"}, pulse ${vital.pulse ?? "-"}`,
      date: vital.recorded_at,
      status: "recorded"
    })),
    ...(encounter.diagnoses ?? []).map((diagnosis) => ({
      id: `diagnosis-${diagnosis.id}`,
      title: diagnosis.is_primary ? "Primary diagnosis" : "Diagnosis",
      description: diagnosis.diagnosis_name,
      date: diagnosis.created_at,
      status: diagnosis.diagnosis_code ?? undefined
    })),
    ...(encounter.treatment_plans ?? []).map((plan) => ({
      id: `plan-${plan.id}`,
      title: "Treatment plan",
      description: plan.plan_title,
      date: plan.created_at,
      status: plan.status
    })),
    ...(encounter.prescriptions ?? []).map((prescription) => ({
      id: `prescription-${prescription.id}`,
      title: "Prescription linked",
      description: prescription.notes ?? "Prescription added",
      date: prescription.prescribed_at,
      status: prescription.status
    })),
    ...(encounter.lab_orders ?? []).map((order) => ({
      id: `lab-${order.id}`,
      title: "Lab order linked",
      description: `${order.priority} priority lab order`,
      date: order.ordered_at,
      status: order.status
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function audit(hospitalId: string, action: string, entityId: string, values: Record<string, unknown>) {
  if (!hasSupabaseEnv()) return;
  const supabase = asQueryClient(await createServerSupabaseClient());
  await supabase.from("audit_logs").insert({
    hospital_id: hospitalId,
    action,
    entity_type: "clinical_encounter",
    entity_id: entityId,
    new_values: values
  });
}

export async function getEncounter(id: string, hospitalId?: string | null): Promise<EncounterDetail | null> {
  if (!hasSupabaseEnv() || !hospitalId) return mockEncounter(id);

  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<EncounterRecord>("clinical_encounters")
    .select("*, patients(id,mrn,first_name,last_name,phone), vitals(*), diagnoses(*), treatment_plans(*), prescriptions(id,status,prescribed_at,notes), lab_orders(id,status,priority,ordered_at)")
    .eq("hospital_id", hospitalId)
    .eq("id", id)
    .limit(1);

  if (error) throw error;
  const encounter = data?.[0];
  if (!encounter) return null;
  return { ...encounter, timeline: buildEncounterTimeline(encounter) };
}

export async function createEncounter(hospitalId: string, values: EncounterInput, actorProfileId?: string | null) {
  const parsed = encounterSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix encounter details." };

  if (!hasSupabaseEnv()) return { ok: true, message: "Encounter validated. Connect Supabase to persist records.", encounterId: "enc-1001" };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const encounterId = randomUUID();
  const payload = {
    id: encounterId,
    hospital_id: hospitalId,
    patient_id: parsed.data.patient_id,
    appointment_id: parsed.data.appointment_id || null,
    admission_id: parsed.data.admission_id || null,
    doctor_id: parsed.data.doctor_id || null,
    nurse_id: parsed.data.nurse_id || null,
    encounter_type: parsed.data.encounter_type,
    chief_complaint: parsed.data.chief_complaint || null,
    notes: parsed.data.notes || null,
    status: "in_progress",
    started_at: new Date().toISOString()
  };
  const { error } = await supabase.from("clinical_encounters").insert(payload);
  if (error) return { ok: false, message: error.message };
  await audit(hospitalId, "encounter.created", encounterId, { ...payload, actorProfileId });
  return { ok: true, message: "Encounter created.", encounterId };
}

export async function updateClinicalNotes(encounterId: string, hospitalId: string, values: ClinicalNotesInput, actorProfileId?: string | null) {
  const parsed = clinicalNotesSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix clinical notes." };
  const notes = [
    parsed.data.doctor_notes ? `Doctor notes: ${parsed.data.doctor_notes}` : null,
    parsed.data.nurse_notes ? `Nurse notes: ${parsed.data.nurse_notes}` : null
  ].filter(Boolean).join("\n\n");

  if (!hasSupabaseEnv()) return { ok: true, message: "Clinical notes validated. Connect Supabase to persist records." };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = {
    chief_complaint: parsed.data.chief_complaint || null,
    notes: notes || null,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from("clinical_encounters").update(payload).eq("hospital_id", hospitalId).eq("id", encounterId);
  if (error) return { ok: false, message: error.message };
  await audit(hospitalId, "encounter.notes_updated", encounterId, { ...payload, actorProfileId });
  return { ok: true, message: "Clinical notes updated." };
}

export async function completeEncounter(encounterId: string, hospitalId: string, actorProfileId?: string | null) {
  if (!hasSupabaseEnv()) return { ok: true, message: "Encounter completion validated. Connect Supabase to persist records." };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { status: "completed", ended_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const { error } = await supabase.from("clinical_encounters").update(payload).eq("hospital_id", hospitalId).eq("id", encounterId);
  if (error) return { ok: false, message: error.message };
  await audit(hospitalId, "encounter.completed", encounterId, { ...payload, actorProfileId });
  return { ok: true, message: "Encounter completed." };
}
