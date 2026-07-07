"use server";

import { revalidatePath } from "next/cache";
import { createLabOrder, createLabTest, updateLabOrderStatus, updateLabResult } from "@/lib/services/lab";
import { guardAction } from "@/lib/services/service-context";
import type { LabOrderInput, LabOrderStatusInput, LabResultInput, LabTestInput } from "@/lib/validations/lab";
import type { ActionState } from "./types";

export type LabActionState = ActionState & { orderId?: string };

function revalidateLab(orderId?: string) {
  revalidatePath("/lab");
  revalidatePath("/lab/orders");
  revalidatePath("/lab/tests");
  if (orderId) revalidatePath(`/lab/orders/${orderId}`);
}

export async function createLabTestAction(valuesOrHospitalId: LabTestInput | string, maybeValues?: LabTestInput): Promise<ActionState> {
  const guard = await guardAction("lab:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Lab test details are required." };
  const result = await createLabTest(guard.hospitalId, values);
  if (result.ok) revalidateLab();
  return result;
}

export async function createLabOrderAction(valuesOrHospitalId: LabOrderInput | string, maybeValues?: LabOrderInput, _actorProfileId?: string | null): Promise<LabActionState> {
  void _actorProfileId;
  const guard = await guardAction(["lab:order", "lab:manage"]);
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Lab order details are required." };
  const result = await createLabOrder(guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateLab();
  return result;
}

export async function updateLabOrderStatusAction(
  orderId: string,
  valuesOrHospitalId: LabOrderStatusInput | string,
  maybeValues?: LabOrderStatusInput,
  _actorProfileId?: string | null
): Promise<ActionState> {
  void _actorProfileId;
  const guard = await guardAction("lab:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Lab order status is required." };
  const result = await updateLabOrderStatus(orderId, guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateLab(orderId);
  return result;
}

export async function updateLabResultAction(
  itemId: string,
  orderId: string,
  valuesOrHospitalId: LabResultInput | string,
  maybeValues?: LabResultInput,
  _actorProfileId?: string | null
): Promise<ActionState> {
  void _actorProfileId;
  const guard = await guardAction("lab:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Lab result details are required." };
  const result = await updateLabResult(itemId, guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateLab(orderId);
  return result;
}
