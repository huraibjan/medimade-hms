import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/page-title";
import { PatientTimeline } from "@/components/patients/patient-timeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getPatientProfile } from "@/lib/services/patients";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

type PageProps = { params: Promise<{ id: string }> };

export default async function PatientTimelinePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const data = await getPatientProfile(id, profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageTitle title="Clinical timeline" description={`${data.patient.first_name} ${data.patient.last_name} - ${data.patient.mrn}`} />
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Admissions, appointments, prescriptions, lab orders, and invoices in chronological order.</CardDescription>
        </CardHeader>
        <CardContent>
          <PatientTimeline events={data.timeline} />
        </CardContent>
      </Card>
    </div>
  );
}
