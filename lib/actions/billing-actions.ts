"use server";

import { revalidatePath } from "next/cache";
import { createInvoice, recordPayment, updateInvoiceStatus } from "@/lib/services/billing";
import { guardAction } from "@/lib/services/service-context";
import type { InvoiceInput, InvoiceStatusInput, PaymentInput } from "@/lib/validations/billing";
import type { ActionState } from "./types";

export type BillingActionState = ActionState & { invoiceId?: string };

function revalidateBilling(invoiceId?: string) {
  revalidatePath("/billing");
  revalidatePath("/billing/invoices");
  revalidatePath("/billing/payments");
  if (invoiceId) revalidatePath(`/billing/invoices/${invoiceId}`);
}

export async function createInvoiceAction(valuesOrHospitalId: InvoiceInput | string, maybeValues?: InvoiceInput, _actorProfileId?: string | null): Promise<BillingActionState> {
  void _actorProfileId;
  const guard = await guardAction("billing:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Invoice details are required." };
  const result = await createInvoice(guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateBilling(result.invoiceId);
  return result;
}

export async function recordPaymentAction(valuesOrHospitalId: PaymentInput | string, maybeValues?: PaymentInput, _actorProfileId?: string | null): Promise<BillingActionState> {
  void _actorProfileId;
  const guard = await guardAction("billing:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Payment details are required." };
  const result = await recordPayment(guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateBilling(values.invoice_id);
  return result;
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  valuesOrHospitalId: InvoiceStatusInput | string,
  maybeValues?: InvoiceStatusInput,
  _actorProfileId?: string | null
): Promise<BillingActionState> {
  void _actorProfileId;
  const guard = await guardAction("billing:manage");
  if (!guard.ok) return guard;

  const values = typeof valuesOrHospitalId === "string" ? maybeValues : valuesOrHospitalId;
  if (!values) return { ok: false, message: "Invoice status is required." };
  const result = await updateInvoiceStatus(invoiceId, guard.hospitalId, values, guard.profile.id);
  if (result.ok) revalidateBilling(invoiceId);
  return result;
}
