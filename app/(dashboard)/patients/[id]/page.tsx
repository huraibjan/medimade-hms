import Link from "next/link";
import { notFound } from "next/navigation";
import { Edit3 } from "lucide-react";
import { PatientProfileCard } from "@/components/cards/patient-profile-card";
import { PatientForm } from "@/components/forms/patient-form";
import { PageTitle } from "@/components/layout/page-title";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { can } from "@/lib/constants/rbac";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getPatientProfile } from "@/lib/services/patients";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

type PageProps = { params: Promise<{ id: string }> };

export default async function PatientProfilePage({ params }: PageProps) {
  const { id } = await params;
  const currentProfile = await getCurrentProfile();
  const hospitalId = currentProfile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const profile = await getPatientProfile(id, hospitalId);
  if (!profile) notFound();

  const patientName = `${profile.patient.first_name} ${profile.patient.last_name}`;

  return (
    <div className="space-y-6">
      <PageTitle
        title={patientName}
        description={`Patient profile overview for ${profile.patient.mrn}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/patients/${id}/timeline`}>Timeline</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/patients/${id}/appointments`}>Appointments</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/patients/${id}/billing`}>Billing</Link>
            </Button>
            {can(currentProfile?.role, "patients:manage") ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button><Edit3 className="h-4 w-4" />Edit</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Edit patient</SheetTitle>
                    <SheetDescription>Update demographics, contact details, address, and clinical notes.</SheetDescription>
                  </SheetHeader>
                  <SheetBody>
                    <PatientForm patient={profile.patient} mode="edit" />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            ) : null}
          </>
        }
      />
      <PatientProfileCard profile={profile} />
    </div>
  );
}
