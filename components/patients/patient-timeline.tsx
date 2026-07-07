import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { TimelineEvent } from "@/lib/services/patient-service";

export function PatientTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        No clinical or administrative timeline events have been recorded.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="relative rounded-md border bg-card p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">{event.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {event.status ? <Badge variant="outline">{event.status.replaceAll("_", " ")}</Badge> : null}
              <Badge>{event.type}</Badge>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{format(new Date(event.date), "MMM d, yyyy h:mm a")}</p>
        </div>
      ))}
    </div>
  );
}
