"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createAppointmentAction, updateAppointmentAction } from "@/lib/actions/appointment-actions";
import type { AppointmentOptions, AppointmentRecord } from "@/lib/services/appointments";
import { appointmentSchema, type AppointmentInput } from "@/lib/validations/appointment";
import type { UserRole } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function toLocalDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function AppointmentForm({
  hospitalId,
  actorProfileId,
  actorRole,
  options,
  appointment,
  mode = "create"
}: {
  hospitalId: string;
  actorProfileId?: string | null;
  actorRole?: UserRole | null;
  options: AppointmentOptions;
  appointment?: AppointmentRecord;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: appointment?.patient_id ?? "",
      doctor_id: appointment?.doctor_id ?? "",
      department_id: appointment?.department_id ?? "",
      scheduled_start: toLocalDateTime(appointment?.scheduled_start),
      scheduled_end: toLocalDateTime(appointment?.scheduled_end),
      reason: appointment?.reason ?? "",
      notes: appointment?.notes ?? ""
    }
  });

  function submit(values: AppointmentInput) {
    startTransition(async () => {
      const result =
        mode === "edit" && appointment
          ? await updateAppointmentAction(appointment.id, hospitalId, values, actorRole)
          : await createAppointmentAction(hospitalId, values, actorProfileId, actorRole);
      setMessage(result.message);
      if (result.ok) {
        router.push(result.appointmentId ? `/appointments/${result.appointmentId}` : "/appointments");
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
            <SelectContent>{options.patients.map((patient) => <SelectItem key={patient.id} value={patient.id}>{patient.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Doctor" error={form.formState.errors.doctor_id?.message}>
          <Select value={form.watch("doctor_id")} onValueChange={(value) => form.setValue("doctor_id", value, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
            <SelectContent>{options.doctors.map((doctor) => <SelectItem key={doctor.id} value={doctor.id}>{doctor.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Department">
          <Select value={form.watch("department_id")} onValueChange={(value) => form.setValue("department_id", value)}>
            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>{options.departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <div />
        <Field label="Start" error={form.formState.errors.scheduled_start?.message}>
          <Input type="datetime-local" {...form.register("scheduled_start")} />
        </Field>
        <Field label="End" error={form.formState.errors.scheduled_end?.message}>
          <Input type="datetime-local" {...form.register("scheduled_end")} />
        </Field>
      </div>
      <Field label="Reason">
        <Textarea {...form.register("reason")} />
      </Field>
      <Field label="Notes">
        <Textarea {...form.register("notes")} />
      </Field>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={isPending} type="submit">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {mode === "edit" ? "Save appointment" : "Schedule appointment"}
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
