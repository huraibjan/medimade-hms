"use client";

import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/constants/rbac";
import { cn, initials } from "@/lib/utils";
import type { Profile } from "@/types/database";

export function UserProfileDropdown({
  profile,
  logoutAction
}: {
  profile: Profile;
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        className="h-10 gap-2 px-2"
        variant="outline"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
          {initials(profile.full_name)}
        </span>
        <span className="hidden max-w-32 truncate text-left text-sm md:inline">{profile.full_name}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </Button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-md border bg-white p-2 shadow-lg" role="menu">
          <div className="border-b px-3 py-2">
            <p className="truncate text-sm font-medium">{profile.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
            <p className="mt-1 text-xs text-primary">{ROLE_LABELS[profile.role]}</p>
          </div>
          <Link
            className="mt-2 flex h-9 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted"
            href="/settings"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <Settings className="h-4 w-4" />
            Account settings
          </Link>
          <Link
            className="flex h-9 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted"
            href="/staff"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <UserRound className="h-4 w-4" />
            Staff profile
          </Link>
          <form action={logoutAction}>
            <button
              className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-destructive hover:bg-destructive/10"
              role="menuitem"
              type="submit"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
