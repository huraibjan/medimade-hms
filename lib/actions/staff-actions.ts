"use server";

import { revalidatePath } from "next/cache";
import { guardAction } from "@/lib/services/service-context";
import { createStaff, updateStaff, softDeleteStaff } from "@/lib/services/staff";
import type { StaffInput } from "@/lib/validations/staff";
import type { ActionState } from "./types";

export type StaffActionState = ActionState & { staffId?: string };

export async function createStaffAction(values: StaffInput): Promise<StaffActionState> {
  const guard = await guardAction("staff:manage");
  if (!guard.ok) return guard;

  const result = await createStaff(guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidatePath("/staff");
  return result;
}

export async function updateStaffAction(staffId: string, values: StaffInput): Promise<StaffActionState> {
  const guard = await guardAction("staff:manage");
  if (!guard.ok) return guard;

  const result = await updateStaff(staffId, guard.hospitalId, values, guard.profile.id);
  if (result.ok) {
    revalidatePath("/staff");
    revalidatePath(`/staff/${staffId}`);
  }
  return result;
}

export async function deactivateStaffAction(staffId: string): Promise<StaffActionState> {
  const guard = await guardAction("staff:manage");
  if (!guard.ok) return guard;

  const result = await softDeleteStaff(staffId, guard.hospitalId, guard.profile.id);
  if (result.ok) revalidatePath("/staff");
  return result;
}
