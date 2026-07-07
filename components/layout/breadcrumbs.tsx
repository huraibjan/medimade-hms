"use client";

import Link from "next/link";
import type { Route } from "next";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function segmentLabel(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className={cn("flex min-w-0 items-center gap-1 text-xs text-muted-foreground", className)} aria-label="Breadcrumb">
      <Link className="inline-flex items-center gap-1 hover:text-foreground" href={"/dashboard" as Route}>
        <Home className="h-3.5 w-3.5" />
        Overview
      </Link>
      {segments[0] === "dashboard"
        ? null
        : segments.map((segment, index) => {
            const href = `/${segments.slice(0, index + 1).join("/")}` as Route;
            const current = index === segments.length - 1;
            return (
              <span key={href} className="inline-flex min-w-0 items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                {current ? (
                  <span className="truncate text-foreground">{segmentLabel(segment)}</span>
                ) : (
                  <Link className="truncate hover:text-foreground" href={href}>
                    {segmentLabel(segment)}
                  </Link>
                )}
              </span>
            );
          })}
    </nav>
  );
}
