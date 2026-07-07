"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createPatientAction, updatePatientAction } from "@/lib/actions/patient-actions";
import type { PatientRecord } from "@/lib/services/patient-service";
import { toast } from "@/lib/toast";
import { bloodGroupOptions, genderOptions, patientSchema, type PatientFormValues } from "@/lib/validations/patient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

function defaultValues(patient?: PatientRecord): PatientFormValues {
  return {
    mrn: patient?.mrn ?? "",
    first_name: patient?.first_name ?? "",
    last_name: patient?.last_name ?? "",
    date_of_birth: patient?.date_of_birth ?? "",
    gender: patient?.gender ?? "unknown",
    blood_group: patient?.blood_group ?? "",
    phone: patient?.phone ?? "",
    email: patient?.email ?? "",
    address_line1: patient?.address_line1 ?? "",
    address_line2: patient?.address_line2 ?? "",
    city: patient?.city ?? "",
    state: patient?.state ?? "",
    postal_code: patient?.postal_code ?? "",
    country: patient?.country ?? "United States",
    allergies: patient?.allergies ?? "",
    chronic_conditions: patient?.chronic_conditions ?? "",
    notes: patient?.notes ?? ""
  };
}

export function PatientForm({
  patient,
  mode = "create"
}: {
  patient?: PatientRecord;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: defaultValues(patient)
  });

  function onSubmit(values: PatientFormValues) {
    startTransition(async () => {
      const result =
        mode === "edit" && patient
          ? await updatePatientAction(patient.id, values)
          : await createPatientAction(values);
      setMessage(result.message);
      if (result.ok) {
        toast.success(mode === "edit" ? "Patient updated" : "Patient registered", result.message);
        if (mode === "create") form.reset(defaultValues());
        router.refresh();
      } else {
        toast.error("Patient save failed", result.message);
      }
    });
  }

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="MRN" error={form.formState.errors.mrn?.message}>
          <Input placeholder="Auto-generated if blank" {...form.register("mrn")} />
        </Field>
        <Field label="Date of birth" error={form.formState.errors.date_of_birth?.message}>
          <Input type="date" {...form.register("date_of_birth")} />
        </Field>
        <Field label="First name" error={form.formState.errors.first_name?.message}>
          <Input autoComplete="given-name" {...form.register("first_name")} />
        </Field>
        <Field label="Last name" error={form.formState.errors.last_name?.message}>
          <Input autoComplete="family-name" {...form.register("last_name")} />
        </Field>
        <Field label="Gender" error={form.formState.errors.gender?.message}>
          <Select
            value={form.watch("gender")}
            onValueChange={(value) => form.setValue("gender", value as (typeof genderOptions)[number], { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {genderOptions.map((gender) => (
                <SelectItem key={gender} value={gender}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Blood group">
          <Select
            value={form.watch("blood_group")}
            onValueChange={(value) => form.setValue("blood_group", value as (typeof bloodGroupOptions)[number], { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              {bloodGroupOptions.map((group) => (
                <SelectItem key={group} value={group}>
                  {group === "unknown" ? "Unknown" : group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Phone" error={form.formState.errors.phone?.message}>
          <Input autoComplete="tel" {...form.register("phone")} />
        </Field>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input autoComplete="email" type="email" {...form.register("email")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Address line 1">
          <Input autoComplete="address-line1" {...form.register("address_line1")} />
        </Field>
        <Field label="Address line 2">
          <Input autoComplete="address-line2" {...form.register("address_line2")} />
        </Field>
        <Field label="City">
          <Input autoComplete="address-level2" {...form.register("city")} />
        </Field>
        <Field label="State">
          <Input autoComplete="address-level1" {...form.register("state")} />
        </Field>
        <Field label="Postal code">
          <Input autoComplete="postal-code" {...form.register("postal_code")} />
        </Field>
        <Field label="Country">
          <Input autoComplete="country-name" {...form.register("country")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Allergies">
          <Textarea placeholder="Medication, food, or environmental allergies" {...form.register("allergies")} />
        </Field>
        <Field label="Chronic conditions">
          <Textarea placeholder="Diabetes, hypertension, asthma..." {...form.register("chronic_conditions")} />
        </Field>
      </div>

      <Field label="Clinical/admin notes">
        <Textarea {...form.register("notes")} />
      </Field>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {mode === "edit" ? "Save patient" : "Register patient"}
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
