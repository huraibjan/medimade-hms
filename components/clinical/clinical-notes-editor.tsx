"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { saveClinicalNotesAction } from "@/lib/actions/clinical-actions";
import { clinicalNotesSchema, type ClinicalNotesInput } from "@/lib/validations/clinical";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ClinicalNotesEditor({
  encounterId,
  hospitalId,
  patientId,
  chiefComplaint,
  actorProfileId
}: {
  encounterId: string;
  hospitalId: string;
  patientId: string;
  chiefComplaint?: string | null;
  actorProfileId?: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ClinicalNotesInput>({
    resolver: zodResolver(clinicalNotesSchema),
    defaultValues: { chief_complaint: chiefComplaint ?? "", doctor_notes: "", nurse_notes: "" }
  });

  function submit(values: ClinicalNotesInput) {
    startTransition(async () => {
      const result = await saveClinicalNotesAction(encounterId, hospitalId, values, patientId, actorProfileId);
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <Field label="Chief complaint"><Textarea {...form.register("chief_complaint")} /></Field>
      <Field label="Doctor notes"><Textarea {...form.register("doctor_notes")} /></Field>
      <Field label="Nurse notes"><Textarea {...form.register("nurse_notes")} /></Field>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={isPending} type="submit">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save notes</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
