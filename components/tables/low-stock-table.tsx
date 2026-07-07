import type { InventoryBatchRecord } from "@/lib/services/inventory";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function LowStockTable({ data }: { data: InventoryBatchRecord[] }) {
  if (!data.length) {
    return <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No low-stock medicines right now.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Medicine</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead className="text-right">On hand</TableHead>
          <TableHead className="text-right">Reorder</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((batch) => (
          <TableRow key={batch.id}>
            <TableCell>{batch.medications?.name ?? batch.sku}</TableCell>
            <TableCell>{batch.batch_no}</TableCell>
            <TableCell className="text-right">{batch.quantity_on_hand}</TableCell>
            <TableCell className="text-right">{batch.reorder_level}</TableCell>
            <TableCell><Badge variant="danger">low stock</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
