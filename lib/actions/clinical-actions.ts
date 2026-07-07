"use server";

import { revalidatePath } from "next/cache";
import { addDiagnosis } from "@/lib/services/diagnosis";
import { completeEncounter, createEncounter, updateClinicalNotes } from "@/lib/services/encounters";
import { guardAction } from "@/lib/services/service-context";
import { addTreatmentPlan } from "@/lib/services/treatment-plans";
import { addVitals } from "@/lib/services/vitals";
import type {
  ClinicalNotesInput,
  DiagnosisInput,
  EncounterInput,
  TreatmentPlanInput,
  VitalsInput
} from "@/lib/validations/clinical";
import type { ActionState } from "./types";

export type ClinicalActionState = ActionState & { encounterId?: string };

function revalidateClinical(patientId?: string, encounterId?: string) {
  if (patientId) {
    revalidatePath(`/patients/${patientId}`);
    revalidatePath(`/patients/${patientId}/timeline`);
  }
  if (encounterId) revalidatePath(`/encounters/${encounterId}`);
}

export async function createEncounterAction(valuesOrHospitalId: EncounterInput | string, maybeValues?: EncounterInput, _actorProfileId?: string | null): Promise<ClinicalActionState> {
  void _actorProfileId;
  const guard = await guardAction("clinical:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Encounter details are required." };
  const result = await createEncounter(guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateClinical(values.patient_id, "encounterId" in result ? result.encounterId : undefined);
  return result;
}

export async function saveClinicalNotesAction(
  encounterId: string,
  valuesOrHospitalId: ClinicalNotesInput | string,
  maybeValues?: ClinicalNotesInput | string,
  maybePatientId?: string,
  _actorProfileId?: string | null
): Promise<ActionState> {
  void _actorProfileId;
  const guard = await guardAction("clinical:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues as ClinicalNotesInput | undefined : valuesOrHospitalId;
  const patientId = typeof valuesOrHospitalId === "string" ? maybePatientId : maybeValues as string | undefined;
  if (!values || typeof values === "string") return { ok: false, message: "Clinical notes are required." };
  const result = await updateClinicalNotes(encounterId, guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateClinical(patientId, encounterId);
  return result;
}

export async function completeEncounterAction(encounterId: string, patientIdOrHospitalId?: string, maybePatientId?: string, _actorProfileId?: string | null): Promise<ActionState> {
  void _actorProfileId;
  const guard = await guardAction("clinical:manage");
  if (!guard.ok) return guard;

  const patientId = maybePatientId ?? patientIdOrHospitalId;
  const result = await completeEncounter(encounterId, guard.hospitalId, guard.profile.id);
  if (result.ok) revalidateClinical(patientId, encounterId);
  return result;
}

export async function addVitalsAction(valuesOrHospitalId: VitalsInput | string, maybeValues?: VitalsInput, _actorProfileId?: string | null): Promise<ActionState> {
  void _actorProfileId;
  const guard = await guardAction(["vitals:manage", "clinical:manage"]);
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Vitals details are required." };
  const result = await addVitals(guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateClinical(values.patient_id, values.encounter_id);
  return result;
}

export async function addDiagnosisAction(valuesOrHospitalId: DiagnosisInput | string, maybeValues?: DiagnosisInput, _doctorId?: string | null): Promise<ActionState> {
  void _doctorId;
  const guard = await guardAction("clinical:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Diagnosis details are required." };
  const result = await addDiagnosis(guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateClinical(values.patient_id, values.encounter_id);
  return result;
}

export async function addTreatmentPlanAction(valuesOrHospitalId: TreatmentPlanInput | string, maybeValues?: TreatmentPlanInput, _doctorId?: string | null): Promise<ActionState> {
  void _doctorId;
  const guard = await guardAction("clinical:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Treatment plan details are required." };
  const result = await addTreatmentPlan(guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateClinical(values.patient_id, values.encounter_id);
  return result;
}
