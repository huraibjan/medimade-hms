"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { addTreatmentPlanAction } from "@/lib/actions/clinical-actions";
import { treatmentPlanSchema, type TreatmentPlanInput } from "@/lib/validations/clinical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TreatmentPlanForm({ hospitalId, patientId, encounterId, doctorId }: { hospitalId: string; patientId: string; encounterId?: string; doctorId?: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<TreatmentPlanInput>({ resolver: zodResolver(treatmentPlanSchema), defaultValues: { patient_id: patientId, encounter_id: encounterId, status: "active" } });

  function submit(values: TreatmentPlanInput) {
    startTransition(async () => {
      const result = await addTreatmentPlanAction(hospitalId, { ...values, patient_id: patientId, encounter_id: encounterId }, doctorId);
      setMessage(result.message);
      if (result.ok) {
        form.reset({ patient_id: patientId, encounter_id: encounterId, status: "active" });
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <Field label="Plan title"><Input {...form.register("plan_title")} /></Field>
      <Field label="Plan details"><Textarea {...form.register("plan_details")} /></Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Start date"><Input type="date" {...form.register("start_date")} /></Field>
        <Field label="End date"><Input type="date" {...form.register("end_date")} /></Field>
        <Field label="Status"><Input {...form.register("status")} /></Field>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={isPending} type="submit">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Add treatment plan</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
