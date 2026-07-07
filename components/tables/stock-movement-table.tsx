import { format } from "date-fns";
import type { StockMovementRecord } from "@/lib/services/inventory";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function StockMovementTable({ data }: { data: StockMovementRecord[] }) {
  if (!data.length) {
    return <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No stock movements recorded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Medicine</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((movement) => (
          <TableRow key={movement.id}>
            <TableCell>{format(new Date(movement.movement_date), "MMM d, yyyy h:mm a")}</TableCell>
            <TableCell>{movement.medicine_inventory?.medications?.name ?? movement.inventory_id}</TableCell>
            <TableCell>{movement.medicine_inventory?.batch_no ?? "-"}</TableCell>
            <TableCell><Badge variant="outline">{movement.movement_type}</Badge></TableCell>
            <TableCell className="text-right">{movement.quantity}</TableCell>
            <TableCell>{movement.reference_number ?? "-"}</TableCell>
            <TableCell>{movement.reason ?? "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
