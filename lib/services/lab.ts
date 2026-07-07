import { randomUUID } from "crypto";
import { subHours } from "date-fns";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import {
  labOrderSchema,
  labOrderStatusSchema,
  labResultSchema,
  labTestSchema,
  type LabOrderInput,
  type LabOrderStatusInput,
  type LabResultInput,
  type LabTestInput
} from "@/lib/validations/lab";
import type { LabOrderStatus, LabResultStatus } from "@/types/database";

export type LabTestRecord = {
  id: string;
  hospital_id: string;
  test_name: string;
  test_code: string;
  category?: string | null;
  description?: string | null;
  sample_type?: string | null;
  price: number;
  reference_range?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export type LabPatientSummary = {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
};

export type LabDoctorSummary = {
  id: string;
  staff_id?: string;
  full_name: string;
  specialization?: string | null;
};

export type LabTechnicianSummary = {
  id: string;
  profile_id?: string | null;
  full_name: string;
  employee_code?: string;
};

export type LabOrderItemRecord = {
  id: string;
  lab_order_id: string;
  lab_test_id: string;
  result_value?: string | null;
  result_unit?: string | null;
  reference_range?: string | null;
  result_status: LabResultStatus;
  technician_id?: string | null;
  result_notes?: string | null;
  resulted_at?: string | null;
  created_at: string;
  updated_at?: string;
  lab_tests?: LabTestRecord | null;
  staff?: {
    id: string;
    employee_code?: string | null;
    profiles?: { full_name: string; email?: string | null } | null;
  } | null;
};

export type LabOrderRecord = {
  id: string;
  hospital_id: string;
  patient_id: string;
  doctor_id?: string | null;
  encounter_id?: string | null;
  status: LabOrderStatus;
  priority: "routine" | "urgent" | "stat";
  ordered_at: string;
  completed_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  patients?: LabPatientSummary | null;
  doctors?: {
    id: string;
    staff?: {
      profiles?: { full_name: string } | null;
    } | null;
  } | null;
  lab_order_items?: LabOrderItemRecord[];
};

export type LabSummary = {
  pending: number;
  processing: number;
  completed: number;
  critical: number;
};

export const mockLabTests: LabTestRecord[] = [
  { id: "lab-test-cbc", hospital_id: DEFAULT_HOSPITAL_ID, test_name: "CBC with Differential", test_code: "CBC", category: "Hematology", description: "Complete blood count with differential.", sample_type: "Whole blood", price: 45, reference_range: "See component ranges", is_active: true, created_at: new Date().toISOString() },
  { id: "lab-test-bmp", hospital_id: DEFAULT_HOSPITAL_ID, test_name: "Basic Metabolic Panel", test_code: "BMP", category: "Chemistry", description: "Electrolytes, renal function, and glucose.", sample_type: "Serum", price: 55, reference_range: "See component ranges", is_active: true, created_at: new Date().toISOString() },
  { id: "lab-test-trop", hospital_id: DEFAULT_HOSPITAL_ID, test_name: "Troponin I", test_code: "TROP-I", category: "Cardiac", description: "Cardiac injury marker.", sample_type: "Serum", price: 95, reference_range: "< 0.04 ng/mL", is_active: true, created_at: new Date().toISOString() },
  { id: "lab-test-a1c", hospital_id: DEFAULT_HOSPITAL_ID, test_name: "Hemoglobin A1c", test_code: "A1C", category: "Chemistry", description: "Average blood glucose marker.", sample_type: "Whole blood", price: 60, reference_range: "4.0-5.6%", is_active: true, created_at: new Date().toISOString() }
];

const mockPatients: LabPatientSummary[] = [
  { id: "p-1001", mrn: "MRN-2026-0001", first_name: "Maya", last_name: "Bennett" },
  { id: "p-1002", mrn: "MRN-2026-0002", first_name: "Noah", last_name: "Singh" },
  { id: "p-1003", mrn: "MRN-2026-0003", first_name: "Elena", last_name: "Morales" }
];

const mockTechnicians: LabTechnicianSummary[] = [
  { id: "staff-lab-001", full_name: "Priya Raman", employee_code: "LAB-023" },
  { id: "staff-lab-002", full_name: "Marcus Chen", employee_code: "LAB-024" }
];

const mockDoctors: LabDoctorSummary[] = [
  { id: "doctor-001", full_name: "Dr. Laila Haddad", specialization: "Emergency Medicine" },
  { id: "doctor-002", full_name: "Dr. Jonah Reed", specialization: "Cardiology" }
];

const mockLabOrders: LabOrderRecord[] = [
  {
    id: "lab-order-1001",
    hospital_id: DEFAULT_HOSPITAL_ID,
    patient_id: "p-1001",
    doctor_id: "doctor-001",
    status: "processing",
    priority: "stat",
    ordered_at: subHours(new Date(), 2).toISOString(),
    notes: "Chest pain workup.",
    created_at: subHours(new Date(), 2).toISOString(),
    patients: mockPatients[0],
    doctors: { id: "doctor-001", staff: { profiles: { full_name: "Dr. Laila Haddad" } } },
    lab_order_items: [
      { id: "lab-item-1001", lab_order_id: "lab-order-1001", lab_test_id: "lab-test-trop", result_value: "0.09", result_unit: "ng/mL", reference_range: "< 0.04 ng/mL", result_status: "critical", technician_id: "staff-lab-001", result_notes: "Critical value called to ordering physician.", resulted_at: subHours(new Date(), 1).toISOString(), created_at: subHours(new Date(), 2).toISOString(), lab_tests: mockLabTests[2] }
    ]
  },
  {
    id: "lab-order-1002",
    hospital_id: DEFAULT_HOSPITAL_ID,
    patient_id: "p-1002",
    doctor_id: "doctor-002",
    status: "ordered",
    priority: "routine",
    ordered_at: subHours(new Date(), 5).toISOString(),
    created_at: subHours(new Date(), 5).toISOString(),
    patients: mockPatients[1],
    doctors: { id: "doctor-002", staff: { profiles: { full_name: "Dr. Jonah Reed" } } },
    lab_order_items: [
      { id: "lab-item-1002", lab_order_id: "lab-order-1002", lab_test_id: "lab-test-cbc", result_status: "pending", created_at: subHours(new Date(), 5).toISOString(), lab_tests: mockLabTests[0] },
      { id: "lab-item-1003", lab_order_id: "lab-order-1002", lab_test_id: "lab-test-bmp", result_status: "pending", created_at: subHours(new Date(), 5).toISOString(), lab_tests: mockLabTests[1] }
    ]
  }
];

function testPayload(hospitalId: string, values: LabTestInput) {
  return {
    hospital_id: hospitalId,
    test_name: values.test_name,
    test_code: values.test_code.toUpperCase(),
    category: values.category || null,
    description: values.description || null,
    sample_type: values.sample_type || null,
    price: values.price,
    reference_range: values.reference_range || null,
    is_active: values.is_active
  };
}

function criticalCount(orders: LabOrderRecord[]) {
  return orders.reduce((total, order) => total + (order.lab_order_items ?? []).filter((item) => item.result_status === "critical").length, 0);
}

export async function listLabTests(hospitalId?: string | null): Promise<LabTestRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockLabTests;
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase.from<LabTestRecord>("lab_tests").select("*").eq("hospital_id", hospitalId).order("test_name");
  if (error) throw error;
  return data ?? [];
}

