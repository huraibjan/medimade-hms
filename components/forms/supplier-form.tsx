"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createSupplierAction } from "@/lib/actions/inventory-actions";
import { supplierSchema, type SupplierInput } from "@/lib/validations/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SupplierForm({ hospitalId }: { hospitalId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<SupplierInput>({ resolver: zodResolver(supplierSchema), defaultValues: { name: "", contact_person: "", phone: "", email: "", address: "", is_active: true } });

  function submit(values: SupplierInput) {
    startTransition(async () => {
      const result = await createSupplierAction(hospitalId, values);
      setMessage(result.message);
      if (result.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Supplier name"><Input {...form.register("name")} /></Field>
        <Field label="Contact person"><Input {...form.register("contact_person")} /></Field>
        <Field label="Phone"><Input {...form.register("phone")} /></Field>
        <Field label="Email"><Input type="email" {...form.register("email")} /></Field>
      </div>
      <Field label="Address"><Textarea {...form.register("address")} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("is_active")} /> Active supplier</label>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" disabled={isPending} type="submit">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Add supplier</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
