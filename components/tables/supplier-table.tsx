import type { SupplierRecord } from "@/lib/services/suppliers";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SupplierTable({ data }: { data: SupplierRecord[] }) {
  if (!data.length) {
    return <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No suppliers have been added yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((supplier) => (
          <TableRow key={supplier.id}>
            <TableCell className="font-medium">{supplier.name}</TableCell>
            <TableCell>{supplier.contact_person ?? "-"}</TableCell>
            <TableCell>{supplier.phone ?? "-"}</TableCell>
            <TableCell>{supplier.email ?? "-"}</TableCell>
            <TableCell><Badge variant={supplier.is_active ? "success" : "secondary"}>{supplier.is_active ? "active" : "inactive"}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
