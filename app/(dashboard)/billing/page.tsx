import { FilePlus2, Receipt } from "lucide-react";
import { BillingSummaryCards } from "@/components/billing/billing-summary-cards";
import { PageTitle } from "@/components/layout/page-title";
import { RoleActionButton } from "@/components/layout/role-action-button";
import { InvoicesTable } from "@/components/tables/invoices-table";
import { PaymentsTable } from "@/components/tables/payments-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getBillingSummary, listInvoices, listPayments } from "@/lib/services/billing";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function BillingPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [summary, invoices, payments] = await Promise.all([
    getBillingSummary(hospitalId),
    listInvoices(hospitalId),
    listPayments(hospitalId)
  ]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Billing"
        description="Invoices, itemized charges, partial payments, full payments, and account balances."
        actions={
          <>
            <RoleActionButton role={profile?.role} permission="billing:manage" href="/billing/payments" icon={Receipt} variant="outline">
              Record payment
            </RoleActionButton>
            <RoleActionButton role={profile?.role} permission="billing:manage" href="/billing/invoices" icon={FilePlus2}>
              Create invoice
            </RoleActionButton>
          </>
        }
      />
      <BillingSummaryCards summary={summary} />
      <Card>
        <CardHeader>
          <CardTitle>Accounts receivable</CardTitle>
          <CardDescription>Search by patient, MRN, invoice number, and filter by invoice status.</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesTable data={invoices} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent payments</CardTitle>
          <CardDescription>Payment history across patient accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentsTable data={payments.slice(0, 8)} />
        </CardContent>
      </Card>
    </div>
  );
}
