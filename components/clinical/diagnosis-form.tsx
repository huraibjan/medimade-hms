"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { addDiagnosisAction } from "@/lib/actions/clinical-actions";
import { diagnosisSchema, type DiagnosisInput } from "@/lib/validations/clinical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DiagnosisForm({ hospitalId, patientId, encounterId, doctorId }: { hospitalId: string; patientId: string; encounterId?: string; doctorId?: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<DiagnosisInput>({ resolver: zodResolver(diagnosisSchema), defaultValues: { patient_id: patientId, encounter_id: encounterId, is_primary: false } });

  function submit(values: DiagnosisInput) {
    startTransition(async () => {
      const result = await addDiagnosisAction(hospitalId, { ...values, patient_id: patientId, encounter_id: encounterId }, doctorId);
      setMessage(result.message);
      if (result.ok) {
        form.reset({ patient_id: patientId, encounter_id: encounterId, is_primary: false });
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Diagnosis code"><Input placeholder="ICD-10" {...form.register("diagnosis_code")} /></Field>
        <Field label="Diagnosis name"><Input {...form.register("diagnosis_name")} /></Field>
      </div>
      <Field label="Description"><Textarea {...form.register("description")} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("is_primary")} /> Mark primary diagnosis</label>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={isPending} type="submit">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Add diagnosis</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
