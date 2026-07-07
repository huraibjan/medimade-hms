"use server";

import { revalidatePath } from "next/cache";
import {
  createAppointment,
  updateAppointment,
  updateAppointmentStatus
} from "@/lib/services/appointments";
import { guardAction } from "@/lib/services/service-context";
import type { AppointmentInput, AppointmentStatusValue } from "@/lib/validations/appointment";
import type { ActionState } from "./types";

export type AppointmentActionState = ActionState & { appointmentId?: string };

function revalidateAppointmentPaths(appointmentId?: string) {
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  if (appointmentId) revalidatePath(`/appointments/${appointmentId}`);
}

export async function createAppointmentAction(
  valuesOrHospitalId: AppointmentInput | string,
  maybeValues?: AppointmentInput,
  _actorProfileId?: string | null,
  _actorRole?: unknown
): Promise<AppointmentActionState> {
  void _actorProfileId;
  void _actorRole;
  const guard = await guardAction("appointments:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Appointment details are required." };
  const result = await createAppointment(guard.hospitalId, values, guard.profile.id, guard.profile.role);
  if (result.ok) revalidateAppointmentPaths("appointmentId" in result ? result.appointmentId : undefined);
  return result;
}

export async function updateAppointmentAction(
  appointmentId: string,
  valuesOrHospitalId: AppointmentInput | string,
  maybeValues?: AppointmentInput,
  _actorRole?: unknown
): Promise<AppointmentActionState> {
  void _actorRole;
  const guard = await guardAction("appointments:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Appointment details are required." };
  const result = await updateAppointment(appointmentId, guard.hospitalId, values, guard.profile.role);
  if (result.ok) revalidateAppointmentPaths(appointmentId);
  return result;
}

export async function updateAppointmentStatusAction(
  appointmentId: string,
  valuesOrHospitalId: { status: AppointmentStatusValue; cancellation_reason?: string; create_encounter?: boolean } | string,
  maybeValues?: { status: AppointmentStatusValue; cancellation_reason?: string; create_encounter?: boolean },
  _actorProfileId?: string | null
): Promise<AppointmentActionState> {
  void _actorProfileId;
  const guard = await guardAction("appointments:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Appointment status is required." };
  const result = await updateAppointmentStatus(appointmentId, guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateAppointmentPaths(appointmentId);
  return result;
}
