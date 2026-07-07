import { StaffForm } from "@/components/forms/staff-form";
import { PageTitle } from "@/components/layout/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewStaffPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="New staff member" description="Create a staff profile and assign role-based access." />
      <Card>
        <CardHeader>
          <CardTitle>Staff profile</CardTitle>
          <CardDescription>Role, contact details, and optional department assignment.</CardDescription>
        </CardHeader>
        <CardContent>
          <StaffForm />
        </CardContent>
      </Card>
    </div>
  );
}
