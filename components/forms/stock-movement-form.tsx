"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createStockMovementAction } from "@/lib/actions/inventory-actions";
import type { InventoryBatchRecord } from "@/lib/services/inventory";
import { stockMovementSchema, stockMovementTypes, type StockMovementInput } from "@/lib/validations/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function StockMovementForm({ hospitalId, actorProfileId, inventory }: { hospitalId: string; actorProfileId?: string | null; inventory: InventoryBatchRecord[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<StockMovementInput>({ resolver: zodResolver(stockMovementSchema), defaultValues: { inventory_id: "", movement_type: "purchase", quantity: 0, reason: "", reference_number: "" } });

  function submit(values: StockMovementInput) {
    startTransition(async () => {
      const result = await createStockMovementAction(hospitalId, values, actorProfileId);
      setMessage(result.message);
      if (result.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Inventory batch">
          <Select value={form.watch("inventory_id")} onValueChange={(value) => form.setValue("inventory_id", value, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
            <SelectContent>{inventory.map((batch) => <SelectItem key={batch.id} value={batch.id}>{batch.medications?.name ?? batch.sku} / {batch.batch_no} / {batch.quantity_on_hand} on hand</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Movement type">
          <Select value={form.watch("movement_type")} onValueChange={(value) => form.setValue("movement_type", value as StockMovementInput["movement_type"])}>
            <SelectTrigger><SelectValue placeholder="Movement type" /></SelectTrigger>
            <SelectContent>{stockMovementTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Quantity"><Input type="number" {...form.register("quantity")} /></Field>
        <Field label="Reference"><Input placeholder="PO, RX, adjustment ref" {...form.register("reference_number")} /></Field>
        <Field label="Reason"><Input {...form.register("reason")} /></Field>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={isPending} type="submit">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Record movement</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
