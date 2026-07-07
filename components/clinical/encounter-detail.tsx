import { format } from "date-fns";
import { completeEncounterAction } from "@/lib/actions/clinical-actions";
import type { EncounterDetail as EncounterDetailType } from "@/lib/services/encounters";
import { ClinicalNotesEditor } from "@/components/clinical/clinical-notes-editor";
import { DiagnosisForm } from "@/components/clinical/diagnosis-form";
import { EncounterTimeline } from "@/components/clinical/encounter-timeline";
import { TreatmentPlanForm } from "@/components/clinical/treatment-plan-form";
import { VitalsForm } from "@/components/clinical/vitals-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function EncounterDetail({
  encounter,
  hospitalId,
  actorProfileId
}: {
  encounter: EncounterDetailType;
  hospitalId: string;
  actorProfileId?: string | null;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{encounter.chief_complaint ?? "Clinical encounter"}</CardTitle>
                <CardDescription>
                  {encounter.patients ? `${encounter.patients.first_name} ${encounter.patients.last_name} - ${encounter.patients.mrn}` : encounter.patient_id}
                </CardDescription>
              </div>
              <Badge variant={encounter.status === "completed" ? "success" : "warning"}>{encounter.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Info label="Type" value={encounter.encounter_type} />
            <Info label="Started" value={format(new Date(encounter.started_at), "MMM d, yyyy h:mm a")} />
            <Info label="Appointment" value={encounter.appointment_id ?? "Not linked"} />
            <Info label="Admission" value={encounter.admission_id ?? "Not linked"} />
            {encounter.status !== "completed" ? (
              <form action={async () => {
                "use server";
                await completeEncounterAction(encounter.id, hospitalId, encounter.patient_id, actorProfileId);
              }}>
                <Button type="submit">Complete encounter</Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clinical notes</CardTitle>
            <CardDescription>Chief complaint, doctor notes, and nurse notes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ClinicalNotesEditor encounterId={encounter.id} hospitalId={hospitalId} patientId={encounter.patient_id} chiefComplaint={encounter.chief_complaint} actorProfileId={actorProfileId} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Vitals</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <VitalsForm hospitalId={hospitalId} patientId={encounter.patient_id} encounterId={encounter.id} actorProfileId={actorProfileId} />
            {(encounter.vitals ?? []).map((vital) => (
              <div key={vital.id} className="rounded-md border p-3 text-sm">
                BP {vital.blood_pressure_systolic ?? "-"} / {vital.blood_pressure_diastolic ?? "-"} - Pulse {vital.pulse ?? "-"}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Diagnosis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <DiagnosisForm hospitalId={hospitalId} patientId={encounter.patient_id} encounterId={encounter.id} doctorId={encounter.doctor_id} />
            {(encounter.diagnoses ?? []).map((diagnosis) => (
              <div key={diagnosis.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{diagnosis.diagnosis_name}</p>
                <p className="text-muted-foreground">{diagnosis.diagnosis_code ?? "No code"} {diagnosis.is_primary ? "- primary" : ""}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Treatment plan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <TreatmentPlanForm hospitalId={hospitalId} patientId={encounter.patient_id} encounterId={encounter.id} doctorId={encounter.doctor_id} />
            {(encounter.treatment_plans ?? []).map((plan) => (
              <div key={plan.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{plan.plan_title}</p>
                <p className="text-muted-foreground">{plan.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Encounter timeline</CardTitle>
          <CardDescription>Vitals, diagnoses, plans, linked prescriptions, and lab orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <EncounterTimeline events={encounter.timeline} />
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}
