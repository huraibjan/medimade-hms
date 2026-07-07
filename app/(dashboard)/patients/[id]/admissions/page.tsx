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

export default async function PatientAdmissionsPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const data = await getPatientProfile(id, profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageTitle title="Admission history" description={`${data.patient.first_name} ${data.patient.last_name} - ${data.patient.mrn}`} />
      <Card>
        <CardHeader>
          <CardTitle>Admissions</CardTitle>
          <CardDescription>Admission history, bed allocation context, transfers, and discharge records.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.admissions.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Diagnosis summary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Discharged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.admissions.map((admission) => (
                  <TableRow key={admission.id}>
                    <TableCell>{format(new Date(admission.admission_datetime ?? admission.created_at ?? new Date()), "MMM d, yyyy h:mm a")}</TableCell>
                    <TableCell>{admission.reason ?? "Not recorded"}</TableCell>
                    <TableCell>{admission.diagnosis_summary ?? "Not recorded"}</TableCell>
                    <TableCell>
                      <Badge variant={admission.status === "admitted" ? "warning" : "secondary"}>{admission.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {admission.discharge_datetime
                        ? format(new Date(admission.discharge_datetime), "MMM d, yyyy")
                        : "Active"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No admissions recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
