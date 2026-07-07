"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { admitPatientAction } from "@/lib/actions/admission-actions";
import type { AdmissionOptions } from "@/lib/services/admissions";
import { admissionSchema, type AdmissionInput } from "@/lib/validations/admission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function AdmissionForm({
  hospitalId,
  actorProfileId,
  options
}: {
  hospitalId: string;
  actorProfileId?: string | null;
  options: AdmissionOptions;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<AdmissionInput>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      patient_id: "",
      admitting_doctor_id: "",
      department_id: "",
      bed_id: "",
      admission_datetime: "",
      expected_discharge_datetime: "",
      reason: "",
      diagnosis_summary: ""
    }
  });

  function submit(values: AdmissionInput) {
    startTransition(async () => {
      const result = await admitPatientAction(hospitalId, values, actorProfileId);
      setMessage(result.message);
      if (result.ok) {
        form.reset();
        router.push(result.admissionId ? `/admissions/${result.admissionId}` : "/admissions");
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Patient" error={form.formState.errors.patient_id?.message}>
          <Select value={form.watch("patient_id")} onValueChange={(value) => form.setValue("patient_id", value, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
            <SelectContent>
              {options.patients.map((patient) => <SelectItem key={patient.id} value={patient.id}>{patient.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Available bed">
          <Select value={form.watch("bed_id")} onValueChange={(value) => form.setValue("bed_id", value, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Assign now or leave blank" /></SelectTrigger>
            <SelectContent>
              {options.availableBeds.map((bed) => (
                <SelectItem key={bed.id} value={bed.id}>
                  {bed.rooms?.wards?.name ?? "Ward"} / {bed.rooms?.room_number ?? "Room"} / Bed {bed.bed_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Doctor">
          <Select value={form.watch("admitting_doctor_id")} onValueChange={(value) => form.setValue("admitting_doctor_id", value)}>
            <SelectTrigger><SelectValue placeholder="Assign doctor" /></SelectTrigger>
            <SelectContent>
              {options.doctors.map((doctor) => <SelectItem key={doctor.id} value={doctor.id}>{doctor.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Department">
          <Select value={form.watch("department_id")} onValueChange={(value) => form.setValue("department_id", value)}>
            <SelectTrigger><SelectValue placeholder="Assign department" /></SelectTrigger>
            <SelectContent>
              {options.departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Admission date/time">
          <Input type="datetime-local" {...form.register("admission_datetime")} />
        </Field>
        <Field label="Expected discharge">
          <Input type="datetime-local" {...form.register("expected_discharge_datetime")} />
        </Field>
      </div>
      <Field label="Admission reason" error={form.formState.errors.reason?.message}>
        <Textarea {...form.register("reason")} />
      </Field>
      <Field label="Diagnosis summary">
        <Textarea {...form.register("diagnosis_summary")} />
      </Field>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={isPending} type="submit">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Admit patient
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
