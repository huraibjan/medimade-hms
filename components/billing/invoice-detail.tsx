import { updateInvoiceStatusAction } from "@/lib/actions/billing-actions";
import type { InvoiceRecord } from "@/lib/services/billing";
import type { InvoiceStatus } from "@/types/database";
import { PaymentForm } from "@/components/forms/payment-form";
import { PrintableInvoice } from "@/components/billing/printable-invoice";
import { InvoiceStatusBadge } from "@/components/tables/invoices-table";
import { PaymentsTable } from "@/components/tables/payments-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InvoiceDetail({
  invoice,
  invoices,
  hospitalId,
  actorProfileId,
  hospitalName
}: {
  invoice: InvoiceRecord;
  invoices: InvoiceRecord[];
  hospitalId: string;
  actorProfileId?: string | null;
  hospitalName?: string;
}) {
  async function updateStatus(formData: FormData) {
    "use server";
    const status = formData.get("status") as InvoiceStatus;
    await updateInvoiceStatusAction(invoice.id, hospitalId, { status }, actorProfileId);
  }

  return (
    <div className="space-y-6">
      <Card className="print:hidden">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{invoice.invoice_number}</CardTitle>
              <CardDescription>{invoice.patients ? `${invoice.patients.first_name} ${invoice.patients.last_name}` : invoice.patient_id} / {invoice.patients?.mrn}</CardDescription>
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </CardHeader>
        <CardContent>
          <form action={updateStatus} className="flex flex-wrap gap-2">
            {(["draft", "issued", "cancelled"] as InvoiceStatus[]).map((status) => (
              <Button key={status} size="sm" variant={status === "cancelled" ? "outline" : "default"} name="status" value={status} disabled={invoice.status === status || invoice.status === "paid"}>
                {status}
              </Button>
            ))}
          </form>
        </CardContent>
      </Card>
      <PrintableInvoice invoice={invoice} hospitalName={hospitalName} />
      <div className="grid gap-4 lg:grid-cols-2 print:hidden">
        <Card>
          <CardHeader>
            <CardTitle>Record payment</CardTitle>
            <CardDescription>Partial payments update balance; full payments mark the invoice paid.</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm hospitalId={hospitalId} actorProfileId={actorProfileId} invoices={invoices} invoiceId={invoice.id} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment history</CardTitle>
            <CardDescription>Completed, pending, and reference-tracked payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentsTable data={invoice.payments ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
