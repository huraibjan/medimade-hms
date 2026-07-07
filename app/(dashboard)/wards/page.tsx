import { WardOccupancyGrid } from "@/components/cards/room-occupancy-grid";
import { PageTitle } from "@/components/layout/page-title";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listWards } from "@/lib/services/rooms";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function WardsPage() {
  const profile = await getCurrentProfile();
  const wards = await listWards(profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);
  return (
    <div className="space-y-6">
      <PageTitle title="Wards" description="Ward occupancy and bed availability across floors." />
      <Card>
        <CardHeader>
          <CardTitle>Ward occupancy</CardTitle>
          <CardDescription>Occupancy rollups by ward, floor, and department.</CardDescription>
        </CardHeader>
        <CardContent>
          <WardOccupancyGrid wards={wards} />
        </CardContent>
      </Card>
    </div>
  );
}
