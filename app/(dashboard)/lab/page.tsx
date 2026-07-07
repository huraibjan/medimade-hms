import { FlaskConical, Microscope, Plus, TestTube2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { CriticalResultsCard } from "@/components/lab/critical-results-card";
import { PageTitle } from "@/components/layout/page-title";
import { RoleActionButton } from "@/components/layout/role-action-button";
import { LabOrderTable } from "@/components/tables/lab-order-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getLabSummary, listCriticalResults, listLabOrders } from "@/lib/services/lab";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function LabPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [summary, orders, critical] = await Promise.all([
    getLabSummary(hospitalId),
    listLabOrders(hospitalId),
    listCriticalResults(hospitalId)
  ]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Laboratory"
        description="Lab catalog, specimen workflow, result entry, critical alerts, and encounter-linked orders."
        actions={
          <>
            <Button variant="outline" asChild><Link href="/lab/tests"><FlaskConical className="h-4 w-4" />Tests</Link></Button>
            <RoleActionButton role={profile?.role} permission="lab:order" href="/lab/orders" icon={Plus}>
              New order
            </RoleActionButton>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <LabStat icon={TestTube2} title="Pending collection" value={summary.pending.toString()} />
        <LabStat icon={Microscope} title="Processing" value={summary.processing.toString()} />
        <LabStat icon={FlaskConical} title="Completed" value={summary.completed.toString()} />
        <LabStat icon={TriangleAlert} title="Critical results" value={summary.critical.toString()} />
      </div>
      <CriticalResultsCard results={critical} />
      <Card>
        <CardHeader>
          <CardTitle>Lab order queue</CardTitle>
          <CardDescription>Search by patient, MRN, order number, or doctor and filter by status.</CardDescription>
        </CardHeader>
        <CardContent>
          <LabOrderTable data={orders} />
        </CardContent>
      </Card>
    </div>
  );
}

function LabStat({ icon: Icon, title, value }: { icon: typeof FlaskConical; title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <CardDescription>{title}</CardDescription>
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
