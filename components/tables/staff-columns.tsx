"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants/rbac";
import type { Profile } from "@/types/database";

export type StaffRow = Profile & { department: string; staff_type: string };

export const staffColumns: ColumnDef<StaffRow>[] = [
  { accessorKey: "full_name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <Badge>{ROLE_LABELS[row.original.role]}</Badge>
  },
  { accessorKey: "department", header: "Department" },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => <Badge variant={row.original.is_active ? "success" : "danger"}>{row.original.is_active ? "Active" : "Inactive"}</Badge>
  }
];
