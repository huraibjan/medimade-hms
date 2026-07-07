import { Activity, CalendarCheck, CalendarX, ClipboardList, UserPlus, Users } from "lucide-react";
import { AdmissionsChart } from "@/components/charts/admissions-chart";
import { AppointmentsByDepartmentChart } from "@/components/charts/appointments-by-department-chart";
import { AppointmentStatusChart } from "@/components/charts/appointment-status-chart";
import { PatientRegistrationsChart } from "@/components/charts/patient-registrations-chart";
import { StatCard } from "@/components/cards/stat-card";
import { DateRangePicker } from "@/components/filters/date-range-picker";
import { PageTitle } from "@/components/layout/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getReportsAnalytics } from "@/lib/services/reports";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function PatientReportPage() {
  const profile = await getCurrentProfile();
  const analytics = await getReportsAnalytics(profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);
  const stats = analytics.stats;

  return (
    <div className="space-y-6">
      <PageTitle title="Patients report" description="Registrations, admissions, discharge trends, and appointment utilization." actions={<DateRangePicker />} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} title="Total patients" value={stats.totalPatients} detail="Registered patients" tone="primary" />
        <StatCard icon={UserPlus} title="New this month" value={stats.newPatientsThisMonth} detail="Month-to-date registrations" tone="success" />
        <StatCard icon={Activity} title="Active admissions" value={stats.activeAdmissions} detail="Currently admitted/transferred" />
        <StatCard icon={ClipboardList} title="Discharged this month" value={stats.dischargedThisMonth} detail="Completed inpatient care" />
        <StatCard icon={CalendarCheck} title="Completed appointments" value={stats.completedAppointments} detail="Completed visits" tone="success" />
        <StatCard icon={CalendarX} title="Cancelled appointments" value={stats.cancelledAppointments} detail="Cancelled visits" tone="danger" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Patient registrations by month</CardTitle>
            <CardDescription>New patient records over the last six months.</CardDescription>
          </CardHeader>
          <CardContent>
            <PatientRegistrationsChart data={analytics.charts.patientRegistrationsByMonth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Admissions over time</CardTitle>
            <CardDescription>Admission and discharge trend by month.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdmissionsChart data={analytics.charts.admissionsOverTime} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appointments by department</CardTitle>
            <CardDescription>Scheduled, completed, and cancelled visits by department.</CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentsByDepartmentChart data={analytics.charts.appointmentsByDepartment} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appointment status mix</CardTitle>
            <CardDescription>Appointment status distribution.</CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentStatusChart data={analytics.charts.appointmentStatuses} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
