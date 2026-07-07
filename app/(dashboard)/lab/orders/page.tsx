import { LabOrderForm } from "@/components/forms/lab-order-form";
import { CriticalResultsCard } from "@/components/lab/critical-results-card";
import { PageTitle } from "@/components/layout/page-title";
import { LabOrderTable } from "@/components/tables/lab-order-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listCriticalResults, listLabOrders, listLabPatients, listLabTechnicians, listLabTests, listOrderingDoctors } from "@/lib/services/lab";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function LabOrdersPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [orders, tests, patients, technicians, doctors, critical] = await Promise.all([
    listLabOrders(hospitalId),
    listLabTests(hospitalId),
    listLabPatients(hospitalId),
    listLabTechnicians(hospitalId),
    listOrderingDoctors(hospitalId),
    listCriticalResults(hospitalId)
  ]);

  return (
    <div className="space-y-6">
      <PageTitle title="Lab orders" description="Create multi-test orders, assign technicians, and manage order workflow." />
      <Card>
        <CardHeader>
          <CardTitle>Create lab order</CardTitle>
          <CardDescription>Add multiple tests to a single order and link it to a patient, doctor, and optional encounter.</CardDescription>
        </CardHeader>
        <CardContent>
          <LabOrderForm hospitalId={hospitalId} actorProfileId={profile?.id} patients={patients} tests={tests} technicians={technicians} doctors={doctors} />
        </CardContent>
      </Card>
      <CriticalResultsCard results={critical} />
      <Card>
        <CardHeader>
          <CardTitle>Order queue</CardTitle>
          <CardDescription>Filter pending, completed, and critical work from the laboratory queue.</CardDescription>
        </CardHeader>
        <CardContent>
          <LabOrderTable data={orders} />
        </CardContent>
      </Card>
    </div>
  );
}
