"use server";

import { revalidatePath } from "next/cache";
import {
  admitPatient,
  assignBedToAdmission,
  cancelAdmission,
  dischargeAdmission,
  transferAdmissionBed
} from "@/lib/services/admissions";
import { guardAction } from "@/lib/services/service-context";
import type { AdmissionInput } from "@/lib/validations/admission";
import type { ActionState } from "./types";

export type AdmissionActionState = ActionState & { admissionId?: string };

function revalidateAdmissionPaths(admissionId?: string) {
  revalidatePath("/admissions");
  revalidatePath("/rooms");
  revalidatePath("/wards");
  revalidatePath("/beds");
  if (admissionId) revalidatePath(`/admissions/${admissionId}`);
}

export async function admitPatientAction(
  valuesOrHospitalId: AdmissionInput | string,
  maybeValues?: AdmissionInput,
  _actorProfileId?: string | null
): Promise<AdmissionActionState> {
  void _actorProfileId;
  const guard = await guardAction(["admissions:manage", "admissions:create"]);
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Admission details are required." };
  const result = await admitPatient(guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateAdmissionPaths("admissionId" in result ? result.admissionId : undefined);
  return result;
}

export async function assignBedAction(valuesOrHospitalId: {
  admission_id: string;
  patient_id: string;
  bed_id: string;
} | string, maybeValues?: {
  admission_id: string;
  patient_id: string;
  bed_id: string;
}, _actorProfileId?: string | null): Promise<AdmissionActionState> {
  void _actorProfileId;
  const guard = await guardAction("admissions:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Bed assignment details are required." };
  const result = await assignBedToAdmission(values, guard.hospitalId, guard.profile.id);
  if (result.ok) revalidateAdmissionPaths(values.admission_id);
  return result;
}

export async function transferBedAction(valuesOrHospitalId: {
  admission_id: string;
  patient_id: string;
  from_bed_id?: string | null;
  to_bed_id: string;
} | string, maybeValues?: {
  admission_id: string;
  patient_id: string;
  from_bed_id?: string | null;
  to_bed_id: string;
}, _actorProfileId?: string | null): Promise<AdmissionActionState> {
  void _actorProfileId;
  const guard = await guardAction("admissions:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Transfer details are required." };
  const result = await transferAdmissionBed(
    values.admission_id,
    values.patient_id,
    values.from_bed_id,
    values.to_bed_id,
    guard.hospitalId,
    guard.profile.id
  );
  if (result.ok) revalidateAdmissionPaths(values.admission_id);
  return result;
}

export async function dischargeAdmissionAction(valuesOrHospitalId: {
  admission_id: string;
  discharge_datetime?: string;
  release_reason?: string;
} | string, maybeValues?: {
  admission_id: string;
  discharge_datetime?: string;
  release_reason?: string;
}, _actorProfileId?: string | null): Promise<AdmissionActionState> {
  void _actorProfileId;
  const guard = await guardAction("admissions:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Discharge details are required." };
  const result = await dischargeAdmission(values, guard.hospitalId, guard.profile.id);
  if (result.ok) revalidateAdmissionPaths(values.admission_id);
  return result;
}

export async function cancelAdmissionAction(admissionId: string): Promise<AdmissionActionState> {
  const guard = await guardAction("admissions:manage");
  if (!guard.ok) return guard;

  const result = await cancelAdmission(admissionId, guard.hospitalId, guard.profile.id);
  if (result.ok) revalidateAdmissionPaths(admissionId);
  return result;
}
