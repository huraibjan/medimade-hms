"use client";

import { format, isSameDay } from "date-fns";
import type { AppointmentRecord } from "@/lib/services/appointments";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DoctorScheduleCalendar({
  appointments,
  date = new Date()
}: {
  appointments: AppointmentRecord[];
  date?: Date;
}) {
  const todaysAppointments = appointments.filter((appointment) => isSameDay(new Date(appointment.scheduled_start), date));
  const doctorNames = Array.from(new Set(todaysAppointments.map((appointment) => appointment.doctor?.full_name ?? appointment.doctor_id)));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {doctorNames.length ? doctorNames.map((doctorName) => {
        const doctorAppointments = todaysAppointments
          .filter((appointment) => (appointment.doctor?.full_name ?? appointment.doctor_id) === doctorName)
          .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());
        return (
          <Card key={doctorName}>
            <CardHeader>
              <CardTitle className="text-base">{doctorName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {doctorAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      {format(new Date(appointment.scheduled_start), "h:mm a")} - {format(new Date(appointment.scheduled_end), "h:mm a")}
                    </p>
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : appointment.patient_id}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{appointment.reason ?? "Consultation"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      }) : (
        <Card className="xl:col-span-2">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">No appointments scheduled for today.</CardContent>
        </Card>
      )}
    </div>
  );
}
