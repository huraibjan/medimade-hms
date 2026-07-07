import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { getRoleHomePath } from "@/lib/utils/permissions";
import type { Profile, UserRole } from "@/types/database";

export type AuthProfile = Profile & {
  auth_user_id?: string | null;
  last_login_at?: string | null;
};

export async function getCurrentUser(): Promise<User | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Unable to load authenticated user", error.message);
    return null;
  }

  return user;
}

export async function getCurrentProfile(): Promise<AuthProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const queryClient = asQueryClient(supabase);
  const { data, error } = await queryClient
    .from<AuthProfile>("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .limit(1);

  if (error) {
    console.error("Unable to load profile", error.message);
    return null;
  }

  return data?.[0] ?? null;
}

export async function getHospitalName(hospitalId: string | null | undefined) {
  if (!hasSupabaseEnv() || !hospitalId) return "NorthBridge Medical Center";

  const supabase = await createServerSupabaseClient();
  const { data, error } = await asQueryClient(supabase)
    .from<{ name: string }>("hospitals")
    .select("name")
    .eq("id", hospitalId)
    .limit(1);

  if (error) {
    console.error("Unable to load hospital name", error.message);
    return "Medimade HMS";
  }

  return data?.[0]?.name ?? "Medimade HMS";
}

export async function getAuthenticatedLandingPath() {
  const profile = await getCurrentProfile();
  return getRoleHomePath(profile?.role);
}

export async function updateLastLogin(userId: string) {
  if (!hasSupabaseEnv()) return;

  const supabase = await createServerSupabaseClient();
  await asQueryClient(supabase)
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("auth_user_id", userId);
}

export async function logoutAction() {
  "use server";

  if (hasSupabaseEnv()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}

export function isPrivilegedRole(role: UserRole | null | undefined) {
  return role === "super_admin" || role === "hospital_admin";
}
