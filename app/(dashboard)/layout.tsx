import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { getCurrentProfile, getCurrentUser, getHospitalName } from "@/lib/services/auth";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/profile-required");
  const hospitalName = await getHospitalName(profile.hospital_id);

  return (
    <div className="dashboard-surface flex min-h-screen bg-background">
      <AppSidebar hospitalName={hospitalName} profile={profile} />
      <div className="min-w-0 flex-1">
        <Topbar hospitalName={hospitalName} profile={profile} />
        <main className="mx-auto w-full max-w-[1600px] p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
