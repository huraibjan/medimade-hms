"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createPatient, softDeletePatient, updatePatient } from "@/lib/services/patient-service";
import { guardAction } from "@/lib/services/service-context";
import { patientSchema } from "@/lib/validations/patient";
import type { ActionState } from "./types";

export type { ActionState } from "./types";

export async function createPatientAction(valuesOrHospitalId: z.infer<typeof patientSchema> | string, maybeValues?: z.infer<typeof patientSchema>): Promise<ActionState> {
  const guard = await guardAction("patients:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Patient details are required." };
  const result = await createPatient(guard.hospitalId, values);
  if (result.ok) revalidatePath("/patients");
  return { ok: result.ok, message: result.message };
}

export async function updatePatientAction(
  patientId: string,
  valuesOrHospitalId: z.infer<typeof patientSchema> | string,
  maybeValues?: z.infer<typeof patientSchema>
): Promise<ActionState> {
  const guard = await guardAction("patients:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Patient details are required." };
  const result = await updatePatient(patientId, guard.hospitalId, values);
  if (result.ok) {
    revalidatePath("/patients");
    revalidatePath(`/patients/${patientId}`);
  }
  return result;
}

export async function softDeletePatientAction(patientId: string, _hospitalId?: string): Promise<ActionState> {
  void _hospitalId;
  const guard = await guardAction("patients:manage");
  if (!guard.ok) return guard;

  const result = await softDeletePatient(patientId, guard.hospitalId);
  if (result.ok) revalidatePath("/patients");
  return result;
}
