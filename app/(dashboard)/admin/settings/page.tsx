import { Building2, Database, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getHospitalProfile } from "@/lib/services/hospital-service";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  const hospital = await getHospitalProfile(profile?.hospital_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin settings</h1>
        <p className="text-sm text-muted-foreground">Hospital profile, departments, RBAC, storage buckets, integrations, and audit settings.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Hospital profile</CardTitle>
            <CardDescription>{hospital.name}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {hospital.address}, {hospital.city}, {hospital.state} {hospital.postal_code}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Access control</CardTitle>
            <CardDescription>Supabase Auth plus RLS policies for each role.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Storage</CardTitle>
            <CardDescription>Patient documents, lab reports, staff docs, and invoices.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
