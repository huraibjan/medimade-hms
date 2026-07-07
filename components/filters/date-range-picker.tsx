"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function DateRangePicker({ className }: { className?: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <div className={cn("flex w-full flex-col gap-2 rounded-lg border bg-white p-2 sm:w-auto sm:flex-row sm:items-center", className)}>
      <div className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
        <CalendarDays className="h-4 w-4 text-primary" />
        Range
      </div>
      <Input aria-label="From date" className="h-8 sm:w-36" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
      <Input aria-label="To date" className="h-8 sm:w-36" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
    </div>
  );
}
