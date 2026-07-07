"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { assignBedAction } from "@/lib/actions/admission-actions";
import type { BedRecord } from "@/lib/services/rooms";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AssignBedModal({
  hospitalId,
  actorProfileId,
  admissionId,
  patientId,
  beds
}: {
  hospitalId: string;
  actorProfileId?: string | null;
  admissionId: string;
  patientId: string;
  beds: BedRecord[];
}) {
  const router = useRouter();
  const [bedId, setBedId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function assign() {
    startTransition(async () => {
      const result = await assignBedAction(hospitalId, { admission_id: admissionId, patient_id: patientId, bed_id: bedId }, actorProfileId);
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline">Assign bed</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign available bed</DialogTitle>
          <DialogDescription>Only available beds are shown. Occupied, reserved, and maintenance beds cannot be assigned.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Select value={bedId} onValueChange={setBedId}>
            <SelectTrigger><SelectValue placeholder="Select available bed" /></SelectTrigger>
            <SelectContent>
              {beds.map((bed) => (
                <SelectItem key={bed.id} value={bed.id}>
                  {bed.rooms?.wards?.name ?? "Ward"} / {bed.rooms?.room_number ?? "Room"} / Bed {bed.bed_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <div className="flex justify-end gap-2">
            <Button disabled={!bedId || isPending} onClick={assign}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Assign bed
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
