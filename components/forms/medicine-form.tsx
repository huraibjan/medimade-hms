"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createMedicineAction, updateMedicineAction } from "@/lib/actions/inventory-actions";
import type { MedicineRecord } from "@/lib/services/pharmacy";
import { medicineSchema, type MedicineInput } from "@/lib/validations/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function MedicineForm({ hospitalId, medicine }: { hospitalId: string; medicine?: MedicineRecord }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<MedicineInput>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: medicine?.name ?? "",
      generic_name: medicine?.generic_name ?? "",
      brand_name: medicine?.brand_name ?? "",
      strength: medicine?.strength ?? "",
      dosage_form: medicine?.dosage_form ?? "",
      manufacturer: medicine?.manufacturer ?? "",
      description: medicine?.description ?? "",
      is_active: medicine?.is_active ?? true
    }
  });

  function submit(values: MedicineInput) {
    startTransition(async () => {
      const result = medicine
        ? await updateMedicineAction(medicine.id, hospitalId, values)
        : await createMedicineAction(hospitalId, values);
      setMessage(result.message);
      if (result.ok) {
        if (!medicine) form.reset();
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Medicine name"><Input {...form.register("name")} /></Field>
        <Field label="Generic name"><Input {...form.register("generic_name")} /></Field>
        <Field label="Brand name"><Input {...form.register("brand_name")} /></Field>
        <Field label="Strength"><Input placeholder="500 mg" {...form.register("strength")} /></Field>
        <Field label="Dosage form"><Input placeholder="Tablet, capsule, vial" {...form.register("dosage_form")} /></Field>
        <Field label="Manufacturer"><Input {...form.register("manufacturer")} /></Field>
      </div>
      <Field label="Description"><Textarea {...form.register("description")} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("is_active")} /> Active medicine</label>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" type="submit" disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save medicine</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
