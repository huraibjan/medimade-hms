import { randomUUID } from "crypto";
import { addDays, subDays } from "date-fns";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import {
  invoiceSchema,
  invoiceStatusSchema,
  paymentSchema,
  type InvoiceInput,
  type InvoiceItemInput,
  type InvoiceStatusInput,
  type PaymentInput
} from "@/lib/validations/billing";
import type { InvoiceStatus, PaymentMethod, PaymentStatus } from "@/types/database";
import { writeAuditLog } from "./service-context";

export type BillingPatientSummary = {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
};

export type BillingLinkRecord = {
  id: string;
  patient_id: string;
  label: string;
};

export type InvoiceItemRecord = {
  id: string;
  invoice_id: string;
  item_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
};

export type PaymentRecord = {
  id: string;
  hospital_id: string;
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_reference?: string | null;
  paid_at?: string | null;
  received_by?: string | null;
  created_at: string;
  invoices?: Pick<InvoiceRecord, "id" | "invoice_number" | "patient_id" | "patients"> | null;
};

export type InvoiceRecord = {
  id: string;
  hospital_id: string;
  patient_id: string;
  admission_id?: string | null;
  appointment_id?: string | null;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  issued_at?: string | null;
  due_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
  patients?: BillingPatientSummary | null;
  invoice_items?: InvoiceItemRecord[];
  payments?: PaymentRecord[];
  amount_paid: number;
  balance_due: number;
};

export type BillingSummary = {
  totalInvoices: number;
  draft: number;
  issued: number;
  partiallyPaid: number;
  paid: number;
  outstanding: number;
  collected: number;
};

const mockPatients: BillingPatientSummary[] = [
  { id: "p-1001", mrn: "MRN-2026-0001", first_name: "Maya", last_name: "Bennett" },
  { id: "p-1002", mrn: "MRN-2026-0002", first_name: "Noah", last_name: "Singh" },
  { id: "p-1003", mrn: "MRN-2026-0003", first_name: "Elena", last_name: "Morales" }
];

const now = new Date();

const mockInvoicesBase: Array<Omit<InvoiceRecord, "amount_paid" | "balance_due">> = [
  {
    id: "inv-1001",
    hospital_id: DEFAULT_HOSPITAL_ID,
    patient_id: "p-1001",
    admission_id: "adm-1001",
    invoice_number: "INV-2026-0001",
    subtotal: 1580,
    tax_amount: 80,
    discount_amount: 100,
    total_amount: 1560,
    status: "partially_paid",
    issued_at: subDays(now, 4).toISOString(),
    due_at: addDays(now, 14).toISOString(),
    created_at: subDays(now, 4).toISOString(),
    patients: mockPatients[0],
    invoice_items: [
      { id: "item-1001", invoice_id: "inv-1001", item_type: "room", description: "Private room charge", quantity: 2, unit_price: 450, total_price: 900, created_at: subDays(now, 4).toISOString() },
      { id: "item-1002", invoice_id: "inv-1001", item_type: "lab", description: "Cardiac lab panel", quantity: 1, unit_price: 280, total_price: 280, created_at: subDays(now, 4).toISOString() },
      { id: "item-1003", invoice_id: "inv-1001", item_type: "consultation", description: "Cardiology consultation", quantity: 1, unit_price: 400, total_price: 400, created_at: subDays(now, 4).toISOString() }
    ],
    payments: [
      { id: "pay-1001", hospital_id: DEFAULT_HOSPITAL_ID, invoice_id: "inv-1001", amount: 600, payment_method: "card", payment_status: "completed", transaction_reference: "CARD-8842", paid_at: subDays(now, 2).toISOString(), created_at: subDays(now, 2).toISOString() }
    ]
  },
  {
    id: "inv-1002",
    hospital_id: DEFAULT_HOSPITAL_ID,
    patient_id: "p-1002",
    appointment_id: "apt-1002",
    invoice_number: "INV-2026-0002",
    subtotal: 320,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 320,
    status: "paid",
    issued_at: subDays(now, 8).toISOString(),
    due_at: addDays(now, 7).toISOString(),
    created_at: subDays(now, 8).toISOString(),
    patients: mockPatients[1],
    invoice_items: [
      { id: "item-1004", invoice_id: "inv-1002", item_type: "consultation", description: "Neurology consultation", quantity: 1, unit_price: 320, total_price: 320, created_at: subDays(now, 8).toISOString() }
    ],
    payments: [
      { id: "pay-1002", hospital_id: DEFAULT_HOSPITAL_ID, invoice_id: "inv-1002", amount: 320, payment_method: "insurance", payment_status: "completed", transaction_reference: "INS-2026-18", paid_at: subDays(now, 6).toISOString(), created_at: subDays(now, 6).toISOString() }
    ]
  },
  {
    id: "inv-1003",
    hospital_id: DEFAULT_HOSPITAL_ID,
    patient_id: "p-1003",
    invoice_number: "INV-2026-0003",
    subtotal: 740,
    tax_amount: 35,
    discount_amount: 0,
    total_amount: 775,
    status: "issued",
    issued_at: subDays(now, 1).toISOString(),
    due_at: addDays(now, 20).toISOString(),
    created_at: subDays(now, 1).toISOString(),
    patients: mockPatients[2],
    invoice_items: [
      { id: "item-1005", invoice_id: "inv-1003", item_type: "medication", description: "Medication administration", quantity: 1, unit_price: 215, total_price: 215, created_at: subDays(now, 1).toISOString() },
      { id: "item-1006", invoice_id: "inv-1003", item_type: "procedure", description: "Minor procedure package", quantity: 1, unit_price: 525, total_price: 525, created_at: subDays(now, 1).toISOString() }
    ],
    payments: []
  }
];

