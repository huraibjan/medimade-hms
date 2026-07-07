import { format } from "date-fns";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/page-title";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getPatientProfile } from "@/lib/services/patients";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

type PageProps = { params: Promise<{ id: string }> };

export default async function PatientAppointmentsPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const data = await getPatientProfile(id, profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageTitle title="Appointment history" description={`${data.patient.first_name} ${data.patient.last_name} - ${data.patient.mrn}`} />
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>Scheduled, completed, cancelled, and no-show visits.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.appointments.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{format(new Date(appointment.scheduled_start ?? new Date()), "MMM d, yyyy h:mm a")}</TableCell>
                    <TableCell>{appointment.reason ?? "Consultation"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{appointment.status?.replaceAll("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>{appointment.notes ?? "No notes"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No appointments recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
