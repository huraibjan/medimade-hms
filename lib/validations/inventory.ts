import { z } from "zod";

export const stockMovementTypes = ["purchase", "dispense", "adjustment", "return", "expired", "damaged"] as const;

export const medicineSchema = z.object({
  name: z.string().min(2, "Medicine name is required"),
  generic_name: z.string().optional(),
  brand_name: z.string().optional(),
  strength: z.string().optional(),
  dosage_form: z.string().min(1, "Dosage form is required"),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true)
});

export const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name is required"),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Use a valid email").optional().or(z.literal("")),
  address: z.string().optional(),
  is_active: z.boolean().default(true)
});

export const inventoryBatchSchema = z.object({
  medication_id: z.string().min(1, "Select a medicine"),
  supplier_id: z.string().optional(),
  sku: z.string().min(2, "SKU is required"),
  batch_no: z.string().min(1, "Batch number is required"),
  expiry_date: z.string().min(1, "Expiry date is required"),
  quantity_on_hand: z.coerce.number().int().min(0),
  reorder_level: z.coerce.number().int().min(0),
  unit_cost: z.coerce.number().min(0),
  selling_price: z.coerce.number().min(0),
  storage_location: z.string().optional()
});

export const stockMovementSchema = z.object({
  inventory_id: z.string().min(1, "Select inventory batch"),
  movement_type: z.enum(stockMovementTypes),
  quantity: z.coerce.number().int().refine((value) => value !== 0, "Quantity cannot be zero"),
  reason: z.string().optional(),
  reference_number: z.string().optional()
});

export const dispensePrescriptionSchema = z.object({
  prescription_id: z.string().min(1),
  medication_id: z.string().min(1),
  quantity: z.coerce.number().int().positive()
});

export type MedicineInput = z.infer<typeof medicineSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type InventoryBatchInput = z.infer<typeof inventoryBatchSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type DispensePrescriptionInput = z.infer<typeof dispensePrescriptionSchema>;
