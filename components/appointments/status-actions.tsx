"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateAppointmentStatusAction } from "@/lib/actions/appointment-actions";
import type { AppointmentRecord } from "@/lib/services/appointments";
import { toast } from "@/lib/toast";
import type { AppointmentStatusValue } from "@/lib/validations/appointment";
import { ConfirmDialog } from "@/components/modals/confirm-dialog";
import { Button } from "@/components/ui/button";

export function AppointmentStatusActions({
  appointment,
  hospitalId,
  actorProfileId
}: {
  appointment: AppointmentRecord;
  hospitalId: string;
  actorProfileId?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateStatus(status: AppointmentStatusValue) {
    const cancellationReason = status === "cancelled" ? "Cancelled from appointment detail" : undefined;
    startTransition(async () => {
      const result = await updateAppointmentStatusAction(appointment.id, hospitalId, {
        status,
        cancellation_reason: cancellationReason,
        create_encounter: status === "in_progress"
      }, actorProfileId);
      if (result.ok) {
        toast.success("Appointment updated", result.message);
        router.refresh();
      } else {
        toast.error("Appointment update failed", result.message);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {appointment.status === "scheduled" ? <Button variant="outline" onClick={() => updateStatus("checked_in")} disabled={isPending}>Check in</Button> : null}
      {appointment.status === "checked_in" ? <Button variant="outline" onClick={() => updateStatus("in_progress")} disabled={isPending}>Start encounter</Button> : null}
      {appointment.status === "in_progress" ? <Button variant="outline" onClick={() => updateStatus("completed")} disabled={isPending}>Complete</Button> : null}
      {["scheduled", "checked_in"].includes(appointment.status) ? <Button variant="outline" onClick={() => updateStatus("no_show")} disabled={isPending}>No-show</Button> : null}
      {["scheduled", "checked_in"].includes(appointment.status) ? (
        <ConfirmDialog
          title="Cancel appointment?"
          description="This marks the visit as cancelled and keeps the audit trail intact."
          confirmLabel="Cancel appointment"
          destructive
          disabled={isPending}
          onConfirm={() => updateStatus("cancelled")}
          trigger={<Button variant="destructive" disabled={isPending}>Cancel</Button>}
        />
      ) : null}
      {isPending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
    </div>
  );
}
