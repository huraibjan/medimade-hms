import { AdmissionForm } from "@/components/forms/admission-form";
import { PageTitle } from "@/components/layout/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getAdmissionOptions } from "@/lib/services/admissions";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function NewAdmissionPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const options = await getAdmissionOptions(hospitalId);

  return (
    <div className="space-y-6">
      <PageTitle title="New admission" description="Create an inpatient admission and optionally assign an available bed." />
      <Card>
        <CardHeader>
          <CardTitle>Admission details</CardTitle>
          <CardDescription>Patients can only be assigned to beds that are currently available.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdmissionForm hospitalId={hospitalId} actorProfileId={profile?.id} options={options} />
        </CardContent>
      </Card>
    </div>
  );
}
