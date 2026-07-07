import type { LabTestRecord } from "@/lib/services/lab";
import { currency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function LabTestTable({ data }: { data: LabTestRecord[] }) {
  if (!data.length) {
    return <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No lab tests have been added yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Test</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Sample</TableHead>
          <TableHead>Reference range</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((test) => (
          <TableRow key={test.id}>
            <TableCell className="font-medium">{test.test_name}</TableCell>
            <TableCell>{test.test_code}</TableCell>
            <TableCell>{test.category ?? "-"}</TableCell>
            <TableCell>{test.sample_type ?? "-"}</TableCell>
            <TableCell>{test.reference_range ?? "-"}</TableCell>
            <TableCell className="text-right">{currency(test.price)}</TableCell>
            <TableCell><Badge variant={test.is_active ? "success" : "secondary"}>{test.is_active ? "active" : "inactive"}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
