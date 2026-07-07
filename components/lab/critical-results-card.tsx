import Link from "next/link";
import type { LabOrderItemRecord } from "@/lib/services/lab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CriticalResultsCard({ results }: { results: LabOrderItemRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Critical results</CardTitle>
        <CardDescription>Results that require immediate clinical review.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!results.length ? (
          <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No critical lab results right now.</p>
        ) : (
          results.slice(0, 6).map((result) => (
            <div key={result.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{result.lab_tests?.test_name ?? result.lab_test_id}</p>
                <p className="text-sm text-muted-foreground">{result.result_value ?? "No value"} {result.result_unit ?? ""} / {result.reference_range ?? result.lab_tests?.reference_range ?? "No range"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="danger">critical</Badge>
                <Button size="sm" variant="outline" asChild><Link href={`/lab/orders/${result.lab_order_id}`}>Review</Link></Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
