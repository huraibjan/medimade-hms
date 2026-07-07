import { format } from "date-fns";
import { notFound } from "next/navigation";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { PageTitle } from "@/components/layout/page-title";
import { AppointmentStatusActions } from "@/components/appointments/status-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getAppointment, getAppointmentOptions } from "@/lib/services/appointments";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

type PageProps = { params: Promise<{ id: string }> };

export default async function AppointmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [appointment, options] = await Promise.all([
    getAppointment(id, hospitalId),
    getAppointmentOptions(hospitalId)
  ]);
  if (!appointment) notFound();

  const patientName = appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : appointment.patient_id;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Appointment detail"
        description={`${patientName} with ${appointment.doctor?.full_name ?? appointment.doctor_id}`}
        actions={<AppointmentStatusActions appointment={appointment} hospitalId={hospitalId} actorProfileId={profile?.id} />}
      />
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{appointment.reason ?? "Consultation"}</CardTitle>
                <CardDescription>{format(new Date(appointment.scheduled_start), "MMM d, yyyy h:mm a")}</CardDescription>
              </div>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Info label="Patient" value={patientName} />
            <Info label="MRN" value={appointment.patient?.mrn ?? "Not recorded"} />
            <Info label="Phone" value={appointment.patient?.phone ?? "Not recorded"} />
            <Info label="Doctor" value={appointment.doctor?.full_name ?? appointment.doctor_id} />
            <Info label="Department" value={appointment.department?.name ?? "Unassigned"} />
            <Info label="Clinical encounter" value={appointment.clinical_encounters?.[0]?.id ?? "Not linked yet"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Edit appointment</CardTitle>
            <CardDescription>Adjust appointment details while preserving scheduling validation.</CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentForm
              hospitalId={hospitalId}
              actorProfileId={profile?.id}
              actorRole={profile?.role}
              options={options}
              appointment={appointment}
              mode="edit"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
