"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createLabTestAction } from "@/lib/actions/lab-actions";
import { labTestSchema, type LabTestInput } from "@/lib/validations/lab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function LabTestForm({ hospitalId }: { hospitalId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<LabTestInput>({
    resolver: zodResolver(labTestSchema),
    defaultValues: { test_name: "", test_code: "", category: "", description: "", sample_type: "", price: 0, reference_range: "", is_active: true }
  });

  function submit(values: LabTestInput) {
    startTransition(async () => {
      const result = await createLabTestAction(hospitalId, values);
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
        <Field label="Test name"><Input {...form.register("test_name")} /></Field>
        <Field label="Test code"><Input {...form.register("test_code")} /></Field>
        <Field label="Category"><Input placeholder="Hematology, Chemistry, Microbiology" {...form.register("category")} /></Field>
        <Field label="Sample type"><Input placeholder="Serum, plasma, whole blood" {...form.register("sample_type")} /></Field>
        <Field label="Price"><Input type="number" step="0.01" {...form.register("price")} /></Field>
        <Field label="Reference range"><Input placeholder="4.0-5.6%, < 0.04 ng/mL" {...form.register("reference_range")} /></Field>
      </div>
      <Field label="Description"><Textarea {...form.register("description")} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("is_active")} /> Active test</label>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" type="submit" disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save lab test</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
