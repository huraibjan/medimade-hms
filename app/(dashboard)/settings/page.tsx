import { Building2, CreditCard, Database, LockKeyhole, Settings2, ShieldCheck } from "lucide-react";
import { PageTitle } from "@/components/layout/page-title";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile, getHospitalName } from "@/lib/services/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const settings = [
  {
    title: "Hospital profile",
    description: "Legal identity, address, contact details, departments, and operational preferences.",
    icon: Building2,
    status: "Configured"
  },
  {
    title: "Roles and permissions",
    description: "Role-based navigation, API guards, server actions, and hospital-scoped authorization.",
    icon: ShieldCheck,
    status: "Active"
  },
  {
    title: "Supabase security",
    description: "Auth, Row Level Security, audit logging, and tenant isolation policies.",
    icon: LockKeyhole,
    status: "Required"
  },
  {
    title: "Storage buckets",
    description: "Private patient documents, lab reports, staff documents, and invoice storage.",
    icon: Database,
    status: "Ready"
  },
  {
    title: "Billing defaults",
    description: "Invoice statuses, payment methods, tax, discount, and outstanding balance workflows.",
    icon: CreditCard,
    status: "Ready"
  }
];

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  const hospitalName = await getHospitalName(profile?.hospital_id);

  return (
    <div className="space-y-6">
      <PageTitle title="Settings" description="Hospital workspace settings, security posture, and deployment readiness." />
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{hospitalName}</CardTitle>
              <CardDescription>{profile?.full_name ?? "Administrator"} manages this workspace with {profile?.role?.replaceAll("_", " ") ?? "role-based"} access.</CardDescription>
            </div>
            <Badge variant={hasSupabaseEnv() ? "success" : "warning"}>{hasSupabaseEnv() ? "Supabase connected" : "Demo mode"}</Badge>
          </div>
        </CardHeader>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settings.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-50 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <Badge variant="secondary">{item.status}</Badge>
              </div>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
        <Card>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-50 text-primary">
              <Settings2 className="h-5 w-5" />
            </div>
            <CardTitle>Administration workflow</CardTitle>
            <CardDescription>Use staff, departments, rooms, wards, beds, inventory, lab, billing, and reports modules to manage operational settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Sensitive changes should be made through guarded server actions or Supabase migrations so audit logs and RLS remain intact.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
