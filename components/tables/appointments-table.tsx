"use client";

import { format, isSameDay } from "date-fns";
import { Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState, useTransition } from "react";
import { updateAppointmentStatusAction } from "@/lib/actions/appointment-actions";
import type { AppointmentRecord } from "@/lib/services/appointments";
import { toast } from "@/lib/toast";
import { appointmentStatuses, type AppointmentStatusValue } from "@/lib/validations/appointment";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/modals/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const allValue = "all";

export function AppointmentsTable({
  data,
  hospitalId,
  actorProfileId
}: {
  data: AppointmentRecord[];
  hospitalId: string;
  actorProfileId?: string | null;
}) {
  const [doctor, setDoctor] = useState(allValue);
  const [department, setDepartment] = useState(allValue);
  const [status, setStatus] = useState(allValue);
  const [date, setDate] = useState("");
  const [isPending, startTransition] = useTransition();

  const options = useMemo(() => ({
    doctors: Array.from(new Set(data.map((appointment) => appointment.doctor?.full_name ?? appointment.doctor_id))).sort(),
    departments: Array.from(new Set(data.map((appointment) => appointment.department?.name).filter(Boolean) as string[])).sort()
  }), [data]);

  const filtered = useMemo(() => data.filter((appointment) => {
    return (
      (doctor === allValue || (appointment.doctor?.full_name ?? appointment.doctor_id) === doctor) &&
      (department === allValue || appointment.department?.name === department) &&
      (status === allValue || appointment.status === status) &&
      (!date || isSameDay(new Date(appointment.scheduled_start), new Date(date)))
    );
  }), [data, date, department, doctor, status]);

  function setAppointmentStatus(appointmentId: string, nextStatus: AppointmentStatusValue) {
    const cancellationReason = nextStatus === "cancelled" ? "Cancelled from appointment schedule" : undefined;
    startTransition(async () => {
      const result = await updateAppointmentStatusAction(appointmentId, hospitalId, {
        status: nextStatus,
        cancellation_reason: cancellationReason,
        create_encounter: nextStatus === "in_progress"
      }, actorProfileId);
      if (result.ok) toast.success("Appointment updated", result.message);
      else toast.error("Appointment update failed", result.message);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[repeat(4,minmax(10rem,1fr))]">
        <Filter value={doctor} onValueChange={setDoctor} label="Doctor" values={options.doctors} />
        <Filter value={department} onValueChange={setDepartment} label="Department" values={options.departments} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={allValue}>All statuses</SelectItem>
            {appointmentStatuses.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Workflow</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length ? filtered.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>
                  <p className="font-medium">{format(new Date(appointment.scheduled_start), "MMM d, h:mm a")}</p>
                  <p className="text-xs text-muted-foreground">to {format(new Date(appointment.scheduled_end), "h:mm a")}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : appointment.patient_id}</p>
                  <p className="text-xs text-muted-foreground">{appointment.patient?.mrn}</p>
                </TableCell>
                <TableCell>{appointment.doctor?.full_name ?? appointment.doctor_id}</TableCell>
                <TableCell>{appointment.department?.name ?? "Unassigned"}</TableCell>
                <TableCell><AppointmentStatusBadge status={appointment.status} /></TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button asChild variant="outline" size="icon" aria-label="View appointment">
                      <Link href={`/appointments/${appointment.id}` as Route}><Eye className="h-4 w-4" /></Link>
                    </Button>
                    {appointment.status === "scheduled" ? <Button size="sm" variant="outline" disabled={isPending} onClick={() => setAppointmentStatus(appointment.id, "checked_in")}>Check in</Button> : null}
                    {appointment.status === "checked_in" ? <Button size="sm" variant="outline" disabled={isPending} onClick={() => setAppointmentStatus(appointment.id, "in_progress")}>In progress</Button> : null}
                    {appointment.status === "in_progress" ? <Button size="sm" variant="outline" disabled={isPending} onClick={() => setAppointmentStatus(appointment.id, "completed")}>Complete</Button> : null}
                    {["scheduled", "checked_in"].includes(appointment.status) ? <Button size="sm" variant="outline" disabled={isPending} onClick={() => setAppointmentStatus(appointment.id, "no_show")}>No-show</Button> : null}
                    {["scheduled", "checked_in"].includes(appointment.status) ? (
                      <ConfirmDialog
                        title="Cancel appointment?"
                        description="This will mark the visit as cancelled and keep the appointment in the patient history."
                        confirmLabel="Cancel appointment"
                        destructive
                        disabled={isPending}
                        onConfirm={() => setAppointmentStatus(appointment.id, "cancelled")}
                        trigger={<Button size="sm" variant="destructive" disabled={isPending}>Cancel</Button>}
                      />
                    ) : null}
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin self-center text-muted-foreground" /> : null}
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="p-6">
                  <EmptyState title="No appointments found" description="Adjust doctor, department, date, or status filters." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Filter({ label, value, values, onValueChange }: { label: string; value: string; values: string[]; onValueChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={allValue}>All {label.toLowerCase()}</SelectItem>
        {values.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
