"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const prescriptionFormSchema = z.object({
  medication: z.string().min(2, "Medication is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().optional(),
  instructions: z.string().optional()
});

type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

export function PrescriptionForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      medication: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: ""
    }
  });

  function submit(values: PrescriptionFormValues) {
    startTransition(() => {
      toast.info("Prescription validated", `${values.medication} is ready to attach to a clinical encounter.`);
      form.reset();
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Medication" error={form.formState.errors.medication?.message}>
          <Input {...form.register("medication")} />
        </Field>
        <Field label="Dosage" error={form.formState.errors.dosage?.message}>
          <Input {...form.register("dosage")} />
        </Field>
        <Field label="Frequency" error={form.formState.errors.frequency?.message}>
          <Input {...form.register("frequency")} />
        </Field>
        <Field label="Duration">
          <Input {...form.register("duration")} />
        </Field>
      </div>
      <Field label="Instructions">
        <Textarea {...form.register("instructions")} />
      </Field>
      <Button className="w-fit" type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Add prescription
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
