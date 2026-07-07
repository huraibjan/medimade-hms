"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { updateLabResultAction } from "@/lib/actions/lab-actions";
import type { LabOrderItemRecord, LabTechnicianSummary } from "@/lib/services/lab";
import { labResultSchema, type LabResultInput } from "@/lib/validations/lab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function LabResultForm({
  hospitalId,
  orderId,
  item,
  technicians,
  actorProfileId
}: {
  hospitalId: string;
  orderId: string;
  item: LabOrderItemRecord;
  technicians: LabTechnicianSummary[];
  actorProfileId?: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<LabResultInput>({
    resolver: zodResolver(labResultSchema),
    defaultValues: {
      result_value: item.result_value ?? "",
      result_unit: item.result_unit ?? "",
      reference_range: item.reference_range ?? item.lab_tests?.reference_range ?? "",
      result_status: item.result_status,
      technician_id: item.technician_id ?? "",
      result_notes: item.result_notes ?? ""
    }
  });

  function submit(values: LabResultInput) {
    startTransition(async () => {
      const result = await updateLabResultAction(item.id, orderId, hospitalId, values, actorProfileId);
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <form className="grid gap-3" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Result value"><Input {...form.register("result_value")} /></Field>
        <Field label="Unit"><Input {...form.register("result_unit")} /></Field>
        <Field label="Reference range"><Input {...form.register("reference_range")} /></Field>
        <Field label="Result status">
          <Select value={form.watch("result_status")} onValueChange={(value) => form.setValue("result_status", value as LabResultInput["result_status"], { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Result status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="abnormal">Abnormal</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Technician">
          <Select value={form.watch("technician_id")} onValueChange={(value) => form.setValue("technician_id", value)}>
            <SelectTrigger><SelectValue placeholder="Assign technician" /></SelectTrigger>
            <SelectContent>
              {technicians.map((technician) => <SelectItem key={technician.id} value={technician.id}>{technician.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Result notes"><Textarea {...form.register("result_notes")} /></Field>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" type="submit" disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save result</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
