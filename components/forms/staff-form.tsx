"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createStaffAction, updateStaffAction } from "@/lib/actions/staff-actions";
import { ROLE_LABELS } from "@/lib/constants/rbac";
import type { StaffRecord } from "@/lib/services/staff";
import { toast } from "@/lib/toast";
import { staffSchema, type StaffInput } from "@/lib/validations/staff";
import { roles, type Role } from "@/types/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function StaffForm({
  staff,
  mode = "create"
}: {
  staff?: StaffRecord;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<StaffInput>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      full_name: staff?.profiles?.full_name ?? "",
      email: staff?.profiles?.email ?? "",
      role: (staff?.profiles?.role as Role | undefined) ?? "receptionist",
      department_id: staff?.department_id ?? "",
      phone: staff?.phone ?? staff?.profiles?.phone ?? ""
    }
  });

  function submit(values: StaffInput) {
    startTransition(async () => {
      const result =
        mode === "edit" && staff
          ? await updateStaffAction(staff.id, values)
          : await createStaffAction(values);
      setMessage(result.message);
      if (result.ok) {
        toast.success(mode === "edit" ? "Staff updated" : "Staff created", result.message);
        if (mode === "create") form.reset();
        router.refresh();
      } else {
        toast.error("Staff save failed", result.message);
      }
    });
  }

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={form.formState.errors.full_name?.message}>
          <Input autoComplete="name" {...form.register("full_name")} />
        </Field>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input autoComplete="email" type="email" {...form.register("email")} />
        </Field>
        <Field label="Phone" error={form.formState.errors.phone?.message}>
          <Input autoComplete="tel" {...form.register("phone")} />
        </Field>
        <Field label="Role" error={form.formState.errors.role?.message}>
          <Select value={form.watch("role")} onValueChange={(value) => form.setValue("role", value as Role, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {roles.filter((role) => role !== "super_admin").map((role) => (
                <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Department ID" error={form.formState.errors.department_id?.message}>
          <Input placeholder="Optional department UUID" {...form.register("department_id")} />
        </Field>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {mode === "edit" ? "Save staff member" : "Create staff member"}
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
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
