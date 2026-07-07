"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { dischargeAdmissionAction } from "@/lib/actions/admission-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DischargePatientModal({
  hospitalId,
  actorProfileId,
  admissionId
}: {
  hospitalId: string;
  actorProfileId?: string | null;
  admissionId: string;
}) {
  const router = useRouter();
  const [dischargeDatetime, setDischargeDatetime] = useState("");
  const [releaseReason, setReleaseReason] = useState("Discharged");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function discharge() {
    startTransition(async () => {
      const result = await dischargeAdmissionAction(hospitalId, {
        admission_id: admissionId,
        discharge_datetime: dischargeDatetime,
        release_reason: releaseReason
      }, actorProfileId);
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="destructive">Discharge patient</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discharge patient</DialogTitle>
          <DialogDescription>This updates the admission, releases the bed allocation, and marks the bed available.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Discharge date/time</Label>
            <Input type="datetime-local" value={dischargeDatetime} onChange={(event) => setDischargeDatetime(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Release reason</Label>
            <Textarea value={releaseReason} onChange={(event) => setReleaseReason(event.target.value)} />
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <div className="flex justify-end">
            <Button variant="destructive" disabled={isPending} onClick={discharge}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm discharge
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
