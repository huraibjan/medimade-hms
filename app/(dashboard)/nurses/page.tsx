import { Syringe, UserPlus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/layout/page-title";
import { RoleActionButton } from "@/components/layout/role-action-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listStaff } from "@/lib/services/staff";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function NursesPage() {
  const profile = await getCurrentProfile();
  const staff = await listStaff(profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);
  const nurses = staff.filter((member) => member.profiles?.role === "nurse" || member.staff_type === "nurse" || member.job_title?.toLowerCase().includes("nurse"));

  return (
    <div className="space-y-6">
      <PageTitle
        title="Nurses"
        description="Nursing staff, ward assignment, vitals workflow, and patient-care coverage."
        actions={<RoleActionButton role={profile?.role} permission="staff:manage" href="/staff/new" icon={UserPlus}>Add nurse</RoleActionButton>}
      />
      <Card>
        <CardHeader>
          <CardTitle>Nursing directory</CardTitle>
          <CardDescription>Nurses available for admitted patient care, vitals, and nursing notes.</CardDescription>
        </CardHeader>
        <CardContent>
          {nurses.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nurses.map((nurse) => (
                  <TableRow key={nurse.id}>
                    <TableCell className="font-medium">{nurse.profiles?.full_name ?? "Nurse"}</TableCell>
                    <TableCell>{nurse.departments?.name ?? "Unassigned"}</TableCell>
                    <TableCell>
                      <p>{nurse.profiles?.email ?? "No email"}</p>
                      <p className="text-xs text-muted-foreground">{nurse.phone ?? nurse.profiles?.phone ?? "No phone"}</p>
                    </TableCell>
                    <TableCell><Badge variant={nurse.status === "active" ? "success" : "secondary"}>{nurse.status ?? "active"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={Syringe} title="No nurses found" description="Nurse staff profiles will appear here after they are created." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
