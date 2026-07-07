import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, FlaskConical, HeartPulse, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import type { PatientProfile } from "@/lib/services/patient-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function fullName(profile: PatientProfile) {
  return `${profile.patient.first_name} ${profile.patient.last_name}`;
}

export function PatientProfileCard({ profile }: { profile: PatientProfile }) {
  const { patient } = profile;
  const primaryContact = profile.emergency_contacts.find((contact) => contact.is_primary) ?? profile.emergency_contacts[0];
  const primaryInsurance = profile.insurance.find((insurance) => insurance.is_primary) ?? profile.insurance[0];
  const activeAdmission = profile.admissions.find((admission) => admission.status === "admitted");

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{fullName(profile)}</CardTitle>
              <CardDescription>MRN {patient.mrn}</CardDescription>
            </div>
            <Badge variant={patient.computed_status === "admitted" ? "warning" : "success"}>
              {patient.computed_status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Info icon={CalendarDays} label="Date of birth" value={format(new Date(patient.date_of_birth), "MMM d, yyyy")} />
          <Info icon={UserRound} label="Gender" value={patient.gender} />
          <Info icon={HeartPulse} label="Blood group" value={patient.blood_group ?? "Unknown"} />
          <Info icon={Phone} label="Phone" value={patient.phone ?? "Not recorded"} />
          <Info icon={Mail} label="Email" value={patient.email ?? "Not recorded"} />
          <Info icon={MapPin} label="Address" value={[patient.address_line1, patient.city, patient.state].filter(Boolean).join(", ") || "Not recorded"} />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Emergency contact</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {primaryContact ? (
              <div className="space-y-1">
                <p className="font-medium">{primaryContact.full_name}</p>
                <p className="text-muted-foreground">{primaryContact.relationship}</p>
                <p>{primaryContact.phone}</p>
                {primaryContact.email ? <p className="text-muted-foreground">{primaryContact.email}</p> : null}
              </div>
            ) : (
              <p className="text-muted-foreground">No emergency contact recorded.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insurance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {primaryInsurance ? (
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {primaryInsurance.insurance_providers?.name ?? "Insurance provider"}
                </p>
                <p>Policy {primaryInsurance.policy_number}</p>
                <p className="text-muted-foreground">Subscriber: {primaryInsurance.subscriber_name ?? fullName(profile)}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No insurance policy recorded.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active admission</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {activeAdmission ? (
              <div className="space-y-1">
                <p className="font-medium">{activeAdmission.reason ?? "Current admission"}</p>
                <p className="text-muted-foreground">
                  Admitted {format(new Date(activeAdmission.admission_datetime ?? activeAdmission.created_at ?? new Date()), "MMM d, yyyy h:mm a")}
                </p>
                {activeAdmission.diagnosis_summary ? <p>{activeAdmission.diagnosis_summary}</p> : null}
              </div>
            ) : (
              <p className="text-muted-foreground">No active admission.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Lab history</CardTitle>
          <CardDescription>Recent lab orders and result status.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {profile.lab_orders.length ? (
            profile.lab_orders.slice(0, 4).map((order) => (
              <div key={order.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-medium">
                    <FlaskConical className="h-4 w-4 text-primary" />
                    {order.priority} lab order
                  </p>
                  <Badge variant="outline">{order.status}</Badge>
                </div>
                <p className="mt-2 text-muted-foreground">
                  {order.lab_order_items?.map((item) => item.lab_tests?.test_name).filter(Boolean).join(", ") || "Tests pending"}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No lab orders recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-md border p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium capitalize">{value}</p>
      </div>
    </div>
  );
}
