"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { addVitalsAction } from "@/lib/actions/clinical-actions";
import { vitalsSchema, type VitalsInput } from "@/lib/validations/clinical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VitalsForm({ hospitalId, patientId, encounterId, actorProfileId }: { hospitalId: string; patientId: string; encounterId?: string; actorProfileId?: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<VitalsInput>({ resolver: zodResolver(vitalsSchema), defaultValues: { patient_id: patientId, encounter_id: encounterId } });

  function submit(values: VitalsInput) {
    startTransition(async () => {
      const result = await addVitalsAction(hospitalId, { ...values, patient_id: patientId, encounter_id: encounterId }, actorProfileId);
      setMessage(result.message);
      if (result.ok) {
        form.reset({ patient_id: patientId, encounter_id: encounterId });
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Temperature C"><Input type="number" step="0.1" {...form.register("temperature_c")} /></Field>
        <Field label="BP systolic"><Input type="number" {...form.register("blood_pressure_systolic")} /></Field>
        <Field label="BP diastolic"><Input type="number" {...form.register("blood_pressure_diastolic")} /></Field>
        <Field label="Pulse"><Input type="number" {...form.register("pulse")} /></Field>
        <Field label="Respiratory rate"><Input type="number" {...form.register("respiratory_rate")} /></Field>
        <Field label="Oxygen saturation"><Input type="number" step="0.1" {...form.register("oxygen_saturation")} /></Field>
        <Field label="Weight kg"><Input type="number" step="0.1" {...form.register("weight_kg")} /></Field>
        <Field label="Height cm"><Input type="number" step="0.1" {...form.register("height_cm")} /></Field>
        <Field label="Pain score"><Input type="number" min="0" max="10" {...form.register("pain_score")} /></Field>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={isPending} type="submit">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Record vitals</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
