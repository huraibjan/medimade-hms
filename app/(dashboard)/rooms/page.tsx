import { BedDouble, Building2 } from "lucide-react";
import Link from "next/link";
import { RoomOccupancyGrid } from "@/components/cards/room-occupancy-grid";
import { PageTitle } from "@/components/layout/page-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/services/auth-service";
import { listRooms } from "@/lib/services/rooms";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export default async function RoomsPage() {
  const profile = await getCurrentProfile();
  const rooms = await listRooms(profile?.hospital_id ?? DEFAULT_HOSPITAL_ID);
  return (
    <div className="space-y-6">
      <PageTitle
        title="Rooms"
        description="Room types, occupancy, bed counts, and availability by ward."
        actions={
          <>
            <Button variant="outline" asChild><Link href="/wards"><Building2 className="h-4 w-4" />Wards</Link></Button>
            <Button variant="outline" asChild><Link href="/beds"><BedDouble className="h-4 w-4" />Beds</Link></Button>
          </>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Room occupancy</CardTitle>
          <CardDescription>General, private, semi-private, ICU, emergency, operating, and isolation rooms.</CardDescription>
        </CardHeader>
        <CardContent>
          <RoomOccupancyGrid rooms={rooms} />
        </CardContent>
      </Card>
    </div>
  );
}
