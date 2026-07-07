import { CalendarPlus } from "lucide-react";
import { DoctorScheduleCalendar } from "@/components/appointments/doctor-schedule-calendar";
import { PageTitle } from "@/components/layout/page-title";
import { RoleActionButton } from "@/components/layout/role-action-button";
import { AppointmentsTable } from "@/components/tables/appointments-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listAppointments } from "@/lib/services/appointments";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function AppointmentsPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const appointments = await listAppointments(hospitalId, profile?.role, profile?.id);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Appointments"
        description="Scheduling, check-in, doctor assignment, and visit workflow."
        actions={
          <RoleActionButton role={profile?.role} permission="appointments:manage" href="/appointments/new" icon={CalendarPlus}>
            Schedule
          </RoleActionButton>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Daily doctor schedule</CardTitle>
          <CardDescription>Calendar-style view of today’s appointments grouped by doctor.</CardDescription>
        </CardHeader>
        <CardContent>
          <DoctorScheduleCalendar appointments={appointments} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Appointment table</CardTitle>
          <CardDescription>Filter by doctor, department, date, and status.</CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentsTable data={appointments} hospitalId={hospitalId} actorProfileId={profile?.id} />
        </CardContent>
      </Card>
    </div>
  );
}
