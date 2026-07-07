import { InvoiceForm } from "@/components/forms/invoice-form";
import { PageTitle } from "@/components/layout/page-title";
import { InvoicesTable } from "@/components/tables/invoices-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listBillingAdmissions, listBillingAppointments, listBillingPatients, listInvoices } from "@/lib/services/billing";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function InvoicesPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [invoices, patients, admissions, appointments] = await Promise.all([
    listInvoices(hospitalId),
    listBillingPatients(hospitalId),
    listBillingAdmissions(hospitalId),
    listBillingAppointments(hospitalId)
  ]);

  return (
    <div className="space-y-6">
      <PageTitle title="Invoices" description="Create itemized patient invoices and monitor account balances." />
      <Card>
        <CardHeader>
          <CardTitle>Create invoice</CardTitle>
          <CardDescription>Add service, room, lab, medication, consultation, and procedure charges.</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceForm hospitalId={hospitalId} actorProfileId={profile?.id} patients={patients} admissions={admissions} appointments={appointments} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Invoice registry</CardTitle>
          <CardDescription>Draft, issued, partially paid, paid, and cancelled invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesTable data={invoices} />
        </CardContent>
      </Card>
    </div>
  );
}
