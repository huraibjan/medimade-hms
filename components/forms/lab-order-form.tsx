"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createLabOrderAction } from "@/lib/actions/lab-actions";
import type { LabDoctorSummary, LabPatientSummary, LabTechnicianSummary, LabTestRecord } from "@/lib/services/lab";
import { toast } from "@/lib/toast";
import { labOrderSchema, type LabOrderInput } from "@/lib/validations/lab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function LabOrderForm({
  hospitalId,
  actorProfileId,
  patients,
  tests,
  technicians,
  doctors
}: {
  hospitalId: string;
  actorProfileId?: string | null;
  patients: LabPatientSummary[];
  tests: LabTestRecord[];
  technicians: LabTechnicianSummary[];
  doctors: LabDoctorSummary[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<LabOrderInput>({
    resolver: zodResolver(labOrderSchema),
    defaultValues: { patient_id: "", doctor_id: "", encounter_id: "", technician_id: "", test_ids: [], priority: "routine", notes: "" }
  });
  const selectedTests = form.watch("test_ids");

  function toggleTest(testId: string) {
    const next = selectedTests.includes(testId)
      ? selectedTests.filter((id) => id !== testId)
      : [...selectedTests, testId];
    form.setValue("test_ids", next, { shouldValidate: true });
  }

  function submit(values: LabOrderInput) {
    startTransition(async () => {
      const result = await createLabOrderAction(hospitalId, values, actorProfileId);
      setMessage(result.message);
      if (result.ok) {
        toast.success("Lab order created", result.message);
        form.reset();
        router.refresh();
      } else {
        toast.error("Lab order failed", result.message);
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Patient">
          <Select value={form.watch("patient_id")} onValueChange={(value) => form.setValue("patient_id", value, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
            <SelectContent>
              {patients.map((patient) => <SelectItem key={patient.id} value={patient.id}>{patient.last_name}, {patient.first_name} / {patient.mrn}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Ordering doctor">
          <Select value={form.watch("doctor_id")} onValueChange={(value) => form.setValue("doctor_id", value)}>
            <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => <SelectItem key={doctor.id} value={doctor.id}>{doctor.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={form.watch("priority")} onValueChange={(value) => form.setValue("priority", value as LabOrderInput["priority"])}>
            <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="stat">Stat</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Assign technician">
          <Select value={form.watch("technician_id")} onValueChange={(value) => form.setValue("technician_id", value)}>
            <SelectTrigger><SelectValue placeholder="Assign technician" /></SelectTrigger>
            <SelectContent>
              {technicians.map((technician) => <SelectItem key={technician.id} value={technician.id}>{technician.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Encounter ID">
          <Input placeholder="Optional encounter UUID" {...form.register("encounter_id")} />
        </Field>
      </div>
      <div className="grid gap-2">
        <Label>Tests</Label>
        <div className="grid gap-2 rounded-md border p-3 md:grid-cols-2">
          {tests.filter((test) => test.is_active).map((test) => (
            <label key={test.id} className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={selectedTests.includes(test.id)} onChange={() => toggleTest(test.id)} />
              <span><span className="font-medium">{test.test_name}</span><span className="block text-xs text-muted-foreground">{test.test_code} / {test.sample_type ?? "Sample not specified"}</span></span>
            </label>
          ))}
        </div>
      </div>
      <Field label="Notes"><Textarea {...form.register("notes")} /></Field>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" type="submit" disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Create lab order</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