export async function getLabTest(id: string, hospitalId?: string | null) {
  const rows = await listLabTests(hospitalId);
  return rows.find((test) => test.id === id) ?? null;
}

export async function listLabOrders(hospitalId?: string | null): Promise<LabOrderRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockLabOrders;
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<LabOrderRecord>("lab_orders")
    .select("*, patients(id,mrn,first_name,last_name), doctors(id, staff:staff_id(profiles(full_name))), lab_order_items(*, lab_tests(*), staff:technician_id(id,employee_code,profiles(full_name,email)))")
    .eq("hospital_id", hospitalId)
    .order("ordered_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getLabOrder(id: string, hospitalId?: string | null): Promise<LabOrderRecord | null> {
  if (!hasSupabaseEnv() || !hospitalId) return mockLabOrders.find((order) => order.id === id) ?? mockLabOrders[0] ?? null;
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<LabOrderRecord>("lab_orders")
    .select("*, patients(id,mrn,first_name,last_name), doctors(id, staff:staff_id(profiles(full_name))), lab_order_items(*, lab_tests(*), staff:technician_id(id,employee_code,profiles(full_name,email)))")
    .eq("hospital_id", hospitalId)
    .eq("id", id)
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function getLabSummary(hospitalId?: string | null): Promise<LabSummary> {
  const orders = await listLabOrders(hospitalId);
  return {
    pending: orders.filter((order) => order.status === "ordered" || order.status === "sample_collected").length,
    processing: orders.filter((order) => order.status === "processing").length,
    completed: orders.filter((order) => order.status === "completed").length,
    critical: criticalCount(orders)
  };
}

export async function listCriticalResults(hospitalId?: string | null): Promise<LabOrderItemRecord[]> {
  const orders = await listLabOrders(hospitalId);
  return orders.flatMap((order) =>
    (order.lab_order_items ?? [])
      .filter((item) => item.result_status === "critical")
      .map((item) => ({ ...item, lab_order_id: order.id }))
  );
}

export async function listLabPatients(hospitalId?: string | null): Promise<LabPatientSummary[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockPatients;
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<LabPatientSummary>("patients")
    .select("id,mrn,first_name,last_name")
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("last_name");
  if (error) throw error;
  return data ?? [];
}

export async function listLabTechnicians(hospitalId?: string | null): Promise<LabTechnicianSummary[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockTechnicians;
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<{ id: string; profile_id: string | null; employee_code: string; profiles?: { full_name: string; role?: string } | null }>("staff")
    .select("id,profile_id,employee_code,profiles!inner(full_name,role)")
    .eq("hospital_id", hospitalId)
    .eq("profiles.role", "lab_technician")
    .is("deleted_at", null)
    .order("employee_code");
  if (error) throw error;
  return (data ?? []).map((staff) => ({
    id: staff.id,
    profile_id: staff.profile_id,
    full_name: staff.profiles?.full_name ?? staff.employee_code,
    employee_code: staff.employee_code
  }));
}

export async function listOrderingDoctors(hospitalId?: string | null): Promise<LabDoctorSummary[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockDoctors;
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<{ id: string; staff_id: string; specialization?: string | null; staff?: { profiles?: { full_name: string } | null } | null }>("doctors")
    .select("id,staff_id,specialization,staff!inner(hospital_id,profiles(full_name))")
    .eq("staff.hospital_id", hospitalId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((doctor) => ({
    id: doctor.id,
    staff_id: doctor.staff_id,
    full_name: doctor.staff?.profiles?.full_name ?? doctor.id,
    specialization: doctor.specialization
  }));
}

export async function createLabTest(hospitalId: string, values: LabTestInput) {
  const parsed = labTestSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix lab test details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Lab test validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const record = { id: randomUUID(), ...testPayload(hospitalId, parsed.data) };
  const { error } = await supabase.from("lab_tests").insert(record);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "lab_test.created", entity_type: "lab_test", entity_id: record.id, new_values: record });
  return { ok: true, message: "Lab test created." };
}

