import { format } from "date-fns";
import type { InvoiceRecord } from "@/lib/services/billing";
import { currency } from "@/lib/utils";

export function PrintableInvoice({ invoice, hospitalName = "NorthBridge Medical Center" }: { invoice: InvoiceRecord; hospitalName?: string }) {
  const patientName = invoice.patients ? `${invoice.patients.first_name} ${invoice.patients.last_name}` : invoice.patient_id;

  return (
    <section className="rounded-md border bg-white p-6 print:border-0 print:p-0">
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{hospitalName}</h2>
          <p className="text-sm text-muted-foreground">Invoice {invoice.invoice_number}</p>
        </div>
        <div className="text-sm sm:text-right">
          <p>Issued: {invoice.issued_at ? format(new Date(invoice.issued_at), "MMM d, yyyy") : "Draft"}</p>
          <p>Due: {invoice.due_at ? format(new Date(invoice.due_at), "MMM d, yyyy") : "-"}</p>
        </div>
      </div>
      <div className="grid gap-4 border-b py-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Bill to</p>
          <p className="font-medium">{patientName}</p>
          <p>{invoice.patients?.mrn}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-muted-foreground">Status</p>
          <p className="font-medium">{invoice.status.replace("_", " ")}</p>
        </div>
      </div>
      <div className="py-4">
        <div className="grid grid-cols-[1fr_80px_100px_100px] border-b pb-2 text-sm font-medium">
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Price</span>
          <span className="text-right">Total</span>
        </div>
        {(invoice.invoice_items ?? []).map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_80px_100px_100px] border-b py-2 text-sm">
            <span>{item.description}<span className="block text-xs text-muted-foreground">{item.item_type}</span></span>
            <span className="text-right">{item.quantity}</span>
            <span className="text-right">{currency(item.unit_price)}</span>
            <span className="text-right">{currency(item.total_price)}</span>
          </div>
        ))}
      </div>
      <div className="ml-auto grid max-w-sm gap-2 text-sm">
        <Row label="Subtotal" value={currency(invoice.subtotal)} />
        <Row label="Tax" value={currency(invoice.tax_amount)} />
        <Row label="Discount" value={`-${currency(invoice.discount_amount)}`} />
        <Row label="Total" value={currency(invoice.total_amount)} strong />
        <Row label="Paid" value={currency(invoice.amount_paid)} />
        <Row label="Balance due" value={currency(invoice.balance_due)} strong />
      </div>
    </section>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={strong ? "flex justify-between text-base font-semibold" : "flex justify-between"}><span>{label}</span><span>{value}</span></div>;
}
