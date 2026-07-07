import { AppointmentForm } from "@/components/forms/appointment-form";
import { PageTitle } from "@/components/layout/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getAppointmentOptions } from "@/lib/services/appointments";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function NewAppointmentPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const options = await getAppointmentOptions(hospitalId);

  return (
    <div className="space-y-6">
      <PageTitle title="New appointment" description="Schedule a visit and assign patient, doctor, and department." />
      <Card>
        <CardHeader>
          <CardTitle>Appointment details</CardTitle>
          <CardDescription>Doctor double-booking is blocked automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentForm hospitalId={hospitalId} actorProfileId={profile?.id} actorRole={profile?.role} options={options} />
        </CardContent>
      </Card>
    </div>
  );
}
