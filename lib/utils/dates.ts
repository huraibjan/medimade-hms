import { format, formatDistanceToNow } from "date-fns";

export function formatDate(value: string | Date, pattern = "MMM d, yyyy") {
  return format(new Date(value), pattern);
}

export function timeAgo(value: string | Date) {
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}
