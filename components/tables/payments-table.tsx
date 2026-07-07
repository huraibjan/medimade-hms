import { format } from "date-fns";
import type { PaymentRecord } from "@/lib/services/billing";
import { currency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PaymentsTable({ data }: { data: PaymentRecord[] }) {
  if (!data.length) {
    return <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No payments have been recorded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>{payment.paid_at ? format(new Date(payment.paid_at), "MMM d, yyyy h:mm a") : "-"}</TableCell>
            <TableCell className="font-medium">{payment.invoices?.invoice_number ?? payment.invoice_id}</TableCell>
            <TableCell>{payment.invoices?.patients ? `${payment.invoices.patients.first_name} ${payment.invoices.patients.last_name}` : "-"}</TableCell>
            <TableCell>{payment.payment_method.replace("_", " ")}</TableCell>
            <TableCell>{payment.transaction_reference ?? "-"}</TableCell>
            <TableCell><Badge variant={payment.payment_status === "completed" ? "success" : "secondary"}>{payment.payment_status}</Badge></TableCell>
            <TableCell className="text-right">{currency(payment.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
