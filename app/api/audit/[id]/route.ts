import { apiError, apiSuccess } from "@/lib/api/response";
import { getAuditLog } from "@/lib/services/audit";
import { requireServiceContext, toApiError } from "@/lib/services/service-context";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { hospitalId } = await requireServiceContext("audit:read");
    const data = await getAuditLog(id, hospitalId);
    if (!data) return apiError("Audit log not found", 404);
    return apiSuccess(data);
  } catch (error) {
    const failure = toApiError(error);
    return apiError(failure.error, failure.status, failure.details);
  }
}
