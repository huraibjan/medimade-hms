"use client";

import { Hospital, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RoleNav } from "@/components/layout/role-nav";
import { ROLE_LABELS } from "@/lib/constants/rbac";
import { initials } from "@/lib/utils";
import type { Profile } from "@/types/database";

export function MobileSidebar({
  profile,
  hospitalName
}: {
  profile: Profile;
  hospitalName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="lg:hidden" variant="outline" size="icon" aria-label="Open navigation" onClick={() => setOpen(true)}>
        <Menu className="h-4 w-4" />
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/40"
            type="button"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(22rem,calc(100vw-2rem))] flex-col border-r bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Hospital className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Medimade HMS</p>
                  <p className="truncate text-xs text-muted-foreground">{hospitalName}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close navigation" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <RoleNav compact role={profile.role} onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t p-4">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-sm font-semibold text-accent-foreground">
                  {initials(profile.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{profile.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[profile.role]}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
