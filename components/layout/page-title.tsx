import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageTitle({
  title,
  description,
  actions,
  className
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 rounded-lg border bg-white/80 p-4 shadow-soft sm:flex-row sm:items-end sm:justify-between md:p-5", className)}>
      <div className="min-w-0 border-l-4 border-primary pl-3">
        <h1 className="truncate text-2xl font-semibold tracking-normal text-slate-950">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
