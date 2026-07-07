import { BedStatusCard } from "@/components/cards/bed-status-card";
import { PageTitle } from "@/components/layout/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { getOccupancySummary, listBeds } from "@/lib/services/rooms";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function BedsPage() {
  const profile = await getCurrentProfile();
  const hospitalId = profile?.hospital_id ?? DEFAULT_HOSPITAL_ID;
  const [beds, summary] = await Promise.all([listBeds(hospitalId), getOccupancySummary(hospitalId)]);

  return (
    <div className="space-y-6">
      <PageTitle title="Beds" description="Bed status, patient occupancy, cleaning, maintenance, and reservations." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Available" value={summary.available} />
        <Metric label="Occupied" value={summary.occupied} />
        <Metric label="Maintenance" value={summary.maintenance} />
        <Metric label="Reserved" value={summary.reserved} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bed status board</CardTitle>
          <CardDescription>Only available beds can be assigned during admission or transfer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {beds.map((bed) => <BedStatusCard key={bed.id} bed={bed} />)}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
