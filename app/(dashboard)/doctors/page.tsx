import { Stethoscope, UserPlus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageTitle } from "@/components/layout/page-title";
import { RoleActionButton } from "@/components/layout/role-action-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listStaff } from "@/lib/services/staff";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function DoctorsPage() {
  const profile = await getCurrentProfile();
  const staff = await listStaff(profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);
  const doctors = staff.filter((member) => member.profiles?.role === "doctor" || member.staff_type === "doctor" || member.job_title?.toLowerCase().includes("doctor"));

  return (
    <div className="space-y-6">
      <PageTitle
        title="Doctors"
        description="Doctor directory, department assignment, specialties, and clinical availability."
        actions={<RoleActionButton role={profile?.role} permission="staff:manage" href="/staff/new" icon={UserPlus}>Add doctor</RoleActionButton>}
      />
      <Card>
        <CardHeader>
          <CardTitle>Doctor directory</CardTitle>
          <CardDescription>Clinicians available for appointments, encounters, admissions, and lab orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {doctors.length ? (
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
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">{doctor.profiles?.full_name ?? "Doctor"}</TableCell>
                    <TableCell>{doctor.departments?.name ?? "Unassigned"}</TableCell>
                    <TableCell>
                      <p>{doctor.profiles?.email ?? "No email"}</p>
                      <p className="text-xs text-muted-foreground">{doctor.phone ?? doctor.profiles?.phone ?? "No phone"}</p>
                    </TableCell>
                    <TableCell><Badge variant={doctor.status === "active" ? "success" : "secondary"}>{doctor.status ?? "active"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={Stethoscope} title="No doctors found" description="Doctor staff profiles will appear here after they are created." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
