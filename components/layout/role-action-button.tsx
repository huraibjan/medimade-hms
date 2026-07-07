import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { UserRole } from "@/types/database";
import { can } from "@/lib/constants/rbac";
import { Button, type ButtonProps } from "@/components/ui/button";

export function RoleActionButton({
  role,
  permission,
  href,
  icon: Icon,
  children,
  variant = "default"
}: {
  role?: UserRole | null;
  permission: string;
  href: string;
  icon?: LucideIcon;
  children: ReactNode;
  variant?: ButtonProps["variant"];
}) {
  if (!can(role ?? undefined, permission)) return null;

  return (
    <Button asChild variant={variant}>
      <Link href={href as Route}>
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {children}
      </Link>
    </Button>
  );
}
