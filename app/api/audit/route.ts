import { applyListParams, parseListParams } from "@/lib/api/list";
import { apiError, apiSuccess } from "@/lib/api/response";
import { listAuditLogs } from "@/lib/services/audit";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";

export async function GET(request: Request) {
  try {
    const { hospitalId } = await requireServiceContext("audit:read");
    const rows = await listAuditLogs(hospitalId);
    const params = parseListParams(request, ["action", "entity_type"]);
    const data = applyListParams(rows, params, {
      searchFields: ["action", "entity_type", "entity_id"],
      sortFields: ["created_at", "action", "entity_type"],
      defaultSort: "created_at"
    });

    return apiSuccess(data.items, { meta: data });
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
