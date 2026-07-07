"use server";

import { revalidatePath } from "next/cache";
import { createInventoryBatch, createStockMovement, dispensePrescription } from "@/lib/services/inventory";
import { createMedicine, deactivateMedicine, updateMedicine } from "@/lib/services/pharmacy";
import { guardAction } from "@/lib/services/service-context";
import { createSupplier } from "@/lib/services/suppliers";
import type {
  DispensePrescriptionInput,
  InventoryBatchInput,
  MedicineInput,
  StockMovementInput,
  SupplierInput
} from "@/lib/validations/inventory";
import type { ActionState } from "./types";

const INVENTORY_PERMISSIONS = ["inventory:manage", "pharmacy:manage"];

function revalidateInventory() {
  revalidatePath("/pharmacy");
  revalidatePath("/inventory");
  revalidatePath("/inventory/medicines");
  revalidatePath("/inventory/stock-movements");
  revalidatePath("/inventory/suppliers");
}

export async function createMedicineAction(valuesOrHospitalId: MedicineInput | string, maybeValues?: MedicineInput): Promise<ActionState> {
  const guard = await guardAction(INVENTORY_PERMISSIONS);
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Medicine details are required." };
  const result = await createMedicine(guard.hospitalId, values);
  if (result.ok) revalidateInventory();
  return result;
}

export async function updateMedicineAction(id: string, valuesOrHospitalId: MedicineInput | string, maybeValues?: MedicineInput): Promise<ActionState> {
  const guard = await guardAction(INVENTORY_PERMISSIONS);
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Medicine details are required." };
  const result = await updateMedicine(id, guard.hospitalId, values);
  if (result.ok) revalidateInventory();
  return result;
}

export async function deactivateMedicineAction(id: string, _hospitalId?: string): Promise<ActionState> {
  void _hospitalId;
  const guard = await guardAction(INVENTORY_PERMISSIONS);
  if (!guard.ok) return guard;

  const result = await deactivateMedicine(id, guard.hospitalId);
  if (result.ok) revalidateInventory();
  return result;
}

export async function createSupplierAction(valuesOrHospitalId: SupplierInput | string, maybeValues?: SupplierInput): Promise<ActionState> {
  const guard = await guardAction(INVENTORY_PERMISSIONS);
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Supplier details are required." };
  const result = await createSupplier(guard.hospitalId, values);
  if (result.ok) revalidateInventory();
  return result;
}

export async function createInventoryBatchAction(valuesOrHospitalId: InventoryBatchInput | string, maybeValues?: InventoryBatchInput, _actorProfileId?: string | null): Promise<ActionState> {
  void _actorProfileId;
  const guard = await guardAction(INVENTORY_PERMISSIONS);
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Inventory batch details are required." };
  const result = await createInventoryBatch(guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateInventory();
  return result;
}

export async function createStockMovementAction(valuesOrHospitalId: StockMovementInput | string, maybeValues?: StockMovementInput, _actorProfileId?: string | null): Promise<ActionState> {
  void _actorProfileId;
  const guard = await guardAction(INVENTORY_PERMISSIONS);
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Stock movement details are required." };
  const result = await createStockMovement(guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateInventory();
  return result;
}

export async function dispensePrescriptionAction(valuesOrHospitalId: DispensePrescriptionInput | string, maybeValues?: DispensePrescriptionInput, _actorProfileId?: string | null): Promise<ActionState> {
  void _actorProfileId;
  const guard = await guardAction("pharmacy:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Dispense details are required." };
  const result = await dispensePrescription(guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateInventory();
  return result;
}
