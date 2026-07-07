import { z } from "zod";

export const invoiceStatuses = ["draft", "issued", "partially_paid", "paid", "cancelled"] as const;
export const paymentMethods = ["cash", "card", "bank_transfer", "insurance", "online"] as const;
export const invoiceItemTypes = ["service", "room", "lab", "medication", "consultation", "procedure", "other"] as const;

export const invoiceItemSchema = z.object({
  item_type: z.enum(invoiceItemTypes),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().positive(),
  unit_price: z.coerce.number().min(0)
});

export const invoiceSchema = z.object({
  patient_id: z.string().min(1, "Select a patient"),
  admission_id: z.string().optional(),
  appointment_id: z.string().optional(),
  status: z.enum(["draft", "issued"]).default("draft"),
  issued_at: z.string().optional(),
  due_at: z.string().optional(),
  tax_amount: z.coerce.number().min(0).default(0),
  discount_amount: z.coerce.number().min(0).default(0),
  items: z.array(invoiceItemSchema).min(1, "Add at least one invoice item")
});

export const paymentSchema = z.object({
  invoice_id: z.string().min(1, "Select an invoice"),
  amount: z.coerce.number().positive(),
  payment_method: z.enum(paymentMethods),
  transaction_reference: z.string().optional(),
  paid_at: z.string().optional()
});

export const invoiceStatusSchema = z.object({
  status: z.enum(invoiceStatuses)
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type InvoiceStatusInput = z.infer<typeof invoiceStatusSchema>;
