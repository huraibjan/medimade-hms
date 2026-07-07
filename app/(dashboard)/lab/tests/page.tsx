import { LabTestForm } from "@/components/forms/lab-test-form";
import { PageTitle } from "@/components/layout/page-title";
import { LabTestTable } from "@/components/tables/lab-test-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listLabTests } from "@/lib/services/lab";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function LabTestsPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const tests = await listLabTests(hospitalId);

  return (
    <div className="space-y-6">
      <PageTitle title="Lab tests" description="Manage the laboratory test catalog, sample requirements, reference ranges, and pricing." />
      <Card>
        <CardHeader>
          <CardTitle>Add lab test</CardTitle>
          <CardDescription>Create catalog entries used by lab orders and patient timelines.</CardDescription>
        </CardHeader>
        <CardContent>
          <LabTestForm hospitalId={hospitalId} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Test catalog</CardTitle>
          <CardDescription>Available tests, categories, reference ranges, and sample types.</CardDescription>
        </CardHeader>
        <CardContent>
          <LabTestTable data={tests} />
        </CardContent>
      </Card>
    </div>
  );
}
