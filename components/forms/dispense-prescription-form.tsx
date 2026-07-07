"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { dispensePrescriptionAction } from "@/lib/actions/inventory-actions";
import type { MedicineRecord } from "@/lib/services/pharmacy";
import { dispensePrescriptionSchema, type DispensePrescriptionInput } from "@/lib/validations/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DispensePrescriptionForm({
  hospitalId,
  actorProfileId,
  medicines
}: {
  hospitalId: string;
  actorProfileId?: string | null;
  medicines: MedicineRecord[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<DispensePrescriptionInput>({
    resolver: zodResolver(dispensePrescriptionSchema),
    defaultValues: { prescription_id: "", medication_id: "", quantity: 1 }
  });

  function submit(values: DispensePrescriptionInput) {
    startTransition(async () => {
      const result = await dispensePrescriptionAction(hospitalId, values, actorProfileId);
      setMessage(result.message);
      if (result.ok) {
        form.reset({ prescription_id: "", medication_id: "", quantity: 1 });
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Prescription ID">
          <Input {...form.register("prescription_id")} />
        </Field>
        <Field label="Medicine">
          <Select value={form.watch("medication_id")} onValueChange={(value) => form.setValue("medication_id", value, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select medicine" /></SelectTrigger>
            <SelectContent>
              {medicines.filter((medicine) => medicine.is_active).map((medicine) => (
                <SelectItem key={medicine.id} value={medicine.id}>{medicine.name} {medicine.strength}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Quantity">
          <Input type="number" min={1} {...form.register("quantity")} />
        </Field>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={isPending} type="submit">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Dispense prescription
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
