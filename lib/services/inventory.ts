import { randomUUID } from "crypto";
import { addDays, differenceInCalendarDays } from "date-fns";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import {
  dispensePrescriptionSchema,
  inventoryBatchSchema,
  stockMovementSchema,
  type DispensePrescriptionInput,
  type InventoryBatchInput,
  type StockMovementInput
} from "@/lib/validations/inventory";
import { mockMedicines, type MedicineRecord } from "./pharmacy";
import { mockSuppliers, type SupplierRecord } from "./suppliers";

export type StockMovementType = "purchase" | "dispense" | "adjustment" | "return" | "expired" | "damaged";

export type InventoryBatchRecord = {
  id: string;
  hospital_id: string;
  medication_id: string;
  supplier_id?: string | null;
  sku: string;
  batch_no: string;
  expiry_date: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit_cost: number;
  selling_price: number;
  storage_location?: string | null;
  created_at: string;
  updated_at?: string;
  medications?: MedicineRecord | null;
  suppliers?: SupplierRecord | null;
};

export type StockMovementRecord = {
  id: string;
  hospital_id: string;
  inventory_id: string;
  movement_type: StockMovementType;
  quantity: number;
  reason?: string | null;
  reference_number?: string | null;
  performed_by?: string | null;
  movement_date: string;
  created_at: string;
  medicine_inventory?: InventoryBatchRecord | null;
};

export type InventoryAlert = {
  id: string;
  message: string;
  severity: "warning" | "critical";
  batch: InventoryBatchRecord;
};

const mockInventory: InventoryBatchRecord[] = [
  { id: "inv-atv-001", hospital_id: DEFAULT_HOSPITAL_ID, medication_id: "med-atorvastatin", supplier_id: "sup-medline", sku: "MED-ATV-20", batch_no: "ATV-042", expiry_date: addDays(new Date(), 120).toISOString().slice(0, 10), quantity_on_hand: 42, reorder_level: 100, unit_cost: 0.42, selling_price: 2.5, storage_location: "Aisle A-1", created_at: new Date().toISOString() },
  { id: "inv-amx-001", hospital_id: DEFAULT_HOSPITAL_ID, medication_id: "med-amoxicillin", supplier_id: "sup-cardinal", sku: "MED-AMX-500", batch_no: "AMX-118", expiry_date: addDays(new Date(), 25).toISOString().slice(0, 10), quantity_on_hand: 88, reorder_level: 150, unit_cost: 0.28, selling_price: 1.75, storage_location: "Aisle B-2", created_at: new Date().toISOString() },
  { id: "inv-met-001", hospital_id: DEFAULT_HOSPITAL_ID, medication_id: "med-metformin", supplier_id: "sup-medline", sku: "MED-MET-500", batch_no: "MET-771", expiry_date: addDays(new Date(), 300).toISOString().slice(0, 10), quantity_on_hand: 260, reorder_level: 120, unit_cost: 0.18, selling_price: 1.2, storage_location: "Aisle C-4", created_at: new Date().toISOString() },
  { id: "inv-alb-001", hospital_id: DEFAULT_HOSPITAL_ID, medication_id: "med-albuterol", supplier_id: "sup-cardinal", sku: "MED-ALB-INH", batch_no: "ALB-026", expiry_date: addDays(new Date(), 55).toISOString().slice(0, 10), quantity_on_hand: 21, reorder_level: 50, unit_cost: 14.5, selling_price: 38, storage_location: "Aisle D-1", created_at: new Date().toISOString() }
];

const mockMovements: StockMovementRecord[] = [
  { id: "mov-001", hospital_id: DEFAULT_HOSPITAL_ID, inventory_id: "inv-atv-001", movement_type: "purchase", quantity: 200, reason: "Opening purchase order", reference_number: "PO-2026-0101", movement_date: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "mov-002", hospital_id: DEFAULT_HOSPITAL_ID, inventory_id: "inv-amx-001", movement_type: "dispense", quantity: -12, reason: "Prescription dispense", reference_number: "RX-1001", movement_date: new Date().toISOString(), created_at: new Date().toISOString() }
];

function hydrate(batch: InventoryBatchRecord): InventoryBatchRecord {
  return {
    ...batch,
    medications: batch.medications ?? mockMedicines.find((medicine) => medicine.id === batch.medication_id) ?? null,
    suppliers: batch.suppliers ?? mockSuppliers.find((supplier) => supplier.id === batch.supplier_id) ?? null
  };
}

export async function listInventoryBatches(hospitalId?: string | null): Promise<InventoryBatchRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockInventory.map(hydrate);
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<InventoryBatchRecord>("medicine_inventory")
    .select("*, medications(*), suppliers(*)")
    .eq("hospital_id", hospitalId)
    .order("expiry_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getInventoryBatch(id: string, hospitalId?: string | null) {
  const rows = await listInventoryBatches(hospitalId);
  return rows.find((batch) => batch.id === id) ?? null;
}

export async function listLowStock(hospitalId?: string | null) {
  const batches = await listInventoryBatches(hospitalId);
  return batches.filter((batch) => batch.quantity_on_hand <= batch.reorder_level);
}

export async function listExpiringSoon(hospitalId?: string | null, days = 60) {
  const batches = await listInventoryBatches(hospitalId);
  return batches.filter((batch) => differenceInCalendarDays(new Date(batch.expiry_date), new Date()) <= days);
}

