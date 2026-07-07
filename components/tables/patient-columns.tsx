"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { PatientRecord } from "@/lib/services/patient-service";

export const patientColumns: ColumnDef<PatientRecord>[] = [
  {
    accessorKey: "mrn",
    header: "MRN"
  },
  {
    header: "Patient",
    cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`
  },
  {
    accessorKey: "gender",
    header: "Gender"
  },
  {
    accessorKey: "phone",
    header: "Phone"
  },
  {
    accessorKey: "computed_status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.computed_status ?? "active";
      return <Badge variant={status === "admitted" ? "warning" : status === "inactive" ? "danger" : "success"}>{status}</Badge>;
    }
  },
  {
    accessorKey: "created_at",
    header: "Registered",
    cell: ({ row }) => format(new Date(row.original.created_at), "MMM d, yyyy")
  }
];
