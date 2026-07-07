"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { currency } from "@/lib/utils";
import type { Invoice } from "@/types/database";

export const invoiceColumns: ColumnDef<Invoice>[] = [
  { accessorKey: "invoice_number", header: "Invoice" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant={row.original.status === "paid" ? "success" : "warning"}>{row.original.status}</Badge>
  },
  { accessorKey: "total_amount", header: "Total", cell: ({ row }) => currency(row.original.total_amount) },
  { accessorKey: "subtotal", header: "Subtotal", cell: ({ row }) => currency(row.original.subtotal) },
  {
    accessorKey: "issued_at",
    header: "Issued",
    cell: ({ row }) => row.original.issued_at ? format(new Date(row.original.issued_at), "MMM d, yyyy") : "Draft"
  }
];
