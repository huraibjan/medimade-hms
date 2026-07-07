import { format } from "date-fns";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/page-title";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getPatientProfile } from "@/lib/services/patients";
import { currency } from "@/lib/utils";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

type PageProps = { params: Promise<{ id: string }> };

export default async function PatientBillingPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const data = await getPatientProfile(id, profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageTitle title="Invoice history" description={`${data.patient.first_name} ${data.patient.last_name} - ${data.patient.mrn}`} />
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Invoices, insurance billing context, payments, adjustments, and balances.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.invoices.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.issued_at ? format(new Date(invoice.issued_at), "MMM d, yyyy") : "Draft"}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === "paid" ? "success" : "warning"}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{currency(invoice.total_amount ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No invoices recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
