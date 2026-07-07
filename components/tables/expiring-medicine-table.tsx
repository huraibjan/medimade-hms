import { format } from "date-fns";
import type { InventoryBatchRecord } from "@/lib/services/inventory";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ExpiringMedicineTable({ data }: { data: InventoryBatchRecord[] }) {
  if (!data.length) {
    return <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No medicines expire within the next 60 days.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Medicine</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((batch) => (
          <TableRow key={batch.id}>
            <TableCell>{batch.medications?.name ?? batch.sku}</TableCell>
            <TableCell>{batch.batch_no}</TableCell>
            <TableCell>{format(new Date(batch.expiry_date), "MMM d, yyyy")}</TableCell>
            <TableCell className="text-right">{batch.quantity_on_hand}</TableCell>
            <TableCell><Badge variant="warning">expiring soon</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
