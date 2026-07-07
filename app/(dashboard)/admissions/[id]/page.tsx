import { format } from "date-fns";
import { notFound } from "next/navigation";
import { AssignBedModal } from "@/components/modals/assign-bed-modal";
import { DischargePatientModal } from "@/components/modals/discharge-patient-modal";
import { TransferBedModal } from "@/components/modals/transfer-bed-modal";
import { PageTitle } from "@/components/layout/page-title";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getAdmission } from "@/lib/services/admissions";
import { listAvailableBeds } from "@/lib/services/rooms";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdmissionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [admission, availableBeds] = await Promise.all([
    getAdmission(id, hospitalId),
    listAvailableBeds(hospitalId)
  ]);
  if (!admission) notFound();

  const activeAllocation = admission.bed_allocations?.find((allocation) => !allocation.released_at);
  const patientName = admission.patient ? `${admission.patient.first_name} ${admission.patient.last_name}` : admission.patient_id;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Admission detail"
        description={`${patientName} - ${admission.reason}`}
        actions={
          <>
            {!activeAllocation && admission.status !== "discharged" ? (
              <AssignBedModal hospitalId={hospitalId} actorProfileId={profile?.id} admissionId={admission.id} patientId={admission.patient_id} beds={availableBeds} />
            ) : null}
            {activeAllocation && admission.status !== "discharged" ? (
              <TransferBedModal hospitalId={hospitalId} actorProfileId={profile?.id} admissionId={admission.id} patientId={admission.patient_id} fromBedId={activeAllocation.bed_id} beds={availableBeds} />
            ) : null}
            {admission.status !== "discharged" ? (
              <DischargePatientModal hospitalId={hospitalId} actorProfileId={profile?.id} admissionId={admission.id} />
            ) : null}
          </>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Clinical admission</CardTitle>
            <CardDescription>Assigned doctor, department, dates, and discharge status.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Patient" value={patientName} />
            <Info label="Status" value={admission.status} badge />
            <Info label="Admitted" value={format(new Date(admission.admission_datetime ?? admission.created_at), "MMM d, yyyy h:mm a")} />
            <Info label="Expected discharge" value={admission.expected_discharge_datetime ? format(new Date(admission.expected_discharge_datetime), "MMM d, yyyy h:mm a") : "Not set"} />
            <Info label="Reason" value={admission.reason} />
            <Info label="Diagnosis" value={admission.diagnosis_summary ?? "Not recorded"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current bed</CardTitle>
            <CardDescription>Active bed allocation for this admission.</CardDescription>
          </CardHeader>
          <CardContent>
            {activeAllocation ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium">Bed {activeAllocation.beds?.bed_number ?? activeAllocation.bed_id}</p>
                <p className="text-muted-foreground">
                  Allocated {format(new Date(activeAllocation.allocated_at), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active bed assigned.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bed allocation history</CardTitle>
          <CardDescription>Track admission timeline and all bed moves/releases.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(admission.bed_allocations ?? []).length ? admission.bed_allocations?.map((allocation) => (
            <div key={allocation.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">Bed {allocation.beds?.bed_number ?? allocation.bed_id}</p>
                <Badge variant={allocation.released_at ? "secondary" : "warning"}>{allocation.released_at ? "released" : "active"}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                Allocated {format(new Date(allocation.allocated_at), "MMM d, yyyy h:mm a")}
                {allocation.released_at ? `, released ${format(new Date(allocation.released_at), "MMM d, yyyy h:mm a")}` : ""}
              </p>
              {allocation.release_reason ? <p className="mt-1">{allocation.release_reason}</p> : null}
            </div>
          )) : <p className="text-sm text-muted-foreground">No bed allocations recorded.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {badge ? <Badge className="mt-1" variant="outline">{value}</Badge> : <p className="mt-1 font-medium">{value}</p>}
    </div>
  );
}
