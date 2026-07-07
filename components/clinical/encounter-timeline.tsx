import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { EncounterTimelineItem } from "@/lib/services/encounters";

export function EncounterTimeline({ events }: { events: EncounterTimelineItem[] }) {
  if (!events.length) return <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No encounter events recorded.</p>;

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="rounded-md border p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{event.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
            </div>
            {event.status ? <Badge variant="outline">{event.status}</Badge> : null}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{format(new Date(event.date), "MMM d, yyyy h:mm a")}</p>
        </div>
      ))}
    </div>
  );
}
