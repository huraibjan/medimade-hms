import { DoorOpen } from "lucide-react";
import type { RoomRecord, WardRecord } from "@/lib/services/rooms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function occupancyPercent(occupied = 0, total = 0) {
  if (!total) return 0;
  return Math.round((occupied / total) * 100);
}

export function RoomOccupancyGrid({ rooms }: { rooms: RoomRecord[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room) => {
        const percent = occupancyPercent(room.occupied_beds, room.total_beds);
        return (
          <Card key={room.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DoorOpen className="h-4 w-4 text-primary" />
                    {room.room_number}
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">{room.wards?.name ?? "Unassigned ward"}</p>
                </div>
                <Badge variant={room.status === "available" ? "success" : room.status === "maintenance" ? "danger" : "warning"}>
                  {room.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md bg-muted p-2"><p className="font-semibold">{room.total_beds ?? 0}</p><p>Total</p></div>
                <div className="rounded-md bg-amber-50 p-2 text-amber-700"><p className="font-semibold">{room.occupied_beds ?? 0}</p><p>Occupied</p></div>
                <div className="rounded-md bg-emerald-50 p-2 text-emerald-700"><p className="font-semibold">{room.available_beds ?? 0}</p><p>Open</p></div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function WardOccupancyGrid({ wards }: { wards: WardRecord[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {wards.map((ward) => {
        const percent = occupancyPercent(ward.occupied_beds, ward.total_beds);
        return (
          <Card key={ward.id}>
            <CardHeader>
              <CardTitle>{ward.name}</CardTitle>
              <p className="text-sm text-muted-foreground">Floor {ward.floor ?? "not set"} / {ward.department ?? "General"}</p>
            </CardHeader>
            <CardContent>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-sm text-muted-foreground">
                {ward.occupied_beds ?? 0} occupied, {ward.available_beds ?? 0} available, {ward.total_beds ?? 0} total beds
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
