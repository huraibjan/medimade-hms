import { randomUUID } from "crypto";
import { createAdminSupabaseClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import { staffSchema, type StaffInput } from "@/lib/validations/staff";
import { staff as mockStaff } from "./mock-data";
import { writeAuditLog } from "./service-context";

export type StaffRecord = {
  id: string;
  hospital_id: string;
  profile_id?: string | null;
  employee_code?: string | null;
  employee_no?: string | null;
  job_title?: string | null;
  staff_type?: string | null;
  department_id?: string | null;
  phone?: string | null;
  status?: string;
  created_at?: string;
  deleted_at?: string | null;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    phone?: string | null;
  } | null;
  departments?: {
    id: string;
    name: string;
  } | null;
};

function normalizeStaff(row: Partial<StaffRecord>): StaffRecord {
  return {
    id: row.id ?? randomUUID(),
    hospital_id: row.hospital_id ?? DEFAULT_HOSPITAL_ID,
    profile_id: row.profile_id ?? row.profiles?.id ?? null,
    employee_code: row.employee_code ?? row.employee_no ?? null,
    employee_no: row.employee_no ?? row.employee_code ?? null,
    job_title: row.job_title ?? row.staff_type ?? row.profiles?.role ?? "Staff",
    staff_type: row.staff_type ?? row.job_title ?? row.profiles?.role ?? "staff",
    department_id: row.department_id ?? null,
    phone: row.phone ?? row.profiles?.phone ?? null,
    status: row.status ?? "active",
    created_at: row.created_at ?? new Date().toISOString(),
    deleted_at: row.deleted_at ?? null,
    profiles: row.profiles ?? {
      id: row.profile_id ?? row.id ?? randomUUID(),
      full_name: (row as { full_name?: string }).full_name ?? "Staff Member",
      email: (row as { email?: string }).email ?? "staff@example.com",
      role: (row as { role?: string }).role ?? "receptionist",
      phone: row.phone ?? null
    },
    departments: row.departments ?? null
  };
}

export async function listStaff(hospitalId?: string | null): Promise<StaffRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockStaff.map((record) => normalizeStaff(record as Partial<StaffRecord>));

  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<StaffRecord>("staff")
    .select("*, profiles(id,full_name,email,role,phone), departments(id,name)")
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeStaff);
}

export async function getStaff(id: string, hospitalId?: string | null) {
  const rows = await listStaff(hospitalId);
  return rows.find((row) => row.id === id || row.profile_id === id) ?? null;
}

export async function createStaff(hospitalId: string, values: StaffInput, actorProfileId?: string | null) {
  const parsed = staffSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix staff details." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Staff record validated. Connect Supabase to persist records.", staffId: "staff-1001" };
  if (!hasServiceRoleKey()) {
    return {
      ok: false,
      message: "Staff creation requires SUPABASE_SERVICE_ROLE_KEY to be configured so a login account can be provisioned."
    };
  }

  // Profiles require an auth.users row, so provision the login first with the
  // service-role client. The invited staff member sets their own password via
  // the "Forgot password" flow.
  const admin = createAdminSupabaseClient();
  const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    email_confirm: true,
    password: randomUUID(),
    user_metadata: { full_name: parsed.data.full_name }
  });
  if (authError || !createdUser?.user) {
    return { ok: false, message: authError?.message ?? "Unable to create the staff login account." };
  }

  const adminQuery = asQueryClient(admin);
  const profileId = randomUUID();
  const staffId = randomUUID();
  const profile = {
    id: profileId,
    auth_user_id: createdUser.user.id,
    hospital_id: hospitalId,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    role: parsed.data.role,
    phone: parsed.data.phone || null,
    is_active: true
  };
  const profileInsert = await adminQuery.from("profiles").insert(profile);
  if (profileInsert.error) {
    await admin.auth.admin.deleteUser(createdUser.user.id);
    return { ok: false, message: profileInsert.error.message };
  }

  const staff = {
    id: staffId,
    profile_id: profileId,
    hospital_id: hospitalId,
    department_id: parsed.data.department_id || null,
    employee_code: `EMP-${Date.now().toString().slice(-6)}`,
    job_title: parsed.data.role.replaceAll("_", " "),
    status: "active"
  };
  const staffInsert = await adminQuery.from("staff").insert(staff);
  if (staffInsert.error) {
    await adminQuery.from("profiles").update({ is_active: false }).eq("id", profileId);
    return { ok: false, message: staffInsert.error.message };
  }
  await writeAuditLog({ hospitalId, action: "staff.created", entityType: "staff", entityId: staffId, values: { staff, profile }, actorProfileId });
  return {
    ok: true,
    message: "Staff member created. Ask them to set a password via the login page's Forgot password link.",
    staffId
  };
}

export async function updateStaff(id: string, hospitalId: string, values: StaffInput, actorProfileId?: string | null) {
  const parsed = staffSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please fix staff details." };
  const existing = await getStaff(id, hospitalId);
  if (!existing) return { ok: false, message: "Staff member not found." };
  if (!hasSupabaseEnv()) return { ok: true, message: "Staff changes validated. Connect Supabase to persist records." };

  const supabase = asQueryClient(await createServerSupabaseClient());
  const profileUpdate = {
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    role: parsed.data.role,
    phone: parsed.data.phone || null,
    updated_at: new Date().toISOString()
  };
  if (existing.profile_id) {
    const update = await supabase.from("profiles").update(profileUpdate).eq("hospital_id", hospitalId).eq("id", existing.profile_id);
    if (update.error) return { ok: false, message: update.error.message };
  }
  const staffUpdate = {
    department_id: parsed.data.department_id || null,
    job_title: parsed.data.role.replaceAll("_", " "),
    updated_at: new Date().toISOString()
  };
  const update = await supabase.from("staff").update(staffUpdate).eq("hospital_id", hospitalId).eq("id", id);
  if (update.error) return { ok: false, message: update.error.message };
  await writeAuditLog({ hospitalId, action: "staff.updated", entityType: "staff", entityId: id, values: { staffUpdate, profileUpdate, actorProfileId } });
  return { ok: true, message: "Staff member updated." };
}

export async function softDeleteStaff(id: string, hospitalId: string, actorProfileId?: string | null) {
  if (!hasSupabaseEnv()) return { ok: true, message: "Staff deletion validated. Connect Supabase to persist records." };
  const supabase = asQueryClient(await createServerSupabaseClient());
  const payload = { deleted_at: new Date().toISOString(), status: "terminated" };
  const { error } = await supabase.from("staff").update(payload).eq("hospital_id", hospitalId).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await writeAuditLog({ hospitalId, action: "staff.deleted", entityType: "staff", entityId: id, values: { ...payload, actorProfileId } });
  return { ok: true, message: "Staff member deactivated." };
}
