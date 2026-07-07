"use client";

import { format } from "date-fns";
import { Eye } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { AdmissionRecord } from "@/lib/services/admissions";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function statusVariant(status: string) {
  if (status === "discharged") return "success";
  if (status === "cancelled") return "danger";
  if (status === "transferred") return "warning";
  return "outline";
}

export function AdmissionsTable({ data }: { data: AdmissionRecord[] }) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Admitted</TableHead>
            <TableHead>Bed</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length ? data.map((admission) => {
            const activeAllocation = admission.bed_allocations?.find((allocation) => !allocation.released_at);
            return (
              <TableRow key={admission.id}>
                <TableCell>
                  <p className="font-medium">{admission.patient ? `${admission.patient.first_name} ${admission.patient.last_name}` : admission.patient_id}</p>
                  <p className="text-xs text-muted-foreground">{admission.patient?.mrn}</p>
                </TableCell>
                <TableCell>{admission.reason}</TableCell>
                <TableCell>{format(new Date(admission.admission_datetime ?? admission.created_at), "MMM d, yyyy h:mm a")}</TableCell>
                <TableCell>{activeAllocation?.beds?.bed_number ?? activeAllocation?.bed_id ?? "Unassigned"}</TableCell>
                <TableCell><Badge variant={statusVariant(admission.status)}>{admission.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="icon" aria-label="View admission">
                    <Link href={`/admissions/${admission.id}` as Route}><Eye className="h-4 w-4" /></Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          }) : (
            <TableRow>
              <TableCell colSpan={6} className="p-6">
                <EmptyState title="No admissions found" description="New admissions and bed allocations will appear here." />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
