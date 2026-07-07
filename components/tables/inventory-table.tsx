"use client";

import { format, differenceInCalendarDays } from "date-fns";
import type { InventoryBatchRecord } from "@/lib/services/inventory";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currency } from "@/lib/utils";

export function InventoryTable({ data }: { data: InventoryBatchRecord[] }) {
  if (!data.length) {
    return <EmptyState title="No inventory batches" description="Receive a medicine batch to begin tracking stock, expiry, and reorder levels." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Medicine</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead className="text-right">On hand</TableHead>
          <TableHead className="text-right">Reorder</TableHead>
          <TableHead className="text-right">Cost</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead>Supplier</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((batch) => {
          const low = batch.quantity_on_hand <= batch.reorder_level;
          const expiring = differenceInCalendarDays(new Date(batch.expiry_date), new Date()) <= 60;
          return (
            <TableRow key={batch.id}>
              <TableCell className="font-medium">{batch.medications?.name ?? batch.medication_id}</TableCell>
              <TableCell>
                {batch.batch_no}
                <p className="text-xs text-muted-foreground">{batch.sku}</p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {format(new Date(batch.expiry_date), "MMM d, yyyy")}
                  {expiring ? <Badge variant="warning">expiring</Badge> : null}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {batch.quantity_on_hand}
                  {low ? <Badge variant="danger">low</Badge> : null}
                </div>
              </TableCell>
              <TableCell className="text-right">{batch.reorder_level}</TableCell>
              <TableCell className="text-right">{currency(batch.unit_cost)}</TableCell>
              <TableCell className="text-right">{currency(batch.selling_price)}</TableCell>
              <TableCell>{batch.suppliers?.name ?? "Not set"}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
