import { Bed, DoorOpen, Plus, UserCheck } from "lucide-react";
import { AdmissionsTable } from "@/components/tables/admissions-table";
import { PageTitle } from "@/components/layout/page-title";
import { RoleActionButton } from "@/components/layout/role-action-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listAdmissions } from "@/lib/services/admissions";
import { getOccupancySummary } from "@/lib/services/rooms";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function AdmissionsPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [admissions, occupancy] = await Promise.all([
    listAdmissions(hospitalId),
    getOccupancySummary(hospitalId)
  ]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Admissions and bed allocation"
        description="Admit patients, assign beds, transfer rooms, and discharge safely."
        actions={
          <RoleActionButton role={profile?.role} permission="admissions:create" href="/admissions/new" icon={Plus}>
            New admission
          </RoleActionButton>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={UserCheck} title="Active admissions" value={admissions.filter((admission) => admission.status !== "discharged").length.toString()} />
        <Stat icon={DoorOpen} title="Available beds" value={occupancy.available.toString()} />
        <Stat icon={Bed} title="Occupied beds" value={occupancy.occupied.toString()} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Admission registry</CardTitle>
          <CardDescription>Current and historical admissions with active bed assignment status.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdmissionsTable data={admissions} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, title, value }: { icon: typeof Bed; title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <CardDescription>{title}</CardDescription>
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
