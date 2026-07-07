import { format } from "date-fns";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/layout/page-title";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getPatientProfile } from "@/lib/services/patients";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

type PageProps = { params: Promise<{ id: string }> };

export default async function PatientPrescriptionsPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const data = await getPatientProfile(id, profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageTitle title="Prescription history" description={`${data.patient.first_name} ${data.patient.last_name} - ${data.patient.mrn}`} />
      <div className="grid gap-4">
        {data.prescriptions.length ? (
          data.prescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Prescription</CardTitle>
                    <CardDescription>{format(new Date(prescription.prescribed_at), "MMM d, yyyy h:mm a")}</CardDescription>
                  </div>
                  <Badge variant="outline">{prescription.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {prescription.prescription_items?.map((item) => (
                  <div key={item.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">
                      {item.medications?.name ?? "Medication"} {item.medications?.strength ?? ""}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {item.dosage} - {item.frequency} - {item.route ?? "route not specified"} - {item.duration ?? "duration not specified"}
                    </p>
                    {item.instructions ? <p className="mt-2">{item.instructions}</p> : null}
                  </div>
                ))}
                {prescription.notes ? <p className="text-sm text-muted-foreground">{prescription.notes}</p> : null}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">No prescriptions recorded.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
