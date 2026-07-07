import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/services/auth";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { UserProfileDropdown } from "@/components/layout/user-profile-dropdown";
import type { Profile } from "@/types/database";

export function Topbar({
  profile,
  hospitalName
}: {
  profile: Profile;
  hospitalName: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="flex min-h-16 items-center gap-3">
        <MobileSidebar hospitalName={hospitalName} profile={profile} />
        <div className="hidden min-w-0 flex-1 lg:block">
          <Breadcrumbs />
          <p className="mt-1 truncate text-sm font-medium text-slate-950">{hospitalName}</p>
        </div>
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="border-slate-200 bg-slate-50/80 pl-9" placeholder="Search patients, staff, invoices..." />
        </div>
        <Button variant="outline" size="icon" aria-label="Notifications" className="relative bg-white">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal-500" />
        </Button>
        <UserProfileDropdown logoutAction={logoutAction} profile={profile} />
      </div>
    </header>
  );
}
