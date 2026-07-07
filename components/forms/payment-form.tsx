"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { recordPaymentAction } from "@/lib/actions/billing-actions";
import type { InvoiceRecord } from "@/lib/services/billing";
import { paymentMethods, paymentSchema, type PaymentInput } from "@/lib/validations/billing";
import { currency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PaymentForm({
  hospitalId,
  actorProfileId,
  invoices,
  invoiceId
}: {
  hospitalId: string;
  actorProfileId?: string | null;
  invoices: InvoiceRecord[];
  invoiceId?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { invoice_id: invoiceId ?? "", amount: 0, payment_method: "cash", transaction_reference: "", paid_at: "" }
  });
  const selectedInvoice = invoices.find((invoice) => invoice.id === form.watch("invoice_id"));

  function submit(values: PaymentInput) {
    startTransition(async () => {
      const result = await recordPaymentAction(hospitalId, values, actorProfileId);
      setMessage(result.message);
      if (result.ok) {
        form.reset({ invoice_id: invoiceId ?? "", amount: 0, payment_method: "cash", transaction_reference: "", paid_at: "" });
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Invoice">
          <Select value={form.watch("invoice_id")} onValueChange={(value) => form.setValue("invoice_id", value, { shouldValidate: true })} disabled={Boolean(invoiceId)}>
            <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
            <SelectContent>
              {invoices.filter((invoice) => invoice.balance_due > 0 && invoice.status !== "cancelled").map((invoice) => (
                <SelectItem key={invoice.id} value={invoice.id}>{invoice.invoice_number} / {invoice.patients?.last_name ?? "Patient"} / due {currency(invoice.balance_due)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Amount">
          <Input type="number" min={0.01} step="0.01" max={selectedInvoice?.balance_due} {...form.register("amount")} />
        </Field>
        <Field label="Method">
          <Select value={form.watch("payment_method")} onValueChange={(value) => form.setValue("payment_method", value as PaymentInput["payment_method"])}>
            <SelectTrigger><SelectValue placeholder="Payment method" /></SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => <SelectItem key={method} value={method}>{method.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Paid at"><Input type="datetime-local" {...form.register("paid_at")} /></Field>
        <Field label="Reference"><Input placeholder="Receipt, card, insurance, or transfer reference" {...form.register("transaction_reference")} /></Field>
      </div>
      {selectedInvoice ? <p className="text-sm text-muted-foreground">Outstanding balance: {currency(selectedInvoice.balance_due)}</p> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button className="w-fit" type="submit" disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Record payment</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}
