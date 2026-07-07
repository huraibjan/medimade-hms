import { Plus } from "lucide-react";
import { PageTitle } from "@/components/layout/page-title";
import { RoleActionButton } from "@/components/layout/role-action-button";
import { PatientsTable } from "@/components/tables/patients-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listPatients } from "@/lib/services/patient-service";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function PatientsPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const data = await listPatients(hospitalId);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Patients"
        description="Search, filter, register, edit, and archive patient records."
        actions={
          <RoleActionButton role={profile?.role} permission="patients:manage" href="/patients/new" icon={Plus}>
            New patient
          </RoleActionButton>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Patient registry</CardTitle>
          <CardDescription>Search by MRN, name, phone, or email and filter by demographics or admission status.</CardDescription>
        </CardHeader>
        <CardContent>
          <PatientsTable data={data} hospitalId={hospitalId} />
        </CardContent>
      </Card>
    </div>
  );
}
