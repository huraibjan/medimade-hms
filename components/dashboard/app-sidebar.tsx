import { Hospital } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants/rbac";
import { RoleNav } from "@/components/layout/role-nav";
import { initials } from "@/lib/utils";
import type { Profile } from "@/types/database";

export function AppSidebar({
  profile,
  hospitalName
}: {
  profile: Profile;
  hospitalName: string;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r bg-white/95 backdrop-blur lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-soft">
          <Hospital className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Medimade HMS</p>
          <p className="truncate text-xs text-muted-foreground">{hospitalName}</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <RoleNav role={profile.role} />
      </div>
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg border bg-gradient-to-br from-cyan-50 to-teal-50 p-3">
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
  );
}
