"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types/database";
import { getNavigationForRole } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export function RoleNav({
  role,
  onNavigate,
  compact = false
}: {
  role: UserRole;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {getNavigationForRole(role).map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href as Route}
            onClick={onNavigate}
            className={cn(
              "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-secondary hover:text-secondary-foreground",
              isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              compact && "h-11"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
