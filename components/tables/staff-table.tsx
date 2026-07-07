"use client";

import { DataTable } from "./data-table";
import { staffColumns, type StaffRow } from "./staff-columns";

export function StaffTable({ data }: { data: StaffRow[] }) {
  return <DataTable columns={staffColumns} data={data} searchPlaceholder="Search staff..." />;
}
