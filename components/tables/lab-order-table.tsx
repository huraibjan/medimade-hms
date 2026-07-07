"use client";

import { format } from "date-fns";
import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { LabOrderRecord } from "@/lib/services/lab";
import type { LabOrderStatus } from "@/types/database";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusOptions: Array<LabOrderStatus | "all" | "critical"> = ["all", "ordered", "sample_collected", "processing", "completed", "cancelled", "critical"];

export function LabOrderTable({ data }: { data: LabOrderRecord[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LabOrderStatus | "all" | "critical">("all");
  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return data.filter((order) => {
      const patientName = `${order.patients?.first_name ?? ""} ${order.patients?.last_name ?? ""}`;
      const doctorName = order.doctors?.staff?.profiles?.full_name ?? "";
      const hasCritical = (order.lab_order_items ?? []).some((item) => item.result_status === "critical");
      const matchesStatus = status === "all" || (status === "critical" ? hasCritical : order.status === status);
      const haystack = [order.id, order.patients?.mrn, patientName, doctorName, order.status, order.priority].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && haystack.includes(needle);
    });
  }, [data, query, status]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient, MRN, order, doctor..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as LabOrderStatus | "all" | "critical")}>
          <SelectTrigger className="md:w-56"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => <SelectItem key={option} value={option}>{option.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {!filtered.length ? (
        <EmptyState title="No lab orders found" description="Adjust the search or status filter to find matching orders." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Tests</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Ordered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => {
              const critical = (order.lab_order_items ?? []).some((item) => item.result_status === "critical");
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    {order.patients ? `${order.patients.first_name} ${order.patients.last_name}` : order.patient_id}
                    <p className="text-xs text-muted-foreground">{order.patients?.mrn}</p>
                  </TableCell>
                  <TableCell>{order.doctors?.staff?.profiles?.full_name ?? "-"}</TableCell>
                  <TableCell>{order.lab_order_items?.length ?? 0}</TableCell>
                  <TableCell><Badge variant={critical ? "danger" : order.status === "completed" ? "success" : "secondary"}>{critical ? "critical" : order.status}</Badge></TableCell>
                  <TableCell><Badge variant={order.priority === "stat" ? "danger" : order.priority === "urgent" ? "warning" : "outline"}>{order.priority}</Badge></TableCell>
                  <TableCell>{format(new Date(order.ordered_at), "MMM d, h:mm a")}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" asChild><Link href={`/lab/orders/${order.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
