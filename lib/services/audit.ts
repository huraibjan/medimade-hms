import { hasSupabaseEnv } from "@/lib/supabase/env";
import { asQueryClient } from "@/lib/supabase/query-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_HOSPITAL_ID } from "@/lib/utils/constants";

export type AuditRecord = {
  id: string;
  hospital_id?: string | null;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  new_values?: Record<string, unknown> | null;
  created_at: string;
};

const mockAuditLogs: AuditRecord[] = [
  {
    id: "audit-1",
    hospital_id: DEFAULT_HOSPITAL_ID,
    action: "patient.created",
    entity_type: "patient",
    entity_id: "p-1001",
    created_at: new Date().toISOString()
  }
];

export async function listAuditLogs(hospitalId?: string | null): Promise<AuditRecord[]> {
  if (!hasSupabaseEnv() || !hospitalId) return mockAuditLogs;
  const supabase = asQueryClient(await createServerSupabaseClient());
  const { data, error } = await supabase
    .from<AuditRecord>("audit_logs")
    .select("*")
    .eq("hospital_id", hospitalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAuditLog(id: string, hospitalId?: string | null) {
  const rows = await listAuditLogs(hospitalId);
  return rows.find((row) => row.id === id) ?? null;
}
