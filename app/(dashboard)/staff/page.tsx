import { ShieldPlus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/layout/page-title";
import { RoleActionButton } from "@/components/layout/role-action-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listStaff } from "@/lib/services/staff";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function StaffPage() {
  const profile = await getCurrentProfile();
  const data = await listStaff(profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Staff management"
        description="Doctors, nurses, technicians, pharmacists, billing staff, and access roles."
        actions={<RoleActionButton role={profile?.role} permission="staff:manage" href="/staff/new" icon={ShieldPlus}>Invite staff</RoleActionButton>}
      />
      <Card>
        <CardHeader>
          <CardTitle>Hospital workforce</CardTitle>
          <CardDescription>Role-aware staff directory with department assignments and status tracking.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.profiles?.full_name ?? "Staff member"}</TableCell>
                    <TableCell>{member.profiles?.email ?? "No email"}</TableCell>
                    <TableCell><Badge>{member.profiles?.role?.replaceAll("_", " ") ?? member.staff_type ?? "staff"}</Badge></TableCell>
                    <TableCell>{member.departments?.name ?? "Unassigned"}</TableCell>
                    <TableCell><Badge variant={member.status === "active" ? "success" : "secondary"}>{member.status ?? "active"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No staff members found" description="Invite staff to assign operational roles and department coverage." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
