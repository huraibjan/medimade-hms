import "server-only";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";
import { can } from "@/lib/utils/permissions";
import { getCurrentProfile, type AuthProfile } from "./auth";
import { currentProfile as demoProfile } from "./mock-data";

export class ServiceError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
    this.details = details;
  }
}

export type ServiceContext = {
  profile: AuthProfile;
  hospitalId: string;
  supabase: ReturnType<typeof asQueryClient>;
};

export async function requireServiceContext(permission?: string | string[]): Promise<ServiceContext> {
  const profile = await getCurrentProfile();
  if (!profile?.hospital_id) throw new ServiceError("Unauthorized", 401);
  const allowed = Array.isArray(permission)
    ? permission.some((item) => can(profile.role, item))
    : permission
      ? can(profile.role, permission)
      : true;
  if (!allowed) throw new ServiceError("Forbidden", 403);

  const supabase = asQueryClient(await createServerSupabaseClient());
  return { profile, hospitalId: profile.hospital_id, supabase };
}

export type ActionGuard =
  | { ok: true; profile: AuthProfile; hospitalId: string }
  | { ok: false; message: string };

/**
 * Server-action equivalent of requireServiceContext: derives the actor and
 * hospital from the session instead of trusting client-supplied values, and
 * returns a result object rather than throwing. In demo mode (no Supabase env)
 * it uses the built-in demo admin profile so validation flows keep working.
 */
export async function guardAction(permission?: string | string[]): Promise<ActionGuard> {
  const hasPermission = (profile: AuthProfile) => {
    if (!permission) return true;
    return Array.isArray(permission)
      ? permission.some((item) => can(profile.role, item))
      : can(profile.role, permission);
  };

  if (!hasSupabaseEnv()) {
    if (!hasPermission(demoProfile)) {
      return { ok: false, message: "You do not have permission to perform this action." };
    }
    return { ok: true, profile: demoProfile, hospitalId: demoProfile.hospital_id ?? DEFAULT_HOSPITAL_ID };
  }

  const profile = await getCurrentProfile();
  if (!profile?.hospital_id) {
    return { ok: false, message: "You must be signed in to perform this action." };
  }
  if (!hasPermission(profile)) {
    return { ok: false, message: "You do not have permission to perform this action." };
  }
  return { ok: true, profile, hospitalId: profile.hospital_id };
}

export async function writeAuditLog({
  hospitalId,
  action,
  entityType,
  entityId,
  values,
  actorProfileId
}: {
  hospitalId: string;
  action: string;
  entityType: string;
  entityId: string;
  values?: Record<string, unknown>;
  actorProfileId?: string | null;
}) {
  if (!hasSupabaseEnv()) return;
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { error } = await supabase.from("audit_logs").insert({
    hospital_id: hospitalId,
    actor_profile_id: actorProfileId ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    new_values: values ?? null
  });
  if (error) {
    // Audit failures must not break the business operation, but they should be visible.
    console.error(`Audit log write failed for ${action} (${entityType}/${entityId}): ${error.message}`);
  }
}

export function toApiError(error: unknown) {
  if (error instanceof ServiceError) {
    return { error: error.message, status: error.status, details: error.details };
  }
  if (error instanceof Error) {
    return { error: error.message, status: 500, details: undefined };
  }
  return { error: "Unexpected server error", status: 500, details: undefined };
}
