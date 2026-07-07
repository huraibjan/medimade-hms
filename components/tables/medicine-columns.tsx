"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { Medication } from "@/types/database";

export const medicineColumns: ColumnDef<Medication>[] = [
  { accessorKey: "sku", header: "SKU" },
  { accessorKey: "name", header: "Medicine" },
  { accessorKey: "generic_name", header: "Generic" },
  { accessorKey: "dosage_form", header: "Form" },
  { accessorKey: "strength", header: "Strength" },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => <Badge variant={row.original.is_active ? "success" : "secondary"}>{row.original.is_active ? "Active" : "Inactive"}</Badge>
  }
];