export async function updateLabTest(id: string, hospitalId: string, values: LabTestInput) {
  const parsed = labTestSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix lab test details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Lab test changes validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const record = { ...testPayload(hospitalId, parsed.data), updated_at: new Date().toISOString() };
  const { error } = await supabase.from("lab_tests").update(record).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "lab_test.updated", entity_type: "lab_test", entity_id: id, new_values: record });
  return { ok: true, message: "Lab test updated." };
}

export async function deactivateLabTest(id: string, hospitalId: string) {
  if (!hasSupabaseEnv()) return { ok: true, message: "Lab test deactivation validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { is_active: false, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("lab_tests").update(payload).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "lab_test.deactivated", entity_type: "lab_test", entity_id: id, new_values: payload });
  return { ok: true, message: "Lab test deactivated." };
}

export async function createLabOrder(hospitalId: string, values: LabOrderInput, actorProfileId?: string | null) {
  const parsed = labOrderSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix lab order details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Lab order validated. Connect Supabase to persist records.", orderId: "lab-order-1002" };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const orderId = randomUUID();
  const order = {
    id: orderId,
    hospital_id: hospitalId,
    patient_id: parsed.data.patient_id,
    doctor_id: parsed.data.doctor_id || null,
    encounter_id: parsed.data.encounter_id || null,
    status: "ordered",
    priority: parsed.data.priority,
    notes: parsed.data.notes || null,
    ordered_at: new Date().toISOString()
  };
  const orderInsert = await supabase.from("lab_orders").insert(order);
  if (orderInsert.error) return { ok: false, message: orderInsert.error.message };

  const tests = await listLabTests(hospitalId);
  const items = parsed.data.test_ids.map((testId) => {
    const test = tests.find((item) => item.id === testId);
    return {
      id: randomUUID(),
      lab_order_id: orderId,
      lab_test_id: testId,
      reference_range: test?.reference_range ?? null,
      result_status: "pending",
      technician_id: parsed.data.technician_id || null
    };
  });
  const itemInsert = await supabase.from("lab_order_items").insert(items);
  if (itemInsert.error) return { ok: false, message: itemInsert.error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "lab_order.created", entity_type: "lab_order", entity_id: orderId, new_values: { ...order, items, actorProfileId } });
  return { ok: true, message: "Lab order created.", orderId };
}

export async function updateLabOrderStatus(orderId: string, hospitalId: string, values: LabOrderStatusInput, actorProfileId?: string | null) {
  const parsed = labOrderStatusSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please choose a valid order status." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Lab order status validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = {
    status: parsed.data.status,
    completed_at: parsed.data.status === "completed" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from("lab_orders").update(payload).eq("hospital_id", hospitalId).eq("id", orderId);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "lab_order.status_updated", entity_type: "lab_order", entity_id: orderId, new_values: { ...payload, actorProfileId } });
  return { ok: true, message: "Lab order status updated." };
}

export async function updateLabResult(itemId: string, hospitalId: string, values: LabResultInput, actorProfileId?: string | null) {
  const parsed = labResultSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix result details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Lab result validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = {
    result_value: parsed.data.result_value || null,
    result_unit: parsed.data.result_unit || null,
    reference_range: parsed.data.reference_range || null,
    result_status: parsed.data.result_status,
    technician_id: parsed.data.technician_id || null,
    result_notes: parsed.data.result_notes || null,
    resulted_at: parsed.data.result_status === "pending" ? null : new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from("lab_order_items").update(payload).eq("id", itemId);
  if (error) return { ok: false, message: error.message };
  await supabase.from("audit_logs").insert({ hospital_id: hospitalId, action: "lab_result.updated", entity_type: "lab_order_item", entity_id: itemId, new_values: { ...payload, actorProfileId } });
  return { ok: true, message: "Lab result updated." };
}
