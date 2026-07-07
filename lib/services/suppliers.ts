import { randomUUID } from "crypto";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import { supplierSchema, type SupplierInput } from "@/lib/validations/inventory";

export type SupplierRecord = {
  id: string;
  hospital_id: string;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export const mockSuppliers: SupplierRecord[] = [
  { id: "sup-medline", hospital_id: DEFAULT_HOSPITAL_ID, name: "Medline Healthcare Supply", contact_person: "Rina Patel", phone: "+1 212 555 6401", email: "orders@medline.example", address: "Queens, NY", is_active: true, created_at: new Date().toISOString() },
  { id: "sup-cardinal", hospital_id: DEFAULT_HOSPITAL_ID, name: "Cardinal Pharmacy Distribution", contact_person: "James Porter", phone: "+1 212 555 6402", email: "ny@cardinal.example", address: "Newark, NJ", is_active: true, created_at: new Date().toISOString() }
];

function payload(hospitalId: string, values: SupplierInput) {
  return {
    hospital_id: hospitalId,
    name: values.name,
    contact_person: values.contact_person || null,
    phone: values.phone || null,
    email: values.email || null,
    address: values.address || null,
    is_active: values.is_active
  };
}

export async function listSuppliers(hospitalId?: string | null): Promise<SupplierRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockSuppliers;
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase.from<SupplierRecord>("suppliers").select("*").eq("hospital_id", hospitalId).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createSupplier(hospitalId: string, values: SupplierInput) {
  const parsed = supplierSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix supplier details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Supplier validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const record = { id: randomUUID(), ...payload(hospitalId, parsed.data) };
  const { error } = await supabase.from("suppliers").insert(record);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Supplier added." };
}

export async function getSupplier(id: string, hospitalId?: string | null) {
  const rows = await listSuppliers(hospitalId);
  return rows.find((supplier) => supplier.id === id) ?? null;
}

export async function updateSupplier(id: string, hospitalId: string, values: SupplierInput) {
  const parsed = supplierSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix supplier details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Supplier changes validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const record = { ...payload(hospitalId, parsed.data), updated_at: new Date().toISOString() };
  const { error } = await supabase.from("suppliers").update(record).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Supplier updated." };
}

export async function deactivateSupplier(id: string, hospitalId: string) {
  if (!hasSupabaseEnv()) return { ok: true, message: "Supplier deactivation validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { error } = await supabase.from("suppliers").update({ is_active: false, updated_at: new Date().toISOString() }).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Supplier deactivated." };
}
