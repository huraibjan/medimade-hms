"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { transferBedAction } from "@/lib/actions/admission-actions";
import type { BedRecord } from "@/lib/services/rooms";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TransferBedModal({
  hospitalId,
  actorProfileId,
  admissionId,
  patientId,
  fromBedId,
  beds
}: {
  hospitalId: string;
  actorProfileId?: string | null;
  admissionId: string;
  patientId: string;
  fromBedId?: string | null;
  beds: BedRecord[];
}) {
  const router = useRouter();
  const [bedId, setBedId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function transfer() {
    startTransition(async () => {
      const result = await transferBedAction(hospitalId, {
        admission_id: admissionId,
        patient_id: patientId,
        from_bed_id: fromBedId,
        to_bed_id: bedId
      }, actorProfileId);
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline">Transfer bed</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer patient</DialogTitle>
          <DialogDescription>The current bed will be released and the selected available bed will become occupied.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Select value={bedId} onValueChange={setBedId}>
            <SelectTrigger><SelectValue placeholder="Select destination bed" /></SelectTrigger>
            <SelectContent>
              {beds.map((bed) => (
                <SelectItem key={bed.id} value={bed.id}>
                  {bed.rooms?.wards?.name ?? "Ward"} / {bed.rooms?.room_number ?? "Room"} / Bed {bed.bed_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <div className="flex justify-end">
            <Button disabled={!bedId || isPending} onClick={transfer}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Transfer patient
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