export async function listInventoryAlerts(hospitalId?: string | null): Promise<InventoryAlert[]> {
  const [lowStock, expiring] = await Promise.all([listLowStock(hospitalId), listExpiringSoon(hospitalId)]);
  return [
    ...lowStock.map((batch) => ({ id: `low-${batch.id}`, severity: "critical" as const, batch, message: `${batch.medications?.name ?? batch.sku} is below reorder level (${batch.quantity_on_hand}/${batch.reorder_level}).` })),
    ...expiring.map((batch) => ({ id: `exp-${batch.id}`, severity: "warning" as const, batch, message: `${batch.medications?.name ?? batch.sku} batch ${batch.batch_no} expires on ${batch.expiry_date}.` }))
  ];
}

export async function listStockMovements(hospitalId?: string | null): Promise<StockMovementRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockMovements.map((movement) => ({ ...movement, medicine_inventory: hydrate(mockInventory.find((batch) => batch.id === movement.inventory_id) ?? mockInventory[0]) }));
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<StockMovementRecord>("stock_movements")
    .select("*, medicine_inventory(*, medications(*), suppliers(*))")
    .eq("hospital_id", hospitalId)
    .order("movement_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createInventoryBatch(hospitalId: string, values: InventoryBatchInput, actorProfileId?: string | null) {
  const parsed = inventoryBatchSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix inventory batch details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Inventory batch validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const id = randomUUID();
  const openingQuantity = parsed.data.quantity_on_hand;
  const record = {
    id,
    hospital_id: hospitalId,
    ...parsed.data,
    quantity_on_hand: 0,
    supplier_id: parsed.data.supplier_id || null,
    storage_location: parsed.data.storage_location || null
  };
  const insert = await supabase.from("medicine_inventory").insert(record);
  if (insert.error) return { ok: false, message: insert.error.message };
  if (openingQuantity > 0) {
    const movement = await createStockMovement(hospitalId, {
      inventory_id: id,
      movement_type: "purchase",
      quantity: openingQuantity,
      reason: "Initial batch receipt",
      reference_number: record.batch_no
    }, actorProfileId);
    if (!movement.ok) return movement;
  }
  return { ok: true, message: "Inventory batch added." };
}

export async function updateInventoryBatch(id: string, hospitalId: string, values: InventoryBatchInput, actorProfileId?: string | null) {
  const parsed = inventoryBatchSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix inventory batch details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Inventory batch changes validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = {
    medication_id: parsed.data.medication_id,
    supplier_id: parsed.data.supplier_id || null,
    sku: parsed.data.sku,
    batch_no: parsed.data.batch_no,
    expiry_date: parsed.data.expiry_date,
    quantity_on_hand: parsed.data.quantity_on_hand,
    reorder_level: parsed.data.reorder_level,
    unit_cost: parsed.data.unit_cost,
    selling_price: parsed.data.selling_price,
    storage_location: parsed.data.storage_location || null,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from("medicine_inventory").update(payload).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "inventory.updated", entity_type: "medicine_inventory", entity_id: id, new_values: { ...payload, actorProfileId } });
  return { ok: true, message: "Inventory batch updated." };
}

export async function deactivateInventoryBatch(id: string, hospitalId: string, actorProfileId?: string | null) {
  if (!hasSupabaseEnv()) return { ok: true, message: "Inventory batch deactivation validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { quantity_on_hand: 0, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("medicine_inventory").update(payload).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "inventory.deactivated", entity_type: "medicine_inventory", entity_id: id, new_values: { ...payload, actorProfileId } });
  return { ok: true, message: "Inventory batch deactivated." };
}

export async function createStockMovement(hospitalId: string, values: StockMovementInput, actorProfileId?: string | null) {
  const parsed = stockMovementSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix stock movement details." };
  const batches = await listInventoryBatches(hospitalId);
  const batch = batches.find((item) => item.id === parsed.data.inventory_id);
  if (!batch) return { ok: false, message: "Inventory batch not found." };
  const nextQuantity = batch.quantity_on_hand + parsed.data.quantity;
  if (nextQuantity < 0) return { ok: false, message: "Cannot remove more stock than available." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Stock movement validated. Connect Supabase to persist records." };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const now = new Date().toISOString();
  const movement = { id: randomUUID(), hospital_id: hospitalId, ...parsed.data, reason: parsed.data.reason || null, reference_number: parsed.data.reference_number || null, performed_by: actorProfileId ?? null, movement_date: now };
  const insert = await supabase.from("stock_movements").insert(movement);
  if (insert.error) return { ok: false, message: insert.error.message };
  const update = await supabase.from("medicine_inventory").update({ quantity_on_hand: nextQuantity, updated_at: now }).eq("hospital_id", hospitalId).eq("id", parsed.data.inventory_id);
  if (update.error) return { ok: false, message: update.error.message };
  return { ok: true, message: "Stock movement recorded." };
}

export async function dispensePrescription(hospitalId: string, values: DispensePrescriptionInput, actorProfileId?: string | null) {
  const parsed = dispensePrescriptionSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix dispense details." };
  const batches = (await listInventoryBatches(hospitalId))
    .filter((batch) => batch.medication_id === parsed.data.medication_id && batch.quantity_on_hand > 0)
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
  const available = batches.reduce((total, batch) => total + batch.quantity_on_hand, 0);
  if (available < parsed.data.quantity) return { ok: false, message: "Cannot dispense more than available stock." };

  let remaining = parsed.data.quantity;
  for (const batch of batches) {
    if (remaining <= 0) break;
    const quantity = Math.min(batch.quantity_on_hand, remaining);
    const result = await createStockMovement(hospitalId, {
      inventory_id: batch.id,
      movement_type: "dispense",
      quantity: -quantity,
      reason: "Prescription dispensed",
      reference_number: parsed.data.prescription_id
    }, actorProfileId);
    if (!result.ok) return result;
    remaining -= quantity;
  }
  return { ok: true, message: "Prescription dispensed using earliest expiry batches." };
}

export const listInventoryMedicines = listInventoryBatches;
