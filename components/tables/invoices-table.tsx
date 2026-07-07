"use client";

import { format } from "date-fns";
import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { InvoiceRecord } from "@/lib/services/billing";
import type { InvoiceStatus } from "@/types/database";
import { currency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusOptions: Array<InvoiceStatus | "all"> = ["all", "draft", "issued", "partially_paid", "paid", "cancelled"];

export function InvoicesTable({ data }: { data: InvoiceRecord[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");
  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return data.filter((invoice) => {
      const patientName = `${invoice.patients?.first_name ?? ""} ${invoice.patients?.last_name ?? ""}`;
      const haystack = [invoice.invoice_number, invoice.patients?.mrn, patientName, invoice.status].filter(Boolean).join(" ").toLowerCase();
      return (status === "all" || invoice.status === status) && haystack.includes(needle);
    });
  }, [data, query, status]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient, MRN, invoice number..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as InvoiceStatus | "all")}>
          <SelectTrigger className="md:w-56"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => <SelectItem key={option} value={option}>{option.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {!filtered.length ? (
        <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No invoices match the current filters.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                <TableCell>
                  {invoice.patients ? `${invoice.patients.first_name} ${invoice.patients.last_name}` : invoice.patient_id}
                  <p className="text-xs text-muted-foreground">{invoice.patients?.mrn}</p>
                </TableCell>
                <TableCell><InvoiceStatusBadge status={invoice.status} /></TableCell>
                <TableCell className="text-right">{currency(invoice.total_amount)}</TableCell>
                <TableCell className="text-right">{currency(invoice.amount_paid)}</TableCell>
                <TableCell className="text-right">{currency(invoice.balance_due)}</TableCell>
                <TableCell>{invoice.issued_at ? format(new Date(invoice.issued_at), "MMM d, yyyy") : "Draft"}</TableCell>
                <TableCell className="text-right"><Button size="sm" variant="outline" asChild><Link href={`/billing/invoices/${invoice.id}`}>Open</Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const variant = status === "paid" ? "success" : status === "partially_paid" ? "warning" : status === "cancelled" ? "danger" : "secondary";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}
