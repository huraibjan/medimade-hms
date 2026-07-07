import { randomUUID } from "crypto";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import { medicineSchema, type MedicineInput } from "@/lib/validations/inventory";

export type MedicineRecord = {
  id: string;
  hospital_id: string;
  name: string;
  generic_name?: string | null;
  brand_name?: string | null;
  strength?: string | null;
  dosage_form: string;
  manufacturer?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export const mockMedicines: MedicineRecord[] = [
  { id: "med-atorvastatin", hospital_id: DEFAULT_HOSPITAL_ID, name: "Atorvastatin", generic_name: "Atorvastatin calcium", brand_name: "Lipitor", strength: "20 mg", dosage_form: "Tablet", manufacturer: "Pfizer", description: "Lipid-lowering statin.", is_active: true, created_at: new Date().toISOString() },
  { id: "med-amoxicillin", hospital_id: DEFAULT_HOSPITAL_ID, name: "Amoxicillin", generic_name: "Amoxicillin", brand_name: null, strength: "500 mg", dosage_form: "Capsule", manufacturer: "Sandoz", description: "Penicillin antibiotic.", is_active: true, created_at: new Date().toISOString() },
  { id: "med-metformin", hospital_id: DEFAULT_HOSPITAL_ID, name: "Metformin", generic_name: "Metformin hydrochloride", brand_name: "Glucophage", strength: "500 mg", dosage_form: "Tablet", manufacturer: "Teva", description: "Diabetes medication.", is_active: true, created_at: new Date().toISOString() },
  { id: "med-albuterol", hospital_id: DEFAULT_HOSPITAL_ID, name: "Albuterol Inhaler", generic_name: "Albuterol", brand_name: "Ventolin", strength: "100 mcg", dosage_form: "Inhaler", manufacturer: "GSK", description: "Bronchodilator.", is_active: true, created_at: new Date().toISOString() }
];

function payload(hospitalId: string, values: MedicineInput) {
  return {
    hospital_id: hospitalId,
    name: values.name,
    generic_name: values.generic_name || null,
    brand_name: values.brand_name || null,
    strength: values.strength || null,
    dosage_form: values.dosage_form,
    manufacturer: values.manufacturer || null,
    description: values.description || null,
    is_active: values.is_active
  };
}

export async function listMedicines(hospitalId?: string | null): Promise<MedicineRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockMedicines;
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase.from<MedicineRecord>("medications").select("*").eq("hospital_id", hospitalId).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getMedicine(id: string, hospitalId?: string | null): Promise<MedicineRecord | null> {
  const rows = await listMedicines(hospitalId);
  return rows.find((medicine) => medicine.id === id) ?? null;
}

export async function createMedicine(hospitalId: string, values: MedicineInput) {
  const parsed = medicineSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix medicine details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Medicine validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const record = { id: randomUUID(), ...payload(hospitalId, parsed.data) };
  const { error } = await supabase.from("medications").insert(record);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "medicine.created", entity_type: "medication", entity_id: record.id, new_values: record });
  return { ok: true, message: "Medicine added." };
}

export async function updateMedicine(id: string, hospitalId: string, values: MedicineInput) {
  const parsed = medicineSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix medicine details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Medicine changes validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const record = { ...payload(hospitalId, parsed.data), updated_at: new Date().toISOString() };
  const { error } = await supabase.from("medications").update(record).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "medicine.updated", entity_type: "medication", entity_id: id, new_values: record });
  return { ok: true, message: "Medicine updated." };
}

export async function deactivateMedicine(id: string, hospitalId: string) {
  if (!hasSupabaseEnv()) return { ok: true, message: "Medicine deactivation validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const record = { is_active: false, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("medications").update(record).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "medicine.deactivated", entity_type: "medication", entity_id: id, new_values: record });
  return { ok: true, message: "Medicine deactivated." };
}