function withBalances(invoice: Omit<InvoiceRecord, "amount_paid" | "balance_due"> | InvoiceRecord): InvoiceRecord {
  const amountPaid = (invoice.payments ?? [])
    .filter((payment) => payment.payment_status === "completed")
    .reduce((total, payment) => total + Number(payment.amount), 0);
  const totalAmount = Number(invoice.total_amount);
  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    tax_amount: Number(invoice.tax_amount),
    discount_amount: Number(invoice.discount_amount),
    total_amount: totalAmount,
    invoice_items: (invoice.invoice_items ?? []).map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total_price: Number(item.total_price)
    })),
    payments: (invoice.payments ?? []).map((payment) => ({ ...payment, amount: Number(payment.amount) })),
    amount_paid: amountPaid,
    balance_due: Math.max(totalAmount - amountPaid, 0)
  };
}

function totals(items: InvoiceItemInput[], taxAmount: number, discountAmount: number) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
  const total = Math.max(subtotal + Number(taxAmount) - Number(discountAmount), 0);
  return { subtotal, total };
}

function invoiceNumber() {
  return `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

async function audit(hospitalId: string, action: string, entityType: string, entityId: string, values: Record<string, unknown>) {
  await writeAuditLog({ hospitalId, action, entityType, entityId, values });
}

export async function listInvoices(hospitalId?: string | null): Promise<InvoiceRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockInvoicesBase.map(withBalances);
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<InvoiceRecord>("invoices")
    .select("*, patients(id,mrn,first_name,last_name), invoice_items(*), payments(*)")
    .eq("hospital_id", hospitalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(withBalances);
}

export async function getInvoice(id: string, hospitalId?: string | null): Promise<InvoiceRecord | null> {
  if (!hasSupabaseEnv() || !hospitalId) return mockInvoicesBase.map(withBalances).find((invoice) => invoice.id === id) ?? mockInvoicesBase.map(withBalances)[0] ?? null;
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<InvoiceRecord>("invoices")
    .select("*, patients(id,mrn,first_name,last_name), invoice_items(*), payments(*)")
    .eq("hospital_id", hospitalId)
    .eq("id", id)
    .limit(1);
  if (error) throw error;
  const invoice = data?.[0];
  return invoice ? withBalances(invoice) : null;
}

export async function listPayments(hospitalId?: string | null): Promise<PaymentRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) {
    return mockInvoicesBase.flatMap((invoice) => (invoice.payments ?? []).map((payment) => ({
      ...payment,
      invoices: { id: invoice.id, invoice_number: invoice.invoice_number, patient_id: invoice.patient_id, patients: invoice.patients ?? null }
    })));
  }
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<PaymentRecord>("payments")
    .select("*, invoices(id,invoice_number,patient_id,patients(id,mrn,first_name,last_name))")
    .eq("hospital_id", hospitalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((payment) => ({ ...payment, amount: Number(payment.amount) }));
}

export async function getBillingSummary(hospitalId?: string | null): Promise<BillingSummary> {
  const invoices = await listInvoices(hospitalId);
  return {
    totalInvoices: invoices.length,
    draft: invoices.filter((invoice) => invoice.status === "draft").length,
    issued: invoices.filter((invoice) => invoice.status === "issued").length,
    partiallyPaid: invoices.filter((invoice) => invoice.status === "partially_paid").length,
    paid: invoices.filter((invoice) => invoice.status === "paid").length,
    outstanding: invoices.reduce((sum, invoice) => sum + invoice.balance_due, 0),
    collected: invoices.reduce((sum, invoice) => sum + invoice.amount_paid, 0)
  };
}

export async function listBillingPatients(hospitalId?: string | null): Promise<BillingPatientSummary[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockPatients;
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<BillingPatientSummary>("patients")
    .select("id,mrn,first_name,last_name")
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("last_name");
  if (error) throw error;
  return data ?? [];
}

export async function listBillingAdmissions(hospitalId?: string | null): Promise<BillingLinkRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return [{ id: "adm-1001", patient_id: "p-1001", label: "Admission adm-1001 / Inpatient stay" }];
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<{ id: string; patient_id: string; reason?: string | null; admission_datetime?: string | null }>("admissions")
    .select("id,patient_id,reason,admission_datetime")
    .eq("hospital_id", hospitalId)
    .order("admission_datetime", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((admission) => ({ id: admission.id, patient_id: admission.patient_id, label: `Admission ${admission.id.slice(0, 8)} / ${admission.reason ?? "Inpatient stay"}` }));
}

export async function listBillingAppointments(hospitalId?: string | null): Promise<BillingLinkRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return [{ id: "apt-1002", patient_id: "p-1002", label: "Appointment apt-1002 / Outpatient visit" }];
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<{ id: string; patient_id: string; reason?: string | null; scheduled_start?: string | null }>("appointments")
    .select("id,patient_id,reason,scheduled_start")
    .eq("hospital_id", hospitalId)
    .order("scheduled_start", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((appointment) => ({ id: appointment.id, patient_id: appointment.patient_id, label: `Appointment ${appointment.id.slice(0, 8)} / ${appointment.reason ?? "Visit"}` }));
}

export async function createInvoice(hospitalId: string, values: InvoiceInput, actorProfileId?: string | null) {
  const parsed = invoiceSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix invoice details." };
  const { subtotal, total } = totals(parsed.data.items, parsed.data.tax_amount, parsed.data.discount_amount);
  if (parsed.data.discount_amount > subtotal + parsed.data.tax_amount) return { ok: false, message: "Discount cannot exceed subtotal plus tax." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Invoice validated. Connect Supabase to persist records.", invoiceId: "inv-1001" };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const invoiceId = randomUUID();
  const invoice = {
    id: invoiceId,
    hospital_id: hospitalId,
    patient_id: parsed.data.patient_id,
    admission_id: parsed.data.admission_id || null,
    appointment_id: parsed.data.appointment_id || null,
    invoice_number: invoiceNumber(),
    subtotal,
    tax_amount: parsed.data.tax_amount,
    discount_amount: parsed.data.discount_amount,
    total_amount: total,
    status: parsed.data.status,
    issued_at: parsed.data.status === "issued" ? (parsed.data.issued_at || new Date().toISOString()) : null,
    due_at: parsed.data.due_at || null,
    created_by: actorProfileId ?? null
  };
  const invoiceInsert = await supabase.from("invoices").insert(invoice);
  if (invoiceInsert.error) return { ok: false, message: invoiceInsert.error.message };
  const items = parsed.data.items.map((item) => ({
    id: randomUUID(),
    invoice_id: invoiceId,
    item_type: item.item_type,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price
  }));
  const itemInsert = await supabase.from("invoice_items").insert(items);
  if (itemInsert.error) return { ok: false, message: itemInsert.error.message };
  await audit(hospitalId, "invoice.created", "invoice", invoiceId, { ...invoice, items });
  return { ok: true, message: "Invoice created.", invoiceId };
}

export async function updateInvoiceStatus(invoiceId: string, hospitalId: string, values: InvoiceStatusInput, actorProfileId?: string | null) {
  const parsed = invoiceStatusSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please choose a valid invoice status." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Invoice status validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { status: parsed.data.status, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("invoices").update(payload).eq("hospital_id", hospitalId).eq("id", invoiceId);
  if (error) return { ok: false, message: error.message };
  await audit(hospitalId, "invoice.status_updated", "invoice", invoiceId, { ...payload, actorProfileId });
  return { ok: true, message: "Invoice status updated." };
}

export async function recordPayment(hospitalId: string, values: PaymentInput, actorProfileId?: string | null) {
  const parsed = paymentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix payment details." };
  const invoice = await getInvoice(parsed.data.invoice_id, hospitalId);
  if (!invoice) return { ok: false, message: "Invoice not found." };
  if (parsed.data.amount > invoice.balance_due) return { ok: false, message: "Payment cannot exceed outstanding balance." };
  const nextPaid = invoice.amount_paid + parsed.data.amount;
  const nextStatus: InvoiceStatus = nextPaid >= invoice.total_amount ? "paid" : "partially_paid";
  if (!hasSupabaseEnv()) return { ok: true, message: "Payment validated. Connect Supabase to persist records." };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const payment = {
    id: randomUUID(),
    hospital_id: hospitalId,
    invoice_id: parsed.data.invoice_id,
    amount: parsed.data.amount,
    payment_method: parsed.data.payment_method,
    payment_status: "completed",
    transaction_reference: parsed.data.transaction_reference || null,
    paid_at: parsed.data.paid_at || new Date().toISOString(),
    received_by: actorProfileId ?? null
  };
  const paymentInsert = await supabase.from("payments").insert(payment);
  if (paymentInsert.error) return { ok: false, message: paymentInsert.error.message };
  const invoiceUpdate = await supabase.from("invoices").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("hospital_id", hospitalId).eq("id", parsed.data.invoice_id);
  if (invoiceUpdate.error) return { ok: false, message: invoiceUpdate.error.message };
  await audit(hospitalId, "payment.received", "payment", payment.id, { ...payment, nextInvoiceStatus: nextStatus });
  return { ok: true, message: nextStatus === "paid" ? "Payment recorded. Invoice marked paid." : "Partial payment recorded." };
}
