import { Badge } from "@/components/ui/badge";
import type { AppointmentStatusValue } from "@/lib/validations/appointment";

function variant(status: AppointmentStatusValue) {
  if (status === "completed") return "success";
  if (status === "cancelled" || status === "no_show") return "danger";
  if (status === "checked_in" || status === "in_progress") return "warning";
  return "secondary";
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatusValue }) {
  return <Badge variant={variant(status)}>{status.replaceAll("_", " ")}</Badge>;
}
