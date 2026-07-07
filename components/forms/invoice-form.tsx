"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createInvoiceAction } from "@/lib/actions/billing-actions";
import type { BillingLinkRecord, BillingPatientSummary } from "@/lib/services/billing";
import { invoiceSchema, type InvoiceInput } from "@/lib/validations/billing";
import { currency } from "@/lib/utils";
import { InvoiceItemsEditor } from "@/components/forms/invoice-items-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function InvoiceForm({
  hospitalId,
  actorProfileId,
  patients,
  admissions,
  appointments
}: {
  hospitalId: string;
  actorProfileId?: string | null;
  patients: BillingPatientSummary[];
  admissions: BillingLinkRecord[];
  appointments: BillingLinkRecord[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      patient_id: "",
      admission_id: "",
      appointment_id: "",
      status: "draft",
      issued_at: "",
      due_at: "",
      tax_amount: 0,
      discount_amount: 0,
      items: [{ item_type: "service", description: "", quantity: 1, unit_price: 0 }]
    }
  });
  const selectedPatientId = form.watch("patient_id");
  const items = form.watch("items");
  const tax = Number(form.watch("tax_amount") || 0);
  const discount = Number(form.watch("discount_amount") || 0);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0), [items]);
  const total = Math.max(subtotal + tax - discount, 0);
  const patientAdmissions = admissions.filter((admission) => admission.patient_id === selectedPatientId);
  const patientAppointments = appointments.filter((appointment) => appointment.patient_id === selectedPatientId);

  function submit(values: InvoiceInput) {
    startTransition(async () => {
      const result = await createInvoiceAction(hospitalId, values, actorProfileId);
      setMessage(result.message);
      if (result.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Patient">
          <Select value={selectedPatientId} onValueChange={(value) => form.setValue("patient_id", value, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
            <SelectContent>
              {patients.map((patient) => <SelectItem key={patient.id} value={patient.id}>{patient.last_name}, {patient.first_name} / {patient.mrn}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as InvoiceInput["status"])}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Admission">
          <Select value={form.watch("admission_id")} onValueChange={(value) => form.setValue("admission_id", value)}>
            <SelectTrigger><SelectValue placeholder="Link admission" /></SelectTrigger>
            <SelectContent>
              {patientAdmissions.map((admission) => <SelectItem key={admission.id} value={admission.id}>{admission.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Appointment">
          <Select value={form.watch("appointment_id")} onValueChange={(value) => form.setValue("appointment_id", value)}>
            <SelectTrigger><SelectValue placeholder="Link appointment" /></SelectTrigger>
            <SelectContent>
              {patientAppointments.map((appointment) => <SelectItem key={appointment.id} value={appointment.id}>{appointment.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Issued at"><Input type="datetime-local" {...form.register("issued_at")} /></Field>
        <Field label="Due at"><Input type="datetime-local" {...form.register("due_at")} /></Field>
      </div>
      <InvoiceItemsEditor items={items} onChange={(nextItems) => form.setValue("items", nextItems, { shouldValidate: true })} />
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Tax"><Input type="number" min={0} step="0.01" {...form.register("tax_amount")} /></Field>
        <Field label="Discount"><Input type="number" min={0} step="0.01" {...form.register("discount_amount")} /></Field>
        <div className="rounded-md border p-3 text-sm">
          <p className="text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold">{currency(total)}</p>
        </div>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" type="submit" disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Create invoice</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
