import { Bed, UserRound } from "lucide-react";
import type { BedRecord } from "@/lib/services/rooms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function variant(status: string) {
  if (status === "available") return "success";
  if (status === "occupied") return "warning";
  if (status === "maintenance") return "danger";
  return "secondary";
}

export function BedStatusCard({ bed }: { bed: BedRecord }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Bed className="h-4 w-4 text-primary" />
            {bed.rooms?.room_number ?? "Room"} - Bed {bed.bed_number}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {bed.rooms?.wards?.name ?? "Ward"} / {bed.rooms?.room_type?.replaceAll("_", " ") ?? "room"}
          </p>
          {bed.current_patient_id ? (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" />
              Patient {bed.current_patient_id}
            </p>
          ) : null}
        </div>
        <Badge variant={variant(bed.status)}>{bed.status}</Badge>
      </CardContent>
    </Card>
  );
}
