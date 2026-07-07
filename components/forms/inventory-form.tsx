"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createInventoryBatchAction } from "@/lib/actions/inventory-actions";
import type { MedicineRecord } from "@/lib/services/pharmacy";
import type { SupplierRecord } from "@/lib/services/suppliers";
import { toast } from "@/lib/toast";
import { inventoryBatchSchema, type InventoryBatchInput } from "@/lib/validations/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function InventoryForm({ hospitalId, actorProfileId, medicines, suppliers }: { hospitalId: string; actorProfileId?: string | null; medicines: MedicineRecord[]; suppliers: SupplierRecord[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<InventoryBatchInput>({
    resolver: zodResolver(inventoryBatchSchema),
    defaultValues: { medication_id: "", supplier_id: "", sku: "", batch_no: "", expiry_date: "", quantity_on_hand: 0, reorder_level: 0, unit_cost: 0, selling_price: 0, storage_location: "" }
  });

  function submit(values: InventoryBatchInput) {
    startTransition(async () => {
      const result = await createInventoryBatchAction(hospitalId, values, actorProfileId);
      setMessage(result.message);
      if (result.ok) {
        toast.success("Inventory batch added", result.message);
        form.reset();
        router.refresh();
      } else {
        toast.error("Inventory update failed", result.message);
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Medicine">
          <Select value={form.watch("medication_id")} onValueChange={(value) => form.setValue("medication_id", value, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select medicine" /></SelectTrigger>
            <SelectContent>{medicines.map((medicine) => <SelectItem key={medicine.id} value={medicine.id}>{medicine.name} {medicine.strength}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Supplier">
          <Select value={form.watch("supplier_id")} onValueChange={(value) => form.setValue("supplier_id", value)}>
            <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
            <SelectContent>{suppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="SKU"><Input {...form.register("sku")} /></Field>
        <Field label="Batch number"><Input {...form.register("batch_no")} /></Field>
        <Field label="Expiry date"><Input type="date" {...form.register("expiry_date")} /></Field>
        <Field label="Quantity on hand"><Input type="number" {...form.register("quantity_on_hand")} /></Field>
        <Field label="Reorder level"><Input type="number" {...form.register("reorder_level")} /></Field>
        <Field label="Unit cost"><Input type="number" step="0.01" {...form.register("unit_cost")} /></Field>
        <Field label="Selling price"><Input type="number" step="0.01" {...form.register("selling_price")} /></Field>
        <Field label="Storage location"><Input {...form.register("storage_location")} /></Field>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={isPending} type="submit">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Add inventory batch</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
