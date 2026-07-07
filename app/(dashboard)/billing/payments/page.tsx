import { PaymentForm } from "@/components/forms/payment-form";
import { PageTitle } from "@/components/layout/page-title";
import { PaymentsTable } from "@/components/tables/payments-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listInvoices, listPayments } from "@/lib/services/billing";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function PaymentsPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [invoices, payments] = await Promise.all([
    listInvoices(hospitalId),
    listPayments(hospitalId)
  ]);

  return (
    <div className="space-y-6">
      <PageTitle title="Payments" description="Record partial and full payments without exceeding outstanding balances." />
      <Card>
        <CardHeader>
          <CardTitle>Record payment</CardTitle>
          <CardDescription>Cash, card, bank transfer, insurance, and online payments are supported.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentForm hospitalId={hospitalId} actorProfileId={profile?.id} invoices={invoices} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>Completed payment records with invoice and patient context.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentsTable data={payments} />
        </CardContent>
      </Card>
    </div>
  );
}
