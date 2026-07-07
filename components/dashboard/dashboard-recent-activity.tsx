import { formatDistanceToNow } from "date-fns";
import type { RecentActivity } from "@/lib/services/reports";
import { Badge } from "@/components/ui/badge";

export function DashboardRecentActivity({ data }: { data: RecentActivity[] }) {
  if (!data.length) {
    return <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No recent activity.</p>;
  }

  return (
    <div className="divide-y rounded-md border">
      {data.map((item) => (
        <div key={item.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.detail}</p>
          </div>
          <div className="flex items-center gap-2">
            {item.status ? <Badge variant="secondary">{item.status}</Badge> : null}
            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.occurredAt), { addSuffix: true })}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
